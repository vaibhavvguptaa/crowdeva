import { NextRequest } from 'next/server';

export interface GeolocationInfo {
  country: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
  zip?: string;
  blocked: boolean;
  risk_score?: number;
}

export class GeolocationService {
  private static readonly BLOCKED_COUNTRIES = ['CN', 'RU', 'KP', 'IR', 'SY'];
  private static readonly HIGH_RISK_COUNTRIES = ['VE', 'MM', 'AF'];
  private static readonly VPN_INDICATORS = ['hosting', 'vpn', 'proxy', 'datacenter'];

  /**
   * Check if a request should be blocked based on geolocation
   */
  static async checkGeolocation(request: NextRequest): Promise<GeolocationInfo> {
    const ipInfo = this.extractIPInfo(request);
    const geoInfo = await this.getDetailedGeolocation(ipInfo.ip);
    
    return {
      country: geoInfo.country || 'unknown',
      region: geoInfo.region,
      city: geoInfo.city,
      latitude: geoInfo.latitude,
      longitude: geoInfo.longitude,
      timezone: geoInfo.timezone,
      isp: geoInfo.isp,
      blocked: this.shouldBlock(geoInfo),
      risk_score: this.calculateRiskScore(geoInfo)
    };
  }

  /**
   * Extract IP information from request headers
   */
  private static extractIPInfo(request: NextRequest) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    const ip = cfConnectingIP || 
               (forwarded ? forwarded.split(',')[0].trim() : null) || 
               realIP || 
               'unknown';

