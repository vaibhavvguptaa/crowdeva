'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { ProjectWithMetrics } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function ProjectHeader() {
  const params = useParams();
  const [project, setProject] = useState<ProjectWithMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProject = async () => {
      if (params?.projectId) {
        try {
          // Check if we have preloaded data in localStorage
          const preloadedData = localStorage.getItem(`project_${params.projectId}`);
          if (preloadedData) {
            const parsedProject = JSON.parse(preloadedData);
            // Use the backend-provided formattedDate directly
            const projectWithFormattedDate = {
              ...parsedProject,
              formattedDate: parsedProject.formattedDate || 'Invalid Date'
            };
            setProject(projectWithFormattedDate);
            setLoading(false);
            
            // Still fetch fresh data in background to update if needed
            const projectData = await projectService.getProject(params.projectId as string);
            if (projectData) {
              // Use the backend-provided formattedDate directly
              const projectWithFormattedDate = {
                ...projectData,
                formattedDate: projectData.formattedDate || 'Invalid Date'
              };
              setProject(projectWithFormattedDate);
              // Update localStorage with fresh data
              localStorage.setItem(`project_${params.projectId}`, JSON.stringify(projectWithFormattedDate));
            }
            return;
          }
          
          // If no preloaded data, fetch normally
          const projectData = await projectService.getProject(params.projectId as string);
          if (projectData) {
            // Use the backend-provided formattedDate directly
            const projectWithFormattedDate = {
              ...projectData,
              formattedDate: projectData.formattedDate || 'Invalid Date'
            };
            setProject(projectWithFormattedDate);
            
            // Save to localStorage for future preloading
            localStorage.setItem(`project_${params.projectId}`, JSON.stringify(projectWithFormattedDate));
          }
        } catch (error) {
          console.error('Error fetching project:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProject();
  }, [params?.projectId]);

 
}