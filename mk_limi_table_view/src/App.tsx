// App.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Table, Button, Input, message } from 'antd';
import { DatePicker } from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    ExportOutlined,
    SettingOutlined,
    FileTextOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    CaretUpOutlined,
    CaretDownOutlined
} from '@ant-design/icons';
const { RangePicker } = DatePicker;
import axios from 'axios';
import * as XLSX from 'xlsx';
import { SelectedItem } from "./componce/PersonnelTags";
import { OrgSelector, SelectionMode, SelectionType } from '@soutetu0087/org-selector/dist/index.mjs';
import '@soutetu0087/org-selector/dist/style.css';
import './App.css';
import { mockLimsData } from './mockData';

const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export interface LimsData {
    "FD_MAIM_ID": string;
    "FD_COL_MAIN_ID": string;
    "DOC_STATE": string;
    "DOC_NAME": string;
    "DOC_NUMBER": string;
    "DOC_NUM": number;
    "DOC_FIB": number;
    "DOC_TEM": number;
    "DOC_PT": number;
    "DOC_PRIORITY": string;
    "DOC_SITE": string;
    "FD_JIE_TIME": string;
    "DOC_PROJECT": string;
    "FD_CREATE_TIME": string;
    "DOC_DEPARTMENT": string;
    "DOC_DEPARTMENT_ID": string;
    "DOC_JIE_NAME": string;
    "DOC_JIE_ID": string;
    "FD_TARGET_NAME": string;
    "FD_CABINET": string;
    "FD_GRID": string;
    "FD_URL": string;
    "DOC_NEWSITETIME": number;
    "DOC_CABINETANDGRID": string;
}

interface ApiResponse {
    status: number;
    msg: string;
    data: {
        total: number;
        size: number;
        current: number;
        list: LimsData[];
    };
}

interface FilterState {
    key: string;
    value: any;
    type: string
}

type StatusItem = {
    label: string;
    value: string;
    key: string;
};

// ==================== URL 工具函数 ====================
const updateUrlParams = (params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
        if (value && value !== '') {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url.toString());
};

const getUrlParams = () => {
    const query = new URLSearchParams(window.location.search);
    return {
        fdType: query.get('fdType') || '',
        docSite: query.get('doc_site') || '',
    };
};

// ==================== 统一解析站点值 ====================
const parseSiteValues = (docSite: string): string[] => {
    if (!docSite) return [];
    return docSite.split(/[;,]/)
        .map(v => v.trim())
        .filter(v => v !== '');
};

