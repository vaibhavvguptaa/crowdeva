import React, { useState, useEffect } from 'react';
import { Shield, Globe, AlertTriangle, Settings, Save, RefreshCw } from 'lucide-react';

interface LocationConfigData {
  enabled: boolean;
  blockedCountries: string[];
  allowedCountries: string[];
  riskThreshold: number;
  blockVpn: boolean;
  blockProxy: boolean;
  blockDatacenter: boolean;
  failOpen: boolean;
  whitelistIps: string[];
  timeBasedBlocking: {
    enabled: boolean;
    timezone: string;
    allowedHours: { start: number; end: number };
  };
}

interface LocationStatsData {
  totalAttempts: number;
  blockedAttempts: number;
  topBlockedCountries: { country: string; count: number }[];
  avgRiskScore: number;
  vpnAttempts: number;
}

export const LocationBlockingDashboard: React.FC = () => {
  const [config, setConfig] = useState<LocationConfigData | null>(null);
  const [stats, setStats] = useState<LocationStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newCountry, setNewCountry] = useState('');
  const [newIp, setNewIp] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load configuration
      const configResponse = await fetch('/api/admin/location-config');
      if (!configResponse.ok) throw new Error('Failed to load configuration');
      const configData = await configResponse.json();
      setConfig(configData.data);

      // Load statistics
      const statsResponse = await fetch('/api/admin/location-stats');
      if (!statsResponse.ok) throw new Error('Failed to load statistics');
      const statsData = await statsResponse.json();
      setStats(statsData.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/location-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      setSuccess('Configuration saved successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const addBlockedCountry = () => {
    if (!config || !newCountry.trim()) return;
    
    const countryCode = newCountry.trim().toUpperCase();
    if (countryCode.length !== 2) {
      setError('Country code must be 2 characters (ISO 3166-1 alpha-2)');
      return;
    }

    if (!config.blockedCountries.includes(countryCode)) {
      setConfig({
        ...config,
        blockedCountries: [...config.blockedCountries, countryCode]
      });
    }
    setNewCountry('');
  };

  const removeBlockedCountry = (country: string) => {
    if (!config) return;
    setConfig({
      ...config,
      blockedCountries: config.blockedCountries.filter(c => c !== country)
    });
  };

  const addWhitelistIp = () => {
    if (!config || !newIp.trim()) return;

    const ip = newIp.trim();
    if (!config.whitelistIps.includes(ip)) {
      setConfig({
        ...config,
        whitelistIps: [...config.whitelistIps, ip]
      });
    }
    setNewIp('');
  };

  const removeWhitelistIp = (ip: string) => {
    if (!config) return;
    setConfig({
      ...config,
      whitelistIps: config.whitelistIps.filter(i => i !== ip)
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-600">Loading configuration...</span>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>Failed to load location blocking configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Location-Based Blocking</h1>
              <p className="text-gray-600">Configure geographic access restrictions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Basic Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Enable Location Blocking
                </label>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Fail Open Mode
                </label>
                <input
                  type="checkbox"
                  checked={config.failOpen}
                  onChange={(e) => setConfig({ ...config, failOpen: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Threshold (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.riskThreshold}
                  onChange={(e) => setConfig({ ...config, riskThreshold: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low Risk</span>
                  <span className="font-medium">{config.riskThreshold}</span>
                  <span>High Risk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detection Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detection Settings</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Block VPN</label>
                <input
                  type="checkbox"
                  checked={config.blockVpn}
                  onChange={(e) => setConfig({ ...config, blockVpn: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Block Proxy</label>
                <input
                  type="checkbox"
                  checked={config.blockProxy}
                  onChange={(e) => setConfig({ ...config, blockProxy: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Block Datacenter</label>
                <input
                  type="checkbox"
                  checked={config.blockDatacenter}
                  onChange={(e) => setConfig({ ...config, blockDatacenter: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Blocked Countries */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Blocked Countries
            </h2>
            
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Country code (e.g., CN, RU)"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  maxLength={2}
                />
                <button
                  onClick={addBlockedCountry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Block
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {config.blockedCountries.map((country) => (
                <div key={country} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded">
                  <span className="font-mono text-sm">{country}</span>
                  <button
                    onClick={() => removeBlockedCountry(country)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics and Monitoring */}
        <div className="space-y-6">
          {/* Statistics */}
          {stats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</div>
                  <div className="text-sm text-blue-700">Total Attempts</div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.blockedAttempts}</div>
                  <div className="text-sm text-red-700">Blocked Attempts</div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.avgRiskScore.toFixed(1)}</div>
                  <div className="text-sm text-yellow-700">Avg Risk Score</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.vpnAttempts}</div>
                  <div className="text-sm text-purple-700">VPN Attempts</div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Top Blocked Countries</h3>
                <div className="space-y-2">
                  {stats.topBlockedCountries.map((item) => (
                    <div key={item.country} className="flex justify-between items-center">
                      <span className="font-mono text-sm">{item.country}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* IP Whitelist */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">IP Whitelist</h2>
            
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="IP address or CIDR"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={addWhitelistIp}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {config.whitelistIps.map((ip) => (
                <div key={ip} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                  <span className="font-mono text-sm">{ip}</span>
                  <button
                    onClick={() => removeWhitelistIp(ip)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
