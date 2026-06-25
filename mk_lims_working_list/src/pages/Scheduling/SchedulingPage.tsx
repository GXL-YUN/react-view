import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Select,
    DatePicker,
    Tooltip,
    message,
    ConfigProvider,
    Pagination,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import zhCN from 'antd/es/locale/zh_CN';
import 'dayjs/locale/zh-cn';

dayjs.extend(isSameOrBefore);
dayjs.locale('zh-cn');

import type { TableColumnsType } from 'antd';
import Legend from '../../components/Legend/Legend';
import type { EmployeeSchedule, ScheduleType } from '../../types';
import axios from 'axios';

const { RangePicker } = DatePicker;

// ==================== 常量定义 ====================
const SCHEDULE_COLORS: Record<ScheduleType, string> = {
    day: '#52c41a',
    night: '#1890ff',
    dayCut: '#ff18be',
    fullDayOff: '#ff4d4f',
    halfDayOff: '#fa8c16',
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

// ==================== 工具函数 ====================
const getScheduleColor = (type?: ScheduleType): string => {
    if (!type) return 'transparent';
    return SCHEDULE_COLORS[type] || 'transparent';
};

// ==================== 类型定义 ====================
interface QueryParams {
    monthRange: [Dayjs, Dayjs] | null;
    department: string;
    team: string;
    searchText: string;
    page: number;
    pageSize: number;
}

interface ScheduleResponse {
    data: {
        data: EmployeeSchedule[];
        departmentList: Array<{ label: string; value: string }>;
        teamList: Array<{ label: string; value: string }>;
        size: number;
        current: number;
        count: number;
    };
}

// ==================== 自定义 Hook ====================
const useDebounce = <T,>(value: T, delay: number = 300): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

// ==================== 主组件 ====================
const SchedulingPage: React.FC = () => {
    // ===== 状态定义 =====
    const [monthRange, setMonthRange] = useState<[Dayjs, Dayjs] | null>([
        dayjs().startOf('month'),
        dayjs().startOf('month'),
    ]);
    const [department, setDepartment] = useState<string>('');
    const [team, setTeam] = useState<string>('');
    const [searchText, setSearchText] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [departmentOptions, setDepartmentOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [teamOptions, setTeamOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [scheduleData, setScheduleData] = useState<EmployeeSchedule[]>([]);

    // ===== Refs =====
    const isMounted = useRef<boolean>(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const paramsRef = useRef<QueryParams | null>(null);
    const isQueryingRef = useRef<boolean>(false);
    const filterChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ===== 防抖 =====
    const debouncedSearchText = useDebounce(searchText, 300);
    const debouncedTeam = useDebounce(team, 300);
    const debouncedDepartment = useDebounce(department, 300);

    // ===== 构建查询参数 =====
    const buildQueryParams = useCallback((overrides?: Partial<QueryParams>): QueryParams => ({
        monthRange,
        department: debouncedDepartment,
        team: debouncedTeam,
        searchText: debouncedSearchText,
        page: currentPage,
        pageSize,
        ...overrides,
    }), [monthRange, debouncedDepartment, debouncedTeam, debouncedSearchText, currentPage, pageSize]);

    // ===== 比较参数是否变化 =====
    const hasParamsChanged = useCallback((newParams: QueryParams, oldParams: QueryParams | null): boolean => {
        if (!oldParams) return true;
        return (
            newParams.page !== oldParams.page ||
            newParams.pageSize !== oldParams.pageSize ||
            newParams.department !== oldParams.department ||
            newParams.team !== oldParams.team ||
            newParams.searchText !== oldParams.searchText ||
            // 比较月份范围
            (newParams.monthRange?.[0]?.format('YYYYMM') !== oldParams.monthRange?.[0]?.format('YYYYMM')) ||
            (newParams.monthRange?.[1]?.format('YYYYMM') !== oldParams.monthRange?.[1]?.format('YYYYMM'))
        );
    }, []);

    // ===== 获取数据 =====
    const fetchData = useCallback(async (params?: QueryParams) => {
        // 防止并发请求
        if (isQueryingRef.current) {
            console.log('已有请求进行中，跳过');
            return;
        }

        // 取消之前的请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        isQueryingRef.current = true;

        setLoading(true);

        try {
            const queryParams = params || buildQueryParams();

            // 检查参数是否真的变化了（防止重复请求）
            if (!hasParamsChanged(queryParams, paramsRef.current)) {
                console.log('参数未变化，跳过请求');
                setLoading(false);
                isQueryingRef.current = false;
                return;
            }

            // 缓存当前参数
            paramsRef.current = queryParams;

            const filters: any[] = [];

            if (queryParams.team) {
                filters.push({ key: 'EMPLOYEE_NAME', type: 'like', value: queryParams.team });
            }
            if (queryParams.department) {
                filters.push({ key: 'DEPARTMENT_CODE', type: 'like', value: queryParams.department });
            }
            if (queryParams.searchText) {
                filters.push({ key: 'FD_COL_RHLUFZ', type: 'like', value: queryParams.searchText });
            }

            let monthParam = null;
            if (queryParams.monthRange) {
                monthParam = {
                    startMonth: queryParams.monthRange[0].format('YYYYMM'),
                    endMonth: queryParams.monthRange[1].format('YYYYMM'),
                };
            }

            const response = await axios.post<ScheduleResponse>(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getAllByYear',
                {
                    size: queryParams.pageSize,
                    current: queryParams.page - 1, // 后端从0开始
                    paramStr: monthParam,
                    parem: filters,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                }
            );

            if (!isMounted.current) return;

            const { data } = response.data;
            setScheduleData(data.data || []);
            setDepartmentOptions(data.departmentList || []);
            setTeamOptions(data.teamList || []);
            setTotalCount(data.count || 0);

            // 同步后端分页状态（只同步每页条数，不同步页码，避免混乱）
            const backendSize = data.size || DEFAULT_PAGE_SIZE;
            if (backendSize !== pageSize) {
                setPageSize(backendSize);
                // 每页条数变化时，重置到第一页
                setCurrentPage(1);
            }

            // 注意：不同步 current 页码，保持前端控制
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('请求已取消');
                return;
            }
            console.error('获取数据失败:', error);
            if (isMounted.current) {
                message.error('获取数据失败，请稍后重试');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
            isQueryingRef.current = false;
        }
    }, [buildQueryParams, hasParamsChanged, pageSize]);

    // ===== 处理月份区间变化 =====
    const handleMonthRangeChange = useCallback((dates: [Dayjs, Dayjs] | null) => {
        if (dates?.length === 2) {
            setMonthRange([dates[0].startOf('month'), dates[1].startOf('month')]);
        } else {
            setMonthRange(null);
        }
        setCurrentPage(1);
    }, []);

    // ===== 重置筛选条件 =====
    const handleReset = useCallback(() => {
        setDepartment('');
        setTeam('');
        setSearchText('');
        setCurrentPage(1);
        // 重置后立即查询第一页
        setTimeout(() => {
            fetchData(buildQueryParams({ page: 1 }));
        }, 0);
        message.info('已重置');
    }, [buildQueryParams, fetchData]);

    // ===== 处理分页变化 =====
    const handlePageChange = useCallback((page: number, size: number) => {
        if (size !== pageSize) {
            // 每页条数变化，重置到第一页
            setPageSize(size);
            setCurrentPage(1);
            setTimeout(() => {
                fetchData(buildQueryParams({ page: 1, pageSize: size }));
            }, 0);
        } else if (page !== currentPage) {
            // 页码变化
            setCurrentPage(page);
            setTimeout(() => {
                fetchData(buildQueryParams({ page }));
            }, 0);
        }
    }, [pageSize, currentPage, fetchData, buildQueryParams]);

    // ===== 禁用未来月份 =====
    const disabledFutureMonth = useCallback((current: Dayjs) => {
        return current && current > dayjs().endOf('month');
    }, []);

    // ===== 生成日期列 =====
    const dateColumns = useMemo(() => {
        const months: Dayjs[] = [];
        if (monthRange) {
            const start = monthRange[0];
            const end = monthRange[1];
            const monthDiff = end.diff(start, 'month');
            for (let i = 0; i <= monthDiff; i++) {
                months.push(start.add(i, 'month'));
            }
        } else {
            months.push(dayjs());
        }

        const columns: any[] = [];

        months.forEach((month, index) => {
            if (index > 0) {
                columns.push({
                    title: (
                        <div style={{
                            textAlign: 'center',
                            background: '#f0f0f0',
                            padding: '4px 0',
                            fontWeight: 'bold',
                            color: '#1890ff',
                        }}>
                            {month.format('YYYY年MM月')}
                        </div>
                    ),
                    key: `month_title_${index}`,
                    width: 80,
                    align: 'center' as const,
                    render: () => null,
                });
            }

            const daysInMonth = month.daysInMonth();
            for (let i = 1; i <= daysInMonth; i++) {
                const currentDate = month.date(i);
                const dateKey = currentDate.format('MM/DD');

                columns.push({
                    title: (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 12 }}>{currentDate.format('MM/DD')}</div>
                            <div style={{ fontSize: 10, color: '#8c8c8c' }}>
                                {currentDate.format('ddd')}
                            </div>
                        </div>
                    ),
                    key: `date_${month.format('YYYYMM')}_${i}`,
                    width: 60,
                    align: 'center' as const,
                    render: (_: unknown, record: EmployeeSchedule) => {
                        const schedule = record.schedules?.find(s => s?.date === dateKey);
                        const hasValidSchedule = schedule?.detail?.trim();

                        if (!hasValidSchedule) {
                            return <span style={{ color: '#d9d9d9' }}>-</span>;
                        }

                        const color = getScheduleColor(schedule.schedule?.type);
                        const tooltipContent = (
                            <div>
                                <div>工号: {record.employeeId} 姓名: {record.name}</div>
                                <div>部门: {record.department} 班组: {record.team}</div>
                                {schedule.detail && <div>{schedule.detail}</div>}
                            </div>
                        );

                        return (
                            <Tooltip title={tooltipContent} placement="top">
                                <div
                                    style={{
                                        background: color,
                                        color: 'white',
                                        padding: '2px 4px',
                                        borderRadius: 4,
                                        fontSize: 11,
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {schedule.schedule?.label || '排班'}
                                </div>
                            </Tooltip>
                        );
                    },
                });
            }
        });

        return columns;
    }, [monthRange]);

    // ===== 表格列定义 =====
    const columns: TableColumnsType<EmployeeSchedule> = useMemo(() => [
        {
            title: '部门',
            dataIndex: 'department',
            key: 'department',
            width: 80,
            fixed: 'left',
            align: 'center',
        },
        {
            title: '班组',
            dataIndex: 'team',
            key: 'team',
            width: 70,
            fixed: 'left',
            align: 'center',
        },
        {
            title: '工号',
            dataIndex: 'employeeId',
            key: 'employeeId',
            width: 70,
            fixed: 'left',
            align: 'center',
        },
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
            width: 70,
            fixed: 'left',
            align: 'center',
            render: (text: string, record: EmployeeSchedule) => {
                // 判断 position 是否为 "班组长"
                const isTeamLeader = record.position === '班组长';
                return (
                    <span style={{ color: isTeamLeader ? '#faad14' : 'inherit', fontWeight: isTeamLeader ? 'bold' : 'normal' }}>
                    {text}
                </span>
                );
            },
        },
        {
            title: '应出勤天数',
            dataIndex: 'requiredDays',
            key: 'requiredDays',
            width: 90,
            align: 'center',
        },
        {
            title: '实际出勤天数',
            dataIndex: 'actualDays',
            key: 'actualDays',
            width: 100,
            align: 'center',
        },
        ...dateColumns,
    ], [dateColumns]);

    // ===== 初始化数据获取 =====
    useEffect(() => {
        // 组件挂载时获取数据
        fetchData();

        return () => {
            isMounted.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (filterChangeTimerRef.current) {
                clearTimeout(filterChangeTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ===== 监听筛选条件变化（不包括分页） =====
    useEffect(() => {
        // 清除之前的定时器
        if (filterChangeTimerRef.current) {
            clearTimeout(filterChangeTimerRef.current);
        }

        // 筛选条件变化时重置到第一页
        setCurrentPage(1);

        // 防抖延迟查询
        filterChangeTimerRef.current = setTimeout(() => {
            // 显式传递 page: 1，确保查询从第一页开始
            fetchData(buildQueryParams({ page: 1 }));
        }, 300);

        return () => {
            if (filterChangeTimerRef.current) {
                clearTimeout(filterChangeTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthRange, debouncedDepartment, debouncedTeam, debouncedSearchText]);

    return (
        <ConfigProvider locale={zhCN}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 筛选区 */}
                <Card
                    size="small"
                    style={{
                        borderRadius: 8,
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        backgroundColor: '#fff',
                        margin: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                    styles={{ body: { padding: '16px 16px 8px' } }}
                >
                    <Space wrap size={12}>
                        <Space size={4}>
                            <span style={{
                                color: '#fff',
                                background: '#1890ff',
                                padding: '2px 8px',
                                borderRadius: 4
                            }}>
                                排班日期
                            </span>
                            <RangePicker
                                picker="month"
                                value={monthRange}
                                onChange={handleMonthRangeChange}
                                allowClear={false}
                                locale={zhCN.RangePicker}
                                style={{ width: 240 }}
                            />
                        </Space>

                        <Space size={4}>
                            <span style={{
                                color: '#fff',
                                background: '#1890ff',
                                padding: '2px 8px',
                                borderRadius: 4
                            }}>
                                部门
                            </span>
                            <Select
                                value={department}
                                onChange={setDepartment}
                                options={departmentOptions}
                                style={{ width: 120 }}
                                placeholder="请选择"
                                allowClear
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Space>

                        <Space size={4}>
                            <span style={{
                                color: '#fff',
                                background: '#1890ff',
                                padding: '2px 8px',
                                borderRadius: 4
                            }}>
                                姓名
                            </span>
                            <Input
                                value={team}
                                onChange={(e) => setTeam(e.target.value)}
                                placeholder="请输入"
                                style={{ width: 140 }}
                                allowClear
                            />
                        </Space>

                        <Space size={4}>
                            <span style={{
                                color: '#fff',
                                background: '#1890ff',
                                padding: '2px 8px',
                                borderRadius: 4
                            }}>
                                班组
                            </span>
                            <Select
                                value={searchText}
                                onChange={setSearchText}
                                options={teamOptions}
                                style={{ width: 120 }}
                                placeholder="请选择"
                                allowClear
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Space>

                        <Button onClick={handleReset}>重置</Button>

                        <div style={{ flex: 1 }} />
                        <Legend />
                    </Space>
                </Card>

                {/* 表格区 */}
                <Card
                    size="small"
                    style={{ borderRadius: 8, flex: 1, margin: '0 16px' }}
                    styles={{ body: { padding: 0 } }}
                >
                    <Table
                        columns={columns}
                        dataSource={scheduleData}
                        rowKey="id"
                        pagination={false}
                        sticky={{ offsetHeader: 80 }}
                        scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
                        size="small"
                        bordered
                        loading={loading}
                    />
                </Card>

                {/* 分页区 */}
                <Card
                    size="small"
                    style={{
                        borderRadius: 8,
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 100,
                        backgroundColor: '#fff',
                        margin: '0 16px 16px 16px',
                        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
                    }}
                    styles={{ body: { padding: '8px 16px' } }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={totalCount}
                            onChange={handlePageChange}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total) => `共 ${total} 条`}
                            pageSizeOptions={PAGE_SIZE_OPTIONS}
                        />
                        <span style={{ color: '#595959', fontSize: 13 }}>
                            共 {totalCount} 条
                        </span>
                    </div>
                </Card>
            </div>
        </ConfigProvider>
    );
};

export default SchedulingPage;