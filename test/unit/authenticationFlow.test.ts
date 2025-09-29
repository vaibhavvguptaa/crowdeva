import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DirectGrantAuth } from '@/services/keycloak';

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Clear any stored tokens
    DirectGrantAuth['accessToken'] = null;
    DirectGrantAuth['refreshToken'] = null;
    DirectGrantAuth['userInfo'] = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('should return null when no token is present', () => {
    DirectGrantAuth['accessToken'] = null;
    expect(DirectGrantAuth.isAuthenticated()).toBe(false);
    expect(DirectGrantAuth.getToken()).toBeNull();
  });

  it('should handle logout correctly', async () => {
    // Create a valid JWT token
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
    const validToken = `header.${btoa(JSON.stringify({ exp: futureExp, sub: 'test-user' }))}.signature`;
    
    // Set up authenticated state with a valid token
    DirectGrantAuth['accessToken'] = validToken;
    DirectGrantAuth['refreshToken'] = 'mock-refresh-token';
    DirectGrantAuth['userInfo'] = {
      sub: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customers',
      authType: 'customers'
    } as any;

    // Verify we're authenticated first
    expect(DirectGrantAuth.isAuthenticated()).toBe(true);
    
    // Mock fetch for logout endpoint
    global.fetch = vi.fn().mockResolvedValue({
      ok: true
    }) as any;

    await DirectGrantAuth.logout();
    
    expect(DirectGrantAuth.isAuthenticated()).toBe(false);
    expect(DirectGrantAuth.getToken()).toBeNull();
    expect(DirectGrantAuth.getUserInfo()).toBeNull();
  });
});