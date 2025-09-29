import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as refreshRoute } from '@/app/api/auth/refresh/route';
import { NextRequest } from 'next/server';
import { createSession, getSession, deleteSession } from '@/lib/fileSessionStore';

// Mock file session store
vi.mock('@/lib/fileSessionStore', () => ({
  createSession: vi.fn(),
  getSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  rotateSession: vi.fn(),
  sessionStats: vi.fn(),
  trackLoginAttempt: vi.fn(),
  isSessionLocked: vi.fn()
}));

// Mock Keycloak configuration
vi.mock('@/lib/config', () => ({
  getKeycloakConfig: vi.fn().mockImplementation(() => ({
    url: 'http://localhost:8080',
    realm: 'Customer',
    clientId: 'customer-web'
  }))
}));

// Mock NextResponse with a simpler approach
vi.mock('next/server', async () => {
  // Create a mock response object with proper headers
  const createMockResponse = (data: any, init?: ResponseInit) => {
    return {
      json: async () => data,
      headers: {
        set: vi.fn(),
        append: vi.fn(),
        get: vi.fn().mockReturnValue(null)
      },
      status: init?.status || 200
    };
  };

  return {
    NextResponse: {
      json: vi.fn().mockImplementation(createMockResponse)
    },
    NextRequest: vi.fn()
  };
});

describe('Authentication API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should refresh token successfully', async () => {
    // Mock request with session cookie
    const mockRequest = {
      cookies: {
        get: vi.fn().mockImplementation((name: string) => {
          if (name === 'sid') return { name: 'sid', value: 'test-session-id' };
          return undefined;
        }),
        getAll: vi.fn().mockReturnValue([{ name: 'sid', value: 'test-session-id' }]),
        set: vi.fn()
      },
      json: vi.fn().mockResolvedValue({ authType: 'customers' }),
      headers: {
        entries: vi.fn().mockReturnValue([]),
        get: vi.fn().mockReturnValue(null)
      },
      url: 'http://localhost:3000',
      method: 'POST'
    } as unknown as NextRequest;

    // Mock session data
    (getSession as any).mockResolvedValue({
      refreshToken: 'test-refresh-token',
      authType: 'customers',
      userId: 'test-user-id'
    });

    // Mock Keycloak response with valid JWT token
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        refresh_token: 'new-refresh-token',
        expires_in: 300,
        token_type: 'Bearer'
      })
    }) as any;

    const response = await refreshRoute(mockRequest);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  });

  it('should return 401 when no session cookie is present', async () => {
    // Mock request without session cookie
    const mockRequest = {
      cookies: {
        get: vi.fn().mockReturnValue(undefined),
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      },
      json: vi.fn().mockResolvedValue({}),
      headers: {
        entries: vi.fn().mockReturnValue([]),
        get: vi.fn().mockReturnValue(null)
      },
      url: 'http://localhost:3000',
      method: 'POST'
    } as unknown as NextRequest;

    const response = await refreshRoute(mockRequest);
    
    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData.error).toBe('No session found');
  });

  it('should return 401 when session is invalid', async () => {
    // Mock request with session cookie
    const mockRequest = {
      cookies: {
        get: vi.fn().mockImplementation((name: string) => {
          if (name === 'sid') return { name: 'sid', value: 'invalid-session-id' };
          return undefined;
        }),
        getAll: vi.fn().mockReturnValue([{ name: 'sid', value: 'invalid-session-id' }]),
        set: vi.fn()
      },
      json: vi.fn().mockResolvedValue({ authType: 'customers' }),
      headers: {
        entries: vi.fn().mockReturnValue([]),
        get: vi.fn().mockReturnValue(null)
      },
      url: 'http://localhost:3000',
      method: 'POST'
    } as unknown as NextRequest;

    // Mock invalid session
    (getSession as any).mockResolvedValue(undefined);

    const response = await refreshRoute(mockRequest);
    
    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData.error).toBe('Invalid session');
  });

  it('should return 401 when Keycloak refresh fails', async () => {
    // Mock request with session cookie
    const mockRequest = {
      cookies: {
        get: vi.fn().mockImplementation((name: string) => {
          if (name === 'sid') return { name: 'sid', value: 'test-session-id' };
          return undefined;
        }),
        getAll: vi.fn().mockReturnValue([{ name: 'sid', value: 'test-session-id' }]),
        set: vi.fn()
      },
      json: vi.fn().mockResolvedValue({ authType: 'customers' }),
      headers: {
        entries: vi.fn().mockReturnValue([]),
        get: vi.fn().mockReturnValue(null)
      },
      url: 'http://localhost:3000',
      method: 'POST'
    } as unknown as NextRequest;

    // Mock valid session
    (getSession as any).mockResolvedValue({
      refreshToken: 'test-refresh-token',
      authType: 'customers',
      userId: 'test-user-id'
    });

    // Mock Keycloak failure response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue('Invalid refresh token')
    }) as any;

    const response = await refreshRoute(mockRequest);
    
    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData.error).toBe('Session expired');
  });

  it('should handle auth type mismatch', async () => {
    // Mock request with session cookie
    const mockRequest = {
      cookies: {
        get: vi.fn().mockImplementation((name: string) => {
          if (name === 'sid') return { name: 'sid', value: 'test-session-id' };
          return undefined;
        }),
        getAll: vi.fn().mockReturnValue([{ name: 'sid', value: 'test-session-id' }]),
        set: vi.fn()
      },
      json: vi.fn().mockResolvedValue({ authType: 'developers' }),
      headers: {
        entries: vi.fn().mockReturnValue([]),
        get: vi.fn().mockReturnValue(null)
      },
      url: 'http://localhost:3000',
      method: 'POST'
    } as unknown as NextRequest;

    // Mock session with different auth type
    (getSession as any).mockResolvedValue({
      refreshToken: 'test-refresh-token',
      authType: 'customers',
      userId: 'test-user-id'
    });

    const response = await refreshRoute(mockRequest);
    
    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toBe('Auth type mismatch');
  });
});