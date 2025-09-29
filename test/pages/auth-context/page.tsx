'use client';

import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

export default function TestAuthContextPage() {
  try {
    const authContext = useAuthContext();
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Auth Context Test</h1>
        <p className="mb-4">Auth Context is working correctly!</p>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(authContext, null, 2)}
        </pre>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Auth Context Test</h1>
        <p className="text-red-500">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}