import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createMockRequest, 
  createMockSession, 
  createMockTokenResponse, 
  createMockUser,
  createMockNextResponse,
  mockFetchSuccess,
  mockFetchError,
  mockKeycloakConfig
} from './testUtils';

// Mock modules that our utilities might need
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

vi.mock('@/lib/config', () => ({
  getKeycloakConfig: vi.fn()
}));

describe('Shared Test Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a mock request with default values', () => {
    const mockRequest = createMockRequest();
    
    expect(mockRequest.cookies).toBeDefined();
    expect(mockRequest.headers).toBeDefined();
    expect(mockRequest.json).toBeDefined();
  });

  it('should create a mock request with custom values', () => {
    const mockRequest = createMockRequest({
      cookies: { 'sid': 'test-session-id' },
      headers: { 'content-type': 'application/json' },
      body: { email: 'test@example.com' },
    });
    
    // Test cookie retrieval
    const sidCookie = mockRequest.cookies.get('sid');
    expect(sidCookie?.value).toBe('test-session-id');
    
    expect(mockRequest.headers.get('content-type')).toBe('application/json');
    // Note: body is not directly accessible in NextRequest, it's accessed via json() method
  });

  it('should create a mock session', () => {
    const mockSession = createMockSession();
    
    expect(mockSession).toBeDefined();
    expect(mockSession.refreshToken).toBeDefined();
    expect(mockSession.authType).toBeDefined();
  });

  it('should create a mock token response', () => {
    const mockResponse = createMockTokenResponse();
    
    expect(mockResponse).toBeDefined();
    expect(mockResponse.access_token).toBeDefined();
    expect(mockResponse.refresh_token).toBeDefined();
    expect(mockResponse.expires_in).toBeDefined();
  });

  it('should create a mock user', () => {
    const mockUser = createMockUser();
    
    expect(mockUser).toBeDefined();
    expect(mockUser.sub).toBeDefined();
    expect(mockUser.email).toBeDefined();
  });

  it('should mock a successful fetch response', async () => {
    const mockData = { success: true };
    global.fetch = mockFetchSuccess(mockData);
    
    const response = await fetch('http://example.com');
    const data = await response.json();
    
    expect(data).toEqual(mockData);
  });

  it('should mock a failed fetch response', async () => {
    global.fetch = mockFetchError(500, { error: 'Network error' });
    
    const response = await fetch('http://example.com');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  it('should mock Keycloak configuration', () => {
    const config = mockKeycloakConfig();
    
    expect(config).toBeDefined();
    expect(config.url).toBeDefined();
    expect(config.realm).toBeDefined();
    expect(config.clientId).toBeDefined();
  });
});