import type { TagProps } from 'antd';

export interface PersonnelData {
  id: string;
  name: string;
  type: 'personnel';
  fdOrgType: string;
  employeeId: string;
  orgPath: string;
  fdLoginName: string;
  fdEmployeeNo: string;
  fdId: string;
  fdName: string;
  fdUserId: string;
  fdParentId: string;
  fdIsAvailable: number;
  value: string;
  label: string;
  rawData: {
    fdIsAvailable: number;
    fdOrgType: string;
    fdId: string;
    fdParentId: string;
    value: string;
    label: string;
    fdEmployeeNo: string;
    fdUserId: string;
    fdLoginName: string;
    departmentName: string;
    fdName: string;
    type: 'personnel';
  };
}

export interface PersonnelTagsProps {
  data: SelectedItem[];
  tagProps?: TagProps;
  maxCount?: number; // 最多显示多少个标签，超出显示+更多
}



export interface SelectedItem {
  id: string;                    // 唯一标识（人员：fdUserId，部门/群组/岗位：value）
  name: string;                  // 显示名称（人员：姓名，部门/群组/岗位：名称）
  type: 'department' | 'personnel' | 'group' | 'position';  // 类型
  fdOrgType: string;             // 组织类型标识：2=部门，8=人员，16=群组，4=岗位
  employeeId?: string;           // 员工工号（仅人员类型有）
  orgPath?: string;              // 组织路径（完整路径）
  // 原始API返回的额外字段（可选）
  fdLoginName?: string;         // 登录名
  fdEmployeeNo?: string;         // 员工编号
  fdNo?: string;                 // 编号
  fdId?: string;                 // 数据ID
  fdName?: string;               // 名称
  fdUserId?: string;             // 用户ID（人员类型）
  fdParentId?: string;           // 父级ID
  rawData?: Record<string, any>; // 原始API返回的完整数据
}