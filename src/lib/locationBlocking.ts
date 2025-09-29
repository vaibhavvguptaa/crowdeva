import { NextRequest } from 'next/server';
import { GeolocationService, GeolocationInfo } from '@/lib/geolocation';
import { logSecurityEvent } from '@/lib/logger';

export interface LocationBlockingConfig {
  enabled: boolean;
  blockedCountries: string[];
  blockedRegions: string[];
  allowedCountries?: string[];
  vpnBlocking: boolean;
  proxyBlocking: boolean;
  datacenterBlocking: boolean;
  riskThreshold: number;
  failOpen: boolean; // Allow access if geolocation fails
  whitelist: {
    ips: string[];
    cidrs: string[];
  };
  timeBasedBlocking?: {
    enabled: boolean;
    timezone: string;
    allowedHours: { start: number; end: number };
  };
}

export interface LocationBlockingResult {
  blocked: boolean;
  reason?: string;
  geoInfo: GeolocationInfo;
  riskScore: number;
  allowedByWhitelist: boolean;
}

export class LocationBlockingService {
  private static config: LocationBlockingConfig = {
    enabled: process.env.NEXT_PUBLIC_LOCATION_BLOCKING_ENABLED === 'true',
    blockedCountries: (process.env.BLOCKED_COUNTRIES || 'CN,RU,KP,IR,SY').split(','),
    blockedRegions: (process.env.BLOCKED_REGIONS || '').split(',').filter(Boolean),
    allowedCountries: process.env.ALLOWED_COUNTRIES?.split(','),
    vpnBlocking: process.env.BLOCK_VPN === 'true',
    proxyBlocking: process.env.BLOCK_PROXY === 'true',
    datacenterBlocking: process.env.BLOCK_DATACENTER === 'true',
    riskThreshold: parseInt(process.env.RISK_THRESHOLD || '70'),
    failOpen: process.env.FAIL_OPEN === 'true',
    whitelist: {
      ips: (process.env.WHITELIST_IPS || '').split(',').filter(Boolean),
      cidrs: (process.env.WHITELIST_CIDRS || '').split(',').filter(Boolean)
    },
    timeBasedBlocking: {
      enabled: process.env.TIME_BASED_BLOCKING === 'true',
      timezone: process.env.BLOCKING_TIMEZONE || 'UTC',
      allowedHours: {
        start: parseInt(process.env.ALLOWED_HOURS_START || '0'),
        end: parseInt(process.env.ALLOWED_HOURS_END || '24')
      }
    }
  };

  /**
   * Check if authentication should be blocked based on location
   */
  static async checkAuthenticationBlocking(
    request: NextRequest,
    userEmail?: string,
    authType?: string
  ): Promise<LocationBlockingResult> {
    if (!this.config.enabled) {
      return {
        blocked: false,
        geoInfo: { country: 'unknown', blocked: false },
        riskScore: 0,
        allowedByWhitelist: false
      };
    }

    try {
      // Get geolocation info
      const geoInfo = await GeolocationService.checkGeolocation(request);
      
      // Check whitelist first
      const whitelistResult = this.checkWhitelist(request);
      if (whitelistResult) {
        this.logLocationEvent('whitelisted_access', request, geoInfo, { userEmail, authType });
        return {
          blocked: false,
          geoInfo,
          riskScore: geoInfo.risk_score || 0,
          allowedByWhitelist: true
        };
      }

      // Perform location-based checks
      const blockingResult = await this.performLocationChecks(request, geoInfo);
      
      if (blockingResult.blocked) {
        this.logLocationEvent('location_blocked', request, geoInfo, {
          userEmail,
          authType,
          reason: blockingResult.reason,
          riskScore: blockingResult.riskScore
        });
      } else {
        this.logLocationEvent('location_allowed', request, geoInfo, {
          userEmail,
          authType,
          riskScore: blockingResult.riskScore
        });
      }

      return blockingResult;
    } catch (error) {
      console.error('Location blocking check failed:', error);
      
      // Log the error
      this.logLocationEvent('location_check_error', request, { country: 'unknown', blocked: false }, {
        error: error instanceof Error ? error.message : String(error),
        userEmail,
        authType
      });

      // Fail open or closed based on configuration
      return {
        blocked: !this.config.failOpen,
        reason: this.config.failOpen ? undefined : 'Location verification failed',
        geoInfo: { country: 'unknown', blocked: !this.config.failOpen },
        riskScore: this.config.failOpen ? 0 : 100,
        allowedByWhitelist: false
      };
    }
  }

