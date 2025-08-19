/**
 * @file Pure Chess Game Logic
 * @module domains/chess/ChessGame
 * 
 * @description
 * Clean, simple wrapper around chess.js library.
 * NO training logic, NO UI concerns, NO state management.
 * Pure chess rules and game state only.
 * 
 * This follows Lichess architecture:
 * - Chessground (UI): Pure presentation
 * - Scalachess (Backend): Pure chess logic
 * - Features: Separate layers
 */

import { Chess, type Move as ChessJsMove, type Piece as ChessPiece, type Square as ChessSquare } from 'chess.js';

/**
 * Simple move interface for user input
 */
export interface Move {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/**
 * Result of a move attempt
 */
export interface MoveResult {
  success: boolean;
  move?: ChessJsMove;  // chess.js move object if successful
  error?: string;
  fen: string;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  isCheck: boolean;
  isGameOver: boolean;
  turn: 'w' | 'b';
}

/**
 * Pure Chess Game implementation
 * 
 * @description
 * Thin wrapper around chess.js that provides:
 * - Move validation and execution
 * - Game state queries
 * - FEN/PGN management
 * 
 * Does NOT provide:
 * - Training logic
 * - UI state management
 * - Opponent move scheduling
 * - Quality evaluation
 * - Dialog management
 * 
 * @example
 * ```typescript
 * const game = new ChessGame();
 * 
 * // Make moves (both colors work!)
 * const result1 = game.makeMove({ from: 'e2', to: 'e4' });
 * const result2 = game.makeMove({ from: 'e7', to: 'e5' });
 * 
 * // Query game state
 * console.log(game.getFen());
 * console.log(game.isGameOver());
 * ```
 */
export class ChessGame {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  /**
   * Make a move on the board
   * 
   * @param move - Move to make
   * @returns Result with success status and updated game state
   */
  makeMove(move: Move | string): MoveResult {
    try {
      // chess.js handles the move validation internally
      const result = this.chess.move(move);
      
      if (result) {
        // Move was successful
        return {
          success: true,
          move: result,
          fen: this.chess.fen(),
          isCheckmate: this.chess.isCheckmate(),
          isDraw: this.chess.isDraw(),
          isStalemate: this.chess.isStalemate(),
          isCheck: this.chess.isCheck(),
          isGameOver: this.chess.isGameOver(),
          turn: this.chess.turn()
        };
      } else {
        // Move was invalid
        return {
          success: false,
          error: 'Invalid move',
          fen: this.chess.fen(),
          isCheckmate: this.chess.isCheckmate(),
          isDraw: this.chess.isDraw(),
          isStalemate: this.chess.isStalemate(),
          isCheck: this.chess.isCheck(),
          isGameOver: this.chess.isGameOver(),
          turn: this.chess.turn()
        };
      }
    } catch (error) {
      // chess.js threw an exception
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fen: this.chess.fen(),
        isCheckmate: this.chess.isCheckmate(),
        isDraw: this.chess.isDraw(),
        isStalemate: this.chess.isStalemate(),
        isCheck: this.chess.isCheck(),
        isGameOver: this.chess.isGameOver(),
        turn: this.chess.turn()
      };
    }
  }

  /**
   * Load a position from FEN
   */
  loadFen(fen: string): boolean {
    try {
      // chess.load() returns true on success, throws exception on invalid FEN
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current FEN position
   */
  getFen(): string {
    return this.chess.fen();
  }

  /**
   * Get current PGN
   */
  getPgn(): string {
    return this.chess.pgn();
  }

  /**
   * Get whose turn it is
   */
  getTurn(): 'white' | 'black' {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Check if current position is checkmate
   */
  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  /**
   * Check if current position is draw
   */
  isDraw(): boolean {
    return this.chess.isDraw();
  }

  /**
   * Check if current position is stalemate
   */
  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  /**
   * Check if current position is check
   */
  isCheck(): boolean {
    return this.chess.isCheck();
  }

  /**
   * Get legal moves for current position
   */
  getMoves(): string[] {
    return this.chess.moves();
  }

  /**
   * Get legal moves in verbose format
   */
  getMovesVerbose(): ChessJsMove[] {
    return this.chess.moves({ verbose: true });
  }

  /**
   * Get move history as Move objects
   */
  getHistory(): ChessJsMove[] {
    return this.chess.history({ verbose: true });
  }

  /**
   * Get move history as SAN strings
   */
  getHistoryStrings(): string[] {
    return this.chess.history();
  }

  /**
   * Undo last move
   */
  undo(): ChessJsMove | null {
    return this.chess.undo();
  }

  /**
   * Reset to starting position
   */
  reset(): void {
    this.chess.reset();
  }

  /**
   * Create a copy of the game
   */
  clone(): ChessGame {
    return new ChessGame(this.getFen());
  }

  /**
   * Get piece at square
   */
  getPieceAt(square: string): ChessPiece | null {
    return this.chess.get(square as ChessSquare) ?? null;
  }

  /**
   * Check if move is legal
   */
  isMoveLegal(move: Move | string): boolean {
    try {
      const testGame = this.clone();
      const result = testGame.makeMove(move);
      return result.success;
    } catch {
      return false;
    }
  }
}