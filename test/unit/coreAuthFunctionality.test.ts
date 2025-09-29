import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DirectGrantAuth } from '@/services/keycloak';
import { OptimizedAuth } from '@/lib/optimizedAuth';

describe('Core Authentication Functionality Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Clear any stored tokens
    DirectGrantAuth['accessToken'] = null;
    DirectGrantAuth['refreshToken'] = null;
    DirectGrantAuth['userInfo'] = null;
    
    // Clear caches
    OptimizedAuth['tokenCache'].clear();
    OptimizedAuth['refreshPromises'].clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should validate form inputs correctly', () => {
    // Valid inputs
    expect(OptimizedAuth.validateForm('test@example.com', 'password123')).toBe(true);
    
    // Invalid email
    expect(OptimizedAuth.validateForm('invalid-email', 'password123')).toBe(false);
    expect(OptimizedAuth.validateForm('', 'password123')).toBe(false);
    
    // Invalid password
    expect(OptimizedAuth.validateForm('test@example.com', '123')).toBe(false);
    expect(OptimizedAuth.validateForm('test@example.com', '')).toBe(false);
  });

  it('should handle token validation correctly', () => {
    // Create a valid JWT token
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
    const validToken = `header.${btoa(JSON.stringify({ exp: futureExp, sub: 'test-user' }))}.signature`;
    
    DirectGrantAuth['accessToken'] = validToken;
    expect(DirectGrantAuth.isAuthenticated()).toBe(true);
    expect(DirectGrantAuth.getToken()).toBe(validToken);
  });

  it('should invalidate expired tokens', () => {
    // Create an expired JWT token
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour in the past
    const expiredToken = `header.${btoa(JSON.stringify({ exp: pastExp }))}.signature`;
    
    DirectGrantAuth['accessToken'] = expiredToken;
    expect(DirectGrantAuth.isAuthenticated()).toBe(false);
    // Token should be cleared
    expect(DirectGrantAuth['accessToken']).toBeNull();
  });

  it('should handle logout correctly', async () => {
    // Create a valid JWT token
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
    const validToken = `header.${btoa(JSON.stringify({ exp: futureExp, sub: 'test-user' }))}.signature`;
    
    // Set up authenticated state
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

  it('should clear optimization caches on logout', () => {
    // Add items to cache
    OptimizedAuth['tokenCache'].set('key1', { token: 'token1', expiry: Date.now() + 10000 });
    OptimizedAuth['refreshPromises'].set('key1', Promise.resolve());
    
    expect(OptimizedAuth['tokenCache'].size).toBe(1);
    expect(OptimizedAuth['refreshPromises'].size).toBe(1);
    
    OptimizedAuth.clearCache();
    
    expect(OptimizedAuth['tokenCache'].size).toBe(0);
    expect(OptimizedAuth['refreshPromises'].size).toBe(0);
  });

  it('should perform quick auth check', async () => {
    // With no token
    expect(await OptimizedAuth.quickAuthCheck()).toBe(false);
    
    // With valid token
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
    const validToken = `header.${btoa(JSON.stringify({ exp: futureExp }))}.signature`;
    DirectGrantAuth['accessToken'] = validToken;
    
    expect(await OptimizedAuth.quickAuthCheck()).toBe(true);
    
    // With expired token
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour in the past
    const expiredToken = `header.${btoa(JSON.stringify({ exp: pastExp }))}.signature`;
    DirectGrantAuth['accessToken'] = expiredToken;
    
    expect(await OptimizedAuth.quickAuthCheck()).toBe(false);
  });
});