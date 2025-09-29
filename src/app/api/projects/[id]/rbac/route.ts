import { NextRequest, NextResponse } from 'next/server';
import * as dbQueries from '@/lib/db/queries';

// PUT /api/projects/[id]/rbac - Update RBAC for a specific project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const rbac = await request.json();
    const success = await dbQueries.updateProjectRBAC(resolvedParams.id, rbac);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update project RBAC' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Project RBAC updated successfully' });
  } catch (error) {
    console.error('Error updating project RBAC:', error);
    return NextResponse.json({ error: 'Failed to update project RBAC' }, { status: 500 });
  }
}