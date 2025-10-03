import Keycloak from "keycloak-js";
import { AuthenticationError } from "@/lib/errors";
import { getKeycloakConfig } from '@/lib/config';
import { logError, logWarn, logAuthSuccess, logAuthFailure, logSecurityEvent } from '@/lib/logger';
import { 
  AuthUserType, 
  AuthUser, 
  TokenResponse, 
  AuthError,
  LoginCredentials,
  RegistrationData 
} from '@/types/auth';
import { AuthErrorHandler } from '@/lib/authErrorHandler';

// Create keycloak instance but don't initialize it for SSO
let keycloak: Keycloak | null = null;
try {
  const config = getKeycloakConfig();
  // Only initialize keycloak if all required config values are present
  if (config && config.url && config.realm && config.clientId) {
    keycloak = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId
    });
  }
} catch (error) {
  // Keycloak will remain null, which is handled in the application
}

export class DirectGrantAuth {
  // Access token kept only in memory to reduce XSS persistence risk.
  private static accessToken: string | null = null;
  // Refresh token will NOT be stored in web storage; rely on server session or short-lived access tokens.
  private static refreshToken: string | null = null;
  private static userInfo: AuthUser | null = null;
  private static refreshPromise: Promise<TokenResponse | null> | null = null;
  private static refreshAttempts = 0;
  private static readonly MAX_REFRESH_ATTEMPTS = 3;

