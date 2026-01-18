import React, { useState, useMemo } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { DashboardStats, GraphDataPoint } from '../../types';
import Chart from 'react-apexcharts'; // Removed ApexOptions import
import { ApexOptions } from 'apexcharts'; // Assuming ApexOptions is from apexcharts directly

type DropdownOption = {
  value: string;
  label: string;
};

type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
};

const Dropdown: React.FC<DropdownProps> = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-500 focus:outline-none   focus:border-blue-500 "
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
  </div>
);

type Props = {
  type?: 'tickets' | 'tasks'; 
  data?: DashboardStats | null;
  filter?: string;
}

export const GraphComponent: React.FC<Props> = ({ 
  type = 'tickets', 
  data = null,
  // filter = 'today'
   filter = 'week' 
}) => {
  // const [viewMode, setViewMode] = useState('grouped');
  const [viewMode, setViewMode] = useState('line');

  const chartData = useMemo(() => {
    if (!data) return [];
    
    const graphData = type === 'tickets' ? data.ticket.graph : data.task.graph;
    
    // For today view, create a single bar chart showing totals
    if (filter === 'today') {
      const stats = type === 'tickets' ? data.ticket : data.task;
      return [
        { period: 'All', all: stats.all, closed: 0, unassigned: 0, breached: 0, resolved: 0 },
        { period: 'Closed', all: 0, closed: stats.closed, unassigned: 0, breached: 0, resolved: 0 },
        { period: 'Unassigned', all: 0, closed: 0, unassigned: stats.unassigned, breached: 0, resolved: 0 },
        { period: 'Breached', all: 0, closed: 0, unassigned: 0, breached: stats.breached, resolved: 0 },
        { period: 'Resolved', all: 0, closed: 0, unassigned: 0, breached: 0, resolved: stats.closed }
      ];
    }
    
    // For week, month, and range views, use the graph data directly
    // graphData should be an array - if empty, return empty array which will show "No data available"
    if (!graphData || graphData.length === 0) {
      return [];
    }
    
    return graphData.map(item => ({
      period: item.period,
      all: item.all,
      open: item.open,
      closed: item.closed,
      unassigned: item.unassigned,
      breached: item.breached,
      resolved: item.closed // Assuming 'closed' maps to 'resolved'
    }));
  }, [data, type, filter]);
  
  // Get summary stats
  const summaryStats = useMemo(() => {
    if (!data) return { all: 0, closed: 0, unassigned: 0, breached: 0 };
    
    return type === 'tickets' ? data.ticket : data.task;
  }, [data, type]);
  
  // View mode options
  const viewOptions = [
    { value: 'line', label: 'Line Chart' },
    { value: 'grouped', label: 'Grouped Bar' },
    { value: 'stacked', label: 'Stacked Bar' },
    { value: 'area', label: 'Area Chart' }
  ];
  
  // Color scheme
  const statusColors = {
    all: '#3b82f6',      // Blue
    open: '#fbbf24',     // Amber/Yellow for unresolved
    closed: '#6b7280',   // gray (used for resolved)
    unassigned: '#f97316', // Orange
    breached: '#ef4444',  // Red
    resolved: '#10b981'  // Green for resolved
  };

  // Get chart type and configuration based on view mode
  const getChartType = () => {
    switch(viewMode) {
      case 'line': return 'line';
      case 'area': return 'area';
      default: return 'bar';
    }
  };

  // ApexCharts configuration
  const chartOptions = useMemo<ApexOptions>(() => ({
    chart: {
      type: getChartType() as 'line' | 'area' | 'bar', // Cast to specific ApexCharts types
      height: 350,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      stacked: viewMode === 'stacked' || viewMode === 'area',
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      dropShadow: {
        enabled: viewMode === 'line' || viewMode === 'area',
        color: '#000',
        top: 0,
        left: 0,
        blur: 3,
        opacity: 0.1
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
         columnWidth: viewMode === 'grouped' ? '85%' : '60%',
        borderRadius: 6,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: [statusColors.all, statusColors.open, statusColors.closed, statusColors.unassigned, statusColors.breached, statusColors.resolved],
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: viewMode === 'line' ? [3, 3, 3, 3, 3, 3] : 
             viewMode === 'area' ? [0, 0, 0, 0, 0, 0] : [0],
      colors: viewMode === 'bar' || viewMode === 'grouped' || viewMode === 'stacked' ? ['transparent'] : undefined,
      curve: 'smooth',
      lineCap: 'round'
    },
    fill: {
      type: viewMode === 'area' ? 'gradient' : 'solid',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: [
          '#93c5fd', // light blue
          '#fcd34d', // light amber/yellow for unresolved
          '#cbd5e1', // light gray
          '#fed7aa', // light orange
          '#fca5a5', // light red
          '#a7f3d0'  // light green for resolved
                ],
                inverseColors: false,
                opacityFrom: 0.8,
                opacityTo: 0.1,
                stops: [0, 90, 100]
              },
              opacity: viewMode === 'area' ? 0.8 : 1
            },
            markers: {
              show: viewMode === 'line',
              size: viewMode === 'line' ? 5 : 0,
              colors: [statusColors.all, statusColors.open, statusColors.closed, statusColors.unassigned, statusColors.breached, statusColors.resolved],
              strokeColors: '#fff',
              strokeWidth: 2,
              strokeOpacity: 1,
              fillOpacity: 1,
              discrete: [] as unknown[],
              shape: 'circle',
              radius: 3,
              offsetX: 0,
              offsetY: 0,
              hover: {
                size: 7,
                sizeOffset: 2
              }
            } as ApexMarkers,
            xaxis: {
              categories: chartData.map(item => item.period),
              labels: {
                style: {
                  fontSize: '12px',
                  colors: '#6b7280',
                  fontWeight: 500
                },
                rotate: filter === 'today' ? 0 : -45,
                rotateAlways: false,
                hideOverlappingLabels: true
              },
              axisBorder: {
                show: false
              },
              axisTicks: {
                show: false
              },
              crosshairs: {
                show: viewMode === 'line' || viewMode === 'area',
                width: 1,
                position: 'back',
                opacity: 0.9,
                stroke: {
                  color: '#6b7280',
                  width: 1,
                  dashArray: 3
                }
              }
            } as ApexXAxis,
            yaxis: {
              labels: {
                style: {
                  fontSize: '12px',
                  colors: '#6b7280',
                  fontWeight: 500
                },
                formatter: function(val: number) {
                  return Math.floor(val).toString();
                }
              },
              axisBorder: {
                show: false
              },
              axisTicks: {
                show: false
              }
            } as ApexYAxis,
            grid: {
              show: true,
              borderColor: '#f1f5f9',
              strokeDashArray: 0,
              position: 'back',
              xaxis: {
                lines: {
                  show: false
                }
              },
              yaxis: {
                lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '13px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      offsetY: 8,
      labels: {
        colors: '#374151',
        useSeriesColors: false
      },
      markers: {
        width: 10,
        height: 10,
        radius: 6,
        offsetX: 0,
        offsetY: 0
      },
      itemMargin: {
        horizontal: 16,
        vertical: 8
      }
    },
    tooltip: {
      enabled: true,
      shared: viewMode === 'line' || viewMode === 'area',
      intersect: !(viewMode === 'line' || viewMode === 'area'),
      followCursor: viewMode === 'line' || viewMode === 'area',
      custom: function({ series, seriesIndex, dataPointIndex, w }: { series: number[][], seriesIndex: number, dataPointIndex: number, w: any }) {
        // Use chartData directly instead of w.globals.categoryLabels
        const period = chartData[dataPointIndex]?.period || 'Unknown';
        const seriesNames = ['All', 'Closed', 'Unassigned', 'Breached', 'Resolved'];
        const seriesColors = [statusColors.all, statusColors.closed, statusColors.unassigned, statusColors.breached, statusColors.resolved];
        
        if (viewMode === 'line' || viewMode === 'area') {
          // For line and area charts, show all series data
          let tooltipContent = `
            <div class="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
              <p class="font-semibold text-gray-900 mb-3 text-sm">${period}</p>`;
          
          series.forEach((seriesData: number[], index: number) => {
            const value = seriesData[dataPointIndex];
            const seriesName = seriesNames[index];
            const color = seriesColors[index];
            
            tooltipContent += `
              <div class="flex items-center justify-between gap-3 mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
                  <span class="text-sm text-gray-600">${seriesName}</span>
                </div>
                <span class="font-semibold text-gray-900 text-sm">${value}</span>
              </div>`;
          });
          
          tooltipContent += '</div>';
          return tooltipContent;
        } else {
          // For bar charts, show individual series data
          const value = series[seriesIndex][dataPointIndex];
          const seriesName = seriesNames[seriesIndex];
          const color = seriesColors[seriesIndex];
          
          return `
            <div class="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-lg">
              <p class="font-semibold text-gray-900 mb-2 text-sm">${period}</p>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
                <span class="text-sm text-gray-600">${seriesName}:</span>
                <span class="font-semibold text-gray-900 text-sm">${value}</span>
              </div>
            </div>`;
        }
      },
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      }
    },
    theme: {
      mode: 'light'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        plotOptions: {
          bar: {
            columnWidth: '80%'
          }
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  }), [chartData, viewMode, filter, statusColors]);

  // Prepare series data for ApexCharts
  const series = useMemo(() => {
    if (!chartData.length) return [];
    
    return [
      {
        name: 'All',
        data: chartData.map(item => item.all)
      },
      {
        name: 'Unresolved',
        data: chartData.map(item => item.open)
      },
      {
        name: 'Resolved',
        data: chartData.map(item => item.resolved)
      },
      {
        name: 'Unassigned',
        data: chartData.map(item => item.unassigned)
      },
      {
        name: 'Breached',
        data: chartData.map(item => item.breached)
      }
    ];
  }, [chartData]);

  // Show loading state if no data
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Filter className="text-gray-400" size={16} />
          <Dropdown
            value={viewMode}
            onChange={setViewMode}
            options={viewOptions}
          />
        </div>
      </div>
      {/* Chart */}
      <div className="h-96 mb-4">
        {chartData.length > 0 ? (
          <Chart
            options={chartOptions}
            series={series}
            type={getChartType()}
            height={350}
            width="100%"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg 
              className="w-12 h-12 mb-3 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              />
            </svg>
            <p className="text-sm font-medium">No data available</p>
          </div>
        )}
      </div>
      
      {/* Period label for the graph */}
      {filter === 'today' && (
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
        </div>
      )}
    </div>
  );
};
