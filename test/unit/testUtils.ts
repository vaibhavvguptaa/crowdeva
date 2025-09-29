import { NextRequest } from 'next/server';
import { vi } from 'vitest';

/**
 * Create a mock NextRequest with common properties
 */
export function createMockRequest(overrides: any = {}): NextRequest {
  return {
    cookies: {
      get: vi.fn().mockImplementation((name: string) => {
        if (overrides.cookies && overrides.cookies[name]) {
          return { name, value: overrides.cookies[name] };
        }
        return undefined;
      }),
      getAll: vi.fn().mockReturnValue(
        overrides.cookies 
          ? Object.entries(overrides.cookies).map(([name, value]) => ({ name, value }))
          : []
      )
    },
    headers: {
      get: vi.fn().mockImplementation((name: string) => {
        if (overrides.headers && overrides.headers[name]) {
          return overrides.headers[name];
        }
        return null;
      }),
      set: vi.fn(),
      append: vi.fn(),
      entries: vi.fn().mockReturnValue(Object.entries(overrides.headers || {}))
    },
    json: vi.fn().mockResolvedValue(overrides.body || {}),
    url: overrides.url || 'http://localhost:3000',
    method: overrides.method || 'GET'
  } as unknown as NextRequest;
}

/**
 * Create a mock session for testing
 */
export function createMockSession(overrides: any = {}) {
  return {
    refreshToken: 'test-refresh-token',
    authType: 'customers',
    userId: 'test-user-id',
    ...overrides
  };
}

/**
 * Create a mock Keycloak token response
 */
export function createMockTokenResponse(overrides: any = {}) {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 300,
    token_type: 'Bearer',
    ...overrides
  };
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides: any = {}) {
  return {
    sub: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    authType: 'customers',
    ...overrides
  };
}

/**
 * Create a mock NextResponse
 */
export function createMockNextResponse() {
  const mockJson = vi.fn();
  const mockResponse = {
    json: mockJson,
    headers: {
      set: vi.fn(),
      append: vi.fn(),
      get: vi.fn().mockReturnValue(null)
    },
    status: 200
  };

  return {
    mockJson,
    mockResponse,
    createResponse: vi.fn().mockImplementation((data, options) => {
      mockJson(data, options);
      return {
        ...mockResponse,
        status: options?.status || 200,
        json: async () => data
      };
    })
  };
}

/**
 * Mock fetch with a successful response
 */
export function mockFetchSuccess(data: any) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data))
  });
}

/**
 * Mock fetch with an error response
 */
export function mockFetchError(status: number, errorData: any) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: vi.fn().mockResolvedValue(errorData),
    text: vi.fn().mockResolvedValue(JSON.stringify(errorData))
  });
}

/**
 * Mock Keycloak configuration
 */
export function mockKeycloakConfig(overrides: any = {}) {
  return {
    url: 'http://localhost:8080',
    realm: 'Customer',
    clientId: 'customer-web',
    ...overrides
  };
}