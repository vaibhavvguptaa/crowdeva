"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export default function TestAuthPage() {
  const { isAuthenticated, user, loading } = useAuthContext();
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [cookies, setCookies] = useState<any>(null);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/test-auth');
        const data = await response.json();
        setAuthStatus(data);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthStatus({ error: 'Failed to check auth status' });
      }
    };

    // Get cookies
    const getCookies = () => {
      if (typeof document !== 'undefined') {
        const cookieArray = document.cookie.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=');
          return { name, value };
        });
        setCookies(cookieArray);
      }
    };

    checkAuth();
    getCookies();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/developer/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Authentication Debug</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Client-side Auth Status</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
              {user && (
                <div className="mt-2">
                  <p><strong>User:</strong> {user.name || user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>ID:</strong> {user.sub}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Server-side Auth Status</h2>
            <div className="bg-gray-50 p-4 rounded">
              {authStatus ? (
                <pre className="text-sm overflow-x-auto">{JSON.stringify(authStatus, null, 2)}</pre>
              ) : (
                <p>Checking...</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Cookies</h2>
            <div className="bg-gray-50 p-4 rounded">
              {cookies ? (
                <ul className="space-y-1">
                  {cookies.map((cookie: any, index: number) => (
                    <li key={index} className="text-sm">
                      <strong>{cookie.name}:</strong> {cookie.value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Loading cookies...</p>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/developer/projects')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Developer Projects
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}