import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';

// Mock the useRouter hook from next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
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

// Create a test component that uses the auth context
const TestComponent = () => {
  const { isAuthenticated, user, loading, error, login, logout, register } = useAuthContext();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not authenticated'}</div>
      <div data-testid="loading">{loading ? 'loading' : 'not loading'}</div>
      <div data-testid="error">{error || 'no error'}</div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <button data-testid="login-btn" onClick={() => login('test@example.com', 'password', 'customers')}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext Component Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock global objects
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
    Object.defineProperty(global, 'window', { 
      value: { 
        location: { origin: 'http://localhost:3000' },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      } 
    });
    Object.defineProperty(global, 'document', { value: { cookie: '' } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide initial auth state', async () => {
    const TestWrapper = () => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const { getByTestId } = render(<TestWrapper />);
    
    // Initially should be loading
    expect(getByTestId('loading').textContent).toBe('loading');
    
    // After loading completes, should show not authenticated
    await waitFor(() => {
      expect(getByTestId('auth-status').textContent).toBe('not authenticated');
    });
    
    expect(getByTestId('user').textContent).toBe('no user');
    expect(getByTestId('error').textContent).toBe('no error');
  });

  it('should handle login function', async () => {
    const TestWrapper = () => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const { getByTestId } = render(<TestWrapper />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(getByTestId('auth-status').textContent).toBe('not authenticated');
    });
    
    // Click login button
    await act(async () => {
      getByTestId('login-btn').click();
    });
    
    // Should still be not authenticated (since we're mocking the login)
    expect(getByTestId('auth-status').textContent).toBe('not authenticated');
  });

  it('should handle logout function', async () => {
    const TestWrapper = () => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const { getByTestId } = render(<TestWrapper />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(getByTestId('auth-status').textContent).toBe('not authenticated');
    });
    
    // Click logout button
    await act(async () => {
      getByTestId('logout-btn').click();
    });
    
    // Should still be not authenticated
    expect(getByTestId('auth-status').textContent).toBe('not authenticated');
  });
});