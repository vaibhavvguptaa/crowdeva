import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';

export async function POST(request: NextRequest) {
  try {
    const projectData = await request.json();
    console.log('Received project data:', projectData);
    
    const newProject = await projectServerService.createProject(projectData);
    console.log('Created project:', newProject);
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    const errorMessage = error.message || 'Failed to create project';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}