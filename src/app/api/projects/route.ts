import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { withApiAuth } from '@/lib/apiAuth';

// GET /api/projects - Get all projects
export const GET = withApiAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    
    const projects = await projectServerService.getProjects(userId);
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    const errorMessage = error.message || 'Failed to fetch projects';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});

// POST /api/projects - Create a new project
export const POST = withApiAuth(async function POST(request: NextRequest) {
  try {
    const projectData = await request.json();
    const newProject = await projectServerService.createProject(projectData);
    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    // Provide more detailed error information
    const errorMessage = error.message || 'Failed to create project';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});