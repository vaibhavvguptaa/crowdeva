'use client';

import React, { useState } from 'react';
import { projectService } from '@/services/projectService';

const TestAPIComponent: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testGetProjects = async () => {
    setLoading(true);
    try {
      const projects = await projectService.getProjects();
      setResult(`SUCCESS: Retrieved ${projects.length} projects`);
      console.log('Projects:', projects);
    } catch (error) {
      setResult(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateProject = async () => {
    setLoading(true);
    try {
      const newProject = await projectService.createProject({
        name: 'Test Project from API',
        description: 'A test project created via the API',
        type: 'General',
        status: 'active',
      });
      setResult(`SUCCESS: Created project with ID ${newProject.id}`);
      console.log('New Project:', newProject);
    } catch (error) {
      setResult(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">API Test Component</h2>
      <div className="space-x-4">
        <button
          onClick={testGetProjects}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Get Projects'}
        </button>
        <button
          onClick={testCreateProject}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Create Project'}
        </button>
      </div>
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="font-mono">{result}</p>
        </div>
      )}
    </div>
  );
};

export default TestAPIComponent;