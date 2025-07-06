/**
 * Wrapper hook for evaluation that delegates to either legacy or unified system
 * based on feature flag. This ensures Rules of Hooks compliance while allowing
 * gradual migration.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FEATURE_FLAGS } from '@shared/constants';
import { FeatureFlagService } from '@shared/services/featureFlags/FeatureFlagService';
import { EvaluationData } from '@shared/types';
import { UnifiedEvaluationService } from '@shared/lib/chess/evaluation/unifiedService';
import { EngineProviderAdapter, TablebaseProviderAdapter } from '@shared/lib/chess/evaluation/providerAdapters';
import { LRUCache } from '@shared/lib/cache/LRUCache';
import { LRUCacheAdapter } from '@shared/lib/chess/evaluation/cacheAdapter';
import type { FormattedEvaluation } from '@shared/types/evaluation';
import { useEvaluation as useLegacyEvaluation } from './useEvaluationOptimized';

interface UseEvaluationOptions {
  fen: string;
  isEnabled: boolean;
  previousFen?: string;
}

interface UseEvaluationReturn {
  evaluations: EvaluationData[];
  lastEvaluation: EvaluationData | null;
  isEvaluating: boolean;
  error: string | null;
  addEvaluation: (evaluation: EvaluationData) => void;
  clearEvaluations: () => void;
  cacheStats?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

// Singleton unified service instance for consistent behavior
let unifiedServiceInstance: UnifiedEvaluationService | null = null;

function getUnifiedService(): UnifiedEvaluationService {
  if (!unifiedServiceInstance) {
    const lruCache = new LRUCache<FormattedEvaluation>(200);
    const cache = new LRUCacheAdapter(lruCache);
    const engineProvider = new EngineProviderAdapter();
    const tablebaseProvider = new TablebaseProviderAdapter();
    
    unifiedServiceInstance = new UnifiedEvaluationService(
      engineProvider,
      tablebaseProvider,
      cache
    );
  }
  return unifiedServiceInstance;
}

/**
 * Unified evaluation hook that uses the new pipeline
 */
function useUnifiedEvaluation({ fen, isEnabled, previousFen }: UseEvaluationOptions): UseEvaluationReturn {
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const service = getUnifiedService();
  const abortControllerRef = useRef<AbortController | null>(null);

  const addEvaluation = useCallback((evaluation: EvaluationData) => {
    setEvaluations(prev => [...prev, evaluation]);
    setLastEvaluation(evaluation);
  }, []);

  const clearEvaluations = useCallback(() => {
    setEvaluations([]);
    setLastEvaluation(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isEnabled || !fen) {
      return;
    }

    // Cancel any pending evaluation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const evaluatePosition = async () => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      setIsEvaluating(true);
      setError(null);

      try {
        // Get player perspective from FEN
        const fenParts = fen.split(' ');
        const playerToMove = fenParts[1] as 'w' | 'b';
        
        // Get formatted evaluation from unified service
        const formattedEval = await service.getFormattedEvaluation(fen, playerToMove);
        
        if (abortController.signal.aborted) {
          return;
        }

        // Convert formatted evaluation to legacy format
        const evaluation: EvaluationData = {
          evaluation: parseFloat(formattedEval.mainText.replace(/[+M]/g, '')) * 100, // Convert to centipawns
          mateInMoves: formattedEval.metadata.isMate ? 
            parseInt(formattedEval.mainText.replace(/[M+-]/g, '')) : undefined
        };

        // Handle tablebase data if available
        if (formattedEval.metadata.isTablebase && previousFen) {
          // Get tablebase comparison
          const prevPerspectiveEval = await service.getPerspectiveEvaluation(previousFen, playerToMove);
          const currPerspectiveEval = await service.getPerspectiveEvaluation(fen, playerToMove);
          
          if (prevPerspectiveEval.isTablebasePosition && currPerspectiveEval.isTablebasePosition) {
            evaluation.tablebase = {
              isTablebasePosition: true,
              wdlBefore: prevPerspectiveEval.perspectiveWdl || undefined,
              wdlAfter: currPerspectiveEval.perspectiveWdl || undefined,
              category: formattedEval.metadata.isDrawn ? 'draw' : 
                       formattedEval.className === 'winning' ? 'win' : 'loss',
              dtz: currPerspectiveEval.perspectiveDtz || undefined
            };
          }
        }

        if (!abortController.signal.aborted) {
          addEvaluation(evaluation);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Unified evaluation failed:', err);
          setError(err.message || 'Evaluation failed');
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsEvaluating(false);
        }
      }
    };

    evaluatePosition();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fen, isEnabled, previousFen, service, addEvaluation]);

  return {
    evaluations,
    lastEvaluation,
    isEvaluating,
    error,
    addEvaluation,
    clearEvaluations,
    cacheStats: undefined // TODO: Expose cache stats from unified service
  };
}

/**
 * Main evaluation hook that delegates based on feature flag
 */
export function useEvaluation(options: UseEvaluationOptions): UseEvaluationReturn {
  // Always call both hooks to maintain hook order (Rules of Hooks)
  const legacyResult = useLegacyEvaluation(options);
  const unifiedResult = useUnifiedEvaluation(options);

  // Check feature flag with user context
  const [useUnified, setUseUnified] = useState(FEATURE_FLAGS.USE_UNIFIED_EVALUATION_SYSTEM);
  
  useEffect(() => {
    // Get feature flag service and evaluate with context
    const service = FeatureFlagService.getInstance();
    const context = {
      // In a real app, you'd get userId from auth context
      userId: undefined,
      sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('chess_trainer_session_id') || undefined : undefined
    };
    
    const shouldUseUnified = service.isFeatureEnabled('USE_UNIFIED_EVALUATION_SYSTEM', context);
    setUseUnified(shouldUseUnified);
  }, []);

  // Return the appropriate result based on feature flag
  if (useUnified) {
    return unifiedResult;
  }
  
  return legacyResult;
}