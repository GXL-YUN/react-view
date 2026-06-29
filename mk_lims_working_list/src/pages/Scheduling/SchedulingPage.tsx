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

// ==================== 类型定义 ====================
interface QueryParams {
    monthRange: [Dayjs, Dayjs] | null;
    department: string;
    employeeName: string;
    team: string;
    page: number;
    pageSize: number;
}

interface ScheduleResponse {
    data: {
        data: EmployeeSchedule[];
        size?: number;
        current?: number;
        count?: number;
    };
}

interface UserInfoResponse {
    data: {
        deptName?: string;
        departmentCode?: string;
        userName?: string;
        realName?: string;
        [key: string]: any;
    };
}

interface DepartmentListResponse {
    data: Array<{ label: string; value: string }>;
}

interface TeamListResponse {
    data: Array<{ label: string; value: string }>;
}

// ==================== 工具函数 ====================
const getScheduleColor = (type?: ScheduleType): string => {
    if (!type) return 'transparent';
    return SCHEDULE_COLORS[type] || 'transparent';
};

/**
 * 根据用户部门名称匹配部门列表中的value
 */
const matchUserDepartment = (
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

    // 3. 包含匹配（label包含用户部门名）
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
};

// ==================== 自定义 Hook ====================
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

// ==================== 主组件 ====================
const SchedulingPage: React.FC = () => {
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
    const [scheduleData, setScheduleData] = useState<EmployeeSchedule[]>([]);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [isDepartmentRestricted, setIsDepartmentRestricted] = useState<boolean>(false);

    // 标记初始化状态
    const [isInitializing, setIsInitializing] = useState<boolean>(true);
    const [isBaseDataReady, setIsBaseDataReady] = useState<boolean>(false);

    // ===== Refs =====
    const isMounted = useRef<boolean>(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const paramsRef = useRef<QueryParams | null>(null);
    const isQueryingRef = useRef<boolean>(false);
    const filterChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 存储基础数据
    const baseDataRef = useRef<{
        userInfo: any;
        departmentList: Array<{ label: string; value: string }>;
        teamList: Array<{ label: string; value: string }>;
        matchedDeptValue: string | null;
        userName: string;
        isInitialized: boolean;
        isManager: boolean; // 是否为管理者（部长或班组长）
    }>({
        userInfo: null,
        departmentList: [],
        teamList: [],
        matchedDeptValue: null,
        userName: '',
        isInitialized: false,
        isManager: false,
    });

    // ===== 防抖 =====
    const debouncedEmployeeName = useDebounce(employeeName, 300);
    const debouncedTeam = useDebounce(team, 300);
    const debouncedDepartment = useDebounce(department, 300);

    // ============================================================
    // 获取用户信息
    // ============================================================
    const fetchUserInfo = useCallback(async (): Promise<any> => {
        try {
            console.log('📡 [步骤1/4] 开始获取用户信息...');
            const response = await axios.post<UserInfoResponse>(
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
                console.log('✅ [步骤1/4] 用户信息获取成功:', userData);
            }
            return userData;
        } catch (error) {
            console.error('❌ [步骤1/4] 获取用户信息失败:', error);
            throw error;
        }
    }, []);

    // ============================================================
    // 获取部门列表
    // ============================================================
    const fetchDepartmentList = useCallback(async (): Promise<Array<{ label: string; value: string }>> => {
        try {
            console.log('📡 [步骤2/4] 开始获取部门列表...');
            const response = await axios.post<DepartmentListResponse>(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getDepartmentList',
                {},
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (!isMounted.current) return [];

            const deptList = response.data.data.data || [];
            if (Array.isArray(deptList) && deptList.length > 0) {
                setDepartmentOptions(deptList);
                baseDataRef.current.departmentList = deptList;
                console.log('✅ [步骤2/4] 部门列表获取成功，共', deptList.length, '条');
            } else {
                console.warn('⚠️ [步骤2/4] 部门列表为空或格式不正确');
                setDepartmentOptions([]);
                baseDataRef.current.departmentList = [];
            }
            return deptList;
        } catch (error) {
            console.error('❌ [步骤2/4] 获取部门列表失败:', error);
            setDepartmentOptions([]);
            baseDataRef.current.departmentList = [];
            throw error;
        }
    }, []);

    // ============================================================
    // 获取班组列表
    // ============================================================
    const fetchTeamList = useCallback(async (): Promise<Array<{ label: string; value: string }>> => {
        try {
            console.log('📡 [步骤3/4] 开始获取班组列表...');
            const response = await axios.post<TeamListResponse>(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getTeamList',
                {},
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (!isMounted.current) return [];

            const teamList = response.data.data.data || [];
            if (Array.isArray(teamList) && teamList.length > 0) {
                setTeamOptions(teamList);
                baseDataRef.current.teamList = teamList;
                console.log('✅ [步骤3/4] 班组列表获取成功，共', teamList.length, '条');
            } else {
                console.warn('⚠️ [步骤3/4] 班组列表为空或格式不正确');
                setTeamOptions([]);
                baseDataRef.current.teamList = [];
            }
            return teamList;
        } catch (error) {
            console.error('❌ [步骤3/4] 获取班组列表失败:', error);
            setTeamOptions([]);
            baseDataRef.current.teamList = [];
            throw error;
        }
    }, []);

    // ============================================================
    // 🆕 获取当前用户的排班信息（用于判断职位）
    // ============================================================
    const fetchCurrentUserSchedule = useCallback(async (
        userName: string,
        deptValue: string
    ): Promise<EmployeeSchedule | null> => {
        try {
            console.log('📡 [步骤4/4] 获取当前用户排班信息，用于判断职位...');

            const response = await axios.post<ScheduleResponse>(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getAllByYear',
                {
                    size: 1,
                    current: 0,
                    paramStr: {
                        startMonth: dayjs().format('YYYYMM'),
                        endMonth: dayjs().format('YYYYMM'),
                    },
                    parem: [
                        { key: 'EMPLOYEE_NAME', type: 'like', value: userName },
                        { key: 'DEPARTMENT_CODE', type: 'like', value: deptValue },
                    ],
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const data = response.data?.data?.data || [];
            if (data.length > 0) {
                console.log('✅ [步骤4/4] 获取到用户排班信息:', data[0]);
                return data[0];
            }
            console.warn('⚠️ [步骤4/4] 未找到用户排班信息');
            return null;
        } catch (error) {
            console.error('❌ [步骤4/4] 获取用户排班信息失败:', error);
            return null;
        }
    }, []);

    // ============================================================
    // 构建查询参数
    // ============================================================
    const buildQueryParams = useCallback((overrides?: Partial<QueryParams>): QueryParams => {
        const params: QueryParams = {
            monthRange: overrides?.monthRange ?? monthRange,
            department: overrides?.department ?? department,
            employeeName: overrides?.employeeName ?? employeeName,
            team: overrides?.team ?? team,
            page: overrides?.page ?? currentPage,
            pageSize: overrides?.pageSize ?? pageSize,
        };

        console.log('🔨 buildQueryParams 构建参数:', params);
        return params;
    }, [monthRange, department, employeeName, team, currentPage, pageSize]);

    // ============================================================
    // 比较参数是否变化
    // ============================================================
    const hasParamsChanged = useCallback((newParams: QueryParams, oldParams: QueryParams | null): boolean => {
        if (!oldParams) return true;

        const changed = (
            newParams.page !== oldParams.page ||
            newParams.pageSize !== oldParams.pageSize ||
            newParams.department !== oldParams.department ||
            newParams.employeeName !== oldParams.employeeName ||
            newParams.team !== oldParams.team ||
            (newParams.monthRange?.[0]?.format('YYYYMM') !== oldParams.monthRange?.[0]?.format('YYYYMM')) ||
            (newParams.monthRange?.[1]?.format('YYYYMM') !== oldParams.monthRange?.[1]?.format('YYYYMM'))
        );

        if (changed) {
            console.log('🔄 参数发生变化:', {
                old: oldParams,
                new: newParams,
            });
        }

        return changed;
    }, []);

    // ============================================================
    // 获取排班数据（核心方法）
    // ============================================================
    const fetchScheduleData = useCallback(async (params?: QueryParams) => {
        console.log('🚀 fetchScheduleData 被调用，传入参数:', params);

        // 检查基础数据是否已加载
        if (!isBaseDataReady) {
            console.log('⏳ 基础数据未就绪，跳过排班数据查询');
            return;
        }

        // 🔥 关键修复：取消正在进行的请求
        if (isQueryingRef.current) {
            console.log('⏹️ 取消正在进行的请求');
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            isQueryingRef.current = false;
            // 等待取消完成
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 使用传入的参数或构建新参数
        const queryParams = params || buildQueryParams();

        // 🔥 关键修复：如果 params 中有 employeeName，使用它，否则使用状态值
        if (params?.employeeName !== undefined) {
            queryParams.employeeName = params.employeeName;
        }

        console.log('📡 最终查询参数:', {
            ...queryParams,
            monthRange: queryParams.monthRange ?
                `${queryParams.monthRange[0].format('YYYY-MM')} ~ ${queryParams.monthRange[1].format('YYYY-MM')}` :
                'null',
        });

        // 检查参数是否变化（但如果传入的是初始化参数，强制请求）
        const isInitialRequest = params?.employeeName === baseDataRef.current.userName && params?.department === baseDataRef.current.matchedDeptValue;

        if (!isInitialRequest && !hasParamsChanged(queryParams, paramsRef.current)) {
            console.log('⏭️ 参数未变化，跳过请求');
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        isQueryingRef.current = true;
        setLoading(true);

        try {
            paramsRef.current = queryParams;

            // 构建过滤条件
            const filters: any[] = [];

            // 部门筛选
            if (queryParams.department) {
                filters.push({ key: 'DEPARTMENT_CODE', type: 'like', value: queryParams.department });
                console.log('🔍 应用部门筛选:', queryParams.department);
            }

            // 🔥 姓名筛选
            const trimmedName = queryParams.employeeName?.trim();
            if (trimmedName) {
                filters.push({ key: 'EMPLOYEE_NAME', type: 'like', value: trimmedName });
                console.log('🔍 应用姓名筛选:', trimmedName);
            } else {
                console.log('ℹ️ 姓名为空，不添加姓名筛选');
            }

            // 班组筛选
            if (queryParams.team) {
                filters.push({ key: 'FD_COL_RHLUFZ', type: 'like', value: queryParams.team });
                console.log('🔍 应用班组筛选:', queryParams.team);
            }

            let monthParam = null;
            if (queryParams.monthRange) {
                monthParam = {
                    startMonth: queryParams.monthRange[0].format('YYYYMM'),
                    endMonth: queryParams.monthRange[1].format('YYYYMM'),
                };
            }

            console.log('📡 发送请求，过滤条件:', JSON.stringify(filters, null, 2));

            const response = await axios.post<ScheduleResponse>(
                '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getAllByYear',
                {
                    size: queryParams.pageSize,
                    current: queryParams.page - 1,
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
            setTotalCount(data.count || 0);

            console.log('✅ 排班数据获取成功，共', data.count || 0, '条');
            console.log('✅ 当前筛选条件:', {
                部门: queryParams.department || '全部',
                姓名: queryParams.employeeName || '全部',
                班组: queryParams.team || '全部',
            });
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('⏹️ 请求已取消');
                return;
            }
            console.error('❌ 获取排班数据失败:', error);
            if (isMounted.current) {
                message.error('获取数据失败，请稍后重试');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
            isQueryingRef.current = false;
        }
    }, [buildQueryParams, hasParamsChanged, isBaseDataReady]);

    // ============================================================
    // 获取用户姓名
    // ============================================================
    const getUserDisplayName = useCallback((userData: any): string => {
        if (!userData) return '';
        const name = userData.realName || userData.userName || userData.name || userData.nickname || '';
        console.log('👤 获取用户姓名:', name);
        return name;
    }, []);

    // ============================================================
    // 初始化所有数据 - 串行执行
    // ============================================================
    const initializeData = useCallback(async () => {
        // 防止重复初始化
        if (baseDataRef.current.isInitialized) {
            console.log('⏭️ 已初始化，跳过');
            return;
        }

        try {
            console.log('🚀 开始串行初始化数据...');

            // ============================================
            // 步骤1: 获取用户信息
            // ============================================
            const userData = await fetchUserInfo();
            if (!userData) {
                console.warn('⚠️ 未获取到用户信息，继续执行后续步骤');
            }

            // ============================================
            // 步骤2: 获取部门列表
            // ============================================
            const deptList = await fetchDepartmentList();

            // ============================================
            // 步骤3: 获取班组列表
            // ============================================
            const teamList = await fetchTeamList();

            console.log('✅ 用户信息、部门、班组全部加载完成！');

            // 验证数据加载情况
            console.log('📊 基础数据加载结果:', {
                user: !!userData,
                deptCount: deptList?.length || 0,
                teamCount: teamList?.length || 0,
            });

            // ============================================
            // 步骤4: 处理用户部门匹配
            // ============================================
            let matchedDeptValue: string | null = null;
            let shouldSetEmployeeName = false;
            const userName = getUserDisplayName(userData);

            // 存储到 ref 中供后续使用
            baseDataRef.current.userName = userName;
            console.log('👤 用户姓名:', userName);

            if (userData?.deptName && deptList && deptList.length > 0) {
                matchedDeptValue = matchUserDepartment(userData.deptName, deptList);

                if (matchedDeptValue) {
                    // ✅ 匹配成功：限制部门
                    baseDataRef.current.matchedDeptValue = matchedDeptValue;
                    setDepartment(matchedDeptValue);
                    setIsDepartmentRestricted(true);

                    // 限制部门下拉列表只显示该部门
                    const filteredDeptList = deptList.filter(dept => dept.value === matchedDeptValue);
                    setDepartmentOptions(filteredDeptList);
                    console.log(`✅ 自动设置部门筛选: ${userData.deptName} -> ${matchedDeptValue}`);

                    // ============================================
                    // 🆕 步骤5: 查询当前用户的排班信息，判断是否为管理者（部长或班组长）
                    // ============================================
                    let isManager = false;
                    if (userName && matchedDeptValue) {
                        const userSchedule = await fetchCurrentUserSchedule(userName, matchedDeptValue);
                        if (userSchedule) {
                            const position = userSchedule.position || '';
                            // 判断是否为部长或班组长
                            isManager = position === '部长' || position === '班组长' ||
                                position.includes('部长') || position.includes('班组长');
                            console.log(`👔 用户职位: ${position}, 是否为管理者(部长/班组长): ${isManager}`);
                            baseDataRef.current.isManager = isManager;
                        }
                    }

                    // 🆕 只有非管理者才自动填入姓名
                    if (!isManager) {
                        shouldSetEmployeeName = true;
                        console.log('✅ 普通员工，自动填入姓名筛选');
                    } else {
                        console.log('👔 管理者(部长/班组长)身份，不自动填入姓名筛选，可查看部门所有人');
                    }
                } else {
                    // ❌ 匹配失败：不限制部门，不填入姓名
                    console.warn(`⚠️ 未匹配到部门: ${userData.deptName}，将查询所有数据`);
                    setIsDepartmentRestricted(false);
                    setDepartmentOptions(deptList);
                    setDepartment('');
                    shouldSetEmployeeName = false;
                    console.log('✅ 部门下拉列表显示所有部门，姓名筛选留空');
                }
            } else {
                // 没有部门信息或部门列表为空
                console.log('ℹ️ 无部门信息或部门列表为空，将查询所有数据');
                setIsDepartmentRestricted(false);
                setDepartmentOptions(deptList);
                setDepartment('');
                shouldSetEmployeeName = false;
            }

            // 🔥 只有匹配成功且非管理者时才填入姓名
            if (shouldSetEmployeeName && userName) {
                setEmployeeName(userName);
                console.log(`✅ 自动填入姓名筛选: ${userName}`);
            } else {
                setEmployeeName(''); // 管理者或匹配失败时清空姓名
                console.log('ℹ️ 姓名筛选留空');
            }

            // 更新 baseDataRef
            baseDataRef.current = {
                ...baseDataRef.current,
                userInfo: userData || null,
                departmentList: deptList || [],
                teamList: teamList || [],
            };

            // ============================================
            // 步骤6: 标记基础数据已就绪
            // ============================================
            setIsBaseDataReady(true);
            setIsInitializing(false);
            baseDataRef.current.isInitialized = true;
            console.log('✅ 基础数据全部加载完成！');

            // ============================================
            // 步骤7: 等待状态更新完成，然后获取排班数据
            // ============================================
            await new Promise(resolve => setTimeout(resolve, 100));

            // 🔥 构建初始查询参数
            const initialParams: QueryParams = {
                monthRange: monthRange,
                department: matchedDeptValue || '',
                employeeName: shouldSetEmployeeName ? (userName || '') : '',
                team: '',
                page: 1,
                pageSize: DEFAULT_PAGE_SIZE,
            };

            console.log('📡 初始化查询参数:', {
                department: initialParams.department || '(全部)',
                employeeName: initialParams.employeeName || '(全部)',
                team: initialParams.team || '(全部)',
                isManager: baseDataRef.current.isManager,
                monthRange: initialParams.monthRange ?
                    `${initialParams.monthRange[0].format('YYYY-MM')} ~ ${initialParams.monthRange[1].format('YYYY-MM')}` :
                    'null',
            });

            // 获取排班数据
            await fetchScheduleData(initialParams);

            console.log('🎉 所有数据初始化完成！');
        } catch (error) {
            console.error('❌ 初始化数据失败:', error);
            // 降级处理
            setIsBaseDataReady(true);
            setIsInitializing(false);
            baseDataRef.current.isInitialized = true;

            try {
                console.log('📡 尝试获取排班数据（降级模式）...');
                const fallbackParams: QueryParams = {
                    monthRange: monthRange,
                    department: '',
                    employeeName: '',
                    team: '',
                    page: 1,
                    pageSize: DEFAULT_PAGE_SIZE,
                };
                await fetchScheduleData(fallbackParams);
            } catch (scheduleError) {
                console.error('❌ 获取排班数据失败:', scheduleError);
                if (isMounted.current) {
                    message.error('数据加载失败，请刷新页面重试');
                }
            }
        }
    }, [fetchUserInfo, fetchDepartmentList, fetchTeamList, fetchScheduleData, getUserDisplayName, monthRange, fetchCurrentUserSchedule]);

    // ============================================================
    // 处理月份区间变化
    // ============================================================
    const handleMonthRangeChange = useCallback((dates: [Dayjs, Dayjs] | null) => {
        if (dates?.length === 2) {
            setMonthRange([dates[0].startOf('month'), dates[1].startOf('month')]);
        } else {
            setMonthRange(null);
        }
        setCurrentPage(1);
    }, []);

    // ============================================================
    // 重置筛选条件
    // ============================================================
    const handleReset = useCallback(() => {
        console.log('🔄 重置筛选条件');

        const userDeptValue = baseDataRef.current.matchedDeptValue;
        const userName = baseDataRef.current.userName;
        const isManager = baseDataRef.current.isManager;

        // 只有匹配成功时才恢复部门和姓名，否则清空
        if (userDeptValue) {
            setDepartment(userDeptValue);
            // 管理者不自动填入姓名
            setEmployeeName(isManager ? '' : (userName || ''));
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

    // ============================================================
    // 处理分页变化
    // ============================================================
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

    // ============================================================
    // 禁用未来月份
    // ============================================================
    const disabledFutureMonth = useCallback((current: Dayjs) => {
        return current && current > dayjs().endOf('month');
    }, []);

    // ============================================================
    // 生成日期列
    // ============================================================
    const dateColumns = useMemo(() => {
        const months: Dayjs[] = [];
        if (monthRange) {
            const start = monthRange[0];
            const end = monthRange[1];
            const monthDiff = end.diff(start, 'month');
            // 限制最大查询月份为12个月
            const MAX_MONTHS = 12;
            if (monthDiff > MAX_MONTHS) {
                message.warning('查询月份范围不能超过12个月');
                return [];
            }
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

    // ============================================================
    // 表格列定义
    // ============================================================
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

    // ============================================================
    // 初始化 Effect
    // ============================================================
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

    // ============================================================
    // 监听筛选条件变化（基础数据就绪后才生效）
    // ============================================================
    useEffect(() => {
        // 只有在基础数据就绪且初始化完成后才响应筛选变化
        if (!isBaseDataReady || isInitializing) {
            console.log('⏳ 基础数据未就绪或正在初始化，跳过筛选变化监听');
            return;
        }

        if (filterChangeTimerRef.current) {
            clearTimeout(filterChangeTimerRef.current);
        }

        setCurrentPage(1);

        filterChangeTimerRef.current = setTimeout(() => {
            console.log('🔄 筛选条件变化，重新获取排班数据');
            console.log('📝 当前筛选值:', {
                monthRange: monthRange ?
                    `${monthRange[0].format('YYYY-MM')} ~ ${monthRange[1].format('YYYY-MM')}` :
                    'null',
                department: debouncedDepartment || '(空)',
                employeeName: debouncedEmployeeName || '(空)',
                team: debouncedTeam || '(空)',
            });

            // 使用防抖后的值构建查询参数
            const params: QueryParams = {
                monthRange,
                department: debouncedDepartment,
                employeeName: debouncedEmployeeName,
                team: debouncedTeam,
                page: 1,
                pageSize,
            };

            console.log('📡 筛选变化后的查询参数:', params);
            fetchScheduleData(params);
        }, 300);

        return () => {
            if (filterChangeTimerRef.current) {
                clearTimeout(filterChangeTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthRange, debouncedDepartment, debouncedEmployeeName, debouncedTeam, pageSize, isBaseDataReady, isInitializing]);

    // ============================================================
    // 渲染
    // ============================================================
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