import React from 'react';
import { Tag, Space } from 'antd';
import type { TagProps } from 'antd';

import {PersonnelData,PersonnelTagsProps} from  "./PersonnelTags"

const PersonnelTagsIndex: React.FC<PersonnelTagsProps> = ({
  data,
  tagProps = {},
  maxCount
}) => {
  // 如果指定了最大显示数量，进行截取
  const displayData = maxCount && data.length > maxCount 
    ? data.slice(0, maxCount) 
    : data;
  const remainingCount = maxCount && data.length > maxCount 
    ? data.length - maxCount 
    : 0;

  return (
    <Space wrap size={[8, 8]}>
      {displayData.map((person) => (
        <Tag
          key={person.id}
          color="blue"
          {...tagProps}
        >
          {person.fdName}
        </Tag>
      ))}
      {remainingCount > 0 && (
        <Tag color="default">
          +{remainingCount} 更多
        </Tag>
      )}
    </Space>
  );
};
export default PersonnelTagsIndex;