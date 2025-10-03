import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { withApiAuth } from '@/lib/apiAuth';
import { getEvaluationProjectsByProjectId } from '@/lib/db/queries';

// Define the EvaluationProject interface to match the frontend
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

export const GET = withApiAuth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId } = resolvedParams;
    
    // Get project data to verify access and get related information
    const project = await projectServerService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch real evaluation projects from the database
    const dbEvaluationProjects = await getEvaluationProjectsByProjectId(projectId);
    
    // Transform database evaluation projects to match the frontend interface
    const evaluationProjects: EvaluationProject[] = dbEvaluationProjects.map(dbProject => ({
      id: dbProject.id,
      name: dbProject.name,
      description: dbProject.description,
      modelName: dbProject.modelName,
      evaluationType: dbProject.evaluationType,
      status: dbProject.status,
      progress: dbProject.progress,
      accuracy: dbProject.accuracy,
      f1Score: dbProject.f1Score,
      latency: dbProject.latency,
      createdAt: new Date(dbProject.createdAt),
      updatedAt: new Date(dbProject.updatedAt),
      createdBy: dbProject.createdBy,
      assignedTo: dbProject.assignedTo,
      testCases: dbProject.testCases,
      completedTests: dbProject.completedTests,
      dataset: dbProject.dataset,
      evaluationMetrics: dbProject.evaluationMetrics,
      lastRunAt: dbProject.lastRunAt ? new Date(dbProject.lastRunAt) : undefined,
      estimatedCompletion: dbProject.estimatedCompletion ? new Date(dbProject.estimatedCompletion) : undefined
    }));

    return NextResponse.json(evaluationProjects);
  } catch (error: any) {
    console.error('Error fetching evaluation projects:', error);
    const errorMessage = error.message || 'Failed to fetch evaluation projects';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});