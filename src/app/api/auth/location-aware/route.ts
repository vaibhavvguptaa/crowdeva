import { NextRequest, NextResponse } from 'next/server';
import { getKeycloakConfig } from '@/lib/config';
import { AuthUserType } from '@/types/auth';
import { createSession } from '@/lib/fileSessionStore';
import { getRateLimitInfo } from '@/lib/rateLimit';
import { CSRFProtection } from '@/lib/csrf';

// Helper function to create CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOCATION AWARE AUTH REQUEST ===');
    
    // Extract client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0].trim() || realIP || 'unknown';
    
    // Check rate limit
    const rateLimitInfo = getRateLimitInfo(clientIP, request.nextUrl.pathname);
    const isRateLimited = rateLimitInfo.remaining <= 0;
    
    if (isRateLimited) {
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
      // Instead of immediately failing, let's try to get a new CSRF token
      // This can happen if the page has been open for a long time
      const csrfResponse = NextResponse.json(
        { error: 'CSRF token validation failed', message: 'Session expired. Please refresh the page and try again.' },
        { status: 403, headers: getCorsHeaders() }
      );
      return csrfResponse;
    }
    
    // Parse request body
    const body = await request.json();
    // Support both 'email' and 'username' fields for compatibility
    const { username, email, password, authType, totp } = body;
    const userIdentifier = username || email;
    
    console.log('Request body:', { username: userIdentifier, authType, totp: !!totp });
    
    // Validate required fields
    if (!userIdentifier || !password || !authType) {
      console.log('Missing required fields:', { username: !!userIdentifier, password: !!password, authType: !!authType });
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Username, password, and auth type are required.' },
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
    
    // Get client IP address for geolocation
    const clientIPAddress = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') ||
                    '127.0.0.1';
    console.log('Client IP:', clientIPAddress);
    
    // Get Keycloak configuration
    const keycloakConfig = getKeycloakConfig(authType as AuthUserType);
    console.log('Keycloak config:', keycloakConfig);
    
    // Check if Keycloak URL is configured
    if (!keycloakConfig.url) {
      console.log('Keycloak URL is not configured');
      return NextResponse.json(
        { error: 'Server configuration error', message: 'Authentication service is not properly configured.' },
        { status: 500, headers: getCorsHeaders() }
      );
    }
    
    // Prepare authentication request to Keycloak
    const authParams = new URLSearchParams();
    authParams.append('grant_type', 'password');
    authParams.append('client_id', keycloakConfig.clientId);
    authParams.append('username', userIdentifier);
    authParams.append('password', password);
    
    // Add TOTP if provided
    if (totp) {
      authParams.append('totp', totp);
    }
    
    // Authenticate with Keycloak
    console.log('Authenticating with Keycloak at:', `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`);
    const authResponse = await fetch(`${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: authParams,
    });
    
    console.log('Authentication response status:', authResponse.status);
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.log('Authentication failed:', errorText);
      
      // Check if it's a TOTP required error
      if (authResponse.status === 400 && errorText.includes('invalid_grant') && errorText.includes('totp')) {
        console.log('TOTP required for user');
        return NextResponse.json(
          { 
            error: '2FA required', 
            message: 'Two-factor authentication required',
            totpRequired: true
          },
          { status: 403, headers: getCorsHeaders() }
        );
      }
      
      // Handle other authentication errors
      let errorMessage = 'Invalid credentials';
      let errorStatus = 401;
      
      // Parse error response if it's JSON
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error_description) {
          errorMessage = errorData.error_description;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If it's not JSON, use the raw text
        errorMessage = errorText || 'Authentication failed';
      }
      
      return NextResponse.json(
        { error: 'Authentication failed', message: errorMessage },
        { status: errorStatus, headers: getCorsHeaders() }
      );
    }
    
    const authData = await authResponse.json();
    console.log('Authentication successful');
    
    // Extract user ID from access token if available
    let userId: string | undefined;
    if (authData.access_token) {
      try {
        const payload = JSON.parse(Buffer.from(authData.access_token.split('.')[1], 'base64').toString('utf8'));
        userId = payload.sub;
      } catch (e) {
        console.warn('Failed to extract user ID from access token:', e);
      }
    }
    
    // Create session
    console.log('Creating session with refresh token length:', authData.refresh_token?.length || 0);
    const sessionId = await createSession(authData.refresh_token, authType, { 
      userId: userId || userIdentifier,
      ipAddress: clientIPAddress,
      userAgent: request.headers.get('user-agent') || ''
    });
    console.log('Session created with ID:', sessionId.substring(0, 20) + '...');
    
    // Create response
    const response = NextResponse.json({ 
      success: true,
      access_token: authData.access_token,
      expires_in: authData.expires_in,
      token_type: authData.token_type,
      refresh_token: authData.refresh_token, // Note: We're not sending our internal refresh token for security
      authType,
      sessionId
    });
    
    // Set CORS headers
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Set session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = createSecureCookieOptions(isProduction, 7 * 24 * 60 * 60); // 7 days
    response.headers.append('Set-Cookie', `sid=${sessionId}; ${cookieOptions.join('; ')}`);
    
    // Also set authType cookie for easier retrieval
    response.headers.append('Set-Cookie', `authType=${authType}; ${cookieOptions.join('; ')}`);
    
    console.log('Location aware auth response sent successfully');
    return response;
    
  } catch (error) {
    console.error('Unexpected error in location aware auth route:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}