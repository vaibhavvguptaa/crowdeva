import { NextResponse } from 'next/server';
import pool from '@/lib/db/connection';

// DELETE /api/marketplace/profiles/developers/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!pool) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // Delete developer profile (related tables will be deleted due to foreign key constraints)
      const [result]: any = await connection.execute(
        'DELETE FROM developers WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Developer profile not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Developer profile deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting developer profile:', error);
      return NextResponse.json(
        { error: 'Failed to delete developer profile' },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}