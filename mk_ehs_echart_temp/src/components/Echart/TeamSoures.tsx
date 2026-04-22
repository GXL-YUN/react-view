import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  DatePicker, 
  Select, 
  Button,
  Space,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined,
  FilterOutlined 
} from '@ant-design/icons';
import type { SelectProps } from 'antd';
import dayjs from 'dayjs';
import request from '../../utils/request';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 类型定义
interface FilterParams {
  timeRange?: [string, string];
  fdDeptList?: string[];
  fdTypeList?: string[];
  searchKeyword?: string;
}

interface DistrictOption {
  value: string;
  label: string;
  deptId: string;
}

interface DistrictOptionType {
  value: string;
  label: string;
  typeId: string;
}

// // 类型选项数据（常量，不需要状态管理）
// const DISTRICT_OPTION_TYPE: DistrictOptionType[] = [
//   { value: '课程', label: '课程', typeId: '课程' }
 
// ];

interface ChildFormProps {
  onFilterChange: (data: FilterParams) => void;
  loading?: boolean;
}

const TeamSoures: React.FC<ChildFormProps> = ({ 
  onFilterChange, 
  loading = false 
}) => {
  const [filterParams, setFilterParams] = useState<FilterParams>({});// 请求参数
  const [districtSearch, setDistrictSearch] = useState<string>('');//搜索参数
  const [districtSearchType, setDistrictSearchType] = useState<string>('');
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);//部门参数

  const [optionsLoading, setOptionsLoading] = useState<boolean>(false);//状态
