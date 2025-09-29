'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { buildOAuthAuthorizationUrl } from '@/lib/oauth';
import { logError, logInfo, logSecurityEvent } from '@/lib/logger';
import { getKeycloakConfig } from '@/lib/config';
import { AuthUserType } from '@/types/auth';
import { AuthErrorHandler } from '@/lib/authErrorHandler';

interface GoogleSignInButtonProps {
  /** High-level auth type (maps to realm + clientId). Prefer passing this instead of bare realm. */
  authType: AuthUserType;
  /** Optional explicit realm override (falls back to getKeycloakConfig(authType).realm) */
  realm?: string;
  disabled?: boolean;
  onError?: (error: string) => void;
  onRedirecting?: (isRedirecting: boolean) => void; // Add this prop
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  authType,
  realm,
  disabled = false,
  onError,
  onRedirecting
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (disabled || isRedirecting) return;

    try {
      setError(null);
      
      // Validate authType
      if (!['customers', 'developers', 'vendors'].includes(authType)) {
        const errorMsg = `Invalid authType: ${authType}. Must be one of: customers, developers, vendors.`;
        logSecurityEvent('oauth_invalid_authtype', {
          authType,
          component: 'GoogleSignInButton'
        });
        
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }
      
      const { url: keycloakUrl, clientId, realm: derivedRealm } = getKeycloakConfig(authType);
      if (!keycloakUrl || !clientId || !derivedRealm) {
        const missing: string[] = [];
        if (!keycloakUrl) missing.push('KEYCLOAK_URL');
        if (!clientId) missing.push('CLIENT_ID');
        if (!derivedRealm) missing.push('REALM');
        const msg = `Google sign-in misconfiguration: ${missing.join(', ')} missing for authType=${authType}.`;
        logError('Google sign-in configuration error', undefined, { authType, missing });
        setError(msg + ' Check environment variables for this realm.');
        onError?.(msg);
        return;
      }
      const effectiveRealm = realm || derivedRealm;

      // Validate redirect URI
      const redirectUri = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '';
      
      if (!redirectUri) {
        const errorMsg = 'Unable to determine redirect URI. Window object not available.';
        logError('Google sign-in redirect URI error', undefined, { authType });
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Persist the authType so the callback knows which realm/client to use for code exchange
      try { 
        localStorage.setItem('oauthAuthType', authType);
        // Set loginMethod flag for 2FA bypass as per memory specification
        localStorage.setItem('loginMethod', 'oauth');
      } catch (storageError) {
        logError('Failed to store OAuth data in localStorage', storageError instanceof Error ? storageError : undefined, { authType });
        // Continue anyway but log the error
      }

      // Validate Google IDP alias
      const googleAlias = (process.env.NEXT_PUBLIC_GOOGLE_IDP_ALIAS || 'google').trim();
      
      if (!googleAlias) {
        const errorMsg = 'Google OAuth configuration missing. Please check NEXT_PUBLIC_GOOGLE_IDP_ALIAS environment variable.';
        logSecurityEvent('oauth_config_missing', {
          authType,
          missing: 'NEXT_PUBLIC_GOOGLE_IDP_ALIAS'
        });
        
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Build OAuth authorization URL
      const { url, state } = buildOAuthAuthorizationUrl({
        baseUrl: keycloakUrl,
        realm: effectiveRealm,
        clientId,
        redirectUri,
        kcIdpHint: googleAlias, // ensures Keycloak immediately redirects to external Google IdP, skipping KC login screen
        // Could add PKCE later via extraParams
        extraParams: { ui_locales: navigator.language }
      });

      logInfo('Redirecting to OAuth provider', { 
        realm: effectiveRealm, 
        clientId, 
        state: state?.substring(0, 10) + '...', 
        authType,
        provider: 'google'
      });
      
      setIsRedirecting(true);
      onRedirecting?.(true); // Notify parent component
      
      // Use window.location.replace instead of assign for better UX
      window.location.replace(url);
    } catch (error) {
      setIsRedirecting(false);
      onRedirecting?.(false); // Notify parent component
      
      const errorState = AuthErrorHandler.handleError(
        error,
        { component: 'GoogleSignInButton', action: 'initiate_oauth' }
      );
      
      const errorMessage = errorState.message;
      logError('Google sign-in failed', error instanceof Error ? error : undefined, { authType, passedRealm: realm });
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Clean up redirecting state when component unmounts
  useEffect(() => {
    return () => {
      if (isRedirecting) {
        onRedirecting?.(false);
      }
    };
  }, [isRedirecting, onRedirecting]);

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={disabled || isRedirecting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          style={{ marginTop: '1rem' }}
          aria-label="Sign in with Google"
        >
          {isRedirecting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="h-5 w-5"
              loading="eager"
              decoding="async"
            />
          )}
          {isRedirecting ? 'Redirecting to Google...' : 'Sign in with Google'}
        </button>
        
        {error && (
          <div className="p-2 rounded-md bg-red-50 border border-red-200 flex items-start gap-2" role="alert">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-600 hover:text-red-700 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};