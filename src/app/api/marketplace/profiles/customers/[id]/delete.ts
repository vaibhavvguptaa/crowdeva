import { NextResponse } from 'next/server';
import pool from '@/lib/db/connection';

// DELETE /api/marketplace/profiles/customers/:id
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
      // Delete customer profile
      const [result]: any = await connection.execute(
        'DELETE FROM customers WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Customer profile not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Customer profile deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting customer profile:', error);
      return NextResponse.json(
        { error: 'Failed to delete customer profile' },
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