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

import { Chess } from 'chess.js';
import { engine } from '../engine/singleton';
import { EvaluationService } from './evaluationService';
import { TablebaseService } from './tablebaseService';
import {
  InstanceManager,
  MoveHandler,
  EvaluationManager,
  TablebaseManager,
  Utilities
} from './core';
import type { 
  DualEvaluation, 
  TablebaseInfo, 
  EngineEvaluation
} from './types';

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
  
  // Core managers
  private moveHandler: MoveHandler;
  private evaluationManager: EvaluationManager;
  private tablebaseManager: TablebaseManager;
  private utilities: Utilities;

  /**
   * Creates a new scenario engine instance
   * @param fen - Starting position in FEN notation (optional, defaults to starting position)
   * 
   * AI_NOTE: Instance tracking is CRITICAL for mobile performance. Each instance holds
   * references to Chess.js, Engine Worker, and caches. Android devices crash with >5 instances.
   * ALWAYS call quit() when done!
   */
  constructor(fen?: string) {
    // Validate FEN if provided
    if (fen !== undefined) {
      InstanceManager.validateFen(fen);
    }
    
    const startingFen = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    InstanceManager.trackInstanceCount();
    
    this.initialFen = startingFen;
    this.chess = InstanceManager.createChessInstance(startingFen);
    this.engine = engine;
    
    // Initialize specialized services
    this.evaluationService = new EvaluationService(this.engine);
    this.tablebaseService = new TablebaseService();
    
    InstanceManager.validateEngineInitialization(this.engine);

    // Initialize core managers
    this.moveHandler = new MoveHandler(this.chess, this.engine);
    this.evaluationManager = new EvaluationManager(this.chess, this.engine, this.evaluationService);
    this.tablebaseManager = new TablebaseManager(this.tablebaseService);
    this.utilities = new Utilities(
      this.chess, 
      this.tablebaseManager, 
      this.evaluationManager, 
      this.moveHandler, 
      this.initialFen
    );
  }

  // === Position Management ===

  /**
   * Gets current position FEN
   */
  public getFen(): string {
    return this.utilities.getFen();
  }

  /**
   * Updates the current position
   */
  public updatePosition(fen: string): void {
    InstanceManager.updateChessPosition(this.chess, fen);
  }

  /**
   * Resets to initial position
   */
  public reset(): void {
    InstanceManager.resetChessPosition(this.chess, this.initialFen);
  }

  /**
   * Gets the Chess.js instance for advanced operations
   * Use with caution - prefer using ScenarioEngine methods
   */
  public getChessInstance(): Chess {
    return this.utilities.getChessInstance();
  }

  // === Move Operations ===

  /**
   * Makes a move on the board and gets engine response
   * @param move - Move object with from, to, and optional promotion
   * @returns Promise<CustomMove | null> - The move made or null if invalid
   * 
   * AI_NOTE: This method has a QUIRK - it automatically makes an engine response move!
   * This is legacy behavior from the training mode. If you just want to make a move
   * without engine response, use getChessInstance().move() directly.
   * TODO: Consider adding a flag to disable auto-response.
   */
  public async makeMove(move: { 
    from: string; 
    to: string; 
    promotion?: 'q' | 'r' | 'b' | 'n' 
  }): Promise<any | null> {
    return this.moveHandler.makeMove(move);
  }

  /**
   * Gets the best move for a position
   * @param fen - Position to analyze
   * @returns Promise<{from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n'} | null> - Best move as object
   */
  public async getBestMove(fen: string): Promise<{ from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' } | null> {
    return this.moveHandler.getBestMove(fen);
  }

  // === Evaluation Methods ===

  /**
   * Checks if a move is a critical mistake
   * Uses the specialized evaluation service
   */
  public async isCriticalMistake(fenBefore: string, fenAfter: string): Promise<boolean> {
    return this.evaluationManager.isCriticalMistake(fenBefore, fenAfter);
  }

  /**
   * Gets dual evaluation (engine + tablebase)
   * Mobile-optimized with proper error handling
   */
  public async getDualEvaluation(fen: string): Promise<DualEvaluation> {
    return this.evaluationManager.getDualEvaluation(fen);
  }

  /**
   * Gets simple position evaluation
   * @param fen - Position to evaluate (optional, uses current if not provided)
   */
  public async getEvaluation(fen?: string): Promise<EngineEvaluation> {
    return this.evaluationManager.getEvaluation(fen);
  }

  // === Tablebase Methods ===

  /**
   * Gets tablebase information for a position
   */
  public async getTablebaseInfo(fen: string): Promise<TablebaseInfo> {
    return this.tablebaseManager.getTablebaseInfo(fen);
  }

  // === Analysis Methods ===

  /**
   * Gets best moves from engine and tablebase
   * @param fen - Position to analyze
   * @param count - Number of best moves to return (default: 3)
   */
  public async getBestMoves(fen: string, count: number = 3): Promise<{
    engine: Array<{ move: string; evaluation: number; mate?: number }>;
    tablebase: Array<{ move: string; wdl: number; dtm?: number; evaluation: string }>;
  }> {
    return this.utilities.getBestMoves(fen, count);
  }


  // === Statistics & Debugging ===

  /**
   * Gets engine statistics for debugging
   */
  public getStats(): { 
    instanceCount: number; 
    currentFen: string; 
    initialFen: string;
    cacheStats: { size: number; maxSize: number };
  } {
    return this.utilities.getStats();
  }

  // === Memory Management ===

  /**
   * Cleanup method for mobile memory management
   * 
   * AI_NOTE: MUST BE CALLED! Memory leaks are a real issue on mobile.
   * This nullifies references to help GC. The engine Worker is a singleton
   * and won't be terminated here - that's handled by Engine.getInstance().terminate()
   * 
   * KNOWN ISSUE: If quit() fails, the instance count becomes inaccurate.
   * Consider using try-finally blocks when using ScenarioEngine.
   */
  public quit(): void {
    try {
      InstanceManager.decrementInstanceCount();
      this.tablebaseManager.clearCache();
      
      // Clear references for garbage collection
      this.chess = null as any;
      this.evaluationService = null as any;
      this.tablebaseService = null as any;
      this.moveHandler = null as any;
      this.evaluationManager = null as any;
      this.tablebaseManager = null as any;
      this.utilities = null as any;
      
    } catch (error) {
      // Silent cleanup failure
    }
  }
}

// Re-export types for convenience
export type { DualEvaluation, TablebaseInfo, EngineEvaluation } from './types';

// Re-export InstanceManager for testing
export { InstanceManager } from './core';