/**
 * Hook for managed access to Chess Engine
 * Uses EngineService singleton for proper resource management
 */

import { useEffect, useRef, useState } from 'react';
import { EngineService } from '@shared/services/chess/EngineService';
import type { IChessEngine } from '@shared/lib/chess/IChessEngine';
import { ErrorService } from '@shared/services/errorService';

interface UseEngineOptions {
  autoCleanup?: boolean;
}

export function useEngine(options: UseEngineOptions = {}) {
  const { autoCleanup = true } = options;
  const [engine, setEngine] = useState<IChessEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const engineServiceRef = useRef<EngineService>();

  useEffect(() => {
    let isMounted = true;

    const initializeEngine = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get singleton instance - no need for getEngine() call
        engineServiceRef.current = EngineService.getInstance();
        
        if (isMounted) {
          setEngine(engineServiceRef.current);
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
      // No need to release - singleton manages its own lifecycle
    };
  }, [autoCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCleanup && engineServiceRef.current) {
        // Clean terminate if requested
        engineServiceRef.current.terminate().catch((error) => {
          ErrorService.handleChessEngineError(error, { component: 'useEngine', action: 'cleanup' });
        });
      }
    };
  }, []);

  const forceCleanup = async () => {
    if (engineServiceRef.current) {
      await engineServiceRef.current.terminate();
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