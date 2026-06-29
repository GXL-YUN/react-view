import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/Header/Header';
import SchedulingPage from './pages/Scheduling/SchedulingPage';
import AttendanceReportPage from './pages/AttendanceReport/AttendanceReportPage';
import DailyShiftSchedule from './pages/DailyShiftSchedule/DailyShiftSchedule';

// nginx 子路径部署配置
const BASENAME = '/ekp_mkpass/mk_limi_table_view';

// Ant Design 全局配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

const App: React.FC = () => {
  return (

     <div >
      {/* 排班表 */}
      <SchedulingPage></SchedulingPage>

      {/* 统计表 */}
      {/*{<AttendanceReportPage></AttendanceReportPage>}*/}

       {/* 排班表 */}
       {/*{<DailyShiftSchedule></DailyShiftSchedule>}*/}
    </div>



    // <ConfigProvider theme={theme} locale={zhCN}>
    //   <BrowserRouter basename={BASENAME}>
    //     {/* <MainLayout> */}
    //       <Routes>
    //         <Route path="/" element={<Navigate to="/dashboard" replace />} />
    //         <Route path="/dashboard" element={<SchedulingPage />} />
    //         <Route path="/report" element={<AttendanceReportPage />} />
    //         {/* 其他页面暂时重定向到首页 */}
    //         <Route path="/workbench" element={<Navigate to="/dashboard" replace />} />
    //         <Route path="/cockpit" element={<Navigate to="/dashboard" replace />} />
    //         <Route path="/personnel" element={<Navigate to="/dashboard" replace />} />
    //         <Route path="/equipment" element={<Navigate to="/dashboard" replace />} />
    //         <Route path="/material" element={<Navigate to="/dashboard" replace />} />
    //         <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
    //         <Route path="/datacenter" element={<Navigate to="/dashboard" replace />} />
    //       </Routes>
    //     {/* </MainLayout> */}
    //   </BrowserRouter>
    // </ConfigProvider>
  );
};

export default App;
