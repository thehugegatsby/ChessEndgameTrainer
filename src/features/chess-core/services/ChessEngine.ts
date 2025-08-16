/**
 * ChessEngine - Core wrapper around chess.js
 *
 * This class provides a clean interface to chess.js library,
 * handling all direct interactions with the chess engine.
 * Part of the Clean Architecture refactoring of ChessService.
 */

import { Chess, type Move as ChessJsMove, type Square } from 'chess.js';
import type { IChessEngine } from '../types/interfaces';

export default class ChessEngine implements IChessEngine {
  private chess: Chess;
  private startingFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  constructor() {
    this.chess = new Chess();
  }

  /**
   * Initialize with a FEN position
   */
  public initialize(fen: string): boolean {
    try {
      this.chess = new Chess(fen);
      this.startingFen = fen;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reset to starting position
   */
  public reset(): void {
    this.chess = new Chess(this.startingFen);
  }

  /**
   * Get current FEN
   */
  public getFen(): string {
    return this.chess.fen();
  }

  /**
   * Get current PGN
   */
  public getPgn(): string {
    return this.chess.pgn();
  }

  /**
   * Make a move
   */
  public move(
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string
  ): ChessJsMove | null {
    try {
      const result = this.chess.move(move);
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Undo last move
   */
  public undo(): ChessJsMove | null {
    const move = this.chess.undo();
    return move || null;
  }

  /**
   * Check if game is over
   */
  public isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Check if in check
   */
  public isCheck(): boolean {
    return this.chess.isCheck();
  }

  /**
   * Check if checkmate
   */
  public isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  /**
   * Check if stalemate
   */
  public isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  /**
   * Check if draw
   */
  public isDraw(): boolean {
    return this.chess.isDraw();
  }

  /**
   * Check if insufficient material
   */
  public isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  /**
   * Check if threefold repetition
   */
  public isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  /**
   * Get whose turn it is
   */
  public turn(): 'w' | 'b' {
    return this.chess.turn();
  }

  /**
   * Type guard for valid chess square
   */
  private isValidSquare(square: string): square is Square {
    return /^[a-h][1-8]$/.test(square);
  }

  /**
   * Get legal moves
   */
  public moves(options?: { square?: string; verbose?: boolean }): string[] | ChessJsMove[] {
    if (!options) {
      return this.chess.moves();
    }

    // Handle chess.js type requirements
    const chessOptions: { square?: Square; verbose?: boolean } = {};
    if (options.verbose !== undefined) {
      chessOptions.verbose = options.verbose;
    }
    if (options.square && this.isValidSquare(options.square)) {
      chessOptions.square = options.square;
    }

    try {
      return this.chess.moves(chessOptions);
    } catch {
      return [];
    }
  }

  /**
   * Get piece at square
   */
  public get(square: string): { type: string; color: 'w' | 'b' } | null {
    if (!this.isValidSquare(square)) {
      return null;
    }

    const piece = this.chess.get(square);
    return piece || null;
  }

  /**
   * Get board array
   */
  public board(): ({ type: string; color: 'w' | 'b' } | null)[][] {
    return this.chess.board();
  }

  /**
   * Load PGN
   */
  public loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get move history
   */
  public history(options?: { verbose?: boolean }): string[] | ChessJsMove[] {
    if (options?.verbose === true) {
      return this.chess.history({ verbose: true });
    }
    return this.chess.history();
  }

  /**
   * Load FEN
   */
  public load(fen: string): boolean {
    try {
      this.chess = new Chess(fen);
      this.startingFen = fen; // Fix: Update startingFen so reset() works correctly
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear board
   */
  public clear(): void {
    this.chess.clear();
  }
}
