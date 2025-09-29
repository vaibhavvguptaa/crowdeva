'use client';

import React from 'react';
import { useAuthContext } from '@/contexts';

export default function TestAuthPage() {
  try {
    const authContext = useAuthContext();
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Auth Context Test</h1>
          <p className="text-green-600 mb-4">✅ Auth Context is working correctly!</p>
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-sm text-gray-600 mb-2">Auth State:</p>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({
                isAuthenticated: authContext.isAuthenticated,
                loading: authContext.loading,
                user: authContext.user ? `${authContext.user.firstName} ${authContext.user.lastName}` : null,
                error: authContext.error
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Auth Context Test</h1>
          <p className="text-red-600">❌ Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}