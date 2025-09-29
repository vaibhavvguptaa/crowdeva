import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { getServerSession } from '@/lib/session';
import { ProjectAssignee } from '@/types';

// GET /api/dashboard/[projectId]/team-members - Get project team members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    
    // Check if user has access to this project
    const userProjectRole = await projectServerService.getUserProjectRole(resolvedParams.projectId, session.user.id);
    if (!userProjectRole) {
      return NextResponse.json({ error: 'Forbidden: No access to this project' }, { status: 403 });
    }

    // Only managers, admins, and owners can access team members
    if (!['manager', 'admin', 'owner'].includes(userProjectRole)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { projectId } = resolvedParams;
    
    // Fetch the project to get its assignees
    const project = await projectServerService.getProject(projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Return the project assignees
    return NextResponse.json(project.assignees);
  } catch (error: any) {
    console.error('Error fetching project team members:', error);
    const errorMessage = error.message || 'Failed to fetch project team members';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/dashboard/[projectId]/team-members - Add a new team member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    
    // Check if user has access to this project
    const userProjectRole = await projectServerService.getUserProjectRole(resolvedParams.projectId, session.user.id);
    if (!userProjectRole) {
      return NextResponse.json({ error: 'Forbidden: No access to this project' }, { status: 403 });
    }

    // Only managers, admins, and owners can add team members
    if (!['manager', 'admin', 'owner'].includes(userProjectRole)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { projectId } = resolvedParams;
    const { email, role } = await request.json();
    
    // Fetch the project
    const project = await projectServerService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Create a new assignee object
    const newAssignee: ProjectAssignee = {
      id: `user-${Date.now()}`, // In a real implementation, this would come from the user database
      name: email.split('@')[0], // Simple name from email
      email: email,
      avatarUrl: `/avatars/user-${project.assignees.length + 1}.png`,
      userId: `user-${Date.now()}`,
      role: role as any,
      userType: 'client',
      isActive: true,
      createdAt: new Date().toISOString(),
      assignedAt: new Date().toISOString(),
      assignedBy: session.user.id,
      permissions: {
        canEdit: role === 'manager' || role === 'admin' || role === 'owner',
        canDelete: role === 'manager' || role === 'admin' || role === 'owner',
        canAssign: role === 'manager' || role === 'admin' || role === 'owner',
        canEvaluate: true,
        canViewMetrics: role !== 'viewer'
      }
    };
    
    // Add the new assignee to the project's assignees
    const updatedAssignees = [...project.assignees, newAssignee];
    
    // Update the project with the new assignees
    const updatedProject = await projectServerService.updateProject(projectId, {
      assignees: updatedAssignees
    });
    
    if (!updatedProject) {
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
    }
    
    return NextResponse.json(newAssignee, { status: 201 });
  } catch (error: any) {
    console.error('Error adding team member:', error);
    const errorMessage = error.message || 'Failed to add team member';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT /api/dashboard/[projectId]/team-members - Update a team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    
    // Check if user has access to this project
    const userProjectRole = await projectServerService.getUserProjectRole(resolvedParams.projectId, session.user.id);
    if (!userProjectRole) {
      return NextResponse.json({ error: 'Forbidden: No access to this project' }, { status: 403 });
    }

    // Only managers, admins, and owners can update team members
    if (!['manager', 'admin', 'owner'].includes(userProjectRole)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { projectId } = resolvedParams;
    const { memberId, ...updates } = await request.json();
    
    // Fetch the project
    const project = await projectServerService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Find and update the assignee
    const updatedAssignees = project.assignees.map(assignee => {
      if (assignee.id === memberId) {
        // Create updated permissions based on role if role is being updated
        let updatedPermissions = assignee.permissions;
        if (updates.role) {
          updatedPermissions = {
            ...assignee.permissions,
            canEdit: updates.role === 'manager' || updates.role === 'admin' || updates.role === 'owner',
            canDelete: updates.role === 'manager' || updates.role === 'admin' || updates.role === 'owner',
            canAssign: updates.role === 'manager' || updates.role === 'admin' || updates.role === 'owner',
            canViewMetrics: updates.role !== 'viewer'
          };
        }
        
        return {
          ...assignee,
          ...updates,
          permissions: updatedPermissions
        };
      }
      return assignee;
    });
    
    // Check if the member was found and updated
    const memberFound = project.assignees.some(assignee => assignee.id === memberId);
    if (!memberFound) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }
    
    // Update the project with the updated assignees
    const updatedProject = await projectServerService.updateProject(projectId, {
      assignees: updatedAssignees
    });
    
    if (!updatedProject) {
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }
    
    // Return the updated assignee
    const updatedAssignee = updatedAssignees.find(assignee => assignee.id === memberId);
    return NextResponse.json(updatedAssignee);
  } catch (error: any) {
    console.error('Error updating team member:', error);
    const errorMessage = error.message || 'Failed to update team member';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/dashboard/[projectId]/team-members - Remove a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    
    // Check if user has access to this project
    const userProjectRole = await projectServerService.getUserProjectRole(resolvedParams.projectId, session.user.id);
    if (!userProjectRole) {
      return NextResponse.json({ error: 'Forbidden: No access to this project' }, { status: 403 });
    }

    // Only managers, admins, and owners can remove team members
    if (!['manager', 'admin', 'owner'].includes(userProjectRole)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { projectId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    
    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }
    
    // Fetch the project
    const project = await projectServerService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Remove the assignee from the project's assignees
    const updatedAssignees = project.assignees.filter(assignee => assignee.id !== memberId);
    
    // Check if the member was found and removed
    if (updatedAssignees.length === project.assignees.length) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }
    
    // Update the project with the updated assignees
    const updatedProject = await projectServerService.updateProject(projectId, {
      assignees: updatedAssignees
    });
    
    if (!updatedProject) {
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Team member removed successfully' });
  } catch (error: any) {
    console.error('Error removing team member:', error);
    const errorMessage = error.message || 'Failed to remove team member';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}