    return {
      ip,
      userAgent: request.headers.get('user-agent') || '',
      country: request.headers.get('cf-ipcountry') || 
               request.headers.get('x-vercel-ip-country') ||
               request.headers.get('x-country-code'),
      region: request.headers.get('cf-region'),
      city: request.headers.get('cf-ipcity')
    };
  }

  /**
   * Get detailed geolocation information
   */
  private static async getDetailedGeolocation(ip: string): Promise<Partial<GeolocationInfo>> {
    if (ip === 'unknown' || this.isPrivateIP(ip)) {
      return { country: 'unknown' };
    }

    try {
      // Prioritize IP-API as the primary free service
      const services = [
        () => this.getIPAPIGeo(ip),
        () => this.getCloudflareGeo(ip),
        () => this.getMaxMindGeo(ip)
      ];

      for (const service of services) {
        try {
          const result = await service();
          if (result.country && result.country !== 'unknown') {
            return result;
          }
        } catch (error) {
          console.warn(`Geolocation service failed:`, error);
          continue;
        }
      }

      return { country: 'unknown' };
    } catch (error) {
      console.error('All geolocation services failed:', error);
      return { country: 'unknown' };
    }
  }

  /**
   * Cloudflare geolocation (if using Cloudflare)
   */
  private static async getCloudflareGeo(ip: string): Promise<Partial<GeolocationInfo>> {
    // Cloudflare headers are already available in the request
    // This is a placeholder for when using Cloudflare's API directly
    return { country: 'unknown' };
  }

  /**
   * IP-API geolocation service (free tier)
   * Free tier: 1000 requests/month, 45 requests/minute
   * Fields: status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query
   */
  private static async getIPAPIGeo(ip: string): Promise<Partial<GeolocationInfo>> {
    try {
      // Use HTTPS endpoint for better security (requires subscription, fallback to HTTP)
      const useHttps = process.env.IPAPI_KEY ? true : false;
      const protocol = useHttps ? 'https' : 'http';
      const apiKey = process.env.IPAPI_KEY ? `?key=${process.env.IPAPI_KEY}&` : '?';
      
      // Request comprehensive fields for better analysis
      const fields = [
        'status', 'message', 'country', 'countryCode', 'region', 'regionName',
        'city', 'zip', 'lat', 'lon', 'timezone', 'isp', 'org', 'as', 'query',
        'mobile', 'proxy', 'hosting'
      ].join(',');

      const url = `${protocol}://ip-api.com/json/${ip}${apiKey}fields=${fields}`;
      
      const response = await fetch(url, {
        headers: { 
          'User-Agent': 'CrowdEval-Security/1.0',
          'Accept': 'application/json'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`IP-API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'fail') {
        throw new Error(`IP-API lookup failed: ${data.message || 'Unknown error'}`);
      }

      // Enhanced data mapping with additional security indicators
      return {
        country: data.countryCode,
        region: data.regionName || data.region,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
        isp: data.isp,
        // Additional security-relevant data
        organization: data.org,
        asn: data.as,
        mobile: data.mobile,
        proxy: data.proxy,
        hosting: data.hosting,
        zip: data.zip
      };
    } catch (error) {
      console.warn('IP-API geolocation failed:', error);
      throw error;
    }
  }

  /**
   * MaxMind GeoLite2 (requires API key)
   */
  private static async getMaxMindGeo(ip: string): Promise<Partial<GeolocationInfo>> {
    const apiKey = process.env.MAXMIND_API_KEY;
    if (!apiKey) throw new Error('MaxMind API key not configured');

    const response = await fetch(`https://geoip.maxmind.com/geoip/v2.1/city/${ip}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.MAXMIND_USER_ID}:${apiKey}`).toString('base64')}`
      }
    });

    if (!response.ok) throw new Error('MaxMind request failed');
    
    const data = await response.json();

    return {
      country: data.country?.iso_code,
      region: data.subdivisions?.[0]?.name,
      city: data.city?.names?.en,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      timezone: data.location?.time_zone
    };
  }

  /**
   * Determine if access should be blocked
   */
  private static shouldBlock(geoInfo: Partial<GeolocationInfo>): boolean {
    if (!geoInfo.country || geoInfo.country === 'unknown') {
      return false; // Don't block unknown locations (fail-open)
    }

    // Block countries on the blocklist
    if (this.BLOCKED_COUNTRIES.includes(geoInfo.country.toUpperCase())) {
      return true;
    }

    // Use IP-API's built-in proxy/hosting detection if available
    if (geoInfo.proxy === true || geoInfo.hosting === true) {
      return true;
    }

    // Block based on ISP indicators (VPN/Proxy detection)
    if (geoInfo.isp && this.VPN_INDICATORS.some(indicator => 
      geoInfo.isp!.toLowerCase().includes(indicator))) {
      return true;
    }

    // Block based on organization indicators
    if (geoInfo.organization && this.VPN_INDICATORS.some(indicator => 
      geoInfo.organization!.toLowerCase().includes(indicator))) {
      return true;
    }

    return false;
  }

  /**
   * Calculate risk score (0-100)
   */
  private static calculateRiskScore(geoInfo: Partial<GeolocationInfo>): number {
    let score = 0;

    if (!geoInfo.country) return 0;

    // Country-based scoring
    if (this.BLOCKED_COUNTRIES.includes(geoInfo.country.toUpperCase())) {
      score += 100; // Automatic block
    } else if (this.HIGH_RISK_COUNTRIES.includes(geoInfo.country.toUpperCase())) {
      score += 70;
    }

    // IP-API specific indicators (high confidence)
    if (geoInfo.proxy === true) {
      score += 80; // IP-API detected proxy
    }
    
    if (geoInfo.hosting === true) {
      score += 60; // IP-API detected hosting/datacenter
    }

    // ISP-based scoring
    if (geoInfo.isp) {
      if (this.VPN_INDICATORS.some(indicator => geoInfo.isp!.toLowerCase().includes(indicator))) {
        score += 50;
      }
    }

    // Organization-based scoring
    if (geoInfo.organization) {
      if (this.VPN_INDICATORS.some(indicator => geoInfo.organization!.toLowerCase().includes(indicator))) {
        score += 40;
      }
    }

    // Mobile connection (generally lower risk)
    if (geoInfo.mobile === true) {
      score = Math.max(0, score - 20); // Reduce risk for mobile connections
    }

    return Math.min(score, 100);
  }

  /**
   * Check if IP is private/local
   */
  private static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^127\./, // 127.0.0.0/8
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^::1$/, // IPv6 loopback
      /^fe80:/, // IPv6 link-local
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Log security event
   */
  static logSecurityEvent(event: string, details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity: details.blocked ? 'HIGH' : 'MEDIUM'
    };

    // In production, send to your security monitoring system
    console.warn('Security Event:', JSON.stringify(logEntry));
    
    // Example: Send to external security service
    // await this.sendToSecurityService(logEntry);
  }
}
