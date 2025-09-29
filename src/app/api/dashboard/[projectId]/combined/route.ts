import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';

// GET /api/dashboard/[projectId]/combined - Get all dashboard data in a single request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    // Fetch all dashboard data in a single call
    const dashboardData = await projectServerService.getDashboardData(projectId);
    
    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('Error fetching combined dashboard data:', error);
    const errorMessage = error.message || 'Failed to fetch combined dashboard data';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}