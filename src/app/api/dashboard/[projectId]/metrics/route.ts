import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';

// GET /api/dashboard/[projectId]/metrics - Get project metrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> } // ✅ Changed to Promise
) {
  try {
    // ✅ Await params before accessing projectId
    const { projectId } = await params;
    
    // Fetch the project to get its metrics
    const project = await projectServerService.getProject(projectId); // ✅ Use destructured projectId
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Transform project metrics to dashboard metrics format
    const dashboardMetrics = {
      totalEvaluations: project.metrics.totalTasks,
      inProgress: project.metrics.totalTasks - project.metrics.completedTasks,
      completed: project.metrics.completedTasks,
      totalDuration: project.metrics.avgTimePerTask, // This might need adjustment based on actual data
      avgTimePerEvaluation: project.metrics.avgTimePerTask,
      avgAccuracy: project.metrics.accuracy,
      modelPerformance: project.metrics.qualityScore ? (project.metrics.qualityScore >= 90 ? "A" : project.metrics.qualityScore >= 80 ? "B" : "C") : "N/A",
      lastUpdated: project.metrics.lastActivityAt || new Date().toISOString(),
      weeklyGrowth: 0, 
      qualityScore: project.metrics.qualityScore || 0,
      throughput: project.metrics.totalTasks 
    };

    return NextResponse.json(dashboardMetrics);
  } catch (error: any) {
    console.error('Error fetching project metrics:', error);
    const errorMessage = error.message || 'Failed to fetch project metrics';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
