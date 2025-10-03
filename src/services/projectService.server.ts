import { ProjectWithMetrics, ProjectAssignee, UserRole } from '@/types';
import { getProjects, getProjectById, createProject, updateProject, deleteProject, getUserProjectRole, updateProjectRBAC, saveEvaluationStructure, getEvaluationStructure, getUserById } from '@/lib/db/queries';

export class ProjectServerService {
  /**
   * Gets project team members for dashboard with caching
   */
  private teamDataCache = new Map<string, { data: any[], timestamp: number }>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async getProjectTeam(projectId: string): Promise<any[]> {
    // Check cache first
    const cached = this.teamDataCache.get(projectId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Import the database query function here to avoid circular dependencies
      const { getTeamMemberStatsByProjectId } = await import('@/lib/db/queries');
      
      // Fetch real team member statistics from database
      const teamStats = await getTeamMemberStatsByProjectId(projectId);
      
      // Transform database team stats to dashboard team members format
      const teamMembers = teamStats.map((member) => ({
        id: member.id,
        name: member.name,
        tasks: member.tasksAssigned,
        accuracy: member.accuracy > 0 ? `${member.accuracy.toFixed(1)}%` : 'N/A',
        avgTime: member.avgTimePerTask ? `${member.avgTimePerTask} min` : 'N/A',
        issues: member.issuesReported,
        avatarUrl: member.avatarUrl || undefined,
        specialization: member.role,
        responseQuality: member.tasksCompleted > 0 ? Math.min(100, Math.floor((member.tasksCompleted / member.tasksAssigned) * 100)) : 0,
        evaluationsToday: 0 // This would require additional tracking
      }));

      // Cache the result
      this.teamDataCache.set(projectId, { data: teamMembers, timestamp: now });
      
      return teamMembers;
    } catch (error) {
      console.error('Error fetching project team:', error);
      throw new Error(`Failed to fetch project team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets project workflow stats for dashboard with caching
   */
  private workflowDataCache = new Map<string, { data: { week: any[], month: any[] }, timestamp: number }>();

  async getProjectWorkflowStats(projectId: string, timeframe: "week" | "month" = "week"): Promise<any[]> {
    // Check cache first
    const cached = this.workflowDataCache.get(projectId);
    const now = Date.now();
    
    let weekData: any[] = [];
    let monthData: any[] = [];
    
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      weekData = cached.data.week;
      monthData = cached.data.month;
    } else {
      try {
        // Import the database query function here to avoid circular dependencies
        const { getProjectWorkflowStats } = await import('@/lib/db/queries');
        
        // Fetch real workflow statistics from database
        const weekStats = await getProjectWorkflowStats(projectId, 7);
        const monthStats = await getProjectWorkflowStats(projectId, 30);
        
        // Transform database workflow stats to dashboard format
        weekData = weekStats.map((data) => ({
          date: new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' }),
          total: data.tasksCreated,
          completed: data.tasksCompleted,
          inProgress: Math.max(0, data.tasksCreated - data.tasksCompleted)
        }));
        
        monthData = monthStats.map((data) => ({
          date: new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          total: data.tasksCreated,
          completed: data.tasksCompleted,
          inProgress: Math.max(0, data.tasksCreated - data.tasksCompleted)
        }));
        
        // Cache both datasets
        this.workflowDataCache.set(projectId, { 
          data: { week: weekData, month: monthData }, 
          timestamp: now 
        });
      } catch (error) {
        console.error('Error fetching project workflow stats:', error);
        throw new Error(`Failed to fetch project workflow stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return timeframe === 'week' ? weekData : monthData;
  }

  /**
   * Gets project activities for dashboard
   */
  async getProjectActivities(projectId: string): Promise<any[]> {
    try {
      // Import the database query function here to avoid circular dependencies
      const { getProjectActivityLogs } = await import('@/lib/db/queries');
      
      // Fetch real activity logs from database
      const activityLogs = await getProjectActivityLogs(projectId, 10);
      
      // Transform database activity logs to dashboard activities format
      const activities = activityLogs.map((log) => ({
        id: log.id,
        user: log.userName || "Unknown User",
        action: log.action,
        timestamp: log.timestamp,
        type: log.targetType === 'task' ? 'completed' : log.targetType === 'issue' ? 'reported' : 'submitted',
        score: log.targetType === 'task' ? 90 + Math.floor(Math.random() * 10) : undefined // In a real implementation, this would come from actual data
      }));
      
      return activities;
    } catch (error) {
      console.error('Error fetching project activities:', error);
      throw new Error(`Failed to fetch project activities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add memory cache for better performance
  private generalCache = new Map<string, { data: any; timestamp: number }>();
  private generalCacheExpiry = 5 * 60 * 1000; // 5 minutes

  private getCachedData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.generalCache.get(key);
    const now = Date.now();

    // Check if we have valid cached data
    if (cached && (now - cached.timestamp) < this.generalCacheExpiry) {
      return Promise.resolve(cached.data);
    }

    // Fetch fresh data and cache it
    return fetchFn().then(data => {
      this.generalCache.set(key, { data, timestamp: now });
      return data;
    });
  }

  async getProjects(userId?: string): Promise<ProjectWithMetrics[]> {
    const cacheKey = `projects-${userId || 'all'}`;
    const projects = await this.getCachedData(cacheKey, () => getProjects(userId));
    
    // Add formattedDate to each project
    return projects.map(project => ({
      ...project,
      formattedDate: new Date(project.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    }));
  }

  async getProject(id: string): Promise<ProjectWithMetrics | null> {
    const cacheKey = `project-${id}`;
    const project = await this.getCachedData(cacheKey, () => getProjectById(id));
    
    if (!project) return null;
    
    // Add formattedDate to the project
    return {
      ...project,
      formattedDate: new Date(project.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    };
  }

  async createProject(projectData: any): Promise<ProjectWithMetrics> {
    try {
      // If projectData doesn't have all required fields, create a complete project object
      const completeProjectData = this.createCompleteProjectObject(projectData);
      
      const newProject = await createProject(completeProjectData);
      
      return {
        ...newProject,
        formattedDate: new Date(newProject.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      };
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProject(id: string, updates: Partial<ProjectWithMetrics>): Promise<ProjectWithMetrics | null> {
    try {
      const updatedProject = await updateProject(id, updates);
      if (!updatedProject) return null;
      
      return {
        ...updatedProject,
        formattedDate: new Date(updatedProject.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      };
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      return await deleteProject(id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserProjectRole(projectId: string, userId: string): Promise<UserRole | null> {
    try {
      return await getUserProjectRole(projectId, userId);
    } catch (error) {
      console.error('Error fetching user project role:', error);
      throw new Error(`Failed to fetch user project role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProjectRBAC(projectId: string, rbac: Partial<ProjectWithMetrics['rbac']>): Promise<boolean> {
    try {
      return await updateProjectRBAC(projectId, rbac);
    } catch (error) {
      console.error('Error updating project RBAC:', error);
      throw new Error(`Failed to update project RBAC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveEvaluationStructure(projectId: string, evaluationStructure: any): Promise<boolean> {
    try {
      return await saveEvaluationStructure(projectId, evaluationStructure);
    } catch (error) {
      console.error('Error saving evaluation structure:', error);
      throw new Error(`Failed to save evaluation structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEvaluationStructure(projectId: string): Promise<any | null> {
    try {
      return await getEvaluationStructure(projectId);
    } catch (error) {
      console.error('Error fetching evaluation structure:', error);
      throw new Error(`Failed to fetch evaluation structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getUserById(id: string): Promise<ProjectAssignee | null> {
    try {
      return await getUserById(id);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets project metrics for dashboard
   */
  async getProjectMetrics(projectId: string): Promise<any> {
    try {
      const project = await this.getProject(projectId);
      if (!project) return null;
      
      return {
        totalEvaluations: project.metrics.totalTasks,
        inProgress: project.metrics.totalTasks - project.metrics.completedTasks,
        completed: project.metrics.completedTasks,
        totalDuration: project.metrics.avgTimePerTask,
        avgTimePerEvaluation: project.metrics.avgTimePerTask,
        avgAccuracy: project.metrics.accuracy,
        modelPerformance: project.metrics.qualityScore ? (project.metrics.qualityScore >= 90 ? "A" : project.metrics.qualityScore >= 80 ? "B" : "C") : "N/A",
        lastUpdated: project.metrics.lastActivityAt || new Date().toISOString(),
        weeklyGrowth: 0, // This would need to be calculated from historical data
        qualityScore: project.metrics.qualityScore || 0,
        throughput: project.metrics.totalTasks
      };
    } catch (error) {
      console.error('Error fetching project metrics:', error);
      throw new Error(`Failed to fetch project metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets all dashboard data in a single call for better performance
   */
  async getDashboardData(projectId: string): Promise<{ metrics: any, team: any[], workflow: { week: any[], month: any[] } }> {
    try {
      // Fetch all data in parallel
      const [metrics, team, workflowWeek, workflowMonth] = await Promise.all([
        this.getProjectMetrics(projectId),
        this.getProjectTeam(projectId),
        this.getProjectWorkflowStats(projectId, 'week'),
        this.getProjectWorkflowStats(projectId, 'month')
      ]);
      
      return {
        metrics,
        team,
        workflow: {
          week: workflowWeek,
          month: workflowMonth
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(`Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a complete project object with all required fields
   * This ensures that projects created with minimal data still have all required fields
   */
  private createCompleteProjectObject(projectData: any): any {
    const projectId = projectData.id || `project-${Date.now()}`;
    const currentUserId = projectData.createdBy || 'current-user';
    // Format datetime for MySQL compatibility
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Ensure createdAt and updatedAt are properly formatted for MySQL
    const formatDateTime = (date: string | Date | undefined): string => {
      if (!date) return now;
      if (typeof date === 'string' && date.includes('T')) {
        // Convert ISO string to MySQL datetime format
        return date.slice(0, 19).replace('T', ' ');
      }
      if (date instanceof Date) {
        return date.toISOString().slice(0, 19).replace('T', ' ');
      }
      return date as string;
    };
    
    // Create a basic evaluation structure for new projects if not provided
    const evaluationStructure = projectData.evaluationStructure || {
      form_version: "1.0",
      project_id: projectId,
      layout: {
        header: [],
        body: []
      }
    };
    
    return {
      id: projectId,
      name: projectData.name || 'Untitled Project',
      description: projectData.description || '',
      createdAt: formatDateTime(projectData.createdAt || new Date()),
      updatedAt: formatDateTime(projectData.updatedAt || projectData.createdAt || new Date()),
      status: projectData.status || 'active',
      createdBy: currentUserId,
      role: projectData.role || 'Owner',
      assignees: projectData.assignees || [],
      type: projectData.type || 'General',
      files: projectData.files || [],
      metrics: {
        totalTasks: projectData.metrics?.totalTasks || 0,
        completedTasks: projectData.metrics?.completedTasks || 0,
        accuracy: projectData.metrics?.accuracy || 0,
        avgTimePerTask: projectData.metrics?.avgTimePerTask || '0 min',
        issuesFound: projectData.metrics?.issuesFound || 0,
        qualityScore: projectData.metrics?.qualityScore || 0,
        lastActivityAt: projectData.metrics?.lastActivityAt ? formatDateTime(projectData.metrics?.lastActivityAt) : null,
      },
      rbac: {
        owner: projectData.rbac?.owner || currentUserId,
        admins: projectData.rbac?.admins || [currentUserId],
        managers: projectData.rbac?.managers || [],
        developers: projectData.rbac?.developers || [],
        vendors: projectData.rbac?.vendors || [],
        evaluators: projectData.rbac?.evaluators || [],
        viewers: projectData.rbac?.viewers || [],
      },
      tags: projectData.tags || [],
      priority: projectData.priority || 'medium',
      deadline: projectData.deadline ? formatDateTime(projectData.deadline) : undefined,
      evaluationStructure: evaluationStructure
    };
  }

  /**
   * Creates or updates project settings
   */
  async createOrUpdateProjectSettings(projectId: string, settings: any): Promise<boolean> {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called on the server side');
    }
    
    try {
      console.log('ProjectService: Creating/updating settings for project', projectId);
      // Import the database query function here to avoid circular dependencies
      const { createProjectSettings } = await import('@/lib/db/queries');
      return await createProjectSettings(projectId, settings);
    } catch (error) {
      console.error('ProjectService: Error creating/updating project settings:', error);
      throw new Error(`Failed to create/update project settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets project settings
   */
  async getProjectSettings(projectId: string): Promise<any> {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called on the server side');
    }
    
    try {
      console.log('ProjectService: Fetching settings for project', projectId);
      // Import the database query function here to avoid circular dependencies
      const { getProjectSettings } = await import('@/lib/db/queries');
      return await getProjectSettings(projectId);
    } catch (error) {
      console.error('ProjectService: Error fetching project settings:', error);
      throw new Error(`Failed to fetch project settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates an evaluation project
   */
  async createEvaluationProject(evaluationProjectData: any): Promise<any> {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called on the server side');
    }
    
    try {
      console.log('ProjectService: Creating evaluation project for project', evaluationProjectData.projectId);
      // Import the database query function here to avoid circular dependencies
      const { createEvaluationProject } = await import('@/lib/db/queries');
      return await createEvaluationProject(evaluationProjectData);
    } catch (error) {
      console.error('ProjectService: Error creating evaluation project:', error);
      throw new Error(`Failed to create evaluation project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates an evaluation project
   */
  async updateEvaluationProject(id: string, updates: any): Promise<any> {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called on the server side');
    }
    
    try {
      console.log('ProjectService: Updating evaluation project', id);
      // Import the database query function here to avoid circular dependencies
      const { updateEvaluationProject } = await import('@/lib/db/queries');
      return await updateEvaluationProject(id, updates);
    } catch (error) {
      console.error('ProjectService: Error updating evaluation project:', error);
      throw new Error(`Failed to update evaluation project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets evaluation projects for a project
   */
  async getEvaluationProjects(projectId: string): Promise<any[]> {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called on the server side');
    }
    
    try {
      console.log('ProjectService: Fetching evaluation projects for project', projectId);
      // Import the database query function here to avoid circular dependencies
      const { getEvaluationProjectsByProjectId } = await import('@/lib/db/queries');
      return await getEvaluationProjectsByProjectId(projectId);
    } catch (error) {
      console.error('ProjectService: Error fetching evaluation projects:', error);
      throw new Error(`Failed to fetch evaluation projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const projectServerService = new ProjectServerService();