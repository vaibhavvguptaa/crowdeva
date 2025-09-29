import { cookies } from 'next/headers';
import { verifyKeycloakJWT, extractAuthType } from './jwtVerify';
import { getSession } from './fileSessionStore';

/**
 * Get the current user session from cookies
 * This function verifies the JWT token and returns user information
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    // First try the new session-based approach
    const sessionId = cookieStore.get('sid')?.value;
    
    if (sessionId) {
      // Get session from session store
      const session = await getSession(sessionId);
      
      if (!session) {
        return null;
      }
      
      // For now, we'll create a minimal session object
      // In a real implementation, you might want to verify the refresh token
      // or fetch user info from Keycloak using the refresh token
      return {
        user: {
          id: session.userId || 'unknown',
          email: session.userId || 'unknown@example.com',
          name: session.userId || 'Unknown User',
          role: session.authType || 'customers',
          authType: session.authType || 'customers'
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
    }
    
    // Fallback to old token-based approach for backward compatibility
    const token = cookieStore.get('kc-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify the token using Keycloak JWKS
    const verifiedToken = await verifyKeycloakJWT(token);
    
    if (!verifiedToken) {
      return null;
    }
    
    const { payload } = verifiedToken;
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    // Extract auth type from token
    const authType = extractAuthType(payload) || 'customers';
    
    return {
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name || `${payload.given_name} ${payload.family_name}`,
        role: authType,
        authType: authType
      },
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : new Date()
    };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/**
 * Check if user has a specific role
 */
export function hasRole(session: any, role: string) {
  return session?.user?.role === role;
}

/**
 * Check if user has one of the specified roles
 */
export function hasAnyRole(session: any, roles: string[]) {
  return roles.includes(session?.user?.role);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(session: any) {
  return !!session && !!session.user;
}