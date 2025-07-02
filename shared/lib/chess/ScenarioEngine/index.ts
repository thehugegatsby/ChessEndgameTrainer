/**
 * @fileoverview Main Scenario Engine for Chess Training
 * @version 2.0.0
 * @description Refactored and modularized chess scenario engine
 * Optimized for mobile performance and Android compatibility
 * 
 * ARCHITECTURE:
 * - Modular design with separated concerns
 * - Mobile-first performance optimizations
 * - Memory management for Android devices
 * - Clean error handling and logging
 */

import { Chess, Move as ChessJsMove } from 'chess.js';
import type { Move as CustomMove } from '@shared/types/chess';
import { Engine } from '../engine';
import { EvaluationService } from './evaluationService';
import { TablebaseService } from './tablebaseService';
import type { 
  DualEvaluation, 
  TablebaseInfo, 
  EngineEvaluation,
  SCENARIO_CONFIG
} from './types';

const { MAX_INSTANCES } = require('./types').SCENARIO_CONFIG;

/**
 * Main Scenario Engine class
 * Handles chess game logic, move validation, and analysis
 * 
 * DESIGN PRINCIPLES:
 * - Single Responsibility: Each service handles one concern
 * - Mobile Optimization: Memory and performance conscious
 * - Error Resilience: Graceful failure handling
 * - Clean API: Simple, predictable interface
 */
export class ScenarioEngine {
  private chess: Chess;
  private initialFen: string;
  private engine: Engine;
  private evaluationService: EvaluationService;
  private tablebaseService: TablebaseService;
  private static instanceCount = 0;

  /**
   * Creates a new scenario engine instance
   * @param fen - Starting position in FEN notation
   */
  constructor(fen: string) {
    this.validateFen(fen);
    this.trackInstanceCount();
    
    this.initialFen = fen;
    this.chess = new Chess(fen);
    this.engine = Engine.getInstance();
    
    // Initialize specialized services
    this.evaluationService = new EvaluationService(this.engine);
    this.tablebaseService = new TablebaseService();
    
    this.validateEngineInitialization();
  }

  /**
   * Validates FEN string format
   */
  private validateFen(fen: string): void {
    if (!fen || typeof fen !== 'string') {
      throw new Error('[ScenarioEngine] FEN must be a non-empty string');
    }
  }

  /**
   * Tracks instance count for memory management on mobile
   */
  private trackInstanceCount(): void {
    ScenarioEngine.instanceCount++;
    if (ScenarioEngine.instanceCount > MAX_INSTANCES) {
      console.warn(`[ScenarioEngine] ⚠️ Many instances created (${ScenarioEngine.instanceCount}) - Consider cleanup for mobile performance`);
    }
  }

  /**
   * Validates engine initialization
   */
  private validateEngineInitialization(): void {
    if (!this.engine) {
      console.error('[ScenarioEngine] Engine initialization failed');
      throw new Error('[ScenarioEngine] Engine failed to initialize');
    }
  }

  /**
   * Gets current position FEN
   */
  public getFen(): string {
    return this.chess.fen();
  }

  /**
   * Makes a move on the board and gets engine response
   * @param move - Move object with from, to, and optional promotion
   * @returns Promise<CustomMove | null> - The move made or null if invalid
   */
  public async makeMove(move: { 
    from: string; 
    to: string; 
    promotion?: 'q' | 'r' | 'b' | 'n' 
  }): Promise<(CustomMove & { color: 'w' | 'b' }) | null> {
    const turn = this.chess.turn();
    
    try {
      const playerMove = this.chess.move(move);
      if (!playerMove) {
        return null;
      }

      const moveWithColor = { ...playerMove, color: turn };
      
      // Get engine response (mobile-optimized timeout)
      const engineMoveData = await this.engine.getBestMove(this.chess.fen(), 1000);
      
      if (engineMoveData) {
        try {
          this.chess.move({ 
            from: engineMoveData.from, 
            to: engineMoveData.to,
            promotion: engineMoveData.promotion
          });
        } catch (error) {
          console.warn('[ScenarioEngine] Engine move failed:', error);
        }
      }
      
      return moveWithColor;
    } catch (error) {
      console.warn('[ScenarioEngine] Move failed:', error);
      return null;
    }
  }

