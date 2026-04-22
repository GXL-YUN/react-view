// pages/DemoPage.tsx
import React, { useState } from 'react';
import { Card, Form, Button, message } from 'antd';
import CategorySelect from './comper/CategorySelect';
import { CategoryItem, CategorySelectProps } from './ts/category';
// 模拟API接口函数
const mockFetchCategories = async (parentId?: string): Promise<CategoryItem[]> => {
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 根据parentId返回不同的数据
  if (!parentId) {
    // 第一级数据
    return [
      { FDID: '1', FDNAME: '电子产品' },
      { FDID: '2', FDNAME: '服装服饰' },
      { FDID: '3', FDNAME: '家用电器' },
    ];
  }
  
  if (parentId === '1') {
    // 电子产品下的二级
    return [
      { FDID: '1-1', FDNAME: '手机' },
      { FDID: '1-2', FDNAME: '电脑' },
      { FDID: '1-3', FDNAME: '平板' },
    ];
  }
  
  if (parentId === '1-1') {
    // 手机下的三级
    return [
      { FDID: '1-1-1', FDNAME: '苹果' },
      { FDID: '1-1-2', FDNAME: '华为' },
      { FDID: '1-1-3', FDNAME: '小米' },
    ];
  }
  
  if (parentId === '2') {
    // 服装服饰下的二级
    return [
      { FDID: '2-1', FDNAME: '男装' },
      { FDID: '2-2', FDNAME: '女装' },
      { FDID: '2-3', FDNAME: '童装' },
    ];
  }
  
  // 默认返回空数组
  return [];
};

const DemoPage: React.FC = () => {
  const [form] = Form.useForm();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('表单数据:', values);
      message.success('提交成功');
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCategoryChange = (value: string[]) => {
    setSelectedCategories(value);
    console.log('选择的类别:', value);
  };

  return (
    <div style={{ padding: 20 }}>
      <Card title="类别选择器示例">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ category: [] }}
        >
          <Form.Item
            label="商品类别"
            name="category"
            extra="支持多级联动选择"
          >
            <CategorySelect
              apiFunction={mockFetchCategories}
              value={selectedCategories}
              onChange={handleCategoryChange}
              placeholder="请选择商品类别"
            />
          </Form.Item>

          <div>
            <strong>当前选择的值：</strong>
            {selectedCategories.length > 0 
              ? selectedCategories.join(' → ')
              : '未选择'
            }
          </div>

          <Form.Item style={{ marginTop: 20 }}>
            <Button type="primary" onClick={handleSubmit}>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DemoPage;