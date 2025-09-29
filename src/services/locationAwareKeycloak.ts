import { NextRequest } from 'next/server';
import { DirectGrantAuth } from '@/services/keycloak';
import { LocationBlockingService, LocationBlockingResult } from '@/lib/locationBlocking';
import { AuthUserType, AuthUser, TokenResponse } from '@/types/auth';
import { AuthenticationError } from '@/lib/errors';
import { logSecurityEvent, logAuthFailure, logAuthSuccess } from '@/lib/logger';
import { AuthErrorHandler } from '@/lib/authErrorHandler';

export interface LocationAwareAuthOptions {
  enforceLocationBlocking?: boolean;
  skipLocationCheckForRefresh?: boolean;
  userEmail?: string;
  authType?: AuthUserType;
  request?: NextRequest;
}

export interface LocationAwareAuthResult {
  success: boolean;
  tokens?: TokenResponse;
  user?: AuthUser;
  locationBlocked?: boolean;
  locationInfo?: LocationBlockingResult;
  error?: string;
}

export class LocationAwareKeycloakAuth {
  /**
   * Authenticate with location-based blocking
   */
  static async authenticateWithLocationCheck(
    username: string,
    password: string,
    authType: AuthUserType,
    request: NextRequest,
    options: LocationAwareAuthOptions = {}
  ): Promise<LocationAwareAuthResult> {
    const {
      enforceLocationBlocking = true,
      userEmail = username,
    } = options;

    let locationResult: LocationBlockingResult | undefined;

    try {
      // Step 1: Check location-based blocking before authentication
      
      if (enforceLocationBlocking) {
        locationResult = await LocationBlockingService.checkAuthenticationBlocking(
          request,
          userEmail,
          authType
        );

        if (locationResult.blocked) {
          // Log the blocked attempt
          this.logBlockedAuthAttempt(username, authType, locationResult, request);
          
          return {
            success: false,
            locationBlocked: true,
            locationInfo: locationResult,
            error: `Access denied: ${locationResult.reason}`
          };
        }
      }

      // Step 2: Proceed with normal authentication
      const tokens = await DirectGrantAuth.login(username, password, authType);
      const user = DirectGrantAuth.getUserInfo();

      // Step 3: Log successful authentication with location info
      if (user) {
        this.logLocationAwareAuthSuccess(user, authType, locationResult, request);
      }

      return {
        success: true,
        tokens,
        user: user || undefined,
        locationBlocked: false,
        locationInfo: locationResult
      };

    } catch (error) {
      // Log authentication failure with location context
      this.logLocationAwareAuthFailure(username, authType, error, locationResult, request);
      
      const errorState = AuthErrorHandler.handleError(
        error,
        { service: 'LocationAwareKeycloakAuth', action: 'authenticateWithLocationCheck' }
      );
      
      // Special handling for TOTP required error
      if (error instanceof Error && error.message === 'TOTP_REQUIRED') {
        return {
          success: false,
          error: 'TOTP_REQUIRED',
          locationInfo: locationResult
        };
      }
      
      return {
        success: false,
        error: errorState.message,
        locationInfo: locationResult
      };
    }
  }

  /**
   * Refresh token with optional location verification
   */
  static async refreshWithLocationCheck(
    authType: AuthUserType,
    request?: NextRequest,
    options: LocationAwareAuthOptions = {}
  ): Promise<LocationAwareAuthResult> {
    const {
      enforceLocationBlocking = false, // Usually disabled for refresh
      skipLocationCheckForRefresh = true
    } = options;

    try {
      // Check location only if explicitly requested and not skipped
      let locationResult: LocationBlockingResult | undefined;
      
      if (enforceLocationBlocking && !skipLocationCheckForRefresh && request) {
        const user = DirectGrantAuth.getUserInfo();
        locationResult = await LocationBlockingService.checkAuthenticationBlocking(
          request,
          user?.email || 'unknown',
          authType
        );

        if (locationResult.blocked) {
          // Force logout if location becomes blocked during session
          await DirectGrantAuth.logout();
          
          this.logSessionTerminatedDueToLocation(user, authType, locationResult, request);
          
          return {
            success: false,
            locationBlocked: true,
            locationInfo: locationResult,
            error: `Session terminated: ${locationResult.reason}`
          };
        }
      }

      // Proceed with token refresh
      const tokens = await DirectGrantAuth.refresh(authType);
      
      if (!tokens) {
        return {
          success: false,
          error: 'Token refresh failed'
        };
      }

      const user = DirectGrantAuth.getUserInfo();

      return {
        success: true,
        tokens,
        user: user || undefined,
        locationBlocked: false,
        locationInfo: locationResult
      };

    } catch (error) {
      const errorState = AuthErrorHandler.handleError(
        error,
        { service: 'LocationAwareKeycloakAuth', action: 'refreshWithLocationCheck' }
      );
      
      return {
        success: false,
        error: errorState.message
      };
    }
  }

