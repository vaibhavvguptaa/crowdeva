// Authentication guard components and hooks
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthUserType } from '@/types/auth';

// Unauthorized access component
const UnauthorizedAccess = ({ userRole, requiredRoles }: { userRole?: AuthUserType, requiredRoles: AuthUserType[] }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
        {userRole && (
          <>
            <br />
            <span className="text-sm">Your role: <span className="font-semibold">{userRole}</span></span>
            <br />
            <span className="text-sm">Required: <span className="font-semibold">{requiredRoles.join(', ')}</span></span>
          </>
        )}
      </p>
    </div>
  </div>
);

// Route protection HOC
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: AuthUserType[]
) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, user, loading } = useAuthContext();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      // Quick initial check
      const checkAuth = async () => {
        if (!loading) {
          if (!isAuthenticated || !user) {
            // Redirect to appropriate signin page
            const currentPath = window.location.pathname;
            let redirectPath = '/signin';
            
            if (currentPath.startsWith('/developer')) {
              redirectPath = '/developer/signin';
            } else if (currentPath.startsWith('/vendor')) {
              redirectPath = '/vendor/signin';
            }
            
            router.replace(redirectPath);
            return;
          }

          if (allowedRoles && !allowedRoles.includes(user.role)) {
            // User is authenticated but doesn't have the right role
            setIsChecking(false);
            return;
          }

          setIsChecking(false);
        }
      };

      checkAuth();
    }, [isAuthenticated, user, loading, router]);

    // Show loading while checking authentication
    if (loading || isChecking) {
      return null;
    }

    // User not authenticated (will be redirected)
    if (!isAuthenticated || !user) {
      return null;
    }

    // User authenticated but doesn't have required role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <UnauthorizedAccess userRole={user.role} requiredRoles={allowedRoles} />;
    }

    // All checks passed - render the component
    return <Component {...props} />;
  };
}

// Hook for checking if user has specific permissions
export function usePermissions() {
  const { user } = useAuthContext();

  const hasRole = (role: AuthUserType): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: AuthUserType[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const canAccess = (allowedRoles: AuthUserType[]): boolean => {
    return user ? allowedRoles.includes(user.role) : false;
  };

  return {
    hasRole,
    hasAnyRole,
    canAccess,
    userRole: user?.role,
    isCustomer: hasRole('customers'),
    isDeveloper: hasRole('developers'),
    isVendor: hasRole('vendors'),
  };
}

// Component for conditionally rendering content based on roles
interface RoleBasedContentProps {
  allowedRoles: AuthUserType[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleBasedContent({ allowedRoles, children, fallback = null }: RoleBasedContentProps) {
  const { canAccess } = usePermissions();

  return canAccess(allowedRoles) ? <>{children}</> : <>{fallback}</>;
}

// Navigation guard hook
export function useNavigationGuard() {
  const { isAuthenticated, user } = useAuthContext();
  const router = useRouter();

  const guardedNavigate = (path: string, requiredRoles?: AuthUserType[]) => {
    if (!isAuthenticated || !user) {
      // Redirect to appropriate signin
      if (path.startsWith('/developer')) {
        router.push('/developer/signin');
      } else if (path.startsWith('/vendor')) {
        router.push('/vendor/signin');
      } else {
        router.push('/signin');
      }
      return false;
    }

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      // User doesn't have required role
      console.warn(`Access denied to ${path}. Required roles: ${requiredRoles.join(', ')}, user role: ${user.role}`);
      return false;
    }

    router.push(path);
    return true;
  };

  return { guardedNavigate };
}