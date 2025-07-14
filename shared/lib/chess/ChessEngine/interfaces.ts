/**
 * @fileoverview ChessEngine Interface & Types
 * @version 3.0.0 - Architectural Simplification
 * @description Unified interface consolidating Engine + ScenarioEngine complexity
 * 
 * CONSOLIDATION TARGET:
 * - Engine system: 2,494 lines (Stockfish wrapper)
 * - ScenarioEngine system: 1,340 lines (chess logic)
 * - Total: 3,834 lines → ~800 lines (79% reduction)
 * 
 * INTERFACE SIMPLIFICATION:
 * - IScenarioEngine: 14 methods → IChessEngine: 8 core methods
 * - Engine class: 14 methods → Unified into IChessEngine
 * - 5 manager classes → Direct integration patterns
 */

import type { Chess, Move as ChessJsMove } from 'chess.js';

// Re-export essential types from existing systems
import type { EngineConfig } from '../engine/types';
export type { EngineConfig };

// Define TablebaseCategory directly instead of importing from deleted module
export type TablebaseCategory = 'win' | 'loss' | 'draw' | 'cursed-win' | 'blessed-loss';

/**
 * Move object interface for chess operations
 * Compatible with Chess.js move format
 */
export interface MoveObject {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/**
 * Engine evaluation result
 * Unified format combining Engine and ScenarioEngine patterns
 */
export interface EngineEvaluation {
  score: number;        // Centipawns from Stockfish
  mate: number | null;  // Moves to mate (positive = winning, negative = losing)
  depth?: number;       // Search depth reached
  nodes?: number;       // Nodes searched
  time?: number;        // Time spent (ms)
}

/**
 * Tablebase lookup result
 * Preserves critical WDL perspective logic from TablebaseManager
 */
export interface TablebaseInfo {
  isTablebasePosition: boolean;
  result?: {
    wdl: number;        // Win/Draw/Loss from current player perspective
    dtz?: number | null; // Distance to zeroing move
    category: 'win' | 'loss' | 'draw' | 'cursed-win' | 'blessed-loss';
    precise: boolean;    // Whether result is precise or estimate
  };
  bestMoves?: Array<{ 
    move: string; 
    evaluation: string;
    wdl?: number;
    dtm?: number;
  }>;
  error?: string;
}

/**
 * Dual evaluation result combining Stockfish + Tablebase
 * Unified pipeline for comprehensive position analysis
 */
export interface DualEvaluation {
  engine: EngineEvaluation;           // Stockfish evaluation
  tablebase: TablebaseInfo | null;    // Tablebase lookup result
  position: string;                   // FEN string for the evaluated position
  timestamp: number;                  // When evaluation was performed
}

/**
 * Best moves analysis result
 * Combines engine multi-PV with tablebase move rankings
 */
export interface BestMovesResult {
  engine: Array<{ 
    move: string; 
    evaluation: number; 
    mate?: number;
    depth?: number;
  }>;
  tablebase: Array<{ 
    move: string; 
    wdl: number; 
    dtm?: number; 
    evaluation: string;
  }>;
}

/**
 * Engine statistics for debugging and performance monitoring
 * Simplified from complex Engine + ScenarioEngine stats
 */
export interface ChessEngineStats {
  // Core status
  isReady: boolean;
  queueLength: number;
  isProcessing: boolean;
  
  // Performance metrics
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  
  // Memory tracking (mobile critical)
  instanceCount: number;
  cacheSize: number;
  
  // Error tracking
  lastError?: string;
  uptime: number;
}

/**
 * Configuration options for ChessEngine initialization
 * Combines Engine and ScenarioEngine configuration patterns
 */
export interface ChessEngineConfig {
  // Engine configuration (Stockfish settings)
  engineConfig?: EngineConfig;
  
  // Initial position
  initialFen?: string;
  
  // Mobile optimization flags
  enableTablebase?: boolean;
  mobileOptimized?: boolean;
  
  // Worker configuration
  workerPath?: string;
  maxWorkerInstances?: number;
}

/**
 * Main ChessEngine Interface
 * 
 * CONSOLIDATION STRATEGY:
 * - Absorbs IScenarioEngine (14 methods) → 8 core methods
 * - Eliminates Engine class duplication
 * - Hides 5 manager classes behind simple interface
 * 
 * DESIGN PRINCIPLES:
 * - Single Source of Truth: One chess engine instance
 * - Mobile Performance: Proven worker management patterns
 * - Backward Compatibility: Drop-in replacement for IScenarioEngine
 * - Clean API: Hide complexity, expose essential functionality
 */
export interface IChessEngine {
  // === Position Management (3 methods) ===
  
  /**
   * Get current position in FEN notation
   * Replaces: ScenarioEngine.getFen(), Utilities.getFen()
   */
  getFen(): string;
  
  /**
   * Update the current position
   * Replaces: ScenarioEngine.updatePosition(), InstanceManager.updateChessPosition()
   * @param fen - Position in FEN notation (validated)
   */
  updatePosition(fen: string): void;
  
