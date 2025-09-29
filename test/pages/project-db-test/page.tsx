'use client';

import React, { useState } from 'react';
import { projectService } from '@/services/projectService';

export default function TestProjectDBPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testProjectCreation = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // Create a new project
      const newProject = await projectService.createProject({
        name: 'Test Project DB Test',
        description: 'A test project to verify database saving',
        type: 'General',
        status: 'active',
      });
      
      setResult(`✓ Successfully created project with ID: ${newProject.id}`);
      
      // Fetch all projects to verify it's in the list
      const projects = await projectService.getProjects();
      const foundProject = projects.find(p => p.id === newProject.id);
      
      if (foundProject) {
        setResult(prev => prev + `\n✓ Project found in project list`);
      } else {
        setResult(prev => prev + `\n✗ Project NOT found in project list`);
      }
    } catch (error: any) {
      setResult(`✗ Error: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Project Database Test</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This test will create a project and verify it's properly saved to the database.
            </p>
            
            <button
              onClick={testProjectCreation}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Run Database Test'}
            </button>
          </div>
          
          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Test Results:</h2>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}