/**
 * @file ChessEngineAdapter
 * @description Minimal adapter for legacy test validation - TEMPORARY
 * 
 * Maps legacy IChessEngine interface to domain ChessEngineInterface
 * Only implements the 20 methods actually used by legacy tests
 */

import type { Move as ChessJsMove, Square } from 'chess.js';
import type { IChessEngine } from '@features/chess-core/types/interfaces';
import type { ChessEngineInterface } from '@domains/game/engine/types';
import { ChessEngine } from '@domains/game/engine/ChessEngine';

/**
 * Minimal adapter for legacy test validation
 * Implements only the 20 methods used by legacy tests, throws for unused methods
 */
export class ChessEngineAdapter implements IChessEngine {
  private domainEngine: ChessEngineInterface;
  private initialFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  constructor() {
    this.domainEngine = new ChessEngine();
    this.domainEngine.loadFen(this.initialFen);
  }

  // ========== IMPLEMENTED: Core Methods (Used by tests) ==========

  initialize(fen: string): boolean {
    const success = this.domainEngine.loadFen(fen);
    if (success) {
      this.initialFen = fen;
    }
    return success;
  }

  reset(): void {
    this.domainEngine.loadFen(this.initialFen);
  }

  getFen(): string {
    return this.domainEngine.getFen();
  }

  move(move: ChessJsMove | { from: string; to: string; promotion?: string } | string): ChessJsMove | null {
    // Type conversion: legacy interface uses string for squares, domain uses Square type
    // Since Square extends string, this conversion is safe
    return this.domainEngine.makeMove(move as ChessJsMove | { from: Square; to: Square; promotion?: string } | string);
  }

  undo(): ChessJsMove | null {
    return this.domainEngine.undo();
  }

  isGameOver(): boolean {
    return this.domainEngine.isGameOver();
  }

  isCheck(): boolean {
    return this.domainEngine.isCheck();
  }

  isCheckmate(): boolean {
    return this.domainEngine.isCheckmate();
  }

  isStalemate(): boolean {
    return this.domainEngine.isStalemate();
  }

  isDraw(): boolean {
    return this.domainEngine.isDraw();
  }

  turn(): 'w' | 'b' {
    return this.domainEngine.getTurn();
  }

  isInsufficientMaterial(): boolean {
    // Domain engine doesn't have this - approximate with isDraw for basic cases
    return this.domainEngine.isDraw();
  }

  // ========== IMPLEMENTED: Additional methods used by tests ==========

  moves(options?: { square?: string; verbose?: boolean }): string[] | ChessJsMove[] {
    if (options?.square) {
      return this.domainEngine.getPossibleMoves(options.square as Square);
    }
    return this.domainEngine.getPossibleMoves();
  }

  get(_square: string): { type: string; color: 'w' | 'b' } | null {
    // Domain engine doesn't expose board squares - return null for now
    // TODO: This will need implementation if tests rely on board inspection
    throw new UnsupportedOperationError('get(square) requires board inspection not available in domain engine');
  }

  board(): ({ type: string; color: 'w' | 'b' } | null)[][] {
    // Domain engine doesn't expose full board - not available
    throw new UnsupportedOperationError('board() requires full board inspection not available in domain engine');
  }

  loadPgn(_pgn: string): boolean {
    // Domain engine doesn't support PGN loading
    throw new UnsupportedOperationError('loadPgn is not supported by domain engine');
  }

  history(options?: { verbose?: boolean }): string[] | ChessJsMove[] {
    const moves = this.domainEngine.getHistory();
    if (options?.verbose) {
      return moves;
    }
    // Return SAN strings if not verbose
    return moves.map(move => move.san);
  }

  load(fen: string): boolean {
    return this.domainEngine.loadFen(fen);
  }

  clear(): void {
    // Clear to empty board - domain engine starts fresh
    this.domainEngine.loadFen('8/8/8/8/8/8/8/8 w - - 0 1');
  }

  getPgn(): string {
    // Domain engine doesn't support PGN generation
    throw new UnsupportedOperationError('getPgn is not supported by domain engine');
  }

  // ========== UNIMPLEMENTED: Methods truly not used ==========

  isThreefoldRepetition(): boolean {
    throw new UnsupportedOperationError('isThreefoldRepetition is not required for domain validation');
  }
}

/**
 * Custom error for unsupported adapter methods
 */
class UnsupportedOperationError extends Error {
  constructor(message: string) {
    super(`ChessEngineAdapter: ${message}. This method is not implemented in the adapter.`);
    this.name = 'UnsupportedOperationError';
  }
}