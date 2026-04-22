// pages/DataTablePage.tsx
import React, { useState } from 'react';
import { message, Modal } from 'antd';
import SearchTable from './components/SearchTable';
import DataForm from './components/DataForm';
import { TableItem, SearchParams, PaginationParams, TableData } from './types/table';

// 模拟数据服务
const mockDataService = {
  async fetchData(params: SearchParams & PaginationParams): Promise<TableData> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    // 定义有效的状态映射

    // 模拟数据
    const mockData: TableItem[] = Array.from({ length: 100 }, (_, i) => ({
       FD_ID: `item-${i + 1}`,
       FD_SUBJECT: `测试项目 ${i + 1}`,
       FD_NUMBER: `CODE-${String(i + 1).padStart(4, '0')}`,
       FD_PROCESS_STATUS: "10",
       FD_CREATE_TIME: new Date(Date.now() - i * 10000000).toISOString(),
       FD_LAST_MODIFIED_TIME: new Date(Date.now() - i * 5000000).toISOString(),
       description: `这是第 ${i + 1} 个测试项目的描述信息`
    }));

    // 模拟搜索过滤
    let filteredData = mockData;
    
    if (params.title) {
      filteredData = filteredData.filter(item =>
        //item.FD_SUBJECT.toLowerCase().includes(params.title!.toLowerCase())
      item.FD_SUBJECT?.toLowerCase().includes(params.title!.toLowerCase()) ?? false
      );
    }
    
    if (params.code) {
      filteredData = filteredData.filter(item => 
        //item.FD_NUMBER.includes(params.code!)
      item.FD_NUMBER?.includes(params.code!.toLowerCase()) ?? false
      );
    }
    
    if (params.status) {
      filteredData = filteredData.filter(item => 
        item.FD_PROCESS_STATUS === params.status
      );
    }

    // 分页
    const start = (params.current - 1) * params.pageSize;
    const end = start + params.pageSize;
    const pagedData = filteredData.slice(start, end);

    return {
      list: pagedData,
      pagination: {
        current: params.current,
        pageSize: params.pageSize,
        total: filteredData.length
      }
    };
  },

  async deleteItem(id: string | undefined): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('删除项目:', id);
  }
};

const DataTablePage: React.FC = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TableItem | undefined>();
  const [viewVisible, setViewVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<TableItem | undefined>();
  const [loading, setLoading] = useState(false);

  // 处理搜索
  const handleSearch = async (params: SearchParams & PaginationParams): Promise<TableData> => {
    setLoading(true);
    try {
      const result = await mockDataService.fetchData(params);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // 处理新增
  const handleAdd = () => {
    setEditingRecord(undefined);
    setFormVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: TableItem) => {
    setEditingRecord(record);
    setFormVisible(true);
  };

  // 处理查看
  const handleView = (record: TableItem) => {
    setViewingRecord(record);
    setViewVisible(true);
  };

  // 处理删除
  const handleDelete = async (record: TableItem) => {
    await mockDataService.deleteItem(record.FD_ID);
  };

  // 处理表单提交
  const handleFormSubmit = (values: any) => {
    console.log('表单提交:', values);
    message.success(editingRecord ? '编辑成功' : '新增成功');
    setFormVisible(false);
    // 这里可以触发数据重新加载
  };

  return (
    <div className="data-table-page">
      <SearchTable
        onSearch={handleSearch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* 新增/编辑表单模态框 */}
      <Modal
        title={editingRecord ? '编辑项目' : '新增项目'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <DataForm
          record={editingRecord}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormVisible(false)}
        />
      </Modal>

      {/* 查看详情模态框 */}
      <Modal
        title="项目详情"
        open={viewVisible}
        onCancel={() => setViewVisible(false)}
        footer={null}
        width={600}
      >
        {viewingRecord && (
          <div className="view-content">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>编号:</strong> {viewingRecord.FD_NUMBER}</div>
              <div><strong>状态:</strong> 
                <span className={`status-${viewingRecord.FD_PROCESS_STATUS} ml-2`}>
                  {/*{viewingRecord.FD_PROCESS_STATUS === 'active' ? '激活' :*/}
                  {/* viewingRecord.FD_PROCESS_STATUS === 'inactive' ? '未激活' : '待处理'}*/}
                </span>
              </div>
              <div className="col-span-2"><strong>标题:</strong> {viewingRecord.FD_SUBJECT}</div>
              <div className="col-span-2">
                <strong>描述:</strong> 
                <p className="mt-2 text-gray-600">{viewingRecord.description}</p>
              </div>
              <div><strong>创建时间:</strong>{viewingRecord.FD_CREATE_TIME}</div>
              <div><strong>更新时间:</strong> {viewingRecord.FD_LAST_MODIFIED_TIME}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataTablePage;