import { NextResponse } from 'next/server';
import pool from '@/lib/db/connection';
import { formatMySQLDateTime } from '@/lib/utils';

// PUT /api/marketplace/profiles/customers/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const {
      name,
      email,
      avatar,
      location,
      timezone,
      companyName,
      companySize,
      industry,
      website,
      phone,
      verified
    } = body;

    if (!pool) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // Update customer profile
      await connection.execute(`
        UPDATE customers SET
          name = ?, email = ?, avatar = ?, location = ?, timezone = ?,
          company_name = ?, company_size = ?, industry = ?, website = ?,
          phone = ?, verified = ?, updated_at = ?
        WHERE id = ?
      `, [
        name,
        email,
        avatar,
        location,
        timezone,
        companyName,
        companySize,
        industry,
        website,
        phone,
        verified,
        formatMySQLDateTime(),
        id
      ]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Customer profile updated successfully',
        id 
      });
    } catch (error) {
      console.error('Error updating customer profile:', error);
      return NextResponse.json(
        { error: 'Failed to update customer profile' },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}