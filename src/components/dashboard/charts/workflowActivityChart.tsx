'use client';

import React, { useMemo, memo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Clock, Zap, RotateCcw } from 'lucide-react';

// Dynamically import heavy charting library only on client side
const BarChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
});

// Import chart.js components only on client side
useEffect(() => {
  const initChart = async () => {
    const ChartJS = await import('chart.js');
    const CategoryScale = await import('chart.js').then(mod => mod.CategoryScale);
    const LinearScale = await import('chart.js').then(mod => mod.LinearScale);
    const BarElement = await import('chart.js').then(mod => mod.BarElement);
    const Title = await import('chart.js').then(mod => mod.Title);
    const Tooltip = await import('chart.js').then(mod => mod.Tooltip);
    const Legend = await import('chart.js').then(mod => mod.Legend);
    
    ChartJS.Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
  };
  
  if (typeof window !== 'undefined') {
    initChart();
  }
}, []);

interface WorkflowActivityItem {
  label: string;
  value: number;
  completed?: number;
  inProgress?: number;
  date?: string;
  total?: number;
}

interface WorkflowActivityChartProps {
  projectId?: string;
  className?: string;
  showLabels?: boolean;
  timeframe?: 'week' | 'month';
  loading?: boolean;
  data?: WorkflowActivityItem[];
}

