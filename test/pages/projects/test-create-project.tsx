'use client';

import React, { useState } from 'react';
import { projectService } from '@/services/projectService';

const TestCreateProject: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testCreateProject = async () => {
    setLoading(true);
    try {
      const newProject = await projectService.createProject({
        name: 'Test Project',
        description: 'A test project created via the API',
        status: 'active',
      });
      setResult(`SUCCESS: Created project with ID ${newProject.id}`);
      console.log('New Project:', newProject);
    } catch (error: any) {
      setResult(`ERROR: ${error.message || 'Unknown error'}`);
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Test Project Creation</h2>
      <button
        onClick={testCreateProject}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Test Project'}
      </button>
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-sm">{result}</p>
        </div>
      )}
    </div>
  );
};

export default TestCreateProject;