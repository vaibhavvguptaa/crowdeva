import React, { useState } from 'react';
import { MapPin, Shield, AlertTriangle, CheckCircle, Globe } from 'lucide-react';

interface IPAPITestResult {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  proxy?: boolean;
  hosting?: boolean;
  mobile?: boolean;
  timezone: string;
  riskScore: number;
  blocked: boolean;
}

export const IPAPITestComponent: React.FC = () => {
  const [testResult, setTestResult] = useState<IPAPITestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customIP, setCustomIP] = useState('');

  const testCurrentIP = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use our location-aware API endpoint to test current IP
      const response = await fetch('/api/auth/location-aware', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Location check failed');
      }

      // Calculate risk score
      let riskScore = 0;
      if (data.data.restrictions.blocked) riskScore = 100;
      else riskScore = data.data.riskScore || 0;

      setTestResult({
        ip: 'Current IP',
        country: data.data.country,
        countryCode: data.data.country,
        region: data.data.region || '',
        city: data.data.city || '',
        isp: 'Detected via IP-API',
        org: '',
        proxy: false,
        hosting: false,
        mobile: false,
        timezone: '',
        riskScore,
        blocked: !data.data.locationAllowed
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const testCustomIP = async () => {
    if (!customIP.trim()) {
      setError('Please enter an IP address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For testing purposes, we'll use a direct IP-API call
      // Note: This might be blocked by CORS in production
      const response = await fetch(`http://ip-api.com/json/${customIP}?fields=status,country,countryCode,region,city,isp,org,proxy,hosting,mobile,timezone,query`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'fail') {
        throw new Error(`IP-API Error: ${data.message || 'Invalid IP address'}`);
      }

      // Calculate risk score
      let riskScore = 0;
      if (data.proxy) riskScore += 80;
      if (data.hosting) riskScore += 60;
      if (data.mobile) riskScore = Math.max(0, riskScore - 20);

      // Check for blocked countries
      const blockedCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
      const isBlocked = blockedCountries.includes(data.countryCode) || riskScore >= 70;

      setTestResult({
        ip: data.query,
        country: data.country,
        countryCode: data.countryCode,
        region: data.region,
        city: data.city,
        isp: data.isp,
        org: data.org,
        proxy: data.proxy,
        hosting: data.hosting,
        mobile: data.mobile,
        timezone: data.timezone,
        riskScore: Math.min(riskScore, 100),
        blocked: isBlocked
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Globe className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IP-API Integration Test</h1>
            <p className="text-gray-600">Test location detection and security assessment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Test Current IP</h2>
            <p className="text-gray-600 text-sm mb-4">
              Test your current IP address using the integrated location service
            </p>
            <button
              onClick={testCurrentIP}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Test Current IP'}
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Test Custom IP</h2>
            <p className="text-gray-600 text-sm mb-4">
              Test any IP address for location and security assessment
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter IP address (e.g., 8.8.8.8)"
                value={customIP}
                onChange={(e) => setCustomIP(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={testCustomIP}
                disabled={loading || !customIP.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {testResult && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                testResult.blocked 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {testResult.blocked ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Blocked
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Allowed
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">IP Address:</span>
                    <span className="font-mono">{testResult.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country:</span>
                    <span>{testResult.country} ({testResult.countryCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region:</span>
                    <span>{testResult.region || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">City:</span>
                    <span>{testResult.city || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timezone:</span>
                    <span>{testResult.timezone || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Assessment
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ISP:</span>
                    <span className="text-right max-w-48 truncate" title={testResult.isp}>
                      {testResult.isp}
                    </span>
                  </div>
                  {testResult.org && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Organization:</span>
                      <span className="text-right max-w-48 truncate" title={testResult.org}>
                        {testResult.org}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mobile:</span>
                    <span>{testResult.mobile ? '✅ Yes' : '❌ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proxy:</span>
                    <span>{testResult.proxy ? '🚨 Yes' : '✅ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hosting:</span>
                    <span>{testResult.hosting ? '🚨 Yes' : '✅ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Score:</span>
                    <span className={`font-semibold ${getRiskColor(testResult.riskScore)}`}>
                      {testResult.riskScore}/100 ({getRiskLevel(testResult.riskScore)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {testResult.blocked && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  <strong>Access would be blocked</strong> based on current security policies.
                  This IP address has been flagged due to high risk factors or blocked geography.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">IP-API Free Tier Information</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• 1,000 requests per month</li>
            <li>• 45 requests per minute</li>
            <li>• HTTP requests only (HTTPS requires Pro)</li>
            <li>• Includes proxy and hosting detection</li>
            <li>• No API key required</li>
          </ul>
          <p className="text-blue-700 text-sm mt-2">
            Consider upgrading to <a href="https://ip-api.com/docs/pricing" target="_blank" rel="noopener noreferrer" className="underline">IP-API Pro</a> for production use.
          </p>
        </div>
      </div>
    </div>
  );
};
