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
// TODO (Security): Remove storage of refresh token in localStorage; use httpOnly cookie session.
console.log('Initializing keycloak instance');
let keycloak: Keycloak | null = null;
try {
  const config = getKeycloakConfig();
  console.log('Keycloak config:', config);
  // Only initialize keycloak if all required config values are present
  if (config && config.url && config.realm && config.clientId) {
    console.log('Creating keycloak instance with config');
    keycloak = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId
    });
    console.log('Keycloak instance created successfully');
  } else {
    console.log('Keycloak config is incomplete');
  }
} catch (error) {
  console.warn('Failed to initialize Keycloak instance:', error);
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
    console.log('DirectGrantAuth static block initialized');
    // Only load tokens if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.loadTokensFromStorage();
    }
  }

  private static getAuthTypeFromStorage(): AuthUserType | undefined {
    console.log('Getting authType from storage');
    if (typeof window !== 'undefined') {
      console.log('Window object is available');
      // Try to get authType from localStorage first (for backward compatibility)
      let authType = localStorage.getItem('authType') as AuthUserType | undefined;
      console.log('AuthType from localStorage:', authType);
      
      // If not in localStorage, we can't access HttpOnly cookies from JavaScript
      // In this case, we'll need to determine the authType from other means
      // For now, we'll return what we have (or undefined if not found)
      
      return authType;
    } else {
      console.log('Window object is not available (SSR)');
    }
    console.log('Returning undefined authType');
    return undefined;
  }

  private static async fetchAndSetUserInfo(): Promise<void> {
    console.log('fetchAndSetUserInfo called with accessToken:', this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null');
    if (!this.accessToken) {
      console.log('No access token, setting userInfo to null');
      this.userInfo = null;
      return;
    }

    let authType = this.getAuthTypeFromStorage();
    console.log('Auth type from storage:', authType);
    if (!authType) {
      console.log('No auth type from storage, inferring from token');
      // If we can't get authType from storage, try to determine it from the token payload
      try {
        const tokenPayload = this.parseTokenPayload(this.accessToken);
        console.log('Token payload:', tokenPayload);
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
          console.warn('No auth type found in storage and unable to infer from token, defaulting to customers');
          authType = 'customers';
        }
        console.log('Inferred auth type:', authType);
      } catch (error) {
        console.warn('Failed to infer auth type from token, defaulting to customers:', error);
        authType = 'customers';
      }
    }

    try {
      const config = getKeycloakConfig(authType);
      console.log('Keycloak config for user info:', config);
      if (!config || !config.url || !config.realm) {
        console.warn('Invalid Keycloak configuration, falling back to token payload');
        const tokenPayload = this.parseTokenPayload(this.accessToken);
        this.userInfo = this.createUserFromPayload(tokenPayload, authType);
        console.log('Created user info from token payload:', this.userInfo);
        return;
      }
      
      const userInfoUrl = `${config.url}/realms/${config.realm}/protocol/openid-connect/userinfo`;
      
      // Log the URL for debugging (remove in production)
      console.log('Fetching user info from:', userInfoUrl);

      const response = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Add timeout and other fetch options
        signal: AbortSignal.timeout(10000), // 10 second timeout
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn(`Failed to fetch user info (${response.status}: ${response.statusText}), falling back to token payload.`);
        const tokenPayload = this.parseTokenPayload(this.accessToken);
        this.userInfo = this.createUserFromPayload(tokenPayload, authType);
        console.log('Created user info from token payload (fallback):', this.userInfo);
        return;
      }

      const fullUserInfo = await response.json().catch(() => ({}));
      console.log('Full user info from Keycloak:', fullUserInfo);
      const tokenPayload = this.parseTokenPayload(this.accessToken);
      this.userInfo = this.createUserFromPayload({ ...tokenPayload, ...fullUserInfo }, authType);
      console.log('Created user info from combined data:', this.userInfo);

    } catch (error) {
      const config = getKeycloakConfig(authType);
      
      // Check if this is a network connectivity error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Keycloak server appears to be unreachable, falling back to token payload');
        logSecurityEvent('Keycloak server unreachable - using token fallback', {
          keycloakUrl: config && config.url,
          realm: config && config.realm,
          error: error.message
        });
      } else {
        logError('Error fetching user info', error instanceof Error ? error : new Error(String(error)), {
          authType,
          hasToken: !!this.accessToken,
          userInfoUrl: config && config.url && config.realm 
            ? `${config.url}/realms/${config.realm}/protocol/openid-connect/userinfo`
            : 'Invalid config'
        });
      }
      
      // Always fall back to token payload instead of failing
      try {
        const tokenPayload = this.parseTokenPayload(this.accessToken);
        this.userInfo = this.createUserFromPayload(tokenPayload, authType);
        console.log('Successfully created user info from token payload');
      } catch (tokenError) {
        logError('Failed to parse token payload', tokenError instanceof Error ? tokenError : new Error(String(tokenError)));
        this.userInfo = null;
      }
    }
  }

  private static parseTokenPayload(token: string): any {
    console.log('parseTokenPayload called with token:', token ? `${token.substring(0, 20)}...` : 'null');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Parsed token payload:', payload);
      return payload;
    } catch (error) {
      console.error('Failed to parse token payload:', error);
      return {};
    }
  }

  private static createUserFromPayload(payload: any, authType: AuthUserType): AuthUser {
    console.log('createUserFromPayload called with:', { payload, authType });
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
    console.log('Created user:', user);
    return user;
  }

  private static async loadTokensFromStorage(): Promise<void> {
    console.log('=== LOADING TOKENS FROM STORAGE ===');
    
    if (typeof window !== 'undefined') {
      console.log('Window object is available, loading tokens');
      // In the session-based approach, we can't access HttpOnly cookies from JavaScript
      // Instead, we need to check if we have a valid session by making a request to the server
      try {
        // Try to get authType first
        let authType = this.getAuthTypeFromStorage();
        console.log('Auth type from storage:', authType);
        
        // If we don't have authType, try to infer it or default to customers
        if (!authType) {
          authType = 'customers'; // Default to customers
          console.log('Defaulting auth type to customers');
        }
        
        // Try to refresh the token to validate the session
        console.log('Attempting to refresh token with authType:', authType);
        const tokens = await this.refresh(authType).catch((error) => {
          console.warn('Token refresh failed:', error);
          return null;
        });
        console.log('Tokens from refresh during load:', tokens);
        if (tokens) {
          console.log('Token refresh successful during load');
          this.accessToken = tokens.access_token;
          await this.fetchAndSetUserInfo().catch(() => {
            console.warn('Failed to fetch user info after token refresh');
          });
          return;
        } else {
          console.log('Token refresh failed during load');
        }
      } catch (error) {
        console.warn('Failed to refresh token during load:', error);
      }
      
      // If refresh fails, this is normal for initial visits (no session yet)
      // Don't try to get token from localStorage as we're using HttpOnly cookies now
      console.log('Token refresh failed during load - this is normal for initial visits');
      this.accessToken = null;
      
      // refresh token intentionally not reloaded from storage anymore
      // In the session-based approach, refresh tokens are stored server-side in HttpOnly cookies
      this.refreshToken = null;
      
      // Only fetch user info if we have a valid token and we're not in SSR
      if (this.accessToken && this.isTokenValid(this.accessToken)) {
        console.log('Access token is valid, fetching user info');
        try {
          await this.fetchAndSetUserInfo();
        } catch (error) {
          // If fetching user info fails, clear invalid tokens
          console.warn('Failed to load user info, clearing tokens:', error);
          this.logout();
        }
      } else if (this.accessToken) {
        // Token exists but is invalid, clear it
        console.warn('Found invalid token in storage, clearing...');
        this.logout();
      } else {
        console.log('No access token found - this is normal for initial visits');
      }
    } else {
      console.log('Window object is not available (SSR), skipping token loading');
    }
    console.log('=== FINISHED LOADING TOKENS FROM STORAGE ===');
  }

  private static isTokenValid(token: string): boolean {
    console.log('isTokenValid called with token:', token ? `${token.substring(0, 20)}...` : 'null');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp * 1000 > Date.now();
      console.log('Token is valid:', isValid, 'Expiration:', payload.exp, 'Current time:', Date.now());
      return isValid;
    } catch (error) {
      console.log('Failed to validate token:', error);
      return false;
    }
  }

  static async login(username: string, password: string, authType: AuthUserType, otp?: string): Promise<TokenResponse> {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Username:', username);
    console.log('Auth type:', authType);
    console.log('Has OTP:', !!otp);
    
    const config = getKeycloakConfig(authType);
    console.log('Keycloak config:', config);
    if (!config || !config.url || !config.realm || !config.clientId) {
      console.log('Invalid Keycloak configuration');
      throw new AuthenticationError('Invalid Keycloak configuration');
    }
    
    const tokenUrl = `${config.url}/realms/${config.realm}/protocol/openid-connect/token`;
    console.log('Token URL:', tokenUrl);

    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', config.clientId);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('scope', 'openid profile email offline_access');
    // If OTP provided include it; otherwise try first without and caller can react to required TOTP error
    if (otp) formData.append('totp', otp);

    try {
      console.log('Making request to Keycloak token endpoint:', tokenUrl);

      // Add AbortSignal for better timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        signal: controller.signal // Add timeout signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      console.log('Keycloak response status:', response.status);

      const responseData = await response.json().catch(() => ({}));
      console.log('Keycloak response data:', responseData);

      if (!response.ok) {
        console.log('Keycloak response not OK');
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
      console.log('Login successful, received tokens');
      
      // Store tokens only in memory, not in localStorage when using session-based approach
      this.accessToken = tokens.access_token || null;
      this.refreshToken = tokens.refresh_token || null; // kept only in memory
      this.refreshAttempts = 0; // Reset refresh attempts on successful login
      
      // Fetch and store user info
      await this.fetchAndSetUserInfo().catch(() => {
        console.warn('Failed to fetch user info after login');
      });

      // Log successful authentication
      const userInfo = this.getUserInfo();
      console.log('User info after login:', userInfo);
      if (userInfo) {
        logAuthSuccess(userInfo.sub, authType, {
          email: username,
          loginMethod: otp ? 'password_with_totp' : 'password',
          hasTotp: !!otp
        });
      }

      // Set the tokens as cookies via the API route
      console.log('Setting token cookie with refresh token:', !!tokens.refresh_token);
      if (tokens.refresh_token) {
        console.log('Refresh token length:', tokens.refresh_token.length);
      } else {
        console.log('No refresh token in response');
      }
      // Extract user ID from the access token payload
      let userId: string | undefined;
      try {
        const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
        userId = payload.sub;
        console.log('User ID extracted from token:', userId);
      } catch (e) {
        console.warn('Failed to extract user ID from token:', e);
      }
      console.log('Setting token cookie with tokens:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        refreshTokenLength: tokens.refresh_token ? tokens.refresh_token.length : 0,
        authType,
        userId
      });
      console.log('Calling setTokenCookie with parameters:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        authType,
        userId
      });
      await this.setTokenCookie(tokens.access_token, tokens.refresh_token, authType, userId).catch((error) => {
        console.warn('Failed to set token cookie:', error);
      });
      
      // Store authType in localStorage as well for client-side access
      if (typeof window !== 'undefined' && authType) {
        try {
          localStorage.setItem('authType', authType);
          console.log('Stored authType in localStorage:', authType);
        } catch (e) {
          console.warn('Failed to store authType in localStorage:', e);
        }
      }
      
      console.log('Returning tokens from login function');
      return tokens;
    } catch (error) {
      console.error('Login request failed:', error);
      console.error('Keycloak URL:', tokenUrl);
      
      // More detailed error handling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error when connecting to Keycloak. Please check:');
        console.error('1. Keycloak server is running and accessible at:', config.url);
        console.error('2. NEXT_PUBLIC_KEYCLOAK_URL is correctly configured in .env.local');
        console.error('3. Network connectivity between the application and Keycloak');
        console.error('4. Firewall or antivirus is not blocking the connection');
        console.error('5. CORS is properly configured in Keycloak for client:', config.clientId);
        
        // Check if we can reach the server at all
        try {
          if (config.url) {
            const serverResponse = await fetch(config.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
            if (!serverResponse.ok) {
              console.error('Keycloak server responded with status:', serverResponse.status);
            }
          }
        } catch (serverError) {
          console.error('Cannot reach Keycloak server at all. Error:', serverError instanceof Error ? serverError.message : String(serverError));
        }
      }
      
      if (error instanceof AuthenticationError) {
        console.log('Throwing AuthenticationError');
        throw error;
      }
      console.log('Throwing generic AuthenticationError');
      throw new AuthenticationError('Network error occurred during login. Please try again.');
    }
  }

  private static getHumanReadableError(error: string, description?: string): string {
    console.log('getHumanReadableError called with:', { error, description });
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
    console.log('Returning human readable error:', result);
    return result;
  }

  private static async setTokenCookie(token: string, refreshToken?: string, authType?: AuthUserType, userId?: string): Promise<void> {
    console.log('=== SETTING TOKEN COOKIE ===');
    console.log('Has refresh token:', !!refreshToken);
    console.log('Auth type:', authType);
    
    // Skip setting cookies in server environments as they're handled differently
    if (typeof window === 'undefined') {
      console.log('Skipping cookie setting in server environment - handled by API route');
      return;
    }
    
    try {
      console.log('setTokenCookie called with parameters:', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken, 
        refreshTokenLength: refreshToken ? refreshToken.length : 0, 
        authType, 
        userId 
      });
      
      // Get CSRF token first
      console.log('Fetching CSRF token');
      const csrfResponse = await fetch('/api/auth/csrf-token', { 
        credentials: 'include',
        mode: 'cors'
      });
      if (!csrfResponse.ok) {
        console.warn('Failed to get CSRF token for setting session cookie');
        return;
      }
      const { csrfToken } = await csrfResponse.json().catch(() => ({ csrfToken: undefined }));
      console.log('CSRF token received:', csrfToken);

      // Use absolute URL to avoid "Failed to parse URL" error
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      console.log('Making request to set-session endpoint');
      
      // Log the data being sent
      console.log('Sending data to set-session:', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken ? refreshToken.length : 0,
        authType
      });
      
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

      console.log('Set-session response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.log('Set-session response not OK');
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to set session:', errorData);
        throw new Error(errorData.error || 'Failed to set session');
      }
      
      console.log('Session set successfully');
      
      // Check if the response includes Set-Cookie header
      const setCookieHeader = response.headers.get('Set-Cookie');
      console.log('Set-Cookie header in response:', setCookieHeader);
      
      // Store authType in localStorage as a fallback
      if (authType) {
        try {
          localStorage.setItem('authType', authType);
        } catch (e) {
          console.warn('Failed to store authType in localStorage:', e);
        }
      }
    } catch (error) {
      console.warn('Failed to set session cookie:', error);
      
    }
  }

  static async refresh(authType?: AuthUserType): Promise<TokenResponse | null> {
    console.log('Refresh called with authType:', authType);
    
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      console.log('Refresh already in progress, returning existing promise');
      return this.refreshPromise;
    }

    const currentAuthType = authType || this.getAuthTypeFromStorage();
    console.log('Current authType:', currentAuthType);
    
    if (!currentAuthType) {
      console.warn('No auth type available for refresh');
      // Don't logout immediately, just return null to indicate no session
      return null;
    }

    console.log('Calling performRefresh with authType:', currentAuthType);
    this.refreshPromise = this.performRefresh(currentAuthType).catch(error => {
      console.error('Refresh promise failed:', error);
      return null;
    });
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    console.log('Refresh result:', result);
    
    // If refresh failed, try to get authType from user info as a fallback
    if (!result) {
      console.log('Refresh failed, trying to get authType from user info');
      const userInfo = this.getUserInfo();
      if (userInfo && userInfo.authType) {
        console.log('Found authType in user info, trying refresh again');
        return await this.performRefresh(userInfo.authType as AuthUserType).catch(() => null);
      }
    }
    
    return result;
  }

  private static async performRefresh(authType: AuthUserType): Promise<TokenResponse | null> {
    try {
      console.log('=== PERFORMING TOKEN REFRESH ===');
      console.log('Auth type:', authType);
      
      this.refreshAttempts++;
      console.log('Refresh attempt number:', this.refreshAttempts);
      
      // Add AbortSignal for better timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds

      console.log('Making request to /api/auth/refresh');
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

      console.log('Refresh API response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Token refresh failed with status ${response.status}:`, errorData);
        
        // Special case: if it's a "no session" error during initial login, this might be expected
        if (response.status === 401 && errorData.code === 'NO_SESSION_INITIAL_LOGIN') {
          console.log('No session found during initial login - this is expected');
          // Don't logout in this case, just return null to indicate no session
          return null;
        }
        
        // If refresh fails with 401, logout the user
        if (response.status === 401) {
          console.log('Refresh failed with 401, logging out user');
          // Check if it's a session expired error
          if (errorData.error === 'Session expired') {
            console.log('Session expired, showing appropriate message');
          }
          this.logout();
        }
        return null;
      }

      const data = await response.json().catch(() => ({}));
      console.log('Refresh successful, received data:', data);
      
      // Reset attempts on successful refresh
      this.refreshAttempts = 0;
      
      this.accessToken = data.token || null;
      console.log('Access token updated');
      
      // In session-based approach, don't store token in localStorage
      // The token is stored in HttpOnly cookies on the server

      // Update user info
      console.log('Fetching user info');
      await this.fetchAndSetUserInfo().catch(() => {
        console.warn('Failed to fetch user info after refresh');
      });

      // Return token response format
      console.log('=== TOKEN REFRESH COMPLETED SUCCESSFULLY ===');
      return {
        access_token: data.token || '',
        token_type: 'Bearer',
        expires_in: 300, // This is just a placeholder, actual expiration is in the cookie
        refresh_token: '' // We don't expose the refresh token to the client
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // If we've exceeded max attempts, logout
      if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
        console.log('Max refresh attempts exceeded, logging out user');
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
          console.warn('Failed to fetch user info after refresh error:', e);
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
          console.warn('Failed to clear localStorage:', e);
        }
      }
      
      return null;
    }
  }

  static getToken(): string | null {
    console.log('getToken called, returning:', this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null');
    return this.accessToken;
  }

  static getUserInfo(): AuthUser | null {
    console.log('getUserInfo called, returning:', this.userInfo);
    return this.userInfo;
  }

  static isAuthenticated(): boolean {
    console.log('isAuthenticated called');
    const token = this.getToken();
    console.log('Token from getToken:', token ? `${token.substring(0, 20)}...` : 'null');
    if (!token) {
      console.log('No token, returning false');
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp * 1000 > Date.now();
      console.log('Token is valid:', isValid);
      
      // If token is invalid, clear it
      if (!isValid) {
        console.log('Token is invalid, clearing it');
        this.accessToken = null;
        this.userInfo = null;
      }
      
      return isValid;
    } catch (error) {
      console.log('Failed to parse token, clearing it:', error);
      // If we can't parse the token, clear it
      this.accessToken = null;
      this.userInfo = null;
      return false;
    }
  }

  static async logout(): Promise<void> {
    console.log('Logout function called');
    try {
      console.log('Calling server-side logout');
      // Clear server-side session first
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch((error) => {
        console.log('Server-side logout failed:', error);
        // Ignore fetch errors
      });
    } catch (error) {
      console.warn('Server-side logout failed:', error);
      // Continue with client-side cleanup even if server logout fails
    }

    console.log('Clearing client-side state');
    // Clear client-side state
    this.accessToken = null;
    this.refreshToken = null;
    this.userInfo = null;
    this.refreshAttempts = 0;
    this.refreshPromise = null;
    
    if (typeof window !== 'undefined') {
      console.log('Clearing localStorage');
      try {
        localStorage.removeItem('kc-token');
        localStorage.removeItem('authType');
        localStorage.removeItem('userData');
        localStorage.removeItem('userId');
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }
      
      console.log('Clearing cookies');
      // Also clear cookies by setting them to expire in the past
      try {
        document.cookie = 'kc-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'authType=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      } catch (e) {
        console.warn('Failed to clear cookies:', e);
      }
    }
    console.log('Logout completed');
  }

  static async register(email: string, password: string, companyName: string | null, firstName: string, lastName: string, authType: AuthUserType): Promise<any> {
    console.log('Register function called with:', { email, companyName, firstName, lastName, authType });
    // Always fetch a fresh CSRF token before state‑changing request (lightweight + ensures cookie/header pair)
    try {
      console.log('Registering user with data:', { email, password: '***', companyName, firstName, lastName, authType });
      
      const csrfRes = await fetch('/api/auth/csrf-token', { 
        credentials: 'include',
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(3000)
      });
      if (!csrfRes.ok) {
        console.warn('Failed to prefetch CSRF token, proceeding may fail');
      }
      const { csrfToken } = await csrfRes.json().catch(() => ({ csrfToken: undefined }));

      console.log('Making request to /api/users endpoint');
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      });

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
        signal: AbortSignal.timeout(15000)
      });

      console.log('Registration response status:', response.status);
      console.log('Registration response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log('Registration response not OK');
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Registration failed');
      }

      console.log('Registration successful');
      return response.json().catch(() => ({}));
    } catch (e) {
      console.error('Registration request failed:', e);
      console.error('Request data:', { email, password: '***', companyName, firstName, lastName, authType });
      
      // Rethrow normalized error
      if (e instanceof Error) throw e;
      throw new Error('Registration failed');
    }
  }
}

