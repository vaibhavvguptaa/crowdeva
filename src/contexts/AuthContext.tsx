"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
// Import types only to avoid circular dependencies
import type { AuthUser, AuthUserType, AuthState } from '@/types/auth';
import { AuthErrorBoundary } from '@/components/Ui/AuthErrorBoundary';
import { useHydrationSafe } from '@/hooks/useHydrationSafe';

// Lazy import the authentication services to avoid circular dependencies
let DirectGrantAuth: any = null;
let OptimizedAuth: any = null;

// Function to dynamically import auth services
const loadAuthServices = async () => {
  console.log('Loading auth services', { hasDirectGrantAuth: !!DirectGrantAuth, hasOptimizedAuth: !!OptimizedAuth });
  if (!DirectGrantAuth || !OptimizedAuth) {
    console.log('Importing auth modules');
    const keycloakModule = await import('@/services/keycloak');
    const optimizedAuthModule = await import('@/lib/optimizedAuth');
    DirectGrantAuth = keycloakModule.DirectGrantAuth;
    OptimizedAuth = optimizedAuthModule.OptimizedAuth;
    console.log('Auth services loaded successfully');
  } else {
    console.log('Auth services already loaded');
  }
};

interface AuthContextType extends AuthState {
  login: (username: string, password: string, authType: AuthUserType, otp?: string) => Promise<void>;
  loginWithOtp: (username: string, password: string, authType: AuthUserType, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    companyName: string | null,
    firstName: string,
    lastName: string,
    authType: AuthUserType
  ) => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log('AuthProvider mounted');
  const hasMounted = useHydrationSafe();
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });
  
  console.log('Initial auth state:', authState);

  const updateAuthState = (updates: Partial<AuthState>) => {
    console.log('Updating auth state with:', updates);
    setAuthState(prev => ({ ...prev, ...updates }));
  };

  const checkAuthStatus = async () => {
    console.log('=== CHECKING AUTH STATUS ===');
    
    // Only check auth status on the client to prevent hydration mismatches
    if (!hasMounted) {
      console.log('Not mounted yet, skipping auth check');
      return;
    }
    
    // Load auth services if not already loaded
    await loadAuthServices();
    
    try {
      // Check for OAuth login method and bypass 2FA for verified OAuth flows
      const loginMethod = typeof window !== 'undefined' ? localStorage.getItem('loginMethod') : null;
      const isOAuthFlow = loginMethod === 'oauth';
      
      console.log('Performing optimized quick auth check');
      const quickCheck = await OptimizedAuth.quickAuthCheck().catch(() => false);
      console.log('Quick auth check result:', quickCheck);
      
      if (quickCheck) {
        const userInfo = DirectGrantAuth.getUserInfo();
        console.log('User info from quick check:', userInfo);
        
        // Clean up OAuth flags after successful authentication
        if (isOAuthFlow && typeof window !== 'undefined') {
          try {
            localStorage.removeItem('loginMethod');
            localStorage.removeItem('oauthAuthType');
          } catch { /* ignore */ }
        }
        
        updateAuthState({
          isAuthenticated: true,
          user: userInfo,
          loading: false,
          error: null,
        });
      } else {
        console.log('Quick check failed, checking for existing session');
        console.log('Current auth state:', { hasDirectGrantAuth: !!DirectGrantAuth, hasOptimizedAuth: !!OptimizedAuth });
        
        // Check if there's any indication of an existing session before trying to refresh
        let hasSessionIndication = false;
        
        // Check localStorage for authType
        if (typeof window !== 'undefined') {
          const storedAuthType = localStorage.getItem('authType');
          if (storedAuthType) {
            hasSessionIndication = true;
            console.log('Found authType in localStorage, indicating possible session');
          }
        }
        
        // Check cookies for authType or sid
        if (!hasSessionIndication && typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'authType' || name === 'sid') {
              hasSessionIndication = true;
              console.log('Found session cookie:', name);
              break;
            }
          }
        }
        
        // Only try to refresh if there's some indication of an existing session
        if (hasSessionIndication) {
          console.log('Session indication found, attempting refresh');
          // Load auth services if not already loaded
          await loadAuthServices();
          
          // Try to get authType from localStorage first
          let authType = typeof window !== 'undefined' 
            ? localStorage.getItem('authType') as AuthUserType
            : null;
          console.log('Auth type from localStorage:', authType);
          
          // If not in localStorage, try to get it from cookies
          if (!authType && typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=');
              if (name === 'authType') {
                authType = decodeURIComponent(value) as AuthUserType;
                break;
              }
            }
            console.log('Auth type from cookies:', authType);
          }
          
          // If still no authType, try to infer it or default to customers
          if (!authType) {
            // Try to get user info to infer authType
            const userInfo = DirectGrantAuth.getUserInfo();
            authType = (userInfo && userInfo.authType) || 'customers';
            console.log('Inferred auth type:', authType);
          }
          
          console.log('Final auth type for refresh:', authType);
          
          if (authType) {
            try {
              console.log('Attempting to refresh with authType:', authType);
              const refreshResult = await DirectGrantAuth.refresh(authType);
              console.log('Refresh result:', refreshResult);
              const userInfo = DirectGrantAuth.getUserInfo();
              console.log('User info after refresh:', userInfo);
              if (userInfo) {
                console.log('Updating auth state with user info');
                updateAuthState({
                  isAuthenticated: true,
                  user: userInfo,
                  loading: false,
                  error: null,
                });
                return;
              } else {
                console.log('No user info after refresh');
              }
            } catch (e) {
              // Refresh failed, continue with unauthenticated state
              console.warn('Token refresh failed:', e);
            }
          }
          
          // Try one more time with a default authType before giving up
          try {
            console.log('Trying fallback refresh with customers authType');
            await DirectGrantAuth.refresh('customers');
            const userInfo = DirectGrantAuth.getUserInfo();
            if (userInfo) {
              console.log('Fallback refresh successful');
              updateAuthState({
                isAuthenticated: true,
                user: userInfo,
                loading: false,
                error: null,
              });
              return;
            } else {
              console.log('Fallback refresh failed - no user info');
            }
          } catch (e) {
            // Ignore error and continue with unauthenticated state
            console.warn('Fallback refresh with customers authType failed:', e);
          }
        } else {
          console.log('No session indication found, skipping refresh for initial visit');
        }
        
        // If we get here, it means there's no active session, which is normal for initial visits
        // Don't set error state, just set loading to false
        console.log('Setting auth state to unauthenticated - no active session');
        
        console.log('Setting auth state to unauthenticated - no active session');
        updateAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      console.log('Setting auth state to error state');
      updateAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
      });
    }
  };

  const login = async (username: string, password: string, authType: AuthUserType, otp?: string) => {
    console.log('Login called with:', { username, authType, hasOtp: !!otp });
    
    // Load auth services if not already loaded
    await loadAuthServices();
    
    try {
      updateAuthState({ loading: true, error: null });
      
      // Check if this is an OAuth flow (should bypass 2FA)
      const loginMethod = typeof window !== 'undefined' ? localStorage.getItem('loginMethod') : null;
      const isOAuthFlow = loginMethod === 'oauth';
      
      console.log('Login method:', loginMethod, 'Is OAuth flow:', isOAuthFlow);
      
      // Use optimized login
      try {
        console.log('Attempting optimized login with authType:', authType);
        // For OAuth flows, bypass OTP requirement
        if (isOAuthFlow) {
          console.log('Performing OAuth flow login');
          await OptimizedAuth.fastLogin(username, password, authType).catch((error: any) => {
            throw error;
          });
        } else {
          console.log('Performing regular login with OTP:', !!otp);
          await OptimizedAuth.fastLogin(username, password, authType, otp).catch((error: any) => {
            throw error;
          });
        }
        console.log('Optimized login successful, checking auth status');
        await checkAuthStatus().catch(() => {
          // Ignore errors in checkAuthStatus
        });
      } catch (e) {
        console.log('Login failed with error:', e);
        // Only require TOTP for non-OAuth flows
        if (e instanceof Error && e.message === 'TOTP_REQUIRED' && !isOAuthFlow) {
          // Surface special marker; UI layer can interpret and move to OTP stage.
          updateAuthState({ loading: false, error: 'TOTP_REQUIRED' });
          // Note: Navigation should be handled by the UI component, not in the context
          return;
        }
        throw e;
      }
    } catch (error) {
      console.log('Login failed with error:', error);
      updateAuthState({
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  };

  const logout = async () => {
    console.log('Logout called');
    
    // Load auth services if not already loaded
    await loadAuthServices();
    
    try {
      updateAuthState({ loading: true, error: null });
      
      // Call server logout endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      console.log('Calling server logout endpoint');
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      }).catch((error) => {
        console.log('Server logout failed:', error);
        // Ignore fetch errors
      });
      
      clearTimeout(timeoutId);

      console.log('Clearing client state');
      // Clear client state
      DirectGrantAuth.logout();
      OptimizedAuth.clearCache();
      
      updateAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if server logout fails, clear client state
      console.log('Clearing client state after error');
      DirectGrantAuth.logout();
      OptimizedAuth.clearCache();
      updateAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    }
  };

  const register = async (
    email: string,
    password: string,
    companyName: string | null,
    firstName: string,
    lastName: string,
    authType: AuthUserType
  ) => {
    console.log('Register called with:', { email, companyName, firstName, lastName, authType });
    
    // Load auth services if not already loaded
    await loadAuthServices();
    
    try {
      console.log('Starting registration process...');
      updateAuthState({ loading: true, error: null });
      
      console.log('Calling DirectGrantAuth.register with data:', {
        email,
        password: '***',
        companyName,
        firstName,
        lastName,
        authType
      });
      
      // Add a small timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const result = await Promise.race([
        DirectGrantAuth.register(email, password, companyName, firstName, lastName, authType).catch((error: any) => {
          throw error;
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Registration timeout')), 14000)
        )
      ]);
      
      clearTimeout(timeoutId);
      
      console.log('Registration completed successfully with result:', result);
      updateAuthState({ loading: false });
    } catch (error) {
      console.error('Registration failed with error:', error);
      updateAuthState({
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
      throw error;
    }
  };

  const refreshAuth = async () => {
    console.log('RefreshAuth called');
    
    // Load auth services if not already loaded
    await loadAuthServices();
    
    if (!hasMounted) return;
    
    try {
      // Try to get authType from localStorage first
      let authType = typeof window !== 'undefined' 
        ? localStorage.getItem('authType') as AuthUserType
        : null;
      
      console.log('Auth type from localStorage:', authType);
      
      // If not in localStorage, try to get it from cookies
      if (!authType && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'authType') {
            authType = decodeURIComponent(value) as AuthUserType;
            break;
          }
        }
        console.log('Auth type from cookies:', authType);
      }
      
      // If still no authType, try to infer it or default to customers
      if (!authType) {
        // Try to get user info to infer authType
        const userInfo = DirectGrantAuth.getUserInfo();
        authType = (userInfo && userInfo.authType) || 'customers';
        console.log('Inferred auth type:', authType);
      }
      
      if (!authType) {
        console.log('No auth type found, returning');
        return;
      }
      
      // Use the new refresh mechanism which works with HttpOnly cookies
      try {
        console.log('Refreshing auth with authType:', authType);
        await DirectGrantAuth.refresh(authType);
        console.log('Refresh completed, checking auth status');
        await checkAuthStatus();
      } catch (error) {
        console.error('Refresh auth failed:', error);
        // If refresh fails, ensure we're in a logged out state
        updateAuthState({
          isAuthenticated: false,
          user: null,
          error: 'Session expired. Please sign in again.',
        });
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      updateAuthState({
        isAuthenticated: false,
        user: null,
        error: 'Session expired. Please sign in again.',
      });
    }
  };

  const clearError = () => {
    updateAuthState({ error: null });
  };

  useEffect(() => {
    console.log('AuthContext useEffect triggered', { hasMounted });
    // Only run auth check after component has mounted on client
    if (hasMounted) {
      console.log('Running auth check on mount');
      checkAuthStatus();

      // Set up periodic token refresh
      const refreshInterval = setInterval(() => {
        console.log('Running periodic token refresh');
        if (DirectGrantAuth && DirectGrantAuth.isAuthenticated && DirectGrantAuth.isAuthenticated()) {
          refreshAuth();
        }
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      // Listen for storage changes (for multi-tab sync)
      const handleStorageChange = (event: StorageEvent) => {
        console.log('Storage change detected:', event.key);
        if (event.key === 'kc-token' || event.key === 'authType') {
          checkAuthStatus();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        console.log('Cleaning up AuthContext useEffect');
        clearInterval(refreshInterval);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [hasMounted]);

  const loginWithOtp = async (username: string, password: string, authType: AuthUserType, otp: string) => {
    await login(username, password, authType, otp);
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    loginWithOtp,
    logout,
    register,
    refreshAuth,
    clearError,
  };
  
  console.log('Context value:', contextValue);

  console.log('Rendering AuthProvider with context value');
  // Add error boundary to prevent React errors from crashing the app
  return (
    <AuthContext.Provider value={contextValue}>
      <AuthErrorBoundary>
        {children}
      </AuthErrorBoundary>
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  console.log('useAuthContext called');
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  console.log('Returning auth context:', context);
  return context;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: AuthUserType[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, user, loading } = useAuthContext();
    const router = useRouter();

    // Determine correct sign-in route once (kept simple based on pathname heuristics)
    const resolveSigninPath = () => {
      if (typeof window === 'undefined') return '/signin';
      const path = window.location.pathname;
      if (path.startsWith('/developer')) return '/developer/signin';
      if (path.startsWith('/vendor')) return '/vendor/signin';
      return '/signin';
    };

    // Handle redirects in useEffect to avoid React render phase violations
    useEffect(() => {
      console.log('=== WITH AUTH CHECK ===');
      console.log('Loading:', loading);
      console.log('Is authenticated:', isAuthenticated);
      console.log('User:', user);
      
      if (!loading && (!isAuthenticated || !user)) {
        console.log('User is not authenticated, redirecting to sign in');
        // Client-side redirect fallback (middleware should normally handle SSR redirect)
        if (typeof window !== 'undefined') {
          console.log('Redirecting to sign in page from withAuth HOC');
          const signInPath = resolveSigninPath();
          console.log('Redirecting to:', signInPath);
          // Add a small delay to ensure state is properly updated
          setTimeout(() => {
            try {
              router.push(signInPath);
            } catch (e) {
              console.error('Router push failed:', e);
            }
          }, 100);
        }
      } else if (!loading && isAuthenticated && user) {
        console.log('User is authenticated');
        // If we're on a signin page but already authenticated, redirect to appropriate dashboard
        if (typeof window !== 'undefined' && window.location.pathname.includes('/signin')) {
          const dashboardPath = user.role === 'developers' ? '/developer/projects' : 
                            user.role === 'vendors' ? '/vendor/projects' : '/projects';
          console.log('Redirecting authenticated user to dashboard from withAuth HOC:', dashboardPath);
          // Add a small delay to ensure state is properly updated
          setTimeout(() => {
            try {
              router.push(dashboardPath);
            } catch (e) {
              console.error('Router push failed:', e);
            }
          }, 100);
        }
      } else {
        console.log('Auth state is in loading state or other condition');
      }
    }, [loading, isAuthenticated, user, router]);

    if (loading) {
      console.log('Rendering loading state');
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-6" />
          <p className="text-slate-600 text-sm">Loading authentication...</p>
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      console.log('Rendering unauthenticated state');
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-6" />
          <p className="text-slate-600 text-sm">Redirecting to sign in…</p>
        </div>
      );
    }

    if (allowedRoles && user && user.role && !allowedRoles.includes(user.role)) {
      console.log('Rendering access denied state');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    console.log('Rendering authenticated component');
    return <Component {...props} />;
  };
}