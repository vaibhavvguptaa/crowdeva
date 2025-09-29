'use client';

import React from 'react';
import {
  LayoutGrid,
  BarChart3,
  Package,
  CheckSquare,
  AlertCircle,
  UploadCloud,
  Settings,
} from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'overview', icon: LayoutGrid, label: 'Overview' },
    { id: 'performance', icon: BarChart3, label: 'Performance' },
    { id: 'assets', icon: Package, label: 'Assets' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'issues', icon: AlertCircle, label: 'Issues' },
    { id: 'export', icon: UploadCloud, label: 'Export' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="border-b border-gray-200 mb-8">
      <ul className="flex space-x-8 -mb-px">
        {tabs.map(tab => (
          <li key={tab.id}>
            <button
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600 cursor-default'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
