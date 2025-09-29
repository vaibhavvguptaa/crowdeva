"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Code, Building2, Users, Search, Star, TrendingUp } from 'lucide-react';

interface MarketplaceQuickAccessProps {
  className?: string;
  showStats?: boolean;
}

export const MarketplaceQuickAccess: React.FC<MarketplaceQuickAccessProps> = ({ 
  className = "",
  showStats = true
}) => {
  const router = useRouter();

  const quickActions = [
    {
      title: 'Find Developers',
      description: 'AI & ML specialists',
      icon: Code,
      color: 'indigo',
      href: '/marketplace/developers',
      stats: '25+ available'
    },
    {
      title: 'Find Vendors',
      description: 'Enterprise partners',
      icon: Building2,
      color: 'orange',
      href: '/marketplace/vendors',
      stats: '15+ companies'
    },
    {
      title: 'Browse All',
      description: 'All marketplace talent',
      icon: Users,
      color: 'green',
      href: '/marketplace',
      stats: '40+ experts'
    }
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Find Talent</h3>
          <p className="text-sm text-gray-600">Connect with skilled professionals</p>
        </div>
        <div className="p-2 bg-green-100 rounded-lg">
          <Search className="w-5 h-5 text-green-600" />
        </div>
      </div>

      <div className="grid gap-3">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => router.push(action.href)}
            className={`flex items-center p-3 rounded-lg border border-gray-200 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-all duration-200 group text-left`}
          >
            <div className={`p-2 rounded-md bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
              <action.icon className={`w-4 h-4 text-${action.color}-600`} />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{action.title}</p>
              <p className="text-xs text-gray-500">{action.description}</p>
            </div>
            {showStats && (
              <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {action.stats}
              </div>
            )}
          </button>
        ))}
      </div>

      {showStats && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>4.8 avg rating</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>98% success rate</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};