  static {
    // Only load tokens if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.loadTokensFromStorage();
    }
  }

  private static getAuthTypeFromStorage(): AuthUserType | undefined {
    if (typeof window !== 'undefined') {
      // Try to get authType from localStorage first (for backward compatibility)
      let authType = localStorage.getItem('authType') as AuthUserType | undefined;
      return authType;
    }
    return undefined;
  }

  private static async fetchAndSetUserInfo(): Promise<void> {
    if (!this.accessToken) {
      this.userInfo = null;
      return;
    }

    let authType = this.getAuthTypeFromStorage();
    if (!authType) {
      // If we can't get authType from storage, try to determine it from the token payload
      try {
        const tokenPayload = this.parseTokenPayload(this.accessToken);
        // Try to infer authType from the issuer or audience
        if (tokenPayload && tokenPayload.iss) {
          const issuer = tokenPayload.iss.toLowerCase();
          if (issuer.includes('developer') || issuer.includes('dev')) {
            authType = 'developers';
          } else if (issuer.includes('vendor')) {
            authType = 'vendors';
          } else {
            authType = 'customers';
          }
        } else if (tokenPayload && tokenPayload.aud) {
          const audience = tokenPayload.aud.toLowerCase();
          if (audience.includes('developer') || audience.includes('dev')) {
            authType = 'developers';
          } else if (audience.includes('vendor')) {
            authType = 'vendors';
          } else {
            authType = 'customers';
          }
        } else {
          // Default to customers if we can't determine
          authType = 'customers';
        }
      } catch (error) {
        authType = 'customers';
      }
    }

    try {
      const config = getKeycloakConfig(authType);
      if (!config || !config.url || !config.realm) {
        const tokenPayload = this.parseTokenPayload(this.accessToken);
        this.userInfo = this.createUserFromPayload(tokenPayload, authType);
        return;
      }
      
      const userInfoUrl = `${config.url}/realms/${config.realm}/protocol/openid-connect/userinfo`;

      const response = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Reduced timeout
        signal: AbortSignal.timeout(5000),
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        const tokenPayload = this.parseTokenPayload(this.accessToken);
        this.userInfo = this.createUserFromPayload(tokenPayload, authType);
        return;
      }

      const fullUserInfo = await response.json().catch(() => ({}));
      const tokenPayload = this.parseTokenPayload(this.accessToken);
      this.userInfo = this.createUserFromPayload({ ...tokenPayload, ...fullUserInfo }, authType);

    } catch (error) {
      const config = getKeycloakConfig(authType);
      
      // Check if this is a network connectivity error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        logSecurityEvent('Keycloak server unreachable - using token fallback', {
          keycloakUrl: config && config.url,
          realm: config && config.realm,
          error: error.message
        });
      }
      
      // Always fall back to token payload instead of failing
      try {
        const tokenPayload = this.parseTokenPayload(this.accessToken);
        this.userInfo = this.createUserFromPayload(tokenPayload, authType);
      } catch (tokenError) {
        this.userInfo = null;
      }
    }
  }

  private static parseTokenPayload(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      return {};
    }
  }

  private static createUserFromPayload(payload: any, authType: AuthUserType): AuthUser {
    // Ensure payload is valid
    if (!payload) {
      payload = {};
    }
    
    const user: AuthUser = {
      sub: payload.sub || '',
      email: payload.email || '',
      name: payload.name || payload.given_name || payload.preferred_username || '',
      given_name: payload.given_name || null,
      family_name: payload.family_name || null,
      preferred_username: payload.preferred_username || null,
      role: authType,
      authType: authType,
      exp: payload.exp || null,
      iat: payload.iat || null,
      iss: payload.iss || null,
      aud: payload.aud || null,
      companyName: payload.companyName || null,
      firstName: payload.firstName || payload.given_name || null,
      lastName: payload.lastName || payload.family_name || null,
    };
    return user;
  }

  private static async loadTokensFromStorage(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Try to get authType first
      let authType = this.getAuthTypeFromStorage();
      
      // If we don't have authType, try to infer it or default to customers
      if (!authType) {
        authType = 'customers'; // Default to customers
      }
      
      // Try to refresh the token to validate the session
      try {
        const tokens = await this.refresh(authType).catch(() => null);
        if (tokens) {
          this.accessToken = tokens.access_token;
          await this.fetchAndSetUserInfo().catch(() => {
            // Ignore error
          });
          return;
        }
      } catch (error) {
        // Ignore error
      }
      
      // If refresh fails, this is normal for initial visits (no session yet)
      this.accessToken = null;
      
      // refresh token intentionally not reloaded from storage anymore
      // In the session-based approach, refresh tokens are stored server-side in HttpOnly cookies
      this.refreshToken = null;
      
      // Only fetch user info if we have a valid token and we're not in SSR
      if (this.accessToken && this.isTokenValid(this.accessToken)) {
        try {
          await this.fetchAndSetUserInfo();
        } catch (error) {
          // If fetching user info fails, clear invalid tokens
          this.logout();
        }
      } else if (this.accessToken) {
        // Token exists but is invalid, clear it
        this.logout();
      }
    }
  }

  private static isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp * 1000 > Date.now();
      return isValid;
    } catch (error) {
      return false;
    }
  }

  static async login(username: string, password: string, authType: AuthUserType, otp?: string): Promise<TokenResponse> {
    const config = getKeycloakConfig(authType);
    if (!config || !config.url || !config.realm || !config.clientId) {
      throw new AuthenticationError('Invalid Keycloak configuration');
    }
    
    const tokenUrl = `${config.url}/realms/${config.realm}/protocol/openid-connect/token`;

    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', config.clientId);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('scope', 'openid profile email offline_access');
    // If OTP provided include it; otherwise try first without and caller can react to required TOTP error
    if (otp) formData.append('totp', otp);

    try {
      // Add AbortSignal for better timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        signal: controller.signal // Add timeout signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const authError = responseData as AuthError;
        const human = this.getHumanReadableError(authError.error, authError.error_description);
        // Detect TOTP requirement (Keycloak often returns invalid_grant with hint)
        const lowerDesc = authError.error_description?.toLowerCase() || '';
        if (!otp && response.status === 400 && lowerDesc.includes('totp') && (lowerDesc.includes('required') || lowerDesc.includes('missing'))) {
          // Log TOTP requirement for security monitoring
          logSecurityEvent('totp_required', {
            username,
            authType,
            timestamp: new Date().toISOString()
          });
          throw new AuthenticationError('TOTP_REQUIRED');
        }
        // Detect invalid TOTP code
        if (otp && response.status === 401 && lowerDesc.includes('totp') && (lowerDesc.includes('invalid') || lowerDesc.includes('incorrect'))) {
          // Log invalid TOTP attempt for security monitoring
          logAuthFailure(username, 'invalid_totp', {
            authType,
            timestamp: new Date().toISOString()
          });
          throw new AuthenticationError('INVALID_TOTP');
        }
        logAuthFailure(username, authError.error || 'unknown_error', { authType, errorDescription: authError.error_description, responseStatus: response.status });
        
        // Use AuthErrorHandler for consistent error handling
        const errorState = AuthErrorHandler.handleError(
          new AuthenticationError(human),
          { service: 'DirectGrantAuth', action: 'login', authType, responseStatus: response.status }
        );
        throw new AuthenticationError(errorState.message);
      }

      const tokens: TokenResponse = responseData;
      
      // Store tokens only in memory, not in localStorage when using session-based approach
      this.accessToken = tokens.access_token || null;
      this.refreshToken = tokens.refresh_token || null; // kept only in memory
      this.refreshAttempts = 0; // Reset refresh attempts on successful login
      
      // Fetch and store user info
      await this.fetchAndSetUserInfo().catch(() => {
        // Ignore error
      });

      // Log successful authentication
      const userInfo = this.getUserInfo();
      if (userInfo) {
        logAuthSuccess(userInfo.sub, authType, {
          email: username,
          loginMethod: otp ? 'password_with_totp' : 'password',
          hasTotp: !!otp
        });
      }

      // Set the tokens as cookies via the API route
      // Extract user ID from the access token payload
      let userId: string | undefined;
      try {
        const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        // Ignore error
      }
      
      await this.setTokenCookie(tokens.access_token, tokens.refresh_token, authType, userId).catch(() => {
        // Ignore error
      });
      
      // Store authType in localStorage as well for client-side access
      if (typeof window !== 'undefined' && authType) {
        try {
          localStorage.setItem('authType', authType);
        } catch (e) {
          // Ignore error
        }
      }
      
      return tokens;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Network error occurred during login. Please try again.');
    }
  }

  private static getHumanReadableError(error: string, description?: string): string {
    const errorMap: Record<string, string> = {
      'invalid_grant': 'Invalid username or password. Please check your credentials and try again.',
      'invalid_client': 'Authentication service configuration error. Please contact support.',
      'unauthorized_client': 'This application is not authorized. Please contact support.',
      'invalid_request': 'Invalid request. Please check your input and try again.',
      'unsupported_grant_type': 'Authentication method not supported. Please contact support.',
      'invalid_scope': 'Invalid permissions requested. Please contact support.',
      'account_disabled': 'Your account has been disabled. Please contact support for assistance.',
      'account_locked': 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or contact support.',
      'invalid_user_credentials': 'Invalid credentials. Please check your credentials and try again.',
      'user_not_found': 'No account found with this email address. Please check your email or sign up for a new account.',
      'password_expired': 'Your password has expired. Please reset your password to continue.',
      'user_temporarily_disabled': 'Your account has been temporarily disabled. Please contact support.',
      'realm_not_found': 'Authentication service realm not found. Please contact support.',
      'client_not_found': 'Authentication client configuration error. Please contact support.',
    };

    // Check description for more specific errors
    if (description) {
      const lowerDesc = description.toLowerCase();
      if (lowerDesc.includes('totp') || lowerDesc.includes('otp')) {
        if (lowerDesc.includes('invalid') || lowerDesc.includes('incorrect')) {
          return 'Invalid or expired 2FA code. Please open your authenticator app and try again.';
        }
        if (lowerDesc.includes('required') || lowerDesc.includes('missing')) {
          return 'A two-factor authentication code is required. Please enter the 6-digit code from your authenticator app.';
        }
      }
      // Modified error message to be less specific about username/password
      if (lowerDesc.includes('invalid user credentials') || lowerDesc.includes('invalid username or password')) {
        return 'Invalid credentials. Please check your credentials and try again.';
      }
      if (lowerDesc.includes('account disabled') || lowerDesc.includes('user disabled')) {
        return 'Your account has been disabled. Please contact support for assistance.';
      }
      if (lowerDesc.includes('account locked') || lowerDesc.includes('user locked')) {
        return 'Your account has been temporarily locked. Please try again later or contact support.';
      }
      if (lowerDesc.includes('too many attempts') || lowerDesc.includes('rate limit')) {
        return 'Too many login attempts. Please wait a few minutes before trying again.';
      }
    }

    const result = errorMap[error] || description || 'Authentication failed. Please try again.';
    return result;
  }

  private static async setTokenCookie(token: string, refreshToken?: string, authType?: AuthUserType, userId?: string): Promise<void> {
    // Skip setting cookies in server environments as they're handled differently
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Get CSRF token first
      const csrfResponse = await fetch('/api/auth/csrf-token', { 
        credentials: 'include',
        mode: 'cors'
      });
      if (!csrfResponse.ok) {
        return;
      }
      const { csrfToken } = await csrfResponse.json().catch(() => ({ csrfToken: undefined }));

      // Use absolute URL to avoid "Failed to parse URL" error
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/auth/set-session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ 
          refresh_token: refreshToken, 
          authType, 
          userId 
        }),
        credentials: 'include',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to set session');
      }
      
      // Store authType in localStorage as a fallback
      if (authType) {
        try {
          localStorage.setItem('authType', authType);
        } catch (e) {
          // Ignore error
        }
      }
    } catch (error) {
      // Ignore error
    }
  }

  static async refresh(authType?: AuthUserType): Promise<TokenResponse | null> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const currentAuthType = authType || this.getAuthTypeFromStorage();
    
    if (!currentAuthType) {
      // Don't logout immediately, just return null to indicate no session
      return null;
    }

    this.refreshPromise = this.performRefresh(currentAuthType).catch(() => null);
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    // If refresh failed, try to get authType from user info as a fallback
    if (!result) {
      const userInfo = this.getUserInfo();
      if (userInfo && userInfo.authType) {
        return await this.performRefresh(userInfo.authType as AuthUserType).catch(() => null);
      }
    }
    
    return result;
  }

  private static async performRefresh(authType: AuthUserType): Promise<TokenResponse | null> {
    try {
      this.refreshAttempts++;
      
      // Add AbortSignal for better timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced timeout

      // Call our new refresh endpoint which uses HttpOnly cookies
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authType }),
        credentials: 'include', // Important: include cookies
        signal: controller.signal // Add timeout signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Special case: if it's a "no session" error during initial login, this might be expected
        if (response.status === 401 && (errorData.code === 'NO_SESSION_INITIAL_LOGIN' || errorData.code === 'NO_SESSION_NEW_VISITOR')) {
          // Don't logout in this case, just return null to indicate no session
          return null;
        }
        
        // If refresh fails with 401, logout the user
        if (response.status === 401) {
          // Check if it's a session expired error
          if (errorData.error === 'Session expired') {
            // Show appropriate message
          }
          this.logout();
        }
        return null;
      }

      const data = await response.json().catch(() => ({}));
      
      // Reset attempts on successful refresh
      this.refreshAttempts = 0;
      
      this.accessToken = data.token || null;
      
      // Update user info
      await this.fetchAndSetUserInfo().catch(() => {
        // Ignore error
      });

      // Return token response format
      return {
        access_token: data.token || '',
        token_type: 'Bearer',
        expires_in: 300, // This is just a placeholder, actual expiration is in the cookie
        refresh_token: '' // We don't expose the refresh token to the client
      };
    } catch (error) {
      // If we've exceeded max attempts, logout
      if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
        this.logout();
      }
      
      // Try to get user info from token if available
      if (this.accessToken) {
        try {
          await this.fetchAndSetUserInfo();
          return {
            access_token: this.accessToken,
            token_type: 'Bearer',
            expires_in: 300,
            refresh_token: ''
          };
        } catch (e) {
          // Ignore error
        }
      }
      
      // If we're in a browser environment, try to clear any invalid state
      if (typeof window !== 'undefined') {
        try {
          // Clear any potentially invalid localStorage items
          localStorage.removeItem('kc-token');
          localStorage.removeItem('authType');
          localStorage.removeItem('userData');
          localStorage.removeItem('userId');
        } catch (e) {
          // Ignore error
        }
      }
      
      return null;
    }
  }

  static getToken(): string | null {
    return this.accessToken;
  }

  static getUserInfo(): AuthUser | null {
    return this.userInfo;
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp * 1000 > Date.now();
      
      // If token is invalid, clear it
      if (!isValid) {
        this.accessToken = null;
        this.userInfo = null;
      }
      
      return isValid;
    } catch (error) {
      // If we can't parse the token, clear it
      this.accessToken = null;
      this.userInfo = null;
      return false;
    }
  }

  static async logout(): Promise<void> {
    try {
      // Clear server-side session first
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignore fetch errors
      });
    } catch (error) {
      // Continue with client-side cleanup even if server logout fails
    }

    // Clear client-side state
    this.accessToken = null;
    this.refreshToken = null;
    this.userInfo = null;
    this.refreshAttempts = 0;
    this.refreshPromise = null;
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('kc-token');
        localStorage.removeItem('authType');
        localStorage.removeItem('userData');
        localStorage.removeItem('userId');
      } catch (e) {
        // Ignore error
      }
      
      // Also clear cookies by setting them to expire in the past
      try {
        document.cookie = 'kc-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'authType=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      } catch (e) {
        // Ignore error
      }
    }
  }

  static async register(email: string, password: string, companyName: string | null, firstName: string, lastName: string, authType: AuthUserType): Promise<any> {
    // Always fetch a fresh CSRF token before state‑changing request (lightweight + ensures cookie/header pair)
    try {
      const csrfRes = await fetch('/api/auth/csrf-token', { 
        credentials: 'include',
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(3000)
      });
      if (!csrfRes.ok) {
        // Ignore error
      }
      const { csrfToken } = await csrfRes.json().catch(() => ({ csrfToken: undefined }));

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          companyName,
          firstName,
          lastName,
          group: authType,
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Registration failed');
      }

      return response.json().catch(() => ({}));
    } catch (e) {
      // Rethrow normalized error
      if (e instanceof Error) throw e;
      throw new Error('Registration failed');
    }
  }
}

export const initializeKeycloak = async (): Promise<boolean> => {
  if (DirectGrantAuth.isAuthenticated()) {
    return true;
  }
  const refreshed = await DirectGrantAuth.refresh();
  return !!refreshed;
};

// Export utility functions that use DirectGrantAuth
export const getToken = () => {
  return DirectGrantAuth.getToken();
};
export const getUserInfo = () => {
  return DirectGrantAuth.getUserInfo();
};
export const isAuthenticated = () => {
  return DirectGrantAuth.isAuthenticated();
};
export const logout = () => {
  return DirectGrantAuth.logout();
};
export const authenticateWithPassword = (username: string, password: string, authType: AuthUserType, otp?: string) => {
  return DirectGrantAuth.login(username, password, authType, otp);
};
export const register = (email: string, password: string, companyName: string | null, firstName: string, lastName: string, authType: AuthUserType) => {
  return DirectGrantAuth.register(email, password, companyName, firstName, lastName, authType);
};