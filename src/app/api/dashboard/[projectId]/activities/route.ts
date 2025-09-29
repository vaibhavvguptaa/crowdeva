import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';

// GET /api/dashboard/[projectId]/activities - Get recent project activities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Resolve the params promise
    const resolvedParams = await params;
    
    // Fetch the project
    const project = await projectServerService.getProject(resolvedParams.projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate mock activities based on project data
    const activities = [
      {
        id: `act-${resolvedParams.projectId}-001`,
        user: project.assignees[0]?.name || "System",
        action: `Created project ${project.name}`,
        timestamp: project.createdAt,
        type: "completed" as const,
        score: project.metrics.qualityScore || undefined
      },
      {
        id: `act-${resolvedParams.projectId}-002`,
        user: project.assignees[0]?.name || "System",
        action: `Updated project ${project.name}`,
        timestamp: project.updatedAt,
        type: "completed" as const
      },
      {
        id: `act-${resolvedParams.projectId}-003`,
        user: project.assignees[Math.floor(Math.random() * project.assignees.length)]?.name || "Team Member",
        action: `Completed ${Math.floor(Math.random() * 100)} tasks`,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(), // Random time within last 24 hours
        type: "completed" as const,
        score: Math.floor(80 + Math.random() * 20)
      },
      {
        id: `act-${resolvedParams.projectId}-004`,
        user: project.assignees[Math.floor(Math.random() * project.assignees.length)]?.name || "Team Member",
        action: "Reported issues in evaluation",
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(), // Random time within last 24 hours
        type: "reported" as const
      },
      {
        id: `act-${resolvedParams.projectId}-005`,
        user: project.assignees[Math.floor(Math.random() * project.assignees.length)]?.name || "Team Member",
        action: "Submitted evaluation batch",
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(), // Random time within last 24 hours
        type: "submitted" as const,
        score: Math.floor(80 + Math.random() * 20)
      }
    ];

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('Error fetching project activities:', error);
    const errorMessage = error.message || 'Failed to fetch project activities';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}