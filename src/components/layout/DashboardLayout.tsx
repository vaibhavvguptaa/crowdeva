"use client";

import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigationGuard } from '@/components/auth/AuthGuard';
import { AuthUserType } from '@/types/auth';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: AuthUserType[];
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Projects',
    href: '/projects',
    roles: ['customers'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 7v7.35M5 4v7.35m14 0a2 2 0 01-2 2H7a2 2 0 01-2-2M5 11.35V17" />
      </svg>
    ),
  },
  {
    name: 'Developer Projects',
    href: '/developer/projects',
    roles: ['developers'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    name: 'Vendor Projects',
    href: '/vendor/projects',
    roles: ['vendors'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, loading } = useAuthContext();
  const { guardedNavigate } = useNavigationGuard();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect will be handled by the auth context/middleware
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigation = (item: NavigationItem) => {
    guardedNavigate(item.href, item.roles);
  };

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing if no user (will be redirected by middleware)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <svg className="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-xl font-bold text-gray-900">CrowdEval</span>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems
                .filter(item => item.roles.includes(user.role))
                .map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </button>
                ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user.name || user.email}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full capitalize">
                  {user.role}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex space-x-4 overflow-x-auto">
          {navigationItems
            .filter(item => item.roles.includes(user.role))
            .map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md whitespace-nowrap transition-colors"
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2025 CrowdEval. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Authenticated as: {user.role}</span>
              <span>•</span>
              <span>User ID: {user.sub?.substring(0, 8)}...</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
