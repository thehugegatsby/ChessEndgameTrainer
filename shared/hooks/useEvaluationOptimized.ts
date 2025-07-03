import { useState, useEffect, useRef, useCallback } from 'react';
import { Move } from 'chess.js';
import { EvaluationData } from '@shared/types';
import { useEngine } from './useEngine';
import { useDebounce } from './useDebounce';
import { LRUCache } from '@shared/lib/cache/LRUCache';

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

// Create singleton cache instance
const evaluationCache = new LRUCache<EvaluationData>(200); // 200 items for mobile

export const useEvaluation = ({ fen, isEnabled, previousFen }: UseEvaluationOptions): UseEvaluationReturn => {
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce FEN changes by 300ms
  const debouncedFen = useDebounce(fen, 300);
  const debouncedPreviousFen = useDebounce(previousFen, 300);
  
  // Use managed engine service
  const { engine, isLoading: engineLoading, error: engineError } = useEngine({
    id: 'evaluation-hook',
    autoCleanup: true
  });
  
  const lastFenRef = useRef<string>('');
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
    if (!isEnabled || !debouncedFen || lastFenRef.current === debouncedFen || !engine || engineLoading) {
      return;
    }

    lastFenRef.current = debouncedFen;
    
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
        // Check cache first
        const cacheKey = `${debouncedFen}:${debouncedPreviousFen || 'none'}`;
        const cachedEvaluation = evaluationCache.get(cacheKey);
        
        if (cachedEvaluation) {
          console.log('📊 useEvaluation - Cache hit for position');
          addEvaluation(cachedEvaluation);
          setIsEvaluating(false);
          return;
        }
        
        console.log('📊 useEvaluation - Cache miss, evaluating position');
        
        // Prepare promises for parallel execution
        const evaluationPromises: Promise<any>[] = [];
        
        // Always evaluate current position
        engine.updatePosition(debouncedFen);
        evaluationPromises.push(engine.getDualEvaluation(debouncedFen));
        
        // If previousFen exists, evaluate it in parallel
        let previousDualEval = null;
        if (debouncedPreviousFen) {
          evaluationPromises.push(
            (async () => {
              engine.updatePosition(debouncedPreviousFen);
              return await engine.getDualEvaluation(debouncedPreviousFen);
            })()
          );
        }
        
        // Execute evaluations in parallel
        const results = await Promise.all(evaluationPromises);
        
        // Check if aborted
        if (abortController.signal.aborted) {
          return;
        }
        
        const dualEvaluation = results[0];
        if (debouncedPreviousFen && results.length > 1) {
          previousDualEval = results[1];
        }
        
        console.log('🔍 useEvaluation - Got dual evaluation:', dualEvaluation);
        
        const evaluation: EvaluationData = {
          evaluation: dualEvaluation.engine.score,
          mateInMoves: dualEvaluation.engine.mate || undefined
        };

        // Handle tablebase data
        if (dualEvaluation.tablebase?.isAvailable && previousDualEval?.tablebase?.isAvailable) {
          evaluation.tablebase = {
            isTablebasePosition: true,
            wdlBefore: previousDualEval.tablebase.result.wdl,
            wdlAfter: dualEvaluation.tablebase.result.wdl,
            category: dualEvaluation.tablebase.result.category,
            dtz: dualEvaluation.tablebase.result.dtz
          };
          
          console.log('🏆 useEvaluation - TABLEBASE COMPARISON AVAILABLE (parallel fetch)');
        } else if (dualEvaluation.tablebase?.isAvailable) {
          evaluation.tablebase = {
            isTablebasePosition: true,
            category: dualEvaluation.tablebase.result.category,
            dtz: dualEvaluation.tablebase.result.dtz
          };
          console.log('📊 useEvaluation - Tablebase position but no comparison available');
        }
        
        // Cache the result
        evaluationCache.set(cacheKey, evaluation);
        
        // Check if aborted before updating state
        if (!abortController.signal.aborted) {
          addEvaluation(evaluation);
        }
        
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Evaluation failed:', err);
          setError(err.message || 'Evaluation failed');
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsEvaluating(false);
        }
      }
    };

    evaluatePosition();
    
    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedFen, isEnabled, debouncedPreviousFen, addEvaluation, engine, engineLoading]);

  // Error handling for engine initialization
  useEffect(() => {
    if (engineError) {
      setError(`Engine initialization failed: ${engineError}`);
    }
  }, [engineError]);

  return {
    evaluations,
    lastEvaluation,
    isEvaluating: isEvaluating || engineLoading,
    error: error || engineError,
    addEvaluation,
    clearEvaluations,
    cacheStats: evaluationCache.getStats()
  };
};