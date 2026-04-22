// components/SearchTable.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Input,
  Button,
  Space,
  Card,
  Tag,
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  message,
  Modal,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { TableItem, SearchParams, PaginationParams,TableData } from '../types/table';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SearchTableProps {
  onSearch: (params: SearchParams & PaginationParams) => Promise<TableData>;
  onAdd?: () => void;
  onEdit?: (record: TableItem) => void;
  onView?: (record: TableItem) => void;
  onDelete?: (record: TableItem) => Promise<void>;
  loading?: boolean
}

const SearchTable: React.FC<SearchTableProps> = ({
  onSearch,
  onAdd,
  onEdit,
  onView,
  onDelete,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [data, setData] = useState<TableItem[]>([]);
  const [pagination, setPagination] = useState<PaginationParams>({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 列定义
  const columns: ColumnsType<TableItem> = [
    {
      title: '编号',
      dataIndex: 'FD_NUMBER',
      key: 'FD_NUMBER',
      width: 120,
      sorter: true,
      render: (text: string) => (
        <span className="font-mono text-blue-600">{text}</span>
      )
    },
    {
      title: '标题',
      dataIndex: 'FD_SUBJECT',
      key: 'FD_SUBJECT',
      ellipsis: true,
      render: (text: string, record) => (
        <Tooltip title={text}>
          <span 
            className="cursor-pointer text-blue-500 hover:text-blue-700 hover:underline"
            onClick={() => handleView(record)}
          >
            {text}
          </span>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'FD_PROCESS_STATUS',
      key: 'FD_PROCESS_STATUS',
      width: 100,
      filters: [
        { text: '废弃', value: '00' },
        { text: '草稿', value: '10' },
        { text: '结束', value: '30' },
         { text: '待审', value: '20' },
        { text: '驳回', value: '11' },
          { text: '异常', value: '29' }
      ],
      render: (status: string) => {
        const statusConfig = {
          "00": { color: 'green', text: '废弃' },
          "10": { color: 'red', text: '草稿' },
          "30": { color: 'orange', text: '结束' },
          "20": { color: 'green', text: '待审' },
          "11": { color: 'red', text: '驳回' },
           "29": { color: 'red', text: '异常' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'FD_CREATE_TIME',
      key: 'FD_CREATE_TIME',
      width: 180,
      sorter: true,
        render: (text: string) => (
        <span className="font-mono text-blue-600">{text}</span>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'FD_LAST_MODIFIED_TIME',
      key: 'FD_LAST_MODIFIED_TIME',
      width: 180,
      sorter: true,
       render: (text: string) => (
        <span className="font-mono text-blue-600">{text}</span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {onView && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              查看
            </Button>
          )}
          {/* {onEdit && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )} */}
          {/* {onDelete && (
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          )} */}
        </Space>
      )
    }
  ];

  // 获取表格数据
  const fetchData = useCallback(async (params: SearchParams & PaginationParams) => {
    setTableLoading(true);
    try {
      const result = await onSearch(params);
      
      setData(result.list);
      setPagination(prev => ({
        ...prev,
        current: params.current,
        pageSize: params.pageSize,
        total: result.pagination.total
      }));
    } catch (error) {
      message.error('获取数据失败');
      console.error('Fetch data error:', error);
    } finally {
      setTableLoading(false);
    }
  }, [onSearch]);

  // // 初始加载数据
   useEffect(() => {

      // 方法1: 使用 URLSearchParams（现代浏览器支持）
    const useQuery = () => {
      return new URLSearchParams(window.location.search);
    };
     // eslint-disable-next-line react-hooks/rules-of-hooks
    const query = useQuery();
    const fdTmpId = query.get('fdTmpId');
    fetchData({
       ...searchParams,
       FD_TEMPLATE_ID:fdTmpId|| undefined,
       current: pagination.current,
       pageSize: pagination.pageSize,
      total: pagination.total ||0// ✅ 添加这行
     });
   }, []);

  // 处理搜索
  const handleSearch = (values: SearchParams) => {
    setSearchParams(values);

          // 方法1: 使用 URLSearchParams（现代浏览器支持）
    const useQuery = () => {
      return new URLSearchParams(window.location.search);
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const query = useQuery();
    const fdTmpId = query.get('fdTmpId');
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData({
      ...values,
      FD_TEMPLATE_ID:fdTmpId || undefined,
      current: 1,
      pageSize: pagination.pageSize,
      total: pagination.total ||0
    });
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    const resetParams = {};

    const useQuery = () => {
      return new URLSearchParams(window.location.search);
    };
     const query = useQuery();
    const fdTmpId = query.get('fdTmpId');

    setSearchParams(resetParams);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData({
      ...resetParams,
      current: 1,
        FD_TEMPLATE_ID:fdTmpId || undefined,
      pageSize: pagination.pageSize,
      total: pagination.total ||0
    });
  };

  // 处理表格变化（分页、排序、筛选）
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, any>,
    sorter: SorterResult<TableItem> | SorterResult<TableItem>[]
  ) => {
    const sortParams: any = {};
    
    if (sorter) {
      const sorterArray = Array.isArray(sorter) ? sorter : [sorter];
      sorterArray.forEach(item => {
        if (item.field && item.order) {
          sortParams[item.field as string] = item.order === 'ascend' ? 'asc' : 'desc';
        }
      });
    }

    const newPagination = {
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      total: pagination.total || 0
    };
    const useQuery = () => {
      return new URLSearchParams(window.location.search);
    };
     const query = useQuery();
    const fdTmpId = query.get('fdTmpId');

    setPagination(newPagination);
    
    fetchData({
      ...searchParams,
      ...filters,
      ...sortParams,
      FD_TEMPLATE_ID:fdTmpId || undefined,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: pagination.total ||0
    });
  };

  // 处理操作
  const handleView = (record: TableItem) => {
    // 使用示例
openNewWindow('/web/#/current/km-review/kmReviewMain/view/'+record.FD_ID+'?target=_blank');

    //onView?.(record);
  };
  const openNewWindow = (url: string, target: string = '_blank') => {
  window.open(url, target);
};


  const handleEdit = (record: TableItem) => {
    onEdit?.(record);
  };

  const handleDelete = (record: TableItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除"${record.FD_SUBJECT}"吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await onDelete?.(record);
          message.success('删除成功');
          // 重新加载数据
          fetchData({
            ...searchParams,
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total ||0
          });
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // 处理批量选择
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div className="search-table-container">
      <Card>
        {/* 搜索区域 */}
        <Form
          form={form}
          onFinish={handleSearch}
          className="search-form"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="title" label="标题">
                <Input 
                  placeholder="输入标题关键词" 
                  allowClear
                  prefix={<SearchOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="code" label="编号">
                <Input 
                  placeholder="输入编号" 
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="状态">
                <Select placeholder="选择状态" allowClear>
                  <Option value="00">废弃</Option>
                  <Option value="10">草稿</Option>
                  <Option value="30">结束</Option>
                   <Option value="20">待审</Option>
                    <Option value="11">驳回</Option>
                       <Option value="29">异常</Option>
                </Select>
              </Form.Item>
            </Col>
            {/* <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="timeRange" label="时间范围">
                <RangePicker 
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col> */}
          </Row>
          
          <Row gutter={[16, 16]} justify="end">
            <Col>
              <Space>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>

        {/* 操作区域 */}
        <div className="table-operations" style={{ marginBottom: 16 }}>
          <Space>
            {/* {onAdd && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={onAdd}
              >
                新增
              </Button>
            )} */}
            {hasSelected && (
              <span>
                已选择 {selectedRowKeys.length} 项
              </span>
            )}
          </Space>
        </div>

        {/* 表格区域 */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          loading={tableLoading || loading}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default SearchTable;