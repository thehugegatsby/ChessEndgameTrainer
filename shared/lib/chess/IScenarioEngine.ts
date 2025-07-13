/**
 * @fileoverview ScenarioEngine Interface - Clean Contract Definition
 * @version 1.0.0
 * @description Defines the contract for all ScenarioEngine implementations.
 * This is the primary engine abstraction used throughout the application.
 * 
 * ARCHITECTURE PRINCIPLES:
 * - Single Source of Truth: ScenarioEngine API is the standard
 * - Testability: Enable clean mocking for E2E tests
 * - Type Safety: Strict TypeScript interface
 * - No Overengineering: Direct mapping to existing API
 */

import type { 
  DualEvaluation, 
  EngineEvaluation, 
  TablebaseInfo 
} from './ScenarioEngine/types';
import type { Chess } from 'chess.js';

/**
 * Best moves result structure
 */
export interface BestMovesResult {
  engine: Array<{ move: string; evaluation: number; mate?: number }>;
  tablebase: Array<{ move: string; wdl: number; dtm?: number; evaluation: string }>;
}

/**
 * ScenarioEngine Interface
 * 
 * This interface defines how the application interacts with chess engines.
 * Production uses ScenarioEngine, tests use MockScenarioEngine.
 * 
 * IMPORTANT: This is the primary engine contract. IEngineService is deprecated.
 */
export interface IScenarioEngine {
  // === Position Management ===
  
  /**
   * Get current position in FEN notation
   */
  getFen(): string;
  
  /**
   * Update the current position
   * @param fen - Position in FEN notation
   */
  updatePosition(fen: string): void;
  
  /**
   * Reset to initial position
   */
  reset(): void;
  
  /**
   * Get the Chess.js instance for advanced operations
   * WARNING: Use with caution - prefer using IScenarioEngine methods
   */
  getChessInstance(): Chess;

  // === Move Operations ===
  
  /**
   * Make a move on the board
   * @param move - Move object with from, to, and optional promotion
   * @returns The move made or null if invalid
   * 
   * NOTE: In training mode, this may trigger an automatic engine response
   */
  makeMove(move: { 
    from: string; 
    to: string; 
    promotion?: 'q' | 'r' | 'b' | 'n' 
  }): Promise<any | null>;
  
  /**
   * Get the best move for the current position
   * @param fen - Position to analyze
   * @returns Best move as object or null
   */
  getBestMove(fen: string): Promise<{ 
    from: string; 
    to: string; 
    promotion?: 'q' | 'r' | 'b' | 'n' 
  } | null>;

  // === Evaluation Methods ===
  
  /**
   * Get dual evaluation (engine + tablebase)
   * @param fen - Position to evaluate
   */
  getDualEvaluation(fen: string): Promise<DualEvaluation>;
  
  /**
   * Get engine evaluation only
   * @param fen - Position to evaluate (optional, uses current if not provided)
   */
  getEvaluation(fen?: string): Promise<EngineEvaluation>;
  
  /**
   * Check if a move is a critical mistake
   * @param fenBefore - Position before the move
   * @param fenAfter - Position after the move
   */
  isCriticalMistake(fenBefore: string, fenAfter: string): Promise<boolean>;

  // === Analysis Methods ===
  
  /**
   * Get best moves with evaluations
   * @param fen - Position to analyze
   * @param count - Number of moves to return (default: 3)
   */
  getBestMoves(fen: string, count?: number): Promise<BestMovesResult>;
  
  /**
   * Get tablebase information
   * @param fen - Position to look up
   */
  getTablebaseInfo(fen: string): Promise<TablebaseInfo>;

  // === Lifecycle & Stats ===
  
  /**
   * Get engine statistics
   */
  getStats(): { 
    instanceCount: number;
    cacheSize: number;
    evaluationCount: number;
    tablebaseHits: number;
  };
  
  /**
   * Clean up resources
   * CRITICAL: Must be called when done to prevent memory leaks
   */
  quit(): void;
}