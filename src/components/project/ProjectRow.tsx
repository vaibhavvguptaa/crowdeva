'use client';
import React, { useState, useEffect } from 'react';
import { Folder, Calendar, Users, FileText } from 'lucide-react';
import { ProjectWithMetrics, ProjectAssignee } from '@/types';
import { Avatar } from '@/components/Ui/Avatar';

export interface ProjectRowProps {
  project: ProjectWithMetrics & { formattedDate?: string };
  onSelect: (project: ProjectWithMetrics) => void;
  highlightText: (text?: string) => React.ReactNode;
  getStatusStyle: (status: string) => string;
  handleEmployeeClick: (e: React.MouseEvent, id: string) => void;
  onHover?: (project: ProjectWithMetrics) => void;
}

const ProjectRowComponent: React.FC<ProjectRowProps> = ({
  project,
  onSelect,
  highlightText,
  getStatusStyle,
  handleEmployeeClick,
  onHover,
}) => {
  const [isLargeScreen, setIsLargeScreen] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // 1024px is Tailwind's 'lg' breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Use the backend-provided formattedDate directly
  const formattedDate = project.formattedDate || 'Unknown Date';

  return (
    <div
      onClick={() => onSelect(project)}
      onMouseEnter={() => onHover && onHover(project)}
      className="cursor-pointer p-4 lg:p-6 hover:backdrop-blur-sm transition-all duration-200 group border-b border-slate-100 last:border-b-0"
      role="row"
    >
      {/* Keep grid consistent with header: 12 cols on lg */}
      <div className="grid grid-cols-10 lg:grid-cols-10 gap-4 items-center">
        {/* Project name and description */}
        <div className="lg:col-span-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:from-green-200 group-hover:to-teal-200 transition-all duration-200">
                <Folder className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="min-w-10 flex-1">
              <div className="flex items-center">
                <h3
                  className="text-sm font-semibold text-slate-900 group-hover:text-green-700 truncate transition-colors duration-200 sm:text-base"
                  title={project.name}
                >
                  {highlightText(project.name)}
                </h3>
                {project.evaluationStructure && (
                  <div title="Has evaluation structure" className="ml-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                )}
              </div>
              {/* Show only one description based on screen size using JavaScript */}
              {isLargeScreen ? (
                <p
                  className="text-sm text-slate-500 truncate mt-0.5"
                  title={project.description}
                >
                  {highlightText(project.description || 'No description')}
                </p>
              ) : (
                <p
                  className="text-xs text-slate-500 mt-1 line-clamp-2"
                  title={project.description}
                >
                  {highlightText(
                    project.description?.substring(0, 80) || 'No description'
                  )}
                  {project.description && project.description.length > 80 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Created date */}
        <div className="hidden lg:flex lg:col-span-2 justify-center items-center">
          <div className="flex items-center text-sm text-slate-600">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            {formattedDate}
          </div>
        </div>

        {/* Assignees */}
        <div className="hidden lg:flex lg:col-span-2 justify-center items-center">
          <div className="flex items-center">
            {project.assignees && project.assignees.length > 0 ? (
              <div className="flex -space-x-2">
                {project.assignees
                  .filter((assignee: ProjectAssignee) => assignee !== null) // Filter out null assignees
                  .slice(0, 3)
                  .map((assignee: ProjectAssignee) => (
                  <button
                    key={assignee.id}
                    onClick={(e) => handleEmployeeClick(e, assignee.id)}
                    className="relative group/avatar hover:scale-110 transition-transform duration-200"
                    title={assignee.name || 'Unknown User'}
                  >
                    <Avatar
                      src={assignee.avatarUrl}
                      alt={assignee.name || 'Unknown User'}
                      fallback={(assignee.name || 'U')
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                      className="w-8 h-8 border-2 border-white shadow-sm"
                    />
                  </button>
                ))}
                {project.assignees.filter((assignee: ProjectAssignee) => assignee !== null).length > 3 && (
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border-2 border-white shadow-sm">
                    +{project.assignees.filter((assignee: ProjectAssignee) => assignee !== null).length - 3}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-slate-400 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Unassigned
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="hidden lg:flex lg:col-span-2 justify-center items-center">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(
              project.status || 'default'
            )}`}
          >
            {project.status || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Mobile chips (no "type") */}
      <div className="lg:hidden mt-3 flex flex-wrap gap-2 items-center text-xs">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-medium border ${getStatusStyle(
            project.status || 'default'
          )}`}
        >
          {project.status || 'Unknown'}
        </span>
        <span className="inline-flex items-center text-slate-500">
          <Calendar className="w-3 h-3 mr-1" />
          {formattedDate}
        </span>
        {project.assignees && project.assignees.length > 0 && (
          <div className="flex -space-x-1.5 ml-auto">
            {project.assignees
              .filter((assignee: ProjectAssignee) => assignee !== null) // Filter out null assignees
              .slice(0, 3)
              .map((assignee: ProjectAssignee) => (
              <Avatar
                key={assignee.id}
                src={assignee.avatarUrl}
                alt={assignee.name || 'Unknown User'}
                fallback={(assignee.name || 'U')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
                className="w-6 h-6 border border-white shadow-sm"
              />
            ))}
            {project.assignees.filter((assignee: ProjectAssignee) => assignee !== null).length > 3 && (
              <div className="w-6 h-6 bg-slate-100 rounded-full border border-white text-xs font-medium text-slate-600 flex items-center justify-center shadow-sm">
                +{project.assignees.filter((assignee: ProjectAssignee) => assignee !== null).length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ProjectRow = React.memo(ProjectRowComponent);