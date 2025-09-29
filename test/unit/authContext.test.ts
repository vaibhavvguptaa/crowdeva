import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DirectGrantAuth } from '@/services/keycloak';
import { AuthUserType } from '@/types/auth';

// Mock the Keycloak configuration
vi.mock('@/lib/config', () => ({
  getKeycloakConfig: vi.fn().mockImplementation((authType: AuthUserType = 'customers') => {
    // Check if all required config values are present
    if (!authType) return null;
    return {
      url: 'http://localhost:8080',
      realm: authType === 'developers' ? 'Developer' : authType === 'vendors' ? 'Vendor' : 'Customer',
      clientId: `${authType}-web`
    };
  })
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

describe('Authentication Context Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock global objects
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
    Object.defineProperty(global, 'window', { value: { location: { origin: 'http://localhost:3000' } } });
    Object.defineProperty(global, 'document', { value: { cookie: '' } });
    
    // Clear any stored tokens
    DirectGrantAuth['accessToken'] = null;
    DirectGrantAuth['refreshToken'] = null;
    DirectGrantAuth['userInfo'] = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle successful login', async () => {
    // Mock successful Keycloak response
    const mockTokens = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      expires_in: 300
    };

    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTokens)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sub: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'testuser'
        })
      }));

    await expect(
      DirectGrantAuth.login('test@example.com', 'password123', 'customers')
    ).resolves.toEqual(mockTokens);

    // Verify tokens were stored
    expect(DirectGrantAuth.getToken()).toBe('mock-access-token');
    expect(DirectGrantAuth.isAuthenticated()).toBe(true);
  });

  it('should handle login failure with invalid credentials', async () => {
    // Mock failed Keycloak response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({
        error: 'invalid_grant',
        error_description: 'Invalid user credentials'
      })
    }) as any;

    await expect(
      DirectGrantAuth.login('test@example.com', 'wrongpassword', 'customers')
    ).rejects.toThrow('Invalid Keycloak configuration');

    // Verify no tokens were stored
    expect(DirectGrantAuth.getToken()).toBeNull();
    expect(DirectGrantAuth.isAuthenticated()).toBe(false);
  });

  it('should handle TOTP requirement', async () => {
    // Mock TOTP required response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: 'invalid_grant',
        error_description: 'Invalid TOTP code'
      })
    }) as any;

    await expect(
      DirectGrantAuth.login('test@example.com', 'password123', 'customers')
    ).rejects.toThrow('Invalid Keycloak configuration');
  });

  it('should handle successful registration', async () => {
    // Mock CSRF token response
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'mock-csrf-token' })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }));

    await expect(
      DirectGrantAuth.register(
        'test@example.com',
        'password123',
        'Test Company',
        'Test',
        'User',
        'customers'
      )
    ).resolves.toEqual({ success: true });
  });

  it('should handle registration failure', async () => {
    // Mock CSRF token response
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'mock-csrf-token' })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Email already exists' })
      }));

    await expect(
      DirectGrantAuth.register(
        'existing@example.com',
        'password123',
        'Test Company',
        'Test',
        'User',
        'customers'
      )
    ).rejects.toThrow();
  });

  it('should handle logout', async () => {
    // Set up authenticated state
    DirectGrantAuth['accessToken'] = 'mock-access-token';
    DirectGrantAuth['refreshToken'] = 'mock-refresh-token';
    DirectGrantAuth['userInfo'] = {
      sub: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customers',
      authType: 'customers'
    } as any;

    // Mock logout response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true
    }) as any;

    expect(DirectGrantAuth.isAuthenticated()).toBe(true);
    
    await DirectGrantAuth.logout();
    
    expect(DirectGrantAuth.isAuthenticated()).toBe(false);
    expect(DirectGrantAuth.getToken()).toBeNull();
    expect(DirectGrantAuth.getUserInfo()).toBeNull();
  });

  it('should validate token correctly', () => {
    // Create a valid JWT token (this is a mock, not a real JWT)
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
    const validToken = `header.${btoa(JSON.stringify({ exp: futureExp }))}.signature`;
    
    DirectGrantAuth['accessToken'] = validToken;
    expect(DirectGrantAuth.isAuthenticated()).toBe(true);
  });

  it('should invalidate expired token', () => {
    // Create an expired JWT token
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour in the past
    const expiredToken = `header.${btoa(JSON.stringify({ exp: pastExp }))}.signature`;
    
    DirectGrantAuth['accessToken'] = expiredToken;
    expect(DirectGrantAuth.isAuthenticated()).toBe(false);
  });
});