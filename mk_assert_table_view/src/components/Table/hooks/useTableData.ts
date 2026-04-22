// hooks/useTableData.ts
import { useState, useCallback } from 'react';
import { TableItem, SearchParams, PaginationParams, TableData } from '../types/table';

interface UseTableDataProps {
  fetchData: (params: SearchParams & PaginationParams) => Promise<TableData>;
}

export const useTableData = ({ fetchData }: UseTableDataProps) => {
  debugger
  const [data, setData] = useState<TableItem[]>([]);
  const [pagination, setPagination] = useState<PaginationParams>({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async (params: SearchParams & PaginationParams) => {
    setLoading(true);
    try {
      const result = await fetchData(params);
      setData(result.list);
      setPagination(result.pagination);
      setSearchParams(params);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const handleSearch = useCallback((values: SearchParams) => {
    loadData({
      ...values,
      current: 1,
      pageSize: pagination.pageSize,
      total: 0,
    });
  }, [loadData, pagination.pageSize]);

  const handleReset = useCallback(() => {
    loadData({
      current: 1,
      pageSize: pagination.pageSize,
      total: 0
    });
  }, [loadData, pagination.pageSize]);

  const handleTableChange = useCallback((newPagination: PaginationParams) => {
    loadData({
      ...searchParams,
      ...newPagination
    });
  }, [loadData, searchParams]);

  return {
    data,
    pagination,
    loading,
    searchParams,
    handleSearch,
    handleReset,
    handleTableChange,
    loadData
  };
};