  /**
   * Reset to initial position
   * Replaces: ScenarioEngine.reset(), InstanceManager.resetChessPosition()
   */
  reset(): void;
  
  // === Move Operations (2 methods) ===
  
  /**
   * Make a move on the board
   * Replaces: ScenarioEngine.makeMove(), MoveHandler.makeMove()
   * @param move - Move object with from, to, and optional promotion
   * @returns The move made or null if invalid
   * 
   * NOTE: In training mode, this may trigger an automatic engine response
   */
  makeMove(move: MoveObject): Promise<ChessJsMove | null>;
  
  /**
   * Get the best move for the current position
   * Replaces: ScenarioEngine.getBestMove(), MoveHandler.getBestMove(), Engine.getBestMove()
   * @returns Best move as object or null
   */
  getBestMove(): Promise<MoveObject | null>;
  
  // === Analysis (2 methods) ===
  
  /**
   * Get engine evaluation for a position
   * Replaces: ScenarioEngine.getEvaluation(), Engine.evaluatePosition(), EvaluationManager.getEvaluation()
   * @param fen - Position to evaluate (optional, uses current if not provided)
   */
  getEvaluation(fen?: string): Promise<EngineEvaluation>;
  
  /**
   * Get dual evaluation (engine + tablebase)
   * Replaces: ScenarioEngine.getDualEvaluation(), EvaluationManager.getDualEvaluation()
   * @param fen - Position to evaluate
   */
  getDualEvaluation(fen: string): Promise<DualEvaluation>;
  
  // === Lifecycle (1 method) ===
  
  /**
   * Clean up resources and terminate engine
   * Replaces: ScenarioEngine.quit(), Engine.quit(), InstanceManager cleanup
   * CRITICAL: Must be called to prevent memory leaks on mobile
   */
  quit(): void;
  
  // === Optional Advanced Methods (for debugging/development) ===
  
  /**
   * Get engine statistics
   * Replaces: ScenarioEngine.getStats(), Engine.getStats(), Utilities.getStats()
   */
  getStats?(): ChessEngineStats;
  
  /**
   * Check if engine is ready for operations
   * Replaces: Engine.isReady(), Engine.waitForReady()
   */
  isReady?(): boolean;
  
  /**
   * Get the Chess.js instance for advanced operations
   * Replaces: ScenarioEngine.getChessInstance(), Utilities.getChessInstance()
   * WARNING: Use with caution - prefer IChessEngine methods
   */
  getChessInstance?(): Chess;
}

/**
 * Factory function type for ChessEngine creation
 * Enables dependency injection and testing
 */
export type ChessEngineFactory = (config?: ChessEngineConfig) => IChessEngine;

/**
 * Validation result for FEN strings
 * Preserves InstanceManager validation patterns
 */
export interface FenValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

/**
 * Engine initialization events
 * Preserves Engine event-driven patterns
 */
export interface ChessEngineEvents {
  'ready': () => void;
  'init:failed': (error: Error) => void;
  'worker:terminated': () => void;
  'memory:warning': (usage: number) => void;
}

/**
 * Configuration constants
 * Consolidates SCENARIO_CONFIG and Engine constants
 */
export const CHESS_ENGINE_CONFIG = {
  // Evaluation thresholds
  CRITICAL_MISTAKE_THRESHOLD: 200,  // 2 pawns in centipawns
  TABLEBASE_LIMIT_CP: 3000,         // Score limit for tablebase positions
  
  // Mobile performance limits
  MAX_INSTANCES: 5,                 // Memory management for mobile
  ENGINE_TIMEOUT: 2000,             // Mobile-optimized timeout (ms)
  EVALUATION_TIMEOUT: 3000,         // Deep analysis timeout (ms)
  
  // Worker settings
  DEFAULT_WORKER_PATH: '/stockfish.wasm.js',
  MAX_QUEUE_LENGTH: 10,             // Request queue limit
  
  // Cache settings (using centralized constants)
  MAX_CACHE_SIZE: 200,              // LRU cache for evaluations (legacy - use CACHE.ENGINE_CACHE_SIZE)
  CACHE_TTL: 300000,                // 5 minutes cache TTL (legacy - use CACHE.ENGINE_CACHE_TTL)
} as const;

/**
 * Type guards for engine responses
 */
export function isEngineEvaluation(obj: any): obj is EngineEvaluation {
  return obj && typeof obj.score === 'number' && 
         (obj.mate === null || typeof obj.mate === 'number');
}

export function isTablebaseInfo(obj: any): obj is TablebaseInfo {
  return obj && typeof obj.isTablebasePosition === 'boolean';
}

export function isDualEvaluation(obj: any): obj is DualEvaluation {
  return obj && isEngineEvaluation(obj.engine) && 
         typeof obj.position === 'string' && 
         typeof obj.timestamp === 'number';
}