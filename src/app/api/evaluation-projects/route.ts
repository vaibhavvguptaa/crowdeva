import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';
import { withApiAuth } from '@/lib/apiAuth';

export const POST = withApiAuth(async function POST(
  request: NextRequest
) {
  try {
    const evaluationProjectData = await request.json();
    
    // Validate required fields
    if (!evaluationProjectData.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Create the evaluation project
    const evaluationProject = await projectServerService.createEvaluationProject(evaluationProjectData);
    
    return NextResponse.json(evaluationProject);
  } catch (error: any) {
    console.error('Error creating evaluation project:', error);
    const errorMessage = error.message || 'Failed to create evaluation project';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});