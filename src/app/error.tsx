"use client";
import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

// Local route error boundary (App Router). Should not wrap with <html>/<body>.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    (async () => {
      try {
        await fetch('/api/error-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: error.message, stack: error.stack, digest: error.digest })
        }).catch(() => { /* swallow */ });
      } catch { /* noop */ }
    })();
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-6">An unexpected error occurred while loading the page.</p>
          {isDev && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left max-h-40 overflow-auto">
              <p className="text-xs font-medium text-gray-900 mb-2">Error Details:</p>
              <pre className="text-[10px] leading-snug text-gray-700 whitespace-pre-wrap break-all">{error.message}{error.digest ? `\nDigest: ${error.digest}` : ''}</pre>
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </button>
            <button
              onClick={() => (typeof window !== 'undefined' && window.location.reload())}
              className="w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Reload Page
            </button>
            <button
              onClick={() => (typeof window !== 'undefined' && (window.location.href = '/'))}
              className="w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Home className="w-4 h-4 mr-2" /> Go Home
            </button>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-gray-400">Application error boundary</p>
      </div>
    </div>
  );
}
