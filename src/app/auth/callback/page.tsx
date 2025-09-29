"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getKeycloakConfig } from '@/lib/config';
import { logError, logInfo, logAuthFailure, logAuthSuccess, logSecurityEvent } from '@/lib/logger';
import { AuthErrorHandler } from '@/lib/authErrorHandler';

// Simple OAuth callback handler for Authorization Code (no PKCE yet)
// Exchanges ?code & ?state for tokens directly with Keycloak then saves token like password flow.
// NOTE: For production security you should add PKCE + state verification + error handling hardening.

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Finishing sign-in...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const kcError = params.get('error');
      
      // Handle OAuth errors from Keycloak
      if (kcError) {
        const errorDescription = params.get('error_description');
        logAuthFailure('unknown', 'oauth_provider_error', {
          provider: 'google',
          error: kcError,
          description: errorDescription
        });
        
        setError(`Authorization failed: ${kcError}${errorDescription ? ` - ${errorDescription}` : ''}`);
        return;
      }
      
      // Validate authorization code
      if (!code) {
        logAuthFailure('unknown', 'oauth_missing_code', {
          provider: 'google'
        });
        
        setError('Missing authorization code.');
        return;
      }
      
      // Validate state parameter for CSRF protection
      try {
        const storedState = sessionStorage.getItem('oauth_state');
        
        // Check if state exists and matches
        if (storedState) {
          if (!returnedState) {
            logSecurityEvent('oauth_state_missing', {
              provider: 'google'
            });
            
            setError('Security verification failed: Missing state parameter. Please retry sign in.');
            // Clean up potentially compromised OAuth flags
            try {
              localStorage.removeItem('loginMethod');
              localStorage.removeItem('oauthAuthType');
              sessionStorage.removeItem('oauth_state');
            } catch { /* ignore */ }
            return;
          }
          
          if (storedState !== returnedState) {
            logSecurityEvent('oauth_state_mismatch', {
              provider: 'google',
              storedState: storedState.substring(0, 10) + '...',
              returnedState: returnedState.substring(0, 10) + '...'
            });
            
            setError('Security verification failed: State mismatch detected. This may indicate a security issue. Please retry sign in.');
            // Clean up potentially compromised OAuth flags
            try {
              localStorage.removeItem('loginMethod');
              localStorage.removeItem('oauthAuthType');
              sessionStorage.removeItem('oauth_state');
            } catch { /* ignore */ }
            return;
          }
        }
        
        // Clean up the state after successful validation
        sessionStorage.removeItem('oauth_state');
      } catch (storageError) {
        logError('OAuth state validation failed', storageError instanceof Error ? storageError : undefined);
        // Continue anyway but log the error
      }

      // Identify which authType was used
      let authType: any = 'customers';
      try { 
        authType = localStorage.getItem('oauthAuthType') || 'customers'; 
      } catch (storageError) {
        logError('Failed to read oauthAuthType from localStorage', storageError instanceof Error ? storageError : undefined);
      }
      
      // Validate authType
      if (!['customers', 'developers', 'vendors'].includes(authType)) {
        logAuthFailure('unknown', 'oauth_invalid_authtype', {
          authType
        });
        
        setError('Invalid authentication type.');
        return;
      }
      
      // Get Keycloak configuration
      const { url: keycloakUrl, clientId, realm } = getKeycloakConfig(authType);
      if (!keycloakUrl || !clientId || !realm) {
        logSecurityEvent('oauth_config_error', {
          authType,
          missing: !keycloakUrl ? 'url' : !clientId ? 'clientId' : !realm ? 'realm' : 'unknown'
        });
        
        setError('Configuration error.');
        return;
      }

      // Prepare token exchange request
      const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
      const redirectUri = `${window.location.origin}/auth/callback`;

      // Pre-construct form data for better performance
      const formData = new URLSearchParams();
      formData.set('grant_type', 'authorization_code');
      formData.set('client_id', clientId);
      formData.set('code', code);
      formData.set('redirect_uri', redirectUri);

      try {
        // Use AbortController for better control over the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          logAuthFailure('unknown', 'oauth_timeout', {
            authType,
            timeout: 10000
          });
        }, 10000); // 10 second timeout

        const resp = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({}));
          logAuthFailure('unknown', 'oauth_token_exchange_failed', {
            authType,
            status: resp.status,
            error: errorData.error,
            errorDescription: errorData.error_description
          });
          
          setError(errorData.error_description || errorData.error || 'Token exchange failed.');
          return;
        }

        const data = await resp.json();

        // Validate token structure
        if (!data.access_token || !data.token_type) {
          logAuthFailure('unknown', 'oauth_invalid_token_response', {
            authType,
            hasAccessToken: !!data.access_token,
            hasTokenType: !!data.token_type
          });
          
          setError('Invalid token response from authentication server.');
          return;
        }

        // Store access token with better error handling
        try {
          localStorage.setItem('kc-token', data.access_token);
          localStorage.setItem('authType', authType);
          // Ensure loginMethod is set for 2FA bypass detection
          localStorage.setItem('loginMethod', 'oauth');
        } catch (storageError) {
          logError('Failed to store tokens in localStorage', storageError instanceof Error ? storageError : undefined);
          // Continue anyway, the session cookie should work
        }

        // Set httpOnly cookie via existing endpoint for consistency
        try {
          // Use a shorter timeout for the session cookie request
          const cookieController = new AbortController();
          const cookieTimeoutId = setTimeout(() => {
            cookieController.abort();
            logError('Session cookie request timed out');
          }, 5000); // 5 second timeout

          const cookieResponse = await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              token: data.access_token,
              refreshToken: data.refresh_token,
              authType,
              userId: 'oauth-user' // This would be extracted from the token in a real implementation
            }),
            signal: cookieController.signal
          });

          clearTimeout(cookieTimeoutId);
          
          if (!cookieResponse.ok) {
            logError('Failed to set session cookie', undefined, {
              status: cookieResponse.status
            });
          }
        } catch (cookieError) { 
          logError('Failed to set session cookie after OAuth', cookieError instanceof Error ? cookieError : undefined); 
        }

        // Log successful authentication
        logAuthSuccess('oauth-user', authType, {
          method: 'oauth',
          provider: 'google'
        });
        
        setMessage('Redirecting...');

        // Redirect to dashboard based on role
        const dest = authType === 'developers' ? '/developer/projects' : authType === 'vendors' ? '/vendor/projects' : '/projects';
        // Use router.push for consistency with other redirects
        router.push(dest);
      } catch (e: any) {
        logError('OAuth callback processing error', e instanceof Error ? e : undefined);
        
        if (e?.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          const errorState = AuthErrorHandler.handleError(
            e,
            { service: 'OAuthCallback', action: 'process_callback' }
          );
          
          setError(errorState.message);
        }
        
        // Clean up OAuth flags on error to prevent replay attacks
        try {
          localStorage.removeItem('loginMethod');
          localStorage.removeItem('oauthAuthType');
          sessionStorage.removeItem('oauth_state');
        } catch { /* ignore */ }
      }
    };
    
    run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
        {!error && (
          <>
            <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-gray-600" aria-live="polite">{message}</p>
          </>
        )}
        {error && (
          <>
            <p className="text-red-600 font-medium mb-2">Sign-in Error</p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => {
                // Clean up any remaining OAuth artifacts
                try {
                  localStorage.removeItem('loginMethod');
                  localStorage.removeItem('oauthAuthType');
                  sessionStorage.removeItem('oauth_state');
                } catch { /* ignore */ }
                router.push('/signin');
              }} 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}