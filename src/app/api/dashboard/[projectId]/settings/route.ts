import { NextRequest, NextResponse } from 'next/server';
import { ProjectWithMetrics } from '@/types';

// Server-side check
if (typeof window !== 'undefined') {
  throw new Error('This module can only be imported on the server side');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // Dynamic import to ensure server-side only execution
  const { projectServerService } = await import('@/services/projectService.server');
  const { getServerSession } = await import('@/lib/session');
  
  try {
    console.log('Settings API: GET request received');
    
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user || !session.user.id) {
      console.log('Settings API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    console.log('Settings API: Resolved params', resolvedParams);
    
    // Check if user has access to this project
    const userProjectRole = await projectServerService.getUserProjectRole(resolvedParams.projectId, session.user.id);
    console.log('Settings API: User project role', userProjectRole);
    
    if (!userProjectRole) {
      console.log('Settings API: Forbidden - No access to this project');
      return NextResponse.json({ error: 'Forbidden: No access to this project' }, { status: 403 });
    }

    // Only managers, admins, and owners can access settings
    if (!['manager', 'admin', 'owner'].includes(userProjectRole)) {
      console.log('Settings API: Forbidden - Insufficient permissions');
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { projectId } = resolvedParams;
    console.log('Settings API: Fetching settings for project', projectId);

    // Try to fetch project settings from database first
    let settingsData = await projectServerService.getProjectSettings(projectId);
    console.log('Settings API: Database query result', settingsData ? 'Found' : 'Not found');
    
    if (!settingsData) {
      console.log('Settings API: No settings found in database, creating default settings');
      // If no settings exist in database, fetch project data and create default settings
      const project = await projectServerService.getProject(projectId);
      if (!project) {
        console.log('Settings API: Project not found');
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Create default settings data
      settingsData = {
        general: {
          projectName: project.name,
          description: project.description,
          autoSave: true,
          taskTimeout: 30
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: false,
          taskAssignments: true,
          issueAlerts: true,
          weeklyReports: true,
          systemUpdates: false
        },
        privacy: {
          dataRetention: '2-years',
          anonymizeData: false,
          shareAnalytics: true,
          publicProfile: false
        },
        team: {
          maxAnnotators: 10,
          requireApproval: true,
          allowGuestAccess: false,
          defaultRole: 'annotator',
          enableSubAdmins: true,
          subAdminPermissions: {
            manageTeam: true,
            viewAnalytics: true,
            exportData: false,
            manageSettings: false
          }
        },
        vendor: {
          enableVendorOnboarding: true,
          requireDocumentVerification: true,
          autoApproveVerified: false,
          onboardingSteps: [
            'profile_completion',
            'document_upload',
            'capability_assessment',
            'compliance_review',
            'final_approval'
          ]
        }
      };
      
      // Save default settings to database
      console.log('Settings API: Saving default settings to database');
      await projectServerService.createOrUpdateProjectSettings(projectId, settingsData);
    }

    console.log('Settings API: Returning settings data');
    return NextResponse.json(settingsData);
  } catch (error: any) {
    console.error('Settings API: Error fetching settings data:', error);
    const errorMessage = error.message || 'Failed to fetch settings data';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // Dynamic import to ensure server-side only execution
  const { projectServerService } = await import('@/services/projectService.server');
  const { getServerSession } = await import('@/lib/session');
  
  try {
    console.log('Settings API: PUT request received');
    
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user || !session.user.id) {
      console.log('Settings API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    console.log('Settings API: Resolved params', resolvedParams);
    
    // Check if user has access to this project
    const userProjectRole = await projectServerService.getUserProjectRole(resolvedParams.projectId, session.user.id);
    console.log('Settings API: User project role', userProjectRole);
    
    if (!userProjectRole) {
      console.log('Settings API: Forbidden - No access to this project');
      return NextResponse.json({ error: 'Forbidden: No access to this project' }, { status: 403 });
    }

    // Only managers, admins, and owners can update settings
    if (!['manager', 'admin', 'owner'].includes(userProjectRole)) {
      console.log('Settings API: Forbidden - Insufficient permissions');
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { projectId } = resolvedParams;
    const settingsData = await request.json();
    console.log('Settings API: Received settings data for update', Object.keys(settingsData));

    // Update project data based on settings
    const updates: Partial<ProjectWithMetrics> = {
      name: settingsData.general?.projectName,
      description: settingsData.general?.description,
    };

    // Update project
    const updatedProject = await projectServerService.updateProject(projectId, updates);
    console.log('Settings API: Project update result', updatedProject ? 'Success' : 'Failed');
    
    if (!updatedProject) {
      console.log('Settings API: Failed to update project');
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    // Save settings to database
    console.log('Settings API: Saving settings to database');
    const settingsSaved = await projectServerService.createOrUpdateProjectSettings(projectId, settingsData);
    console.log('Settings API: Settings save result', settingsSaved ? 'Success' : 'Failed');
    
    if (!settingsSaved) {
      console.log('Settings API: Failed to save project settings');
      return NextResponse.json({ error: 'Failed to save project settings' }, { status: 500 });
    }

    console.log('Settings API: Settings updated successfully');
    return NextResponse.json({ message: 'Settings updated successfully', project: updatedProject });
  } catch (error: any) {
    console.error('Settings API: Error updating settings:', error);
    const errorMessage = error.message || 'Failed to update settings';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}