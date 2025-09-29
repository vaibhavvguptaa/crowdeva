import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OptimizedAuth } from '@/lib/optimizedAuth';
import { DirectGrantAuth } from '@/services/keycloak';

// Mock DirectGrantAuth
vi.mock('@/services/keycloak', () => ({
  DirectGrantAuth: {
    login: vi.fn(),
    refresh: vi.fn(),
    getToken: vi.fn()
  }
}));

describe('OptimizedAuth Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    OptimizedAuth['tokenCache'].clear();
    OptimizedAuth['refreshPromises'].clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should validate form correctly', () => {
    // Valid form
    expect(OptimizedAuth.validateForm('test@example.com', 'password123')).toBe(true);
    
    // Invalid email
    expect(OptimizedAuth.validateForm('invalid-email', 'password123')).toBe(false);
    expect(OptimizedAuth.validateForm('', 'password123')).toBe(false);
    
    // Invalid password
    expect(OptimizedAuth.validateForm('test@example.com', '123')).toBe(false);
    expect(OptimizedAuth.validateForm('test@example.com', '')).toBe(false);
  });

  it('should perform fast login successfully', async () => {
    const mockTokens = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 300
    };

    (DirectGrantAuth.login as any).mockResolvedValue(mockTokens);

    const result = await OptimizedAuth.fastLogin('test@example.com', 'password123', 'customers');
    
    expect(result).toEqual(mockTokens);
    expect(DirectGrantAuth.login).toHaveBeenCalledWith('test@example.com', 'password123', 'customers', undefined);
  });

  it('should use cached token when available', async () => {
    // Set up cache with valid token
    const cacheKey = 'test@example.com-customers';
    const futureExpiry = Date.now() + 60000; // 1 minute in the future
    OptimizedAuth['tokenCache'].set(cacheKey, {
      token: 'cached-access-token',
      expiry: futureExpiry
    });

    const result = await OptimizedAuth.fastLogin('test@example.com', 'password123', 'customers');
    
    expect(result).toEqual({ access_token: 'cached-access-token', cached: true });
    // Should not call DirectGrantAuth.login when using cache
    expect(DirectGrantAuth.login).not.toHaveBeenCalled();
  });

  it('should not use expired cached token', async () => {
    const mockTokens = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 300
    };

    // Set up cache with expired token
    const cacheKey = 'test@example.com-customers';
    const pastExpiry = Date.now() - 60000; // 1 minute in the past
    OptimizedAuth['tokenCache'].set(cacheKey, {
      token: 'expired-access-token',
      expiry: pastExpiry
    });

    (DirectGrantAuth.login as any).mockResolvedValue(mockTokens);

    const result = await OptimizedAuth.fastLogin('test@example.com', 'password123', 'customers');
    
    expect(result).toEqual(mockTokens);
    expect(DirectGrantAuth.login).toHaveBeenCalledWith('test@example.com', 'password123', 'customers', undefined);
  });

  it('should handle login failure', async () => {
    (DirectGrantAuth.login as any).mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      OptimizedAuth.fastLogin('test@example.com', 'wrongpassword', 'customers')
    ).rejects.toThrow('Invalid credentials');
    
    // Cache should be cleared after failure
    const cacheKey = 'test@example.com-customers';
    expect(OptimizedAuth['tokenCache'].has(cacheKey)).toBe(false);
  });

  it('should perform optimized refresh', async () => {
    const mockTokens = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token'
    };

    (DirectGrantAuth.refresh as any).mockResolvedValue(mockTokens);

    const result = await OptimizedAuth.optimizedRefresh('customers');
    
    expect(result).toEqual(mockTokens);
    expect(DirectGrantAuth.refresh).toHaveBeenCalledWith('customers');
  });

  it('should deduplicate refresh requests', async () => {
    const mockTokens = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token'
    };

    (DirectGrantAuth.refresh as any).mockResolvedValue(mockTokens);

    // Call refresh multiple times simultaneously
    const promises = [
      OptimizedAuth.optimizedRefresh('customers'),
      OptimizedAuth.optimizedRefresh('customers'),
      OptimizedAuth.optimizedRefresh('customers')
    ];

    const results = await Promise.all(promises);
    
    // All should return the same result
    expect(results).toEqual([mockTokens, mockTokens, mockTokens]);
    // But DirectGrantAuth.refresh should only be called once
    expect(DirectGrantAuth.refresh).toHaveBeenCalledTimes(1);
  });

  it('should clear cache', () => {
    // Add items to cache
    OptimizedAuth['tokenCache'].set('key1', { token: 'token1', expiry: Date.now() + 10000 });
    OptimizedAuth['refreshPromises'].set('key1', Promise.resolve());
    
    expect(OptimizedAuth['tokenCache'].size).toBe(1);
    expect(OptimizedAuth['refreshPromises'].size).toBe(1);
    
    OptimizedAuth.clearCache();
    
    expect(OptimizedAuth['tokenCache'].size).toBe(0);
    expect(OptimizedAuth['refreshPromises'].size).toBe(0);
  });

  it('should perform quick auth check with valid token', async () => {
    // Create a valid JWT token (mock)
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
    const validToken = `header.${btoa(JSON.stringify({ exp: futureExp }))}.signature`;
    
    (DirectGrantAuth.getToken as any).mockReturnValue(validToken);

    const result = await OptimizedAuth.quickAuthCheck();
    
    expect(result).toBe(true);
  });

  it('should perform quick auth check with invalid token', async () => {
    // Create an expired JWT token (mock)
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour in the past
    const expiredToken = `header.${btoa(JSON.stringify({ exp: pastExp }))}.signature`;
    
    (DirectGrantAuth.getToken as any).mockReturnValue(expiredToken);

    const result = await OptimizedAuth.quickAuthCheck();
    
    expect(result).toBe(false);
  });

  it('should perform quick auth check with no token', async () => {
    (DirectGrantAuth.getToken as any).mockReturnValue(null);

    const result = await OptimizedAuth.quickAuthCheck();
    
    expect(result).toBe(false);
  });
});