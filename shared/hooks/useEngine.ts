/**
 * Hook for managed access to ScenarioEngine instances
 * Uses EngineService for proper resource management
 */

import { useEffect, useRef, useState } from 'react';
import { EngineService } from '@shared/services';
import { ScenarioEngine } from '@shared/lib/chess/ScenarioEngine';

interface UseEngineOptions {
  id?: string;
  autoCleanup?: boolean;
}

export function useEngine(options: UseEngineOptions = {}) {
  const { id = 'default', autoCleanup = true } = options;
  const [engine, setEngine] = useState<ScenarioEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const engineServiceRef = useRef<EngineService>();

  useEffect(() => {
    let isMounted = true;

    const initializeEngine = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        engineServiceRef.current = EngineService.getInstance();
        const engineInstance = await engineServiceRef.current.getEngine(id);
        
        if (isMounted) {
          setEngine(engineInstance);
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
      if (autoCleanup && engineServiceRef.current) {
        engineServiceRef.current.releaseEngine(id);
      }
    };
  }, [id, autoCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCleanup && engineServiceRef.current) {
        engineServiceRef.current.releaseEngine(id);
      }
    };
  }, []);

  const getStats = () => {
    return engineServiceRef.current?.getStats() || {
      totalEngines: 0,
      activeEngines: 0,
      engineIds: []
    };
  };

  const forceCleanup = async () => {
    if (engineServiceRef.current) {
      await engineServiceRef.current.cleanupEngine(id);
      setEngine(null);
    }
  };

  return {
    engine,
    isLoading,
    error,
    getStats,
    forceCleanup
  };
}