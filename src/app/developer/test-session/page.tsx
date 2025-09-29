"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestSessionPage() {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/test-session');
        const data = await response.json();
        setSessionStatus(data);
      } catch (error) {
        console.error('Error checking session status:', error);
        setSessionStatus({ error: 'Failed to check session status' });
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Debug</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Session Status</h2>
            <div className="bg-gray-50 p-4 rounded">
              {sessionStatus ? (
                <pre className="text-sm overflow-x-auto">{JSON.stringify(sessionStatus, null, 2)}</pre>
              ) : (
                <p>No session status available</p>
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
              onClick={() => router.push('/developer/signin')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}