  /**
   * Check if current session should be blocked based on location
   */
  static async validateSessionLocation(
    request: NextRequest,
    authType?: AuthUserType
  ): Promise<LocationBlockingResult> {
    const user = DirectGrantAuth.getUserInfo();
    const currentAuthType = authType || user?.authType || 'customers';
    
    return await LocationBlockingService.checkAuthenticationBlocking(
      request,
      user?.email || 'unknown',
      currentAuthType
    );
  }

  /**
   * Enhanced login method that can be used as a drop-in replacement
   */
  static async login(
    username: string,
    password: string,
    authType: AuthUserType,
    request?: NextRequest
  ): Promise<TokenResponse> {
    if (!request) {
      // Fallback to regular authentication if no request context
      return await DirectGrantAuth.login(username, password, authType);
    }

    const result = await this.authenticateWithLocationCheck(
      username,
      password,
      authType,
      request
    );

    if (!result.success) {
      if (result.locationBlocked) {
        throw new AuthenticationError(
          result.error || 'Access denied from your location',
          'LOCATION_BLOCKED'
        );
      }
      throw new AuthenticationError(result.error || 'Authentication failed');
    }

    return result.tokens!;
  }

  /**
   * Get user info with location context
   */
  static getUserInfoWithLocation(): AuthUser & { locationVerified?: boolean } | null {
    const user = DirectGrantAuth.getUserInfo();
    if (!user) return null;

    return {
      ...user,
      locationVerified: true // Could be enhanced to check last location verification
    };
  }

  /**
   * Check if user's current location allows continued access
   */
  static async checkContinuedAccess(request: NextRequest): Promise<boolean> {
    if (!DirectGrantAuth.isAuthenticated()) {
      return false;
    }

    const user = DirectGrantAuth.getUserInfo();
    if (!user) return false;

    const locationResult = await this.validateSessionLocation(request, user.authType);
    
    if (locationResult.blocked) {
      // Automatically logout user if location becomes blocked
      await DirectGrantAuth.logout();
      this.logSessionTerminatedDueToLocation(user, user.authType, locationResult, request);
      return false;
    }

    return true;
  }

  /**
   * Logging methods for location-aware authentication
   */
  private static logBlockedAuthAttempt(
    username: string,
    authType: AuthUserType,
    locationResult: LocationBlockingResult,
    request: NextRequest
  ): void {
    logAuthFailure(username, 'location_blocked', {
      authType,
      country: locationResult.geoInfo.country,
      region: locationResult.geoInfo.region,
      city: locationResult.geoInfo.city,
      riskScore: locationResult.riskScore,
      blockReason: locationResult.reason,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent')
    });
  }

  private static logLocationAwareAuthSuccess(
    user: AuthUser,
    authType: AuthUserType,
    locationResult: LocationBlockingResult | undefined,
    request: NextRequest
  ): void {
    logAuthSuccess(user.sub, authType, {
      email: user.email,
      loginMethod: 'password_with_location',
      country: locationResult?.geoInfo.country,
      region: locationResult?.geoInfo.region,
      city: locationResult?.geoInfo.city,
      riskScore: locationResult?.riskScore || 0,
      whitelisted: locationResult?.allowedByWhitelist || false,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent')
    });
  }

  private static logLocationAwareAuthFailure(
    username: string,
    authType: AuthUserType,
    error: unknown,
    locationResult: LocationBlockingResult | undefined,
    request: NextRequest
  ): void {
    logAuthFailure(username, 'authentication_failed', {
      authType,
      error: error instanceof Error ? error.message : String(error),
      country: locationResult?.geoInfo.country,
      region: locationResult?.geoInfo.region,
      riskScore: locationResult?.riskScore || 0,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent')
    });
  }

  private static logSessionTerminatedDueToLocation(
    user: AuthUser | null,
    authType: AuthUserType,
    locationResult: LocationBlockingResult,
    request: NextRequest
  ): void {
    logSecurityEvent('session_terminated_location_change', {
      userId: user?.sub,
      email: user?.email,
      authType,
      country: locationResult.geoInfo.country,
      region: locationResult.geoInfo.region,
      riskScore: locationResult.riskScore,
      blockReason: locationResult.reason,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    return cfConnectingIP || 
           (forwarded ? forwarded.split(',')[0].trim() : null) || 
           realIP || 
           'unknown';
  }
}
