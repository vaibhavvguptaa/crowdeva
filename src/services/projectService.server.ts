import { ProjectWithMetrics, ProjectAssignee, UserRole } from '@/types';
import { getProjects, getProjectById, createProject, updateProject, deleteProject, getUserProjectRole, updateProjectRBAC, saveEvaluationStructure, getEvaluationStructure, getUserById } from '@/lib/db/queries';

export class ProjectServerService {
  getProjectActivities(projectId: string): any {
    throw new Error('Method not implemented.');
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
    return this.getCachedData(cacheKey, () => getProjects(userId));
  }

  async getProject(id: string): Promise<ProjectWithMetrics | null> {
    const cacheKey = `project-${id}`;
    return this.getCachedData(cacheKey, () => getProjectById(id));
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
      const project = await this.getProject(projectId);
      if (!project) return [];
      
      const teamMembers = project.assignees.map((assignee, index) => ({
        id: assignee.id,
        name: assignee.name,
        tasks: Math.floor(Math.random() * 500), // Placeholder - would need actual task data
        accuracy: `${(assignee.permissions.canEvaluate ? 90 + Math.random() * 10 : 80 + Math.random() * 20).toFixed(1)}%`, // Placeholder
        avgTime: `${Math.floor(5 + Math.random() * 10)}m ${Math.floor(Math.random() * 60)}s`, // Placeholder
        issues: Math.floor(Math.random() * 20), // Placeholder
        avatarUrl: assignee.avatarUrl || `/avatars/user-${index + 1}.png`,
        specialization: assignee.department || "General", // Placeholder
        responseQuality: Math.floor(80 + Math.random() * 20), // Placeholder
        evaluationsToday: Math.floor(Math.random() * 30) // Placeholder
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
      // Generate both week and month data
      const project = await this.getProject(projectId);
      if (!project) return [];
      
      // Generate weekly data (7 days)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      weekData = days.map((day, index) => {
        // Use project metrics to generate realistic data
        const baseValue = Math.max(10, Math.floor(project.metrics.totalTasks / 7));
        const variance = Math.floor(baseValue * 0.5);
        const total = Math.max(0, baseValue + Math.floor(Math.random() * variance * 2) - variance);
        const completed = Math.max(0, Math.floor(total * (project.metrics.accuracy / 100)));
        const inProgress = total - completed;
        
        return {
          date: day,
          total,
          completed,
          inProgress: Math.max(0, inProgress)
        };
      });
      
      // Generate monthly data (4 weeks)
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      monthData = weeks.map((week, index) => {
        // Use project metrics to generate realistic data
        const baseValue = Math.max(20, Math.floor(project.metrics.totalTasks / 4));
        const variance = Math.floor(baseValue * 0.3);
        const total = Math.max(0, baseValue + Math.floor(Math.random() * variance * 2) - variance);
        const completed = Math.max(0, Math.floor(total * (project.metrics.accuracy / 100)));
        const inProgress = total - completed;
        
        return {
          date: week,
          total,
          completed,
          inProgress: Math.max(0, inProgress)
        };
      });
      
      // Cache both datasets
      this.workflowDataCache.set(projectId, { 
        data: { week: weekData, month: monthData }, 
        timestamp: now 
      });
    }
    
    return timeframe === 'week' ? weekData : monthData;
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
      createdAt: formatDateTime(projectData.createdAt),
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
      const result = await createProjectSettings(projectId, settings);
      console.log('ProjectService: Settings creation/update result', result);
      return result;
    } catch (error) {
      console.error('ProjectService: Error creating/updating project settings:', error);
      throw new Error(`Failed to create/update project settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets project settings
   */
  async getProjectSettings(projectId: string): Promise<any | null> {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called on the server side');
    }
    
    try {
      console.log('ProjectService: Fetching settings for project', projectId);
      // Import the database query function here to avoid circular dependencies
      const { getProjectSettings } = await import('@/lib/db/queries');
      const result = await getProjectSettings(projectId);
      console.log('ProjectService: Settings fetch result', result ? 'Found' : 'Not found');
      return result;
    } catch (error) {
      console.error('ProjectService: Error fetching project settings:', error);
      throw new Error(`Failed to fetch project settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates project settings
   */
  async updateProjectSettings(projectId: string, settings: Partial<any>): Promise<boolean> {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called on the server side');
    }
    
    try {
      // Import the database query function here to avoid circular dependencies
      const { updateProjectSettings } = await import('@/lib/db/queries');
      return await updateProjectSettings(projectId, settings);
    } catch (error) {
      console.error('Error updating project settings:', error);
      throw new Error(`Failed to update project settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const projectServerService = new ProjectServerService();