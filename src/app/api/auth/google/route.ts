import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/csrf';
import { AuthUserType } from '@/types/auth';
import { getKeycloakConfig } from '@/lib/config';
import { logAuthFailure, logAuthSuccess, logSecurityEvent } from '@/lib/logger';
import { AuthErrorHandler } from '@/lib/authErrorHandler';

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    if (!CSRFProtection.validateToken(request)) {
      logAuthFailure('unknown', 'oauth_csrf_failure', {
        endpoint: '/api/auth/google',
        reason: 'Invalid CSRF token'
      });
      
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const { code, state, authType } = await request.json() as { 
      code?: string; 
      state?: string;
      authType?: AuthUserType;
    };
    
    // Validate required parameters
    if (!code || !authType) {
      logAuthFailure('unknown', 'oauth_missing_params', {
        endpoint: '/api/auth/google',
        missing: !code ? 'code' : !authType ? 'authType' : 'unknown'
      });
      
      return NextResponse.json({ error: 'Missing authorization code or authType' }, { status: 400 });
    }
    
    // Validate authType
    if (!['customers', 'developers', 'vendors'].includes(authType)) {
      logAuthFailure('unknown', 'oauth_invalid_authtype', {
        endpoint: '/api/auth/google',
        authType
      });
      
      return NextResponse.json({ error: 'Invalid authType specified' }, { status: 400 });
    }

    // Get Keycloak configuration
    const { url: keycloakUrl, clientId, realm } = getKeycloakConfig(authType);
    if (!keycloakUrl || !clientId || !realm) {
      logSecurityEvent('oauth_config_error', {
        authType,
        missing: !keycloakUrl ? 'url' : !clientId ? 'clientId' : !realm ? 'realm' : 'unknown'
      });
      
      return NextResponse.json({ error: 'Server configuration error (missing Keycloak config for authType)' }, { status: 500 });
    }

    // Authorization code flow for OAuth callback
    const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/auth/callback`;
    
    if (!appUrl.startsWith('http')) {
      logSecurityEvent('oauth_config_error', {
        authType,
        appUrl,
        reason: 'Invalid application URL configuration'
      });
      
      return NextResponse.json({ error: 'Invalid application URL configuration' }, { status: 500 });
    }

    // Prepare form data for token exchange
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', clientId);
    formData.append('code', code);
    formData.append('redirect_uri', redirectUri);
    // Note: For CONFIDENTIAL clients, add client_secret here
    // formData.append('client_secret', clientSecret);

    // Add timeout control for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const resp = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await resp.json();
      if (!resp.ok) {
        logAuthFailure('unknown', 'oauth_token_exchange_failed', {
          authType,
          status: resp.status,
          error: data.error,
          errorDescription: data.error_description
        });
        
        return NextResponse.json({ 
          error: data.error_description || data.error || 'Authorization code exchange failed' 
        }, { status: resp.status || 400 });
      }
      
      // Log successful OAuth authentication
      logAuthSuccess('unknown', authType, {
        method: 'oauth',
        provider: 'google'
      });

      return NextResponse.json({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        scope: data.scope
      });
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        logAuthFailure('unknown', 'oauth_timeout', {
          authType,
          timeout: 10000
        });
        
        return NextResponse.json({ error: 'Request timeout during OAuth token exchange' }, { status: 408 });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('OAuth authorization error:', error);
    
    const errorState = AuthErrorHandler.handleError(
      error,
      { service: 'GoogleOAuth', action: 'token_exchange' }
    );
    
    logAuthFailure('unknown', 'oauth_internal_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({ error: errorState.message }, { status: 500 });
  }
}