  /**
   * Gets the best move for a position
   * @param fen - Position to analyze
   * @returns Promise<string | null> - Best move in UCI format
   */
  public async getBestMove(fen: string): Promise<string | null> {
    try {
      const bestMove = await this.engine.getBestMove(fen);
      
      if (bestMove) {
        const moveUci = bestMove.from + bestMove.to + (bestMove.promotion || '');
        return moveUci;
      }
      
      return null;
    } catch (error) {
      console.warn('[ScenarioEngine] getBestMove failed:', error);
      return null;
    }
  }

  /**
   * Checks if a move is a critical mistake
   * Uses the specialized evaluation service
   */
  public async isCriticalMistake(fenBefore: string, fenAfter: string): Promise<boolean> {
    return this.evaluationService.isCriticalMistake(fenBefore, fenAfter);
  }

  /**
   * Gets dual evaluation (engine + tablebase)
   * Mobile-optimized with proper error handling
   */
  public async getDualEvaluation(fen: string): Promise<DualEvaluation> {
    return this.evaluationService.getDualEvaluation(fen);
  }

  /**
   * Gets tablebase information for a position
   */
  public async getTablebaseInfo(fen: string): Promise<TablebaseInfo> {
    return this.tablebaseService.getTablebaseInfo(fen);
  }

  /**
   * Gets simple position evaluation
   * @param fen - Position to evaluate (optional, uses current if not provided)
   */
  public async getEvaluation(fen?: string): Promise<EngineEvaluation> {
    const positionFen = fen || this.chess.fen();
    
    try {
      return await this.engine.evaluatePosition(positionFen);
    } catch (error) {
      console.warn('[ScenarioEngine] Evaluation failed:', error);
      return { score: 0, mate: null };
    }
  }

  /**
   * Updates the current position
   */
  public updatePosition(fen: string): void {
    this.validateFen(fen);
    
    try {
      this.chess.load(fen);
    } catch (error) {
      console.error('[ScenarioEngine] Invalid FEN provided:', error);
      throw new Error(`[ScenarioEngine] Invalid FEN: ${fen}`);
    }
  }

  /**
   * Resets to initial position
   */
  public reset(): void {
    try {
      this.chess.load(this.initialFen);
    } catch (error) {
      console.error('[ScenarioEngine] Reset failed:', error);
      throw new Error('[ScenarioEngine] Failed to reset to initial position');
    }
  }

  /**
   * Gets the Chess.js instance for advanced operations
   * Use with caution - prefer using ScenarioEngine methods
   */
  public getChessInstance(): Chess {
    return this.chess;
  }

  /**
   * Cleanup method for mobile memory management
   */
  public quit(): void {
    try {
      ScenarioEngine.instanceCount--;
      this.tablebaseService.clearCache();
      
      // Clear references for garbage collection
      this.chess = null as any;
      this.evaluationService = null as any;
      this.tablebaseService = null as any;
      
      console.log(`[ScenarioEngine] Instance cleaned up. Remaining: ${ScenarioEngine.instanceCount}`);
    } catch (error) {
      console.warn('[ScenarioEngine] Cleanup failed:', error);
    }
  }

  /**
   * Gets engine statistics for debugging
   */
  public getStats(): { 
    instanceCount: number; 
    currentFen: string; 
    initialFen: string;
    cacheStats: { size: number; maxSize: number };
  } {
    return {
      instanceCount: ScenarioEngine.instanceCount,
      currentFen: this.chess.fen(),
      initialFen: this.initialFen,
      cacheStats: this.tablebaseService.getCacheStats()
    };
  }
}

// Re-export types for convenience
export type { DualEvaluation, TablebaseInfo, EngineEvaluation } from './types'; 