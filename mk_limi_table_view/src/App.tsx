import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Checkbox, message, Input } from 'antd';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { DatePicker, Space } from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    ExportOutlined,
    SettingOutlined,
    CloseOutlined,
    FolderOutlined,
    UserOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
const { RangePicker } = DatePicker;
import axios from 'axios';
import * as XLSX from 'xlsx';
import { PersonnelData, PersonnelTagsProps, SelectedItem } from "./componce/PersonnelTags"
import PersonnelTagsIndex from "./componce/PersonnelTagsIndex"
import { OrgSelector, SelectionMode, SelectionType } from '@soutetu0087/org-selector/dist/index.mjs';
import '@soutetu0087/org-selector/dist/style.css';
import './App.css';
import { mockLimsData } from './mockData';

const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export interface LimsData {
    FD_MAIM_ID: string;
    DOC_STATE: string;
    DOC_NAME: string;
    DOC_NUMBER: string;
    DOC_PRIORITY: string;
    DOC_SITE: string;
    DOC_PROJECT: string;
    DOC_UPDATETIME: string;
    DOC_AGING: string;
    FD_ID: string;
    FD_CREATOR_ID: string;
    RN?: number;
    FD_URL: string;
    fdId?: string;
    FD_COL_VY6XBM?: string;
    FD_COL_6YI0L7?: string;
    FD_COL_3MM6EF?: number;
    FD_COL_1CBIHH?: number;
    FD_COL_1MRA3M?: string;
    FD_COL_VGKEFG?: string;
    FD_COL_ZMOHYP?: string;
    FD_COL_8MKYGI?: string;
    FD_COL_4QGWDA?: string;
    FD_COL_Y4XOXQ?: string;
    DOC_PT?: number;
    FD_CREATE_TIME?: string;
    DOC_CABINETANDGRID?: string;
    DOC_NUM?: string;
    DOC_NEWSITETIME?: string;
    FD_TEM_COUNT?: number;
    FD_COL_T9P4F5?: number;
    FD_TARGET_NAME?: string;
    FD_COL_6LIFCJ_NAME?: string;
    FD_COL_1FITRK_NAME?: string;
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

const App: React.FC = () => {
    const [values, setValues] = useState<String[]>([]);
    const [data, setData] = useState<LimsData[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filters, setFilters] = useState<FilterState[]>([]);
    const [localPageSize, setLocalPageSize] = useState(10);
    const [flage, setFlage] = useState(false);
    const [fdType, setFdType] = useState("");
    const [visible, setVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [visibles, setVisibles] = useState(false);
    const [selectedItemss, setSelectedItemss] = useState<SelectedItem[]>([]);
    const [isHourMode, setIsHourMode] = useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [columnSettingsVisible, setColumnSettingsVisible] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
        'index', 'DOC_NAME', 'DOC_NUMBER', 'FD_COL_1MRA3M', 'DOC_NUM',
        fdType === 'getTemAll' ? 'FD_COL_T9P4F5' : 'DOC_PT',
        fdType === 'getTemAll' ? 'FD_TEM_COUNT' : '',
        'DOC_PRIORITY', 'DOC_STATE', 'DOC_SITE', 'DOC_NEWSITETIME',
        'FD_CREATE_TIME', 'DOC_PROJECT', 'FD_TARGET_NAME', 'action'
    ]));
    const handleConfirm = (selected: SelectedItem[]) => {
        setSelectedItems(selected);
        const names = selected.map(user => user.id);
        handleFilterChange("fd_col_6lifcj_id", "in", names);
        setVisible(false);
    };

    const handleConfirms = (selected: SelectedItem[]) => {
        setSelectedItemss(selected);
        const names = selected.map(user => user.id);
        handleFilterChange("fd_col_1fitrk_id", "eq", names);
        setVisibles(false);
    };

    const processStatusOptions = [
        { label: '测试申请', value: '40', key: "getXpsAll" },
        { label: '领导审批', value: '41', key: "getXpsAll" },
        { label: '接样中', value: '0', key: "getXpsAll" },
        { label: '待前处理', value: '10', key: "getXpsAll" },
        { label: '前处理', value: '2', key: "getXpsAll" },
        { label: '待测试', value: '11', key: "getXpsAll" },
        { label: '测试', value: '3', key: "getXpsAll" },
        { label: '待数据处理', value: '12', key: "getXpsAll" },
        { label: '数据处理', value: '4', key: "getXpsAll" },
        { label: '二次质审', value: '5', key: "getXpsAll" },
        { label: '结案审批', value: '8', key: "getXpsAll" },
        { label: '已结案', value: '9', key: "getXpsAll" },
        { label: '交接审批', value: '16', key: "getXpsAll" },
        { label: '委外中', value: '66', key: "getXpsAll" },

        { label: '测试申请', value: '40', key: "getSimsAll" },
        { label: '领导审批', value: '41', key: "getSimsAll" },
        { label: '接样中', value: '0', key: "getSimsAll" },
        { label: '待前处理', value: '10', key: "getSimsAll" },
        { label: '前处理', value: '2', key: "getSimsAll" },
        { label: '待测试', value: '11', key: "getSimsAll" },
        { label: '测试', value: '3', key: "getSimsAll" },
        { label: '待数据处理', value: '12', key: "getSimsAll" },
        { label: '数据处理', value: '4', key: "getSimsAll" },
        { label: '测试负责人', value: '5', key: "getSimsAll" },
        { label: '二次质审', value: '7', key: "getSimsAll" },
        { label: '结案审批', value: '8', key: "getSimsAll" },
        { label: '已结案', value: '9', key: "getSimsAll" },
        { label: '交接审批', value: '16', key: "getSimsAll" },
        { label: '委外中', value: '66', key: "getSimsAll" },

        { label: '测试申请', value: '0', key: "getVpdAll" },
        { label: '领导审批', value: '1', key: "getVpdAll" },
        { label: '接样中', value: '2', key: "getVpdAll" },
        { label: '待测试', value: '8', key: "getVpdAll" },
        { label: '测试', value: '3', key: "getVpdAll" },
        { label: '待数据处理', value: '9', key: "getVpdAll" },
        { label: '数据处理', value: '4', key: "getVpdAll" },
        { label: '技术负责人审批', value: '7', key: "getVpdAll" },
        { label: '结案审批', value: '5', key: "getVpdAll" },
        { label: '已结案', value: '6', key: "getVpdAll" },
        { label: '委外中', value: '66', key: "getVpdAll" },

        { label: '接样中', value: '0', key: "getSemAll" },
        { label: 'SOP编制', value: '1', key: "getSemAll" },
        { label: '制样', value: '2', key: "getSemAll" },
        { label: '拍摄', value: '3', key: "getSemAll" },
        { label: '班组长审批', value: '5', key: "getSemAll" },
        { label: '二次质审', value: '7', key: "getSemAll" },
        { label: '结案审批', value: '8', key: "getSemAll" },
        { label: '已结案', value: '9', key: "getSemAll" },
        { label: '待制样', value: '10', key: "getSemAll" },
        { label: '待拍摄', value: '11', key: "getSemAll" },
        { label: '测试申请', value: '13', key: "getSemAll" },
        { label: '待SOP编制', value: '17', key: "getSemAll" },
        { label: '领导审批', value: '20', key: "getSemAll" },
        { label: '返工等待', value: '25', key: "getSemAll" },
        { label: '外诉已开单', value: '40', key: "getSemAll" },
        { label: '委外中', value: '66', key: "getSemAll" },

        { label: '接样中', value: '0', key: "getTemAll" },
        { label: 'SOP编制', value: '1', key: "getTemAll" },
        { label: 'topview', value: '2', key: "getTemAll" },
        { label: '前处理', value: '3', key: "getTemAll" },
        { label: 'FIB', value: '4', key: "getTemAll" },
        { label: '班组长审批', value: '5', key: "getTemAll" },
        { label: 'TEM拍摄', value: '6', key: "getTemAll" },
        { label: '二次质审', value: '7', key: "getTemAll" },
        { label: '结案审批', value: '8', key: "getTemAll" },
        { label: '已结案', value: '9', key: "getTemAll" },
        { label: '待制样', value: '10', key: "getTemAll" },
        { label: '待拍摄', value: '11', key: "getTemAll" },
        { label: '待topview', value: '12', key: "getTemAll" },
        { label: '待前处理', value: '13', key: "getTemAll" },
        { label: '待FIB', value: '14', key: "getTemAll" },
        { label: '待TEM拍摄', value: '15', key: "getTemAll" },
        { label: '交接审批', value: '16', key: "getTemAll" },
        { label: '待SOP编制', value: '17', key: "getTemAll" },
        { label: '测试申请', value: '18', key: "getTemAll" },
        { label: '领导审批', value: '20', key: "getTemAll" },
        { label: '返工等待', value: '25', key: "getTemAll" },
        { label: '外诉已开单', value: '40', key: "getTemAll" },
        { label: '委外中', value: '66', key: "getTemAll" }
    ];

    type StatusItem = {
        label: string;
        value: string;
        key: string;
    };

    const statusList: StatusItem[] = [
        { label: '接样中', value: '0', key: "" },
        { label: 'sop编制', value: '1', key: "" },
        { label: 'topview', value: '2', key: "" },
        { label: '前处理', value: '3', key: "" },
        { label: 'FIB', value: '4', key: "" },
        { label: '班组长审批', value: '5', key: "" },
        { label: 'TEM拍摄', value: '6', key: "" },
        { label: '二次质审', value: '7', key: "" },
        { label: '结案审批', value: '8', key: "" },
        { label: '已结案', value: '9', key: "" },
        { label: '领导审批', value: '20', key: "" },
        { label: '待topview', value: '12', key: "" },
        { label: '待前处理', value: '13', key: "" },
        { label: '待FIB', value: '14', key: "" },
        { label: '待TEM拍摄', value: '15', key: "" },
        { label: '交接审批', value: '16', key: "" },
        { label: '待sop编制', value: '17', key: "" },
        { label: '测试申请', value: '18', key: "" },
        { label: '返工等待', value: '25', key: "" },
        { label: '外诉已开单', value: '40', key: "" },
        { label: '委外中', value: '66', key: "" },
        { label: '废弃', value: '70', key: "" }
    ];

    const fd_type = [
        { label: 'A', value: '2+' },
        { label: 'B', value: '1' },
        { label: 'C', value: 'C' },
    ];

    const fd_lable = [
        { label: '正常', value: '0' },
        { label: '返工', value: '1' }
    ];

    const FD_DOC_STATUS = [
        { label: '草稿', value: '10' },
        { label: '待审', value: '30' },
        { label: '结束', value: '20' },
        { label: '废弃', value: '00' },
        { label: '驳回', value: '11' }
    ];

    const fetchData = async (page: number = current, size: number = localPageSize, params: FilterState[] = filters) => {
        setLoading(true);
        const useQuery = () => {
            return new URLSearchParams(window.location.search);
        };
        const query = useQuery();
        const fdType = query.get('fdType');
        setFdType(fdType + "");

        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let filtered = [...mockLimsData];
            for (const p of params) {
                if (p.type === 'like' && p.value) {
                    filtered = filtered.filter(item => {
                        const val = (item as any)[p.key];
                        return val && String(val).includes(String(p.value));
                    });
                } else if (p.type === 'in' && Array.isArray(p.value) && p.value.length > 0) {
                    filtered = filtered.filter(item => {
                        const val = (item as any)[p.key];
                        return p.value.includes(String(val));
                    });
                } else if (p.type === 'eq') {
                    filtered = filtered.filter(item => {
                        const val = (item as any)[p.key];
                        return String(val) === String(p.value);
                    });
                }
            }
            const startIdx = (page - 1) * size;
            const pageData = filtered.slice(startIdx, startIdx + size);
            setData(pageData);
            setTotal(filtered.length);
            setCurrent(page);
            setPageSize(size);
            setLocalPageSize(size);
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post<ApiResponse>(
                '/ekp_mkpass/back/lims/LimsTemListController/' + fdType,
                {
                    size,
                    current: page - 1,
                    parem: params,
                }
            );
            if (response.data.status === 0) {
                const responseData = response.data.data;
                setData(responseData.list || []);
                setTotal(responseData.total || 0);
                setCurrent(page);
                setPageSize(size);
                setLocalPageSize(size);
            } else {
                message.error('获取数据失败: ' + response.data.msg);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('网络请求失败');
        } finally {
            setLoading(false);
        }
    };

    const changView = () => {
        setFlage(!flage);
    };

    const handleFilterChange = (filterName: string, type: string, checkedValues: any) => {
        if (filterName == "DOC_SITE") {
            setValues(checkedValues);
        }

        if (checkedValues === null || checkedValues === undefined ||
            (Array.isArray(checkedValues) && checkedValues.length === 0)) {
            const existingOtherFilters = filters.filter(item => item.key !== filterName);
            setFilters(existingOtherFilters);
            setCurrent(1);
            fetchData(1, localPageSize, existingOtherFilters);
            return;
        }

        const newFilters = [{ key: filterName, value: checkedValues, type: type }];
        const existingOtherFilters = filters.filter(item => item.key !== filterName);
        const combinedFilters = [...newFilters, ...existingOtherFilters];

        setFilters(combinedFilters);
        setCurrent(1);
        fetchData(1, localPageSize, combinedFilters);
    };

    const handleReset = () => {
        setFilters([]);
        setValues([]);
        setSelectedItems([]);
        setSelectedItemss([]);
        setSelectedRowKeys([]);
        setCurrent(1);
        fetchData(1, localPageSize, []);
        message.info('已重置所有筛选条件');
    };

    const handleTableChange = (pagination: any) => {
        if (pagination.pageSize && pagination.pageSize !== localPageSize) {
            setLocalPageSize(pagination.pageSize);
            setCurrent(1);
            fetchData(1, pagination.pageSize, filters);
        } else {
            setCurrent(pagination.current);
            fetchData(pagination.current, localPageSize, filters);
        }
    };

    const handleExport = () => {
        if (data.length === 0) {
            message.warning('没有数据可以导出');
            return;
        }
        try {
            const columnMap: Record<string, { label: string; getValue: (item: LimsData, idx: number) => any }> = {
                index: { label: '序号', getValue: (_, idx) => (current - 1) * localPageSize + idx + 1 },
                DOC_NAME: { label: '文档名称', getValue: (item) => item.DOC_NAME || '' },
                DOC_NUMBER: { label: '单号', getValue: (item) => item.DOC_NUMBER || '' },
                FD_COL_1MRA3M: { label: '样品相位', getValue: (item) => item.FD_COL_1MRA3M || '-' },
                DOC_NUM: { label: '样品数量', getValue: (item) => item.DOC_NUM || '0' },
                FD_COL_T9P4F5: { label: 'FIB', getValue: (item) => item.FD_COL_T9P4F5 || 0 },
                FD_TEM_COUNT: { label: 'TEM', getValue: (item) => item.FD_TEM_COUNT || 0 },
                DOC_PT: { label: '测试点数', getValue: (item) => item.DOC_PT || 0 },
                DOC_PRIORITY: {
                    label: '优先级',
                    getValue: (item) => {
                        const map: Record<string, string> = { '1': 'A', '2': 'B' };
                        return map[item.DOC_PRIORITY] || 'C';
                    }
                },
                DOC_STATE: { label: '是否返工', getValue: (item) => item.DOC_STATE === '1' ? '是' : '否' },
                DOC_SITE: {
                    label: '当前站点',
                    getValue: (item) => {
                        const s = statusList.find(s => s.value === item.DOC_SITE);
                        return s ? s.label : '未知状态';
                    }
                },
                DOC_NEWSITETIME: {
                    label: '流入当前站点时长',
                    getValue: (item) => {
                        if (!item.DOC_NEWSITETIME) return '-';
                        const totalMinutes = parseInt(item.DOC_NEWSITETIME, 10);
                        if (isNaN(totalMinutes)) return '-';
                        if (isHourMode) {
                            return `${Math.round(totalMinutes / 60 * 10) / 10}小时`;
                        } else {
                            return `${Math.round(totalMinutes * 10) / 10}分钟`;
                        }
                    }
                },
                FD_CREATE_TIME: { label: '接样时间', getValue: (item) => item.FD_CREATE_TIME || '-' },
                DOC_PROJECT: { label: '项目号', getValue: (item) => item.DOC_PROJECT || '-' },
                FD_TARGET_NAME: { label: '对接窗口', getValue: (item) => item.FD_TARGET_NAME || '-' },
            };

            const exportCols = allColumnOptions
                .filter(opt => visibleColumns.has(opt.key) && opt.key !== 'action' && columnMap[opt.key])
                .map(opt => columnMap[opt.key]);

            const exportData = data.map((item, index) => {
                const row: Record<string, any> = {};
                exportCols.forEach(col => {
                    row[col.label] = col.getValue(item, index);
                });
                return row;
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            const wscols = exportCols.map((col) => {
                if (col.label === '序号') return { wch: 8 };
                if (col.label === '文档名称') return { wch: 30 };
                if (col.label === '单号') return { wch: 20 };
                if (col.label === '项目号') return { wch: 40 };
                if (col.label === '接样时间') return { wch: 20 };
                if (col.label === '流入当前站点时长') return { wch: 18 };
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
    };

    const columns = [
        {
            title: '序号',
            key: 'index',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => (current - 1) * localPageSize + index + 1,
        },
        {
            title: '文档名称',
            dataIndex: 'DOC_NAME',
            key: 'DOC_NAME',
            width: 280,
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
                return (
                    <div className="doc-name">
                        <div className="doc-icon" style={{ background: iconColor, color: iconTextColor }}>
                            📄
                        </div>
                        <div className="doc-info">
                            <div className="doc-title">
                                {text}
                                {isRework && <span className="tag tag-red">返工</span>}
                            </div>
                            <div className="doc-unit">
                                委托单位：{record.FD_COL_1FITRK_NAME || '-'}
                            </div>
                        </div>
                    </div>
                );
            },
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.DOC_NAME || '').toString().trim();
                const strB = (b.DOC_NAME || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '单号',
            dataIndex: 'DOC_NUMBER',
            key: 'DOC_NUMBER',
            width: 160,
            render: (text: string) => <span style={{ color: '#2563eb' }}>{text || '-'}</span>,
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.DOC_NUMBER || '').toString().trim();
                const strB = (b.DOC_NUMBER || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '样品相位',
            dataIndex: 'FD_COL_1MRA3M',
            key: 'FD_COL_1MRA3M',
            width: 120,
            render: (text: string) => text || '-',
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.FD_COL_1MRA3M || '').toString().trim();
                const strB = (b.FD_COL_1MRA3M || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '样品数量',
            dataIndex: 'DOC_NUM',
            key: 'DOC_NUM',
            width: 30,
            align: 'center' as const,
            render: (text: number) => text || '0',
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.DOC_NUM || '').toString().trim();
                const strB = (b.DOC_NUM || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        ...(fdType === 'getTemAll' ? [
            {
                title: 'FIB',
                dataIndex: 'FD_COL_T9P4F5',
                key: 'FD_COL_T9P4F5',
                width: 30,
                align: 'center' as const,
                render: (text: number) => (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span className="tag tag-fib">FIB</span>
                        <span style={{ fontWeight: 600, color: '#ea580c' }}>{text || 0}</span>
                    </div>
                ),
                sorter: (a: LimsData, b: LimsData) => {
                    const numA = a.FD_COL_T9P4F5 || 0;
                    const numB = b.FD_COL_T9P4F5 || 0;
                    return numA - numB;
                },
            },
            {
                title: 'TEM',
                dataIndex: 'FD_TEM_COUNT',
                key: 'FD_TEM_COUNT',
                width: 30,
                align: 'center' as const,
                render: (text: number) => (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span className="tag tag-tem">TEM</span>
                        <span style={{ fontWeight: 600, color: '#0891b2' }}>{text || 0}</span>
                    </div>
                ),
                sorter: (a: LimsData, b: LimsData) => {
                    const numA = a.FD_TEM_COUNT || 0;
                    const numB = b.FD_TEM_COUNT || 0;
                    return numA - numB;
                },
            },
        ] : [
            {
                title: '测试点数',
                dataIndex: 'DOC_PT',
                key: 'DOC_PT',
                width: 30,
                align: 'center' as const,
                render: (text: number) => text || '0',
                sorter: (a: LimsData, b: LimsData) => {
                    const strA = (a.DOC_PT || '').toString().trim();
                    const strB = (b.DOC_PT || '').toString().trim();
                    return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
                },
            },
        ]),
        {
            title: '优先级',
            dataIndex: 'DOC_PRIORITY',
            key: 'DOC_PRIORITY',
            width: 70,
            align: 'center' as const,
            render: (text: string) => {
                const map: Record<string, string> = { '1': 'A', '2': 'B' };
                const label = map[text] || 'C';
                return <span className={`priority-badge priority-${label.toLowerCase()}`}>{label}</span>;
            },
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.DOC_PRIORITY || '').toString().trim();
                const strB = (b.DOC_PRIORITY || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '是否返工',
            dataIndex: 'DOC_STATE',
            key: 'DOC_STATE',
            width: 80,
            align: 'center' as const,
            render: (text: string) => {
                const isRework = text === '1';
                return <span className={isRework ? 'tag tag-red' : 'tag tag-green'}>{isRework ? '是' : '否'}</span>;
            },
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.DOC_STATE || '').toString().trim();
                const strB = (b.DOC_STATE || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '当前站点',
            dataIndex: 'DOC_SITE',
            key: 'DOC_SITE',
            width: 110,
            render: (text: string) => {
                const item = statusList.find(item => item.value === text);
                return item ? item.label : '未知状态';
            },
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.DOC_SITE || '').toString().trim();
                const strB = (b.DOC_SITE || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>流入当前站点时长</span>
                    <a onClick={() => setIsHourMode(!isHourMode)} style={{ fontSize: '12px', color: '#1890ff' }}>
                        [{isHourMode ? '分钟' : '小时'}]
                    </a>
                </div>
            ),
            dataIndex: 'DOC_NEWSITETIME',
            key: 'DOC_NEWSITETIME',
            width: 120,
            align: 'center' as const,
            render: (text: string) => {
                if (!text) return '-';
                const totalMinutes = parseInt(text, 10);
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
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.DOC_NEWSITETIME || '').toString().trim();
                const strB = (b.DOC_NEWSITETIME || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '接样时间',
            dataIndex: 'FD_CREATE_TIME',
            key: 'FD_CREATE_TIME',
            width: 160,
            render: (text: string) => text || '-',
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.FD_CREATE_TIME || '').toString().trim();
                const strB = (b.FD_CREATE_TIME || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '项目号',
            dataIndex: 'DOC_PROJECT',
            key: 'DOC_PROJECT',
            width: 450,
            render: (text: string) => text || '-',
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.DOC_PROJECT || '').toString().trim();
                const strB = (b.DOC_PROJECT || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '对接窗口',
            dataIndex: 'FD_TARGET_NAME',
            key: 'FD_TARGET_NAME',
            width: 180,
            render: (text: string) => text || '-',
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.FD_TARGET_NAME || '').toString().trim();
                const strB = (b.FD_TARGET_NAME || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center' as const,
            render: (_: any, record: LimsData) => (
                <div className="actions">
                    <button className="btn-link" onClick={() => window.open(record.FD_URL + record.FD_MAIM_ID, '_blank')}>详情</button>
                    <span style={{ color: '#d9d9d9' }}>|</span>
                    <button className="btn-link" onClick={() => window.open(record.FD_URL + record.FD_MAIM_ID, '_blank')}>流程</button>
                </div>
            ),
        },
    ];
    const allColumnOptions = [
        { key: 'index', label: '序号' },
        { key: 'DOC_NAME', label: '文档名称' },
        { key: 'DOC_NUMBER', label: '单号' },
        { key: 'FD_COL_1MRA3M', label: '样品相位' },
        { key: 'DOC_NUM', label: '样品数量' },
        ...(fdType === 'getTemAll' ? [
            { key: 'FD_COL_T9P4F5', label: 'FIB' },
            { key: 'FD_TEM_COUNT', label: 'TEM' }
        ] : [
            { key: 'DOC_PT', label: '测试点数' }
        ]),
        { key: 'DOC_PRIORITY', label: '优先级' },
        { key: 'DOC_STATE', label: '是否返工' },
        { key: 'DOC_SITE', label: '当前站点' },
        { key: 'DOC_NEWSITETIME', label: '流入当前站点时长' },
        { key: 'FD_CREATE_TIME', label: '接样时间' },
        { key: 'DOC_PROJECT', label: '项目号' },
        { key: 'FD_TARGET_NAME', label: '对接窗口' },
        { key: 'action', label: '操作' }
    ];

    const toggleColumn = (columnKey: string) => {
        const newVisibleColumns = new Set(visibleColumns);
        if (newVisibleColumns.has(columnKey)) {
            newVisibleColumns.delete(columnKey);
        } else {
            newVisibleColumns.add(columnKey);
        }
        setVisibleColumns(newVisibleColumns);
    };


    const filteredColumns = columns.filter((col: any) => visibleColumns.has(col.key || col.dataIndex));

    useEffect(() => {
        const useQuery = () => {
            return new URLSearchParams(window.location.search);
        };
        const query = useQuery();
        const fdDate = query.get('fdData');
        if (fdDate != null && fdDate != "") {
            var arr = fdDate.split(";");
            setValues(arr);
            handleFilterChange("DOC_SITE", "in", arr as string[]);
        } else {
            fetchData();
        }
    }, []);
    useEffect(() => {
        if (fdType) {
            const baseColumns = new Set([
                'index', 'DOC_NAME', 'DOC_NUMBER', 'FD_COL_1MRA3M', 'DOC_NUM',
                'DOC_PRIORITY', 'DOC_STATE', 'DOC_SITE', 'DOC_NEWSITETIME',
                'FD_CREATE_TIME', 'DOC_PROJECT', 'FD_TARGET_NAME', 'action'
            ]);
            if (fdType === 'getTemAll') {
                baseColumns.add('FD_COL_T9P4F5');
                baseColumns.add('FD_TEM_COUNT');
            } else {
                baseColumns.add('DOC_PT');
            }
            setVisibleColumns(baseColumns);
        }
    }, [fdType]);
    const stats = useMemo(() => {
        const pending = data.filter(item =>
            item.DOC_STATE === '10' || item.DOC_STATE === '30'
        ).length;
        const closed = data.filter(item => item.DOC_SITE === '9').length;
        const rework = data.filter(item => item.DOC_STATE === '1').length;
        const inProgress = data.filter(item => {
            const s = item.DOC_SITE;
            return s && s !== '9' && s !== '70' && item.DOC_STATE !== '1';
        }).length;
        const totalPoints = data.reduce((sum, item) => sum + (item.DOC_PT || 0), 0);
        return { pending, inProgress, closed, rework, totalPoints };
    }, [data]);

    return (
        <div className="container">
            {/* ==================== 顶部标题栏 ==================== */}
            <div className="header">
                <div className="header-left">
                    <h1 className="header-title">TEM 测试流程查看列表</h1>
                    <span className="badge">共 {total} 条</span>
                </div>
                <div className="header-right">
                    <button className="btn" onClick={() => fetchData(current, localPageSize, filters)}>
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

            {/* ==================== 统计卡片区域 ==================== */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon orange">⏰</div>
                    </div>
                    <div className="stat-value">{stats.pending}</div>
                    <div className="stat-label">待处理单据</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon blue">▶️</div>
                    </div>
                    <div className="stat-value">{stats.inProgress}</div>
                    <div className="stat-label">进行中测试</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon green">✅</div>
                    </div>
                    <div className="stat-value">{stats.closed}</div>
                    <div className="stat-label">已结案</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon pink">↩️</div>
                    </div>
                    <div className="stat-value">{stats.rework}</div>
                    <div className="stat-label">返工单据</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon purple">🎯</div>
                    </div>
                    <div className="stat-value">{stats.totalPoints}<span className="unit">点</span></div>
                    <div className="stat-label">本月测试点数</div>
                </div>
            </div>

            {/* ==================== 筛选面板 ==================== */}
            <div className="filter-section">
                <div className="filter-header">
                    <div className="filter-title">
                        <span>🔽</span>
                        <span>筛选条件</span>
                        <span className="filter-count">{filters.length}</span>
                    </div>
                    <div className="filter-actions">
                        <button className="btn-link" onClick={handleReset}>重置</button>
                        <button className="btn-link" onClick={changView}>
                            {flage ? '收起筛选 ↑' : '展开筛选 ↓'}
                        </button>
                    </div>
                </div>

                {/* 第一行：标题、单号、项目号 */}
                <div className="filter-row">
                    <div className="filter-group">
                        <label className="form-label">标题：</label>
                        <div className="input-with-icon">
                            <span className="input-icon">🔍</span>
                            <Input
                                placeholder="请输入标题关键词"
                                onChange={(e) => handleFilterChange("DOC_NAME", "like", e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '36px', height: '38px' }}
                            />
                        </div>
                    </div>
                    <div className="filter-group">
                        <label className="form-label">单号：</label>
                        <Input
                            placeholder="请输入单号"
                            onChange={(e) => handleFilterChange("DOC_NUMBER", "like", e.target.value)}
                            className="form-input"
                            style={{ height: '38px' }}
                        />
                    </div>
                    <div className="filter-group">
                        <label className="form-label">项目号：</label>
                        <Input
                            placeholder="请输入项目号"
                            onChange={(e) => handleFilterChange("fd_col_8mkygi", "like", e.target.value)}
                            className="form-input"
                            style={{ height: '38px' }}
                        />
                    </div>
                </div>

                {/* 第二行：优先级、单据状态、是否返工 */}
                <div className="filter-row">
                    <div className="filter-group">
                        <label className="form-label" style={{ paddingTop: '4px' }}>优先级：</label>
                        <div className="checkbox-group">
                            {fd_type.map(opt => (
                                <label key={opt.value} className="checkbox-item">
                                    <input type="checkbox" />
                                    <span className={`priority-badge priority-${opt.label.toLowerCase()}`}>{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <label className="form-label" style={{ paddingTop: '4px' }}>单据状态：</label>
                        <Checkbox.Group
                            className="checkbox-group"
                            options={FD_DOC_STATUS.map(opt => ({ label: opt.label, value: opt.value }))}
                            onChange={(values) => handleFilterChange("FD_DOC_STATUS", "in", values as string[])}
                        />
                    </div>
                    <div className="filter-group">
                        <label className="form-label" style={{ paddingTop: '4px' }}>是否返工：</label>
                        <Checkbox.Group
                            className="checkbox-group"
                            options={fd_lable.map(opt => ({ label: opt.label, value: opt.value }))}
                            onChange={(values) => handleFilterChange("DOC_STATE", "in", values as string[])}
                        />
                    </div>
                </div>

                {/* 第三行：站点状态 */}
                <div className="filter-row">
                    <div className="filter-group" style={{ flex: 2 }}>
                        <label className="form-label" style={{ paddingTop: '4px' }}>站点状态：</label>
                        <Checkbox.Group
                            className="checkbox-group"
                            options={processStatusOptions.filter(item => item.key === fdType).map(opt => ({ label: opt.label, value: opt.value }))}
                            value={values}
                            onChange={(values) => handleFilterChange("DOC_SITE", "in", values as string[])}
                        />
                    </div>
                </div>

                {/* 展开的筛选条件 */}
                {flage && (
                    <div>
                        {/* 第四行：创建时间、接样时间 */}
                        <div className="filter-row">
                            <div className="filter-group">
                                <label className="form-label">创建时间：</label>
                                <div className="date-range">
                                    <RangePicker
                                        onChange={(date, dateString) => {
                                            handleFilterChange("FD_CREATE_TIME", "betweenTime", dateString);
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                            <div className="filter-group">
                                <label className="form-label">接样时间：</label>
                                <div className="date-range">
                                    <RangePicker
                                        onChange={(date, dateString) => {
                                            handleFilterChange("FD_CREATE_TIME", "betweenTime", dateString);
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 第五行：接样人员、委托单位 + 操作按钮 */}
                        <div className="filter-row">
                            <div className="filter-group">
                                <label className="form-label">接样人员：</label>
                                <div className="select-input" onClick={() => setVisible(true)}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="选择组织/人员"
                                        value={selectedItems.map(item => item.name).join('、')}
                                        readOnly
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span className="select-arrow">▼</span>
                                </div>
                            </div>
                            <div className="filter-group">
                                <label className="form-label">委托单位：</label>
                                <div className="select-input" onClick={() => setVisibles(true)}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="选择组织/人员"
                                        value={selectedItemss.map(item => item.name).join('、')}
                                        readOnly
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span className="select-arrow">▼</span>
                                </div>
                            </div>
                            <div className="filter-footer" style={{ marginTop: 0 }}>
                                <button className="btn btn-primary" onClick={() => fetchData(1, localPageSize, filters)}>
                                    <SearchOutlined />
                                    查询
                                </button>
                                <button className="btn" onClick={handleReset}>
                                    <ReloadOutlined />
                                    重置
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ==================== 表格区域 ==================== */}
            <div className="table-section">
                <div className="table-container">
                    <Table
                        dataSource={data}
                        columns={filteredColumns}
                        rowKey="FD_MAIM_ID"
                        loading={loading}
                        onRow={(record) => ({
                            onClick: () => window.open(record.FD_URL + record.FD_MAIM_ID, '_blank')
                        })}
                        pagination={{
                            current,
                            pageSize: localPageSize,
                            total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total) => `共 ${total} 条记录，第 ${current} / ${Math.ceil(total / localPageSize)} 页`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1600 }}
                        size="middle"
                        bordered={false}
                        rowClassName={(record) => record.DOC_STATE === '1' ? 'row-rework' : ''}
                    />
                </div>
            </div>

            {/* ==================== 列设置弹窗 ==================== */}
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

            {/* ==================== OrgSelector 弹窗 ==================== */}
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
        </div>
    );
};

export default App;
