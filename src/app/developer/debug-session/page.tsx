"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugSessionPage() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const debugSession = async () => {
      try {
        // Get all cookies
        const cookies = document.cookie.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=');
          return { name, value };
        });

        // Check localStorage
        const localStorageItems: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            localStorageItems[key] = localStorage.getItem(key) || '';
          }
        }

        // Check sessionStorage
        const sessionStorageItems: Record<string, string> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            sessionStorageItems[key] = sessionStorage.getItem(key) || '';
          }
        }

        setDebugInfo({
          cookies,
          localStorage: localStorageItems,
          sessionStorage: sessionStorageItems,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error getting debug info:', error);
        setDebugInfo({ error: 'Failed to get debug info' });
      } finally {
        setLoading(false);
      }
    };

    debugSession();
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Debug Information</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Cookies</h2>
            <div className="bg-gray-50 p-4 rounded">
              {debugInfo?.cookies ? (
                <ul className="space-y-2">
                  {debugInfo.cookies.map((cookie: any, index: number) => (
                    <li key={index} className="text-sm">
                      <strong>{cookie.name}:</strong> {cookie.value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No cookies found</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Local Storage</h2>
            <div className="bg-gray-50 p-4 rounded">
              {debugInfo?.localStorage ? (
                <ul className="space-y-2">
                  {Object.entries(debugInfo.localStorage).map(([key, value]) => (
                    <li key={key} className="text-sm">
                      <strong>{key}:</strong> {value as string}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No local storage items found</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Session Storage</h2>
            <div className="bg-gray-50 p-4 rounded">
              {debugInfo?.sessionStorage ? (
                <ul className="space-y-2">
                  {Object.entries(debugInfo.sessionStorage).map(([key, value]) => (
                    <li key={key} className="text-sm">
                      <strong>{key}:</strong> {value as string }
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No session storage items found</p>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/developer/signin')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Sign In
            </button>
            <button
              onClick={() => router.push('/developer/projects')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Developer Projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}