export const initializeKeycloak = async (): Promise<boolean> => {
  console.log('initializeKeycloak called');
  if (DirectGrantAuth.isAuthenticated()) {
    console.log('User is already authenticated');
    return true;
  }
  console.log('Attempting to refresh authentication');
  const refreshed = await DirectGrantAuth.refresh();
  console.log('Refresh result:', refreshed);
  return !!refreshed;
};

// Export utility functions that use DirectGrantAuth
export const getToken = () => {
  console.log('getToken called');
  return DirectGrantAuth.getToken();
};
export const getUserInfo = () => {
  console.log('getUserInfo called');
  return DirectGrantAuth.getUserInfo();
};
export const isAuthenticated = () => {
  console.log('isAuthenticated called');
  return DirectGrantAuth.isAuthenticated();
};
export const logout = () => {
  console.log('logout called');
  return DirectGrantAuth.logout();
};
export const authenticateWithPassword = (username: string, password: string, authType: AuthUserType, otp?: string) => {
  console.log('authenticateWithPassword called with:', { username, authType, hasOtp: !!otp });
  return DirectGrantAuth.login(username, password, authType, otp);
};
export const register = (email: string, password: string, companyName: string | null, firstName: string, lastName: string, authType: AuthUserType) => {
  console.log('register called with:', { email, companyName, firstName, lastName, authType });
  return DirectGrantAuth.register(email, password, companyName, firstName, lastName, authType);
};

console.log('Exporting keycloak instance');
export default keycloak;
