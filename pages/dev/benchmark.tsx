/**
 * Performance Benchmark Page
 * Interactive UI for running evaluation system benchmarks
 */

import React, { useState, useCallback } from 'react';
import { NextPage } from 'next';
import { BenchmarkRunner } from '../../shared/benchmarks/run-benchmarks';
import { BenchmarkConfig, BenchmarkMetrics } from '../../shared/benchmarks/performance-benchmark';
import { FEATURE_FLAGS } from '../../shared/constants';

interface BenchmarkState {
  isRunning: boolean;
  progress: number;
  currentPhase: string;
  results: {
    legacy?: BenchmarkMetrics;
    unified?: BenchmarkMetrics;
    comparison?: any;
  };
  error?: string;
}

const BenchmarkPage: NextPage = () => {
  const [state, setState] = useState<BenchmarkState>({
    isRunning: false,
    progress: 0,
    currentPhase: '',
    results: {}
  });

  const [config, setConfig] = useState<Partial<BenchmarkConfig>>({
    iterations: 50,
    warmupIterations: 10,
    concurrentRequests: 5
  });

  const runBenchmarks = useCallback(async () => {
    setState({
      isRunning: true,
      progress: 0,
      currentPhase: 'Initializing...',
      results: {},
      error: undefined
    });

    try {
      const runner = new BenchmarkRunner(config);
      
      // Simulate progress updates
      const updateProgress = (phase: string, progress: number) => {
        setState(prev => ({
          ...prev,
          currentPhase: phase,
          progress
        }));
      };

      updateProgress('Running warmup...', 10);
      
      // Run actual benchmarks
      const results = await runner.runBenchmarks();
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        progress: 100,
        currentPhase: 'Complete!',
        results: {
          legacy: results.legacy,
          unified: results.unified,
          comparison: results.comparison
        }
      }));

      // Export results
      runner.exportResults(results);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [config]);

  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(1);
    if (value > 0) {
      return <span className="text-green-600">+{formatted}%</span>;
    } else if (value < 0) {
      return <span className="text-red-600">{formatted}%</span>;
    }
    return <span>{formatted}%</span>;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Evaluation System Performance Benchmarks</h1>
        
        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Benchmark Configuration</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Iterations
              </label>
              <input
                type="number"
                value={config.iterations}
                onChange={(e) => setConfig(prev => ({ ...prev, iterations: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded"
                min="10"
                max="1000"
                disabled={state.isRunning}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Warmup Iterations
              </label>
              <input
                type="number"
                value={config.warmupIterations}
                onChange={(e) => setConfig(prev => ({ ...prev, warmupIterations: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded"
                min="5"
                max="50"
                disabled={state.isRunning}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Concurrent Requests
              </label>
              <input
                type="number"
                value={config.concurrentRequests}
                onChange={(e) => setConfig(prev => ({ ...prev, concurrentRequests: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded"
                min="1"
                max="20"
                disabled={state.isRunning}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Current Feature Flag: USE_UNIFIED_EVALUATION_SYSTEM = {' '}
              <span className={FEATURE_FLAGS.USE_UNIFIED_EVALUATION_SYSTEM ? 'text-green-600' : 'text-red-600'}>
                {FEATURE_FLAGS.USE_UNIFIED_EVALUATION_SYSTEM ? 'true' : 'false'}
              </span>
            </div>
            
            <button
              onClick={runBenchmarks}
              disabled={state.isRunning}
              className={`px-6 py-2 rounded font-medium ${
                state.isRunning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {state.isRunning ? 'Running...' : 'Run Benchmarks'}
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {state.isRunning && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium mb-2">{state.currentPhase}</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">Error: {state.error}</p>
          </div>
        )}
        
        {/* Results Display */}
        {state.results.comparison && (
          <div className="space-y-8">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Results Summary</h2>
              
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">
                  {formatPercentage(state.results.comparison.overallScore)}
                </div>
                <div className="text-xl text-gray-600">
                  Overall Performance {state.results.comparison.overallScore > 0 ? 'Improvement' : 'Regression'}
                </div>
                <div className="mt-2">
                  {state.results.comparison.overallScore > 0 ? (
                    <span className="text-green-600 font-semibold">✅ Unified system performs better!</span>
                  ) : (
                    <span className="text-red-600 font-semibold">❌ Legacy system performs better!</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Response Time</div>
                  <div className="text-2xl font-semibold">
                    {formatPercentage(state.results.comparison.responseTimeImprovement)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600">Memory Usage</div>
                  <div className="text-2xl font-semibold">
                    {formatPercentage(state.results.comparison.memoryImprovement)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600">Cache Hit Rate</div>
                  <div className="text-2xl font-semibold">
                    {formatPercentage(state.results.comparison.cacheHitImprovement)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600">Concurrency</div>
                  <div className="text-2xl font-semibold">
                    {formatPercentage(state.results.comparison.concurrencyImprovement)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Legacy System */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Legacy System</h3>
                
                {state.results.legacy && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Avg Response Time:</span>{' '}
                      {state.results.legacy.responseTime.avg.toFixed(2)}ms
                    </div>
                    <div>
                      <span className="font-medium">P95 Response Time:</span>{' '}
                      {state.results.legacy.responseTime.p95.toFixed(2)}ms
                    </div>
                    <div>
                      <span className="font-medium">Memory Usage:</span>{' '}
                      {(state.results.legacy.memory.heapUsed / 1024 / 1024).toFixed(1)} MB
                    </div>
                    <div>
                      <span className="font-medium">Cache Hit Rate:</span>{' '}
                      {(state.results.legacy.cache.hitRate * 100).toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-medium">Concurrent Success:</span>{' '}
                      {(state.results.legacy.concurrency.successRate * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
              
              {/* Unified System */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Unified System</h3>
                
                {state.results.unified && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Avg Response Time:</span>{' '}
                      {state.results.unified.responseTime.avg.toFixed(2)}ms
                    </div>
                    <div>
                      <span className="font-medium">P95 Response Time:</span>{' '}
                      {state.results.unified.responseTime.p95.toFixed(2)}ms
                    </div>
                    <div>
                      <span className="font-medium">Memory Usage:</span>{' '}
                      {(state.results.unified.memory.heapUsed / 1024 / 1024).toFixed(1)} MB
                    </div>
                    <div>
                      <span className="font-medium">Cache Hit Rate:</span>{' '}
                      {(state.results.unified.cache.hitRate * 100).toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-medium">Concurrent Success:</span>{' '}
                      {(state.results.unified.concurrency.successRate * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BenchmarkPage;