import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';

/**
 * Test API route to verify server-side authentication is working
 * GET /api/test-auth - Returns the current user's session information
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No valid session found'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        authType: session.user.authType
      },
      expiresAt: session.expiresAt
    });
  } catch (error: any) {
    console.error('Error in test-auth route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

/**
 * Test API route to verify server-side authentication is working
 * POST /api/test-auth - Requires authentication and returns a success message
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No valid session found'
      }, { status: 401 });
    }

    const body = await request.json();
    
    return NextResponse.json({ 
      authenticated: true,
      message: 'Successfully authenticated POST request',
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        authType: session.user.authType
      },
      requestData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in test-auth POST route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}