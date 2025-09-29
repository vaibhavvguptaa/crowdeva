"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Database, Loader2 } from 'lucide-react';

const DatabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch('/api/projects/test');
        const data = await response.json();
        
        if (data.success) {
          setStatus('connected');
        } else {
          setStatus('disconnected');
          setError(data.message);
        }
      } catch (err) {
        setStatus('disconnected');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    checkDatabaseStatus();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Database Status</h3>
        </div>
        
        {status === 'checking' && (
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        )}
        
        {status === 'connected' && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
        
        {status === 'disconnected' && (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      
      <div className="mt-2">
        {status === 'checking' && (
          <p className="text-sm text-gray-500">Checking database connection...</p>
        )}
        
        {status === 'connected' && (
          <p className="text-sm text-green-600">Connected to database</p>
        )}
        
        {status === 'disconnected' && (
          <div>
            <p className="text-sm text-red-600">Disconnected from database</p>
            {error && (
              <p className="text-xs text-gray-500 mt-1">Error: {error}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Using mock data for development
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseStatus;