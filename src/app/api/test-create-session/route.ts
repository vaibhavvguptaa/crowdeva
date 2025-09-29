import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/fileSessionStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken, authType, userId } = body;
    
    if (!refreshToken || !authType) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        message: 'Refresh token and auth type are required.' 
      }, { status: 400 });
    }
    
    // Create a test session
    const sessionId = await createSession(refreshToken, authType, { userId });
    
    // Set session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'HttpOnly',
      'Path=/',
      'Max-Age=604800', // 7 days
      'SameSite=Lax',
      ...(isProduction ? ['Secure'] : [])
    ];
    
    const domain = process.env.COOKIE_DOMAIN;
    if (domain) {
      cookieOptions.push(`Domain=${domain}`);
    }
    
    const response = NextResponse.json({ 
      message: 'Test session created successfully',
      sessionId
    });
    
    response.headers.append('Set-Cookie', `sid=${sessionId}; ${cookieOptions.join('; ')}`);
    
    // Also set authType cookie
    response.headers.append('Set-Cookie', `authType=${authType}; ${cookieOptions.join('; ')}`);
    
    return response;
  } catch (error) {
    console.error('Error creating test session:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: 'An unexpected error occurred.' 
    }, { status: 500 });
  }
}