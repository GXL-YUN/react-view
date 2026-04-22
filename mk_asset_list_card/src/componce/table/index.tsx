/**
 * 展示✌页面
 */
import React, { useState, useEffect } from 'react';
import { Table, Button, Checkbox, message, Input } from 'antd';
import { useNavigate, Link, NavLink } from 'react-router-dom';

import {
UserAddOutlined 

} from '@ant-design/icons';
import { DatePicker, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
const { RangePicker } = DatePicker;
import axios from 'axios';
import * as XLSX from 'xlsx';
import { LimsData, ApiResponse, FilterState,PersonnelData, PersonnelTagsProps, SelectedItem } from "./ts/type"
import { FD_COL_ZCZT, FD_DOC_STATUS,  } from "./ts/enumerated "
import PersonnelTagsIndex from "./element/PersonnelTagsIndex"
import { columns  } from "./ts/column"
import DemoPage from "../tier/DemoPage"
// 在实际组件中使用
import  CategorySelect  from '../tier/comper/CategorySelect';
import { fetchCategories } from './ts/api';

import { OrgSelector, SelectionMode, SelectionType } from '@soutetu0087/org-selector/dist/index.mjs';
import '@soutetu0087/org-selector/dist/style.css';

const TableList: React.FC = () => {

    //const navigate = useNavigate();
    const [data, setData] = useState<LimsData[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filters, setFilters] = useState<FilterState[]>([]);
    const [localPageSize, setLocalPageSize] = useState(10);
    const [flage, setFlage] = useState(false);
    const [selectedCategory, setsSelectedCategory] = useState<string[]>([]);//类别数据
    const [fdType, setFdType] = useState("");
    const [fdName, setFdName] = useState("")
  const processStatusOptions =[
    // 模拟的流程状态选项
        { label: '锁定', value: '1'  ,key:"getXpsAll" },
       { label: '未锁定', value: '2'  ,key:"getXpsAll" }
  ]


    /**
     * 
     * @param newValue 类别
     * 
     */
    const setSelectedCategory = (newValue: string[]) => {
        //alert(newValue)
        setsSelectedCategory(newValue)
        handleFilterChange("FD_TARGET_id", "in",newValue )
    };
    /**
     * 
     * @param selected 使用人员人员选择结果处理
     */
        //人员
    const [visible, setVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const handleConfirm = (selected: SelectedItem[]) => {
        console.log('选择结果使用人:', selected);
        setSelectedItems(selected);
        const userId=[]
         const names = selected.map(user => user.id);
        handleFilterChange("fd_col_syr_id", "in",names )
        setVisible(false);
    };

    /**
     * 
     * @param selected 使用人员部门选择结果处理
     */
        //人员
    const [visibledept, setVisibledept] = useState(false);
    const [selectedItemsSyrDept, setSelectedItemsSyrDept] = useState<SelectedItem[]>([]);
    
       const handleConfirmSyrDept = (selected: SelectedItem[]) => {
        console.log('选择结果使用人员部门:', selected);
        setSelectedItemsSyrDept(selected);
        const userId=[]
         const names = selected.map(user => user.id);
        handleFilterChange("fd_col_sybm_id", "in",names )
        setVisibledept(false);
    };

        /**
     * 
     * @param selected 管理人员选择结果处理
     */
        //人员
    const [visiblegly, setVisiblegly] = useState(false);
    const [selectedItemsGly, setSelectedItemsGly] = useState<SelectedItem[]>([]);
    const handleConfirmGly = (selected: SelectedItem[]) => {
        console.log('选择结果管理人员:', selected);
        setSelectedItemsGly(selected);
        const userId=[]
         const names = selected.map(user => user.id);
        handleFilterChange("fd_col_zcgly_id", "in",names )
        setVisiblegly(false);
    };

        /**
     * 
     * @param selected 管理人员部门选择结果处理
     */
        //人员
    const [visibleglyDept, setVisibleglyDept] = useState(false);
    const [selectedItemsGlyDept, setSelectedItemsGlyDept] = useState<SelectedItem[]>([]);
    const handleConfirmGlyDept = (selected: SelectedItem[]) => {
        console.log('选择结果管理人员部门:', selected);
        setSelectedItemsGlyDept (selected);
        const userId=[]
         const names = selected.map(user => user.id);
        handleFilterChange("fd_col_zcglbm_id", "in",names )
        setVisibleglyDept(false);
    };
    type StatusItem = {
        label: string;
        value: string;
        key:string;
    };
    // 获取数据
    const fetchData = async (page: number = current, size: number = localPageSize, params: FilterState[] = filters) => {
        setLoading(true);
        const useQuery = () => {
            return new URLSearchParams(window.location.search);
        };
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const query = useQuery();
        const fdType = query.get('fdType');
         setFdName("展开筛选")
        setFdType(fdType+"");
        try {
            const response = await axios.post<ApiResponse>(
                //'/ekp_mkpass/back/lims/LimsTemListController/' + fdType,
                '/ekp_mkpass/back/asset/list/page',
                {
                    size,
                    current: page - 1,
                    parem: params,
                }
            );
            if (response.data.status === 0) {
                const responseData = response.data.data;
                console.log('接口返回:', {
                    total: responseData.total,
                    current: responseData.current,
                    pageSize: responseData.size,
                    dataLength: responseData.list?.length || 0,
                    list: responseData.list
                });

                setData(responseData.list || []);
                setTotal(responseData.total || 0);
                // 确保页码正确（接口返回的current可能从0开始或1开始）
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
        if(flage){
            setFdName("展开筛选")
        }else{
            setFdName("关闭筛选")
        }
        setFlage(!flage)
    };
    // 处理筛选变化
    const handleFilterChange = (filterName: string, type: string, checkedValues: any) => {
        console.log('筛选器名称:', filterName, '选中的值:', checkedValues);
        //const newFilters = checkedValues.map(val => ({ key: filterName, value: val }));
        debugger
        if (checkedValues != null) {
        }
        const newFilters = [{ key: filterName, value: checkedValues, type: type }]

        const existingOtherFilters = filters.filter(item => item.key !== filterName);
        const combinedFilters = [...newFilters, ...existingOtherFilters];

        setFilters(combinedFilters);
        setCurrent(1);
        fetchData(1, localPageSize, combinedFilters);
    };

    // 处理分页变化
    const handleTableChange = (pagination: any) => {
        console.log('分页变化:', {
            current: pagination.current,
            pageSize: pagination.pageSize
        });

        if (pagination.pageSize && pagination.pageSize !== localPageSize) {
            setLocalPageSize(pagination.pageSize);
            setCurrent(1);
            fetchData(1, pagination.pageSize, filters);
        } else {
            setCurrent(pagination.current);
            fetchData(pagination.current, localPageSize, filters);
        }
    };

    // 导出数据
    // const handleExport = () => {
    //     message.info('导出功能待实现');
    // };


    // 导出数据函数 - 导出当前页面数据
    // const handleExport = () => {
    //     if (data.length === 0) {
    //         message.warning('没有数据可以导出');
    //         return;
    //     }
    //     try {
    //         // 准备数据
    //         const exportData = data.map((item, index) => ({
    //             序号: (current - 1) * localPageSize + index + 1,
    //             文档名称: item.DOC_NAME || '',
    //             单号: item.DOC_NUMBER || '',
    //             样品柜位: item.FD_COL_VY6XBM || '',
    //             测试柜位: item.FD_COL_6YI0L7 || '',
    //             样品数量: item.FD_COL_3MM6EF || 0,
    //             测试点数: item.FD_COL_1CBIHH || 0,
    //             优先级: item.DOC_PRIORITY || '',
    //             是否为返工: item.FD_COL_1MRA3M === '1' ? '是' : item.FD_COL_1MRA3M === '2' ? '否' : '-',
    //             当前站点: item.FD_COL_VGKEFG || '',
    //             流入当前站点时长: item.FD_COL_ZMOHYP || '',
    //             项目群: item.FD_COL_8MKYGI || '',
    //             项目号: item.DOC_PROJECT || '',
    //             预计结果上传时间: item.FD_COL_4QGWDA || '',
    //             时效: item.DOC_AGING || ''
    //         }));

    //         // 创建工作簿
    //         const wb = XLSX.utils.book_new();
    //         const ws = XLSX.utils.json_to_sheet(exportData);

    //         // 设置列宽
    //         const wscols = [
    //             { wch: 8 },   // 序号
    //             { wch: 30 },  // 文档名称
    //             { wch: 20 },  // 单号
    //             { wch: 15 },  // 样品柜位
    //             { wch: 15 },  // 测试柜位
    //             { wch: 10 },  // 样品数量
    //             { wch: 10 },  // 测试点数
    //             { wch: 10 },  // 优先级
    //             { wch: 10 },  // 是否为返工
    //             { wch: 15 },  // 当前站点
    //             { wch: 20 },  // 流入当前站点时长
    //             { wch: 15 },  // 项目群
    //             { wch: 15 },  // 项目号
    //             { wch: 20 },  // 预计结果上传时间
    //             { wch: 15 },  // 时效
    //         ];
    //         ws['!cols'] = wscols;

    //         // 添加筛选条件信息作为备注
    //         if (filters.length > 0) {
    //             const filterText = `筛选条件: ${filters.map(f => `${f.key || f.value}`).join(', ')}`;
    //             ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }];
    //             ws['A1'] = { v: filterText, t: 's' };
    //             ws['!rows'] = [{ hpt: 20 }];
    //         }

    //         // 添加工作表到工作簿
    //         XLSX.utils.book_append_sheet(wb, ws, '流程查看列表');

    //         // 生成文件名
    //         const date = new Date();
    //         const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    //         const timeStr = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
    //         const fileName = `流程查看列表_${dateStr}_${timeStr}.xlsx`;

    //         // 导出文件
    //         XLSX.writeFile(wb, fileName);

    //         message.success(`导出成功！共 ${exportData.length} 条记录`);
    //     } catch (error) {
    //         console.error('导出失败:', error);
    //         message.error('导出失败，请重试');
    //     }
    // };
    // 表格列定义

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            {/* 顶部筛选区 */}
            <div style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>资产卡片查看列表</h3>
                    {/* <Button type="primary" onClick={</div>handleExport}>导出数据</Button> */}
                </div>

                {/* 流程状态筛选 */}
                <div style={{ marginBottom: '15px' }}>
                 
                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                        <span style={{ marginRight: '8px' }}>资产名称：</span>
                                        <Input
                                            placeholder="资产名称："
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                handleFilterChange("FD_COL_ZCMC", "like", e.target.value)
                                            }
                                            style={{ width: '200px' }}
                                        />

                                        <span style={{ marginRight: '8px' }}>资产编号：</span>
                                        <Input
                                            placeholder="资产编号："
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                handleFilterChange("FD_COL_ZVBH", "like", e.target.value)
                                            }
                                            style={{ width: '200px' }}
                                        />
                                            <span style={{ marginRight: '8px' }}>父资产编号：</span>
                                              <Input
                                            placeholder="父资产编号"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                handleFilterChange("fd_col_ssfzcbm", "like", e.target.value)
                                            }
                                            style={{ width: '200px' }}
                                        />
                                            <span style={{ marginRight: '8px' }}>申购单号：</span>
                                              <Input
                                            placeholder="申购单号："
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                handleFilterChange("fd_col_sgdh", "like", e.target.value)
                                            }
                                            style={{ width: '200px' }}
                                        />

                                        <span style={{ marginRight: '8px' }}>入库单号：</span>
                                              <Input
                                            placeholder="入库单号："
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                handleFilterChange("fd_col_rkdh", "like", e.target.value)
                                            }
                                            style={{ width: '200px' }}
                                        />
                                {/* <span style={{ marginRight: '8px' }}>创建时间</span>
                                <RangePicker
                                    onChange={(date, dateString) => {
                                        // dateString 默认是 YYYY-MM-DD 格式
                                        handleFilterChange("FD_CREATE_TIME", "betweenTime", dateString);
                                    }}
                                    style={{ width: '200px' }}
                                /> */}
                            </div>
                            <div>
                                资产锁定状态：
                                <Checkbox.Group
                                    //options={processStatusOptions.filter(item => item.key === fdType).map(opt => ({ label: opt.label, value: opt.value }))}

                                    options={processStatusOptions.map(opt => ({ label: opt.label, value: opt.value }))}
                                    //defaultValue={values}
                                    onChange={(values) => handleFilterChange("fd_col_h33jff", "in", values as string[])}
                                />
                            </div>

                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                            </div>

                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px' }}>资产类别：</span>
                               <CategorySelect
                                apiFunction={fetchCategories}
                                value={selectedCategory}
                                onChange={setSelectedCategory}
