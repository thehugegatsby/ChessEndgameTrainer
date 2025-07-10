/**
 * @fileoverview IEvaluationPanel Interface - Contract for Evaluation Panel
 * @description Defines the public API for engine evaluation display
 */

/**
 * Engine evaluation information
 */
export interface EvaluationInfo {
  evaluation: number;
  depth: number;
  bestMove: string | null;
  pv?: string[];
}

/**
 * Interface for Evaluation Panel Component
 * Displays engine analysis and evaluation
 */
export interface IEvaluationPanel {
  /**
   * Get current evaluation score
   * @returns Evaluation in centipawns or null
   */
  getEvaluation(): Promise<number | null>;
  
  /**
   * Get detailed evaluation information
   * @returns Evaluation info or null
   */
  getEvaluationInfo(): Promise<EvaluationInfo | null>;
  
  /**
   * Check if engine is currently thinking
   * @returns True if engine is analyzing
   */
  isThinking(): Promise<boolean>;
  
  /**
   * Wait for engine to finish thinking
   */
  waitForEngineReady(): Promise<void>;
  
  /**
   * Get the best move suggested by engine
   * @returns Best move in UCI notation or null
   */
  getBestMove(): Promise<string | null>;
  
  /**
   * Get current search depth
   * @returns Search depth or null
   */
  getDepth(): Promise<number | null>;
}