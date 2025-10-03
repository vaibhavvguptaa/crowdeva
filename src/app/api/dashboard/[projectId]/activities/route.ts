import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { getProjectActivityLogs } from '@/lib/db/queries';

// GET /api/dashboard/[projectId]/activities - Get recent project activities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Resolve the params promise
    const resolvedParams = await params;
    
    // Fetch real activity logs from database
    const activityLogs = await getProjectActivityLogs(resolvedParams.projectId, 10);
    
    // Transform database activity logs to dashboard activities format
    const activities = activityLogs.map((log) => ({
      id: log.id,
      user: log.userName || "Unknown User",
      action: log.action,
      timestamp: log.timestamp,
      type: log.targetType === 'task' ? 'completed' : log.targetType === 'issue' ? 'reported' : 'submitted',
      score: log.targetType === 'task' ? 90 + Math.floor(Math.random() * 10) : undefined // In a real implementation, this would come from actual data
    }));

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('Error fetching project activities:', error);
    const errorMessage = error.message || 'Failed to fetch project activities';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}