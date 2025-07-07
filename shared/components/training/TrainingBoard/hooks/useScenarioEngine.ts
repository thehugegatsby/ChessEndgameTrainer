import { useState, useEffect } from 'react';
import { ErrorService } from '@shared/services/errorService';

export interface UseScenarioEngineOptions {
  initialFen: string;
  onError?: (error: string) => void;
}

export interface UseScenarioEngineReturn {
  scenarioEngine: any | null;
  isEngineReady: boolean;
  engineError: string | null;
}

/**
 * Custom hook for managing ScenarioEngine lifecycle
 * Handles initialization, cleanup, and error states
 */
export const useScenarioEngine = ({ 
  initialFen, 
  onError 
}: UseScenarioEngineOptions): UseScenarioEngineReturn => {
  const [scenarioEngine, setScenarioEngine] = useState<any>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initEngine = async () => {
      try {
        setEngineError(null);
        setIsEngineReady(false);

        
        const { ScenarioEngine } = await import('../../../../lib/chess/ScenarioEngine');
        
        if (!mounted) return; // Component unmounted during import
        
        const engine = new ScenarioEngine(initialFen);
        
        setScenarioEngine(engine);
        setIsEngineReady(true);
        
      } catch (error) {
        const userMessage = ErrorService.handleChessEngineError(error as Error, {
          component: 'useScenarioEngine',
          action: 'loadEngine',
          additionalData: { initialFen }
        });
        
        setEngineError(userMessage);
        
        if (onError) {
          onError(userMessage);
        }
      }
    };

    initEngine();

    return () => {
      mounted = false;
      
      if (scenarioEngine) {
        try {
          scenarioEngine.quit();
        } catch (error) {
        }
      }
    };
  }, [initialFen, onError]);

  return {
    scenarioEngine,
    isEngineReady,
    engineError
  };
}; 