

import type { TagProps } from 'antd';

/**
 * 组件涉及到数据  接口声明   类型声明   数据声明
 * 
 */
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
// 定义接口类型
 export interface LimsData {
  // 基础字段
  RN?: number;
  FD_URL?: string;
  fdId?: string;
  
  // FD_ 前缀字段
  FD_ID?: string;
  FD_CREATOR_ID?: string;
  FD_COL_SYR_NAME?: string | null;
  FD_COL_SYBM_ID?: string | null;
  FD_COL_ZCGLBM_ID?: string;
  FD_COL_ZCGLY_NAME?: string;
  FD_COL_ZHXGR_ID?: string;
  FD_COL_ZCYZ?: number;
  FD_OWNER_NAME?: string;
  FD_COL_ZZJGDM?: string | null;
  FD_COL_ZVBH?: string;
  FD_ALTER_ID?: string | null;
  FD_COL_XCWBRQ?: string | null;
  FD_COL_ZCGLY_ID?: string;
  FD_COL_RKRQ?: string | null;
  FD_PUBLISHED_TIME?: string | null;
  FD_CREATE_TIME?: string;
  FD_CREATOR_DEPT_NAME?: string | null;
  FD_CREATOR_DEPT_ID?: string | null;
  FD_COL_SFDQWB?: string | null;
  FD_COL_WZSFKYD?: string | null;
  FD_COL_CGRQ?: string;
  FD_PROCESS_TEMPLATE_ID?: string | null;
  FD_COL_ZCZT?: string;
  FD_COL_ZHXGR_NAME?: string;
  FD_COL_SYR_ID?: string | null;
  FD_XFORM_ID?: string;
  FD_COL_SGDH?: string;
  FD_COL_JLDW?: string;
  FD_COL_GGXH?: string;
  FD_COL_CGR_NAME?: string;
  FD_OWNER_DEPT_NAME?: string | null;
  FD_COL_SYNXY?: string | null;
  FD_COL_SSFZCBM?: string | null;
  FD_ALTER_NAME?: string | null;
  FD_COL_ZCXZSZT?: string | null;
  FD_COL_SYBM_NAME?: string | null;
  FD_COL_CJR_NAME?: string;
  FD_VERSION?: string;
  FD_COL_KSSYRQ?: string | null;
  FD_COL_SFYYS?: string | null;
  FD_COL_CJR_ID?: string;
  FD_OWNER_ID?: string;
  FD_DOC_STATUS?: string | null;
  FD_DELETED?: number;
  FD_COL_ZCGLBM_NAME?: string;
  FD_COL_ZCMC?: string;
  FD_COL_CGR_ID?: string;
  FD_COL_RKDH?: string | null;
  FD_LAST_MODIFIED_TIME?: string;
  FD_COL_WSYZ?: number;
  FD_CREATOR_NAME?: string;
  FD_COL_ZHXGSJ?: string;
  FD_COL_BXQY?: string | null;
  FD_COL_CJSJ?: string;
  FD_COL_ZCXLH?: string | null;
  FD_COL_PZSM?: string | null;
  FD_ALTER_TIME?: string | null;
  FD_COL_SFXZBYS?: string | null;
  FD_COL_ZBYSZT?: string | null;
  FD_DOC_SUBJECT?: string;
  FD_COL_ZCTP?: string;
  FD_OWNER_DEPT_ID?: string | null;
  FD_COL_ZCJYZT?: string | null;
  
  // AUTH_ 前缀字段
  AUTH_READER_FLAG?: number;
  AUTH_ATT_NOPRINT?: number;
  AUTH_ATT_NOCOPY?: number;
  AUTH_ATT_NODOWNLOAD?: number;
  AUTH_CHANGE_READER?: string | null;
  AUTH_CHANGE_EDITOR?: string | null;
  AUTH_RBP?: number;
  
  // 其他业务字段
  FD_COL_H33JFF?: string | null;
  FD_COL_PDRW?: string | null;
  FD_COL_PDR_NAME?: string | null;
  FD_COL_GYSMC?: string | null;
  FD_COL_PDSJ?: string | null;
  FD_COL_PDR_ID?: string | null;
  FD_COL_RW4FNJ?: string | null;
  FD_COL_ZCGLLX?: string;
  FD_COL_2Q4BI3?: string;
  FD_COL_ADDRESS_TYPE?: string | null;
  FD_COL_TYPE?: string | null;
  FD_COL_EIOSWJ?: string | null;
  FD_COL_XLJ0IU?: string;
  FD_COL_OZNL1H?: string;
  FD_COL_KR7WM8?: string | null;

}

export interface ApiResponse {
    status: number;
    msg: string;
    data: {
        total: number;
        size: number;
        current: number;
        list: LimsData[];
    };
}

export interface FilterState {
    key: string;
    value: any;
    type: string
}
