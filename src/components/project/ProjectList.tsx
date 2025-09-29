'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Plus, ChevronsUpDown } from 'lucide-react';
import { ProjectRow } from './ProjectRow';
import { MemoPagination } from './Pagination';
import { ProjectWithMetrics } from '@/types';
import { LoadingOverlay } from '@/components/Ui/LoadingOverlay';
import { useRouter } from 'next/navigation';
// Import the projectService directly
import { projectService } from '@/services/projectService';

// Types
type SortField = 'name' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

interface ProjectsListProps {
  projects: ProjectWithMetrics[];
  onSelectProject: (project: ProjectWithMetrics) => void;
  onCreateProject?: () => void;
  loading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  highlightTerm?: string;
}

// Static style maps
const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  inactive: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  archived: 'bg-gray-100 text-gray-800 border-gray-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function ProjectsList({
  projects,
  onSelectProject,
  onCreateProject,
  loading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  highlightTerm = '',
}: ProjectsListProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [preloadedProjects, setPreloadedProjects] = useState<Record<string, ProjectWithMetrics>>({});
  
  // Cache for preloaded projects to avoid duplicate requests
  const preloadCache = useRef<Record<string, Promise<ProjectWithMetrics | null>>>({});

  // Enrich projects
  const enrichedProjects = useMemo(() => {
    return projects.map((p) => {
      const createdAtTs = new Date(p.createdAt).getTime();
      // Use the backend-provided formattedDate directly
      const formattedDate = p.formattedDate || 'Invalid Date';
      return {
        ...p,
        createdAtTs,
        formattedDate,
        _nameLc: (p.name || '').toLowerCase(),
        _statusLc: (p.status || '').toLowerCase(),
      };
    });
  }, [projects]);

  // Sorting
  const sortedProjects = useMemo(() => {
    const arr = [...enrichedProjects];
    arr.sort((a, b) => {
      switch (sortField) {
        case 'name':
          return a._nameLc.localeCompare(b._nameLc);
        case 'createdAt':
          return a.createdAtTs - b.createdAtTs;
        case 'status':
          return a._statusLc.localeCompare(b._statusLc);
        default:
          return 0;
      }
    });
    if (sortDirection === 'desc') arr.reverse();
    return arr;
  }, [enrichedProjects, sortField, sortDirection]);

  // Pagination
  const totalProjects = sortedProjects.length;
  const actualTotalPages = Math.ceil(totalProjects / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProjects = sortedProjects.slice(startIndex, endIndex);

  // Preload project data when user hovers over a project
  const onHoverProject = useCallback(async (project: ProjectWithMetrics) => {
    // If already preloaded, skip
    if (preloadedProjects[project.id] || preloadCache.current[project.id] !== undefined) {
      return;
    }
    
    // Create a promise for this project if it doesn't exist
    if (!preloadCache.current[project.id]) {
      preloadCache.current[project.id] = projectService.getProject(project.id);
    }
    
    try {
      const preloadedProject = await preloadCache.current[project.id];
      if (preloadedProject) {
        setPreloadedProjects(prev => ({
          ...prev,
          [project.id]: preloadedProject
        }));
      }
    } catch (error) {
      console.warn('Failed to preload project:', error);
      // Clear the cache entry on error so it can be retried
      delete preloadCache.current[project.id];
    }
  }, [preloadedProjects]);

  // Handlers
  const handleEmployeeClick = (e: React.MouseEvent, employeeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profile/${employeeId}`);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => (
    <ChevronsUpDown
      className={`ml-1 h-3 w-3 transition-all duration-200 ${
        sortField !== field ? 'opacity-50' : 'text-green-600'
      }`}
      aria-hidden="true"
    />
  );

  // Status style resolver
  const getStatusStyle = useCallback((status: string) => {
    const key = (status || 'default').toLowerCase();
    return STATUS_STYLES[key] ?? STATUS_STYLES.default;
  }, []);

  // Highlight helper
  const highlightRegex = useMemo(() => {
    if (!highlightTerm.trim()) return null;
    try {
      return new RegExp(
        `(${highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
        'ig'
      );
    } catch {
      return null;
    }
  }, [highlightTerm]);

  const highlightText = useCallback(
    (text?: string) => {
      if (!text) return null;
      if (!highlightRegex) return text;
      const parts = text.split(highlightRegex);
      return parts.map((part, i) =>
        highlightRegex.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      );
    },
    [highlightRegex]
  );

  if (loading) {
    return <LoadingOverlay />;
  }

  if (sortedProjects.length === 0) {
    return (
      <div className="text-center py-16 bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/50">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No projects found</h3>
        <p className="text-slate-500 mb-6">Get started by creating your first project</p>
        {onCreateProject && (
          <button
            onClick={onCreateProject}
            className="group inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl focus:outline-none cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
            New Project
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List View */}
      <div
        className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden shadow-sm"
        role="table"
        aria-label="Projects list view"
      >
     {/* Table Header */}
<div className="hidden lg:grid grid-cols-10 gap-4 bg-slate-50/50 backdrop-blur-sm 
                px-6 py-2 rounded-t-2xl border-b border-slate-200/50 
                text-xs font-semibold text-slate-600 uppercase tracking-wider leading-none pt-6">
  
  <div
    className="lg:col-span-4 flex items-center cursor-pointer hover:text-green-600 transition-colors duration-200 pl-12 "
    onClick={() => toggleSort('name')}
  >
    Project
    {getSortIcon('name')}
  </div>

  <div
    className="lg:col-span-2 flex items-center justify-center cursor-pointer hover:text-green-600 transition-colors duration-200"
    onClick={() => toggleSort('createdAt')}
  >
    Created
    {getSortIcon('createdAt')}
  </div>

  <div className="lg:col-span-2 flex items-center justify-center">
    Assignees
  </div>

  <div
    className="lg:col-span-2 flex items-center justify-center cursor-pointer hover:text-green-600 transition-colors duration-200"
    onClick={() => toggleSort('status')}
  >
    Status
    {getSortIcon('status')}
  </div>

  {/* Empty column for spacing */}
  <div className="lg:col-span-2" />
</div>



        {/* Table Rows */}
        <div className="divide-y divide-slate-100" role="rowgroup">
          {currentProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onSelect={onSelectProject}
              highlightText={highlightText}
              handleEmployeeClick={handleEmployeeClick}
              getStatusStyle={getStatusStyle}
              onHover={onHoverProject}
            />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {actualTotalPages > 1 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden shadow-sm">
          <MemoPagination
            currentPage={currentPage}
            totalItems={totalProjects}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}