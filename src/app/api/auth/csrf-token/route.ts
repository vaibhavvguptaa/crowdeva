import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/csrf';

// Helper function to create CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
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

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders();
  return new NextResponse(null, {
    status: 200,
    headers: headers,
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== GENERATING CSRF TOKEN ===');
    console.log('Request headers:', Object.fromEntries(request.headers));
    
    // Generate a new CSRF token
    const csrfToken = CSRFProtection.generateToken();
    console.log('Generated CSRF token:', csrfToken);
    
    // Create response with token
    const response = NextResponse.json({ 
      csrfToken,
      message: 'CSRF token generated successfully' 
    });
    
    console.log('Setting CSRF cookie');
    // Set CSRF token as httpOnly cookie
    const csrfCookie = CSRFProtection.createCsrfCookie(csrfToken);
    console.log('CSRF cookie string:', csrfCookie);
    response.headers.set('Set-Cookie', csrfCookie);
    
    // Add CORS headers
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    console.log('CSRF token response headers:', Object.fromEntries(response.headers));

    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }
}