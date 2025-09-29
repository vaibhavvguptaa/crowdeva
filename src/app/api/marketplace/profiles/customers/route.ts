import { NextResponse } from 'next/server';
import pool from '@/lib/db/connection';
import { formatMySQLDateTime } from '@/lib/utils';

// POST /api/marketplace/profiles/customers
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
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
      // Insert customer profile
      await connection.execute(`
        INSERT INTO customers (
          id, name, email, avatar, location, timezone, company_name,
          company_size, industry, website, phone, verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
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
        formatMySQLDateTime()
      ]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Customer profile created successfully',
        id 
      });
    } catch (error) {
      console.error('Error creating customer profile:', error);
      return NextResponse.json(
        { error: 'Failed to create customer profile' },
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