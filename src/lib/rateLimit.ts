import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5, // Max 5 attempts per window
  blockDurationMs: 60 * 60 * 1000, // Block for 1 hour after exceeding limit
};

export function rateLimit(options: RateLimitOptions) {
  return {
    check: async (request: NextRequest, limit: number): Promise<RateLimitResult> => {
      // Get client identifier (IP address)
      const forwarded = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      const clientIP = forwarded?.split(',')[0].trim() || realIP || 'unknown';
      
      const now = Date.now();
      const key = `rate_limit:${clientIP}:${request.nextUrl.pathname}`;
      
      // Clean up expired entries periodically
      if (Math.random() < 0.01) { // 1% chance to cleanup on each request
        cleanupExpiredEntries();
      }

      const entry = rateLimitStore.get(key);
      
      if (!entry) {
        // First request from this IP
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + options.interval,
        });
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: now + options.interval
        };
      }

      // Check if window has expired
      if (now > entry.resetTime) {
        // Reset the window
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + options.interval,
        });
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: now + options.interval
        };
      }

      // Check if limit exceeded
      if (entry.count >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: entry.resetTime
        };
      }

      // Increment counter
      entry.count++;
      rateLimitStore.set(key, entry);

      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - entry.count),
        reset: entry.resetTime
      };
    }
  };
}

export function createRateLimiter() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Get client identifier (IP address)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0].trim() || realIP || 'unknown';
    
    // Only apply rate limiting to auth endpoints
    const pathname = request.nextUrl.pathname;
    if (!pathname.startsWith('/api/auth/')) {
      return null; // Continue to next middleware
    }

    const now = Date.now();
    const key = `rate_limit:${clientIP}:${pathname}`;
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup on each request
      cleanupExpiredEntries();
    }

    const entry = rateLimitStore.get(key);
    
    if (!entry) {
      // First request from this IP
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      });
      return null; // Allow request
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      // Reset the window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      });
      return null; // Allow request
    }

    // Check if limit exceeded
    if (entry.count >= RATE_LIMIT_CONFIG.maxAttempts) {
      // Check if still in block period
      const blockExpiry = entry.resetTime + RATE_LIMIT_CONFIG.blockDurationMs;
      if (now < blockExpiry) {
        const remainingTime = Math.ceil((blockExpiry - now) / 1000 / 60); // minutes
        
        return NextResponse.json(
          {
            error: 'Too many attempts',
            message: `Rate limit exceeded. Try again in ${remainingTime} minutes.`,
            retryAfter: Math.ceil((blockExpiry - now) / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((blockExpiry - now) / 1000).toString(),
              'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxAttempts.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(blockExpiry / 1000).toString(),
            },
          }
        );
      } else {
        // Block period expired, reset
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + RATE_LIMIT_CONFIG.windowMs,
        });
        return null; // Allow request
      }
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    // Add rate limit headers
    const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - entry.count);
    
    // Continue to next middleware but add headers to response
    return null; // We'll add headers in the actual API routes
  };
}

function cleanupExpiredEntries() {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  for (const [key, entry] of rateLimitStore.entries()) {
    const blockExpiry = entry.resetTime + RATE_LIMIT_CONFIG.blockDurationMs;
    if (now > blockExpiry) {
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => rateLimitStore.delete(key));
}

// Helper function to get rate limit info for a key
export function getRateLimitInfo(clientIP: string, pathname: string) {
  const key = `rate_limit:${clientIP}:${pathname}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!entry || now > entry.resetTime) {
    return {
      remaining: RATE_LIMIT_CONFIG.maxAttempts,
      reset: Math.ceil((now + RATE_LIMIT_CONFIG.windowMs) / 1000),
      limit: RATE_LIMIT_CONFIG.maxAttempts,
    };
  }
  
  return {
    remaining: Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - entry.count),
    reset: Math.ceil(entry.resetTime / 1000),
    limit: RATE_LIMIT_CONFIG.maxAttempts,
  };
}

export const rateLimitMiddleware = createRateLimiter();
