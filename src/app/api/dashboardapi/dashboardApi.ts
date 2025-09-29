import { httpClient } from "./httpClient";

export interface ProjectMetrics {
  totalEvaluations: number;
  inProgress: number;
  completed: number;
  totalDuration: string;
  avgTimePerEvaluation: string;
  avgAccuracy: number;
  modelPerformance: string;
  lastUpdated: string;
  weeklyGrowth: number;
  qualityScore: number;
  throughput: number;
}

export interface TeamMember {
  id: string;
  name: string;
  tasks: number;
  accuracy: string;
  avgTime: string;
  issues: number;
  avatarUrl?: string;
  specialization: string;
  responseQuality: number;
  evaluationsToday: number;
}

export interface WorkflowActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: "completed" | "reported" | "submitted" | "reviewed";
  score?: number;
}

export interface WorkflowStats {
  labels: string[];
  values: number[];
}

export interface FormattedWorkflowStats {
  date: string;
  total: number;
  completed: number;
  inProgress: number;
}

export interface DashboardData {
  metrics: ProjectMetrics;
  teamMembers: TeamMember[];
  recentActivities: WorkflowActivity[];
  workflowStats: WorkflowStats;
}

// Define valid project IDs as a union type
export type ProjectId = 'llm-evaluation-gpt4' | 'llm-evaluation-claude' | 'llm-evaluation-llama';

// Project data structure
interface ProjectData {
  metrics: ProjectMetrics;
  teamMembers: TeamMember[];
  recentActivities: WorkflowActivity[];
  workflowStats: WorkflowStats;
}

// Type guard to check if a string is a valid project ID
function isValidProjectId(projectId: string): projectId is ProjectId {
  return ['llm-evaluation-gpt4', 'llm-evaluation-claude', 'llm-evaluation-llama'].includes(projectId);
}

// Default values
const getDefaultMetrics = (): ProjectMetrics => ({
  totalEvaluations: 0,
  inProgress: 0,
  completed: 0,
  totalDuration: "0h 0m",
  avgTimePerEvaluation: "0m 0s",
  avgAccuracy: 0,
  modelPerformance: "N/A",
  lastUpdated: new Date().toISOString(),
  weeklyGrowth: 0,
  qualityScore: 0,
  throughput: 0,
});

const getDefaultWorkflowStats = (): WorkflowStats => ({
  labels: [],
  values: [],
});

