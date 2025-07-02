/**
 * @fileoverview Types and interfaces for Chess Scenario Engine
 * @version 1.0.0
 * @author Chess Training App
 * @description Extracted type definitions for better maintainability and mobile compatibility
 */

export interface DualEvaluation {
  engine: {
    score: number;
    mate: number | null;
    evaluation: string;
  };
  tablebase?: {
    isAvailable: boolean;
    result: {
      wdl: number;
      dtz?: number;
      category: 'win' | 'loss' | 'draw' | 'cursed-win' | 'blessed-loss';
      precise: boolean;
    };
    evaluation: string;
  };
}

export interface TablebaseInfo {
  isTablebasePosition: boolean;
  result?: {
    wdl: number;
    dtz?: number | null;
    category: 'win' | 'loss' | 'draw' | 'cursed-win' | 'blessed-loss';
    precise: boolean;
  };
  bestMoves?: Array<{ move: string; evaluation: string }>;
  error?: string;
}

export interface EngineEvaluation {
  score: number;
  mate: number | null;
}

export interface DeepAnalysisResult {
  isBlunder: boolean;
  reason: string;
}

/**
 * Configuration constants for the scenario engine
 * Optimized for mobile performance and Android compatibility
 */
export const SCENARIO_CONFIG = {
  CRITICAL_MISTAKE_THRESHOLD: 200, // 2 pawns in centipawns
  TABLEBASE_LIMIT_CP: 3000, // Score limit for tablebase positions
  MAX_INSTANCES: 5, // Limit for memory management on mobile
  DEEP_ANALYSIS_TIMEOUT: 3000, // 3 seconds timeout for mobile
  ENGINE_TIMEOUT: 2000, // 2 seconds for mobile optimization
} as const;

export type TablebaseCategory = 'win' | 'loss' | 'draw' | 'cursed-win' | 'blessed-loss'; 