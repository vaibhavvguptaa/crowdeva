"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function HealthPage() {
  const { isAuthenticated, user, loading, error } = useAuth();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-800 mb-4">Auth Health Check</h1>
        <ul className="space-y-2 text-sm text-slate-700">
          <li><span className="font-medium">Loading:</span> {loading ? 'true' : 'false'}</li>
          <li><span className="font-medium">Authenticated:</span> {isAuthenticated ? 'true' : 'false'}</li>
          <li><span className="font-medium">User ID (sub):</span> {user?.sub || '—'}</li>
          <li><span className="font-medium">User Name:</span> {user?.name || '—'}</li>
          <li><span className="font-medium">Role:</span> {user?.role || '—'}</li>
          {error && <li className="text-red-600"><span className="font-medium">Error:</span> {error}</li>}
        </ul>
        <p className="mt-6 text-xs text-slate-500">This page helps verify that AuthProvider context is mounted and hydration works client-side.</p>
      </div>
    </main>
  );
}
