'use client';

import React, { useState } from 'react';
import { projectService } from '@/services/projectService';
import { useAuthContext } from '@/contexts/AuthContext';

export default function TestProjectCreationPage() {
  const { user } = useAuthContext();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [projectData, setProjectData] = useState({
    name: 'Test Project from UI',
    description: 'A test project created through the UI with real data',
    status: 'active' as const,
    type: 'General' as const,
    priority: 'medium' as const,
  });

  const testCreateProject = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Creating project with data:', projectData);
      
      // Get current user ID
      const currentUserId = user?.sub || 'current-user';
      
      // Create project with all required fields
      const newProject = await projectService.createProject({
        ...projectData,
        createdBy: currentUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignees: [],
        files: [],
        metrics: {
          totalTasks: 0,
          completedTasks: 0,
          accuracy: 0,
          avgTimePerTask: '0 min',
          issuesFound: 0,
          qualityScore: 0,
          lastActivityAt: new Date().toISOString()
        },
        rbac: {
          owner: currentUserId,
          admins: [currentUserId],
          managers: [],
          developers: [],
          vendors: [],
          evaluators: [],
          viewers: []
        },
        tags: ['test', 'ui'],
        deadline: undefined
      });
      
      setResult(`✓ Successfully created project with ID: ${newProject.id}`);
      console.log('New Project:', newProject);
    } catch (error: any) {
      setResult(`✗ Error: ${error.message || 'Unknown error'}`);
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Project Creation with Real Data</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This test will create a project with all required fields to verify real data implementation.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter project description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={projectData.status}
                  onChange={(e) => setProjectData({...projectData, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="paused">Paused</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={testCreateProject}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project with Real Data'}
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