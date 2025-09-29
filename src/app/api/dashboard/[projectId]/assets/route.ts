import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { withApiAuth } from '@/lib/apiAuth';

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

    // In a real implementation, you would fetch actual evaluation projects from the database
    // For now, we'll generate mock data based on the project information
    const mockEvaluationProjects: EvaluationProject[] = [
      {
        id: "EVAL-001",
        name: `${project.name} - Performance Analysis`,
        description: `Performance evaluation for ${project.name}`,
        modelName: "GPT-4-turbo",
        evaluationType: "performance",
        status: "running",
        progress: 67,
        accuracy: 0.94,
        f1Score: 0.91,
        latency: 150,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(),
        createdBy: project.createdBy,
        assignedTo: project.assignees.map(a => a.id),
        testCases: 1500,
        completedTests: 1005,
        dataset: "Project_Dataset_v1.0",
        evaluationMetrics: ["accuracy", "precision", "recall", "f1-score"],
        lastRunAt: new Date(),
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        id: "EVAL-002",
        name: `${project.name} - Safety Evaluation`,
        description: `Safety and bias evaluation for ${project.name}`,
        modelName: "Claude-3-Sonnet",
        evaluationType: "safety",
        status: "completed",
        progress: 100,
        accuracy: 0.89,
        f1Score: 0.87,
        latency: 200,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(),
        createdBy: project.createdBy,
        assignedTo: project.assignees.map(a => a.id),
        testCases: 2000,
        completedTests: 2000,
        dataset: "Safety_Dataset_v1.0",
        evaluationMetrics: ["safety_score", "bias_detection", "toxicity"],
        lastRunAt: new Date(),
      },
      {
        id: "EVAL-003",
        name: `${project.name} - Bias Detection`,
        description: `Bias detection evaluation for ${project.name}`,
        modelName: "Llama-2-70B",
        evaluationType: "bias",
        status: "paused",
        progress: 45,
        accuracy: 0.76,
        latency: 300,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(),
        createdBy: project.createdBy,
        assignedTo: project.assignees.map(a => a.id),
        testCases: 800,
        completedTests: 360,
        dataset: "Bias_Evaluation_Suite",
        evaluationMetrics: ["bias_score", "fairness_metrics", "demographic_parity"],
        lastRunAt: new Date(),
        estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      }
    ];

    return NextResponse.json(mockEvaluationProjects);
  } catch (error: any) {
    console.error('Error fetching evaluation projects:', error);
    const errorMessage = error.message || 'Failed to fetch evaluation projects';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});