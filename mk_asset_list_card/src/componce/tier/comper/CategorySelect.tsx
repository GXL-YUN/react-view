// components/CategorySelect/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Select, Spin, Empty } from 'antd';
import { CategoryItem, CategorySelectProps } from '../ts/category';

const { Option } = Select;

const CategorySelect: React.FC<CategorySelectProps> = ({
  value = [],
  onChange,
  placeholder = '请选择类别',
  apiFunction,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<CategoryItem[][]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>(value);

  // 加载初始数据（根节点）
  useEffect(() => {
    loadOptions();
  }, []);

  // 监听value变化
  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  // 加载选项数据
  const loadOptions = useCallback(async (parentId?: string, level: number = 0) => {
    try {
      setLoading(true);
      const data = await apiFunction(parentId);
      
      // 如果数据为空，不再添加新选项
      if (data.length === 0) {
        setOptions(prev => {
          const newOptions = [...prev];
          // 清空后续层级的选项
          newOptions.splice(level);
          return newOptions;
        });
        return;
      }

      setOptions(prev => {
        const newOptions = [...prev];
        newOptions[level] = data;
        // 清空后续层级的选项
        newOptions.splice(level + 1);
        return newOptions;
      });
    } catch (error) {
      console.error('加载类别数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  // 处理选择变化
  const handleChange = async (selectedValue: string, index: number) => {
    const newValues = [...selectedValues];
    newValues[index] = selectedValue;
    // 清空后续层级的选择
    newValues.splice(index + 1);
    
    setSelectedValues(newValues);
    
    // 加载下一层级的数据
    if (selectedValue) {
      await loadOptions(selectedValue, index + 1);
    } else {
      // 如果清空了当前选择，清空后续层级
      setOptions(prev => {
        const newOptions = [...prev];
        newOptions.splice(index + 1);
        return newOptions;
      });
    }
    
    onChange?.(newValues);
  };

  // 获取当前选择的显示文本
  const getDisplayValue = () => {
    return selectedValues.filter(Boolean);
  };

  // 渲染选择器
  const renderSelects = () => {
    const selects = [];
    
    for (let i = 0; i <= options.length; i++) {
      const levelOptions = options[i] || [];
      const currentValue = selectedValues[i] || '';
      
      selects.push(
        <Select
          key={i}
          value={currentValue}
          onChange={(value) => handleChange(value as string, i)}
          placeholder={i === 0 ? placeholder : `请选择${i + 1}级类别`}
          style={{ width: 150, marginRight: 8 }}
          loading={loading && i === options.length - 1}
          disabled={disabled || (i > 0 && !selectedValues[i - 1])}
          notFoundContent={loading ? <Spin size="small" /> : <Empty description="暂无数据" />}
        >
          <Option value="">全部</Option>
          {levelOptions.map(item => (
            <Option key={item.FDID} value={item.FDID}>
              {item.FDNAME}
            </Option>
          ))}
        </Select>
      );
    }
    
    return selects;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {renderSelects()}
    </div>
  );
};

export default CategorySelect;