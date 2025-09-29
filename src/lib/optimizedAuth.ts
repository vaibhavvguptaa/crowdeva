// Performance optimizations for Keycloak authentication
import { DirectGrantAuth } from '@/services/keycloak';
import { AuthUserType } from '@/types/auth';

class OptimizedAuth {
  private static tokenCache: Map<string, { token: string; expiry: number }> = new Map();
  private static refreshPromises: Map<string, Promise<any>> = new Map();
  private static retryDelays = [100, 250, 500]; // Progressive backoff for retries

  // Pre-validate form to avoid unnecessary API calls
  static validateForm(email: string, password: string): boolean {
    console.log('Validating form:', { email, passwordLength: password.length });
    if (!email || !email.includes('@') || email.length < 3) return false;
    if (!password || password.length < 6) return false;
    return true;
  }

  // Fast authentication with optimizations
  static async fastLogin(username: string, password: string, authType: AuthUserType, otp?: string): Promise<any> {
    // Pre-validation
    if (!this.validateForm(username, password)) {
      throw new Error('Invalid email or password format');
    }

    const cacheKey = `${username}-${authType}`;
    
    // Check if we have a valid cached token (avoid unnecessary calls)
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      console.log('Using cached authentication');
      return { access_token: cached.token, cached: true };
    }

    // Use a timeout for the request with better control
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      console.log('Performing DirectGrantAuth login with authType:', authType);
      const result = await Promise.race([
        DirectGrantAuth.login(username, password, authType, otp).catch(error => {
          throw error;
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout')), 7000)
        )
      ]);

      clearTimeout(timeoutId);
      console.log('DirectGrantAuth login result:', result);

      // Cache the successful token
      if (result && typeof result === 'object' && 'access_token' in result) {
        const tokenResult = result as any; // Type assertion for token response
        const expiry = Date.now() + ((tokenResult.expires_in || 300) * 1000) - 30000; // 30s buffer
        this.tokenCache.set(cacheKey, { 
          token: tokenResult.access_token as string, 
          expiry 
        });
        console.log('Token cached successfully');
      } else {
        console.log('Token not cached - invalid result:', result);
      }
      
      // Remove artificial delay for better performance
      // await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Returning login result');
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      console.log('Login failed with error:', error);
      
      // Clear any bad cache
      this.tokenCache.delete(cacheKey);
      
      throw error;
    }
  }

  // Optimized token refresh with deduplication
  static async optimizedRefresh(authType: AuthUserType): Promise<any> {
    const refreshKey = `refresh-${authType}`;
    
    console.log('Performing optimized refresh with authType:', authType);
    
    // Prevent duplicate refresh requests
    if (this.refreshPromises.has(refreshKey)) {
      console.log('Using existing refresh promise');
      return this.refreshPromises.get(refreshKey);
    }

    const refreshPromise = (async () => {
      try {
        console.log('Calling DirectGrantAuth.refresh');
        const result = await DirectGrantAuth.refresh(authType);
        console.log('DirectGrantAuth.refresh result:', result);
        return result;
      } catch (error) {
        console.error('Optimized refresh failed:', error);
        return null;
      } finally {
        this.refreshPromises.delete(refreshKey);
      }
    })();

    this.refreshPromises.set(refreshKey, refreshPromise);
    return refreshPromise;
  }

  static clearCache(): void {
    console.log('Clearing auth cache');
    this.tokenCache.clear();
    this.refreshPromises.clear();
  }

  // Preload authentication status quickly
  static async quickAuthCheck(): Promise<boolean> {
    try {
      console.log('Performing quick auth check');
      // Quick synchronous check first
      const token = DirectGrantAuth.getToken();
      console.log('Token from DirectGrantAuth:', token ? `${token.substring(0, 20)}...` : 'null');
      if (!token) return false;

      // Quick token validation without API call
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload && payload.exp && (payload.exp * 1000 > Date.now());
      console.log('Token is valid:', isValid);
      return isValid;
    } catch (error) {
      console.log('Quick auth check failed:', error);
      return false;
    }
  }
}

export { OptimizedAuth };