// Mock data for LLM evaluation projects
const mockProjects: Record<ProjectId, ProjectData> = {
  "llm-evaluation-gpt4": {
    metrics: {
      totalEvaluations: 1245,
      inProgress: 78,
      completed: 1167,
      totalDuration: "267h 45m",
      avgTimePerEvaluation: "12m 54s",
      avgAccuracy: 0.92,
      modelPerformance: "A-",
      lastUpdated: new Date().toISOString(),
      weeklyGrowth: 12.5,
      qualityScore: 87,
      throughput: 42,
    },
    teamMembers: [
      {
        id: "tm-001",
        name: "Alex Johnson",
        tasks: 342,
        accuracy: "94.2%",
        avgTime: "10m 12s",
        issues: 7,
        avatarUrl: "/avatars/alex.png",
        specialization: "Reasoning",
        responseQuality: 92,
        evaluationsToday: 14,
      },
      {
        id: "tm-002",
        name: "Maria Garcia",
        tasks: 287,
        accuracy: "96.8%",
        avgTime: "11m 45s",
        issues: 3,
        avatarUrl: "/avatars/maria.png",
        specialization: "Factuality",
        responseQuality: 95,
        evaluationsToday: 12,
      },
      {
        id: "tm-003",
        name: "David Kim",
        tasks: 215,
        accuracy: "91.5%",
        avgTime: "9m 30s",
        issues: 12,
        avatarUrl: "/avatars/david.png",
        specialization: "Code",
        responseQuality: 88,
        evaluationsToday: 9,
      },
    ],
    recentActivities: [
      {
        id: "act-001",
        user: "Alex Johnson",
        action: "Completed evaluation of GPT-4 response quality",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: "completed",
        score: 92,
      },
      {
        id: "act-002",
        user: "Maria Garcia",
        action: "Reported factual error in model output",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        type: "reported",
      },
      {
        id: "act-003",
        user: "David Kim",
        action: "Submitted code evaluation batch",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        type: "submitted",
        score: 88,
      },
    ],
    workflowStats: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [42, 56, 78, 65, 89, 43, 32],
    },
  },
  "llm-evaluation-claude": {
    metrics: {
      totalEvaluations: 987,
      inProgress: 56,
      completed: 931,
      totalDuration: "198h 30m",
      avgTimePerEvaluation: "11m 12s",
      avgAccuracy: 0.89,
      modelPerformance: "B+",
      lastUpdated: new Date().toISOString(),
      weeklyGrowth: 8.7,
      qualityScore: 82,
      throughput: 38,
    },
    teamMembers: [
      {
        id: "tm-004",
        name: "Sarah Wilson",
        tasks: 278,
        accuracy: "92.1%",
        avgTime: "10m 45s",
        issues: 9,
        avatarUrl: "/avatars/sarah.png",
        specialization: "Reasoning",
        responseQuality: 89,
        evaluationsToday: 11,
      },
      {
        id: "tm-005",
        name: "James Lee",
        tasks: 245,
        accuracy: "90.8%",
        avgTime: "12m 15s",
        issues: 11,
        avatarUrl: "/avatars/james.png",
        specialization: "Factuality",
        responseQuality: 87,
        evaluationsToday: 9,
      },
      {
        id: "tm-006",
        name: "Emily Chen",
        tasks: 198,
        accuracy: "93.5%",
        avgTime: "9m 50s",
        issues: 6,
        avatarUrl: "/avatars/emily.png",
        specialization: "Code",
        responseQuality: 91,
        evaluationsToday: 8,
      },
    ],
    recentActivities: [
      {
        id: "act-004",
        user: "Sarah Wilson",
        action: "Completed evaluation of Claude response quality",
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        type: "completed",
        score: 89,
      },
      {
        id: "act-005",
        user: "James Lee",
        action: "Reported hallucination in model output",
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        type: "reported",
      },
      {
        id: "act-006",
        user: "Emily Chen",
        action: "Reviewed code generation capabilities",
        timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        type: "reviewed",
        score: 91,
      },
    ],
    workflowStats: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [35, 48, 62, 58, 72, 38, 29],
    },
  },
  "llm-evaluation-llama": {
    metrics: {
      totalEvaluations: 756,
      inProgress: 42,
      completed: 714,
      totalDuration: "156h 20m",
      avgTimePerEvaluation: "12m 25s",
      avgAccuracy: 0.85,
      modelPerformance: "B",
      lastUpdated: new Date().toISOString(),
      weeklyGrowth: 15.2,
      qualityScore: 78,
      throughput: 32,
    },
    teamMembers: [
      {
        id: "tm-007",
        name: "Michael Brown",
        tasks: 215,
        accuracy: "88.7%",
        avgTime: "11m 30s",
        issues: 14,
        avatarUrl: "/avatars/michael.png",
        specialization: "Reasoning",
        responseQuality: 84,
        evaluationsToday: 8,
      },
      {
        id: "tm-008",
        name: "Jennifer Smith",
        tasks: 198,
        accuracy: "89.2%",
        avgTime: "13m 10s",
        issues: 12,
        avatarUrl: "/avatars/jennifer.png",
        specialization: "Factuality",
        responseQuality: 82,
        evaluationsToday: 7,
      },
      {
        id: "tm-009",
        name: "Robert Taylor",
        tasks: 176,
        accuracy: "87.5%",
        avgTime: "10m 45s",
        issues: 15,
        avatarUrl: "/avatars/robert.png",
        specialization: "Code",
        responseQuality: 80,
        evaluationsToday: 6,
      },
    ],
    recentActivities: [
      {
        id: "act-007",
        user: "Michael Brown",
        action: "Completed evaluation of Llama response quality",
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        type: "completed",
        score: 84,
      },
      {
        id: "act-008",
        user: "Jennifer Smith",
        action: "Reported inconsistency in model output",
        timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
        type: "reported",
      },
      {
        id: "act-009",
        user: "Robert Taylor",
        action: "Submitted reasoning evaluation batch",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        type: "submitted",
        score: 80,
      },
    ],
    workflowStats: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [28, 42, 54, 49, 65, 32, 25],
    },
  },
};

