/**
 * Staging Test Page for Evaluation System Migration
 * Allows testing both systems side-by-side with real positions
 */

import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { Chess } from 'chess.js';
import { FEATURE_FLAGS, EVALUATION } from '../../shared/constants';
import { BENCHMARK_POSITIONS } from '../../shared/benchmarks/performance-benchmark';
import { useEvaluationWithMonitoring } from '../../shared/hooks/useEvaluationWithMonitoring';
import { DiscrepancyMonitor } from '../../shared/services/monitoring/DiscrepancyMonitor';

// Dynamically import chessboard to avoid SSR issues
const Chessboard = dynamic(
  () => import('react-chessboard').then(mod => mod.Chessboard),
  { ssr: false }
);

interface TestScenario {
  id: string;
  name: string;
  fen: string;
  description: string;
  expectedBehavior: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  ...BENCHMARK_POSITIONS.map(pos => ({
    id: pos.fen,
    name: pos.description,
    fen: pos.fen,
    description: `${pos.type} position`,
    expectedBehavior: 'Both systems should evaluate similarly'
  })),
  {
    id: 'black-perspective',
    name: 'Black Perspective Test',
    fen: '8/8/8/8/8/2k5/8/2KR4 b - - 0 1',
    description: 'Black to move in losing position',
    expectedBehavior: 'Should show correct evaluation from Black perspective'
  },
  {
    id: 'critical-endgame',
    name: 'Critical Endgame',
    fen: '8/8/8/8/4k3/8/4P3/4K3 w - - 0 1',
    description: 'KP vs K - Promotion race',
    expectedBehavior: 'Tablebase should show exact DTM'
  }
];

