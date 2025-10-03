// Performance optimizations for Keycloak authentication
import { DirectGrantAuth } from '@/services/keycloak';
import { AuthUserType } from '@/types/auth';

class OptimizedAuth {
  private static tokenCache: Map<string, { token: string; expiry: number }> = new Map();
  private static refreshPromises: Map<string, Promise<any>> = new Map();
  private static retryDelays = [50, 100, 200]; // Reduced backoff for faster retries

  // Pre-validate form to avoid unnecessary API calls
  static validateForm(email: string, password: string): boolean {
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
      return { access_token: cached.token, cached: true };
    }

    // Use a timeout for the request with better control
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced timeout

    try {
      const result = await Promise.race([
        DirectGrantAuth.login(username, password, authType, otp).catch(error => {
          throw error;
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout')), 4000)
        )
      ]);

      clearTimeout(timeoutId);

      // Cache the successful token
      if (result && typeof result === 'object' && 'access_token' in result) {
        const tokenResult = result as any; // Type assertion for token response
        const expiry = Date.now() + ((tokenResult.expires_in || 300) * 1000) - 15000; // Reduced buffer
        this.tokenCache.set(cacheKey, { 
          token: tokenResult.access_token as string, 
          expiry 
        });
      }
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Clear any bad cache
      this.tokenCache.delete(cacheKey);
      
      throw error;
    }
  }

  // Optimized token refresh with deduplication
  static async optimizedRefresh(authType: AuthUserType): Promise<any> {
    const refreshKey = `refresh-${authType}`;
    
    // Prevent duplicate refresh requests
    if (this.refreshPromises.has(refreshKey)) {
      return this.refreshPromises.get(refreshKey);
    }

    const refreshPromise = (async () => {
      try {
        const result = await DirectGrantAuth.refresh(authType);
        return result;
      } catch (error) {
        return null;
      } finally {
        this.refreshPromises.delete(refreshKey);
      }
    })();

    this.refreshPromises.set(refreshKey, refreshPromise);
    return refreshPromise;
  }

  static clearCache(): void {
    this.tokenCache.clear();
    this.refreshPromises.clear();
  }

  // Preload authentication status quickly
  static async quickAuthCheck(): Promise<boolean> {
    try {
      // Quick synchronous check first
      const token = DirectGrantAuth.getToken();
      if (!token) return false;

      // Quick token validation without API call
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload && payload.exp && (payload.exp * 1000 > Date.now());
      return isValid;
    } catch (error) {
      return false;
    }
  }
}

export { OptimizedAuth };