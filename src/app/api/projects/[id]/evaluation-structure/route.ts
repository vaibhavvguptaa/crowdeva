import { NextRequest, NextResponse } from 'next/server';
import { projectServerService } from '@/services/projectService.server';

// GET /api/projects/[id]/evaluation-structure - Get evaluation structure for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const evaluationStructure = await projectServerService.getEvaluationStructure(resolvedParams.id);
    return NextResponse.json(evaluationStructure);
  } catch (error) {
    console.error('Error fetching evaluation structure:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluation structure' }, { status: 500 });
  }
}

// POST /api/projects/[id]/evaluation-structure - Save evaluation structure for a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const evaluationStructure = await request.json();
    const success = await projectServerService.saveEvaluationStructure(resolvedParams.id, evaluationStructure);
    
    if (success) {
      return NextResponse.json({ message: 'Evaluation structure saved successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to save evaluation structure' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving evaluation structure:', error);
    return NextResponse.json({ error: 'Failed to save evaluation structure' }, { status: 500 });
  }
}