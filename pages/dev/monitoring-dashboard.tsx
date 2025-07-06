/**
 * Monitoring Dashboard for Evaluation System Migration
 * Displays real-time metrics and discrepancy reports
 */

import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { MonitoringFactory } from '../../shared/services/monitoring/MonitoringFactory';
import { DiscrepancyMonitor } from '../../shared/services/monitoring/DiscrepancyMonitor';

const MonitoringDashboard: NextPage = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    const updateMetrics = () => {
      const report = MonitoringFactory.getMetricsReport();
      const monitor = DiscrepancyMonitor.getInstance();
      const stats = monitor.getStatistics();
      
      setMetrics({
        ...report,
        monitorStats: stats
      });
    };

    updateMetrics();

    if (autoRefresh) {
      const interval = setInterval(updateMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (!metrics) {
    return <div className="p-4">Loading metrics...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Evaluation System Monitoring Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-1 rounded border"
              disabled={!autoRefresh}
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Discrepancy Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Discrepancies</h3>
            <p className="text-3xl font-bold">{metrics.discrepancies.total}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Critical</h3>
            <p className="text-3xl font-bold text-red-600">
              {metrics.discrepancies.bySeverity.critical || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">High</h3>
            <p className="text-3xl font-bold text-orange-600">
              {metrics.discrepancies.bySeverity.high || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Medium</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {metrics.discrepancies.bySeverity.medium || 0}
            </p>
          </div>
        </div>

        {/* Discrepancy Types */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Discrepancy Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(metrics.discrepancies.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">{type.replace(/_/g, ' ')}</span>
                <span className="text-lg font-semibold">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Latency Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Latency Metrics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Operation</th>
                  <th className="text-right py-2">Count</th>
                  <th className="text-right py-2">Avg (ms)</th>
                  <th className="text-right py-2">Min (ms)</th>
                  <th className="text-right py-2">Max (ms)</th>
                  <th className="text-right py-2">P95 (ms)</th>
                  <th className="text-right py-2">P99 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.latencies).map(([operation, stats]: [string, any]) => (
                  <tr key={operation} className="border-b">
                    <td className="py-2">{operation}</td>
                    <td className="text-right">{stats.count}</td>
                    <td className="text-right">{stats.avg.toFixed(2)}</td>
                    <td className="text-right">{stats.min.toFixed(2)}</td>
                    <td className="text-right">{stats.max.toFixed(2)}</td>
                    <td className="text-right">{stats.p95.toFixed(2)}</td>
                    <td className="text-right">{stats.p99.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Counters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Counters</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(metrics.counters).map(([name, value]) => (
              <div key={name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">{name}</span>
                <span className="text-lg font-semibold">{value as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Discrepancies */}
        {metrics.discrepancies.recent.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Discrepancies</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {metrics.discrepancies.recent.map((d: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold ${
                      d.severity === 'critical' ? 'text-red-600' :
                      d.severity === 'high' ? 'text-orange-600' :
                      d.severity === 'medium' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {d.severity.toUpperCase()} - {d.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(d.context.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="font-mono text-xs truncate">{d.context.fen}</p>
                  <div className="mt-1">
                    {Object.entries(d.context.discrepancies).map(([key, value]) => (
                      <span key={key} className="inline-block mr-3 text-xs">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Summary */}
        {metrics.errors.total > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Errors</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.errors.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {metrics.errors.bySeverity.critical || 0}
                </p>
                <p className="text-sm text-gray-600">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {metrics.errors.bySeverity.error || 0}
                </p>
                <p className="text-sm text-gray-600">Error</p>
              </div>
            </div>
            
            {metrics.errors.recent.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {metrics.errors.recent.map((e: any, i: number) => (
                  <div key={i} className="p-2 bg-red-50 rounded text-sm">
                    <p className="font-semibold text-red-700">{e.message}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(e.context?.timestamp || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Dashboard Information</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>This dashboard shows real-time metrics from the evaluation system migration</li>
            <li>Discrepancies are tracked when both Legacy and Unified systems are run in parallel</li>
            <li>Critical discrepancies indicate significant differences that need immediate attention</li>
            <li>Latency metrics help identify performance impacts of the migration</li>
            <li>Enable monitoring with NEXT_PUBLIC_LOG_EVAL_DISCREPANCIES=true</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;