  /**
   * Perform comprehensive location-based checks
   */
  private static async performLocationChecks(
    request: NextRequest,
    geoInfo: GeolocationInfo
  ): Promise<LocationBlockingResult> {
    let blocked = false;
    let reason = '';
    const riskScore = geoInfo.risk_score || 0;

    // Country-based blocking
    if (this.config.allowedCountries && this.config.allowedCountries.length > 0) {
      // Allowlist mode - only specified countries are allowed
      if (!this.config.allowedCountries.includes(geoInfo.country.toUpperCase())) {
        blocked = true;
        reason = 'Country not in allowlist';
      }
    } else {
      // Blocklist mode - specified countries are blocked
      if (this.config.blockedCountries.includes(geoInfo.country.toUpperCase())) {
        blocked = true;
        reason = 'Country blocked';
      }
    }

    // Region-based blocking
    if (!blocked && geoInfo.region && this.config.blockedRegions.includes(geoInfo.region.toUpperCase())) {
      blocked = true;
      reason = 'Region blocked';
    }

    // VPN/Proxy/Datacenter blocking
    if (!blocked && geoInfo.isp) {
      const ispLower = geoInfo.isp.toLowerCase();
      
      if (this.config.vpnBlocking && this.isVPN(ispLower)) {
        blocked = true;
        reason = 'VPN detected';
      } else if (this.config.proxyBlocking && this.isProxy(ispLower)) {
        blocked = true;
        reason = 'Proxy detected';
      } else if (this.config.datacenterBlocking && this.isDatacenter(ispLower)) {
        blocked = true;
        reason = 'Datacenter IP detected';
      }
    }

    // Risk score threshold
    if (!blocked && riskScore >= this.config.riskThreshold) {
      blocked = true;
      reason = `High risk score: ${riskScore}`;
    }

    // Time-based blocking
    if (!blocked && this.config.timeBasedBlocking?.enabled) {
      const timeBlocked = this.checkTimeBasedBlocking(geoInfo);
      if (timeBlocked) {
        blocked = true;
        reason = 'Access outside allowed hours';
      }
    }

    return {
      blocked,
      reason,
      geoInfo,
      riskScore,
      allowedByWhitelist: false
    };
  }

  /**
   * Check if IP is in whitelist
   */
  private static checkWhitelist(request: NextRequest): boolean {
    const clientIP = this.getClientIP(request);
    
    // Check exact IP matches
    if (this.config.whitelist.ips.includes(clientIP)) {
      return true;
    }

    // Check CIDR ranges
    for (const cidr of this.config.whitelist.cidrs) {
      if (this.isIPInCIDR(clientIP, cidr)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if access is within allowed time window
   */
  private static checkTimeBasedBlocking(geoInfo: GeolocationInfo): boolean {
    if (!this.config.timeBasedBlocking?.enabled) {
      return false;
    }

    try {
      const timezone = geoInfo.timezone || this.config.timeBasedBlocking.timezone;
      const now = new Date();
      const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      const currentHour = userTime.getHours();

      const { start, end } = this.config.timeBasedBlocking.allowedHours;
      
      if (start <= end) {
        // Normal range (e.g., 9 to 17)
        return currentHour < start || currentHour > end;
      } else {
        // Overnight range (e.g., 22 to 6)
        return currentHour > end && currentHour < start;
      }
    } catch (error) {
      console.warn('Time-based blocking check failed:', error);
      return false; // Don't block on error
    }
  }

  /**
   * Check if ISP indicates VPN usage
   */
  private static isVPN(isp: string): boolean {
    const vpnIndicators = [
      'vpn', 'virtual private network', 'tunnel', 'secure',
      'privacy', 'anonymous', 'hide', 'mask'
    ];
    return vpnIndicators.some(indicator => isp.includes(indicator));
  }

  /**
   * Check if ISP indicates proxy usage
   */
  private static isProxy(isp: string): boolean {
    const proxyIndicators = [
      'proxy', 'socks', 'http proxy', 'web proxy',
      'anonymizer', 'tor'
    ];
    return proxyIndicators.some(indicator => isp.includes(indicator));
  }

  /**
   * Check if ISP indicates datacenter/hosting
   */
  private static isDatacenter(isp: string): boolean {
    const datacenterIndicators = [
      'hosting', 'datacenter', 'data center', 'cloud',
      'server', 'dedicated', 'colocation', 'aws',
      'google cloud', 'azure', 'digitalocean',
      'ovh', 'hetzner', 'linode'
    ];
    return datacenterIndicators.some(indicator => isp.includes(indicator));
  }

  /**
   * Check if IP is in CIDR range
   */
  private static isIPInCIDR(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);
      
      const ipToNumber = (ip: string) =>
        ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
      
      return (ipToNumber(ip) & mask) === (ipToNumber(range) & mask);
    } catch (error) {
      console.warn('CIDR check failed:', error);
      return false;
    }
  }

  /**
   * Get client IP from request
   */
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    return cfConnectingIP || 
           (forwarded ? forwarded.split(',')[0].trim() : null) || 
           realIP || 
           'unknown';
  }

  /**
   * Log location-based security events
   */
  private static logLocationEvent(
    event: string,
    request: NextRequest,
    geoInfo: Partial<GeolocationInfo>,
    context?: Record<string, any>
  ): void {
    const clientIP = this.getClientIP(request);
    
    const logData = {
      timestamp: new Date().toISOString(),
      event,
      ip: clientIP,
      country: geoInfo.country,
      region: geoInfo.region,
      city: geoInfo.city,
      isp: geoInfo.isp,
      riskScore: geoInfo.risk_score,
      userAgent: request.headers.get('user-agent'),
      path: request.nextUrl.pathname,
      method: request.method,
      ...context
    };

    logSecurityEvent(event, logData);
  }

  /**
   * Update blocking configuration dynamically
   */
  static updateConfig(newConfig: Partial<LocationBlockingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  static getConfig(): LocationBlockingConfig {
    return { ...this.config };
  }

  /**
   * Create a blocking response
   */
  static createBlockingResponse(result: LocationBlockingResult): Response {
    const response = {
      error: 'Access denied',
      message: 'Access from your location is not permitted',
      blocked: true,
      reason: result.reason,
      country: result.geoInfo.country,
      riskScore: result.riskScore,
      timestamp: new Date().toISOString(),
      supportContact: process.env.SUPPORT_EMAIL || 'support@crowdeval.com'
    };

    return new Response(JSON.stringify(response), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Blocked-Reason': result.reason || 'location',
        'X-Blocked-Country': result.geoInfo.country,
        'X-Risk-Score': result.riskScore.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  }
}
