"use client";
import React from 'react';
import { Folder, Calendar, Users, AlertCircle } from 'lucide-react';
import { ProjectWithMetrics, ProjectAssignee } from '@/types';
import { Avatar } from '@/components/Ui/Avatar';

export interface ProjectCardProps {
  project: (ProjectWithMetrics & { formattedDate?: string });
  onSelect: (project: ProjectWithMetrics) => void;
  highlightText: (text?: string) => React.ReactNode;
  getTypeStyle: (type: string) => string;
  getStatusStyle: (status: string) => string;
  getPriorityStyle: (priority: string) => string;
  handleEmployeeClick: (e: React.MouseEvent, id: string) => void;
}

const ProjectCardComponent: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  highlightText,
  getTypeStyle,
  getStatusStyle,
  getPriorityStyle,
  handleEmployeeClick
}) => {
  return (
    <div
      onClick={() => onSelect(project)}
      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0  group-hover:from-green-50/30 group-hover:to-teal-50/30 transition-all duration-300 rounded-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center transition-all duration-300">
              <Folder className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors duration-200 line-clamp-1" title={project.name}>
                {highlightText(project.name)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getTypeStyle(project.type || 'General')}`}>
                  {project.type || 'General'}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusStyle(project.status || 'default')}`}>
                  {project.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed" title={project.description}>
          {highlightText(project.description || 'No description available')}
        </p>
        {(project.tags && project.tags.length > 0) || project.priority && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {project.priority && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getPriorityStyle(project.priority)}`}>
                <AlertCircle className="w-3 h-3 mr-1" />
                {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
              </span>
            )}
            {project.tags && project.tags.slice(0, 2).map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                #{tag}
              </span>
            ))}
            {project.tags && project.tags.length > 2 && (
              <span className="text-xs text-slate-500">+{project.tags.length - 2} more</span>
            )}
          </div>
        )}
        {project.metrics.totalTasks > 0 && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium text-slate-800">
                {Math.round((project.metrics.completedTasks / project.metrics.totalTasks) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(project.metrics.completedTasks / project.metrics.totalTasks) * 100}%` }}
              />
            </div>
            {project.metrics.qualityScore !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Quality Score</span>
                <span className="font-medium text-slate-800">{project.metrics.qualityScore}%</span>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-slate-500">
            <Calendar className="w-3 h-3 mr-1" />
            {project.formattedDate}
          </div>
          <div className="flex items-center">
            {project.assignees && project.assignees.length > 0 ? (
              <div className="flex items-center">
                <div className="flex -space-x-1.5">
                  {project.assignees
                    .filter((assignee: ProjectAssignee) => assignee !== null) // Filter out null assignees
                    .slice(0, 3)
                    .map((assignee: ProjectAssignee) => (
                    <button
                      key={assignee.id}
                      onClick={(e) => handleEmployeeClick(e, assignee.id)}
                      className="relative hover:scale-110 transition-transform duration-200"
                      title={assignee.name || 'Unknown User'}
                    >
                      <Avatar
                        src={assignee.avatarUrl}
                        alt={assignee.name || 'Unknown User'}
                        fallback={(assignee.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                        className="w-6 h-6 border-2 border-white shadow-sm"
                      />
                    </button>
                  ))}
                  {project.assignees.filter((assignee: ProjectAssignee) => assignee !== null).length > 3 && (
                    <div className="w-6 h-6 bg-slate-100 rounded-full border-2 border-white text-xs font-medium text-slate-600 flex items-center justify-center shadow-sm">
                      +{project.assignees.filter((assignee: ProjectAssignee) => assignee !== null).length - 3}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                Unassigned
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectCard = React.memo(ProjectCardComponent);
