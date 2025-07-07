/**
 * @fileoverview Utility Methods for ScenarioEngine
 * Handles statistics, debugging, and helper functions
 */

import { Chess } from 'chess.js';
import { TablebaseManager } from './tablebaseManager';
import { EvaluationManager } from './evaluationManager';
import { MoveHandler } from './moveHandler';
import { InstanceManager } from './instanceManager';

/**
 * Utility methods and statistics
 * Provides debugging information, statistics, and helper functions
 */
export class Utilities {
  private chess: Chess;
  private tablebaseManager: TablebaseManager;
  private evaluationManager: EvaluationManager;
  private moveHandler: MoveHandler;
  private initialFen: string;

  constructor(
    chess: Chess, 
    tablebaseManager: TablebaseManager,
    evaluationManager: EvaluationManager,
    moveHandler: MoveHandler,
    initialFen: string
  ) {
    this.chess = chess;
    this.tablebaseManager = tablebaseManager;
    this.evaluationManager = evaluationManager;
    this.moveHandler = moveHandler;
    this.initialFen = initialFen;
  }

  /**
   * Gets combined best moves from engine and tablebase
   * @param fen - Position to analyze
   * @param count - Number of best moves to return (default: 3)
   */
  async getBestMoves(fen: string, count: number = 3): Promise<{
    engine: Array<{ move: string; evaluation: number; mate?: number }>;
    tablebase: Array<{ move: string; wdl: number; dtm?: number; evaluation: string }>;
  }> {
    const result = {
      engine: [] as Array<{ move: string; evaluation: number; mate?: number }>,
      tablebase: [] as Array<{ move: string; wdl: number; dtm?: number; evaluation: string }>
    };

    try {
      // Get engine's top moves
      const engineMoves = await this.evaluationManager.getEngineBestMoves(fen, count);
      result.engine = engineMoves.map(m => ({
        move: this.moveHandler.convertEngineNotation(m.move, fen),
        evaluation: m.evaluation,
        mate: m.mate
      }));

      // Check if this is a tablebase position
      if (this.tablebaseManager.isTablebasePosition(fen)) {
        const tablebaseMoves = await this.tablebaseManager.getTablebaseMoves(fen, count);
        result.tablebase = tablebaseMoves;
      }
    } catch (error) {
      // Return empty arrays on error
    }

    return result;
  }

  /**
   * Gets engine statistics for debugging
   */
  getStats(): { 
    instanceCount: number; 
    currentFen: string; 
    initialFen: string;
    cacheStats: { size: number; maxSize: number };
  } {
    return {
      instanceCount: InstanceManager.getInstanceCount(),
      currentFen: this.chess.fen(),
      initialFen: this.initialFen,
      cacheStats: this.tablebaseManager.getCacheStats()
    };
  }

  /**
   * Gets current position FEN
   */
  getFen(): string {
    return this.chess.fen();
  }

  /**
   * Gets the Chess.js instance for advanced operations
   * Use with caution - prefer using ScenarioEngine methods
   */
  getChessInstance(): Chess {
    return this.chess;
  }
}