const App: React.FC = () => {
    // ==================== 状态定义 ====================
    const [allData, setAllData] = useState<LimsData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedData, setHasLoadedData] = useState(false);

    // 筛选状态
    const [filters, setFilters] = useState<FilterState[]>([]);
    const [prevSiteValues, setPrevSiteValues] = useState<string[]>([]);

    // 使用 ref 跟踪筛选变化，防止无限循环
    const filtersHashRef = useRef<string>('');
    const isFetchingRef = useRef<boolean>(false);
    const initialLoadDoneRef = useRef<boolean>(false);
    const prevNonSiteHashRef = useRef<string>(''); // ✅ 移到组件顶层

    // 派生状态：从 filters 中提取各个筛选条件的值
    const values = useMemo(() => {
        const filter = filters.find(f => f.key === 'DOC_SITE');
        const rawValue = filter?.value || [];
        return Array.isArray(rawValue) ? rawValue.map(v => String(v)) : [];
    }, [filters]);

    const priorityValues = useMemo(() => {
        const filter = filters.find(f => f.key === 'DOC_PRIORITY');
        const rawValue = filter?.value || [];
        return Array.isArray(rawValue) ? rawValue.map(v => String(v)) : [];
    }, [filters]);

    const reworkValues = useMemo(() => {
        const filter = filters.find(f => f.key === 'DOC_STATE');
        const rawValue = filter?.value || [];
        return Array.isArray(rawValue) ? rawValue.map(v => String(v)) : [];
    }, [filters]);

    const docStatusValues = useMemo(() => {
        const filter = filters.find(f => f.key === 'FD_DOC_STATUS');
        const rawValue = filter?.value || [];
        return Array.isArray(rawValue) ? rawValue.map(v => String(v)) : [];
    }, [filters]);

    // 其他状态
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [selectedItemss, setSelectedItemss] = useState<SelectedItem[]>([]);

    // 分页状态
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // 排序状态
    const [multiSort, setMultiSort] = useState<{ key: string; direction: 'asc' | 'desc' }[]>([{ key: 'DOC_NEWSITETIME', direction: 'desc' }]);

    // UI 状态
    const [fdType, setFdType] = useState("");
    const [flage, setFlage] = useState(false);
    const [isHourMode, setIsHourMode] = useState(true);
    const [visible, setVisible] = useState(false);
    const [visibles, setVisibles] = useState(false);
    const [columnSettingsVisible, setColumnSettingsVisible] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

    // ==================== 自动刷新相关状态 ====================
    const [lastActivityTime, setLastActivityTime] = useState(Date.now());
    const [isUserActive, setIsUserActive] = useState(true);
    const [autoRefreshCount, setAutoRefreshCount] = useState(0);
    const [idleTimeDisplay, setIdleTimeDisplay] = useState(0);
    const [needsRefreshOnActive, setNeedsRefreshOnActive] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);

    const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const idleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ==================== 标题映射 ====================
    const getPageTitle = useCallback(() => {
        const titleMap: Record<string, string> = {
            'getTemAll': 'TEM 测试流程查看列表',
            'getSemAll': 'SEM 测试流程查看列表',
            'getVpdAll': 'VPD 测试流程查看列表',
            'getSimsAll': 'SIMS 测试流程查看列表',
            'getXpsAll': 'XPS 测试流程查看列表',
        };
        return titleMap[fdType] || '测试流程查看列表';
    }, [fdType]);

    // ==================== 静态配置数据 ====================
    const processStatusOptions = [
        { label: '待SOP编制', value: '17', key: "getTemAll" },
        { label: 'SOP编制', value: '1', key: "getTemAll" },
        { label: '接样中', value: '0', key: "getTemAll" },
        { label: '待topview', value: '12', key: "getTemAll" },
        { label: 'topview', value: '2', key: "getTemAll" },
        { label: '待前处理', value: '13', key: "getTemAll" },
        { label: '前处理', value: '3', key: "getTemAll" },
        { label: '待FIB', value: '14', key: "getTemAll" },
        { label: 'FIB', value: '4', key: "getTemAll" },
        { label: '班组长审批', value: '5', key: "getTemAll" },
        { label: '待TEM拍摄', value: '15', key: "getTemAll" },
        { label: 'TEM拍摄', value: '6', key: "getTemAll" },
        { label: '委外中', value: '66', key: "getTemAll" },
        { label: '二次质审', value: '7', key: "getTemAll" },
        { label: '交接审批', value: '16', key: "getTemAll" },
        { label: '待重新送样（返工）', value: '91', key: "getTemAll" },
        { label: '接样人确认（返工）', value: '90', key: "getTemAll" },

        { label: '待SOP编制', value: '17', key: "getSemAll" },
        { label: 'SOP编制', value: '1', key: "getSemAll" },
        { label: '接样中', value: '0', key: "getSemAll" },
        { label: '待制样', value: '10', key: "getSemAll" },
        { label: '制样', value: '2', key: "getSemAll" },
        { label: '待拍摄', value: '11', key: "getSemAll" },
        { label: '拍摄', value: '3', key: "getSemAll" },
        { label: '班组长审批', value: '5', key: "getSemAll" },
        { label: '委外中', value: '66', key: "getSemAll" },
        { label: '二次质审', value: '7', key: "getSemAll" },
        { label: '待重新送样（返工）', value: '91', key: "getSemAll" },
        { label: '接样人确认（返工）', value: '90', key: "getSemAll" },

        { label: '接样中', value: '2', key: "getVpdAll" },
        { label: '待测试', value: '8', key: "getVpdAll" },
        { label: '测试中', value: '3', key: "getVpdAll" },
        { label: '待数据处理', value: '9', key: "getVpdAll" },
        { label: '数据处理', value: '4', key: "getVpdAll" },
        { label: '技术负责人审核', value: '7', key: "getVpdAll" },
        { label: '委外中', value: '66', key: "getVpdAll" },
        { label: '结案审批', value: '5', key: "getVpdAll" },

        { label: '接样中', value: '0', key: "getSimsAll" },
        { label: '待前处理', value: '10', key: "getSimsAll" },
        { label: '前处理', value: '2', key: "getSimsAll" },
        { label: '测试', value: '3', key: "getSimsAll" },
        { label: '待测试', value: '11', key: "getSimsAll" },
        { label: '待数据处理', value: '12', key: "getSimsAll" },
        { label: '数据处理', value: '4', key: "getSimsAll" },
        { label: '测试负责人', value: '5', key: "getSimsAll" },
        { label: '委外中', value: '66', key: "getSimsAll" },
        { label: '二次质审', value: '7', key: "getSimsAll" },

        { label: '接样中', value: '0', key: "getXpsAll" },
        { label: '待测试', value: '11', key: "getXpsAll" },
        { label: '测试', value: '3', key: "getXpsAll" },
        { label: '待数据处理', value: '12', key: "getXpsAll" },
        { label: '数据处理', value: '4', key: "getXpsAll" },
        { label: '委外中', value: '66', key: "getXpsAll" },
        { label: '二次质审', value: '5', key: "getXpsAll" },
        { label: '待前处理', value: '10', key: "getXpsAll" },
        { label: '前处理', value: '2', key: "getXpsAll" },
    ];

    const getStatusListByFdType = useCallback((fdType: string): StatusItem[] => {
        const filtered = processStatusOptions.filter(item => item.key === fdType);
        const statusMap = new Map<string, string>();
        filtered.forEach(item => {
            if (!statusMap.has(item.value)) {
                statusMap.set(item.value, item.label);
            }
        });
        return Array.from(statusMap.entries()).map(([value, label]) => ({
            label,
            value,
            key: fdType
        }));
    }, []);

    const currentStatusList = useMemo(() => {
        return getStatusListByFdType(fdType);
    }, [fdType, getStatusListByFdType]);

    const fd_type = [
        { label: 'A', value: '2' },
        { label: 'B', value: '1' },
        { label: 'C', value: 'C' },
    ];

    const fd_lable = [
        { label: '正常', value: '0' },
        { label: '返工', value: '1' }
    ];

    const fd_lable_tem = [
        { label: '正常', value: '0' },
        { label: '返工', value: '1' },
        { label: '拆单', value: '2' }
    ];

    const FD_DOC_STATUS = [
        { label: '待审', value: '20' },
        { label: '结束', value: '30' },
        { label: '废弃', value: '00' },
    ];

    const getFdLableOptions = useCallback(() => {
        if (fdType === 'getTemAll') {
            return fd_lable_tem;
        } else if (fdType === 'getSemAll') {
            return fd_lable;
        }
        return [];
    }, [fdType]);

    // ==================== 核心数据获取函数 ====================
    const fetchData = useCallback(async (fdTypeParam?: string, docSiteParam?: string | null, forceRefresh: boolean = false) => {
        // 防止并发请求
        if (isFetchingRef.current) {
            console.log('⏳ 请求进行中，跳过重复请求');
            return;
        }

        // 获取 URL 参数
        const { fdType: fdTypeFromUrl, docSite: docSiteFromUrl } = getUrlParams();
        const currentFdType = fdTypeParam || fdTypeFromUrl || fdType;

        if (!currentFdType) {
            console.warn('⚠️ 缺少 fdType 参数，无法请求数据');
            return;
        }

        // 构建请求参数（过滤掉 DOC_SITE，因为它是独立参数）
        const requestFilters = filters.filter(f => f.key !== 'DOC_SITE');

        // 优先使用传入的 docSiteParam
        let docSite = docSiteParam;
        if (docSite === undefined) {
            docSite = docSiteFromUrl || null;
        }

        console.log('📡 fetchData 参数:', {
            fdTypeParam,
            docSiteParam,
            finalDocSite: docSite,
            forceRefresh,
            requestFilters
        });

        // 生成请求唯一标识
        const requestHash = JSON.stringify({
            fdType: currentFdType,
            docSite,
            filters: requestFilters
        });

        // 如果不是强制刷新，且请求参数未变化，则跳过
        if (!forceRefresh && requestHash === filtersHashRef.current) {
            console.log('🔄 请求参数未变化，跳过重复请求');
            return;
        }

        isFetchingRef.current = true;
        setLoading(true);

        try {
            if (USE_MOCK_DATA) {
                await new Promise(resolve => setTimeout(resolve, 300));
                let filtered = [...mockLimsData];

                // 模拟站点筛选
                if (docSite) {
                    const siteValues = parseSiteValues(docSite);
                    if (siteValues.length > 0) {
                        filtered = filtered.filter(item =>
                            siteValues.some(v => String(v) === String(item.DOC_SITE))
                        );
                    }
                }

                // 其他筛选条件
                for (const p of requestFilters) {
                    if (p.type === 'like' && p.value) {
                        filtered = filtered.filter(item => {
                            const val = (item as any)[p.key];
                            return val && String(val).toLowerCase().includes(String(p.value).toLowerCase());
                        });
                    } else if (p.type === 'in' && Array.isArray(p.value) && p.value.length > 0) {
                        filtered = filtered.filter(item => {
                            const val = (item as any)[p.key];
                            return p.value.some(v => String(v) === String(val));
                        });
                    } else if (p.type === 'eq' && p.value) {
                        filtered = filtered.filter(item => {
                            const val = (item as any)[p.key];
                            return String(val) === String(p.value);
                        });
                    } else if (p.type === 'betweenTime' && Array.isArray(p.value)) {
                        const [start, end] = p.value;
                        if (start && end) {
                            filtered = filtered.filter(item => {
                                const val = (item as any)[p.key];
                                if (!val) return false;
                                return val >= start && val <= end;
                            });
                        }
                    }
                }
                setAllData(filtered);
                setHasLoadedData(true);
            } else {
                // 真实接口请求
                const response = await axios.post<ApiResponse>(
                    `/ekp_mkpass/back/lims/LimsTemListController/${currentFdType}`,
                    {
                        size: 999999,
                        current: 0,
                        parem: requestFilters,
                        doc_site: docSite || ''
                    }
                );

                if (response.data.status === 0) {
                    const allRecords = response.data.data.list || [];
                    console.log('📊 接口返回数据量:', allRecords.length, '站点参数:', docSite);
                    setAllData(allRecords);
                    setHasLoadedData(true);
                } else {
                    message.error('获取数据失败: ' + response.data.msg);
                }
            }

            // 更新请求哈希
            filtersHashRef.current = requestHash;
            setNeedsRefreshOnActive(false);

            if (!initialLoadDoneRef.current) {
                initialLoadDoneRef.current = true;
                message.success('数据加载完成');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('网络请求失败');
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [filters, USE_MOCK_DATA, fdType]);

    // ==================== 带防抖的数据获取（非站点筛选） ====================
    const debouncedFetchData = useCallback((fdTypeParam?: string, docSiteParam?: string | null) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            fetchData(fdTypeParam, docSiteParam);
        }, 300);
    }, [fetchData]);

    // ==================== 静默刷新 ====================
    const silentRefresh = useCallback(async () => {
        if (!isUserActive || !isPageVisible) {
            if (!isUserActive) {
                setNeedsRefreshOnActive(true);
                console.log('⏸️ 用户空闲中，标记需要刷新');
            }
            return;
        }

        const { fdType: fdTypeFromUrl, docSite: docSiteFromUrl } = getUrlParams();
        if (!fdTypeFromUrl) return;

        try {
            const requestFilters = filters.filter(f => f.key !== 'DOC_SITE');
            const docSite = docSiteFromUrl || null;

            if (USE_MOCK_DATA) {
                await new Promise(resolve => setTimeout(resolve, 300));
                let filtered = [...mockLimsData];

                if (docSite) {
                    const siteValues = parseSiteValues(docSite);
                    if (siteValues.length > 0) {
                        filtered = filtered.filter(item =>
                            siteValues.some(v => String(v) === String(item.DOC_SITE))
                        );
                    }
                }

                for (const p of requestFilters) {
                    if (p.type === 'like' && p.value) {
                        filtered = filtered.filter(item => {
                            const val = (item as any)[p.key];
                            return val && String(val).toLowerCase().includes(String(p.value).toLowerCase());
                        });
                    } else if (p.type === 'in' && Array.isArray(p.value) && p.value.length > 0) {
                        filtered = filtered.filter(item => {
                            const val = (item as any)[p.key];
                            return p.value.some(v => String(v) === String(val));
                        });
                    } else if (p.type === 'eq' && p.value) {
                        filtered = filtered.filter(item => {
                            const val = (item as any)[p.key];
                            return String(val) === String(p.value);
                        });
                    } else if (p.type === 'betweenTime' && Array.isArray(p.value)) {
                        const [start, end] = p.value;
                        if (start && end) {
                            filtered = filtered.filter(item => {
                                const val = (item as any)[p.key];
                                if (!val) return false;
                                return val >= start && val <= end;
                            });
                        }
                    }
                }
                setAllData(filtered);
            } else {
                const response = await axios.post<ApiResponse>(
                    `/ekp_mkpass/back/lims/LimsTemListController/${fdTypeFromUrl}`,
                    {
                        size: 999999,
                        current: 0,
                        parem: requestFilters,
                        doc_site: docSite || ''
                    }
                );

                if (response.data.status === 0) {
                    setAllData(response.data.data.list || []);
                }
            }

            setHasLoadedData(true);
            setAutoRefreshCount(prev => prev + 1);
            setNeedsRefreshOnActive(false);
            console.log('✅ 自动刷新成功');
        } catch (error) {
            console.error('Silent refresh error:', error);
        }
    }, [filters, USE_MOCK_DATA, isUserActive, isPageVisible]);

    // ==================== 鼠标活动检测 ====================
    const updateActivity = useCallback(() => {
        const now = Date.now();
        setLastActivityTime(now);
        setIdleTimeDisplay(0);

        if (!isUserActive) {
            setIsUserActive(true);
            console.log('🟢 用户恢复活动');

            if (needsRefreshOnActive && hasLoadedData && isPageVisible) {
                console.log('🔄 空闲期间有数据更新，执行刷新');
                message.info('🔄 恢复活跃，刷新数据');
                silentRefresh();
            } else {
                message.success('🟢 已恢复活跃状态');
            }
        }
    }, [isUserActive, hasLoadedData, silentRefresh, needsRefreshOnActive, isPageVisible]);

    // ==================== 页面可见性检测 ====================
    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = document.visibilityState === 'visible';
            setIsPageVisible(visible);

            if (visible) {
                console.log('👁️ 页面变为可见');
                if (needsRefreshOnActive && isUserActive && hasLoadedData) {
                    console.log('🔄 页面恢复可见，执行刷新');
                    message.info('🔄 页面恢复，刷新数据');
                    silentRefresh();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        setIsPageVisible(document.visibilityState === 'visible');

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [needsRefreshOnActive, isUserActive, hasLoadedData, silentRefresh]);

    // ==================== 自动刷新逻辑 ====================
    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keydown', 'touchstart', 'touchmove'];
        const handleActivity = () => {
            updateActivity();
        };

        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        idleCheckIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const idleTime = now - lastActivityTime;
            const idleSeconds = Math.floor(idleTime / 1000);
            setIdleTimeDisplay(idleSeconds);

            if (idleTime >= 5 * 60 * 1000) {
                if (isUserActive) {
                    setIsUserActive(false);
                    console.log(`🟡 用户进入空闲状态 (${Math.floor(idleTime / 60000)}分钟无操作)`);
                    message.info('⏸️ 已进入空闲状态，停止自动刷新');
                }
            }
        }, 5000);

        autoRefreshIntervalRef.current = setInterval(() => {
            if (isUserActive && isPageVisible && hasLoadedData) {
                console.log('🔄 定时刷新触发');
                silentRefresh();
            } else {
                if (!isUserActive) {
                    console.log('⏸️ 跳过刷新：用户空闲');
                    setNeedsRefreshOnActive(true);
                } else if (!isPageVisible) {
                    console.log('👁️ 跳过刷新：页面不可见');
                }
            }
        }, 60 * 1000);

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            if (idleCheckIntervalRef.current) {
                clearInterval(idleCheckIntervalRef.current);
            }
            if (autoRefreshIntervalRef.current) {
                clearInterval(autoRefreshIntervalRef.current);
            }
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [updateActivity, silentRefresh, hasLoadedData, isUserActive, isPageVisible, lastActivityTime]);

    // ==================== 核心筛选逻辑 ====================
    const filteredAndSortedData = useMemo(() => {
        if (!hasLoadedData) return [];

        let processed = [...allData];

        // 应用所有筛选条件
        for (const p of filters) {
            if (p.type === 'like' && p.value) {
                processed = processed.filter(item => {
                    const val = (item as any)[p.key];
                    return val && String(val).toLowerCase().includes(String(p.value).toLowerCase());
                });
            } else if (p.type === 'in' && Array.isArray(p.value) && p.value.length > 0) {
                processed = processed.filter(item => {
                    const val = (item as any)[p.key];
                    return p.value.some(v => String(v) === String(val));
                });
            } else if (p.type === 'eq' && p.value !== undefined && p.value !== null && p.value !== '') {
                processed = processed.filter(item => {
                    const val = (item as any)[p.key];
                    return String(val) === String(p.value);
                });
            } else if (p.type === 'betweenTime' && Array.isArray(p.value) && p.value.length === 2) {
                const [start, end] = p.value;
                if (start && end) {
                    processed = processed.filter(item => {
                        const val = (item as any)[p.key];
                        if (!val) return false;
                        return val >= start && val <= end;
                    });
                }
            }
        }

        // 应用排序
        if (multiSort.length > 0) {
            processed.sort((a, b) => {
                for (const sort of multiSort) {
                    const valA = (a as any)[sort.key];
                    const valB = (b as any)[sort.key];
                    let cmp = 0;
                    if (typeof valA === 'number' && typeof valB === 'number') {
                        cmp = valA - valB;
                    } else {
                        const strA = (valA || '').toString().trim();
                        const strB = (valB || '').toString().trim();
                        cmp = strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
                    }
                    if (cmp !== 0) return sort.direction === 'asc' ? cmp : -cmp;
                }
                return 0;
            });
        }

        return processed;
    }, [allData, filters, multiSort, hasLoadedData]);

    const total = filteredAndSortedData.length;

    const paginatedData = useMemo(() => {
        const startIdx = (current - 1) * pageSize;
        const data = filteredAndSortedData.slice(startIdx, startIdx + pageSize);
        return data;
    }, [filteredAndSortedData, current, pageSize]);

    // ==================== 筛选处理函数 ====================
    const handleFilterChange = useCallback((filterName: string, type: string, checkedValues: any) => {
        console.log('🔧 筛选条件变化:', { filterName, type, checkedValues });

        // 移除空值筛选
        if (checkedValues === null || checkedValues === undefined ||
            (Array.isArray(checkedValues) && checkedValues.length === 0) ||
            checkedValues === '') {
            setFilters(prev => prev.filter(item => item.key !== filterName));
            setCurrent(1);
            return;
        }

        // 更新筛选条件
        setFilters(prev => {
            const otherFilters = prev.filter(item => item.key !== filterName);
            return [...otherFilters, { key: filterName, value: checkedValues, type: type }];
        });
        setCurrent(1);
    }, []);

    // ==================== 站点筛选专用处理函数 ====================
    const handleSiteFilterChange = useCallback((checkedValues: string[]) => {
        // 确保值都是字符串类型
        const normalizedValues = checkedValues.map(v => String(v));

        console.log('🏷️ 站点筛选变化:', {
            prev: prevSiteValues,
            current: normalizedValues
        });

        // 1. 更新 URL
        if (normalizedValues.length === 0) {
            updateUrlParams({ doc_site: '' });
        } else {
            updateUrlParams({ doc_site: normalizedValues.join(';') });
        }

        // 2. 更新 prevSiteValues
        setPrevSiteValues(normalizedValues);

        // 3. 更新 filters（用于 UI 显示）
        setFilters(prev => {
            const otherFilters = prev.filter(item => item.key !== 'DOC_SITE');
            if (normalizedValues.length === 0) {
                return otherFilters;
            }
            return [...otherFilters, {
                key: 'DOC_SITE',
                value: normalizedValues,
                type: 'in'
            }];
        });

        // 4. 重置页码
        setCurrent(1);

        // 5. 无论增加还是减少，都调用后端接口
        const docSite = normalizedValues.length > 0 ? normalizedValues.join(';') : null;
        console.log('📡 站点筛选变化，调用后端接口:', { docSite, normalizedValues });

        // 直接调用 fetchData，传入最新的站点值，强制刷新
        fetchData(undefined, docSite, true);
    }, [prevSiteValues, fetchData]);

    // ==================== 监听非站点筛选变化自动请求数据 ====================
    useEffect(() => {
        // 跳过初始加载
        if (!initialLoadDoneRef.current) return;

        // 获取当前站点参数
        const siteFilter = filters.find(f => f.key === 'DOC_SITE');
        const docSite = siteFilter?.value?.length > 0
            ? siteFilter.value.join(';')
            : null;

        // 检查是否有非站点筛选变化
        const nonSiteFilters = filters.filter(f => f.key !== 'DOC_SITE');
        const nonSiteHash = JSON.stringify(nonSiteFilters);

        // 如果非站点筛选没有变化，则不请求
        if (nonSiteHash === prevNonSiteHashRef.current) {
            return;
        }
        prevNonSiteHashRef.current = nonSiteHash;

        console.log('🔄 非站点筛选变化，触发数据请求');
        debouncedFetchData(undefined, docSite);
    }, [filters, debouncedFetchData]);

    // ==================== 重置筛选 ====================
    const handleReset = useCallback(() => {
        console.log('🔄 重置所有筛选');
        setFilters([]);
        setSelectedItems([]);
        setSelectedItemss([]);
        setMultiSort([{ key: 'DOC_NEWSITETIME', direction: 'desc' }]);
        setPrevSiteValues([]);
        setCurrent(1);
        setPageSize(10);
        updateUrlParams({ doc_site: '' });

        // 强制刷新数据
        fetchData(undefined, null, true);
        message.info('已重置所有筛选条件');
    }, [fetchData]);

    // ==================== 手动刷新 ====================
    const handleRefresh = useCallback(() => {
        const siteFilter = filters.find(f => f.key === 'DOC_SITE');
        const docSite = siteFilter?.value?.length > 0
            ? siteFilter.value.join(';')
            : null;

        fetchData(undefined, docSite, true);
        message.info('已刷新数据');
    }, [filters, fetchData]);

    // ==================== 移除单个筛选 ====================
    const removeFilter = useCallback((filterKey: string) => {
        console.log('🗑️ 移除筛选:', filterKey);

        if (filterKey === 'DOC_SITE') {
            updateUrlParams({ doc_site: '' });
            setPrevSiteValues([]);
            // 移除站点筛选后调用后端
            fetchData(undefined, null, true);
        } else {
            setFilters(prev => prev.filter(item => item.key !== filterKey));
            setCurrent(1);
        }
    }, [fetchData]);

    // ==================== 获取筛选显示标签 ====================
    const getFilterLabel = useCallback((key: string): string => {
        const labelMap: Record<string, string> = {
            DOC_NAME: '标题',
            DOC_NUMBER: '单号',
            FD_COL_8MKYGI: '项目号',
            DOC_PRIORITY: '优先级',
            FD_DOC_STATUS: '单据状态',
            DOC_STATE: '测试单类型',
            DOC_SITE: '站点状态',
            FD_CREATE_TIME: '创建时间',
            FD_JIE_TIME: '接样时间',
            DOC_JIE_ID: '接样人员',
            DOC_DEPARTMENT_ID: '委托单位',
            DOC_CABINETANDGRID: '样品柜位',
            DOC_DEPARTMENT: '委外单位'
        };
        return labelMap[key] || key;
    }, []);

    const getFilterValueDisplay = useCallback((filter: FilterState): string => {
        if (filter.type === 'like') {
            return String(filter.value);
        } else if (filter.type === 'in' && Array.isArray(filter.value)) {
            if (filter.key === 'DOC_SITE') {
                return filter.value.map(v => {
                    const opt = processStatusOptions.find(o => o.value === v && o.key === fdType);
                    return opt ? opt.label : v;
                }).join(', ');
            } else if (filter.key === 'FD_DOC_STATUS') {
                return filter.value.map(v => {
                    const opt = FD_DOC_STATUS.find(o => o.value === v);
                    return opt ? opt.label : v;
                }).join(', ');
            } else if (filter.key === 'DOC_STATE') {
                const options = fdType === 'getTemAll' ? fd_lable_tem : fd_lable;
                return filter.value.map(v => {
                    const opt = options.find(o => o.value === v);
                    return opt ? opt.label : v;
                }).join(', ');
            } else if (filter.key === 'DOC_JIE_ID') {
                return selectedItems.map(item => item.name).join(', ');
            } else if (filter.key === 'DOC_DEPARTMENT_ID') {
                return selectedItemss.map(item => item.name).join(', ');
            }
            return filter.value.join(', ');
        } else if (filter.type === 'betweenTime' && Array.isArray(filter.value)) {
            return `${filter.value[0]} → ${filter.value[1]}`;
        } else if (filter.type === 'eq') {
            return String(filter.value);
        }
        return String(filter.value);
    }, [selectedItems, selectedItemss, fdType]);

    // ==================== 表格变化处理 ====================
    const handleTableChange = useCallback((pagination: any, _filters: any, sorter: any) => {
        let newSort: { key: string; direction: 'asc' | 'desc' }[] = [];

        if (sorter && sorter.columnKey) {
            const columnKey = sorter.columnKey as string;
            if (sorter.order === 'ascend') {
                newSort = [{ key: columnKey, direction: 'asc' as const }];
            } else if (sorter.order === 'descend') {
                newSort = [{ key: columnKey, direction: 'desc' as const }];
            }
        }

        if (newSort.length === 0) {
            newSort = [{ key: 'DOC_NEWSITETIME', direction: 'desc' as const }];
        }

        setMultiSort(newSort);

        if (pagination.pageSize && pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize);
            setCurrent(1);
        } else if (pagination.current) {
            setCurrent(pagination.current);
        }
    }, [pageSize]);

    // ==================== 导出功能 ====================
    const handleExport = useCallback(() => {
        if (filteredAndSortedData.length === 0) {
            message.warning('没有数据可以导出');
            return;
        }

        try {
            const columnMap: Record<string, { label: string; getValue: (item: LimsData, idx: number) => any }> = {
                index: { label: '序号', getValue: (_, idx) => (current - 1) * pageSize + idx + 1 },
                DOC_NAME: { label: '文档名称', getValue: (item) => item.DOC_NAME || '' },
                DOC_NUMBER: { label: '单号', getValue: (item) => item.DOC_NUMBER || '' },
                DOC_CABINETANDGRID: { label: '样品柜位', getValue: (item) => item.DOC_CABINETANDGRID || '-' },
                DOC_NUM: { label: '样品数量', getValue: (item) => item.DOC_NUM || 0 },
                DOC_FIB: { label: 'FIB', getValue: (item) => item.DOC_FIB || 0 },
                DOC_TEM: { label: 'TEM', getValue: (item) => item.DOC_TEM || 0 },
                DOC_PT: { label: '测试点数', getValue: (item) => item.DOC_PT || 0 },
                DOC_PRIORITY: {
                    label: '优先级',
                    getValue: (item) => {
                        const map: Record<string, string> = { '2': 'A', '1': 'B' };
                        return map[item.DOC_PRIORITY] || 'C';
                    }
                },
                DOC_SITE: {
                    label: '当前站点',
                    getValue: (item) => {
                        const s = currentStatusList.find(s => s.value === item.DOC_SITE);
                        return s ? s.label : item.DOC_SITE || '未知状态';
                    }
                },
                DOC_NEWSITETIME: {
                    label: '流入当前站点时长',
                    getValue: (item) => {
                        if (!item.DOC_NEWSITETIME) return '-';
                        const totalMinutes = Number(item.DOC_NEWSITETIME);
                        if (isNaN(totalMinutes)) return '-';
                        if (isHourMode) {
                            return `${Math.round(totalMinutes / 60 * 10) / 10}小时`;
                        } else {
                            return `${Math.round(totalMinutes * 10) / 10}分钟`;
                        }
                    }
                },
                FD_JIE_TIME: { label: '接样时间', getValue: (item) => item.FD_JIE_TIME || '-' },
                DOC_PROJECT: { label: '项目号', getValue: (item) => item.DOC_PROJECT || '-' },
                FD_TARGET_NAME: { label: '对接窗口', getValue: (item) => item.FD_TARGET_NAME || '-' },
                DOC_DEPARTMENT: { label: '委外单位', getValue: (item) => item.DOC_DEPARTMENT || '-' },
            };

            const exportColKeys = Array.from(visibleColumns).filter(key => key !== 'action');
            const exportCols = exportColKeys
                .map(key => columnMap[key])
                .filter(col => col !== undefined);

            const exportData = paginatedData.map((item, index) => {
                const row: Record<string, any> = {};
                exportCols.forEach(col => {
                    if (col) {
                        row[col.label] = col.getValue(item, index);
                    }
                });
                return row;
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wscols = exportCols.map((col) => {
                if (!col) return { wch: 12 };
                if (col.label === '序号') return { wch: 8 };
                if (col.label === '文档名称') return { wch: 30 };
                if (col.label === '单号') return { wch: 20 };
                if (col.label === '项目号') return { wch: 40 };
                if (col.label === '接样时间') return { wch: 20 };
                if (col.label === '流入当前站点时长') return { wch: 18 };
                if (col.label === '委外单位') return { wch: 25 };
                return { wch: 12 };
            });
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, '流程查看列表');

            const date = new Date();
            const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
            const timeStr = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
            const fileName = `流程查看列表_${dateStr}_${timeStr}.xlsx`;

            XLSX.writeFile(wb, fileName);
            message.success(`导出成功！共 ${exportData.length} 条记录`);
        } catch (error) {
            console.error('导出失败:', error);
            message.error('导出失败，请重试');
        }
    }, [filteredAndSortedData, paginatedData, current, pageSize, isHourMode, visibleColumns, currentStatusList]);

    // ==================== OrgSelector 处理 ====================
    const handleConfirm = useCallback((selected: SelectedItem[]) => {
        setSelectedItems(selected);
        const ids = selected.map(user => user.id);
        handleFilterChange("DOC_JIE_ID", "in", ids.length > 0 ? ids : '');
        setVisible(false);
    }, [handleFilterChange]);

    const handleConfirms = useCallback((selected: SelectedItem[]) => {
        setSelectedItemss(selected);
        const ids = selected.map(user => user.id);
        handleFilterChange("DOC_DEPARTMENT_ID", "eq", ids.length > 0 ? ids[0] : '');
        setVisibles(false);
    }, [handleFilterChange]);

    // ==================== 列管理 ====================
    const toggleColumn = useCallback((columnKey: string) => {
        setVisibleColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(columnKey)) {
                newSet.delete(columnKey);
            } else {
                newSet.add(columnKey);
            }
            return newSet;
        });
    }, []);

    // ==================== 表格列定义 ====================
    const getSortTitle = useCallback((title: any, columnKey: string) => {
        const sortIndex = multiSort.findIndex(s => s.key === columnKey);
        if (sortIndex === -1) return title;
        const sort = multiSort[sortIndex];
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {title}
                <span style={{ fontSize: 11, color: '#1890ff', marginLeft: 2 }}>
                    {multiSort.length > 1 && <span style={{ marginRight: 2 }}>{sortIndex + 1}</span>}
                    {sort.direction === 'asc' ? <CaretUpOutlined /> : <CaretDownOutlined />}
                </span>
            </span>
        );
    }, [multiSort]);

    // ==================== 表格列定义 ====================
    const columns = useMemo(() => {
        const baseColumns = [
            {
                title: getSortTitle('序号', 'index'),
                key: 'index',
                width: 100,
                align: 'center' as const,
                sorter: true,
                showSorterTooltip: false,
                render: (_: any, __: any, index: number) => (current - 1) * pageSize + index + 1,
            },
            {
                title: getSortTitle('文档名称', 'DOC_NAME'),
                dataIndex: 'DOC_NAME',
                key: 'DOC_NAME',
                width: 580,
                sorter: true,
                showSorterTooltip: false,
                onHeaderCell: () => ({
                    style: { textAlign: 'center' }
                }),
                onCell: () => ({
                    style: { textAlign: 'center' }
                }),
                render: (text: string, record: LimsData) => {
                    const iconColors: Record<string, string> = {
                        '0': '#eff6ff',
                        '1': '#f0fdf4',
                        '2': '#faf5ff',
                        '3': '#fee2e2',
                    };
                    const iconColor = iconColors[String((record.FD_MAIM_ID?.length || 0) % 4)] || '#eff6ff';
                    const iconTextColor = ['#3b82f6', '#22c55e', '#a855f7', '#ef4444'][(record.FD_MAIM_ID?.length || 0) % 4] || '#3b82f6';
                    const isRework = record.DOC_STATE === '1';
                    const isSplit = record.DOC_STATE === '2';
                    const getIcon = (text: string) => {
                        if (text?.includes('.pdf')) return <FilePdfOutlined />;
                        if (text?.includes('.doc')) return <FileWordOutlined />;
                        return <FileTextOutlined />;
                    };
                    return (
                        <div className="doc-name">
                            <div className="doc-icon" style={{ background: iconColor, color: iconTextColor }}>
                                {getIcon(text)}
                            </div>
                            <div className="doc-info">
                                <div className="doc-title">
                                    {text}
                                    {isRework && <span className="tag tag-red">返工</span>}
                                    {isSplit && <span className="tag tag-orange">拆单</span>}
                                </div>
                                <div className="doc-unit">
                                    委托单位：{record.DOC_DEPARTMENT || '-'}
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                title: getSortTitle('单号', 'DOC_NUMBER'),
                dataIndex: 'DOC_NUMBER',
                key: 'DOC_NUMBER',
                width: 300,
                sorter: true,
                showSorterTooltip: false,
                onHeaderCell: () => ({
                    style: { textAlign: 'center' }
                }),
                onCell: () => ({
                    style: { textAlign: 'center' }
                }),
                render: (text: string) => <span style={{ color: '#2563eb' }}>{text || '-'}</span>,
            },
        ];

        if (fdType !== 'getVpdAll') {
            baseColumns.push({
                title: getSortTitle('样品柜位', 'DOC_CABINETANDGRID'),
                dataIndex: 'DOC_CABINETANDGRID',
                key: 'DOC_CABINETANDGRID',
                width: 200,
                sorter: true,
                showSorterTooltip: false,
                render: (text: string) => text || '-',
            });
        }

        baseColumns.push({
            title: getSortTitle('样品数量', 'DOC_NUM'),
            dataIndex: 'DOC_NUM',
            key: 'DOC_NUM',
            width: 200,
            align: 'center' as const,
            sorter: true,
            showSorterTooltip: false,
            render: (text: number) => text || 0,
        });

        if (fdType === 'getTemAll') {
            baseColumns.push(
                {
                    title: getSortTitle('FIB', 'DOC_FIB'),
                    dataIndex: 'DOC_FIB',
                    key: 'DOC_FIB',
                    width: 30,
                    align: 'center' as const,
                    sorter: true,
                    showSorterTooltip: false,
                    render: (text: number) => (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span className="tag tag-fib">FIB</span>
                            <span style={{ fontWeight: 600, color: '#ea580c' }}>{text || 0}</span>
                        </div>
                    ),
                },
                {
                    title: getSortTitle('TEM', 'DOC_TEM'),
                    dataIndex: 'DOC_TEM',
                    key: 'DOC_TEM',
                    width: 30,
                    align: 'center' as const,
                    sorter: true,
                    showSorterTooltip: false,
                    render: (text: number) => (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span className="tag tag-tem">TEM</span>
                            <span style={{ fontWeight: 600, color: '#0891b2' }}>{text || 0}</span>
                        </div>
                    ),
                }
            );
        } else {
            baseColumns.push({
                title: getSortTitle('测试点数', 'DOC_PT'),
                dataIndex: 'DOC_PT',
                key: 'DOC_PT',
                width: 180,
                align: 'center' as const,
                sorter: true,
                showSorterTooltip: false,
                render: (text: number) => text || 0,
            });
        }

        baseColumns.push(
            {
                title: getSortTitle('优先级', 'DOC_PRIORITY'),
                dataIndex: 'DOC_PRIORITY',
                key: 'DOC_PRIORITY',
                width: 160,
                align: 'center' as const,
                sorter: true,
                showSorterTooltip: false,
                render: (text: string) => {
                    const map: Record<string, string> = { '2': 'A', '1': 'B' };
                    const label = map[text] || 'C';
                    return <span className={`priority-badge priority-${label.toLowerCase()}`}>{label}</span>;
                },
            },
            {
                title: getSortTitle('当前站点', 'DOC_SITE'),
                dataIndex: 'DOC_SITE',
                key: 'DOC_SITE',
                width: 180,
                sorter: true,
                showSorterTooltip: false,
                render: (text: string) => {
                    const item = currentStatusList.find(item => item.value === text);
                    return item ? item.label : text || '未知状态';
                },
            },
            {
                title: getSortTitle(
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3 }}>
                        <span style={{ fontSize: '13px' }}>流入当前</span>
                        <span style={{ fontSize: '13px' }}>站点时长</span>
                        <a onClick={(e) => { e.stopPropagation(); setIsHourMode(!isHourMode); }} style={{ fontSize: '11px', color: '#1890ff' }}>
                            ({isHourMode ? '切换分钟' : '切换小时'})
                        </a>
                    </div>,
                    'DOC_NEWSITETIME'
                ),
                dataIndex: 'DOC_NEWSITETIME',
                key: 'DOC_NEWSITETIME',
                width: 200,
                align: 'center' as const,
                sorter: true,
                showSorterTooltip: false,
                render: (text: number) => {
                    if (!text && text !== 0) return '-';
                    const totalMinutes = Number(text);
                    if (isNaN(totalMinutes)) return '-';
                    if (isHourMode) {
                        const hours = totalMinutes / 60;
                        const formattedHours = Math.round(hours * 10) / 10;
                        return `${formattedHours}小时`;
                    } else {
                        const formattedMinutes = Math.round(totalMinutes * 10) / 10;
                        return `${formattedMinutes}分钟`;
                    }
                },
            },
            {
                title: getSortTitle('接样时间', 'FD_JIE_TIME'),
                dataIndex: 'FD_JIE_TIME',
                key: 'FD_JIE_TIME',
                width: 160,
                sorter: true,
                showSorterTooltip: false,
                render: (text: string) => text || '-',
            },
            {
                title: getSortTitle('项目号', 'DOC_PROJECT'),
                dataIndex: 'DOC_PROJECT',
                key: 'DOC_PROJECT',
                width: 280,
                sorter: true,
                showSorterTooltip: false,
                render: (text: string) => text || '-',
            },
            {
                title: getSortTitle('对接窗口', 'FD_TARGET_NAME'),
                dataIndex: 'FD_TARGET_NAME',
                key: 'FD_TARGET_NAME',
                width: 180,
                sorter: true,
                showSorterTooltip: false,
                render: (text: string) => text || '-',
            },
            {
                title: '操作',
                key: 'action',
                width: 100,
                align: 'center' as const,
                render: (_: any, record: LimsData) => (
                    <div className="actions">
                        <button className="btn-link" onClick={() => window.open(record.FD_URL + record.FD_MAIM_ID, '_blank')}>详情</button>
                    </div>
                ),
            }
        );

        return baseColumns;
    }, [getSortTitle, current, pageSize, fdType, isHourMode, currentStatusList]);

    // ==================== 列管理 - 动态列选项 ====================
    const allColumnOptions = useMemo(() => {
        const baseColumns = [
            { key: 'index', label: '序号' },
            { key: 'DOC_NAME', label: '文档名称' },
            { key: 'DOC_NUMBER', label: '单号' },
        ];

        if (fdType !== 'getVpdAll') {
            baseColumns.push({ key: 'DOC_CABINETANDGRID', label: '样品柜位' });
        }

        baseColumns.push(
            { key: 'DOC_NUM', label: '样品数量' }
        );

        if (fdType === 'getTemAll') {
            baseColumns.push(
                { key: 'DOC_FIB', label: 'FIB' },
                { key: 'DOC_TEM', label: 'TEM' }
            );
        } else {
            baseColumns.push({ key: 'DOC_PT', label: '测试点数' });
        }

        baseColumns.push(
            { key: 'DOC_PRIORITY', label: '优先级' },
            { key: 'DOC_SITE', label: '当前站点' },
            { key: 'DOC_NEWSITETIME', label: '流入当前站点时长' },
            { key: 'FD_JIE_TIME', label: '接样时间' },
            { key: 'DOC_PROJECT', label: '项目号' },
            { key: 'FD_TARGET_NAME', label: '对接窗口' },
            { key: 'DOC_DEPARTMENT', label: '委外单位' },
            { key: 'action', label: '操作' }
        );

        return baseColumns;
    }, [fdType]);

    const filteredColumns = useMemo(() =>
            columns.filter((col: any) => visibleColumns.has(col.key || col.dataIndex)),
        [columns, visibleColumns]
    );

    // ==================== 初始化 ====================
    useEffect(() => {
        const { fdType: fdTypeFromUrl, docSite: docSiteFromUrl } = getUrlParams();

        if (fdTypeFromUrl) {
            setFdType(fdTypeFromUrl);
        }

        // 初始化站点筛选
        if (docSiteFromUrl && fdTypeFromUrl) {
            const urlSiteValues = parseSiteValues(docSiteFromUrl);

            const validSiteValues = processStatusOptions
                .filter(item => item.key === fdTypeFromUrl)
                .map(item => item.value);

            const matchedValues = urlSiteValues.filter(v =>
                validSiteValues.includes(String(v).trim())
            );

            console.log('🔍 初始化站点筛选:', {
                docSiteFromUrl,
                urlSiteValues,
                matchedValues,
                validSiteValues
            });

            if (matchedValues.length > 0) {
                const normalizedValues = matchedValues.map(v => String(v).trim());

                setFilters(prev => {
                    const otherFilters = prev.filter(f => f.key !== 'DOC_SITE');
                    return [...otherFilters, {
                        key: 'DOC_SITE',
                        value: normalizedValues,
                        type: 'in'
                    }];
                });
                setPrevSiteValues(normalizedValues);
            } else {
                console.warn('⚠️ URL中的站点值无效，无法匹配:', {
                    docSiteFromUrl,
                    urlSiteValues,
                    validSiteValues
                });
                updateUrlParams({ doc_site: '' });
            }
        }

        // 首次加载数据
        fetchData(fdTypeFromUrl, docSiteFromUrl || null, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ==================== 初始化列显示 ====================
    useEffect(() => {
        if (fdType) {
            const baseColumns = new Set([
                'index', 'DOC_NAME', 'DOC_NUMBER', 'DOC_NUM',
                'DOC_PRIORITY', 'DOC_SITE', 'DOC_NEWSITETIME',
                'FD_JIE_TIME', 'DOC_PROJECT', 'FD_TARGET_NAME', 'DOC_DEPARTMENT', 'action'
            ]);

            if (fdType !== 'getVpdAll') {
                baseColumns.add('DOC_CABINETANDGRID');
            }

            if (fdType === 'getTemAll') {
                baseColumns.add('DOC_FIB');
                baseColumns.add('DOC_TEM');
            } else {
                baseColumns.add('DOC_PT');
            }
            setVisibleColumns(baseColumns);
        }
    }, [fdType]);

    // ==================== 渲染 ====================
    return (
        <div className="container">
            {/* 顶部标题栏 */}
            <div className="header">
                <div className="header-left">
                    <h1 className="header-title">{getPageTitle()}</h1>
                    <div style={{
                        marginLeft: '16px',
                        fontSize: '13px',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isUserActive && isPageVisible ? '#52c41a' : '#faad14',
                                marginRight: '6px',
                                animation: isUserActive && isPageVisible ? 'none' : 'pulse 2s infinite'
                            }} />
                            {isUserActive && isPageVisible ? '活跃中' :
                                !isUserActive ? '空闲中' : '页面不可见'}
                            {!isUserActive && idleTimeDisplay > 300 && (
                                <span style={{ fontSize: '11px', color: '#999', marginLeft: '4px' }}>
                                    ({Math.floor(idleTimeDisplay / 60)}分钟)
                                </span>
                            )}
                        </span>
                        <span style={{ fontSize: '12px', color: '#999' }}>
                            {isUserActive && isPageVisible ? '🔄 每1分钟自动刷新' :
                                !isUserActive ? '⏸️ 恢复活动时刷新' : '👁️ 恢复页面时刷新'}
                        </span>
                        {autoRefreshCount > 0 && (
                            <span style={{ fontSize: '11px', color: '#bbb' }}>
                                已刷新 {autoRefreshCount} 次
                            </span>
                        )}
                        {needsRefreshOnActive && !isUserActive && (
                            <span style={{ fontSize: '11px', color: '#faad14' }}>
                                ⏳ 有待刷新数据
                            </span>
                        )}
                        {!isPageVisible && (
                            <span style={{ fontSize: '11px', color: '#faad14' }}>
                                👁️ 页面不可见
                            </span>
                        )}
                    </div>
                </div>
                <div className="header-right">
                    <button className="btn" onClick={handleRefresh}>
                        <ReloadOutlined />
                        刷新
                    </button>
                    <button className="btn" onClick={() => setColumnSettingsVisible(true)}>
                        <SettingOutlined />
                        <span style={{ marginLeft: '4px' }}>列设置</span>
                    </button>
                    <button className="btn btn-primary" onClick={handleExport}>
                        <ExportOutlined />
                        导出数据
                    </button>
                </div>
            </div>

            {/* 筛选面板 */}
            <div className="filter-section">
                <div className="filter-row">
                    <div className="filter-item">
                        <label>标题</label>
                        <Input
                            placeholder="请输入标题关键词"
                            onChange={(e) => handleFilterChange("DOC_NAME", "like", e.target.value)}
                            size="small"
                        />
                    </div>
                    <div className="filter-item">
                        <label>项目号</label>
                        <Input
                            placeholder="请输入项目号"
                            onChange={(e) => handleFilterChange("FD_COL_8MKYGI", "like", e.target.value)}
                            size="small"
                        />
                    </div>
                </div>

                <div className="filter-row">
                    <div className="filter-item">
                        <label>优先级</label>
                        <div className="checkbox-group">
                            {fd_type.map(opt => (
                                <label key={opt.value}>
                                    <input
                                        type="checkbox"
                                        checked={priorityValues.some(v => String(v) === String(opt.value))}
                                        onChange={(e) => {
                                            const newValues = e.target.checked
                                                ? [...priorityValues, String(opt.value)]
                                                : priorityValues.filter(v => String(v) !== String(opt.value));
                                            handleFilterChange("DOC_PRIORITY", "in", newValues);
                                        }}
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="filter-item">
                        <label>单据状态</label>
                        <div className="checkbox-group">
                            {FD_DOC_STATUS.map(opt => (
                                <label key={opt.value}>
                                    <input
                                        type="checkbox"
                                        checked={docStatusValues.some(v => String(v) === String(opt.value))}
                                        onChange={(e) => {
                                            const newValues = e.target.checked
                                                ? [...docStatusValues, String(opt.value)]
                                                : docStatusValues.filter(v => String(v) !== String(opt.value));
                                            handleFilterChange("FD_DOC_STATUS", "in", newValues);
                                        }}
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    {(fdType === 'getTemAll' || fdType === 'getSemAll') && (
                        <div className="filter-item">
                            <label>测试单类型</label>
                            <div className="checkbox-group">
                                {getFdLableOptions().map(opt => (
                                    <label key={opt.value}>
                                        <input
                                            type="checkbox"
                                            checked={reworkValues.some(v => String(v) === String(opt.value))}
                                            onChange={(e) => {
                                                const newValues = e.target.checked
                                                    ? [...reworkValues, String(opt.value)]
                                                    : reworkValues.filter(v => String(v) !== String(opt.value));
                                                handleFilterChange("DOC_STATE", "in", newValues);
                                            }}
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="filter-row filter-row-site">
                    <div className="filter-item filter-item-site">
                        <label>站点状态</label>
                        <div className="checkbox-group checkbox-group-wrap">
                            {processStatusOptions
                                .filter(item => item.key === fdType)
                                .map(opt => (
                                    <label key={opt.value}>
                                        <input
                                            type="checkbox"
                                            checked={values.some(v => String(v) === String(opt.value))}
                                            onChange={(e) => {
                                                const newValues = e.target.checked
                                                    ? [...values, String(opt.value)]
                                                    : values.filter(v => String(v) !== String(opt.value));
                                                handleSiteFilterChange(newValues);
                                            }}
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                        </div>
                    </div>
                    <button className="expand-btn" onClick={() => setFlage(!flage)}>
                        <span className={`arrow-icon ${flage ? 'expanded' : ''}`}>▼</span>
                        {flage ? '收起筛选' : '展开筛选'}
                    </button>
                </div>

                {flage && (
                    <>
                        <div className="filter-row filter-row-expand">
                            <div className="filter-item">
                                <label>创建时间</label>
                                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                                    <RangePicker
                                        placeholder={['开始日期', '结束日期']}
                                        onChange={(date, dateString) => {
                                            handleFilterChange("FD_CREATE_TIME", "betweenTime", dateString);
                                        }}
                                        size="small"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                            <div className="filter-item" style={{marginLeft: '-33%'}}>
                                <label>接样时间</label>
                                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                                    <RangePicker
                                        placeholder={['开始日期', '结束日期']}
                                        onChange={(date, dateString) => {
                                            handleFilterChange("FD_JIE_TIME", "betweenTime", dateString);
                                        }}
                                        size="small"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="filter-row filter-row-expand">
                            <div className="filter-item">
                                <label>接样人员</label>
                                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                                    <div className="select-wrapper" onClick={() => setVisible(true)}>
                                        <input
                                            type="text"
                                            className="select-input-field"
                                            placeholder="选择组织/人员"
                                            value={selectedItems.map(item => item.name).join('、')}
                                            readOnly
                                        />
                                        <span className="select-arrow">▼</span>
                                    </div>
                                </div>
                            </div>
                            <div className="filter-item" style={{marginLeft: '-33%'}}>
                                <label>委托单位</label>
                                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                                    <div className="select-wrapper" onClick={() => setVisibles(true)}>
                                        <input
                                            type="text"
                                            className="select-input-field"
                                            placeholder="选择组织/人员"
                                            value={selectedItemss.map(item => item.name).join('、')}
                                            readOnly
                                        />
                                        <span className="select-arrow">▼</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="filter-actions">
                            <button className="btn-query" onClick={() => {}}>
                                <SearchOutlined /> 查询
                            </button>
                            <button className="btn-reset" onClick={handleReset}>
                                <ReloadOutlined /> 重置
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* 已选条件 */}
            {filters.length > 0 && (
                <div className="active-filters">
                    <span className="active-filters-label">已选条件：</span>
                    <div className="active-filters-list">
                        {filters.map((filter, index) => (
                            <span key={index} className="active-filter-tag">
                                <span className="filter-tag-text">
                                    {getFilterLabel(filter.key)}: {getFilterValueDisplay(filter)}
                                </span>
                                <button
                                    className="filter-tag-close"
                                    onClick={() => removeFilter(filter.key)}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        <button className="clear-all-btn" onClick={handleReset}>
                            清空全部
                        </button>
                    </div>
                </div>
            )}

            {/* 表格 */}
            <div className="table-section">
                <div className="table-container">
                    <Table
                        dataSource={paginatedData}
                        columns={filteredColumns}
                        rowKey="FD_MAIM_ID"
                        loading={loading}
                        onRow={(record) => ({
                            onClick: () => window.open(record.FD_URL + record.FD_MAIM_ID, '_blank')
                        })}
                        pagination={{
                            current,
                            pageSize: pageSize,
                            total: total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total) => `共 ${total} 条记录，第 ${current} / ${Math.ceil(total / pageSize)} 页`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1800 }}
                        size="middle"
                        bordered={false}
                        rowClassName={(record) => record.DOC_STATE === '1' ? 'row-rework' : ''}
                    />
                </div>
            </div>

            {/* 列设置弹窗 */}
            {columnSettingsVisible && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }} onClick={() => setColumnSettingsVisible(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '24px',
                        minWidth: '400px',
                        maxWidth: '600px',
                        maxHeight: '70vh',
                        overflowY: 'auto',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            borderBottom: '1px solid #e5e7eb',
                            paddingBottom: '12px'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>列设置</h3>
                            <button
                                onClick={() => setColumnSettingsVisible(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    color: '#999'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px'
                        }}>
                            {allColumnOptions.map(option => (
                                <label
                                    key={option.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        backgroundColor: visibleColumns.has(option.key) ? '#f0f7ff' : 'transparent',
                                        border: visibleColumns.has(option.key) ? '1px solid #1890ff' : '1px solid transparent'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.has(option.key)}
                                        onChange={() => toggleColumn(option.key)}
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <span style={{ fontSize: '14px', color: '#333' }}>{option.label}</span>
                                </label>
                            ))}
                        </div>
                        <div style={{
                            marginTop: '20px',
                            paddingTop: '16px',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => setColumnSettingsVisible(false)}
                                className="btn"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => setColumnSettingsVisible(false)}
                                className="btn btn-primary"
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OrgSelector 弹窗 */}
            <OrgSelector
                selectionMode={SelectionMode.PERSONNEL_ONLY}
                selectionType={SelectionType.MULTIPLE}
                visible={visible}
                onConfirm={handleConfirm}
                onCancel={() => setVisible(false)}
            />
            <OrgSelector
                selectionMode={SelectionMode.DEPARTMENT_ONLY}
                selectionType={SelectionType.MULTIPLE}
                visible={visibles}
                onConfirm={handleConfirms}
                onCancel={() => setVisibles(false)}
            />

            {/* 添加脉冲动画 */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }
            `}</style>
        </div>
    );
};

export default App;