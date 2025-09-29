// Main types file - exports all types used across the application

export type UserRole = 'owner' | 'admin' | 'manager' | 'developer' | 'vendor' | 'evaluator' | 'viewer';

export type ProjectStatus = 'active' | 'pending' | 'completed' | 'paused' | 'archived';

export type ProjectType = 'Text Annotation' | 'Image Classification' | 'Sentiment Analysis' | 'Named Entity Recognition' | 'Audio Classification' | 'Video Analysis' | 'General';

// Add EvaluationFormConfig type import
import { EvaluationFormConfig } from './evaluation-builder';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  avatar?: string;
  createdAt: Date | string;
  userId: string;
  role: UserRole;
  userType: 'client' | 'developer' | 'vendor';
  department?: string;
  isActive: boolean;
}

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  accuracy: number;
  avgTimePerTask: string;
  issuesFound: number;
  qualityScore?: number;
  lastActivityAt?: string;
}

export interface ProjectRBAC {
  owner: string; // User ID of project owner
  admins: string[]; // User IDs with admin access
  managers: string[]; // User IDs with manager access
  developers: string[]; // User IDs with developer access
  vendors: string[]; // User IDs with vendor access
  evaluators: string[]; // User IDs with evaluator access
  viewers: string[]; // User IDs with view-only access
}

export interface ProjectAssignee extends User {
  assignedAt: string;
  assignedBy: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canAssign: boolean;
    canEvaluate: boolean;
    canViewMetrics: boolean;
  };
}

export interface ProjectWithMetrics {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  createdBy: string;
  role: string; // Current user's role in this project
  assignees: ProjectAssignee[];
  type: ProjectType;
  files?: any[];
  metrics: ProjectMetrics;
  formattedDate?: string;
  rbac: ProjectRBAC;
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  // Add evaluation structure field
  evaluationStructure?: EvaluationFormConfig;
}

// Re-export auth types
export * from './auth';

// Re-export marketplace types
export * from './marketplace';

// Re-export evaluation-builder types
export * from './evaluation-builder';