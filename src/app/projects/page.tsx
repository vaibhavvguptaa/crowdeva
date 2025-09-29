"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, RefreshCw } from "lucide-react";
import ProjectsList from "@/components/project/ProjectList";
import ProjectListSkeleton from "@/components/project/ProjectListSkeleton";
import CreateProjectModal from "@/components/project/CreateProjectModal";
import ImportSampleProjectsModal from "@/components/project/ImportSampleProjectsModal";
import { withAuth } from "@/lib/auth";
import { ProjectWithMetrics } from "@/types";
import { projectService } from "@/services/projectService";
import { ErrorMessage } from "@/components/Ui/ErrorMessage";
import { EmptyState } from "@/components/Ui/EmptyState";
import { useDebounce } from "@/hooks/debounce";
import Header from "@/components/Ui/header";
import { useAuthContext } from "@/contexts/AuthContext";

type FilterKey = "all" | "assigned";

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const router = useRouter();
  const { user } = useAuthContext();
  const pageSize = 10; // Show 10 projects per page

  const fetchProjects = useCallback(async () => { 
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user ID from the auth context
      const currentUserId = user?.sub || null;
      
      // Get projects from projectService, passing the user ID
      const data = currentUserId 
        ? await projectService.getProjects(currentUserId) 
        : await projectService.getProjects();
      
      // Get any stored imported projects from localStorage
      const storedImportedProjects = localStorage.getItem('importedProjects');
      let importedProjects: ProjectWithMetrics[] = [];
      
      if (storedImportedProjects) {
        try {
          const parsedProjects = JSON.parse(storedImportedProjects);
          // Use the backend-provided formattedDate directly
          importedProjects = parsedProjects.map((project: ProjectWithMetrics) => {
            return {
              ...project,
              formattedDate: project.formattedDate || 'Invalid Date'
            };
          });
        } catch (e) {
          console.error('Failed to parse stored imported projects:', e);
        }
      }
      
      // Create a map to deduplicate projects by ID
      const projectMap = new Map<string, ProjectWithMetrics>();
      
      // Add database projects first
      data.forEach(project => {
        projectMap.set(project.id, project);
      });
      
      // Add imported projects (they will override database projects if IDs match)
      importedProjects.forEach(project => {
        projectMap.set(project.id, project);
      });
      
      // Convert map back to array
      setProjects(Array.from(projectMap.values()));
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [user]); // Add user as dependency

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSelectProject = useCallback(
    (project: ProjectWithMetrics) => {
      // Save project data to localStorage for faster loading on dashboard
      localStorage.setItem(`project_${project.id}`, JSON.stringify(project));
      
      // Navigate to the project dashboard page
      router.push(`/projects/dashboard/${project.id}`);
    },
    [router]
  );

  const handleCreateProject = useCallback(
    async (projectData: Partial<ProjectWithMetrics>) => {
      try {
        setLoading(true);
        const currentUserId = user?.sub || "1"; // Use user ID from context
        const projectId = `project-${Date.now()}`;
        
        // Create a basic evaluation structure for new projects
        const basicEvaluationStructure = {
          form_version: "1.0",
          project_id: projectId,
          layout: {
            header: [],
            body: []
          }
        };
        
        const newProject: ProjectWithMetrics = {
          id: projectId,
          name: projectData.name || 'Untitled Project',
          description: projectData.description || 'No description provided',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: projectData.status || 'active',
          createdBy: currentUserId,
          role: projectData.role || 'Owner',
          assignees: [{
            id: currentUserId,
            name: 'You',
            email: '',
            avatarUrl: '',
            createdAt: new Date().toISOString(),
            userId: currentUserId,
            role: 'owner',
            userType: 'client',
            isActive: true,
            assignedAt: new Date().toISOString(),
            assignedBy: currentUserId,
            permissions: {
              canEdit: true,
              canDelete: true,
              canAssign: true,
              canEvaluate: true,
              canViewMetrics: true,
            }
          }],
          type: projectData.type || 'General',
          files: projectData.files || [],
          metrics: projectData.metrics || {
            totalTasks: 0,
            completedTasks: 0,
            accuracy: 0,
            avgTimePerTask: '0 min',
            issuesFound: 0,
            qualityScore: 0,
            lastActivityAt: new Date().toISOString(),
          },
          rbac: projectData.rbac || {
            owner: currentUserId,
            admins: [currentUserId],
            managers: [],
            developers: [],
            vendors: [],
            evaluators: [],
            viewers: [],
          },
          tags: projectData.tags || [],
          priority: projectData.priority || 'medium',
          deadline: projectData.deadline,
          evaluationStructure: projectData.evaluationStructure || basicEvaluationStructure,
          formattedDate: 'Invalid Date', // Will be set by backend
        };
        
        // Save the project using projectService
        const savedProject = await projectService.createProject(newProject);
        
        // Update the local state with the new project returned from the API
        // This ensures we have the project as it was actually saved in the database
        setProjects((prev) => [savedProject, ...prev]);
        
 
        router.push(`/projects/evaluation-builder/${savedProject.id}`);
        
        setShowCreateModal(false);
      } catch (err) {
        console.error("Error creating project:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create project"
        );
      } finally {
        setLoading(false);
      }
    },
    [user, router] // Update dependencies
  );


  const handleImportProjects = useCallback(
    async (selectedProjects: any[]) => {
      try {
        setLoading(true);
        const currentUserId = user?.sub || "1"; // Use user ID from context
        const importedProjects: ProjectWithMetrics[] = selectedProjects.map(
          (project) => {
            const projectId = `imported-${Date.now()}-${project.id}`;
            return {
              id: projectId,
              name: project.name || 'Imported Project',
              description: project.description || 'Imported project description',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'active',
              createdBy: currentUserId,
              role: 'Owner',
              assignees: [],
              type: 'General',
              files: [],
              metrics: {
                totalTasks: project.totalTasks || 0,
                completedTasks: 0,
                accuracy: 0,
                avgTimePerTask: '0 min',
                issuesFound: 0,
                qualityScore: 0,
                lastActivityAt: new Date().toISOString(),
              },
              rbac: {
                owner: currentUserId,
                admins: [currentUserId],
                managers: [],
                developers: [],
                vendors: [],
                evaluators: [],
                viewers: [],
              },
              tags: [],
              priority: 'medium',
              deadline: undefined,
              evaluationStructure: {
                form_version: "1.0",
                project_id: projectId,
                layout: {
                  header: [],
                  body: []
                }
              },
              formattedDate: 'Invalid Date', // Will be set by backend
            }
          }
        );
      
        // Save each imported project to the database and collect the saved projects
        const savedProjects: ProjectWithMetrics[] = [];
        for (const project of importedProjects) {
          try {
            const savedProject = await projectService.createProject(project);
            savedProjects.push(savedProject);
          } catch (error) {
            console.error("Error saving project to database:", error);
            // Continue with other projects even if one fails
          }
        }
      
        // Get existing imported projects from localStorage
        const storedImportedProjects = localStorage.getItem('importedProjects');
        let existingImportedProjects: ProjectWithMetrics[] = [];
        
        if (storedImportedProjects) {
          try {
            const parsedProjects = JSON.parse(storedImportedProjects);
            // Use the backend-provided formattedDate directly
            existingImportedProjects = parsedProjects.map((project: ProjectWithMetrics) => {
              return {
                ...project,
                formattedDate: project.formattedDate || 'Invalid Date'
              };
            });
          } catch (e) {
            console.error('Failed to parse stored imported projects:', e);
          }
        }
        
        // Combine new saved projects with existing ones
        const allImportedProjects = [...savedProjects, ...existingImportedProjects];
        
        // Store all imported projects in localStorage as backup
        localStorage.setItem('importedProjects', JSON.stringify(allImportedProjects));
        
        // Update state with all projects, ensuring no duplicates
        setProjects((prev) => {
          // Create a map of all current projects
          const projectMap = new Map<string, ProjectWithMetrics>();
          
          // Add existing projects first
          prev.forEach(project => {
            projectMap.set(project.id, project);
          });
          
          // Add imported projects (they will override if IDs match)
          allImportedProjects.forEach(project => {
            projectMap.set(project.id, project);
          });
          
          // Convert map back to array
          return Array.from(projectMap.values());
        });
        
        setShowImportModal(false);
      } catch (err) {
        console.error("Error importing projects:", err);
        setError(
          err instanceof Error ? err.message : "Failed to import projects"
        );
      } finally {
        setLoading(false);
      }
    },
    [user] // Update dependencies
  );

  const currentUserId = user?.sub || "1"; // Use user ID from context

  const filteredProjects = projects
    .filter((project) => {
      if (activeFilter === "assigned") {
        return project.createdBy === currentUserId;
      }
      return true;
    })
    .filter((project) => {
      const term = debouncedSearchTerm.trim().toLowerCase();
      if (!term) return true;
      return (
        project.name.toLowerCase().includes(term) ||
        (project.description?.toLowerCase().includes(term) ?? false) ||
        project.id.toLowerCase().includes(term)
      );
    });

  const resultCount = filteredProjects.length;

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8 text-slate-600 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading projects...
          </div>
          <ProjectListSkeleton viewMode="list" />
        </main>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchProjects} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Manage and organize your projects efficiently
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-slate-700 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-label="Import sample projects"
              >
                Import Samples
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex cursor-pointer items-center px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 border border-transparent rounded-xl cursor-pointer"
                disabled={loading}
                aria-label="Create new project"
              >
                Create New Project
              </button>
            </div>
          </div>
        </section>

        {/* Controls Section - Removed white background container */}
        <section className={`mt-6 ${debouncedSearchTerm ? 'mb-2' : 'mb-6'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full h-10 pl-10 pr-9 border border-slate-200 rounded-xl bg-white/70 backdrop-blur-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all text-slate-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-label="Search projects"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="inline-flex rounded-xl bg-slate-100/60 p-1">
              <button
                onClick={() => setActiveFilter("all")}
                disabled={loading}
                className={`px-4 h-9 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeFilter === "all"
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-white hover:text-green-700"
                }`}
                aria-pressed={activeFilter === "all"}
              >
                All Projects
              </button>
              <button
                onClick={() => setActiveFilter("assigned")}
                disabled={loading}
                className={`px-4 h-9 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeFilter === "assigned"
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-white hover:text-green-700"
                }`}
                aria-pressed={activeFilter === "assigned"}
              >
                My Projects
              </button>
            </div>
          </div>
        </section>

        {/* Results Summary */}
        {debouncedSearchTerm && (
          <div className="mb-4 text-sm text-slate-600">
            Found {resultCount} project{resultCount !== 1 ? "s" : ""}
          </div>
        )}

        {/* Projects List */}
        <section>
          <ProjectsList
            projects={filteredProjects}
            onSelectProject={handleSelectProject}
            onCreateProject={() => setShowCreateModal(true)}
            loading={loading}
            highlightTerm={debouncedSearchTerm}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </section>
      </main>

      {/* Modals */}
      <CreateProjectModal
        open={showCreateModal}
        setOpen={setShowCreateModal}
        onCreateProject={handleCreateProject}
      />

      <ImportSampleProjectsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportProjects={handleImportProjects}
      />
    </div>
  );
};

export default withAuth(ProjectsPage);