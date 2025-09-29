import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from './session';

/**
 * Protect API routes with authentication
 * @param handler The API route handler function
 * @param options Optional configuration
 * @returns Wrapped handler with authentication check
 */
export function withApiAuth<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    allowedRoles?: string[];
    requireAuth?: boolean;
  }
) {
  return async function (...args: Parameters<T>) {
    const req = args[0] as NextRequest;
    
    // Skip auth check for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return handler(...args);
    }
    
    // Check if authentication is required (default: true)
    const requireAuth = options?.requireAuth !== false;
    
    if (requireAuth) {
      const session = await getServerSession();
      
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized: No valid session found' },
          { status: 401 }
        );
      }
      
      // Check role permissions if specified
      if (options?.allowedRoles && options.allowedRoles.length > 0) {
        const userRole = session.user.role;
        if (!options.allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { error: 'Forbidden: Insufficient permissions' },
            { status: 403 }
          );
        }
      }
      
      // Add session to request context
      (req as any).session = session;
    }
    
    return handler(...args);
  };
}

/**
 * Get the current user session from an API route
 * @param req NextRequest object
 * @returns Session object or null
 */
export async function getCurrentSession(req: NextRequest) {
  return getServerSession();
}

/**
 * Require authentication for an API route
 * @param req NextRequest object
 * @returns Session object or error response
 */
export async function requireAuth(req: NextRequest) {
  const session = await getServerSession();
  
  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: No valid session found' },
        { status: 401 }
      ),
      session: null
    };
  }
  
  return { error: null, session };
}