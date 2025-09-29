"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, RefreshCw, Package, TrendingUp } from "lucide-react";
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

type FilterKey = "all" | "submitted" | "approved";

const VendorProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const router = useRouter();

  const getCurrentUserId = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userId") || "1";
    }
    return "1";
  }, []);

  const fetchProjects = useCallback(async () => { 
    try {
      setLoading(true);
      setError(null);
      const currentUserId = getCurrentUserId();
      // Use projectService instead of tempDataService to avoid bundling database code
      const data = await projectService.getProjects(currentUserId);
      
      // Get any stored imported projects from localStorage
      const storedImportedProjects = localStorage.getItem('vendorImportedProjects');
      let importedProjects: ProjectWithMetrics[] = [];
      
      if (storedImportedProjects) {
        try {
          importedProjects = JSON.parse(storedImportedProjects);
        } catch (e) {
          console.error('Failed to parse stored imported projects:', e);
        }
      }
      
      setProjects([...importedProjects, ...data]);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSelectProject = useCallback(
    (project: ProjectWithMetrics) => {
      router.push(`/projects/dashboard/${project.id}`);
    },
    [router]
  );

  const handleCreateProject = useCallback(
    async (projectData: Partial<ProjectWithMetrics>) => {
      try {
        setLoading(true);
        const currentUserId = getCurrentUserId();
        const newProject: ProjectWithMetrics = {
          id: `vendor-project-${Date.now()}`,
          name: projectData.name || 'Untitled Vendor Project',
          description: projectData.description || 'No description provided',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: projectData.status || 'pending',
          createdBy: currentUserId,
          role: projectData.role || 'Owner',
          assignees: projectData.assignees || [],
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
            vendors: [currentUserId],
            evaluators: [],
            viewers: [],
          },
          tags: projectData.tags || [],
          priority: projectData.priority || 'medium',
          deadline: projectData.deadline,
          formattedDate: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
        };
        setProjects((prev) => [newProject, ...prev]);
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
    [getCurrentUserId]
  );

  const handleImportProjects = useCallback(
    async (selectedProjects: any[]) => {
      try {
        setLoading(true);
        const currentUserId = getCurrentUserId();
        const importedProjects: ProjectWithMetrics[] = selectedProjects.map(
          (project) => ({
            id: `vendor-imported-${Date.now()}-${project.id || 'unknown'}`,
            name: project.name || 'Imported Vendor Project',
            description: project.description || 'Imported vendor project description',
            createdAt: project.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: (project.status as any) || 'pending',
            createdBy: currentUserId,
            role: project.role || 'Owner',
            assignees: project.assignees || [],
            type: (project.type as any) || 'General',
            files: project.files || [],
            metrics: project.metrics || {
              totalTasks: 0,
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
              vendors: [currentUserId],
              evaluators: [],
              viewers: [],
            },
            tags: project.tags || [],
            priority: project.priority || 'medium',
            deadline: project.deadline,
            formattedDate: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
          })
        );
        
        // Get existing imported projects from localStorage
        const storedImportedProjects = localStorage.getItem('vendorImportedProjects');
        let existingImportedProjects: ProjectWithMetrics[] = [];
        
        if (storedImportedProjects) {
          try {
            existingImportedProjects = JSON.parse(storedImportedProjects);
          } catch (e) {
            console.error('Failed to parse stored imported projects:', e);
          }
        }
        
        // Combine new imported projects with existing ones
        const allImportedProjects = [...importedProjects, ...existingImportedProjects];
        
        // Store all imported projects in localStorage
        localStorage.setItem('vendorImportedProjects', JSON.stringify(allImportedProjects));
        
        // Update state with all projects
        setProjects((prev) => {
          // Filter out existing projects to avoid duplicates
          const existingIds = new Set(allImportedProjects.map(p => p.id));
          const filteredPrev = prev.filter(p => !p.id.startsWith('vendor-imported-') || !existingIds.has(p.id));
          return [...allImportedProjects, ...filteredPrev];
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
    [getCurrentUserId]
  );

  const currentUserId = getCurrentUserId();

  const filteredProjects = projects
    .filter((project) => {
      if (activeFilter === "submitted") {
        return project.status === 'pending' || project.status === 'active';
      }
      if (activeFilter === "approved") {
        return project.status === 'completed' || project.status === 'archived';
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
            Loading vendor projects...
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
              <h1 className="text-3xl font-bold text-slate-900">Vendor Projects</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Submit, manage, and track your vendor projects and deliverables
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
                className="inline-flex cursor-pointer items-center px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-label="Submit new project"
              >
                Submit New Project
              </button>
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <section className={`mt-6 ${debouncedSearchTerm ? 'mb-2' : 'mb-6'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search vendor projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full h-10 pl-10 pr-9 border border-slate-200 rounded-xl bg-white/70 backdrop-blur-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all text-slate-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-label="Search vendor projects"
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
                onClick={() => setActiveFilter("submitted")}
                disabled={loading}
                className={`px-4 h-9 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeFilter === "submitted"
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-white hover:text-green-700"
                }`}
                aria-pressed={activeFilter === "submitted"}
              >
                <Package className="w-4 h-4 mr-1" />
                Submissions
              </button>
              <button
                onClick={() => setActiveFilter("approved")}
                disabled={loading}
                className={`px-4 h-9 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeFilter === "approved"
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-white hover:text-green-700"
                }`}
                aria-pressed={activeFilter === "approved"}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Approved
              </button>
            </div>
          </div>

          {/* Search Results Info */}
          {debouncedSearchTerm && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs">
                Found
                <span className="font-semibold text-green-700">
                  {resultCount}
                </span>
                result{resultCount !== 1 ? 's' : ''} for "{debouncedSearchTerm}"
              </span>
            </div>
          )}
        </section>

        {/* Projects List Content */}
        <section className="mt-6">
          {filteredProjects.length > 0 ? (
            loading && projects.length === 0 ? (
              <ProjectListSkeleton viewMode="list" />
            ) : (
              <ProjectsList
                projects={filteredProjects}
                onSelectProject={handleSelectProject}
                loading={loading}
                highlightTerm={debouncedSearchTerm}
              />
            )
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 p-12">
              <EmptyState
                title={
                  debouncedSearchTerm
                    ? "No projects match your search"
                    : "Ready to submit your first project?"
                }
                description={
                  debouncedSearchTerm
                    ? "Try adjusting your search criteria or submit a new project"
                    : "Start building your vendor portfolio by submitting your first project or exploring our samples"
                }
                action={
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 items-center justify-center">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
                    >
                      Submit Your First Project
                    </button>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                    >
                      Explore Sample Projects
                    </button>
                  </div>
                }
              />
            </div>
          )}
        </section>

        {/* Modals */}
        <CreateProjectModal
          open={showCreateModal}
          setOpen={setShowCreateModal}
        />

        <ImportSampleProjectsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportProjects={handleImportProjects}
          isLoading={loading}
        />
      </main>
    </div>
  );
};

export default withAuth(VendorProjectsPage);