import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { getTeamMemberStatsByProjectId } from '@/lib/db/queries';

// Simple in-memory cache for team data
const teamCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/dashboard/[projectId]/team - Get project team members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId } = resolvedParams;
    
    // Check cache first
    const cached = teamCache.get(projectId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }
    
    // Fetch real team member statistics from database
    const teamStats = await getTeamMemberStatsByProjectId(projectId);
    
    // Transform database team stats to dashboard team members format
    const teamMembers = teamStats.map((member) => ({
      id: member.id,
      name: member.name,
      tasks: member.tasksAssigned,
      accuracy: member.accuracy > 0 ? `${member.accuracy.toFixed(1)}%` : 'N/A',
      avgTime: member.avgTimePerTask ? `${member.avgTimePerTask} min` : 'N/A',
      issues: member.issuesReported,
      avatarUrl: member.avatarUrl || undefined,
      specialization: member.role,
      responseQuality: member.tasksCompleted > 0 ? Math.min(100, Math.floor((member.tasksCompleted / member.tasksAssigned) * 100)) : 0,
      evaluationsToday: 0 // This would require additional tracking
    }));

    // Cache the result
    teamCache.set(projectId, { data: teamMembers, timestamp: now });

    return NextResponse.json(teamMembers);
  } catch (error: any) {
    console.error('Error fetching project team members:', error);
    const errorMessage = error.message || 'Failed to fetch project team members';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}