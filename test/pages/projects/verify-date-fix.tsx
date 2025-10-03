'use client';

import React, { useState, useEffect } from 'react';
import { projectService } from '@/services/projectService';

const VerifyDateFix: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects();
        setProjects(data);
        console.log('Projects fetched:', data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Verify Date Format Fix</h2>
      
      {loading && <p>Loading projects...</p>}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <p>Error: {error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Projects:</h3>
          {projects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="p-4 border rounded">
                  <p><strong>ID:</strong> {project.id}</p>
                  <p><strong>Name:</strong> {project.name}</p>
                  <p><strong>Created At:</strong> {project.createdAt}</p>
                  <p><strong>Formatted Date:</strong> {project.formattedDate}</p>
                  <p className={project.formattedDate === 'Invalid Date' ? 'text-red-500 font-bold' : 'text-green-500'}>
                    Status: {project.formattedDate === 'Invalid Date' ? '❌ Still showing Invalid Date' : '✅ Fixed!'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyDateFix;