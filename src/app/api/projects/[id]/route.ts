import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';

// GET /api/projects/[id] - Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Fixed: await params first
    const project = await projectServerService.getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    const errorMessage = error.message || 'Failed to fetch project';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update a specific project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Fixed: await params first
    const updates = await request.json();
    const updatedProject = await projectServerService.updateProject(id, updates);
    
    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedProject);
  } catch (error: any) {
    console.error('Error updating project:', error);
    const errorMessage = error.message || 'Failed to update project';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Fixed: await params first
    const success = await projectServerService.deleteProject(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    const errorMessage = error.message || 'Failed to delete project';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper functions (not exported as HTTP methods)
async function getUserProjectRole(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Fixed: await params first
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    const role = await projectServerService.getUserProjectRole(id, userId);
    return NextResponse.json(role);
  } catch (error: any) {
    console.error('Error fetching user project role:', error);
    const errorMessage = error.message || 'Failed to fetch user project role';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function updateProjectRBAC(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Fixed: await params first
    const rbac = await request.json();
    const success = await projectServerService.updateProjectRBAC(id, rbac);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update project RBAC' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Project RBAC updated successfully' });
  } catch (error: any) {
    console.error('Error updating project RBAC:', error);
    const errorMessage = error.message || 'Failed to update project RBAC';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}