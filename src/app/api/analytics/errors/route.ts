import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import pool from '@/lib/db/connection';

// CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders();
  return new NextResponse(null, {
    status: 200,
    headers: headers,
  });
}

// Handle error analytics data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errors } = body;

    if (!errors || !Array.isArray(errors)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Log errors to console/server logs
    errors.forEach((error: any) => {
      logError('Client-side error analytics', new Error(error.error), {
        component: error.component,
        type: error.type,
        userAgent: error.userAgent,
        url: error.url,
        timestamp: error.timestamp,
        additional: error.additional,
      });
    });

    // Store errors in database if connection is available
    if (pool) {
      try {
        const connection = await pool.getConnection();
        try {
          for (const error of errors) {
            await connection.execute(
              `INSERT INTO client_error_analytics 
              (error_message, error_type, component, user_agent, url, ip_address, session_id, user_id, auth_type, http_status, error_code, additional_data, timestamp) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                error.error,
                error.type,
                error.component,
                error.userAgent,
                error.url,
                error.ipAddress,
                error.sessionId,
                error.userId,
                error.authType,
                error.httpStatus,
                error.errorCode,
                JSON.stringify(error.additional || {}),
                error.timestamp
              ]
            );
          }
        } finally {
          connection.release();
        }
      } catch (dbError) {
        console.error('Failed to store error analytics in database:', dbError);
        // Don't fail the entire request if database storage fails
      }
    }

    const headers = getCorsHeaders();
    return NextResponse.json(
      { message: 'Error analytics received' },
      { 
        status: 200,
        headers: headers
      }
    );
  } catch (error) {
    console.error('Error processing analytics:', error);
    
    const headers = getCorsHeaders();
    return NextResponse.json(
      { error: 'Failed to process error analytics' },
      { 
        status: 500,
        headers: headers
      }
    );
  }
}