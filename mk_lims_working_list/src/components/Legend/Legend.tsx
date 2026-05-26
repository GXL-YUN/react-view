import React from 'react';
import { Space } from 'antd';

interface LegendItem {
  color: string;
  label: string;
}

interface LegendProps {
  items?: LegendItem[];
}

const defaultLegendItems: LegendItem[] = [
  { color: '#52c41a', label: '白班' },
  { color: '#1890ff', label: '夜班' },
  { color: '#ff4d4f', label: '全天假' },
  { color: '#fa8c16', label: '半天假' },
];

const Legend: React.FC<LegendProps> = ({ items = defaultLegendItems }) => {
  return (
    <Space size={16}>
      {items.map((item, index) => (
        <Space key={index} size={4}>
          <div
            style={{
              width: 14,
              height: 14,
              background: item.color,
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, color: '#595959' }}>{item.label}</span>
        </Space>
      ))}
    </Space>
  );
};

export default Legend;
