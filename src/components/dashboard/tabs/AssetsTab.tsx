"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Upload,
  Search,
  Brain,
  BarChart3,
  Target,
  Zap,
  Clock,
  File,
  Download,
  
  MoreHorizontal,
  ChevronDown,
  Plus,
  Filter,
 
  Eye,
  Share2,
  Copy,

  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/Ui/card";
import { LoadingOverlay } from "@/components/Ui/LoadingOverlay";
import { useRouter } from "next/navigation";
import { projectService } from "@/services/projectService";

// Updated interface for LLM Evaluation Projects
interface EvaluationProject {
  id: string;
  name: string;
  description: string;
  modelName: string;
  evaluationType: "performance" | "safety" | "bias" | "robustness" | "custom";
  status: "running" | "completed" | "paused" | "failed" | "pending";
  progress: number;
  accuracy?: number;
  f1Score?: number;
  latency?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo: string[];
  testCases: number;
  completedTests: number;
  dataset: string;
  evaluationMetrics: string[];
  lastRunAt?: Date;
  estimatedCompletion?: Date;
}

const getEvaluationTypeIcon = (type: EvaluationProject["evaluationType"]) => {
  return null; // Removed all icons
};

const getEvaluationTypeColor = (type: EvaluationProject["evaluationType"]) => {
  switch (type) {
    case "performance":
      return "bg-green-100 text-green-700 border-green-200";
    case "safety":
      return "bg-green-100 text-green-700 border-green-200";
    case "bias":
      return "bg-green-100 text-green-700 border-green-200";
    case "robustness":
      return "bg-green-100 text-green-700 border-green-200";
    case "custom":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-green-100 text-green-700 border-green-200";
  }
};

