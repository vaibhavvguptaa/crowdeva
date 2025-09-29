import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitInfo } from '@/lib/rateLimit';
import { CSRFProtection } from '@/lib/csrf';
import { createSession } from '@/lib/fileSessionStore';
import { AuthUserType } from '@/types/auth';

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

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders();
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== SET SESSION REQUEST ===');
    
    // Extract client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0].trim() || realIP || 'unknown';
    
    // Check rate limit
    const rateLimitInfo = getRateLimitInfo(clientIP, request.nextUrl.pathname);
    if (rateLimitInfo.remaining <= 0) {
      console.log('Rate limit exceeded:', rateLimitInfo);
      const retryAfter = Math.max(1, rateLimitInfo.reset - Math.floor(Date.now() / 1000));
      return NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            ...getCorsHeaders()
          }
        }
      );
    }
    
    // Validate CSRF token
    const isCSRFValid = CSRFProtection.validateToken(request);
    if (!isCSRFValid) {
      console.log('CSRF token validation failed');
      return NextResponse.json(
        { error: 'CSRF token validation failed', message: 'Invalid CSRF token. Please try again.' },
        { status: 403, headers: getCorsHeaders() }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { refresh_token, authType, userId, ipAddress, userAgent } = body;
    
    console.log('Request body:', { authType, userId });
    
    // Validate required fields
    console.log('Validating required fields:', { 
      hasRefreshToken: !!refresh_token, 
      refreshTokenLength: refresh_token ? refresh_token.length : 0,
      hasAuthType: !!authType,
      authType
    });
    if (!refresh_token || !authType) {
      console.log('Missing required fields:', { refresh_token: !!refresh_token, authType: !!authType });
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Refresh token and auth type are required.' },
        { status: 400, headers: getCorsHeaders() }
      );
    }
    
    // Validate authType
    if (!['customers', 'developers', 'vendors'].includes(authType)) {
      console.log('Invalid authType:', authType);
      return NextResponse.json(
        { error: 'Invalid auth type', message: 'Invalid authentication type provided.' },
        { status: 400, headers: getCorsHeaders() }
      );
    }
    
    // Create session
    console.log('Creating session with refresh token length:', refresh_token.length);
    const sessionId = await createSession(refresh_token, authType, { 
      userId,
      ipAddress,
      userAgent
    });
    console.log('Session created with ID:', sessionId.substring(0, 20) + '...');
    console.log('Full session ID:', sessionId);
    
    // Set session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = createSecureCookieOptions(isProduction, 7 * 24 * 60 * 60); // 7 days
    
    // Add domain attribute if available
    const domain = process.env.COOKIE_DOMAIN;
    if (domain) {
      cookieOptions.push(`Domain=${domain}`);
    }
    
    // Log the cookies that will be set
    console.log('Setting cookies:', `sid=${sessionId}; ${cookieOptions.join('; ')}`);
    
    // Create response
    const response = NextResponse.json({ 
      message: 'Session created successfully',
      sessionId
    });
    
    // Set CORS headers
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    response.headers.append('Set-Cookie', `sid=${sessionId}; ${cookieOptions.join('; ')}`);
    
    // Also set authType cookie for easier retrieval
    if (authType) {
      const authTypeCookieOptions = createSecureCookieOptions(isProduction, 7 * 24 * 60 * 60); // 7 days
      if (domain) {
        authTypeCookieOptions.push(`Domain=${domain}`);
      }
      response.headers.append('Set-Cookie', `authType=${authType}; ${authTypeCookieOptions.join('; ')}`);
      console.log('Setting authType cookie:', `authType=${authType}; ${authTypeCookieOptions.join('; ')}`);
    }
    
    console.log('Set session response sent successfully');
    return response;
    
  } catch (error) {
    console.error('Unexpected error in set session route:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}