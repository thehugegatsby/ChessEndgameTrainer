/**
 * @fileoverview Minimal Chess Engine Interface - Clean Architecture
 * @description Stateless chess engine interface for evaluation and move analysis
 * 
 * PRINCIPLES:
 * - Stateless: All methods accept FEN, no internal position state
 * - Simple: Only 4 core methods needed for chess training
 * - Clean: No overengineering, no unnecessary complexity
 * - Testable: Easy to mock and test
 */

/**
 * Engine analysis options
 */
export interface EngineOptions {
  /** Analysis depth in plies (default: 15) */
  depth?: number;
  /** Maximum analysis time in milliseconds (default: 1000) */
  movetime?: number;
}

/**
 * Best move result from engine
 */
export interface BestMoveResult {
  /** Move in UCI notation (e.g., "e2e4") */
  move: string;
  /** Evaluation in centipawns (positive = better for white) */
  evaluation: number;
  /** Mate distance if position is mate (positive = white mates, negative = black mates) */
  mate?: number;
}

/**
 * Position evaluation result
 */
export interface EvaluationResult {
  /** Evaluation in centipawns (positive = better for white) */
  evaluation: number;
  /** Mate distance if position is mate */
  mate?: number;
  /** Principal variation (best line of play) */
  pv?: string[];
}

/**
 * Minimal Chess Engine Interface
 * 
 * This interface provides the essential chess engine functionality needed
 * for training applications. It is stateless - all methods accept FEN positions
 * as parameters rather than maintaining internal state.
 * 
 * Design Philosophy:
 * - Stateless operations (pass FEN to each method)
 * - Async by design (all methods return Promises)
 * - Error handling (methods can throw/reject)
 * - Resource management (stop/terminate for cleanup)
 */
export interface IChessEngine {
  /**
   * Find the best move for a given position
   * @param fen - Position in FEN notation
   * @param options - Analysis options (depth, time limits)
   * @returns Promise with best move and evaluation
   * @throws Error if FEN is invalid or analysis fails
   */
  findBestMove(fen: string, options?: EngineOptions): Promise<BestMoveResult>;

  /**
   * Evaluate a position without finding moves
   * @param fen - Position in FEN notation  
   * @param options - Analysis options (depth, time limits)
   * @returns Promise with evaluation and principal variation
   * @throws Error if FEN is invalid or analysis fails
   */
  evaluatePosition(fen: string, options?: EngineOptions): Promise<EvaluationResult>;

  /**
   * Stop current analysis
   * @returns Promise that resolves when analysis is stopped
   */
  stop(): Promise<void>;

  /**
   * Terminate engine and clean up resources
   * @returns Promise that resolves when engine is terminated
   */
  terminate(): Promise<void>;
}