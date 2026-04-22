import React, { useRef, useEffect, useState, useCallback } from 'react';
import './App.css';
import HorizontalFilterPanel from "./components/Echart/HorizontalFilterPanel";
import EchartData from "./components/Echart/EchartData";


import TeamSoutree from "./components/Echart/TeamSoutree";
import TeamSoures from "./components/Echart/TeamSoures";
import request from './utils/request';

// 定义数据类型接口
interface ChartData {
  legend: string[];
  fdType: string[];
  date1: number[];
  date2: number[];
}

interface ApiResponse {
  status: number;
  data: {
    fdLegend: string[];
    fdType: string[];
    fdDate: number[];
    fdDate2: number[];
  };
  msg?: string;
}




function App() {
  // 使用统一的状态管理
  const [chartData, setChartData] = useState<ChartData>({
    legend: [],
    fdType: [],
    date1: [],
    date2: []
  });

   const [chartData2, setChartData2] = useState<ChartData>({
    legend: [],
    fdType: [],
    date1: [],
    date2: []
  });

   const [chartData3, setChartData3] = useState<ChartData>({
    legend: [],
    fdType: [],
    date1: [],
    date2: []
  });

  const name1: string[] = [
    "部门单据数量","部门完成率"

];
  const name2: string[] = [
    "部门已完成数量","部门完成率"

];

  const name3: string[] = [
    "课程已完成数量","课程完成率"

];
  
  const [loading, setLoading] = useState(false);

  // 图表点击事件处理
  const handleChartClick = useCallback((params: any) => {
    console.log('图表点击:', params);
    alert(`点击了: ${params.name}, 数值: ${params.value}`);
  }, []);

  // 封装数据加载函数 图一
  const loadChartData = useCallback(async (filterParams?: any) => {
    try {
      setLoading(true);
      
      const requestData = filterParams ? {
        ...filterParams,
      } : {
        page: 1,
        size: 10
      };

      const response: ApiResponse = await request.post('/Optimize/PhaseIIofEHS/Echart/', requestData);
      
      if (response.status === 0 && response.data) {
        const { fdLegend, fdType, fdDate ,fdDate2} = response.data;
        
        setChartData({
          legend: fdLegend || [],
          fdType: fdType || [],
          date1: fdDate || [],
          date2: fdDate2 ||[]
        });
        
        console.log('图表1数据加载成功:', response.data);
      } else {
        console.error('API返回状态异常:', response);
      }
    } catch (error) {
      console.error('加载图表1数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);






   // 封装数据加载函数图二
  const loadChartData2 = useCallback(async (filterParams?: any) => {
    try {
      setLoading(true);
      
      const requestData = filterParams ? {
        ...filterParams,
      } : {
        page: 1,
        size: 10
      };

      const response: ApiResponse = await request.post('/Optimize/PhaseIIofEHS/getEchartCouser/', requestData);
      
      if (response.status === 0 && response.data) {
        const { fdLegend, fdType, fdDate ,fdDate2} = response.data;
        
        setChartData2({
          legend: fdLegend || [],
          fdType: fdType || [],
          date1: fdDate2 || [],
          date2: fdDate ||[]
        });
        
        console.log('图表2数据加载成功:', response.data);
      } else {
        console.error('API返回状态异常:', response);
      }
    } catch (error) {
      console.error('加载图表2数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);




   // 封装数据加载函数图三
  const loadChartData3 = useCallback(async (filterParams?: any) => {
    try {
      setLoading(true);
      
      const requestData = filterParams ? {
        ...filterParams,
      } : {
        page: 1,
        size: 10
      };

      const response: ApiResponse = await request.post('/Optimize/PhaseIIofEHS/getCousorDeptDate/', requestData);
      
      if (response.status === 0 && response.data) {
        const { fdLegend, fdType, fdDate ,fdDate2} = response.data;
        
        setChartData3({
          legend: fdLegend || [],
          fdType: fdType || [],
          date1: fdDate || [],
          date2: fdDate2 ||[]
        });
        
        console.log('图表3数据加载成功:', response.data);
      } else {
        console.error('API返回状态异常:', response);
      }
    } catch (error) {
      console.error('加载图表3数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);



  // 初始加载数据
  useEffect(() => {
    loadChartData();
  }, [loadChartData]);
  

    useEffect(() => {
    loadChartData2();
  }, [loadChartData2]);


    useEffect(() => {
    loadChartData3();
  }, [loadChartData3]);

  // 筛选条件变化时的处理
  const handleFilterChange = useCallback((filterParams: any) => {
    console.log('筛选条件变化:', filterParams);
    loadChartData(filterParams);
  }, [loadChartData]);


  // 图二条件变化时的处理
  const handleFilterChange2 = useCallback((filterParams: any) => {
    console.log('筛选条件变化:', filterParams);
    loadChartData2(filterParams);
  }, [loadChartData2]);



  
  // 图三条件变化时的处理
  const handleFilterChange3 = useCallback((filterParams: any) => {
    console.log('筛选条件变化:', filterParams);
    loadChartData3(filterParams);
  }, [loadChartData3]);



  return (
    <div className="App">
      {/* 加载状态提示 */}
      {loading && (
        <div style={{ 
          padding: '10px', 
          textAlign: 'center', 
          background: '#f0f0f0',
          marginBottom: '10px'
        }}>
          数据加载中...
        </div>
      )}
      

      <div>
      <HorizontalFilterPanel onFilterChange={handleFilterChange} />
      
      <EchartData 
        legend={chartData.legend} 
        fdType={chartData.fdType} 
        date1={chartData.date1} 
        date2={chartData.date2}
        onChartClick={handleChartClick}
        name={name1}
  />
</div>
<div>
    <TeamSoures  onFilterChange={handleFilterChange2} />
      
      <EchartData 
        legend={chartData2.legend} 
        fdType={chartData2.fdType} 
        date1={chartData2.date1} 
        date2={chartData2.date2}
        onChartClick={handleChartClick}
        name={name2}
      />
    </div>
    


    <div>
   <TeamSoutree  onFilterChange={handleFilterChange3} />
      
      <EchartData 
        legend={chartData3.legend} 
        fdType={chartData3.fdType} 
        date1={chartData3.date2} 
        date2={chartData3.date1}
        onChartClick={handleChartClick}
        name={name3}
      />
    </div>
    
    
    
    </div>
  );
}

export default App;