export class DashboardAPI {
  private getMockData<T>(
    projectId: string,
    dataKey: keyof ProjectData,
    defaultValue: T
  ): T {
    if (!isValidProjectId(projectId)) {
      console.warn(`Invalid project ID: ${projectId}. Using default data.`);
      return defaultValue;
    }
    return mockProjects[projectId][dataKey] as T;
  }

  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      const response = await httpClient.get(`/api/dashboard/${projectId}/metrics`);
      return response.data;
    } catch (error) {
      console.log("Using mock data for project metrics");
      return this.getMockData(projectId, 'metrics', getDefaultMetrics());
    }
  }

  async getTeamMembers(projectId: string): Promise<TeamMember[]> {
    try {
      const response = await httpClient.get(`/api/dashboard/${projectId}/team`);
      return response.data;
    } catch (error) {
      console.log("Using mock data for team members");
      return this.getMockData(projectId, 'teamMembers', []);
    }
  }

  async getRecentActivities(projectId: string): Promise<WorkflowActivity[]> {
    try {
      const response = await httpClient.get(`/api/dashboard/${projectId}/activities`);
      return response.data;
    } catch (error) {
      console.log("Using mock data for recent activities");
      return this.getMockData(projectId, 'recentActivities', []);
    }
  }

  async getWorkflowStats(
    projectId: string,
    timeframe: "week" | "month"
  ): Promise<FormattedWorkflowStats[]> {
    try {
      const response = await httpClient.get(
        `/api/dashboard/${projectId}/workflow-stats`,
        {
          params: { timeframe },
        }
      );
      return response.data;
    } catch (error) {
      console.log("Using mock data for workflow stats");
      const mockData = this.getMockData(projectId, 'workflowStats', getDefaultWorkflowStats());

      // Format the data as expected by the chart component
      return mockData.labels.map((label, index) => ({
        date: label,
        total: mockData.values[index] || 0,
        completed: Math.floor((mockData.values[index] || 0) * 0.85),
        inProgress: Math.floor((mockData.values[index] || 0) * 0.15),
      }));
    }
  }

  async getDashboardData(projectId: string): Promise<DashboardData> {
    try {
      // Use the combined endpoint for better performance
      const response = await httpClient.get(`/api/dashboard/${projectId}/combined`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to individual API calls if combined endpoint fails
      try {
        const [metrics, teamMembers, recentActivities, workflowStats] = await Promise.all([
          this.getProjectMetrics(projectId),
          this.getTeamMembers(projectId),
          this.getRecentActivities(projectId),
          this.getWorkflowStats(projectId, 'week'),
        ]);

        // Convert formatted stats back to simple stats for dashboard data
        const simpleStats: WorkflowStats = {
          labels: workflowStats.map(stat => stat.date),
          values: workflowStats.map(stat => stat.total),
        };

        return {
          metrics,
          teamMembers,
          recentActivities,
          workflowStats: simpleStats,
        };
      } catch (fallbackError) {
        console.error('Error in fallback dashboard data fetch:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async exportData(projectId: string, format: "csv" | "pdf"): Promise<Blob> {
    try {
      const response = await httpClient.get(`/api/projects/${projectId}/export`, {
        params: { format },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error(`Error exporting data for project ${projectId}:`, error);
      throw error;
    }
  }

  async updateProjectPreferences(
    projectId: string,
    preferences: Record<string, unknown>
  ): Promise<void> {
    try {
      await httpClient.put(`/api/projects/${projectId}/preferences`, preferences);
    } catch (error) {
      console.error(`Error updating preferences for project ${projectId}:`, error);
      throw error;
    }
  }

  // Utility method to get all available project IDs
  getAvailableProjectIds(): ProjectId[] {
    return Object.keys(mockProjects) as ProjectId[];
  }

  // Utility method to check if a project ID is valid
  isValidProject(projectId: string): projectId is ProjectId {
    return isValidProjectId(projectId);
  }
}

export const dashboardApi = new DashboardAPI();
