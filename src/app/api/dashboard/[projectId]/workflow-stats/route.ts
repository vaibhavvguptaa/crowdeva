import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { getProjectWorkflowStats } from '@/lib/db/queries';

// Simple in-memory cache for workflow stats
const workflowCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/dashboard/[projectId]/workflow-stats - Get project workflow statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';

    // Resolve params before accessing projectId
    const resolvedParams = await params;
    const { projectId } = resolvedParams;

    // Check cache first
    const cacheKey = `${projectId}-${timeframe}`;
    const cached = workflowCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Calculate days based on timeframe
    const days = timeframe === 'week' ? 7 : 30;

    // Fetch real workflow statistics from database
    const workflowData = await getProjectWorkflowStats(projectId, days);
    
    // Transform database workflow stats to dashboard format
    const workflowStats = workflowData.map((data) => ({
      date: new Date(data.date).toLocaleDateString('en-US', { 
        weekday: timeframe === 'week' ? 'short' : undefined,
        month: timeframe === 'month' ? 'short' : undefined,
        day: 'numeric'
      }),
      total: data.tasksCreated,
      completed: data.tasksCompleted,
      inProgress: Math.max(0, data.tasksCreated - data.tasksCompleted)
    }));

    // If no data, generate empty data points for the timeframe
    if (workflowStats.length === 0) {
      const dates = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        dates.push({
          date: date.toLocaleDateString('en-US', { 
            weekday: timeframe === 'week' ? 'short' : undefined,
            month: timeframe === 'month' ? 'short' : undefined,
            day: 'numeric'
          }),
          total: 0,
          completed: 0,
          inProgress: 0
        });
      }
      
      workflowStats.push(...dates);
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