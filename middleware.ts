import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyKeycloakJWT } from '@/lib/jwtVerify';

// Define which paths should be protected
const protectedPaths = [
  '/api/projects',
  '/api/dashboard',
  '/api/users',
  '/api/marketplace',
];

// Define which paths should be excluded from protection (public APIs)
const excludedPaths = [
  '/api/auth/csrf-token',
  '/api/auth/forgot-password',
  '/api/health',
  '/api/test-routes',
  '/api/analytics/errors',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('Middleware running for path:', pathname);
  
  // Skip middleware for excluded paths
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    console.log('Skipping middleware for excluded path:', pathname);
    return NextResponse.next();
  }
  
  // Check if this is a protected API route
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedRoute) {
    console.log('Checking protected route:', pathname);
    
    // Get the token from cookies
    const token = request.cookies.get('kc-token')?.value;
    
    if (!token) {
      console.log('No token found, returning 401');
      // Redirect to login for page requests or return 401 for API requests
      if (request.headers.get('accept')?.includes('text/html')) {
        return NextResponse.redirect(new URL('/signin', request.url));
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    try {
      // Verify the token
      await verifyKeycloakJWT(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Clear invalid token cookie
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.cookies.delete('kc-token');
      
      // Redirect to login for page requests or return 401 for API requests
      if (request.headers.get('accept')?.includes('text/html')) {
        return NextResponse.redirect(new URL('/signin', request.url));
      } else {
        return response;
      }
    }
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    '/api/:path*',
    '/projects/:path*',
    '/dashboard/:path*',
    '/marketplace/:path*',
  ],
};