const [DISTRICT_OPTION_TYPE, setDistrictOptionType] = useState<DistrictOption[]>([]);//课程参数

  // 初始化部门数据
  useEffect(() => {
    const loadDepartmentData = async () => {
      try {
        setOptionsLoading(true);
        const response = await request.get('/Optimize/PhaseIIofEHS/User/getDept/');
        
        if (response.status === 0 && response.data) {
          const departmentData: DistrictOption[] = Array.isArray(response.data) 
            ? response.data 
            : [];
          
          setDistrictOptions(departmentData);
        //  message.success('部门数据加载成功');
        } else {
          message.warning('部门数据加载失败');
        }
      } catch (error) {
        console.error('加载部门数据失败:', error);
        message.error('部门数据加载失败');
      } finally {
        setOptionsLoading(false);
      }
    };
    
    loadDepartmentData();
  }, []);


    useEffect(() => {
    const loadDepartmentData = async () => {
      try {
        setOptionsLoading(true);
        const response = await request.get('/Optimize/PhaseIIofEHS/getCouorAll/');
        
        if (response.status === 0 && response.data) {
          const departmentData: DistrictOption[] = Array.isArray(response.data) 
            ? response.data 
            : [];
          
          setDistrictOptionType(departmentData);
         // message.success('课程数据加载成功');
        } else {
          message.warning('课程数据加载失败');
        }
      } catch (error) {
        console.error('加载课程数据失败:', error);
        message.error('课程数据加载失败');
      } finally {
        setOptionsLoading(false);
      }
    };
    
    loadDepartmentData();
  }, []);

  // 处理时间范围变化
  const handleTimeRangeChange = useCallback((
    dates: null | (dayjs.Dayjs | null)[],
    dateStrings: string[]
  ) => {
    setFilterParams(prev => ({
      ...prev,
      timeRange: dateStrings as [string, string]
    }));
  }, []);

  // 处理部门选择变化
  const handleDistrictChange = useCallback((values: string[]) => {
    setFilterParams(prev => ({
      ...prev,
      fdDeptList: values
    }));
  }, []);

  // 处理课程变化
  const handleTypeChange = useCallback((values: string[]) => {
    setFilterParams(prev => ({
      ...prev,
      fdName: values
    }));
  }, []);

  // 模糊匹配过滤部门选项
  const filteredDistrictOptions = useMemo(() => {
    if (!districtSearch) return districtOptions;
    
    const searchLower = districtSearch.toLowerCase();
    return districtOptions.filter(item =>
      item.label.toLowerCase().includes(searchLower) ||
      item.deptId.toLowerCase().includes(searchLower) ||
      item.value.toLowerCase().includes(searchLower)
    );
  }, [districtSearch, districtOptions]);

  // 模糊匹配过滤类型选项
  const filteredDistrictOptionsType = useMemo(() => {
    if (!districtSearchType) return DISTRICT_OPTION_TYPE;
    
    const searchLower = districtSearchType.toLowerCase();
    return DISTRICT_OPTION_TYPE.filter(item =>
      item.label.toLowerCase().includes(searchLower) ||
      item.deptId.toLowerCase().includes(searchLower) ||
      item.value.toLowerCase().includes(searchLower)
    );
  }, [DISTRICT_OPTION_TYPE]);

  // 处理部门搜索输入
  const handleDistrictSearch = useCallback((value: string) => {
    setDistrictSearch(value);
  }, []);

  // 处理类型搜索输入
  const handleDistrictSearchType = useCallback((value: string) => {
    setDistrictSearchType(value);
  }, []);

  // 重置筛选条件
  const handleReset = useCallback(() => {
    setFilterParams({});
    setDistrictSearch('');
    setDistrictSearchType('');
    onFilterChange({}); // 通知父组件重置
    message.info('筛选条件已重置');
  }, [onFilterChange]);

  // 提交筛选
  const handleSearch = useCallback(() => {
    onFilterChange(filterParams);
    console.log('筛选参数:', filterParams);
    message.success('查询成功');
  }, [filterParams, onFilterChange]);

  // 渲染选择数量提示
  const renderSelectionCount = () => {
    const counts = [];
    
    if (filterParams.fdDeptList?.length) {
      counts.push(`部门: ${filterParams.fdDeptList.length}个`);
    }
    
    if (filterParams.fdTypeList?.length) {
      counts.push(`类型: ${filterParams.fdTypeList.length}个`);
    }
    
    if (filterParams.timeRange) {
      counts.push('时间范围已设置');
    }

    return counts.length > 0 ? (
      <div style={{ 
        marginBottom: 16, 
        padding: '8px 12px', 
        background: '#f0f8ff', 
        borderRadius: 4,
        fontSize: 12,
        color: '#1890ff'
      }}>
        已选择: {counts.join(' | ')}
      </div>
    ) : null;
  };

  // Select 组件通用配置
  const selectProps: Partial<SelectProps> = {
    mode: 'multiple' as const,
    style: { width: '100%' },
    filterOption: false,
    allowClear: true,
    maxTagCount: 'responsive' as const,
    maxTagTextLength: 10,
    loading: optionsLoading
  };

    const selectProps2: Partial<SelectProps> = {

    style: { width: '100%' },
    filterOption: false,
    allowClear: true,
    maxTagCount: 'responsive' as const,
    maxTagTextLength: 10,
    loading: optionsLoading
  };

  return (
    <div>
    <Card 
      title={
        <Space>
          <FilterOutlined />
          课程数据数据筛选
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
      extra={
        <Space>
          <Button 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            重置
          </Button>
        </Space>
      }
    >

      
      {/* 筛选表单 */}
      <Row gutter={[16, 16]} align="middle">
        {/* <Col xs={24} sm={12} md={6}>
          <div>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666', fontWeight: 500 }}>
              时间范围
            </div>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
              onChange={handleTimeRangeChange}
              value={filterParams.timeRange ? [
                dayjs(filterParams.timeRange[0]),
                dayjs(filterParams.timeRange[1])
              ] as [dayjs.Dayjs, dayjs.Dayjs] : undefined}
              format="YYYY-MM-DD"
            />
          </div>
        </Col> */}
                <Col xs={24} sm={12} md={6}>
          <div>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666', fontWeight: 500 }}>
              课程类型选择
            </div>
            <Select
              {...selectProps2}
              placeholder="请选择类型"
              value={filterParams.fdTypeList}
              onChange={handleTypeChange}
              showSearch
              onSearch={handleDistrictSearchType}
              optionFilterProp="children"
            >
              {filteredDistrictOptionsType.map(item => (
                <Option key={item.deptId} value={item.deptId}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666', fontWeight: 500 }}>
              部门选择
            </div>
            <Select
              {...selectProps}
              placeholder="请选择部门"
              value={filterParams.fdDeptList}
              onChange={handleDistrictChange}
              showSearch
              onSearch={handleDistrictSearch}
              optionFilterProp="children"
            >
              {filteredDistrictOptions.map(item => (
                <Option key={item.deptId} value={item.deptId}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>
        </Col>


        
        <Col xs={24} sm={12} md={6}>
          <Space style={{ marginTop: 24 }}>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
              style={{ minWidth: 80 }}
            >
              查询
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleReset}
              style={{ minWidth: 80 }}
            >
              重置
            </Button>
          </Space>
        </Col>
      </Row>
    </Card></div>
  );
};

export default TeamSoures;