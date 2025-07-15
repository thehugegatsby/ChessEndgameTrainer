/**
 * @fileoverview Engine Context for Dependency Injection
 * @version 1.0.0
 * @description React Context for providing EvaluationCache singleton
 * 
 * ARCHITECTURE:
 * - Provides single EvaluationCache instance to entire app
 * - Enables clean testing with mock injection
 * - Eliminates direct singleton access in components
 * - Enables proper cleanup in tests
 */

import { createContext, useContext, ReactNode } from 'react';
import { EvaluationCache, getEvaluationCache } from '../lib/cache/EvaluationCache';
import type { EvaluationResult } from '../lib/chess/engine/simple/SimpleEngine';
import { Move as ChessJsMove } from 'chess.js';

/**
 * Context type for engine services
 */
interface EngineContextType {
  evaluationCache: EvaluationCache;
}

/**
 * React Context for engine services
 */
const EngineContext = createContext<EngineContextType | null>(null);

/**
 * Props for EngineProvider
 */
interface EngineProviderProps {
  children: ReactNode;
  evaluationCache?: EvaluationCache; // Optional for testing
}

/**
 * Engine Provider Component
 * Provides EvaluationCache singleton to child components
 */
export const EngineProvider = ({ children, evaluationCache }: EngineProviderProps) => {
  // Use provided cache (for testing) or get singleton
  const cache = evaluationCache || getEvaluationCache();
  
  const contextValue: EngineContextType = {
    evaluationCache: cache
  };

  return (
    <EngineContext.Provider value={contextValue}>
      {children}
    </EngineContext.Provider>
  );
};

/**
 * Hook to access engine services from context
 * @throws Error if used outside EngineProvider
 */
export const useEngineContext = (): EngineContextType => {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngineContext must be used within an EngineProvider');
  }
  return context;
};

/**
 * Convenience hook for accessing EvaluationCache
 * @returns EvaluationCache instance from context
 */
export const useEvaluationCache = (): EvaluationCache => {
  const { evaluationCache } = useEngineContext();
  return evaluationCache;
};

/**
 * Convenience hook for engine evaluation operations
 * Returns the core methods needed by UI components
 */
export const useEngine = () => {
  const evaluationCache = useEvaluationCache();
  
  return {
    /**
     * Evaluate a chess position
     * @param fen - Position in FEN notation
     * @returns Promise<EvaluationResult>
     */
    evaluatePosition: (fen: string): Promise<EvaluationResult> => {
      return evaluationCache.evaluatePositionCached(fen);
    },
    
    /**
     * Find best move for a position
     * @param fen - Position in FEN notation
     * @returns Promise<ChessJsMove | null>
     */
    findBestMove: (fen: string): Promise<ChessJsMove | null> => {
      return evaluationCache.getBestMoveCached(fen);
    },
    
    /**
     * Get cache statistics
     * @returns Cache statistics object
     */
    getCacheStats: () => {
      return evaluationCache.getStats();
    },
    
    /**
     * Clear all caches
     */
    clearCache: () => {
      evaluationCache.clear();
    }
  };
};