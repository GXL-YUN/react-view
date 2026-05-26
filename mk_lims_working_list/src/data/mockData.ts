import dayjs from 'dayjs';
import type { EmployeeSchedule, AttendanceRecord, ScheduleType } from '../types';

// 生成指定月份的排班数据
export function generateMonthSchedule(year: number, month: number): EmployeeSchedule[] {
  const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
  const startDate = dayjs(`${year}-${month}-01`);
  
  // 模拟员工数据
  const employees = [
    { id: '00001', name: '李一', department: '部门一', team: '班组1' },
    { id: '00002', name: '李二', department: '部门一', team: '班组1' },
    { id: '00003', name: '张三', department: '部门一', team: '班组1' },
    { id: '00004', name: '李四', department: '部门一', team: '班组2' },
    { id: '00005', name: '王五', department: '部门一', team: '班组2' },
    { id: '00006', name: '赵六', department: '部门二', team: '班组1' },
    { id: '00007', name: '钱七', department: '部门二', team: '班组1' },
    { id: '00008', name: '孙八', department: '部门二', team: '班组2' },
  ];

  
  // 班次类型
  const scheduleTypes: { type: ScheduleType; label: string; time?: string }[] = [
    { type: 'day', label: '正常班' },
    { type: 'day', label: '长白班', time: '8-20' },
    { type: 'day', label: '长白班', time: '9-9' },
    { type: 'night', label: '夜班' },
    { type: 'night', label: '小夜班' },
    { type: 'fullDayOff', label: '年假' },
    { type: 'fullDayOff', label: '病假' },
    { type: 'fullDayOff', label: '事假' },
    { type: 'fullDayOff', label: '调休' },
    { type: 'halfDayOff', label: '半天假' },
  ];

  return employees.map((emp, empIndex) => {
    const schedules = [];
    let actualDays = 0;
    //根据人员编号生成该人员当月的排班记录
    for (let day = 1; day <= daysInMonth; day++) {
      
      const currentDate = startDate.date(day);
      const dateStr = currentDate.format('MM/DD');
      const dayOfWeek = currentDate.format('ddd');
      const dayOfWeekNum = currentDate.day();

      // 周末随机休息
      if (dayOfWeekNum === 0 || dayOfWeekNum === 6) {
        if (Math.random() > 0.5) {
          schedules.push({
            date: dateStr,
            dayOfWeek,
          });
          continue;
        }
      }

      // 根据员工索引生成不同的排班模式
      const scheduleIndex = (empIndex + day) % scheduleTypes.length;
      const selectedSchedule = scheduleTypes[scheduleIndex];

      // 计算实际出勤天数
      if (selectedSchedule.type === 'day' || selectedSchedule.type === 'night') {
        actualDays++;
      }

      schedules.push({
        date: dateStr,
        dayOfWeek,
        schedule: {
          type: selectedSchedule.type,
          label: selectedSchedule.label,
          time: selectedSchedule.time,
        },
        detail: selectedSchedule.time 
          ? `班次信息: ${selectedSchedule.time} ${selectedSchedule.label}`
          : `班次信息: ${selectedSchedule.label}`,
      });
    }


    return {
      id: emp.id,
      department: emp.department,
      team: emp.team,
      employeeId: emp.id,
      name: emp.name,
      requiredDays: daysInMonth,
      actualDays,
      schedules,
    };
  });
}

// 生成考勤统计数据
export function generateAttendanceReport(_year: number, _month: number): AttendanceRecord[] {
  const employees = [
    { id: '00001', name: '李一', department: '部门一', team: '班组1' },
    { id: '00002', name: '李二', department: '部门一', team: '班组1' },
    { id: '00003', name: '张三', department: '部门一', team: '班组1' },
    { id: '00004', name: '李四', department: '部门一', team: '班组2' },
    { id: '00005', name: '王五', department: '部门一', team: '班组2' },
    { id: '00006', name: '赵六', department: '部门二', team: '班组1' },
    { id: '00007', name: '钱七', department: '部门二', team: '班组1' },
    { id: '00008', name: '孙八', department: '部门二', team: '班组2' },
  ];

  return employees.map((emp) => {
    const baseHours = 176; // 标准月工作小时
    const actualWorkHours = baseHours + Math.floor(Math.random() * 40) - 10;
    const weekdayOvertime = Math.floor(Math.random() * 20);
    const weekendOvertime = Math.floor(Math.random() * 16);
    const holidayOvertime = Math.floor(Math.random() * 8);
    const leaveHours = Math.floor(Math.random() * 24);

    return {
      id: emp.id,
      department: emp.department,
      team: emp.team,
      employeeId: emp.id,
      name: emp.name,
      actualWorkHours,
      weekdayOvertime,
      weekendOvertime,
      holidayOvertime,
      leaveHours,
    };
  });
}

// 获取月份范围
export function getMonthRange(year: number, month: number): [string, string] {
  const start = dayjs(`${year}-${month}-01`);
  const end = start.endOf('month');
  return [
    start.format('YYYY/MM/DD'),
    end.format('YYYY/MM/DD'),
  ];
}
