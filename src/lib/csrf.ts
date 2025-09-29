import { NextRequest } from 'next/server';
import crypto from 'crypto';

// CSRF Token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const CSRF_TOKEN_COOKIE = 'csrf-token';

export class CSRFProtection {
  /**
   * Generate a secure CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  }

  /**
   * Validate CSRF token from request
   */
  static validateToken(request: NextRequest): boolean {
    console.log('=== CSRF VALIDATION ===');
    console.log('Request headers:', Object.fromEntries(request.headers));
    
    // Get token from header
    const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
    console.log('Header token:', headerToken);
    
    // Get token from cookie
    const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
    console.log('Cookie token:', cookieToken);
    
    // Log all cookies for debugging
    const allCookies = request.cookies.getAll();
    console.log('All cookies:', allCookies);

    // Both tokens must exist
    if (!headerToken || !cookieToken) {
      console.log('CSRF validation failed - missing tokens', { 
        hasHeaderToken: !!headerToken, 
        hasCookieToken: !!cookieToken,
        headerToken: headerToken ? `${headerToken.substring(0, 10)}...` : null,
        cookieToken: cookieToken ? `${cookieToken.substring(0, 10)}...` : null
      });
      
      // In development environment, we might be more lenient with CSRF for testing purposes
      // But in production, we should always enforce CSRF protection
      if (process.env.NODE_ENV === 'development') {
        console.log('Development environment: CSRF validation bypassed for testing');
        return true;
      }
      
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    const isValid = this.constantTimeEquals(headerToken, cookieToken);
    console.log('CSRF token validation result:', isValid);
    if (!isValid) {
      console.log('CSRF tokens do not match');
      console.log('Header token length:', headerToken.length);
      console.log('Cookie token length:', cookieToken.length);
      console.log('Header token:', headerToken);
      console.log('Cookie token:', cookieToken);
    }
    return isValid;
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private static constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Create CSRF cookie value with security flags
   */
  static createCsrfCookie(token: string): string {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return [
      `${CSRF_TOKEN_COOKIE}=${token}`,
      'HttpOnly',
      'Path=/',
      'SameSite=Lax', // Changed from Strict to Lax to allow cross-site requests
      'Max-Age=3600', // 1 hour
      ...(isProduction ? ['Secure'] : [])
    ].join('; ');
  }

  /**
   * Check if the request method requires CSRF protection
   */
  static requiresCSRFProtection(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }
}

export { CSRF_TOKEN_HEADER, CSRF_TOKEN_COOKIE };