const StagingTestPage: NextPage = () => {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(TEST_SCENARIOS[0]);
  const [game, setGame] = useState(new Chess(selectedScenario.fen));
  const [showComparison, setShowComparison] = useState(true);
  const [autoTest, setAutoTest] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  
  // Get evaluation with monitoring
  const evaluation = useEvaluationWithMonitoring({
    fen: game.fen(),
    isPlayerTurn: true
  });
  
  // Update game when scenario changes
  useEffect(() => {
    const newGame = new Chess(selectedScenario.fen);
    setGame(newGame);
  }, [selectedScenario]);
  
  // Auto-test functionality
  useEffect(() => {
    if (!autoTest) return;
    
    let currentIndex = TEST_SCENARIOS.findIndex(s => s.id === selectedScenario.id);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % TEST_SCENARIOS.length;
      setSelectedScenario(TEST_SCENARIOS[currentIndex]);
      setTestProgress(((currentIndex + 1) / TEST_SCENARIOS.length) * 100);
      
      if (currentIndex === TEST_SCENARIOS.length - 1) {
        setAutoTest(false);
      }
    }, 3000); // 3 seconds per position
    
    return () => clearInterval(interval);
  }, [autoTest, selectedScenario]);
  
  const formatEvaluation = (score?: number, mate?: number | null) => {
    if (mate !== null && mate !== undefined) {
      return `#${mate}`;
    }
    if (score !== undefined) {
      return (score / 100).toFixed(2);
    }
    return '...';
  };
  
  const getDiscrepancyStats = () => {
    const monitor = DiscrepancyMonitor.getInstance();
    return monitor.getStatistics();
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Staging Test - Evaluation System Migration</h1>
        
        {/* Status Banner */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">System Status</h2>
              <p className="text-sm text-gray-600">
                Active System: {' '}
                <span className={FEATURE_FLAGS.USE_UNIFIED_EVALUATION_SYSTEM ? 'text-green-600' : 'text-blue-600'}>
                  {FEATURE_FLAGS.USE_UNIFIED_EVALUATION_SYSTEM ? 'Unified (New)' : 'Legacy (Old)'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Monitoring: {' '}
                <span className={evaluation.isMonitoring ? 'text-green-600' : 'text-gray-400'}>
                  {evaluation.isMonitoring ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {showComparison ? 'Hide' : 'Show'} Comparison
              </button>
              
              <button
                onClick={() => setAutoTest(!autoTest)}
                className={`px-4 py-2 rounded ${
                  autoTest 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {autoTest ? 'Stop' : 'Start'} Auto Test
              </button>
            </div>
          </div>
          
          {autoTest && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${testProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Test Scenario Selection */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Test Scenarios</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TEST_SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`p-2 rounded text-sm ${
                  selectedScenario.id === scenario.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="font-medium">{selectedScenario.name}</p>
            <p className="text-sm text-gray-600">{selectedScenario.description}</p>
            <p className="text-sm text-blue-600 mt-1">Expected: {selectedScenario.expectedBehavior}</p>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chessboard */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Position</h2>
            <div className="max-w-md mx-auto">
              <Chessboard 
                position={game.fen()}
                arePiecesDraggable={false}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="font-mono text-sm">{game.fen()}</p>
              <p className="text-sm text-gray-600 mt-1">
                {game.turn() === 'w' ? 'White' : 'Black'} to move
              </p>
            </div>
          </div>
          
          {/* Evaluation Results */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Evaluation Results</h2>
            
            {/* Last Evaluation */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Last Evaluation</h3>
              {evaluation.lastEvaluation ? (
                <div className="space-y-1 text-sm">
                  <p>Score: {formatEvaluation(evaluation.lastEvaluation.evaluation, evaluation.lastEvaluation.mateInMoves)}</p>
                  <p>Tablebase: {evaluation.lastEvaluation.tablebase?.isTablebasePosition ? 'Yes' : 'No'}</p>
                  {evaluation.lastEvaluation.tablebase?.isTablebasePosition && (
                    <>
                      <p>WDL Before: {evaluation.lastEvaluation.tablebase.wdlBefore}</p>
                      <p>WDL After: {evaluation.lastEvaluation.tablebase.wdlAfter}</p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>
            
            {/* Evaluation Status */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Status</h3>
              <p className="text-sm">
                Evaluating: {evaluation.isEvaluating ? 'Yes' : 'No'}
              </p>
              {evaluation.error && (
                <p className="text-sm text-red-600">Error: {evaluation.error}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Discrepancy Monitoring */}
        {showComparison && evaluation.monitoringStats && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Discrepancy Monitoring</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{evaluation.monitoringStats.total}</p>
                <p className="text-sm text-gray-600">Total Discrepancies</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {evaluation.monitoringStats.bySeverity.critical}
                </p>
                <p className="text-sm text-gray-600">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {evaluation.monitoringStats.bySeverity.high}
                </p>
                <p className="text-sm text-gray-600">High</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {evaluation.monitoringStats.bySeverity.medium}
                </p>
                <p className="text-sm text-gray-600">Medium</p>
              </div>
            </div>
            
            {evaluation.monitoringStats.recentDiscrepancies.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Recent Discrepancies</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {evaluation.monitoringStats.recentDiscrepancies.map((d: any, i: number) => (
                    <div key={i} className="text-xs p-2 bg-gray-50 rounded">
                      <p className="font-mono">{d.fen.substring(0, 30)}...</p>
                      <p className={`font-medium ${
                        d.severity === 'critical' ? 'text-red-600' :
                        d.severity === 'high' ? 'text-orange-600' :
                        d.severity === 'medium' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        Severity: {d.severity}
                      </p>
                      <p>Issues: {Object.keys(d.discrepancies).join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Testing Instructions</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Select test scenarios or use Auto Test to cycle through all positions</li>
            <li>Monitor evaluation results for consistency between systems</li>
            <li>Check discrepancy monitoring for any critical differences</li>
            <li>To switch systems, set NEXT_PUBLIC_UNIFIED_EVAL environment variable</li>
            <li>Enable detailed logging with NEXT_PUBLIC_LOG_EVAL_DISCREPANCIES=true</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default StagingTestPage;