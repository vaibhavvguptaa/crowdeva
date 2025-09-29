import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';

// Simple in-memory cache for workflow stats
const workflowCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/dashboard/[projectId]/workflow-stats - Get project workflow statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> } // ✅ Changed to Promise
) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';

    // ✅ Await params before accessing projectId
    const { projectId } = await params;

    // Check cache first
    const cacheKey = `${projectId}-${timeframe}`;
    const cached = workflowCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch the project
    const project = await projectServerService.getProject(projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate workflow stats based on timeframe
    let workflowStats;
    
    if (timeframe === 'week') {
      // Generate weekly data (7 days)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      workflowStats = days.map((day, index) => {
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
    } else {
      // Generate monthly data (4 weeks)
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      workflowStats = weeks.map((week, index) => {
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
    }

    // Cache the result
    workflowCache.set(cacheKey, { data: workflowStats, timestamp: now });

    return NextResponse.json(workflowStats);
  } catch (error: any) {
    console.error('Error fetching project workflow stats:', error);
    const errorMessage = error.message || 'Failed to fetch project workflow stats';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}