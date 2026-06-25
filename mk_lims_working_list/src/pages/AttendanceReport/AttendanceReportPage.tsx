import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Select,
    DatePicker,
    Pagination,
    message,
    ConfigProvider,
} from 'antd';
import {
    ReloadOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import zhCN from 'antd/es/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import * as XLSX from 'xlsx';
import type { TableColumnsType } from 'antd';
import type {AttendanceRecord, EmployeeSchedule} from '../../types';
import axios from 'axios';

const AttendanceReportPage: React.FC = () => {
    dayjs.locale('zh-cn');

    const { RangePicker } = DatePicker;

    // ===== 状态定义 =====
    const [department, setDepartment] = useState<string>('');
    const [team, setTeam] = useState<string>('');
    const [searchText, setSearchText] = useState<string>('');
    const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
    const [teamOptions, setTeamOptions] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [scheduleData, setScheduleData] = useState<any[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<[Dayjs, Dayjs] | null>([
        dayjs().startOf('month'),
        dayjs().startOf('month')
    ]);

    // ===== 控制请求的引用 =====
    const isMounted = useRef(true);
    const isFetchingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const paramsRef = useRef<any>(null);
    const filterChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ===== 禁用未来月份 =====
    const disabledFutureMonth = (current: Dayjs) => {
        return current && current > dayjs().endOf('month');
    };

    // ===== 构建查询参数 =====
    const buildQueryParams = useCallback((overrides?: any) => {
        const baseParams = {
            department: department.trim(),
            team: team.trim(),
            searchText: searchText.trim(),
            selectedMonth: selectedMonth,
            currentPage: currentPage,
            pageSize: pageSize,
        };
        return { ...baseParams, ...overrides };
    }, [department, team, searchText, selectedMonth, currentPage, pageSize]);

    // ===== 比较参数是否变化 =====
    const hasParamsChanged = useCallback((newParams: any, oldParams: any | null): boolean => {
        if (!oldParams) return true;
        return (
            newParams.department !== oldParams.department ||
            newParams.team !== oldParams.team ||
            newParams.searchText !== oldParams.searchText ||
            newParams.currentPage !== oldParams.currentPage ||
            newParams.pageSize !== oldParams.pageSize ||
            // 比较月份范围
            (newParams.selectedMonth?.[0]?.format('YYYYMM') !== oldParams.selectedMonth?.[0]?.format('YYYYMM')) ||
            (newParams.selectedMonth?.[1]?.format('YYYYMM') !== oldParams.selectedMonth?.[1]?.format('YYYYMM'))
        );
    }, []);

    // ===== 获取数据 =====
    const fetchData = useCallback(async (params?: any) => {
        // 防止并发请求
        if (isFetchingRef.current) {
            console.log('已有请求进行中，跳过');
            return;
        }

        // 取消之前的请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        isFetchingRef.current = true;
        setLoading(true);

        try {
            const queryParams = params || buildQueryParams();

            // 检查参数是否真的变化了（防止重复请求）
            if (!hasParamsChanged(queryParams, paramsRef.current)) {
                console.log('参数未变化，跳过请求');
                setLoading(false);
                isFetchingRef.current = false;
                return;
            }

            // 缓存当前参数
            paramsRef.current = queryParams;

            // 构建筛选参数
            const filters: any[] = [];

            if (queryParams.team) {
                filters.push({
                    key: "EMPLOYEE_NAME",
                    type: "like",
                    value: queryParams.team
                });
            }
            if (queryParams.department) {
                filters.push({
                    key: "DEPARTMENT_CODE",
                    type: "like",
                    value: queryParams.department
                });
            }
            if (queryParams.searchText) {
                filters.push({
                    key: "FD_COL_RHLUFZ",
                    type: "like",
                    value: queryParams.searchText
                });
            }

            // 处理月份参数
            let monthParam = null;
            if (queryParams.selectedMonth && queryParams.selectedMonth.length === 2) {
                monthParam = {
                    startMonth: queryParams.selectedMonth[0].format('YYYYMM'),
                    endMonth: queryParams.selectedMonth[1].format('YYYYMM')
                };
            }

            const response = await axios.post(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getAllList',
                {
                    size: queryParams.pageSize,
                    current: queryParams.currentPage - 1, // 后端从0开始
                    paramStr: monthParam,
                    parem: filters,
                },
                {
                    signal: controller.signal,
                }
            );

            if (!isMounted.current) return;

            if (response.status === 200) {
                const data = response.data.data;
                setScheduleData(data.data || []);
                setDepartmentOptions(data.departmentList || []);
                setTeamOptions(data.teamList || []);
                setPageCount(data.count || 0);

                // 只同步每页条数，不同步页码（避免页码+1问题）
                const backendSize = data.size || 10;
                if (backendSize !== pageSize) {
                    setPageSize(backendSize);
                    // 每页条数变化时重置到第一页
                    setCurrentPage(1);
                }
                // 不同步 current 页码，保持前端控制
            }
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
            isFetchingRef.current = false;
        }
    }, [buildQueryParams, hasParamsChanged, pageSize]);

    // ===== 处理月份变化 =====
    const handleMonthChange = useCallback((dates: [Dayjs, Dayjs] | null) => {
        if (dates && dates.length === 2) {
            const normalized: [Dayjs, Dayjs] = [
                dates[0].startOf('month'),
                dates[1].startOf('month')
            ];
            setSelectedMonth(normalized);
        } else {
            setSelectedMonth(null);
        }
        setCurrentPage(1);
    }, []);

    // ===== 处理重置 =====
    const handleReset = useCallback(() => {
        setDepartment('');
        setTeam('');
        setSearchText('');
        setSelectedMonth([
            dayjs().startOf('month'),
            dayjs().startOf('month')
        ]);
        setCurrentPage(1);
        // 重置后立即查询第一页
        setTimeout(() => {
            fetchData(buildQueryParams({ currentPage: 1 }));
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
                fetchData(buildQueryParams({ currentPage: 1, pageSize: size }));
            }, 0);
        } else if (page !== currentPage) {
            // 页码变化
            setCurrentPage(page);
            setTimeout(() => {
                fetchData(buildQueryParams({ currentPage: page }));
            }, 0);
        }
    }, [pageSize, currentPage, fetchData, buildQueryParams]);

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
            // 显式传递 currentPage: 1，确保查询从第一页开始
            fetchData(buildQueryParams({ currentPage: 1 }));
        }, 300);

        return () => {
            if (filterChangeTimerRef.current) {
                clearTimeout(filterChangeTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [department, team, searchText, selectedMonth]);

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

    // ===== 表格列定义 =====
    const columns: TableColumnsType<AttendanceRecord> = useMemo(() => [
        {
            title: '部门',
            dataIndex: 'department',
            key: 'department',
            width: 100,
            align: 'center',
        },
        {
            title: '班组',
            dataIndex: 'team',
            key: 'team',
            width: 80,
            align: 'center',
        },
        {
            title: '工号',
            dataIndex: 'employeeId',
            key: 'employeeId',
            width: 80,
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
            title: '标准工时',
            dataIndex: 'shouldWorkHours',
            key: 'shouldWorkHours',
            width: 130,
            align: 'center',
            render: (value: number) => (
                <span style={{ color: value >= 176 ? '#52c41a' : '#fa8c16', fontWeight: 500 }}>
                    {value}h
                </span>
            ),
        },
        {
            title: '实际出勤总工时',
            dataIndex: 'actualWorkHours',
            key: 'actualWorkHours',
            width: 130,
            align: 'center',
            render: (value: number) => (
                <span style={{ color: value >= 176 ? '#52c41a' : '#fa8c16', fontWeight: 500 }}>
                    {value}h
                </span>
            ),
        },
        {
            title: '差额',
            key: 'difference',
            width: 130,
            align: 'center',
            render: (_: unknown, record: AttendanceRecord) => {
                const diff = (record.shouldWorkHours || 0) - (record.actualWorkHours || 0);
                return (
                    <span style={{
                        color: diff >= 0 ? '#52c41a' : '#ff4d4f',
                        fontWeight: 500
                    }}>
                        {diff}h
                    </span>
                );
            },
        },
        {
            title: '平时加班数(h)',
            dataIndex: 'weekdayOvertime',
            key: 'weekdayOvertime',
            width: 120,
            align: 'center',
            render: (value: number) => (
                <span style={{ color: value > 0 ? '#1890ff' : '#595959' }}>
                    {value || 0}
                </span>
            ),
        },
        {
            title: '周末加班数(h)',
            dataIndex: 'weekendOvertime',
            key: 'weekendOvertime',
            width: 120,
            align: 'center',
            render: (value: number) => (
                <span style={{ color: value > 0 ? '#722ed1' : '#595959' }}>
                    {value || 0}
                </span>
            ),
        },
        {
            title: '节假日加班数(h)',
            dataIndex: 'holidayOvertime',
            key: 'holidayOvertime',
            width: 130,
            align: 'center',
            render: (value: number) => (
                <span style={{ color: value > 0 ? '#eb2f96' : '#595959' }}>
                    {value || 0}
                </span>
            ),
        },
        {
            title: '请假时间(h)',
            dataIndex: 'leaveHours',
            key: 'leaveHours',
            width: 110,
            align: 'center',
            render: (value: number) => (
                <span style={{ color: value > 0 ? '#ff4d4f' : '#595959', fontWeight: 500 }}>
                    {value || 0}h
                </span>
            ),
        },
    ], []);

    // ===== 导出 =====
    const handleExport = useCallback(async () => {
        if (pageCount === 0) {
            message.warning('暂无数据可导出');
            return;
        }

        setLoading(true);
        const hideLoading = message.loading('正在导出数据，请稍候...', 0);

        try {
            // 构建筛选条件
            const filters: any[] = [];

            const currentTeam = team.trim();
            const currentDepartment = department.trim();
            const currentSearchText = searchText.trim();
            const currentMonth = selectedMonth;

            if (currentTeam) {
                filters.push({
                    key: "EMPLOYEE_NAME",
                    type: "like",
                    value: currentTeam
                });
            }
            if (currentDepartment) {
                filters.push({
                    key: "DEPARTMENT_CODE",
                    type: "like",
                    value: currentDepartment
                });
            }
            if (currentSearchText) {
                filters.push({
                    key: "FD_COL_RHLUFZ",
                    type: "like",
                    value: currentSearchText
                });
            }

            // 处理月份参数
            let monthParam = null;
            if (currentMonth && currentMonth.length === 2) {
                monthParam = {
                    startMonth: currentMonth[0].format('YYYY-MM'),
                    endMonth: currentMonth[1].format('YYYY-MM')
                };
            }

            // 请求全部数据
            const response = await axios.post(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getAllList',
                {
                    size: pageCount,
                    current: 0,
                    paramStr: monthParam,
                    parem: filters,
                }
            );

            if (response.status === 200 && response.data?.data?.data) {
                const allData = response.data.data.data;

                if (allData.length === 0) {
                    message.warning('暂无数据可导出');
                    return;
                }

                // 准备导出数据
                const exportData = allData.map((item: any) => ({
                    '部门': item.department || '',
                    '班组': item.team || '',
                    '工号': item.employeeId || '',
                    '姓名': item.name || '',
                    '标准工时': item.shouldWorkHours ? `${item.shouldWorkHours}h` : '0h',
                    '实际出勤总工时': item.actualWorkHours ? `${item.actualWorkHours}h` : '0h',
                    '差额': item.shouldWorkHours && item.actualWorkHours
                        ? `${(item.shouldWorkHours - item.actualWorkHours).toFixed(1)}h`
                        : '0h',
                    '平时加班数(h)': item.weekdayOvertime || 0,
                    '周末加班数(h)': item.weekendOvertime || 0,
                    '节假日加班数(h)': item.holidayOvertime || 0,
                    '请假时间(h)': item.leaveHours ? `${item.leaveHours}h` : '0h',
                }));

                // 创建工作表
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                worksheet['!cols'] = [
                    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
                    { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
                    { wch: 18 }, { wch: 15 }
                ];

                const workbook = XLSX.utils.book_new();
                const fileName = `考勤报表_${dayjs().format('YYYY-MM-DD_HHmmss')}.xlsx`;
                XLSX.utils.book_append_sheet(workbook, worksheet, '考勤报表');
                XLSX.writeFile(workbook, fileName);

                hideLoading();
                message.success(`导出成功，共 ${allData.length} 条数据`);
            } else {
                throw new Error('导出数据获取失败');
            }
        } catch (error) {
            console.error('导出失败:', error);
            hideLoading();
            message.error('导出失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    }, [department, team, searchText, selectedMonth, pageCount]);

    return (
        <ConfigProvider locale={zhCN}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                {/* 导出按钮 */}
                <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    onClick={handleExport}
                    style={{
                        position: 'absolute',
                        right: 16,
                        top: 16,
                        zIndex: 1
                    }}
                >
                    导出
                </Button>

                {/* 筛选区 */}
                <Card
                    size="small"
                    style={{ borderRadius: 8 }}
                    styles={{ body: { padding: '16px 16px 8px' } }}
                >
                    <Space wrap size={12}>
                        <Space size={4}>
                            <span style={{ color: '#fff', background: '#1890ff', padding: '2px 8px', borderRadius: 4 }}>
                                统计月份
                            </span>
                            <RangePicker
                                picker="month"
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                allowClear={false}
                                locale={zhCN.RangePicker}
                                style={{ width: 240 }}
                                disabledDate={disabledFutureMonth}
                            />
                        </Space>

                        <Space size={4}>
                            <span style={{ color: '#fff', background: '#1890ff', padding: '2px 8px', borderRadius: 4 }}>
                                部门
                            </span>
                            <Select
                                value={department}
                                onChange={setDepartment}
                                options={departmentOptions}
                                style={{ width: 120 }}
                                placeholder="请选择"
                                allowClear
                            />
                        </Space>

                        <Space size={4}>
                            <span style={{ color: '#fff', background: '#1890ff', padding: '2px 8px', borderRadius: 4 }}>
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
                            <span style={{ color: '#fff', background: '#1890ff', padding: '2px 8px', borderRadius: 4 }}>
                                班组
                            </span>
                            <Select
                                value={searchText}
                                onChange={setSearchText}
                                options={teamOptions}
                                style={{ width: 120 }}
                                placeholder="请选择"
                                allowClear
                            />
                        </Space>

                        <Button icon={<ReloadOutlined />} onClick={handleReset}>
                            重置
                        </Button>

                        <div style={{ flex: 1 }} />
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                            注: 时间可自由选择,默认为本月
                        </span>
                    </Space>
                </Card>

                {/* 表格区 */}
                <Card
                    size="small"
                    style={{
                        borderRadius: 8,
                        margin: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    styles={{ body: { padding: 0 } }}
                >
                    <Table
                        columns={columns}
                        dataSource={scheduleData}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        bordered
                        loading={loading}
                        scroll={{ x: 'max-content', y: 'calc(100vh - 200px)' }}
                    />
                </Card>

                {/* 分页区 */}
                <Card
                    size="small"
                    style={{
                        borderRadius: 8,
                        backgroundColor: '#fff'
                    }}
                    styles={{ body: { padding: '8px 16px' } }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={pageCount}
                            onChange={handlePageChange}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total) => `共 ${total} 条`}
                        />
                        <span style={{ color: '#595959', fontSize: 13 }}>
                            共 {pageCount} 条
                        </span>
                    </div>
                </Card>
            </div>
        </ConfigProvider>
    );
};

export default AttendanceReportPage;