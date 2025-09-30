import { NextRequest, NextResponse } from 'next/server';
import { getKeycloakConfig } from '@/lib/config';
import { AuthUserType } from '@/types/auth';
import { getSession, rotateSession, deleteSession } from '@/lib/fileSessionStore';

// Helper function to create CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'Set-Cookie',
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

export async function POST(request: NextRequest) {
  try {
    console.log('=== REFRESH TOKEN REQUEST ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    // Fix the Headers.entries() error by casting to any
    console.log('Request headers:', Object.fromEntries((request.headers as any).entries()));
    
    // Log all cookies for debugging
    const cookies = request.cookies.getAll();
    console.log('All cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 20)}${c.value.length > 20 ? '...' : ''}`).join(', '));
    
    // Also log raw cookie header for debugging
    const cookieHeader = request.headers.get('cookie');
    console.log('Raw cookie header:', cookieHeader);
    
    let authType: AuthUserType | undefined;
    try {
      const body = await request.json().catch(() => ({}));
      authType = body.authType;
      console.log('Auth type from request body:', authType);
    } catch (jsonError) {
      console.warn('Could not parse request body as JSON:', jsonError);
    }
    
    // Get session ID from cookies
    const sidCookie = request.cookies.get('sid')?.value;
    console.log('SID cookie:', sidCookie ? `${sidCookie.substring(0, 20)}...` : 'NOT FOUND');
    
    // Also check for other possible cookie names
    const allCookies = request.cookies.getAll();
    console.log('All available cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}${c.value.length > 20 ? '...' : ''}`));
    
    // Check if there's a cookie with a similar name
    const similarCookies = allCookies.filter(c => c.name.toLowerCase().includes('sid') || c.name.toLowerCase().includes('session'));
    if (similarCookies.length > 0) {
      console.log('Similar cookies found:', similarCookies);
    }
    
    if (!sidCookie) {
      console.log('ERROR: Missing session ID cookie');
      
      // Check if there are any cookies at all
      const allCookies = request.cookies.getAll();
      if (allCookies.length === 0) {
        console.log('No cookies found in request');
      } else {
        console.log('Available cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}${c.value.length > 20 ? '...' : ''}`));
      }
      
      // Try to get authType from other sources
      if (!authType) {
        // Try to get authType from cookies
        const authTypeCookie = request.cookies.get('authType')?.value;
        if (authTypeCookie) {
          authType = authTypeCookie as AuthUserType;
          console.log('Found authType in cookie:', authType);
        }
      }
      
      // Even if we don't have a session, we should still return a proper response
      // This might happen when a user first signs in
      if (authType) {
        console.log('Have authType but no session, returning special response for initial login');
        const errorResponse = NextResponse.json({ 
          error: 'No session', 
          message: 'No active session found. This is normal for initial login.', 
          code: 'NO_SESSION_INITIAL_LOGIN'
        }, { status: 401 });
        const corsHeaders = getCorsHeaders();
        Object.entries(corsHeaders).forEach(([key, value]) => {
          errorResponse.headers.set(key, value);
        });
        return errorResponse;
      }
      
      // For completely new visitors with no authType, return a different response
      console.log('No session and no authType, returning response for new visitor');
      const errorResponse = NextResponse.json({ 
        error: 'No session', 
        message: 'No active session found. Please sign in.', 
        code: 'NO_SESSION_NEW_VISITOR'
      }, { status: 401 });
      const corsHeaders = getCorsHeaders();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Get refresh token from session store
    const session = await getSession(sidCookie);
    console.log('Session data retrieved:', session ? 'FOUND' : 'NOT FOUND');
    if (session) {
      console.log('Session authType:', session.authType);
      console.log('Session refresh token exists:', !!session.refreshToken);
      if (session.refreshToken) {
        console.log('Refresh token length:', session.refreshToken.length);
      }
      
      // Log all session data (excluding sensitive info)
      console.log('Session data:', {
        authType: session.authType,
        createdAt: session.createdAt,
        lastRotatedAt: session.lastRotatedAt,
        hasRefreshToken: !!session.refreshToken,
        userId: session.userId
      });
    } else {
      // Check if there are any sessions in the store
      try {
        const allSessions = await import('@/lib/fileSessionStore').then(module => module.listSessions());
        console.log('All sessions in store:', Object.keys(allSessions).length);
        if (Object.keys(allSessions).length > 0) {
          console.log('Sample session IDs:', Object.keys(allSessions).slice(0, 3));
        }
      } catch (e) {
        console.log('Failed to list sessions:', e);
      }
    }
    
    if (!session) {
      console.log('ERROR: Invalid session - session not found in store');
      
      // Try to get more information about why the session wasn't found
      try {
        const fileSessionStore = await import('@/lib/fileSessionStore');
        const stats = await fileSessionStore.sessionStats();
        console.log('Current session store stats:', stats);
        
        // Try to list all sessions
        const allSessions = await fileSessionStore.listSessions();
        console.log('All sessions in store:', Object.keys(allSessions).length);
        if (Object.keys(allSessions).length > 0) {
          console.log('Sample session IDs:', Object.keys(allSessions).slice(0, 3));
        }
      } catch (e) {
        console.log('Failed to get session store info:', e);
      }
      
      const errorResponse = NextResponse.json({ 
        error: 'Invalid session', 
        message: 'Your session has expired. Please sign in again.' 
      }, { status: 401 });
      const corsHeaders = getCorsHeaders();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // If authType wasn't provided in request body, use the one from session
    if (!authType) {
      authType = session.authType as AuthUserType;
      console.log('Using authType from session:', authType);
    }

    // Validate authType
    if (!['customers', 'developers', 'vendors'].includes(authType)) {
      console.log('ERROR: Invalid authType:', authType);
      const errorResponse = NextResponse.json({ 
        error: 'Invalid auth type', 
        message: 'Invalid authentication type provided.' 
      }, { status: 400 });
      const corsHeaders = getCorsHeaders();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Get Keycloak configuration
    const keycloakConfig = getKeycloakConfig(authType);
    console.log('Keycloak config:', {
      url: keycloakConfig.url,
      realm: keycloakConfig.realm,
      clientId: keycloakConfig.clientId
    });

    // Check if refresh token exists
    if (!session.refreshToken) {
      console.log('ERROR: No refresh token in session');
      // Clean up the invalid session
      await deleteSession(sidCookie);
      
      const errorResponse = NextResponse.json({ 
        error: 'Invalid session', 
        message: 'Your session is invalid. Please sign in again.' 
      }, { status: 401 });
      const corsHeaders = getCorsHeaders();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Exchange refresh token for new tokens
    console.log('Exchanging refresh token for new tokens');
    const tokenUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;
    console.log('Token URL:', tokenUrl);
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken,
        client_id: keycloakConfig.clientId,
      }),
    });

    console.log('Token exchange response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('Token exchange failed:', errorText);
      
      // Clean up the invalid session
      await deleteSession(sidCookie);
      
      const errorResponse = NextResponse.json({ 
        error: 'Token refresh failed', 
        message: 'Unable to refresh your session. Please sign in again.' 
      }, { status: 401 });
      const corsHeaders = getCorsHeaders();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');
    console.log('New refresh token exists:', !!tokenData.refresh_token);
    if (tokenData.refresh_token) {
      console.log('New refresh token length:', tokenData.refresh_token.length);
    }

    // Rotate the session with the new refresh token
    if (tokenData.refresh_token) {
      console.log('Rotating session with new refresh token');
      await rotateSession(sidCookie, tokenData.refresh_token);
    }

    // Create response with new access token
    const response = NextResponse.json({ 
      token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      authType: authType
    });
    
    // Set CORS headers
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    console.log('Refresh token request completed successfully');
    return response;
    
  } catch (error) {
    console.error('Unexpected error in refresh token route:', error);
    
    const errorResponse = NextResponse.json({ 
      error: 'Internal server error', 
      message: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
    
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    
    return errorResponse;
  }
}