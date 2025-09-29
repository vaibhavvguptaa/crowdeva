// Utility for building secure OAuth / OIDC authorization URLs
// Centralizes parameter encoding, optional PKCE (placeholder), and validation.

interface OAuthAuthUrlParams {
  baseUrl: string; // Keycloak base URL (no trailing slash)
  realm: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
  responseType?: string; // default 'code'
  prompt?: string;
  kcIdpHint?: string;
  stateGenerator?: () => string; // function to produce state
  extraParams?: Record<string, string | undefined | null>;
}

export interface BuiltOAuthUrl {
  url: string;
  state?: string;
}

const DEFAULT_SCOPE = 'openid';
const DEFAULT_RESPONSE_TYPE = 'code';

const isHttps = (url: string) => /^https:\/\//i.test(url);

// Pre-compute regex for better performance
const HTTPS_REGEX = /^https:\/\//i;

export function buildOAuthAuthorizationUrl(params: OAuthAuthUrlParams): BuiltOAuthUrl {
  const {
    baseUrl,
    realm,
    clientId,
    redirectUri,
    scope = DEFAULT_SCOPE,
    responseType = DEFAULT_RESPONSE_TYPE,
    prompt,
    kcIdpHint,
    stateGenerator,
    extraParams = {}
  } = params;

  // Validate required parameters
  if (!baseUrl || !realm || !clientId || !redirectUri) {
    throw new Error(`Missing required OAuth parameters: ${[
      !baseUrl ? 'baseUrl' : '',
      !realm ? 'realm' : '',
      !clientId ? 'clientId' : '',
      !redirectUri ? 'redirectUri' : ''
    ].filter(Boolean).join(', ')}`);
  }

  // Validate URL format
  try {
    new URL(redirectUri);
  } catch {
    throw new Error('Invalid redirect URI format');
  }

  // Basic validation - optimized order
  if (!HTTPS_REGEX.test(baseUrl) && process.env.NODE_ENV === 'production') {
    throw new Error('OAuth baseUrl must be HTTPS in production.');
  }

  if (typeof window !== 'undefined') {
    if (!redirectUri.startsWith(window.location.origin)) {
      throw new Error('Redirect URI must share the same origin.');
    }
  }

  // Generate state (CSRF protection) - stored in sessionStorage
  const state = stateGenerator ? stateGenerator() : randomState();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('oauth_state', state);
    } catch (storageError) {
      console.warn('Failed to store OAuth state in sessionStorage:', storageError);
      // Continue anyway but log the error
    }
  }

  // Use URL constructor more efficiently
  const realmEncoded = encodeURIComponent(realm);
  const authEndpoint = new URL(`/realms/${realmEncoded}/protocol/openid-connect/auth`, baseUrl.replace(/\/$/, ''));
  const sp = authEndpoint.searchParams;
  
  // Set parameters in batch for better performance
  sp.set('client_id', clientId);
  sp.set('redirect_uri', redirectUri);
  sp.set('response_type', responseType);
  sp.set('scope', scope);
  sp.set('state', state);
  
  // Add optional parameters only if they exist
  if (prompt) sp.set('prompt', prompt);
  if (kcIdpHint) sp.set('kc_idp_hint', kcIdpHint);

  // Add extra parameters efficiently
  for (const [k, v] of Object.entries(extraParams)) {
    if (typeof v === 'string' && v.trim() !== '') {
      sp.set(k, v);
    }
  }

  return { url: authEndpoint.toString(), state };
}

// Optimize random state generation
function randomState(): string {
  // Use crypto.getRandomValues when available for better performance and security
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(32); // Increased to 32 bytes for better security
    window.crypto.getRandomValues(arr);
    // Use more efficient conversion to hex
    return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for environments without crypto (less secure)
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + 
         Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}