/**
 * IP-API Testing Utility
 * This utility helps test and configure IP-API integration
 */

interface IPAPIResponse {
  status: string;
  message?: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
}

export class IPAPITestUtility {
  /**
   * Test IP-API with your current IP
   */
  static async testCurrentIP(): Promise<IPAPIResponse> {
    try {
      const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'fail') {
        throw new Error(`IP-API Error: ${data.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('IP-API test failed:', error);
      throw error;
    }
  }

  /**
   * Test IP-API with a specific IP address
   */
  static async testIP(ip: string): Promise<IPAPIResponse> {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'fail') {
        throw new Error(`IP-API Error: ${data.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`IP-API test failed for ${ip}:`, error);
      throw error;
    }
  }

  /**
   * Batch test multiple IPs
   */
  static async testMultipleIPs(ips: string[]): Promise<Record<string, IPAPIResponse | Error>> {
    const results: Record<string, IPAPIResponse | Error> = {};
    
    // IP-API allows batch requests, but we'll do them individually with rate limiting
    for (const ip of ips) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limit: ~40 requests/minute
        results[ip] = await this.testIP(ip);
      } catch (error) {
        results[ip] = error instanceof Error ? error : new Error(String(error));
      }
    }
    
    return results;
  }

  /**
   * Get API usage statistics
   */
  static async getUsageStats(): Promise<{ remaining: number; reset: number } | null> {
    try {
      // Make a test request and check rate limit headers
      const response = await fetch('http://ip-api.com/json/8.8.8.8');
      
      // IP-API doesn't provide usage headers in free tier
      // This is a placeholder for when you upgrade to Pro
      const remaining = response.headers.get('X-Rl-Remaining');
      const reset = response.headers.get('X-Rl-Reset');
      
      if (remaining && reset) {
        return {
          remaining: parseInt(remaining),
          reset: parseInt(reset)
        };
      }
      
      return null; // No usage info available in free tier
    } catch (error) {
      console.warn('Could not get usage stats:', error);
      return null;
    }
  }

  /**
   * Test known VPN/Proxy IPs for detection accuracy
   */
  static async testVPNDetection(): Promise<Record<string, boolean>> {
    // Known VPN/Proxy IPs for testing (these are public test IPs)
    const testIPs = [
      '185.220.101.1', // Tor exit node
      '198.251.83.49', // Known VPN provider
      '45.32.105.239', // Cloud/hosting provider
      '8.8.8.8',       // Google DNS (should be clean)
      '1.1.1.1',       // Cloudflare DNS (should be clean)
    ];

    const results: Record<string, boolean> = {};
    
    for (const ip of testIPs) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limiting
        const data = await this.testIP(ip);
        
        // Check if IP-API detected VPN/proxy/hosting
        const isVPN = Boolean(data.proxy) || 
                     Boolean(data.hosting) || 
                     (data.isp ? this.isVPNISP(data.isp) : false) ||
                     (data.org ? this.isVPNISP(data.org) : false);
        
        results[ip] = isVPN;
        console.log(`${ip}: VPN/Proxy detected: ${isVPN}`, {
          proxy: data.proxy,
          hosting: data.hosting,
          isp: data.isp,
          org: data.org
        });
      } catch (error) {
        console.error(`Failed to test ${ip}:`, error);
        results[ip] = false;
      }
    }
    
    return results;
  }

  private static isVPNISP(isp: string): boolean {
    const vpnIndicators = ['vpn', 'proxy', 'hosting', 'datacenter', 'cloud', 'virtual'];
    return vpnIndicators.some(indicator => isp.toLowerCase().includes(indicator));
  }

  /**
   * Generate a configuration report
   */
  static async generateConfigReport(): Promise<string> {
    try {
      console.log('🧪 Testing IP-API Configuration...\n');
      
      // Test current IP
      console.log('1. Testing current IP...');
      const currentIP = await this.testCurrentIP();
      console.log(`   ✅ Current IP: ${currentIP.query} (${currentIP.country})`);
      console.log(`   📍 Location: ${currentIP.city}, ${currentIP.regionName}, ${currentIP.country}`);
      console.log(`   🏢 ISP: ${currentIP.isp}`);
      console.log(`   🔍 Security: Proxy=${currentIP.proxy}, Hosting=${currentIP.hosting}, Mobile=${currentIP.mobile}\n`);
      
      // Test VPN detection
      console.log('2. Testing VPN/Proxy detection...');
      const vpnResults = await this.testVPNDetection();
      console.log('   VPN Detection Results:', vpnResults);
      console.log('');
      
      // Check usage
      console.log('3. Checking API usage...');
      const usage = await this.getUsageStats();
      if (usage) {
        console.log(`   📊 Remaining requests: ${usage.remaining}`);
        console.log(`   ⏰ Reset time: ${new Date(usage.reset * 1000).toLocaleString()}`);
      } else {
        console.log('   ℹ️  Usage stats not available (free tier)');
      }
      
      const report = `
IP-API Configuration Report
===========================
Current IP: ${currentIP.query}
Location: ${currentIP.city}, ${currentIP.regionName}, ${currentIP.country}
ISP: ${currentIP.isp}
Organization: ${currentIP.org}
Security Indicators:
  - Proxy: ${currentIP.proxy || 'false'}
  - Hosting: ${currentIP.hosting || 'false'}
  - Mobile: ${currentIP.mobile || 'false'}

VPN Detection Test Results:
${Object.entries(vpnResults).map(([ip, detected]) => 
  `  ${ip}: ${detected ? '🚨 VPN/Proxy detected' : '✅ Clean'}`
).join('\n')}

Recommendations:
- ${currentIP.proxy || currentIP.hosting ? '⚠️  Your current IP is flagged as proxy/hosting' : '✅ Your current IP appears clean'}
- IP-API provides built-in proxy/hosting detection
- Free tier includes 1000 requests/month
- Consider upgrading for HTTPS and higher limits
      `;
      
      console.log(report);
      return report;
    } catch (error) {
      const errorReport = `IP-API Configuration Test Failed: ${error}`;
      console.error(errorReport);
      return errorReport;
    }
  }
}

// Export for use in Node.js scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IPAPITestUtility };
}
