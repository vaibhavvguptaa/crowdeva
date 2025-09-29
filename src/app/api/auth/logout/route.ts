import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/csrf';
import { deleteSession } from '@/lib/fileSessionStore';

// Helper function to create CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'Set-Cookie',
  };
}

// Helper function to create secure cookie options
function createSecureCookieOptions(isProduction: boolean, maxAge: number, path: string = '/', sameSite: 'Strict' | 'Lax' = 'Lax') {
  return [
    'HttpOnly',
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    `SameSite=${sameSite}`,
    ...(isProduction ? ['Secure'] : [])
  ];
}

export async function POST(request: NextRequest) {
  try {
    console.log('Logout request received');
    
    // Check if CSRF token validation is required and if it's valid
    // If the CSRF token is invalid, we'll still proceed with logout for security
    const isCSRFValid = CSRFProtection.validateToken(request);
    if (!isCSRFValid) {
      console.warn('CSRF token validation failed during logout, but proceeding with logout for security');
      // Log the tokens for debugging
      const csrfToken = request.headers.get('X-CSRF-Token');
      const cookieCsrfToken = request.cookies.get('csrf-token')?.value;
      console.log('Header CSRF token:', csrfToken);
      console.log('Cookie CSRF token:', cookieCsrfToken);
    }
    
    // Get session ID from cookies
    const sidCookie = request.cookies.get('sid')?.value;
    console.log('SID cookie for logout:', sidCookie ? `${sidCookie.substring(0, 20)}...` : 'NOT FOUND');
    
    // Delete session if it exists
    if (sidCookie) {
      try {
        await deleteSession(sidCookie);
        console.log('Session deleted successfully');
      } catch (deleteError) {
        console.error('Error deleting session:', deleteError);
        // Continue with logout even if session deletion fails
      }
    } else {
      console.log('No session ID found in cookies, skipping session deletion');
    }
    
    // Create response
    const response = new NextResponse(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Set CORS headers
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Remove session cookie by setting it to expire in the past
    const isProduction = process.env.NODE_ENV === 'production';
    const expiredCookieOptions = createSecureCookieOptions(isProduction, -1);
    response.headers.append('Set-Cookie', `sid=; ${expiredCookieOptions.join('; ')}`);
    
    // Also remove the csrf-token cookie
    response.headers.append('Set-Cookie', `csrf-token=; ${expiredCookieOptions.join('; ')}`);
    
    // Remove kc-token cookie as well
    response.headers.append('Set-Cookie', `kc-token=; ${expiredCookieOptions.join('; ')}`);
    
    console.log('Logout response sent successfully');
    return response;
    
  } catch (error) {
    console.error('Unexpected error in logout route:', error);
    
    const response = new NextResponse(JSON.stringify({ 
      error: 'Internal server error', 
      message: 'An unexpected error occurred during logout' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Set CORS headers even for error responses
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}