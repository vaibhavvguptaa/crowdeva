import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="grid lg:grid-cols-2 min-h-[560px] lg:min-h-[600px]">
            {/* Left Panel */}
            <div className="p-4 lg:p-6 flex flex-col justify-center relative h-full">
              <div className="absolute top-0 left-0 w-32 h-32 bg-green-100/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-green-100/30 rounded-full translate-x-1/2 translate-y-1/2 animate-pulse" />
              <div className="relative z-10 max-w-md mx-auto w-full">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-8 animate-pulse"></div>
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            {/* Right Panel */}
            <div className="hidden lg:block bg-gradient-to-br from-green-500 to-emerald-600 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center p-8">
                  <div className="h-12 bg-white/20 rounded w-48 mx-auto mb-4 animate-pulse"></div>
                  <div className="h-6 bg-white/20 rounded w-64 mx-auto animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}