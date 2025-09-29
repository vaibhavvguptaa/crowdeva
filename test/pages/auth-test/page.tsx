'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { DirectGrantAuth } from '@/services/keycloak';

export default function TestAuthPage() {
  const { isAuthenticated, user, loading, error, refreshAuth } = useAuthContext();
  const [token, setToken] = useState<string | null>(null);
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);
  const [authType, setAuthType] = useState<string | null>(null);

  useEffect(() => {
    // Check token in DirectGrantAuth
    setToken(DirectGrantAuth.getToken());
    
    // Check token in localStorage
    if (typeof window !== 'undefined') {
      setLocalStorageToken(localStorage.getItem('kc-token'));
      setAuthType(localStorage.getItem('authType'));
    }
  }, []);

  const handleRefresh = async () => {
    try {
      await refreshAuth();
      // Update local state after refresh
      setToken(DirectGrantAuth.getToken());
      if (typeof window !== 'undefined') {
        setLocalStorageToken(localStorage.getItem('kc-token'));
        setAuthType(localStorage.getItem('authType'));
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  const handleClearTokens = () => {
    // Clear tokens
    DirectGrantAuth.logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kc-token');
      localStorage.removeItem('authType');
    }
    setToken(null);
    setLocalStorageToken(null);
    setAuthType(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Authentication Test</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-800">Auth Context State</h2>
            <p><span className="font-medium">Loading:</span> {loading ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Authenticated:</span> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">User:</span> {user ? user.email : 'None'}</p>
            <p><span className="font-medium">Error:</span> {error || 'None'}</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h2 className="font-semibold text-green-800">Token Information</h2>
            <p><span className="font-medium">DirectGrantAuth Token:</span> {token ? 'Present' : 'None'}</p>
            <p><span className="font-medium">LocalStorage Token:</span> {localStorageToken ? 'Present' : 'None'}</p>
            <p><span className="font-medium">Auth Type:</span> {authType || 'None'}</p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h2 className="font-semibold text-yellow-800">Actions</h2>
            <div className="flex space-x-2 mt-2">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleRefresh}
              >
                Refresh Auth State
              </button>
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleClearTokens}
              >
                Clear Tokens
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}