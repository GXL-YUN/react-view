// 排班类型
export type ScheduleType = 'day' | 'night' | 'fullDayOff' | 'halfDayOff'|'dayCut';

// 排班状态
export interface ScheduleStatus {
  type: ScheduleType;
  label: string;
  time?: string; // 如 08:00-20:00
}

// 每日排班记录
export interface DailySchedule {
  date: string; // 日期 10/01
  dayOfWeek: string; // 周几
  schedule?: ScheduleStatus;
  detail?: string; // 详细班次信息
}

// 员工排班记录
export interface EmployeeSchedule {
  id: string;
  department: string;
  team: string;
  employeeId: string;
  name: string;
  requiredDays: number;
  actualDays: number;
  schedules: DailySchedule[];
}

// 考勤统计记录
export interface AttendanceRecord {
  id: string;
  department: string;
  team: string;
  employeeId: string;
  name: string;
  actualWorkHours: number;
  weekdayOvertime: number;
  weekendOvertime: number;
  holidayOvertime: number;
  leaveHours: number;
}

// 筛选条件
export interface FilterParams {
  dateRange: [string, string];
  department: string;
  team: string;
  searchText: string;
}

// 图例项
export interface LegendItem {
  color: string;
  label: string;
}

// 导航菜单项
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}
