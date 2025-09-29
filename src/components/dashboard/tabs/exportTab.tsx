// components/dashboard/tabs/ExportTab.tsx - Fixed version
'use client';

import React, { useState, memo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/Ui/card';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  Calendar,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

// Types for better type safety
interface ExportHistoryItem {
  id: string;
  fileName: string;
  format: string;
  dataType: string;
  size: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl: string | null;
}

interface ExportFormat {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface DataType {
  value: string;
  label: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  dataType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

const ExportTab = memo(() => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('all');
  const [dataType, setDataType] = useState('all');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('export'); // 'export' or 'reports'

  // Mock export history with proper typing
  const exportHistory: ExportHistoryItem[] = [
    {
      id: 'EXP-001',
      fileName: 'task_performance_data_2025-01.csv',
      format: 'CSV',
      dataType: 'Task Performance',
      size: '2.4 MB',
      createdAt: '2025-01-29 14:30',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: 'EXP-002',
      fileName: 'annotation_results_full.json',
      format: 'JSON',
      dataType: 'Annotation Results',
      size: '5.7 MB',
      createdAt: '2025-01-28 09:15',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: 'EXP-003',
      fileName: 'team_analytics_report.pdf',
      format: 'PDF',
      dataType: 'Analytics Report',
      size: '1.2 MB',
      createdAt: '2025-01-27 16:45',
      status: 'processing',
      downloadUrl: null
    }
  ];

  // Mock report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'REP-001',
      name: 'Weekly Performance Summary',
      description: 'Comprehensive overview of team performance and task completion rates',
      dataType: 'Performance Metrics',
      frequency: 'weekly'
    },
    {
      id: 'REP-002',
      name: 'Quality Assurance Report',
      description: 'Detailed analysis of accuracy scores and consistency metrics',
      dataType: 'Quality Metrics',
      frequency: 'daily'
    },
    {
      id: 'REP-003',
      name: 'Monthly Project Review',
      description: 'Executive summary with trend analysis and predictions',
      dataType: 'All Data',
      frequency: 'monthly'
    }
  ];

  const exportFormats: ExportFormat[] = [
    { 
      value: 'csv', 
      label: 'CSV', 
      icon: FileSpreadsheet, 
      description: 'Comma-separated values for spreadsheet analysis' 
    },
    { 
      value: 'json', 
      label: 'JSON', 
      icon: Database, 
      description: 'Structured data format for API integration' 
    },
    { 
      value: 'pdf', 
      label: 'PDF', 
      icon: FileText, 
      description: 'Formatted report for presentation' 
    },
    { 
      value: 'xlsx', 
      label: 'Excel', 
      icon: FileSpreadsheet, 
      description: 'Microsoft Excel workbook format' 
    }
  ];

  const dataTypes: DataType[] = [
    { value: 'all', label: 'Complete Dataset' },
    { value: 'tasks', label: 'Task Performance' },
    { value: 'annotations', label: 'Annotation Results' },
    { value: 'team', label: 'Team Performance' },
    { value: 'issues', label: 'Issue Reports' },
    { value: 'metrics', label: 'Project Metrics' }
  ];

  const handleExport = async () => {
    setLoading(true);
    try {
      // Simulate export process
      console.log('Exporting data...', {
        format: selectedFormat,
        dateRange,
        dataType,
        includeMetadata
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, this would trigger the export API
      alert('Export started! You will be notified when it\'s ready for download.');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ExportHistoryItem['status']) => {
    switch (status) {
      case 'completed': 
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'processing': 
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed': 
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: 
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ExportHistoryItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (exportItem: ExportHistoryItem) => {
    if (exportItem.downloadUrl && exportItem.status === 'completed') {
      // In a real implementation, this would handle the download
      window.open(exportItem.downloadUrl, '_blank');
    }
  };

  const handleCreateReport = (template: ReportTemplate) => {
    // In a real implementation, this would create a scheduled report
    alert(`Scheduled report "${template.name}" created!`);
  };

  const selectedDataTypeLabel = dataTypes.find(t => t.value === dataType)?.label || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Export & Reports</h1>
          <p className="text-gray-600">Export project data or schedule automated reports</p>
        </div>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'export'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Export Data
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'reports'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Scheduled Reports
          </button>
        </div>
      </div>

      {activeTab === 'export' ? (
        <>
          {/* Export Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Export Configuration" showRefresh={false} />
              <CardContent>
                <div className="space-y-4">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {exportFormats.map((format) => {
                        const IconComponent = format.icon;
                        return (
                          <label
                            key={format.value}
                            className={`relative flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedFormat === format.value 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="format"
                              value={format.value}
                              checked={selectedFormat === format.value}
                              onChange={(e) => setSelectedFormat(e.target.value)}
                              className="sr-only"
                            />
                            <IconComponent className="w-5 h-5 text-gray-600 mr-3 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">{format.label}</p>
                              <p className="text-xs text-gray-500 truncate">{format.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Data Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Type
                    </label>
                    <select
                      value={dataType}
                      onChange={(e) => setDataType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {dataTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include metadata and timestamps</span>
                    </label>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={handleExport}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Generate Export</span>
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Export Preview */}
            <Card>
              <CardHeader title="Export Preview" showRefresh={false} />
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Format:</dt>
                        <dd className="text-gray-900 font-medium">{selectedFormat.toUpperCase()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Data Type:</dt>
                        <dd className="text-gray-900 font-medium">{selectedDataTypeLabel}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Date Range:</dt>
                        <dd className="text-gray-900 font-medium">
                          {dateRange === 'all' ? 'All Time' : dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Estimated Size:</dt>
                        <dd className="text-gray-900 font-medium">~3.2 MB</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Records:</dt>
                        <dd className="text-gray-900 font-medium">~2,450 tasks</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">What's included:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Task completion data and timestamps</li>
                      <li>Annotation results and quality scores</li>
                      <li>Team member performance metrics</li>
                      <li>Issue reports and resolution status</li>
                      {includeMetadata && <li>Metadata and system information</li>}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export History */}
          <Card>
            <CardHeader title="Export History" showRefresh={false} />
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-gray-500 uppercase border-b border-gray-200">
                    <tr>
                      <th scope="col" className="py-3 px-4 font-medium">File Name</th>
                      <th scope="col" className="py-3 px-4 font-medium">Format</th>
                      <th scope="col" className="py-3 px-4 font-medium">Data Type</th>
                      <th scope="col" className="py-3 px-4 font-medium">Size</th>
                      <th scope="col" className="py-3 px-4 font-medium">Created</th>
                      <th scope="col" className="py-3 px-4 font-medium">Status</th>
                      <th scope="col" className="py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportHistory.map((exportItem, index) => (
                      <tr 
                        key={exportItem.id} 
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          index === 0 ? 'border-t' : ''
                        }`}
                      >
                        <td className="py-4 px-4 font-medium text-gray-900 max-w-xs truncate">
                          {exportItem.fileName}
                        </td>
                        <td className="py-4 px-4 text-gray-700">{exportItem.format}</td>
                        <td className="py-4 px-4 text-gray-700">{exportItem.dataType}</td>
                        <td className="py-4 px-4 text-gray-700">{exportItem.size}</td>
                        <td className="py-4 px-4 text-gray-700">{exportItem.createdAt}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(exportItem.status)}
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(exportItem.status)}`}>
                              {exportItem.status.charAt(0).toUpperCase() + exportItem.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {exportItem.status === 'completed' ? (
                            <button 
                              onClick={() => handleDownload(exportItem)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                            >
                              Download
                            </button>
                          ) : exportItem.status === 'processing' ? (
                            <span className="text-gray-400 text-sm">Processing...</span>
                          ) : (
                            <span className="text-red-400 text-sm">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {exportHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No export history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Scheduled Reports Section */
        <div className="space-y-6">
          {/* Report Templates */}
          <Card>
            <CardHeader title="Report Templates" showRefresh={false} />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => handleCreateReport(template)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{template.dataType}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {template.frequency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Report Builder */}
          <Card>
            <CardHeader title="Custom Report Builder" showRefresh={false} />
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter report name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Frequency
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metrics to Include
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Performance', 'Quality', 'Team', 'Issues', 'Tasks', 'Annotations'].map((metric) => (
                      <label key={metric} className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{metric}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Send report via email</span>
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Create Report</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Reports List */}
          <Card>
            <CardHeader title="Scheduled Reports" showRefresh={false} />
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-gray-500 uppercase border-b border-gray-200">
                    <tr>
                      <th scope="col" className="py-3 px-4 font-medium">Report Name</th>
                      <th scope="col" className="py-3 px-4 font-medium">Frequency</th>
                      <th scope="col" className="py-3 px-4 font-medium">Metrics</th>
                      <th scope="col" className="py-3 px-4 font-medium">Next Run</th>
                      <th scope="col" className="py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-900">Weekly Performance Summary</td>
                      <td className="py-4 px-4 text-gray-700">Weekly</td>
                      <td className="py-4 px-4 text-gray-700">Performance, Quality</td>
                      <td className="py-4 px-4 text-gray-700">2025-02-05</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});

ExportTab.displayName = 'ExportTab';

export default ExportTab;