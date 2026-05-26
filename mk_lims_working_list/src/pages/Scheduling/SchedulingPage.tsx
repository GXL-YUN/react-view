import React, { useState, useMemo, useCallback,useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tooltip,
  Pagination,
  message,
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import zhCN from 'antd/es/locale/zh_CN'
import 'dayjs/locale/zh-cn'



import type { TableColumnsType } from 'antd';
import Legend from '../../components/Legend/Legend';
import { generateMonthSchedule } from '../../data/mockData';
import type { EmployeeSchedule, ScheduleType } from '../../types';
import axios from 'axios';



// 排班颜色映射
const getScheduleColor = (type?: ScheduleType): string => {
  switch (type) {
    case 'day':
      return '#52c41a'; // 绿色 - 白班
    case 'night':
      return '#1890ff'; // 蓝色 - 夜班
    case 'dayCut':
      return '#ff18be'; // 蓝色 - 中班
    case 'fullDayOff':
      return '#ff4d4f'; // 红色 - 全天假
    case 'halfDayOff':
      return '#fa8c16'; // 橙色 -休息
    default:
      return 'transparent';
  }
};

const SchedulingPage: React.FC = () => {

    dayjs.locale('zh-cn')
  // 当前选中月份
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  
  // 筛选条件
  const [department, setDepartment] = useState<string>('');
  const [team, setTeam] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * 根据接口获取数据
   */
  const [scheduleData, setScheduleData] = useState<any[]>([]);

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
          const response = await axios.post<EmployeeSchedule>(
            '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getAllByYear',
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
            setCurrentPage(currentPage);
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

  // 筛选后的数据
  // const filteredData = useMemo(() => {
  //   fetchData
  //   return   scheduleData.filter((item) => {
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
  // }, [scheduleData, department, team, searchText]);

  // 分页后的数据
  // const paginatedData = useMemo(() => {
  //   const start = (currentPage - 1) * pageSize;
  //   return filteredData.slice(start, start + pageSize);
  // }, [filteredData, currentPage, pageSize]);

  // 获取当月所有日期列
  const dateColumns = useMemo(() => {
    const daysInMonth = selectedMonth.daysInMonth();
    const columns = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = selectedMonth.date(i);
      columns.push({
        title: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12 }}>{date.format('MM/DD')}</div>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>{date.format('ddd')}</div>
          </div>
        ),
        dataIndex: `date_${i}`,
        key: `date_${i}`,
        width: 60,
        align: 'center' as const,
        render: (_: unknown, record: EmployeeSchedule) => {
          const schedule = record.schedules[i - 1];
          if (!schedule || !schedule.schedule) {
            return <span style={{ color: '#d9d9d9' }}>-</span>;
          }
          const color = getScheduleColor(schedule.schedule.type);
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
                {schedule.schedule.label}
              </div>
            </Tooltip>
          );
        },
      });
    }
  debugger
    console.log("获取到当前列表展示的数据"+columns)
    return columns;
  }, [selectedMonth]);

  // 表格列定义
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

  // 处理月份变化
  const handleMonthChange = useCallback((date: Dayjs | null) => {
    if (date) {
      setSelectedMonth(date);
      setCurrentPage(1);
    }
  }, []);

  // 查询
  const handleSearch = useCallback(() => {
    // setCurrentPage(1);
    // message.success('查询成功');

      fetchData();
  }, []);

  // 重置
  const handleReset = useCallback(() => {
    setDepartment('');
    setTeam('');
    setSearchText('');
    setCurrentPage(1);
    message.info('已重置');
  }, []);

  // 保存
  const handleSave = useCallback(() => {
    setIsEditing(false);
    message.success('保存成功');
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
              排班日期
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
          <Legend />
        </Space>
      </Card>

      {/* 操作按钮区
      <Card
        size="small"
        style={{ borderRadius: 8 }}
        styles={{ body: { padding: '8px 16px' } }}
      >
        <Space>
          <Button
            type={isEditing ? 'primary' : 'default'}
            icon={<EditOutlined />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '编辑中' : '编辑'}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!isEditing}
          >
            保存
          </Button>
        </Space>
      </Card> */}

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
          scroll={{ x: 'max-content' }}
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

export default SchedulingPage;
