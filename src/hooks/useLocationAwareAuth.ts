import { useState, useEffect, useCallback } from 'react';
import { AuthUserType, AuthUser } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { AuthErrorHandler } from '@/lib/authErrorHandler';

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  riskScore?: number;
  whitelisted?: boolean;
  allowed: boolean;
  reason?: string;
}

export interface LocationAwareAuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  locationInfo: LocationInfo | null;
  locationBlocked: boolean;
}

export const useLocationAwareAuth = () => {
  const { user, isAuthenticated, loading, error: authError, login, logout, clearError, refreshAuth } = useAuth();
  
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Check location restrictions on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      checkLocationRestrictions();
    }
  }, [isAuthenticated]);

  const checkLocationRestrictions = useCallback(async (authType?: AuthUserType) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;
    
    try {
      setLocationLoading(true);
      setLocationError(null);

      const params = new URLSearchParams();
      if (authType) {
        params.append('authType', authType);
      }

      // Add timeout to prevent hanging requests
      controller = new AbortController();
      timeoutId = setTimeout(() => controller!.abort(), 10000); // Increased to 10 seconds

      const response = await fetch(`/api/auth/location-aware?${params}`, {
        signal: controller.signal,
        credentials: 'include' // Include credentials for session cookie
      });
      
      // Clear timeout if request completes successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check location restrictions');
      }

      const locationData: LocationInfo = {
        country: data.data.country,
        region: data.data.region,
        city: data.data.city,
        riskScore: data.data.riskScore,
        whitelisted: data.data.restrictions.whitelisted,
        allowed: data.data.locationAllowed,
        reason: data.data.restrictions.reason
      };

      setLocationInfo(locationData);
      setLocationBlocked(!locationData.allowed);

      if (!locationData.allowed) {
        // If location is blocked, logout the user
        await logout();
      }

    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Handle AbortError specifically
      if (controller?.signal.aborted) {
        console.error('Location check timed out');
        setLocationError('Location check timed out. Please try again.');
        // Don't block on timeout - fail open
        setLocationBlocked(false);
        return;
      }
      
      console.error('Location check failed:', error);
      setLocationError(error instanceof Error ? error.message : 'Location check failed');
      // Don't block on error - fail open
      setLocationBlocked(false);
    } finally {
      setLocationLoading(false);
    }
  }, [logout]);

  const locationAwareLogin = useCallback(async (
    username: string,
    password: string,
    authType: AuthUserType,
    skipLocationCheck = false
  ): Promise<{ success: boolean; locationBlocked?: boolean; error?: string; totpRequired?: boolean }> => {
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;
    
    try {
      setLocationError(null);
      
      // First, get a CSRF token
      const csrfResponse = await fetch('/api/auth/csrf-token', {
        credentials: 'include'
        // Add mode and cache options to ensure proper CORS handling
      });
      
      if (!csrfResponse.ok) {
        throw new Error('Failed to obtain CSRF token');
      }
      
      const { csrfToken } = await csrfResponse.json();
      
      // Add timeout to prevent hanging requests
      controller = new AbortController();
      // Increase timeout to 45 seconds to accommodate slower location checks
      timeoutId = setTimeout(() => controller!.abort(), 45000);

      const response = await fetch('/api/auth/location-aware', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          username, // Changed from email to username to match API expectations
          password,
          authType,
          skipLocationCheck
        }),
        credentials: 'include',
        signal: controller.signal,
        // Add mode and cache options to ensure proper CORS handling
        mode: 'cors',
        cache: 'no-cache'
      });

      // Clear timeout if request completes successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.blocked) {
          // Location blocked
          setLocationBlocked(true);
          setLocationError(data.message || 'Access from your location is not permitted');
          
          const locationData: LocationInfo = {
            country: data.country,
            riskScore: data.riskScore,
            allowed: false,
            reason: data.reason
          };
          setLocationInfo(locationData);

          return {
            success: false,
            locationBlocked: true,
            error: data.message
          };
        }
        
        // Handle TOTP required
        if (data.totpRequired) {
          return {
            success: false,
            totpRequired: true,
            error: data.message || 'Two-factor authentication required'
          };
        }

        // Handle CSRF validation errors specifically
        if (response.status === 403 && data.error && (data.error.includes('CSRF') || data.message.includes('Session expired') || data.message.includes('Invalid CSRF token'))) {
          return {
            success: false,
            error: 'Your session has expired. Please refresh the page and try again.'
          };
        }

        throw new Error(data.error || 'Authentication failed');
      }

      // Successful authentication
      // The response now includes a success field, so we check that
      if (data.success) {
        const locationData: LocationInfo = {
          // For now, we're not getting location info from the auth response
          // In a real implementation, this would come from the API
          allowed: true
        };

        setLocationInfo(locationData);
        setLocationBlocked(false);

        // Remove manual localStorage manipulation since we're using HTTP-only cookies
        // The AuthContext will automatically pick up the cookie values on refresh
        
        // Trigger a refresh of the auth state
        await refreshAuth();
        
        // Add a small delay to ensure state is properly updated before returning success
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true };
      } else {
        throw new Error(data.error || 'Authentication failed');
      }

    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Handle AbortError specifically
      if (controller?.signal.aborted) {
        console.error('Location-aware login timed out');
        const timeoutError = new Error('Authentication request timed out. Please try again.');
        const errorState = AuthErrorHandler.handleError(
          timeoutError,
          { hook: 'useLocationAwareAuth', action: 'login', errorType: 'timeout' }
        );
        setLocationError(errorState.message);
        return {
          success: false,
          error: errorState.message
        };
      }
      
      console.error('Location-aware login failed:', error);
      const errorState = AuthErrorHandler.handleError(
        error,
        { hook: 'useLocationAwareAuth', action: 'login' }
      );
      setLocationError(errorState.message);
      return {
        success: false,
        error: errorState.message
      };
    }
  }, [refreshAuth]);

  const clearLocationError = useCallback(() => {
    setLocationError(null);
  }, []);

  const refreshLocationCheck = useCallback(() => {
    if (isAuthenticated && user?.authType) {
      return checkLocationRestrictions(user.authType);
    }
  }, [isAuthenticated, user?.authType, checkLocationRestrictions]);

  const state: LocationAwareAuthState = {
    user,
    isAuthenticated: isAuthenticated && !locationBlocked,
    loading: loading || locationLoading,
    error: authError || locationError,
    locationInfo,
    locationBlocked
  };

  return {
    ...state,
    locationAwareLogin,
    logout,
    clearError: () => {
      clearError();
      clearLocationError();
    },
    checkLocationRestrictions,
    refreshLocationCheck
  };
};