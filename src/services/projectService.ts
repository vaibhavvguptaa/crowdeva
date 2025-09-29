import { ProjectWithMetrics, ProjectAssignee, UserRole } from '@/types';

class ProjectService {
  // Check if we're running on the client side
  private isClientSide(): boolean {
    return typeof window !== 'undefined';
  }

  // Client-side API call helper
  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  async getProjects(userId?: string): Promise<ProjectWithMetrics[]> {
    // Remove artificial delay for production
    // await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use API calls on client side
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.apiCall<ProjectWithMetrics[]>(`/api/projects${params}`);
  }

  async getProject(id: string): Promise<ProjectWithMetrics | null> {
    // Remove artificial delay for production
    // await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use API calls on client side
    try {
      return await this.apiCall<ProjectWithMetrics>(`/api/projects/${encodeURIComponent(id)}`);
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createProject(projectData: Partial<ProjectWithMetrics>): Promise<ProjectWithMetrics> {
    // Remove artificial delay for production
    // await new Promise(resolve => setTimeout(resolve, 400));
    
    // Use API calls on client side
    return this.apiCall<ProjectWithMetrics>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, updates: Partial<ProjectWithMetrics>): Promise<ProjectWithMetrics | null> {
    // Remove artificial delay for production
    // await new Promise(resolve => setTimeout(resolve, 350));
    
    // Use API calls on client side
    try {
      return await this.apiCall<ProjectWithMetrics>(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    // Remove artificial delay for production
    // await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use API calls on client side
    try {
      await this.apiCall(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        return false;
      }
      throw error;
    }
  }

  async getAvailableUsers(): Promise<ProjectAssignee[]> {
    // Remove artificial delay for production
    // await new Promise(resolve => setTimeout(resolve, 200));
    
    // Use API calls on client side (you would need to implement this endpoint)
    try {
      return await this.apiCall<ProjectAssignee[]>('/api/users');
    } catch (error) {
      console.error('Error fetching users from API:', error);
      return [];
    }
  }

  async updateProjectRBAC(projectId: string, rbac: Partial<ProjectWithMetrics['rbac']>): Promise<boolean> {
    // Remove artificial delay for production
    // await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use API calls on client side (you would need to implement this endpoint)
    try {
      await this.apiCall(`/api/projects/${encodeURIComponent(projectId)}/rbac`, {
        method: 'PUT',
        body: JSON.stringify(rbac),
      });
      return true;
    } catch (error) {
      console.error('Error updating project RBAC via API:', error);
      return false;
    }
  }
  
  // Method to save evaluation structure for a project
  async saveEvaluationStructure(projectId: string, evaluationStructure: any): Promise<boolean> {
    // Remove artificial delay for production
    // await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use API calls on client side
    try {
      await this.apiCall(`/api/projects/${encodeURIComponent(projectId)}/evaluation-structure`, {
        method: 'POST',
        body: JSON.stringify(evaluationStructure),
      });
      return true;
    } catch (error) {
      console.error('Error saving evaluation structure via API:', error);
      return false;
    }
  }
  
  // Method to get evaluation structure for a project
  async getEvaluationStructure(projectId: string): Promise<any | null> {
    // Remove artificial delay for production
    // await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use API calls on client side
    try {
      return await this.apiCall<any>(`/api/projects/${encodeURIComponent(projectId)}/evaluation-structure`);
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }
}

export const projectService = new ProjectService();