export default memo(function WorkflowActivityChart({
  projectId,
  className = '',
  showLabels = true,
  timeframe: initialTimeframe = 'week',
  loading = false,
  data: providedData
}: WorkflowActivityChartProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeframe, setTimeframe] = useState<'week' | 'month'>(initialTimeframe);
  const [workflowData, setWorkflowData] = useState<WorkflowActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const fetchWorkflowData = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get data from sessionStorage first
        const cacheKey = `workflow-${projectId}-${timeframe}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const cacheTimestamp = sessionStorage.getItem(`${cacheKey}-timestamp`);
        
        if (cachedData && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          // Use cached data if it's less than 5 minutes old
          if (age < 5 * 60 * 1000) {
            setWorkflowData(JSON.parse(cachedData));
            setIsLoading(false);
            return;
          }
        }
        
        // First try the combined endpoint for better performance
        const response = await fetch(`/api/dashboard/${projectId}/combined`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Use the appropriate timeframe data
          const rawData = timeframe === 'week' ? data.workflow.week : data.workflow.month;
          
          // Transform the data to match the expected format
          const transformedData = rawData.map((item: any) => ({
            label: item.date,
            value: item.total,
            completed: item.completed,
            inProgress: item.inProgress
          }));
          
          // Cache the data
          sessionStorage.setItem(cacheKey, JSON.stringify(transformedData));
          sessionStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
          
          setWorkflowData(transformedData);
        } else {
          // Fallback to individual endpoint if combined fails
          const response = await fetch(`/api/dashboard/${projectId}/workflow-stats?timeframe=${timeframe}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch workflow data');
          }
          
          const rawData = await response.json();
          
          // Transform the data to match the expected format
          const transformedData = rawData.map((item: any) => ({
            label: item.date,
            value: item.total,
            completed: item.completed,
            inProgress: item.inProgress
          }));
          
          // Cache the data
          sessionStorage.setItem(cacheKey, JSON.stringify(transformedData));
          sessionStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
          
          setWorkflowData(transformedData);
        }
      } catch (err) {
        console.error('Error fetching workflow data:', err);
        setError('Failed to load workflow data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflowData();
  }, [projectId, timeframe]);

  const handlePreviousPeriod = () => {
    if (timeframe === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleNextPeriod = () => {
    if (timeframe === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const toggleTimeframe = () => {
    setTimeframe((prev) => (prev === 'week' ? 'month' : 'week'));
    setCurrentDate(new Date());
  };

  // Use providedData or fetched data
  const data = useMemo(() => {
    if (providedData) {
      return providedData;
    }
    return workflowData;
  }, [providedData, workflowData]);

  const chartData = useMemo(() => {
    return {
      labels: data.map((item: WorkflowActivityItem) => item.label),
      datasets: [
        {
          label: 'Completed',
          data: data.map((item: WorkflowActivityItem) => item.completed || 0),
          backgroundColor: timeframe === 'week' 
            ? 'rgba(34, 197, 94, 0.8)'
            : 'rgba(34, 197, 94, 0.8)',
          borderColor: timeframe === 'week' ? '#22c55e' : '#22c55e',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'In Progress',
          data: data.map((item: WorkflowActivityItem) => item.inProgress || 0),
          backgroundColor: timeframe === 'week' 
            ? 'rgba(251, 191, 36, 0.8)'
            : 'rgba(251, 191, 36, 0.8)',
          borderColor: timeframe === 'week' ? '#fbbf24' : '#fbbf24',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }
      ],
    };
  }, [data, timeframe]);

  const options: any = useMemo(() => {
    const maxValue = Math.max(...data.map((item: WorkflowActivityItem) => item.value));

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'rect',
            padding: 20,
            font: { size: 12, weight: 500 },
            color: '#64748b',
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            title: (context: any) => {
              const label = context[0].label;
              if (timeframe === 'week') {
                return `${label} (${currentDate.toLocaleString('default', { weekday: 'long', month: 'short', day: 'numeric' })})`;
              } else {
                return `Week ${label} (${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
              }
            },
            label: (context: any) => `${context.dataset.label}: ${context.parsed.y} tasks`,
            footer: (context: any) => 'Units: Tasks',
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.ceil(maxValue * 1.2),
          stacked: false,
          title: {
            display: true,
            text: 'Tasks',
            color: '#64748b',
            font: { size: 12, weight: 'bold' },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
            drawBorder: false,
          },
          ticks: {
            stepSize: Math.ceil(maxValue / 5),
            color: '#64748b',
            font: { size: 11 },
            callback: function(value: number | string) {
              return value + ' tasks';
            }
          },
          border: { display: false },
        },
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748b',
            font: { size: 11 },
            maxRotation: timeframe === 'month' ? 45 : 0,
            callback: function(value: string | number) {
              if (timeframe === 'week') {
                // For weekly view, just show the day name from the data
                return data[Number(value)]?.label || value;
              } else {
                // For monthly view, show week label
                return data[Number(value)]?.label || value;
              }
            }
          },
          border: { display: false },
        },
      },
      onHover: (event: any, activeElements: any[]) => {
        if (event.native?.target) {
          (event.native.target as HTMLElement).style.cursor =
            activeElements.length > 0 ? 'pointer' : 'default';
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart',
      },
    };
  }, [data, timeframe]);

  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalTasks: 0, avgTasks: 0, totalCompleted: 0, completionRate: 0 };
    }

    const totalTasks = data.reduce((sum: number, item: WorkflowActivityItem) => sum + item.value, 0);
    const avgTasks = data.length > 0 ? Math.round(totalTasks / data.length) : 0;
    const totalCompleted = data.reduce((sum: number, item: WorkflowActivityItem) => 
      sum + (item.completed || 0), 0);
    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    
    return { totalTasks, avgTasks, totalCompleted, completionRate };
  }, [data]);

  const getDateRange = () => {
    if (timeframe === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    } else {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
  };

  const getTimeframeLabel = () => {
    return timeframe === 'week' ? 'Weekly' : 'Monthly';
  };

  // Show loading state
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-green-600 border-t-transparent absolute top-0"></div>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Enhanced Header with Toggle Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          
          {/* View Toggle Pills */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPeriod}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            aria-label="Previous period"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {timeframe === 'week' ? 'Current Week' : 'Current Month'}
          </button>
          
          <button
            onClick={handleNextPeriod}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            aria-label="Next period"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
          </button>
        </div>
      </div>

      {/* Enhanced Summary Stats */}
      {showLabels && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Total Tasks
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {summaryStats.totalTasks.toLocaleString()}
            </p>
            <p className="text-xs text-green-600">
              {data.length > 0 ? `Across ${data.length} ${timeframe === 'week' ? 'days' : 'weeks'} (${getDateRange()})` : 'No data'}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{summaryStats.totalCompleted.toLocaleString()}</p>
            <p className="text-xs text-green-600">{summaryStats.completionRate}% completion rate</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                {timeframe === 'week' ? 'Daily' : 'Weekly'} Average
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900">{summaryStats.avgTasks.toLocaleString()}</p>
            <p className="text-xs text-green-600">
              tasks per {timeframe === 'week' ? 'day' : 'week'} ({getDateRange()})
            </p>
          </div>
        </div>
      )}

      {/* Chart with Enhanced Animation */}
      <div className="relative h-64 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-red-500">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <BarChart data={chartData} options={options} />
        )}
      </div>
    </div>
  );
});