const getStatusColor = (status: EvaluationProject["status"]) => {
  switch (status) {
    case "running":
      return "bg-green-100 text-green-700 border-green-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "paused":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "failed":
      return "bg-red-100 text-red-700 border-red-200";
    case "pending":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusIcon = (status: EvaluationProject["status"]) => {
  const iconProps = { className: "w-4 h-4" };
  switch (status) {
    case "running":
      return <Activity {...iconProps} />;
    case "completed":
      return <CheckCircle2 {...iconProps} />;
    case "paused":
      return <Clock {...iconProps} />;
    case "failed":
      return <AlertCircle {...iconProps} />;
    case "pending":
      return <Clock {...iconProps} />;
    default:
      return <Activity {...iconProps} />;
  }
};

const UserAvatar = ({ users, max = 3 }: { users: string[]; max?: number }) => {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className="flex -space-x-2">
      {displayUsers.map((user, index) => (
        <div
          key={index}
          className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium shadow-sm"
        >
          {user.charAt(0).toUpperCase()}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-8 h-8 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium shadow-sm">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

const ProgressBar = ({ progress, status }: { progress: number; status: EvaluationProject["status"] }) => {
  const getProgressColor = () => {
    switch (status) {
      case "running":
        return "bg-green-500";
      case "completed":
        return "bg-green-500";
      case "paused":
        return "bg-amber-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${getProgressColor()} transition-all duration-300`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default function EvaluationProjectsTab({
  projectId,
  projects = [],
  loading = false,
}: {
  projectId?: string;
  projects?: EvaluationProject[];
  loading?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | EvaluationProject["evaluationType"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | EvaluationProject["status"]>("all");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showFilterTooltip, setShowFilterTooltip] = useState(false);
  const [showImportTooltip, setShowImportTooltip] = useState(false);
  const [showCreateTooltip, setShowCreateTooltip] = useState(false);
  const [showSearchTooltip, setShowSearchTooltip] = useState(false);
  const [evaluationProjects, setEvaluationProjects] = useState<EvaluationProject[]>(projects);
  const [isLoading, setIsLoading] = useState(loading);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;
  
  const router = useRouter();

  // Fetch evaluation projects when projectId changes
  useEffect(() => {
    if (projectId) {
      setIsLoading(true);
      fetchEvaluationProjects(projectId);
    }
  }, [projectId]);

  const fetchEvaluationProjects = async (projectId: string) => {
    try {
      const response = await fetch(`/api/dashboard/${projectId}/assets`);
      if (!response.ok) {
        throw new Error(`Failed to fetch evaluation projects: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setEvaluationProjects(data);
    } catch (error) {
      console.error("Failed to fetch evaluation projects:", error);
      // Fallback to empty array if fetch fails
      setEvaluationProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return (evaluationProjects || []).filter((project) => {
      const matchesSearch = 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || project.evaluationType === filterType;
      const matchesStatus = filterStatus === "all" || project.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [evaluationProjects, searchTerm, filterType, filterStatus]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);
  const shouldShowPagination = filteredProjects.length > projectsPerPage;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the table
    document.querySelector('.bg-white\\/60')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleOpenProject = (project: EvaluationProject) => {
    router.push(`/projects/evaluation/${project.id}`);
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const handleCreateEvaluation = async () => {
    try {
      // Create a new project with default values
      const newProject = await projectService.createProject({
        name: "New Evaluation Project",
        description: "Created from evaluation builder",
        type: "General", // Changed from "Evaluation" to "General" to match valid ProjectType
        status: "active"
      });
      
      // Navigate to the evaluation page for this new project
      router.push(`/projects/evaluation/${newProject.id}`);
    } catch (error) {
      console.error("Failed to create evaluation project:", error);
      // Fallback: navigate to projects page if creation fails
      router.push('/projects');
    }
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="min-h-screen space-y-6">
      {/* Filter and Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side - Filters and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Evaluation Type Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Types</option>
              <option value="performance">Performance</option>
              <option value="safety">Safety</option>
              <option value="bias">Bias</option>
              <option value="robustness">Robustness</option>
              <option value="custom">Custom</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Filter Button with Tooltip */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300"
              onMouseEnter={() => setShowFilterTooltip(true)}
              onMouseLeave={() => setShowFilterTooltip(false)}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
            {showFilterTooltip && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
                Apply additional filters to refine results
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Search, Import, and Create Evaluation */}
        <div className="flex items-center gap-3">
          {/* Search with Tooltip */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-700" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search evaluations..."
                className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700 duration-300"
                onMouseEnter={() => setShowSearchTooltip(true)}
                onMouseLeave={() => setShowSearchTooltip(false)}
                onFocus={() => setShowSearchTooltip(false)}
              />
            </div>
            {showSearchTooltip && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
                Search by project name, model, or description
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>

          {/* Import Button with Tooltip */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300"
              onMouseEnter={() => setShowImportTooltip(true)}
              onMouseLeave={() => setShowImportTooltip(false)}
            >
              <Download className="w-4 h-4" />
              Import
            </button>
            {showImportTooltip && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
                Import evaluation templates or benchmark datasets
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>

          {/* Create Evaluation Button with Tooltip */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer transition-all duration-300"
              onClick={handleCreateEvaluation}
              onMouseEnter={() => setShowCreateTooltip(true)}
              onMouseLeave={() => setShowCreateTooltip(false)}
            >
              <Plus className="w-4 h-4" />
              Create Evaluation
            </button>
            {showCreateTooltip && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
                Create a new LLM evaluation project
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Project Display */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {/* Enhanced Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProjects(currentProjects.map((p) => p.id));
                    } else {
                      setSelectedProjects([]);
                    }
                  }}
                />
              </div>
              <div className="col-span-4">Project Details</div>
              <div className="col-span-2">Progress & Metrics</div>
              <div className="col-span-2">Status & Timeline</div>
              <div className="col-span-2">Team</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>

          {/* Enhanced Table Body */}
          <div className="divide-y divide-gray-200">
            {currentProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleOpenProject(project)}
                className="group px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Checkbox */}
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={(e) => {
                        stop(e);
                        toggleProjectSelection(project.id);
                      }}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded"
                    />
                  </div>

                  {/* Project Details */}
                  <div className="col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {project.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {project.modelName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEvaluationTypeColor(
                              project.evaluationType
                            )}`}
                          >
                            {project.evaluationType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {project.dataset}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Metrics */}
                  <div className="col-span-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <ProgressBar progress={project.progress} status={project.status} />
                      <div className="text-xs text-gray-500">
                        {project.completedTests}/{project.testCases} tests
                      </div>
                      {project.accuracy && (
                        <div className="flex items-center gap-2 text-xs">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-gray-600">
                            Acc: {(project.accuracy * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Timeline */}
                  <div className="col-span-2">
                    <div className="space-y-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {getStatusIcon(project.status)}
                        {project.status}
                      </span>
                      <div className="text-xs text-gray-500">
                        <div>Created: {new Date(project.createdAt).toLocaleDateString()}</div>
                        {project.lastRunAt && (
                          <div>Last run: {new Date(project.lastRunAt).toLocaleDateString()}</div>
                        )}
                        {project.estimatedCompletion && project.status === "running" && (
                          <div>ETA: {new Date(project.estimatedCompletion).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="col-span-2">
                    <div className="space-y-2">
                      <UserAvatar users={project.assignedTo || []} />
                      <div className="text-xs text-gray-500">
                        Created by {project.createdBy}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          stop(e);
                          router.push(`/projects/evaluation/${project.id}`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          stop(e);
                          // Handle share action
                        }}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          stop(e);
                          // Handle more actions
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        title="More Actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
            
              <p className="text-gray-600 font-medium">No evaluation projects found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search or filter criteria, or create a new evaluation
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Pagination - Only show when there are more than 6 projects */}
      {shouldShowPagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            Showing <span className="font-medium mx-1">{startIndex + 1}</span> to{" "}
            <span className="font-medium mx-1">{Math.min(endIndex, filteredProjects.length)}</span> of{" "}
            <span className="font-medium mx-1">{filteredProjects.length}</span> projects
          </div>
          
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page as number)}
                      className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}