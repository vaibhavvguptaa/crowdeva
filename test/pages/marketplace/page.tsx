"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Ui/header';

const TestPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href="/marketplace" 
          className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Test Page</h1>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              This page is for testing the profile functionality. Click on the links below to view sample profiles:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Link 
                href="/marketplace/profile/dev-1?type=developer"
                className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-900">Developer Profile (Sarah Chen)</h3>
                <p className="text-sm text-gray-600 mt-1">Senior Full Stack Developer</p>
              </Link>
              
              <Link 
                href="/marketplace/profile/vendor-1?type=vendor"
                className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-900">Vendor Profile (DataVision Solutions)</h3>
                <p className="text-sm text-gray-600 mt-1">Data Annotation Company</p>
              </Link>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Test Contact & Invite Pages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link 
                  href="/marketplace/contact/dev-1"
                  className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-medium text-blue-900">Contact Developer</h3>
                  <p className="text-sm text-blue-700 mt-1">Send a message to Sarah Chen</p>
                </Link>
                
                <Link 
                  href="/marketplace/invite/vendor-1"
                  className="block p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <h3 className="font-medium text-green-900">Invite Vendor</h3>
                  <p className="text-sm text-green-700 mt-1">Invite DataVision Solutions to a project</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestPage;