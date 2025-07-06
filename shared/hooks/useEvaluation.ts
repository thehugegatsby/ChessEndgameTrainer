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
        let evaluationScore: number;
        
        // Handle tablebase evaluations differently
        if (formattedEval.metadata.isTablebase) {
          // For tablebase positions, use 0 as default since actual value comes from WDL
          evaluationScore = 0;
        } else {
          // For engine evaluations, parse the score
          evaluationScore = parseFloat(formattedEval.mainText.replace(/[+M]/g, '')) * 100; // Convert to centipawns
        }
        
        const evaluation: EvaluationData = {
          evaluation: evaluationScore,
          mateInMoves: formattedEval.metadata.isMate ? 
            parseInt(formattedEval.mainText.replace(/[M+-]/g, '')) : undefined
        };

        // Handle tablebase data if available
        
        // Handle tablebase data - either with comparison (if previousFen) or standalone
        if (formattedEval.metadata.isTablebase) {
          if (previousFen) {
            // CASE 1: We have a previous position - do full comparison for move quality
            // CRITICAL: For move comparison, we need the perspective of the player who MADE the move
            // If it's currently black's turn (playerToMove === 'b'), then white just moved
            // If it's currently white's turn (playerToMove === 'w'), then black just moved
            const playerWhoMoved = playerToMove === 'b' ? 'w' : 'b';
            
            
            // Get tablebase comparison from the perspective of the player who made the move
            const prevPerspectiveEval = await service.getPerspectiveEvaluation(previousFen, playerWhoMoved);
            const currPerspectiveEval = await service.getPerspectiveEvaluation(fen, playerWhoMoved);
            
            
            if (prevPerspectiveEval.isTablebasePosition && currPerspectiveEval.isTablebasePosition) {
              evaluation.tablebase = {
                isTablebasePosition: true,
                // CRITICAL: Use RAW WDL values, not perspective-adjusted ones!
                // The getMoveQualityByTablebaseComparison function expects raw API values
                wdlBefore: prevPerspectiveEval.wdl || undefined,
                wdlAfter: currPerspectiveEval.wdl || undefined,
                category: formattedEval.metadata.isDrawn ? 'draw' : 
                         formattedEval.className === 'winning' ? 'win' : 'loss',
                dtz: currPerspectiveEval.dtz || undefined
              };
              
            }
          } else {
            // CASE 2: No previous position (initial position) - just add current tablebase status
            
            const currPerspectiveEval = await service.getPerspectiveEvaluation(fen, playerToMove);
            
            
            if (currPerspectiveEval.isTablebasePosition) {
              evaluation.tablebase = {
                isTablebasePosition: true,
                // For initial position, only wdlAfter is set (use raw WDL)
                wdlAfter: currPerspectiveEval.wdl || undefined,
                category: formattedEval.metadata.isDrawn ? 'draw' : 
                         formattedEval.className === 'winning' ? 'win' : 'loss',
                dtz: currPerspectiveEval.dtz || undefined
              };
              
            }
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