/**
 * @fileoverview Evaluation Management for ScenarioEngine
 * Handles engine evaluations, dual evaluations, and critical mistake detection
 */

import { Chess } from 'chess.js';
import { Engine } from '../../engine';
import { EvaluationService } from '../evaluationService';
import type { DualEvaluation, EngineEvaluation } from '../types';

/**
 * Evaluation and analysis methods
 * Manages engine evaluations, dual evaluations, and mistake detection
 */
export class EvaluationManager {
  private chess: Chess;
  private engine: Engine;
  private evaluationService: EvaluationService;

  constructor(chess: Chess, engine: Engine, evaluationService: EvaluationService) {
    this.chess = chess;
    this.engine = engine;
    this.evaluationService = evaluationService;
  }

  /**
   * Checks if a move is a critical mistake
   * Uses the specialized evaluation service
   */
  async isCriticalMistake(fenBefore: string, fenAfter: string): Promise<boolean> {
    return this.evaluationService.isCriticalMistake(fenBefore, fenAfter);
  }

  /**
   * Gets dual evaluation (engine + tablebase)
   * Mobile-optimized with proper error handling
   */
  async getDualEvaluation(fen: string): Promise<DualEvaluation> {
    return this.evaluationService.getDualEvaluation(fen);
  }

  /**
   * Gets simple position evaluation
   * @param fen - Position to evaluate (optional, uses current if not provided)
   */
  async getEvaluation(fen?: string): Promise<EngineEvaluation> {
    const positionFen = fen || this.chess.fen();
    
    try {
      return await this.engine.evaluatePosition(positionFen);
    } catch (error) {
      return { score: 0, mate: null };
    }
  }

  /**
   * Gets best moves from engine with multi-PV analysis
   * @param fen - Position to analyze
   * @param count - Number of best moves to return (default: 3)
   */
  async getEngineBestMoves(fen: string, count: number = 3): Promise<Array<{ 
    move: string; 
    evaluation: number; 
    mate?: number 
  }>> {
    try {
      const engineMoves = await this.engine.getMultiPV(fen, count);
      return engineMoves.map(m => ({
        move: m.move,
        evaluation: m.score,
        mate: m.mate
      }));
    } catch (error) {
      return [];
    }
  }
}