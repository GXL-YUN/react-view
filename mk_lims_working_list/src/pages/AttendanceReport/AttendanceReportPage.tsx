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
    Tooltip,
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
import type { AttendanceRecord, EmployeeSchedule } from '../../types';
import axios from 'axios';

const AttendanceReportPage: React.FC = () => {
    dayjs.locale('zh-cn');

    const { RangePicker } = DatePicker;

    // ===== 常量定义 =====
    const DEFAULT_PAGE_SIZE = 10;
    const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

    // ===== 状态定义 =====
    const [monthRange, setMonthRange] = useState<[Dayjs, Dayjs] | null>([
        dayjs().startOf('month'),
        dayjs().startOf('month'),
    ]);
    const [department, setDepartment] = useState<string>('');
    const [employeeName, setEmployeeName] = useState<string>('');
    const [team, setTeam] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [departmentOptions, setDepartmentOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [teamOptions, setTeamOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [scheduleData, setScheduleData] = useState<any[]>([]);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [isDepartmentRestricted, setIsDepartmentRestricted] = useState<boolean>(false);

    // 标记初始化状态
    const [isInitializing, setIsInitializing] = useState<boolean>(true);
    const [isBaseDataReady, setIsBaseDataReady] = useState<boolean>(false);

    // ===== Refs =====
    const isMounted = useRef<boolean>(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const paramsRef = useRef<any>(null);
    const isFetchingRef = useRef<boolean>(false);
    const filterChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 存储基础数据
    const baseDataRef = useRef<{
        userInfo: any;
        departmentList: Array<{ label: string; value: string }>;
        teamList: Array<{ label: string; value: string }>;
        matchedDeptValue: string | null;
        userName: string;
        isInitialized: boolean;
    }>({
        userInfo: null,
        departmentList: [],
        teamList: [],
        matchedDeptValue: null,
        userName: '',
        isInitialized: false,
    });

    // ===== 防抖 =====
    const useDebounce = <T,>(value: T, delay: number = 300): T => {
        const [debouncedValue, setDebouncedValue] = useState<T>(value);
        const timerRef = useRef<NodeJS.Timeout | null>(null);

        useEffect(() => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }
            };
        }, [value, delay]);

        return debouncedValue;
    };

    const debouncedEmployeeName = useDebounce(employeeName, 300);
    const debouncedTeam = useDebounce(team, 300);
    const debouncedDepartment = useDebounce(department, 300);

    // ===== 工具函数：匹配用户部门 =====
    const matchUserDepartment = useCallback((
        userDeptName: string,
        departmentList: Array<{ label: string; value: string }>
    ): string | null => {
        if (!userDeptName || !departmentList.length) return null;

        // 1. 精确匹配 label
        let matched = departmentList.find(dept => dept.label === userDeptName);
        if (matched) {
            console.log(`✅ 精确匹配(label): ${userDeptName} -> ${matched.value}`);
            return matched.value;
        }

        // 2. 精确匹配 value
        matched = departmentList.find(dept => dept.value === userDeptName);
        if (matched) {
            console.log(`✅ 精确匹配(value): ${userDeptName} -> ${matched.value}`);
            return matched.value;
        }

        // 3. 包含匹配
        matched = departmentList.find(dept =>
            dept.label?.includes(userDeptName) || userDeptName?.includes(dept.label)
        );
        if (matched) {
            console.log(`✅ 包含匹配: ${userDeptName} -> ${matched.value}`);
            return matched.value;
        }

        // 4. 忽略大小写匹配
        const lowerUserDept = userDeptName.toLowerCase();
        matched = departmentList.find(dept =>
            dept.label?.toLowerCase() === lowerUserDept ||
            dept.value?.toLowerCase() === lowerUserDept
        );
        if (matched) {
            console.log(`✅ 忽略大小写匹配: ${userDeptName} -> ${matched.value}`);
            return matched.value;
        }

        console.warn(`⚠️ 未找到匹配的部门: ${userDeptName}`);
        return null;
    }, []);

    // ===== 获取用户信息 =====
    const fetchUserInfo = useCallback(async (): Promise<any> => {
        try {
            console.log('📡 [步骤1/3] 开始获取用户信息...');
            const response = await axios.post(
                '/data/sys-auth/curUser',
                {},
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (!isMounted.current) return null;

            const userData = response.data?.data;
            if (userData) {
                setUserInfo(userData);
                baseDataRef.current.userInfo = userData;
                console.log('✅ [步骤1/3] 用户信息获取成功:', userData);
            }
            return userData;
        } catch (error) {
            console.error('❌ [步骤1/3] 获取用户信息失败:', error);
            throw error;
        }
    }, []);

    // ===== 获取部门列表 =====
    const fetchDepartmentList = useCallback(async (): Promise<Array<{ label: string; value: string }>> => {
        try {
            console.log('📡 [步骤2/3] 开始获取部门列表...');
            const response = await axios.post(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getDepartmentList',
                {},
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (!isMounted.current) return [];

            const deptList = response.data?.data?.data || [];
            if (Array.isArray(deptList) && deptList.length > 0) {
                setDepartmentOptions(deptList);
                baseDataRef.current.departmentList = deptList;
                console.log('✅ [步骤2/3] 部门列表获取成功，共', deptList.length, '条');
            } else {
                console.warn('⚠️ [步骤2/3] 部门列表为空或格式不正确');
                setDepartmentOptions([]);
                baseDataRef.current.departmentList = [];
            }
            return deptList;
        } catch (error) {
            console.error('❌ [步骤2/3] 获取部门列表失败:', error);
            setDepartmentOptions([]);
            baseDataRef.current.departmentList = [];
            throw error;
        }
    }, []);

    // ===== 获取班组列表 =====
    const fetchTeamList = useCallback(async (): Promise<Array<{ label: string; value: string }>> => {
        try {
            console.log('📡 [步骤3/3] 开始获取班组列表...');
            const response = await axios.post(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getTeamList',
                {},
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (!isMounted.current) return [];

            const teamList = response.data?.data?.data || [];
            if (Array.isArray(teamList) && teamList.length > 0) {
                setTeamOptions(teamList);
                baseDataRef.current.teamList = teamList;
                console.log('✅ [步骤3/3] 班组列表获取成功，共', teamList.length, '条');
            } else {
                console.warn('⚠️ [步骤3/3] 班组列表为空或格式不正确');
                setTeamOptions([]);
                baseDataRef.current.teamList = [];
            }
            return teamList;
        } catch (error) {
            console.error('❌ [步骤3/3] 获取班组列表失败:', error);
            setTeamOptions([]);
            baseDataRef.current.teamList = [];
            throw error;
        }
    }, []);

    // ===== 获取用户姓名 =====
    const getUserDisplayName = useCallback((userData: any): string => {
        if (!userData) return '';
        return userData.realName || userData.userName || userData.name || userData.nickname || '';
    }, []);

    // ===== 构建查询参数 =====
    const buildQueryParams = useCallback((overrides?: any) => {
        const baseParams = {
            monthRange: monthRange,
            department: department,
            employeeName: employeeName,
            team: team,
            page: currentPage,
            pageSize: pageSize,
        };
        return { ...baseParams, ...overrides };
    }, [monthRange, department, employeeName, team, currentPage, pageSize]);

    // ===== 比较参数是否变化 =====
    const hasParamsChanged = useCallback((newParams: any, oldParams: any | null): boolean => {
        if (!oldParams) return true;
        return (
            newParams.page !== oldParams.page ||
            newParams.pageSize !== oldParams.pageSize ||
            newParams.department !== oldParams.department ||
            newParams.employeeName !== oldParams.employeeName ||
            newParams.team !== oldParams.team ||
            (newParams.monthRange?.[0]?.format('YYYYMM') !== oldParams.monthRange?.[0]?.format('YYYYMM')) ||
            (newParams.monthRange?.[1]?.format('YYYYMM') !== oldParams.monthRange?.[1]?.format('YYYYMM'))
        );
    }, []);

    // ===== 获取排班数据 =====
    const fetchScheduleData = useCallback(async (params?: any) => {
        console.log('🚀 fetchScheduleData 被调用');

        if (!isBaseDataReady) {
            console.log('⏳ 基础数据未就绪，跳过查询');
            return;
        }

        // 取消正在进行的请求
        if (isFetchingRef.current) {
            console.log('⏹️ 取消正在进行的请求');
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            isFetchingRef.current = false;
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        const queryParams = params || buildQueryParams();
        console.log('📡 最终查询参数:', queryParams);

        // 检查参数是否变化
        if (!hasParamsChanged(queryParams, paramsRef.current)) {
            console.log('⏭️ 参数未变化，跳过请求');
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        isFetchingRef.current = true;
        setLoading(true);

        try {
            paramsRef.current = queryParams;

            // 构建筛选条件
            const filters: any[] = [];

            // 部门筛选
            if (queryParams.department) {
                filters.push({ key: 'DEPARTMENT_CODE', type: 'like', value: queryParams.department });
                console.log('🔍 应用部门筛选:', queryParams.department);
            }

            // 姓名筛选
            const trimmedName = queryParams.employeeName?.trim();
            if (trimmedName) {
                filters.push({ key: 'EMPLOYEE_NAME', type: 'like', value: trimmedName });
                console.log('🔍 应用姓名筛选:', trimmedName);
            }

            // 班组筛选
            if (queryParams.team) {
                filters.push({ key: 'FD_COL_RHLUFZ', type: 'like', value: queryParams.team });
                console.log('🔍 应用班组筛选:', queryParams.team);
            }

            // 月份参数
            let monthParam = null;
            if (queryParams.monthRange) {
                monthParam = {
                    startMonth: queryParams.monthRange[0].format('YYYYMM'),
                    endMonth: queryParams.monthRange[1].format('YYYYMM'),
                };
            }

            console.log('📡 发送请求，过滤条件:', JSON.stringify(filters, null, 2));

            const response = await axios.post(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getAllList',
                {
                    size: queryParams.pageSize,
                    current: queryParams.page - 1,
                    paramStr: monthParam,
                    parem: filters,
                },
                {
                    signal: controller.signal,
                }
            );

            if (!isMounted.current) return;

            if (response.status === 200) {
                const data = response.data?.data;
                setScheduleData(data?.data || []);
                setTotalCount(data?.count || 0);
                console.log('✅ 数据获取成功，共', data?.count || 0, '条');
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('⏹️ 请求已取消');
                return;
            }
            console.error('❌ 获取数据失败:', error);
            if (isMounted.current) {
                message.error('获取数据失败，请稍后重试');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
            isFetchingRef.current = false;
        }
    }, [buildQueryParams, hasParamsChanged, isBaseDataReady]);

    // ===== 初始化所有数据 =====
    const initializeData = useCallback(async () => {
        if (baseDataRef.current.isInitialized) {
            console.log('⏭️ 已初始化，跳过');
            return;
        }

        try {
            console.log('🚀 开始串行初始化数据...');

            // 步骤1: 获取用户信息
            const userData = await fetchUserInfo();

            // 步骤2: 获取部门列表
            const deptList = await fetchDepartmentList();

            // 步骤3: 获取班组列表
            const teamList = await fetchTeamList();

            console.log('✅ 用户信息、部门、班组全部加载完成！');

            // 步骤4: 处理用户部门匹配和姓名设置
            let matchedDeptValue: string | null = null;
            let shouldSetEmployeeName = false;
            const userName = getUserDisplayName(userData);

            baseDataRef.current.userName = userName;
            console.log('👤 用户姓名:', userName);

            if (userData?.deptName && deptList && deptList.length > 0) {
                matchedDeptValue = matchUserDepartment(userData.deptName, deptList);

                if (matchedDeptValue) {
                    // ✅ 匹配成功：限制部门，填入姓名
                    baseDataRef.current.matchedDeptValue = matchedDeptValue;
                    setDepartment(matchedDeptValue);
                    setIsDepartmentRestricted(true);
                    shouldSetEmployeeName = true;
                    console.log(`✅ 自动设置部门筛选: ${userData.deptName} -> ${matchedDeptValue}`);

                    const filteredDeptList = deptList.filter(dept => dept.value === matchedDeptValue);
                    setDepartmentOptions(filteredDeptList);
                } else {
                    // ❌ 匹配失败：不限制部门，不填入姓名
                    console.warn(`⚠️ 未匹配到部门: ${userData.deptName}，将查询所有数据`);
                    setIsDepartmentRestricted(false);
                    setDepartmentOptions(deptList);
                    setDepartment('');
                    shouldSetEmployeeName = false;
                }
            } else {
                console.log('ℹ️ 无部门信息或部门列表为空，将查询所有数据');
                setIsDepartmentRestricted(false);
                setDepartmentOptions(deptList);
                setDepartment('');
                shouldSetEmployeeName = false;
            }

            // 只有匹配成功时才填入姓名
            if (shouldSetEmployeeName && userName) {
                setEmployeeName(userName);
                console.log(`✅ 自动填入姓名筛选: ${userName}`);
            } else {
                setEmployeeName('');
                console.log('ℹ️ 姓名筛选留空');
            }

            // 更新 baseDataRef
            baseDataRef.current = {
                ...baseDataRef.current,
                userInfo: userData || null,
                departmentList: deptList || [],
                teamList: teamList || [],
            };

            // 步骤5: 标记基础数据已就绪
            setIsBaseDataReady(true);
            setIsInitializing(false);
            baseDataRef.current.isInitialized = true;
            console.log('✅ 基础数据全部加载完成！');

            // 步骤6: 等待状态更新完成，然后获取数据
            await new Promise(resolve => setTimeout(resolve, 100));

            const initialParams = {
                monthRange: monthRange,
                department: matchedDeptValue || '',
                employeeName: shouldSetEmployeeName ? (userName || '') : '',
                team: '',
                page: 1,
                pageSize: DEFAULT_PAGE_SIZE,
            };

            console.log('📡 初始化查询参数:', initialParams);
            await fetchScheduleData(initialParams);

            console.log('🎉 所有数据初始化完成！');
        } catch (error) {
            console.error('❌ 初始化数据失败:', error);
            setIsBaseDataReady(true);
            setIsInitializing(false);
            baseDataRef.current.isInitialized = true;

            try {
                const fallbackParams = {
                    monthRange: monthRange,
                    department: '',
                    employeeName: '',
                    team: '',
                    page: 1,
                    pageSize: DEFAULT_PAGE_SIZE,
                };
                await fetchScheduleData(fallbackParams);
            } catch (scheduleError) {
                console.error('❌ 获取数据失败:', scheduleError);
                if (isMounted.current) {
                    message.error('数据加载失败，请刷新页面重试');
                }
            }
        }
    }, [fetchUserInfo, fetchDepartmentList, fetchTeamList, fetchScheduleData, getUserDisplayName, matchUserDepartment, monthRange]);

    // ===== 处理月份变化 =====
    const handleMonthRangeChange = useCallback((dates: [Dayjs, Dayjs] | null) => {
        if (dates?.length === 2) {
            setMonthRange([dates[0].startOf('month'), dates[1].startOf('month')]);
        } else {
            setMonthRange(null);
        }
        setCurrentPage(1);
    }, []);

    // ===== 禁用未来月份 =====
    const disabledFutureMonth = useCallback((current: Dayjs) => {
        return current && current > dayjs().endOf('month');
    }, []);

    // ===== 重置筛选条件 =====
    const handleReset = useCallback(() => {
        console.log('🔄 重置筛选条件');

        const userDeptValue = baseDataRef.current.matchedDeptValue;
        const userName = baseDataRef.current.userName;

        if (userDeptValue) {
            setDepartment(userDeptValue);
            setEmployeeName(userName || '');
        } else {
            setDepartment('');
            setEmployeeName('');
        }

        setTeam('');
        setCurrentPage(1);

        setTimeout(() => {
            const params = buildQueryParams({ page: 1 });
            console.log('🔄 重置后查询参数:', params);
            fetchScheduleData(params);
        }, 100);

        message.info('已重置');
    }, [buildQueryParams, fetchScheduleData]);

    // ===== 处理分页变化 =====
    const handlePageChange = useCallback((page: number, size: number) => {
        console.log('📄 分页变化:', { page, size });

        if (size !== pageSize) {
            setPageSize(size);
            setCurrentPage(1);
            setTimeout(() => {
                const params = buildQueryParams({ page: 1, pageSize: size });
                fetchScheduleData(params);
            }, 100);
        } else if (page !== currentPage) {
            setCurrentPage(page);
            setTimeout(() => {
                const params = buildQueryParams({ page });
                fetchScheduleData(params);
            }, 100);
        }
    }, [pageSize, currentPage, fetchScheduleData, buildQueryParams]);

    // ===== 导出 =====
    const handleExport = useCallback(async () => {
        if (totalCount === 0) {
            message.warning('暂无数据可导出');
            return;
        }

        setLoading(true);
        const hideLoading = message.loading('正在导出数据，请稍候...', 0);

        try {
            const filters: any[] = [];

            if (department) {
                filters.push({ key: 'DEPARTMENT_CODE', type: 'like', value: department });
            }
            if (employeeName) {
                filters.push({ key: 'EMPLOYEE_NAME', type: 'like', value: employeeName.trim() });
            }
            if (team) {
                filters.push({ key: 'FD_COL_RHLUFZ', type: 'like', value: team });
            }

            let monthParam = null;
            if (monthRange) {
                monthParam = {
                    startMonth: monthRange[0].format('YYYYMM'),
                    endMonth: monthRange[1].format('YYYYMM'),
                };
            }

            const response = await axios.post(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getAllList',
                {
                    size: totalCount,
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

                const worksheet = XLSX.utils.json_to_sheet(exportData);
                worksheet['!cols'] = [
                    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
                    { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
                    { wch: 18 }, { wch: 15 }, { wch: 15 }
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
    }, [department, employeeName, team, monthRange, totalCount]);

    // ===== 表格列定义 =====
    const columns: TableColumnsType<AttendanceRecord> = useMemo(() => [
        {
            title: '部门',
            dataIndex: 'department',
            key: 'department',
            width: 100,
            align: 'center',
            fixed: 'left',
        },
        {
            title: '班组',
            dataIndex: 'team',
            key: 'team',
            width: 80,
            align: 'center',
            fixed: 'left',
        },
        {
            title: '工号',
            dataIndex: 'employeeId',
            key: 'employeeId',
            width: 80,
            align: 'center',
            fixed: 'left',
        },
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
            width: 70,
            fixed: 'left',
            align: 'center',
            render: (text: string, record: EmployeeSchedule) => {
                const isTeamLeader = record.position === '班组长';
                return (
                    <span style={{
                        color: isTeamLeader ? '#faad14' : 'inherit',
                        fontWeight: isTeamLeader ? 'bold' : 'normal'
                    }}>
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
                    {value || 0}h
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
                    {value || 0}h
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

    // ===== 初始化 Effect =====
    useEffect(() => {
        console.log('🔄 组件挂载，开始初始化');
        initializeData();

        return () => {
            console.log('🔄 组件卸载，清理资源');
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

    // ===== 监听筛选条件变化 =====
    useEffect(() => {
        if (!isBaseDataReady || isInitializing) {
            console.log('⏳ 基础数据未就绪或正在初始化，跳过筛选变化监听');
            return;
        }

        if (filterChangeTimerRef.current) {
            clearTimeout(filterChangeTimerRef.current);
        }

        setCurrentPage(1);

        filterChangeTimerRef.current = setTimeout(() => {
            console.log('🔄 筛选条件变化，重新获取数据');
            console.log('📝 当前筛选值:', {
                monthRange: monthRange ?
                    `${monthRange[0].format('YYYY-MM')} ~ ${monthRange[1].format('YYYY-MM')}` :
                    'null',
                department: debouncedDepartment || '(空)',
                employeeName: debouncedEmployeeName || '(空)',
                team: debouncedTeam || '(空)',
            });

            const params = {
                monthRange,
                department: debouncedDepartment,
                employeeName: debouncedEmployeeName,
                team: debouncedTeam,
                page: 1,
                pageSize,
            };

            fetchScheduleData(params);
        }, 300);

        return () => {
            if (filterChangeTimerRef.current) {
                clearTimeout(filterChangeTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthRange, debouncedDepartment, debouncedEmployeeName, debouncedTeam, pageSize, isBaseDataReady, isInitializing]);

    // ===== 渲染 =====
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
                                统计月份
                            </span>
                            <RangePicker
                                picker="month"
                                value={monthRange}
                                onChange={handleMonthRangeChange}
                                allowClear={false}
                                locale={zhCN.RangePicker}
                                style={{ width: 240 }}
                                disabledDate={disabledFutureMonth}
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
                                allowClear={!isDepartmentRestricted}
                                disabled={isDepartmentRestricted}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                            {isDepartmentRestricted && (
                                <Tooltip title="当前仅能查看本部门数据">
                                    <span style={{ color: '#faad14', fontSize: 12 }}>
                                        🔒 仅限本部门
                                    </span>
                                </Tooltip>
                            )}
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
                                value={employeeName}
                                onChange={(e) => setEmployeeName(e.target.value)}
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
                                value={team}
                                onChange={setTeam}
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

                        <Button icon={<ReloadOutlined />} onClick={handleReset}>
                            重置
                        </Button>

                        <Button
                            type="primary"
                            icon={<ExportOutlined />}
                            onClick={handleExport}
                            loading={loading}
                        >
                            导出
                        </Button>

                        <div style={{ flex: 1 }} />
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                            注: 时间可自由选择，默认为本月
                        </span>
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

export default AttendanceReportPage;