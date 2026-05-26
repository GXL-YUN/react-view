import React, { useState, useMemo, useCallback,useEffect } from 'react';
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
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

import zhCN from 'antd/es/locale/zh_CN'
import 'dayjs/locale/zh-cn'





import type { TableColumnsType } from 'antd';
import { generateAttendanceReport } from '../../data/mockData';
import type { AttendanceRecord } from '../../types';
import axios from 'axios';






const AttendanceReportPage: React.FC = () => {
  dayjs.locale('zh-cn')


  // 当前选中月份
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  
  // 筛选条件
  const [department, setDepartment] = useState<string>('');
  const [team, setTeam] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [scheduleData, setScheduleData] = useState<any[]>([]);

  
  // // 生成考勤统计数据
  // const reportData = useMemo(() => {
  // //获取初始化数据
  //  debugger
  //  const  date=generateAttendanceReport(selectedMonth.year(), selectedMonth.month() + 1)
  //   return generateAttendanceReport(selectedMonth.year(), selectedMonth.month() + 1);
  // }, [selectedMonth]);



  useEffect(() => {
      fetchData();
    //初始化
    //const data=generateMonthSchedule(selectedMonth.year(), selectedMonth.month() + 1)
    // setScheduleData(data);
  }, [selectedMonth,currentPage, pageSize,department,team,searchText]);

    const fetchData = async () => {
      setLoading(true)
      try{
          debugger
          //2. 请求接口
          //封装筛选参数
          const pageCountm=[]
          if(team!=""){
            const date= {
                "key":"EMPLOYEE_NAME",
                "type":"like",
                "value":team
                }
            pageCountm.push(date)
          }
          if(department!=""){

              const date= {
                "key":"DEPARTMENT_CODE",
                "type":"like",
                "value":department
              }
            pageCountm.push(date)    

          }
          if(searchText!=""){

              const date= {
                "key":"FD_COL_RHLUFZ",
                "type":"like",
                "value":searchText
              }
            pageCountm.push(date)    

          }
          const response = await axios.post<AttendanceRecord>(
            '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getAllList',
            {
              size: pageSize,
              current: currentPage-1,
              paramStr: selectedMonth,
              parem: pageCountm,
            }
          );
          if(response.status==200){
            setScheduleData(response.data.data.data);
            setPageSize(response.data.data.size);
            setCurrentPage(response.data.data.current);
            setPageCount(response.data.data.count);
            setLoading(false)
          }else{
            // 3. 这里你可以合并接口数据 & 本地数据
            // 示例：直接用本地
            //setScheduleData(localData);
            setLoading(false)
          }      
      }catch(e){
         setLoading(false)
      }finally{
         setLoading(false)
      }
    };





  // // 筛选后的数据
  // const filteredData = useMemo(() => {
  //   return reportData.filter((item) => {
  //     if (department && item.department !== department) return false;
  //     if (team && item.team !== team) return false;
  //     if (searchText) {
  //       const keyword = searchText.toLowerCase();
  //       if (!item.name.toLowerCase().includes(keyword) && 
  //           !item.employeeId.toLowerCase().includes(keyword)) {
  //         return false;
  //       }
  //     }
  //     return true;
  //   });
  // }, [reportData, department, team, searchText]);

  // 分页后的数据
  // const paginatedData = useMemo(() => {
  //   const start = (currentPage - 1) * pageSize;
  //   return filteredData.slice(start, start + pageSize);
  // }, [filteredData, currentPage, pageSize]);

  // 表格列定义
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
      width: 80,
      align: 'center',
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
      title: '平时加班数(h)',
      dataIndex: 'weekdayOvertime',
      key: 'weekdayOvertime',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#1890ff' : '#595959' }}>
          {value}
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
          {value}
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
          {value}
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
        <span style={{ color: value > 0 ? '#ff4d4f' : '#595959' }}>
          {value}
        </span>
      ),
    },
  ], []);

  // 处理月份变化
  const handleMonthChange = useCallback((date: Dayjs | null) => {
    if (date) {
      setSelectedMonth(date);
      setCurrentPage(1);
    }
  }, []);

  // 查询
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    message.success('查询成功');
  }, []);

  // 重置
  const handleReset = useCallback(() => {
    setDepartment('');
    setTeam('');
    setSearchText('');
    setCurrentPage(1);
    message.info('已重置');
  }, []);

  // 导出
  const handleExport = useCallback(() => {
    message.success('导出成功');
  }, []);

  // 部门选项
  const departmentOptions = [
    { value: '', label: '全部' },
    { value: '部门一', label: '部门一' },
    { value: '部门二', label: '部门二' },
  ];

  // 班组选项
  const teamOptions = [
    { value: '', label: '全部' },
    { value: '班组1', label: '班组1' },
    { value: '班组2', label: '班组2' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              allowClear={false}
              locale={zhCN.DatePicker}
              style={{ width: 120 }}
            />
          </Space>
      <Space size={4}>
            <span style={{ color: '#fff', background: '#1890ff', padding: '2px 8px', borderRadius: 4 }}>
              部门
            </span>
            {/* <Select
              value={department}
              onChange={setDepartment}
              options={departmentOptions}
              style={{ width: 120 }}
              placeholder="请选择"
            /> */}
                        <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="请输入"
              style={{ width: 140 }}
              allowClear
            />
          </Space>
          <Space size={4}>
            <span style={{ color: '#fff', background: '#1890ff', padding: '2px 8px', borderRadius: 4 }}>
              姓名
            </span>
            {/* <Select
              value={team}
              onChange={setTeam}
              options={teamOptions}
              style={{ width: 100 }}
              placeholder="请选择"
            /> */}
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
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="请输入"
              style={{ width: 140 }}
              allowClear
            />
          </Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
          <div style={{ flex: 1 }} />
          <span style={{ color: '#8c8c8c', fontSize: 12 }}>
            注: 时间可自由选择,默认为本月
          </span>
        </Space>
      </Card>

      {/* 操作按钮区 */}
      <Card
        size="small"
        style={{ borderRadius: 8 }}
        styles={{ body: { padding: '8px 16px' } }}
      >
        <Space>
          <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </Card>

      {/* 表格区 */}
      <Card
        size="small"
        style={{ borderRadius: 8, flex: 1 }}
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
        />
      </Card>

      {/* 分页区 */}
      <Card
        size="small"
        style={{ borderRadius: 8 }}
        styles={{ body: { padding: '8px 16px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={pageCount}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
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
  );
};

export default AttendanceReportPage;
