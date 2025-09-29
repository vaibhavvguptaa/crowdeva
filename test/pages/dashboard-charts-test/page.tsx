'use client';

import React, { useState } from 'react';
import WorkflowActivityChart from '@/components/dashboard/charts/workflowActivityChart';
import IssueTrackerChart from '@/components/dashboard/charts/issueTrackerChart';

export default function TestDashboardCharts() {
  // Use a valid project ID from the seed data
  const projectId = 'project-rlhf-001';
  const [key, setKey] = useState(0);
  
  const reloadCharts = () => {
    setKey(prev => prev + 1);
  };
  
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-center">Dashboard Charts Performance Test</h1>
      
      <div className="mb-6 text-center">
        <button 
          onClick={reloadCharts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reload Charts
        </button>
      </div>
      
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Workflow Activity Chart (Weekly)</h2>
          <div className="h-96">
            <WorkflowActivityChart key={`workflow-weekly-${key}`} projectId={projectId} timeframe="week" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Workflow Activity Chart (Monthly)</h2>
          <div className="h-96">
            <WorkflowActivityChart key={`workflow-monthly-${key}`} projectId={projectId} timeframe="month" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Issue Tracker Chart</h2>
          <div className="h-96">
            <IssueTrackerChart key={`issue-tracker-${key}`} projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}