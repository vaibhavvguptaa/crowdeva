import { NextResponse } from 'next/server';
import pool from '@/lib/db/connection';

export async function GET() {
  try {
    if (!pool) {
      return NextResponse.json({ 
        message: 'Database connection pool not initialized',
        status: 'error'
      }, { status: 500 });
    }

    // Test database connection
    const connection = await pool.getConnection();
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    
    connection.release();
    
    return NextResponse.json({ 
      message: 'Database connection and query test successful',
      result: rows,
      status: 'success'
    });
  } catch (error) {
    return NextResponse.json({ 
      message: 'Error testing database connection',
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 });
  }
}