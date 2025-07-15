import { useState, useCallback, useEffect, useRef } from 'react';
import { useEvaluationCache } from '../context/EngineContext';
import type { EvaluationResult } from '../lib/chess/engine/simple/SimpleEngine';
import { Move as ChessJsMove } from 'chess.js';

interface UseSimpleEngineReturn {
  evaluation: EvaluationResult | null;
  bestMove: ChessJsMove | null;
  isLoading: boolean;
  error: string | null;
  evaluatePosition: (fen: string) => Promise<void>;
  findBestMove: (fen: string) => Promise<void>;
  clearCache: () => void;
}

export function useSimpleEngine(): UseSimpleEngineReturn {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [bestMove, setBestMove] = useState<ChessJsMove | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get EvaluationCache instance from context
  const evaluationCache = useEvaluationCache();

  const evaluatePosition = useCallback(async (fen: string) => {
    // Cancel any pending evaluation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await evaluationCache.evaluatePositionCached(fen);
      
      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }
      
      setEvaluation(result);
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [evaluationCache]);

  const findBestMove = useCallback(async (fen: string): Promise<void> => {
    // Cancel any pending evaluation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    
    try {
      const move = await evaluationCache.getBestMoveCached(fen);
      
      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }
      
      setBestMove(move);
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [evaluationCache]);

  const clearCache = useCallback(() => {
    try {
      evaluationCache.clear();
    } catch (err) {
      // Ignore cache clear errors
    }
  }, [evaluationCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Note: Don't terminate engine here as it's a singleton
      // The engine will be cleaned up when the page unloads
    };
  }, []);

  return {
    evaluation,
    bestMove,
    isLoading,
    error,
    evaluatePosition,
    findBestMove,
    clearCache
  };
}