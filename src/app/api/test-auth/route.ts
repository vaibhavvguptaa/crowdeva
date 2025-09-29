import { NextRequest, NextResponse } from 'next/server';
import { verifyKeycloakJWT } from '@/lib/jwtVerify';

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get('kc-token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No token found' 
      });
    }
    
    try {
      // Verify the token
      const verified = await verifyKeycloakJWT(token);
      return NextResponse.json({ 
        authenticated: true, 
        payload: verified.payload,
        message: 'Token is valid' 
      });
    } catch (error) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'Token verification failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false, 
      message: 'An error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}