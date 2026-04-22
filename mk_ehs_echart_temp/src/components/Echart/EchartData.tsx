import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';

const colors = ['#5070dd', '#b6d634', '#505372'];

interface ChildProps {
  date1: number[];
  fdType: string[];
  date2: number[];
  legend: string[];
  name: string[];
}

const EchartData: React.FC<ChildProps> = ({ legend, fdType, date1, date2, name }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);

  // 使用 useMemo 缓存图表配置
  const chartOption = useMemo(() => {
    return {
      color: colors,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      grid: {
        left: '3%',    // 调整左边距
        right: '4%',   // 调整右边距
        bottom: fdType.length > 10 ? '15%' : '10%', // 根据标签数量调整底部间距
        containLabel: true
      },
      toolbox: {
        feature: {
          dataView: { show: true, readOnly: false },
          restore: { show: true },
          saveAsImage: { show: true }
        }
      },
      legend: {
        data: name,
        top: 'top' // 图例放在顶部
      },
      xAxis: [
        {
          type: 'category',
          axisTick: {
            alignWithLabel: true
          },
          data: fdType,
          // X 轴配置优化
          axisLabel: {
            interval: 0, // 强制显示所有标签
            rotate: fdType.length > 8 ? 45 : 0, // 标签过多时旋转45度
            margin: 8, // 标签与轴线的距离
            textStyle: {
              fontSize: 12,
              color: '#666'
            },
            // 标签格式化，过长时显示省略号
            formatter: (value: string) => {
              if (value.length > 8) {
                return value.substring(0, 8) + '...';
              }
              return value;
            }
          },
          axisLine: {
            lineStyle: {
              color: '#ccc'
            }
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: name[0],
          position: 'right',
          alignTicks: true,
          axisLine: {
            show: true,
            lineStyle: {
              color: colors[0]
            }
          },
          axisLabel: {
            formatter: '{value} '
          }
        },
        {
          type: 'value',
          name: name[1],
          position: 'left',
          alignTicks: true,
          axisLine: {
            show: true,
            lineStyle: {
              color: colors[2]
            }
          },
          axisLabel: {
            formatter: '{value} '
          }
        }
      ],
      series: [
        {
          name: name[0],
          type: 'bar',
          data: date2,
          label: {
            show: true,
            position: "top",
            formatter: '{c}' // 显示数值
          },
          barWidth: '60%' // 调整柱状图宽度
        },
        {
          name: name[1],
          type: 'line',
          yAxisIndex: 1,
          data: date1,
          label: {
            show: true,
            position: "top",
            formatter: '{c}'
          },
          symbol: 'circle', // 数据点样式
          symbolSize: 6,
          lineStyle: {
            width: 3
          }
        }
      ]
    };
  }, [fdType, date1, date2, name]);

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);
    setChartInstance(myChart);

    const handleResize = () => {
      myChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, []);

  // 更新图表数据
  useEffect(() => {
    if (chartInstance) {
      chartInstance.setOption(chartOption, true); // 添加 true 参数清除缓存
    }
  }, [chartInstance, chartOption]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '500px',
        minHeight: '400px',
        padding: '0 20px' // 添加内边距确保显示完整
      }}
    />
  );
};

export default EchartData;