/>
                            </div>
                    
                    {/* 其他隐藏筛选数据 */}
                    {flage && (
                        <div>
                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>

                            </div>
                            {/* 使用人 */}
                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px' }}>使用人员:</span>
                                <PersonnelTagsIndex
                                    data={selectedItems}
                                    maxCount={15}
                                    tagProps={{
                                        color: 'green',
                                        bordered: false,
                                        title: `${selectedItems.map(p => p.fdName).join(', ')}`,
                                        style: {
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            cursor: 'help'
                                        }
                                    }}
                                />
                                <button onClick={() => setVisible(true)}>
                                    <UserAddOutlined />
                                </button>
                                <OrgSelector
                                    selectionMode={SelectionMode.PERSONNEL_ONLY}
                                    selectionType={SelectionType.MULTIPLE}
                                    visible={visible}
                                    onConfirm={handleConfirm}
                                    onCancel={() => setVisible(false)}
                                />
                            </div>
                            {/* 使用人部门 */}
                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px' }}>使用人部门:</span>
                                <PersonnelTagsIndex
                                    data={selectedItemsSyrDept}
                                    maxCount={15}
                                    tagProps={{
                                        color: 'green',
                                        bordered: false,
                                        title: `${selectedItemsSyrDept.map(p => p.fdName).join(', ')}`,
                                        style: {
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            cursor: 'help'
                                        }
                                    }}
                                />
                                <button onClick={() => setVisibledept(true)}>
                                    <UserAddOutlined />
                                </button>
                                <OrgSelector
                                    selectionMode={SelectionMode.DEPARTMENT_ONLY}
                                    selectionType={SelectionType.MULTIPLE}
                                    visible={visibledept}
                                    onConfirm={handleConfirmSyrDept}
                                    onCancel={() => setVisibledept(false)}
                                />
                            </div>

                            
                            {/* 管理人 */}
                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px' }}>管理人:</span>
                                <PersonnelTagsIndex
                                    data={selectedItemsGly}
                                    maxCount={15}
                                    tagProps={{
                                        color: 'green',
                                        bordered: false,
                                        title: `${selectedItemsGly.map(p => p.fdName).join(', ')}`,
                                        style: {
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            cursor: 'help'
                                        }
                                    }}
                                />
                                <button onClick={() => setVisiblegly(true)}>
                                    <UserAddOutlined />
                                </button>
                                <OrgSelector
                                    selectionMode={SelectionMode.PERSONNEL_ONLY}
                                    selectionType={SelectionType.MULTIPLE}
                                    visible={visiblegly}
                                    onConfirm={handleConfirmGly}
                                    onCancel={() => setVisiblegly(false)}
                                />
                            </div>



                            {/* 管理人部门 */}
                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px' }}>管理人部门:</span>
                                <PersonnelTagsIndex
                                    data={selectedItemsGlyDept}
                                    maxCount={15}
                                    tagProps={{
                                        color: 'green',
                                        bordered: false,
                                        title: `${selectedItemsGlyDept.map(p => p.fdName).join(', ')}`,
                                        style: {
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            cursor: 'help'
                                        }
                                    }}
                                />
                                <button onClick={() => setVisibleglyDept(true)}>
                                    <UserAddOutlined />
                                </button>
                                <OrgSelector
                                    selectionMode={SelectionMode.DEPARTMENT_ONLY}
                                    selectionType={SelectionType.MULTIPLE}
                                    visible={visibleglyDept}
                                    onConfirm={handleConfirmGlyDept}
                                    onCancel={() => setVisibleglyDept(false)}
                                />
                            </div>
                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px' }}>资产状态：</span>
                                <Checkbox.Group
                                    options={FD_COL_ZCZT.map(opt => ({ label: opt.label, value: opt.value }))}
                                    onChange={(values) => handleFilterChange("FD_COL_ZCZT", "in", values as string[])}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 其他筛选条件 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button style={{ fontWeight: 'bold', float: 'right' }} type='primary' size="small" onClick={changView} >{fdName}</Button>
                </div>
            </div>

            {/* 列表区 */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px' }}>
                <Table
                    dataSource={data}
                    columns={columns}
                    rowKey="FD_MAIM_ID"
                    loading={loading}
                    onRow={(record) => {
                        return {
                            onClick: (event) => {
                                window.open(
                                    "/web/#/current/sys-modeling/km-zcgl/view/1j4s2q2o2w8w8p5wh8jjo12kjpubg2m1few0/"+record.FD_ID
                                    );
                                }
                        };
                    }}
                    pagination={{
                        current,
                        pageSize: localPageSize,
                        total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条`,
                        pageSizeOptions: ['10', '20', '50', '100', "1000"],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                    bordered
                    locale={{
                        emptyText: '暂无数据'
                    }}
                />
            </div>
        </div>
    );
};

export default TableList;