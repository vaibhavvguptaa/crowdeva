'use client';

import React from 'react';
import { CodeExecutionExample } from '@/components/evaluation-builder';
import Link from 'next/link';

export default function CodeEditorDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 mb-6">
          <Link 
            href="/code-editor-demo" 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Standard Demo
          </Link>
          <Link 
            href="/code-editor-demo/custom-language-demo" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Custom Language Demo
          </Link>
        </div>
        <CodeExecutionExample />
      </div>
    </div>
  );
}