import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';

// Simple in-memory cache for team data
const teamCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/dashboard/[projectId]/team - Get project team members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> } // ✅ Changed to Promise
) {
  try {
    // ✅ Await params before accessing projectId
    const { projectId } = await params;
    
    // Check cache first
    const cached = teamCache.get(projectId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }
    
    // Fetch the project to get its assignees
    const project = await projectServerService.getProject(projectId); // ✅ Use destructured projectId
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Transform project assignees to dashboard team members format
    const teamMembers = project.assignees.map((assignee, index) => ({
      id: assignee.id,
      name: assignee.name,
      tasks: Math.floor(Math.random() * 500), 
      accuracy: `${(assignee.permissions.canEvaluate ? 90 + Math.random() * 10 : 80 + Math.random() * 20).toFixed(1)}%`, 
      avgTime: `${Math.floor(5 + Math.random() * 10)}m ${Math.floor(Math.random() * 60)}s`, 
      issues: Math.floor(Math.random() * 20), 
      avatarUrl: assignee.avatarUrl || `/avatars/user-${index + 1}.png`,
      specialization: assignee.department || "General",
      responseQuality: Math.floor(80 + Math.random() * 20), 
      evaluationsToday: Math.floor(Math.random() * 30) 
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