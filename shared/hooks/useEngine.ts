/**
 * Hook for managed access to Chess Engine
 * MIGRATED: Now uses SimpleEngine instead of EngineService
 */

import { useEffect, useRef, useState } from 'react';
import { getSimpleEngine } from '../lib/chess/engine/simple/SimpleEngine';
// import type { EvaluationResult } from '../lib/chess/engine/simple/SimpleEngine';
import { ErrorService } from '@shared/services/errorService';

interface UseEngineOptions {
  autoCleanup?: boolean;
}

// SimpleEngine-compatible interface for backward compatibility
interface EngineCompat {
  findBestMove: (fen: string, options?: any) => Promise<{ move: string; evaluation: number }>;
  evaluatePosition: (fen: string, options?: any) => Promise<{ evaluation: number }>;
  stop: () => Promise<void>;
  terminate: () => void;
}

export function useEngine(options: UseEngineOptions = {}) {
  const { autoCleanup = true } = options;
  const [engine, setEngine] = useState<EngineCompat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<ReturnType<typeof getSimpleEngine> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeEngine = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get SimpleEngine instance
        engineRef.current = getSimpleEngine();
        
        // Create compatibility adapter
        const engineCompat: EngineCompat = {
          findBestMove: async (fen: string, _options?: any) => {
            const move = await engineRef.current!.findBestMove(fen);
            const evaluation = await engineRef.current!.evaluatePosition(fen);
            return { move, evaluation: evaluation.score.value };
          },
          evaluatePosition: async (fen: string, _options?: any) => {
            const result = await engineRef.current!.evaluatePosition(fen);
            return { evaluation: result.score.value };
          },
          stop: async () => {
            // SimpleEngine doesn't have stop method, no-op for compatibility
          },
          terminate: () => {
            engineRef.current!.terminate();
          }
        };
        
        if (isMounted) {
          setEngine(engineCompat);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize engine');
          setIsLoading(false);
        }
      }
    };

    initializeEngine();

    return () => {
      isMounted = false;
    };
  }, [autoCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCleanup && engineRef.current) {
        try {
          engineRef.current.terminate();
        } catch (error) {
          ErrorService.handleChessEngineError(error as Error, { component: 'useEngine', action: 'cleanup' });
        }
      }
    };
  }, []);

  const forceCleanup = async () => {
    if (engineRef.current) {
      engineRef.current.terminate();
      setEngine(null);
    }
  };

  return {
    engine,
    isLoading,
    error,
    forceCleanup
  };
}