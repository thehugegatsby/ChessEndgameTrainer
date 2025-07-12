/**
 * @fileoverview EngineAnalyzer interface for E2E test engine interaction
 * @description Abstracts chess engine analysis for testing
 */

import { AnalysisResult, AnalysisOptions } from './types';

/**
 * Interface for engine analysis in E2E tests
 * Provides high-level engine interaction methods
 */
export interface IEngineAnalyzer {
  /**
   * Analyze a position
   * @param fen - Position to analyze
   * @param options - Analysis configuration
   * @returns Analysis result with evaluation and best moves
   */
  analyzePosition(fen: string, options?: AnalysisOptions): Promise<AnalysisResult>;

  /**
   * Compare two positions
   * @param fen1 - First position
   * @param fen2 - Second position
   * @returns Evaluation difference and which is better
   */
  comparePositions(fen1: string, fen2: string): Promise<{
    evalDifference: number;
    betterPosition: 'first' | 'second' | 'equal';
    reason: string;
  }>;

  /**
   * Find best move sequence
   * @param fen - Starting position
   * @param depth - How many moves to calculate
   * @returns Best continuation
   */
  findBestLine(fen: string, depth: number): Promise<string[]>;

  /**
   * Check if position is winning/drawing/losing
   * @param fen - Position to evaluate
   * @param forWhite - Perspective (true = white, false = black)
   * @returns Position assessment
   */
  assessPosition(fen: string, forWhite: boolean): Promise<{
    assessment: 'winning' | 'better' | 'equal' | 'worse' | 'losing';
    evaluation: number;
    confidence: 'low' | 'medium' | 'high';
  }>;

  /**
   * Wait for engine to be ready
   * @param timeout - Maximum wait time
   */
  waitForEngine(timeout?: number): Promise<void>;

  /**
   * Check if engine is currently analyzing
   */
  isAnalyzing(): Promise<boolean>;

  /**
   * Dispose of resources (clear cache, etc.)
   */
  dispose(): void;
}