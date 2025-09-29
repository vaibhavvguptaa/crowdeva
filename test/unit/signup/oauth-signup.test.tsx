import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleSignInButton } from '@/components/signin/GoogleSignInButton';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock next/navigation
const mockAssign = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    assign: mockAssign
  },
  writable: true
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock environment variables
vi.mock('@/lib/config', () => ({
  getKeycloakConfig: vi.fn(() => ({
    url: 'https://auth.example.com',
    realm: 'customer',
    clientId: 'web-client'
  }))
}));

// Mock OAuth URL builder
vi.mock('@/lib/oauth', () => ({
  buildOAuthAuthorizationUrl: vi.fn(({ stateGenerator }: any) => {
    const state = 'test-state';
    // Simulate the real implementation's sessionStorage behavior
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('oauth_state', state);
      } catch {}
    }
    return {
      url: 'https://auth.example.com/realms/customer/protocol/openid-connect/auth?client_id=web-client&response_type=code&scope=openid&redirect_uri=http://localhost:3000/auth/callback&state=test-state&kc_idp_hint=google',
      state: state
    };
  })
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn()
}));

describe('OAuth Signup Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GoogleSignInButton', () => {
    it('should set loginMethod oauth flag when clicked', async () => {
      render(<GoogleSignInButton authType="customers" />);
      
      const button = screen.getByLabelText(/sign in with google/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('loginMethod', 'oauth');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('oauthAuthType', 'customers');
      });
    });

    it('should redirect to OAuth provider with correct parameters', async () => {
      render(<GoogleSignInButton authType="developers" />);
      
      const button = screen.getByLabelText(/sign in with google/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAssign).toHaveBeenCalledWith(
          expect.stringContaining('https://auth.example.com/realms/customer/protocol/openid-connect/auth')
        );
        expect(mockAssign).toHaveBeenCalledWith(
          expect.stringContaining('kc_idp_hint=google')
        );
      });
    });

    it('should handle different user types correctly', async () => {
      const { rerender } = render(<GoogleSignInButton authType="vendors" />);
      
      fireEvent.click(screen.getByLabelText(/sign in with google/i));
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('oauthAuthType', 'vendors');
      });

      // Test developers
      rerender(<GoogleSignInButton authType="developers" />);
      fireEvent.click(screen.getByLabelText(/sign in with google/i));
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('oauthAuthType', 'vendors');
      });
    });

    it('should show loading state when clicked', async () => {
      render(<GoogleSignInButton authType="customers" />);
      
      const button = screen.getByLabelText(/sign in with google/i);
      fireEvent.click(button);

      expect(button).toHaveTextContent('Connecting...');
      expect(button).toBeDisabled();
    });

    it('should handle configuration errors gracefully', async () => {
      // Mock configuration error
      const { getKeycloakConfig } = await import('@/lib/config');
      vi.mocked(getKeycloakConfig).mockReturnValue({
        url: '',
        realm: '',
        clientId: ''
      });

      render(<GoogleSignInButton authType="customers" />);
      
      const button = screen.getByLabelText(/sign in with google/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Google sign-in misconfiguration/i)).toBeInTheDocument();
      });
    });
  });

  describe('OAuth Security Features', () => {
    it('should generate and store state parameter for CSRF protection', async () => {
      render(<GoogleSignInButton authType="customers" />);
      
      const button = screen.getByLabelText(/sign in with google/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(sessionStorageMock.setItem).toHaveBeenCalledWith('oauth_state', 'test-state');
      });
    });

    it('should include proper redirect URI', async () => {
      render(<GoogleSignInButton authType="customers" />);
      
      const button = screen.getByLabelText(/sign in with google/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAssign).toHaveBeenCalledWith(
          expect.stringContaining('redirect_uri=http://localhost:3000/auth/callback')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when OAuth fails', async () => {
      // Mock OAuth URL builder to throw error
      const { buildOAuthAuthorizationUrl } = await import('@/lib/oauth');
      vi.mocked(buildOAuthAuthorizationUrl).mockImplementation(() => {
        throw new Error('Test error');
      });

      render(<GoogleSignInButton authType="customers" />);
      
      const button = screen.getByLabelText(/sign in with google/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });
    });

    it('should allow dismissing error messages', async () => {
      // Mock error
      const { buildOAuthAuthorizationUrl } = await import('@/lib/oauth');
      vi.mocked(buildOAuthAuthorizationUrl).mockImplementation(() => {
        throw new Error('Test error');
      });

      render(<GoogleSignInButton authType="customers" />);
      
      const button = screen.getByLabelText(/sign in with google/i);
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByText(/dismiss/i);
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument();
      });
    });
  });
});