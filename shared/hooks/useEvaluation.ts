/**
 * Evaluation hook using the unified evaluation system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { EvaluationData } from '@shared/types';
import { UnifiedEvaluationService } from '@shared/lib/chess/evaluation/unifiedService';
import { EngineProviderAdapter, TablebaseProviderAdapter } from '@shared/lib/chess/evaluation/providerAdapters';
import { LRUCache } from '@shared/lib/cache/LRUCache';
import { LRUCacheAdapter } from '@shared/lib/chess/evaluation/cacheAdapter';
import type { FormattedEvaluation } from '@shared/types/evaluation';

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
 * Main evaluation hook implementation
 */
export function useEvaluation({ fen, isEnabled, previousFen }: UseEvaluationOptions): UseEvaluationReturn {
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