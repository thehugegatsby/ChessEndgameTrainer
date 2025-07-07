/**
 * @fileoverview Move Handling for ScenarioEngine
 * Handles move validation, execution, and engine responses
 */

import { Chess, Move as ChessJsMove } from 'chess.js';
import { Engine } from '../../engine';
import type { Move as CustomMove } from '../../../../types/chess';

/**
 * Move handling and game operations
 * Manages player moves, engine responses, and move validation
 */
export class MoveHandler {
  private chess: Chess;
  private engine: Engine;

  constructor(chess: Chess, engine: Engine) {
    this.chess = chess;
    this.engine = engine;
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
  async makeMove(move: { 
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
          // Engine move failed, continue without error
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
  async getBestMove(fen: string): Promise<string | null> {
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
   * Converts engine notation (e2e4) to algebraic notation (e4)
   */
  convertEngineNotation(engineMove: string, fen: string): string {
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
}