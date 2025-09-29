import { NextRequest, NextResponse } from 'next/server';
import * as dbQueries from '@/lib/db/queries';

// GET /api/projects/[id]/role - Get user role for a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    const role = await dbQueries.getUserProjectRole(resolvedParams.id, userId);
    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching user project role:', error);
    return NextResponse.json({ error: 'Failed to fetch user project role' }, { status: 500 });
  }
}