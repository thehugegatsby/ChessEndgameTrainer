/**
 * @file Position Service Interface
 * @module domains/game/services/PositionServiceInterface
 * @description Interface for position management, FEN handling, and position evaluation
 */

import type { ValidatedMove } from '@shared/types/chess';

/**
 * Result of position evaluation
 */
export interface PositionEvaluationResult {
  /**
   * WDL (Win/Draw/Loss) value
   */
  wdl: number;
  
  /**
   * Position evaluation category
   */
  category: 'win' | 'loss' | 'draw' | 'unknown';
  
  /**
   * Distance to zero (moves to mate/conversion)
   */
  dtz?: number;
}

/**
 * Position evaluation baseline for training
 */
export interface EvaluationBaseline {
  /**
   * WDL evaluation value
   */
  wdl: number;
  
  /**
   * FEN position when baseline was established
   */
  fen: string;
  
  /**
   * Timestamp when baseline was set
   */
  timestamp: number;
}

/**
 * Move quality evaluation result
 */
export interface MoveQualityResult {
  /**
   * Whether the move is optimal
   */
  isOptimal: boolean;
  
  /**
   * WDL value before the move
   */
  wdlBefore: number;
  
  /**
   * WDL value after the move
   */
  wdlAfter: number;
  
  /**
   * Best move in the position (if current move is not optimal)
   */
  bestMove?: string;
  
  /**
   * Evaluation category after the move
   */
  category: 'win' | 'loss' | 'draw' | 'unknown';
}

/**
 * Interface for position management service
 * 
 * Handles FEN loading, position evaluation, and move quality assessment.
 * Extracted from TrainingSlice to provide clean separation of concerns.
 */
export interface PositionServiceInterface {
  /**
   * Loads a position from FEN string
   * 
   * @param fen - FEN string representing the chess position
   * @returns Promise resolving to success status
   */
  loadPosition(fen: string): Promise<boolean>;
  
  /**
   * Gets the current FEN position
   * 
   * @returns Current FEN string or null if no position loaded
   */
  getCurrentFen(): string | null;
  
  /**
   * Evaluates the current position using tablebase
   * 
   * @param fen - FEN string to evaluate (optional, uses current if not provided)
   * @returns Promise resolving to evaluation result
   */
  evaluatePosition(fen?: string): Promise<PositionEvaluationResult | null>;
  
  /**
   * Evaluates move quality for training feedback
   * 
   * @param move - The move that was made
   * @param fenBefore - FEN position before the move
   * @param fenAfter - FEN position after the move
   * @returns Promise resolving to move quality assessment
   */
  evaluateMoveQuality(
    move: ValidatedMove, 
    fenBefore: string, 
    fenAfter: string
  ): Promise<MoveQualityResult | null>;
  
  /**
   * Calculates the best move in the current position
   * 
   * This method encapsulates the logic of consulting tablebases first,
   * then falling back to a traditional engine if necessary.
   * 
   * @param fen - FEN string to analyze (optional, uses current if not provided)
   * @returns Promise resolving to the best move in UCI format (e.g., 'e2e4'), or null if no move is found
   */
  getBestMove(fen?: string): Promise<string | null>;

  /**
   * Sets evaluation baseline for subsequent move quality assessments
   * 
   * @param wdl - WDL evaluation to use as baseline
   * @param fen - FEN position when baseline was established
   */
  setEvaluationBaseline(wdl: number, fen: string): void;
  
  /**
   * Gets the current evaluation baseline
   * 
   * @returns Current evaluation baseline or null
   */
  getEvaluationBaseline(): EvaluationBaseline | null;
  
  /**
   * Clears the evaluation baseline
   */
  clearEvaluationBaseline(): void;
  
  /**
   * Resets the position service to initial state
   */
  reset(): void;
}