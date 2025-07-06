/**
 * Feature Flag Dashboard
 * Shows current feature flag status and allows testing different configurations
 */

import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { FeatureFlagService } from '../../shared/services/featureFlags/FeatureFlagService';
import { useAllFeatureFlags } from '../../shared/hooks/useFeatureFlag';

const FeatureFlagsPage: NextPage = () => {
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [customUserId, setCustomUserId] = useState('');
  const [metricsReport, setMetricsReport] = useState<any>(null);
  
  // Get all flags with current context
  const { flags, isLoading } = useAllFeatureFlags(customUserId || undefined);
  
  // Get session ID from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSessionId = window.sessionStorage.getItem('chess_trainer_session_id') || 'none';
      setSessionId(storedSessionId);
    }
  }, []);
  
  // Update metrics report
  useEffect(() => {
    const updateMetrics = () => {
      const service = FeatureFlagService.getInstance();
      setMetricsReport(service.getMetricsReport());
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const testFlag = (flagName: string, testUserId?: string) => {
    const service = FeatureFlagService.getInstance();
    const context = {
      userId: testUserId,
      sessionId: sessionId !== 'none' ? sessionId : undefined
    };
    
    return service.isFeatureEnabled(flagName, context);
  };
  
  const clearCache = () => {
    const service = FeatureFlagService.getInstance();
    service.clearCache();
    window.location.reload();
  };
  
  if (isLoading) {
    return <div className="p-4">Loading feature flags...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Feature Flags Dashboard</h1>
        
        {/* Current Context */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Context</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Session ID</p>
              <p className="font-mono">{sessionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Test User ID</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                  placeholder="Enter user ID to test"
                  className="px-3 py-1 border rounded flex-1"
                />
                <button
                  onClick={clearCache}
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature Flags */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Feature Flags</h2>
          <div className="space-y-4">
            {metricsReport?.flags.map((flag: any) => (
              <div key={flag.name} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{flag.name}</h3>
                    {flag.config?.description && (
                      <p className="text-sm text-gray-600">{flag.config.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      flags[flag.name] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {flags[flag.name] ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </div>
                
                {flag.config && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Global Status:</span>
                      <span className="ml-2 font-medium">
                        {flag.config.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rollout:</span>
                      <span className="ml-2 font-medium">
                        {flag.config.rolloutPercentage}%
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Test with different users */}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Test with different users:</p>
                  <div className="flex gap-2 flex-wrap">
                    {['user1', 'user2', 'user3', 'user4', 'user5'].map(testUser => {
                      const enabled = testFlag(flag.name, testUser);
                      return (
                        <span
                          key={testUser}
                          className={`px-2 py-1 rounded text-xs ${
                            enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {testUser}: {enabled ? '✓' : '✗'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Evaluation Metrics</h2>
          {metricsReport && Object.keys(metricsReport.evaluations).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(metricsReport.evaluations).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 break-all">{key}</p>
                  <p className="text-xl font-semibold">{value as number}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No evaluations yet. Navigate around the app to see metrics.</p>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Cache Size: {metricsReport?.cacheSize || 0} entries</p>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Feature Flag Configuration</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Flags are configured in <code className="bg-blue-100 px-1 rounded">shared/services/featureFlags/config/feature-flags.json</code></li>
            <li>Users are deterministically assigned to rollout groups using SHA-256 hashing</li>
            <li>The same user will always see the same feature state (sticky assignment)</li>
            <li>Anonymous users are tracked via session ID stored in sessionStorage</li>
            <li>Set <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_USE_CONFIG_FLAGS=true</code> to use config file in development</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagsPage;