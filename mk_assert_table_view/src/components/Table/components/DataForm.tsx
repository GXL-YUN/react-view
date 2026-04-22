// components/DataForm.tsx
import React from 'react';
import { Form, Input, Select, Button, Space } from 'antd';
import { TableItem } from '../types/table';

const { TextArea } = Input;
const { Option } = Select;

interface DataFormProps {
  record?: TableItem;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

const DataForm: React.FC<DataFormProps> = ({ record, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  // 初始化表单值
  React.useEffect(() => {
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
  }, [record, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        name="FD_SUBJECT"
        label="标题"
        rules={[{ required: true, message: '请输入标题' }]}
      >
        <Input placeholder="请输入标题" />
      </Form.Item>

      <Form.Item
        name="FD_NUMBER"
        label="编号"
        rules={[{ required: true, message: '请输入编号' }]}
      >
        <Input placeholder="请输入编号" />
      </Form.Item>

      <Form.Item
        name="FD_PROCESS_STATUS"
        label="状态"
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Select placeholder="请选择状态">
          <Option value="active">激活</Option>
          <Option value="inactive">未激活</Option>
          <Option value="pending">待处理</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="描述"
      >
        <TextArea 
          rows={4} 
          placeholder="请输入描述信息" 
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            {record ? '更新' : '创建'}
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default DataForm;