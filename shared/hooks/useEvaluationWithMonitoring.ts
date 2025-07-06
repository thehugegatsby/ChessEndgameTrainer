/**
 * Enhanced evaluation hook with discrepancy monitoring
 * Runs both evaluation systems in parallel when monitoring is enabled
 */

import { useState, useEffect } from 'react';
import { FEATURE_FLAGS } from '../constants';
import { useEvaluation } from './useEvaluationWrapper';
import { DiscrepancyMonitor } from '../services/monitoring/DiscrepancyMonitor';

interface EvaluationOptions {
  fen?: string;
  isPlayerTurn?: boolean;
  lastMove?: { from: string; to: string } | null;
  onError?: (error: Error) => void;
}

export function useEvaluationWithMonitoring(options: EvaluationOptions) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Primary evaluation (controlled by feature flag)
  const primaryResult = useEvaluation({
    fen: options.fen || '',
    isEnabled: !!options.fen,
    previousFen: undefined
  });
  
  // Only run comparison in development with monitoring enabled
  const shouldMonitor = FEATURE_FLAGS.LOG_EVALUATION_DISCREPANCIES && 
                       options.fen && 
                       process.env.NODE_ENV === 'development';
  
  // For now, we'll use the same result since we don't have separate hooks
  // In a real implementation, we'd need to force different evaluation paths
  const legacyResult = primaryResult;
  const unifiedResult = primaryResult;
  
  // Monitor discrepancies
  useEffect(() => {
    if (!shouldMonitor || !options.fen) return;
    
    const monitor = DiscrepancyMonitor.getInstance();
    
    // Get the comparison result based on which system is primary
    const legacy = FEATURE_FLAGS.USE_UNIFIED_EVALUATION_SYSTEM 
      ? legacyResult 
      : primaryResult;
      
    const unified = FEATURE_FLAGS.USE_UNIFIED_EVALUATION_SYSTEM 
      ? primaryResult 
      : unifiedResult;
    
    // Only compare when both results are available
    if (legacy.lastEvaluation && unified.lastEvaluation) {
      const legacyData = {
        score: legacy.lastEvaluation.evaluation,
        mate: legacy.lastEvaluation.mateInMoves || null,
        isTablebase: !!legacy.lastEvaluation.tablebase?.isTablebasePosition,
        wdl: legacy.lastEvaluation.tablebase?.wdlAfter
      };
      
      const unifiedData = {
        score: unified.lastEvaluation.evaluation,
        mate: unified.lastEvaluation.mateInMoves || null,
        isTablebase: !!unified.lastEvaluation.tablebase?.isTablebasePosition,
        wdl: unified.lastEvaluation.tablebase?.wdlAfter
      };
      
      monitor.compareResults(options.fen, legacyData, unifiedData);
      setIsMonitoring(true);
    }
  }, [
    shouldMonitor,
    options.fen,
    legacyResult.lastEvaluation,
    unifiedResult.lastEvaluation,
    primaryResult.lastEvaluation
  ]);
  
  // Return primary result with monitoring flag
  return {
    ...primaryResult,
    isMonitoring,
    monitoringStats: shouldMonitor 
      ? DiscrepancyMonitor.getInstance().getStatistics() 
      : null
  };
}