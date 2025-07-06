/**
 * Rollout Dashboard for monitoring and controlling feature flag rollout
 */

import React, { useState, useEffect } from 'react';
import { RolloutManager } from '../../shared/services/rollout/RolloutManager';
import { AlertManager } from '../../shared/services/rollout/alerts/AlertManager';
import { MonitoringFactory } from '../../shared/services/monitoring/MonitoringFactory';
import { 
  RolloutState, 
  RolloutMetrics, 
  HealthCheckResult,
  RolloutStage,
  RolloutHistoryEntry 
} from '../../shared/services/rollout/types';
import { Alert } from '../../shared/services/rollout/alerts/AlertManager';
import { ROLLOUT_STAGES, STAGE_ORDER } from '../../shared/services/rollout/config';

const RolloutDashboard: React.FC = () => {
  const [state, setState] = useState<RolloutState | null>(null);
  const [metrics, setMetrics] = useState<RolloutMetrics | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  
  // Initialize managers
  const rolloutManager = RolloutManager.getInstance();
  const alertManager = AlertManager.getInstance(MonitoringFactory.createAdapter());
  
  // Fetch data
  const fetchData = async () => {
    try {
      const [currentState, currentMetrics, healthResult] = await Promise.all([
        Promise.resolve(rolloutManager.getState()),
        rolloutManager.getMetrics(),
        rolloutManager.performHealthCheck()
      ]);
      
      setState(currentState);
      setMetrics(currentMetrics);
      setHealthCheck(healthResult);
      setActiveAlerts(alertManager.getActiveAlerts());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Actions
  const handleStart = () => {
    rolloutManager.start();
    fetchData();
  };
  
  const handlePause = () => {
    rolloutManager.pause();
    fetchData();
  };
  
  const handleProgress = async () => {
    await rolloutManager.progressToNextStage();
    fetchData();
  };
  
  const handleRollback = async () => {
    const reason = prompt('Enter rollback reason:');
    if (reason) {
      await rolloutManager.rollback(reason);
      fetchData();
    }
  };
  
  const handleAcknowledgeAlert = (alertId: string) => {
    alertManager.acknowledgeAlert(alertId);
    fetchData();
  };
  
  const handleResolveAlert = (alertId: string) => {
    alertManager.resolveAlert(alertId);
    fetchData();
  };
  
  const handleResetCircuitBreaker = () => {
    alertManager.resetCircuitBreaker();
    fetchData();
  };
  
  if (isLoading) {
    return <div className="p-8">Loading rollout dashboard...</div>;
  }
  
  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }
  
  if (!state || !metrics) {
    return <div className="p-8">No rollout data available</div>;
  }
  
  // Render helpers
  const getStageColor = (stage: RolloutStage) => {
    switch (stage) {
      case 'shadow': return 'bg-gray-500';
      case 'canary': return 'bg-yellow-500';
      case 'expansion': return 'bg-blue-500';
      case 'majority': return 'bg-green-500';
      case 'full': return 'bg-green-700';
      case 'rollback': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };
  
  const getHealthColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };
  
  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString();
  };
  
  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  };
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rollout Dashboard</h1>
        <p className="text-gray-600">Monitor and control unified evaluation system rollout</p>
      </div>
      
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Controls</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleStart}
            disabled={state.currentStage === 'rollback' || !state.isPaused}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
          >
            Start
          </button>
          <button
            onClick={handlePause}
            disabled={state.isPaused}
            className="px-4 py-2 bg-yellow-600 text-white rounded disabled:bg-gray-400"
          >
            Pause
          </button>
          <button
            onClick={handleProgress}
            disabled={state.isPaused || state.currentStage === 'full'}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Progress to Next Stage
          </button>
          <button
            onClick={handleRollback}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Emergency Rollback
          </button>
        </div>
        <div className="flex gap-4 items-center">
          <label className="text-sm">
            Refresh interval:
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="ml-2 border rounded px-2 py-1"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </label>
          {alertManager.isCircuitBreakerTripped() && (
            <button
              onClick={handleResetCircuitBreaker}
              className="px-3 py-1 bg-orange-600 text-white rounded text-sm"
            >
              Reset Circuit Breaker
            </button>
          )}
        </div>
      </div>
      
      {/* Current State */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current State</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Stage</div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStageColor(state.currentStage)}`} />
              <span className="font-medium">{ROLLOUT_STAGES[state.currentStage]?.displayName || state.currentStage}</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Percentage</div>
            <div className="font-medium">{state.currentPercentage}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Health</div>
            <div className={`font-medium ${getHealthColor(state.isHealthy)}`}>
              {state.isHealthy ? '✓ Healthy' : '✗ Unhealthy'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className="font-medium">{state.isPaused ? '⏸ Paused' : '▶ Running'}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-600">Time in Stage</div>
          <div className="font-medium">{formatDuration(Date.now() - state.stageStartTime)}</div>
        </div>
      </div>
      
      {/* Stage Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Stage Progress</h2>
        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-2 bg-gray-200 rounded" />
          <div className="relative flex justify-between">
            {STAGE_ORDER.map((stage, index) => {
              const isActive = stage === state.currentStage;
              const isPast = STAGE_ORDER.indexOf(state.currentStage) > index;
              const config = ROLLOUT_STAGES[stage];
              
              return (
                <div key={stage} className="text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold relative z-10 ${
                      isActive ? getStageColor(stage as RolloutStage) :
                      isPast ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    {isPast ? '✓' : index + 1}
                  </div>
                  <div className="mt-2 text-xs">{config.displayName}</div>
                  <div className="text-xs text-gray-500">{config.minPercentage}-{config.maxPercentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Active Alerts ({activeAlerts.length})</h2>
          <div className="space-y-3">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 border rounded">
                <div className={`px-2 py-1 rounded text-white text-xs ${getSeverityColor(alert.severity)}`}>
                  {alert.severity.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{alert.type}</div>
                  <div className="text-sm text-gray-600">{alert.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(alert.timestamp)}
                    {alert.acknowledgedAt && ' • Acknowledged'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!alert.acknowledgedAt && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Discrepancies */}
          <div>
            <h3 className="font-medium mb-2">Discrepancies</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Critical:</span>
                <span className={metrics.discrepancies.critical > 0 ? 'text-red-600 font-bold' : ''}>
                  {metrics.discrepancies.critical}
                </span>
              </div>
              <div className="flex justify-between">
                <span>High:</span>
                <span className={metrics.discrepancies.high > 0 ? 'text-orange-600' : ''}>
                  {metrics.discrepancies.high}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Medium:</span>
                <span>{metrics.discrepancies.medium}</span>
              </div>
              <div className="flex justify-between">
                <span>Low:</span>
                <span>{metrics.discrepancies.low}</span>
              </div>
            </div>
          </div>
          
          {/* Performance */}
          <div>
            <h3 className="font-medium mb-2">Performance</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Canary P99:</span>
                <span>{metrics.performance.canaryLatencyP99.toFixed(1)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Baseline P99:</span>
                <span>{metrics.performance.baselineLatencyP99.toFixed(1)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Degradation:</span>
                <span className={metrics.performance.latencyDegradation > 0 ? 'text-orange-600' : 'text-green-600'}>
                  {metrics.performance.latencyDegradation > 0 ? '+' : ''}{metrics.performance.latencyDegradation.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Stability */}
          <div>
            <h3 className="font-medium mb-2">Stability</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Canary Errors:</span>
                <span>{metrics.stability.canaryErrorRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Baseline Errors:</span>
                <span>{metrics.stability.baselineErrorRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Delta:</span>
                <span className={metrics.stability.errorRateDelta > 0 ? 'text-orange-600' : 'text-green-600'}>
                  {metrics.stability.errorRateDelta > 0 ? '+' : ''}{metrics.stability.errorRateDelta.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Volume */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium mb-2">Traffic Volume</h3>
          <div className="flex gap-6 text-sm">
            <div>Total: {metrics.volume.totalRequests}</div>
            <div>Canary: {metrics.volume.canaryRequests}</div>
            <div>Baseline: {metrics.volume.baselineRequests}</div>
          </div>
        </div>
      </div>
      
      {/* Health Check */}
      {healthCheck && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Latest Health Check</h2>
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className={`font-medium ${getHealthColor(healthCheck.isHealthy)}`}>
                {healthCheck.isHealthy ? '✓ Healthy' : '✗ Unhealthy'}
              </div>
              <div>
                Recommendation: <span className="font-medium">{healthCheck.recommendation}</span>
              </div>
              {healthCheck.shouldRollback && (
                <div className="text-red-600 font-bold">ROLLBACK REQUIRED</div>
              )}
            </div>
            {healthCheck.details && (
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                {healthCheck.details}
              </pre>
            )}
          </div>
        </div>
      )}
      
      {/* History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent History</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {state.history.slice(-20).reverse().map((entry, index) => (
            <div key={index} className="flex gap-4 text-sm py-1 border-b">
              <div className="text-gray-500 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</div>
              <div className={`px-2 py-0.5 rounded text-xs ${getStageColor(entry.stage)}`}>
                {entry.stage}
              </div>
              <div>{entry.percentage}%</div>
              <div className="font-medium">{entry.action}</div>
              {entry.reason && <div className="text-gray-600">- {entry.reason}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RolloutDashboard;