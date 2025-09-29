import { describe, it, expect } from 'vitest';
import { buildOAuthAuthorizationUrl } from '@/lib/oauth';

// Setup browser globals inside jsdom environment
function setupBrowserGlobals() {
  if (typeof window === 'undefined') return;
  try {
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com' },
      writable: true,
    });
  } catch {}
  const store: Record<string,string> = {};
  try {
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        setItem: (k: string, v: string) => { store[k] = v; },
        getItem: (k: string) => store[k],
        removeItem: (k: string) => { delete store[k]; }
      }
    });
  } catch {}
}

setupBrowserGlobals();

describe('buildOAuthAuthorizationUrl', () => {
  it('builds a valid URL with required params', () => {
    const { url, state } = buildOAuthAuthorizationUrl({
      baseUrl: 'https://auth.server',
      realm: 'customer',
      clientId: 'web',
      redirectUri: 'https://example.com/auth/callback',
      kcIdpHint: 'google'
    });
    const u = new URL(url);
    expect(u.origin).toBe('https://auth.server');
    expect(u.pathname).toContain('/realms/customer/protocol/openid-connect/auth');
    expect(u.searchParams.get('client_id')).toBe('web');
    expect(u.searchParams.get('redirect_uri')).toBe('https://example.com/auth/callback');
    expect(u.searchParams.get('response_type')).toBe('code');
    expect(u.searchParams.get('scope')).toBe('openid');
    expect(u.searchParams.get('kc_idp_hint')).toBe('google');
    expect(u.searchParams.get('state')).toBe(state);
    expect(state).toBeDefined();
  });

  it('requires https baseUrl when production (skipped if env not production)', () => {
    if (process.env.NODE_ENV !== 'production') {
      // In non-production we allow http in builder; just assert a https URL works
      const { url } = buildOAuthAuthorizationUrl({
        baseUrl: 'https://secure-host',
        realm: 'r',
        clientId: 'c',
        redirectUri: 'https://example.com/auth/callback'
      });
      expect(url.startsWith('https://secure-host')).toBe(true);
      return;
    }
    expect(() => buildOAuthAuthorizationUrl({
      baseUrl: 'http://insecure',
      realm: 'r',
      clientId: 'c',
      redirectUri: 'https://example.com/auth/callback'
    })).toThrow();
  });
});
