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
  if (!DirectGrantAuth || !OptimizedAuth) {
    const keycloakModule = await import('@/services/keycloak');
    const optimizedAuthModule = await import('@/lib/optimizedAuth');
    DirectGrantAuth = keycloakModule.DirectGrantAuth;
    OptimizedAuth = optimizedAuthModule.OptimizedAuth;
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
  const hasMounted = useHydrationSafe();
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const updateAuthState = (updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  };

  const checkAuthStatus = async () => {
    // Only check auth status on the client to prevent hydration mismatches
    if (!hasMounted) {
      return;
    }
    
    // Load auth services if not already loaded
    await loadAuthServices();
    
    try {
      // Perform optimized quick auth check
      const quickCheck = await OptimizedAuth.quickAuthCheck().catch(() => false);
      
      if (quickCheck) {
        const userInfo = DirectGrantAuth.getUserInfo();
        
        updateAuthState({
          isAuthenticated: true,
          user: userInfo,
          loading: false,
          error: null,
        });
      } else {
        // Check if there's any indication of an existing session
        let hasSessionIndication = false;
        
        // Check localStorage for authType
        if (typeof window !== 'undefined') {
          const storedAuthType = localStorage.getItem('authType');
          if (storedAuthType) {
            hasSessionIndication = true;
          }
        }
        
        // Check cookies for authType or sid
        if (!hasSessionIndication && typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'authType' || name === 'sid') {
              hasSessionIndication = true;
              break;
            }
          }
        }
        
        // Only try to refresh if there's some indication of an existing session
        if (hasSessionIndication) {
          // Try to get authType from localStorage first
          let authType = typeof window !== 'undefined' 
            ? localStorage.getItem('authType') as AuthUserType
            : null;
          
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
          }
          
          // If still no authType, try to infer it or default to customers
          if (!authType) {
            // Try to get user info to infer authType
            const userInfo = DirectGrantAuth.getUserInfo();
            authType = (userInfo && userInfo.authType) || 'customers';
          }
          
          if (authType) {
            try {
              const refreshResult = await DirectGrantAuth.refresh(authType);
              const userInfo = DirectGrantAuth.getUserInfo();
              if (userInfo) {
                updateAuthState({
                  isAuthenticated: true,
                  user: userInfo,
                  loading: false,
                  error: null,
                });
                return;
              }
            } catch (e) {
              // Refresh failed, continue with unauthenticated state
            }
          }
          
          // Try one more time with a default authType before giving up
          try {
            await DirectGrantAuth.refresh('customers');
            const userInfo = DirectGrantAuth.getUserInfo();
            if (userInfo) {
              updateAuthState({
                isAuthenticated: true,
                user: userInfo,
                loading: false,
                error: null,
              });
              return;
            }
          } catch (e) {
            // Ignore error and continue with unauthenticated state
          }
        }
        
        // If we get here, it means there's no active session
        updateAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      updateAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
      });
    }
  };

  const login = async (username: string, password: string, authType: AuthUserType, otp?: string) => {
    // Load auth services if not already loaded
    await loadAuthServices();
    
    try {
      updateAuthState({ loading: true, error: null });
      
      // Check if this is an OAuth flow (should bypass 2FA)
      const loginMethod = typeof window !== 'undefined' ? localStorage.getItem('loginMethod') : null;
      const isOAuthFlow = loginMethod === 'oauth';
      
      // Use optimized login
      try {
        // For OAuth flows, bypass OTP requirement
        if (isOAuthFlow) {
          await OptimizedAuth.fastLogin(username, password, authType).catch((error: any) => {
            throw error;
          });
        } else {
          await OptimizedAuth.fastLogin(username, password, authType, otp).catch((error: any) => {
            throw error;
          });
        }
        await checkAuthStatus().catch(() => {
          // Ignore errors in checkAuthStatus
        });
      } catch (e) {
        // Only require TOTP for non-OAuth flows
        if (e instanceof Error && e.message === 'TOTP_REQUIRED' && !isOAuthFlow) {
          // Surface special marker; UI layer can interpret and move to OTP stage.
          updateAuthState({ loading: false, error: 'TOTP_REQUIRED' });
          return;
        }
        throw e;
      }
    } catch (error) {
      updateAuthState({
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  };

  const logout = async () => {
    // Load auth services if not already loaded
    await loadAuthServices();
    
    try {
      updateAuthState({ loading: true, error: null });
      
      // Call server logout endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      }).catch(() => {
        // Ignore fetch errors
      });
      
      clearTimeout(timeoutId);

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
      // Even if server logout fails, clear client state
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
    // Load auth services if not already loaded
    await loadAuthServices();
    
    try {
      updateAuthState({ loading: true, error: null });
      
      // Add a small timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced timeout
      
      const result = await Promise.race([
        DirectGrantAuth.register(email, password, companyName, firstName, lastName, authType).catch((error: any) => {
          throw error;
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Registration timeout')), 9000)
        )
      ]);
      
      clearTimeout(timeoutId);
      
      updateAuthState({ loading: false });
    } catch (error) {
      updateAuthState({
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
      throw error;
    }
  };

  const refreshAuth = async () => {
    // Load auth services if not already loaded
    await loadAuthServices();
    
    if (!hasMounted) return;
    
    try {
      // Try to get authType from localStorage first
      let authType = typeof window !== 'undefined' 
        ? localStorage.getItem('authType') as AuthUserType
        : null;
      
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
      }
      
      // If still no authType, try to infer it or default to customers
      if (!authType) {
        // Try to get user info to infer authType
        const userInfo = DirectGrantAuth.getUserInfo();
        authType = (userInfo && userInfo.authType) || 'customers';
      }
      
      if (!authType) {
        return;
      }
      
      // Use the new refresh mechanism which works with HttpOnly cookies
      try {
        await DirectGrantAuth.refresh(authType);
        await checkAuthStatus();
      } catch (error) {
        // If refresh fails, ensure we're in a logged out state
        updateAuthState({
          isAuthenticated: false,
          user: null,
          error: 'Session expired. Please sign in again.',
        });
      }
    } catch (error) {
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
    // Only run auth check after component has mounted on client
    if (hasMounted) {
      checkAuthStatus();

      // Set up periodic token refresh
      const refreshInterval = setInterval(() => {
        if (DirectGrantAuth && DirectGrantAuth.isAuthenticated && DirectGrantAuth.isAuthenticated()) {
          refreshAuth();
        }
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      // Listen for storage changes (for multi-tab sync)
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'kc-token' || event.key === 'authType') {
          checkAuthStatus();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
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
      if (!loading && (!isAuthenticated || !user)) {
        // Client-side redirect fallback (middleware should normally handle SSR redirect)
        if (typeof window !== 'undefined') {
          const signInPath = resolveSigninPath();
          // Add a small delay to ensure state is properly updated
          setTimeout(() => {
            try {
              router.push(signInPath);
            } catch (e) {
              // Ignore router errors
            }
          }, 50);
        }
      } else if (!loading && isAuthenticated && user) {
        // If we're on a signin page but already authenticated, redirect to appropriate dashboard
        if (typeof window !== 'undefined' && window.location.pathname.includes('/signin')) {
          const dashboardPath = user.role === 'developers' ? '/developer/projects' : 
                            user.role === 'vendors' ? '/vendor/projects' : '/projects';
          // Add a small delay to ensure state is properly updated
          setTimeout(() => {
            try {
              router.push(dashboardPath);
            } catch (e) {
              // Ignore router errors
            }
          }, 50);
        }
      }
    }, [loading, isAuthenticated, user, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-6" />
          <p className="text-slate-600 text-sm">Loading authentication...</p>
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-6" />
          <p className="text-slate-600 text-sm">Redirecting to sign in…</p>
        </div>
      );
    }

    if (allowedRoles && user && user.role && !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}