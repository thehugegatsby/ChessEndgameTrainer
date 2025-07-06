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
import type { Move as CustomMove } from '../../../types/chess';
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
   * @param fen - Starting position in FEN notation (optional, defaults to starting position)
   * 
   * AI_NOTE: Instance tracking is CRITICAL for mobile performance. Each instance holds
   * references to Chess.js, Engine Worker, and caches. Android devices crash with >5 instances.
   * ALWAYS call quit() when done!
   */
  constructor(fen?: string) {
    // Validate FEN if provided
    if (fen !== undefined) {
      this.validateFen(fen);
    }
    
    const startingFen = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.trackInstanceCount();
    
    this.initialFen = startingFen;
    this.chess = new Chess(startingFen);
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
    if (!fen || typeof fen !== 'string' || fen.trim() === '') {
      const error = new Error('FEN must be a non-empty string');
      throw error;
    }
  }

  /**
   * Tracks instance count for memory management on mobile
   */
  private trackInstanceCount(): void {
    ScenarioEngine.instanceCount++;
    
    // Instance count tracking for mobile performance
  }

  /**
   * Validates engine initialization
   */
  private validateEngineInitialization(): void {
    if (!this.engine) {
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
        }
      }
      
      return moveWithColor;
    } catch (error) {
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
      ScenarioEngine.instanceCount--;
      this.tablebaseService.clearCache();
      
      // Clear references for garbage collection
      this.chess = null as any;
      this.evaluationService = null as any;
      this.tablebaseService = null as any;
      
    } catch (error) {
    }
  }

  /**
   * Gets best moves from engine and tablebase
   * @param fen - Position to analyze
   * @param count - Number of best moves to return (default: 3)
   */
  public async getBestMoves(fen: string, count: number = 3): Promise<{
    engine: Array<{ move: string; evaluation: number; mate?: number }>;
    tablebase: Array<{ move: string; wdl: number; dtm?: number; evaluation: string }>;
  }> {
    const result = {
      engine: [] as Array<{ move: string; evaluation: number; mate?: number }>,
      tablebase: [] as Array<{ move: string; wdl: number; dtm?: number; evaluation: string }>
    };

    try {
      // Get engine's top moves
      const engineMoves = await this.engine.getMultiPV(fen, count);
      result.engine = engineMoves.map(m => ({
        move: this.convertEngineNotation(m.move, fen),
        evaluation: m.score,
        mate: m.mate
      }));

      // Check if this is a tablebase position
      const pieces = this.countPieces(fen);
      if (pieces <= 7) {
        const tablebaseMoves = await this.getTablebaseMoves(fen, count);
        result.tablebase = tablebaseMoves;
      }
    } catch (error) {
    }

    return result;
  }

  /**
   * Converts engine notation (e2e4) to algebraic notation (e4)
   */
  private convertEngineNotation(engineMove: string, fen: string): string {
    try {
      const tempChess = new Chess(fen);
      const from = engineMove.substring(0, 2);
      const to = engineMove.substring(2, 4);
      const promotion = engineMove.length > 4 ? engineMove[4] as 'q' | 'r' | 'b' | 'n' : undefined;
      
      const move = tempChess.move({ from, to, promotion });
      return move ? move.san : engineMove;
    } catch {
      return engineMove;
    }
  }

  /**
   * Gets tablebase moves for a position
   * 
   * AI_NOTE: CRITICAL BUG FIXED HERE - WDL values from tablebase API are ALWAYS from
   * White's perspective, but after making a move, we need the perspective of who just moved.
   * Line 353: We negate the WDL to get current player's perspective.
   * This was causing Black's best defensive moves to show as mistakes!
   * See: /shared/utils/chess/EVALUATION_LOGIC_LEARNINGS.md for full details
   */
  private async getTablebaseMoves(fen: string, count: number): Promise<Array<{
    move: string;
    wdl: number;
    dtm?: number;
    evaluation: string;
  }>> {
    try {
      const tempChess = new Chess(fen);
      const legalMoves = tempChess.moves({ verbose: true });
      // Debug logging removed for production
      
      const tablebaseMoves = [];

      // Check more moves than requested to find best ones
      const movesToCheck = Math.min(legalMoves.length, count * 3);
      
      for (const move of legalMoves.slice(0, movesToCheck)) {
        tempChess.move(move);
        const positionAfterMove = tempChess.fen();
        
        try {
          const info = await this.tablebaseService.getTablebaseInfo(positionAfterMove);
          // Process tablebase response
          
          if (info && info.isTablebasePosition && info.result?.wdl !== undefined) {
            // WDL values are from perspective of position after move
            // We need to negate to get from current player's perspective
            const wdlFromCurrentPlayer = -info.result.wdl;
            tablebaseMoves.push({
              move: move.san,
              wdl: wdlFromCurrentPlayer,
              dtm: info.result.dtz ?? undefined,
              evaluation: wdlFromCurrentPlayer === 2 ? 'Win' : wdlFromCurrentPlayer === -2 ? 'Loss' : 'Draw'
            });
          }
        } catch (moveError) {
        }
        
        tempChess.undo();
      }

      // Sort moves by quality
      
      // Sort by WDL (wins first, then draws, then losses)
      return tablebaseMoves.sort((a, b) => b.wdl - a.wdl).slice(0, count);
    } catch (error) {
      return [];
    }
  }

  /**
   * Counts pieces on the board
   */
  private countPieces(fen: string): number {
    const boardPart = fen.split(' ')[0];
    return (boardPart.match(/[pnbrqkPNBRQK]/g) || []).length;
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