#!/usr/bin/env node

/**
 * IP-API Integration Test Script
 * Run this script to test your IP-API integration
 * 
 * Usage: node scripts/test-ipapi.js
 */

const https = require('https');
const http = require('http');

class IPAPITester {
  static async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const lib = url.startsWith('https') ? https : http;
      
      lib.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
        
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  static async testCurrentIP() {
    console.log('🧪 Testing IP-API with your current IP...\n');
    
    try {
      const url = 'http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting';
      const data = await this.makeRequest(url);
      
      if (data.status === 'fail') {
        throw new Error(`IP-API Error: ${data.message}`);
      }
      
      console.log('✅ IP-API Response:');
      console.log(`   IP Address: ${data.query}`);
      console.log(`   Country: ${data.country} (${data.countryCode})`);
      console.log(`   Region: ${data.regionName || data.region}`);
      console.log(`   City: ${data.city}`);
      console.log(`   Timezone: ${data.timezone}`);
      console.log(`   ISP: ${data.isp}`);
      console.log(`   Organization: ${data.org}`);
      console.log(`   ASN: ${data.as}`);
      console.log('');
      console.log('🔍 Security Indicators:');
      console.log(`   Mobile: ${data.mobile ? '✅ Yes' : '❌ No'}`);
      console.log(`   Proxy: ${data.proxy ? '🚨 Yes' : '✅ No'}`);
      console.log(`   Hosting: ${data.hosting ? '🚨 Yes' : '✅ No'}`);
      
      // Risk assessment
      let riskScore = 0;
      const riskFactors = [];
      
      if (data.proxy) {
        riskScore += 80;
        riskFactors.push('Proxy detected');
      }
      
      if (data.hosting) {
        riskScore += 60;
        riskFactors.push('Hosting/Datacenter detected');
      }
      
      // Check ISP for VPN indicators
      const vpnIndicators = ['vpn', 'proxy', 'hosting', 'datacenter', 'cloud'];
      if (data.isp && vpnIndicators.some(indicator => data.isp.toLowerCase().includes(indicator))) {
        riskScore += 50;
        riskFactors.push('VPN/Proxy ISP detected');
      }
      
      if (data.mobile) {
        riskScore = Math.max(0, riskScore - 20);
        riskFactors.push('Mobile connection (lower risk)');
      }
      
      console.log('');
      console.log('📊 Risk Assessment:');
      console.log(`   Risk Score: ${Math.min(riskScore, 100)}/100`);
      console.log(`   Risk Level: ${this.getRiskLevel(riskScore)}`);
      if (riskFactors.length > 0) {
        console.log(`   Risk Factors: ${riskFactors.join(', ')}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ IP-API test failed:', error.message);
      throw error;
    }
  }

  static async testSpecificIPs() {
    console.log('\n🧪 Testing specific IP addresses...\n');
    
    const testIPs = [
      { ip: '8.8.8.8', desc: 'Google DNS (should be clean)' },
      { ip: '1.1.1.1', desc: 'Cloudflare DNS (should be clean)' },
      { ip: '185.220.101.1', desc: 'Known Tor exit node' },
      { ip: '45.32.105.239', desc: 'Cloud hosting provider' }
    ];
    
    for (const test of testIPs) {
      try {
        console.log(`Testing ${test.ip} (${test.desc})...`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const url = `http://ip-api.com/json/${test.ip}?fields=status,country,countryCode,isp,org,proxy,hosting,mobile`;
        const data = await this.makeRequest(url);
        
        if (data.status === 'fail') {
          console.log(`   ❌ Failed: ${data.message}`);
          continue;
        }
        
        const isVPN = data.proxy || data.hosting || this.isVPNISP(data.isp) || this.isVPNISP(data.org);
        
        console.log(`   Country: ${data.country} (${data.countryCode})`);
        console.log(`   ISP: ${data.isp}`);
        console.log(`   Security: Proxy=${data.proxy}, Hosting=${data.hosting}`);
        console.log(`   Assessment: ${isVPN ? '🚨 VPN/Proxy detected' : '✅ Clean'}`);
        console.log('');
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }
  }

  static isVPNISP(isp) {
    if (!isp) return false;
    const vpnIndicators = ['vpn', 'proxy', 'hosting', 'datacenter', 'cloud', 'virtual'];
    return vpnIndicators.some(indicator => isp.toLowerCase().includes(indicator));
  }

  static getRiskLevel(score) {
    if (score >= 80) return '🔴 Very High';
    if (score >= 60) return '🟠 High';
    if (score >= 40) return '🟡 Medium';
    if (score >= 20) return '🟢 Low';
    return '✅ Very Low';
  }

  static async checkRateLimit() {
    console.log('\n📈 Checking rate limits...\n');
    
    try {
      const startTime = Date.now();
      const promises = [];
      
      // Make 5 concurrent requests to test rate limiting
      for (let i = 0; i < 5; i++) {
        promises.push(this.makeRequest('http://ip-api.com/json/8.8.8.8'));
      }
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      console.log(`✅ Made 5 concurrent requests in ${endTime - startTime}ms`);
      console.log('✅ No rate limiting encountered');
      console.log('ℹ️  Free tier limit: 45 requests/minute, 1000 requests/month');
    } catch (error) {
      console.log(`❌ Rate limit test failed: ${error.message}`);
    }
  }

  static async runFullTest() {
    console.log('🌍 IP-API Integration Test\n');
    console.log('========================\n');
    
    try {
      await this.testCurrentIP();
      await this.testSpecificIPs();
      await this.checkRateLimit();
      
      console.log('\n✅ All tests completed successfully!');
      console.log('\n📝 Configuration Recommendations:');
      console.log('   1. Set NEXT_PUBLIC_LOCATION_BLOCKING_ENABLED=true');
      console.log('   2. Configure BLOCKED_COUNTRIES as needed');
      console.log('   3. Set FAIL_OPEN=true for production');
      console.log('   4. Monitor logs for false positives');
      console.log('   5. Consider upgrading to IP-API Pro for HTTPS and higher limits');
      
    } catch (error) {
      console.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  IPAPITester.runFullTest().catch(console.error);
}

module.exports = { IPAPITester };
