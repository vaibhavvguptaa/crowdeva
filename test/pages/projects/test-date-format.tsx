'use client';

import React, { useState } from 'react';
import { projectService } from '@/services/projectService';

const TestDateFormat: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [projectData, setProjectData] = useState<any>(null);

  const testCreateProject = async () => {
    setLoading(true);
    try {
      const newProject = await projectService.createProject({
        name: 'Test Date Format Project',
        description: 'A test project to verify date formatting',
        status: 'active',
      });
      setProjectData(newProject);
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
      <h2 className="text-xl font-bold mb-4">Test Date Format</h2>
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
          {projectData && (
            <div className="mt-4">
              <p><strong>Project ID:</strong> {projectData.id}</p>
              <p><strong>Created At:</strong> {projectData.createdAt}</p>
              <p><strong>Formatted Date:</strong> {projectData.formattedDate}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestDateFormat;