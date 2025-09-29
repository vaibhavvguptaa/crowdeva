'use client';

import React, { useState } from 'react';
import { withAuth } from '@/lib/auth';
import dynamic from 'next/dynamic';

import Header from '@/components/Ui/header';
import ProjectHeader from '@/components/Ui/projectHeader';
import TabNavigation from '@/components/Ui/TabNavigation';
import { useParams } from 'next/navigation';

// Granular code splitting for dashboard tabs - only load when needed
const OverviewTab = dynamic(() => import('@/components/dashboard/tabs/OverviewTab'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-32 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col lg:col-span-2 h-80 animate-pulse" />
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col lg:col-span-3 h-80 animate-pulse" />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-96 animate-pulse" />
    </div>
  )
});

const PerformanceTab = dynamic(() => import('@/components/dashboard/tabs/PerformanceTab'), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
      <div className="text-gray-400">Loading performance data...</div>
    </div>
  )
});

const AssetsTab = dynamic(() => import('@/components/dashboard/tabs/AssetsTab'), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
      <div className="text-gray-400">Loading assets...</div>
    </div>
  )
});

const TasksTab = dynamic(() => import('@/components/dashboard/tabs/taskTab'), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
      <div className="text-gray-400">Loading tasks...</div>
    </div>
  )
});

const IssuesTab = dynamic(() => import('@/components/dashboard/tabs/issuesTab'), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
      <div className="text-gray-400">Loading issues...</div>
    </div>
  )
});

const ExportTab = dynamic(() => import('@/components/dashboard/tabs/exportTab'), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
      <div className="text-gray-400">Loading export options...</div>
    </div>
  )
});

const SettingsTab = dynamic(() => import('@/components/dashboard/tabs/settingsTab'), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
      <div className="text-gray-400">Loading settings...</div>
    </div>
  )
});

function ProjectDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const params = useParams();
  const projectId = params?.projectId as string || '';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab/>;
      case 'performance':
        return <PerformanceTab />;
      case 'assets':
        return <AssetsTab projectId={projectId} />;
      case 'tasks':
        return <TasksTab projectId={projectId} />;
      case 'issues':
        return <IssuesTab projectId={projectId} />;
      case 'export':
        return <ExportTab />;
      case 'settings':
        return <SettingsTab projectId={projectId} />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Header />
      
      <main className="p-6">
        <ProjectHeader />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Dynamic Tab Content */}
        <div className="tab-content mt-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}

// Protect this page - all authenticated users can access, but specific project access is controlled by RBAC within components
export default withAuth(ProjectDashboard);