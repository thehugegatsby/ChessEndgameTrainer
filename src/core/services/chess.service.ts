import { Chess } from 'chess.js';
import type { Move, Square } from 'chess.js';
import type { ChessSnapshot, ChessMove, Result } from '../types';
import { createOk, createError } from '../types';

export type ChessError = 
  | { code: 'INVALID_FEN'; message: string }
  | { code: 'INVALID_MOVE'; message: string }
  | { code: 'GAME_OVER'; message: string };

/**
 * ChessService - Single source of truth for chess game state
 * Event-driven wrapper around chess.js
 */
export class ChessService {
  private chess: Chess;
  private listeners = new Set<(snapshot: ChessSnapshot) => void>();
  private moveHistory: ChessMove[] = [];

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  // ========== State Access ==========
  
  getFen(): string {
    return this.chess.fen();
  }

  getSnapshot(): ChessSnapshot {
    const history = this.chess.history({ verbose: true });
    const lastMove = history.length > 0 ? history[history.length - 1] : undefined;
    
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      legalMoves: this.getLegalMovesUCI(),
      gameState: this.getGameState(),
      history: this.moveHistory.map(m => `${m.from}${m.to}${m.promotion || ''}`),
      inCheck: this.chess.inCheck(),
      ...(lastMove && {
        lastMove: {
          from: lastMove.from,
          to: lastMove.to,
          ...(lastMove.promotion && { promotion: lastMove.promotion })
        }
      })
    };
  }

  // ========== State Mutations ==========
  
  loadFen(fen: string): Result<void, ChessError> {
    try {
      this.chess.load(fen);
      this.moveHistory = [];
      this.emit();
      return createOk(undefined);
    } catch {
      return createError({ 
        code: 'INVALID_FEN', 
        message: `Invalid FEN: ${fen}` 
      });
    }
  }

  makeMove(uci: string): Result<Move, ChessError> {
    if (this.chess.isGameOver()) {
      return createError({
        code: 'GAME_OVER',
        message: 'Game is already over'
      });
    }

    try {
      // Parse UCI to move object
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      const promotion = uci.slice(4, 5);

      const move = promotion 
        ? this.chess.move({ from, to, promotion })
        : this.chess.move({ from, to });
      
      // Store in our history
      this.moveHistory.push({
        from,
        to,
        ...(promotion && { promotion }),
        san: move.san
      });
      
      this.emit();
      return createOk(move);
    } catch {
      return createError({
        code: 'INVALID_MOVE',
        message: `Invalid move: ${uci}`
      });
    }
  }

  undoMove(): Result<Move, ChessError> {
    const move = this.chess.undo();
    if (!move) {
      return createError({
        code: 'INVALID_MOVE',
        message: 'No move to undo'
      });
    }
    
    this.moveHistory.pop();
    this.emit();
    return createOk(move);
  }

  reset(): void {
    this.chess.reset();
    this.moveHistory = [];
    this.emit();
  }

  // ========== Move Validation ==========
  
  isValidMove(uci: string): boolean {
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promotion = uci.slice(4, 5);
    
    const moves = this.chess.moves({ verbose: true });
    return moves.some(m => 
      m.from === from && 
      m.to === to && 
      m.promotion === promotion
    );
  }

  getLegalMovesUCI(): string[] {
    return this.chess.moves({ verbose: true }).map(m => 
      `${m.from}${m.to}${m.promotion || ''}`
    );
  }

  getLegalMovesFrom(square: string): string[] {
    try {
      return this.chess.moves({ square: square as Square, verbose: true })
        .map(m => `${m.from}${m.to}${m.promotion || ''}`);
    } catch {
      return [];
    }
  }

  // ========== Game State ==========
  
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  isCheck(): boolean {
    return this.chess.inCheck();
  }

  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  isDraw(): boolean {
    return this.chess.isDraw();
  }

  getTurn(): 'w' | 'b' {
    return this.chess.turn();
  }

  // ========== Event System ==========
  
  subscribe(listener: (snapshot: ChessSnapshot) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(listener => listener(snapshot));
  }

  // ========== Helpers ==========
  
  private getGameState(): 'playing' | 'checkmate' | 'stalemate' | 'draw' {
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isDraw()) return 'draw';
    return 'playing';
  }

  // Convert SAN to UCI
  sanToUci(san: string): Result<string, ChessError> {
    try {
      // Create a temporary chess instance with same position
      const tempChess = new Chess(this.chess.fen());
      const move = tempChess.move(san);
      if (!move) {
        return createError({
          code: 'INVALID_MOVE',
          message: `Invalid SAN notation: ${san}`
        });
      }
      return createOk(`${move.from}${move.to}${move.promotion || ''}`);
    } catch {
      return createError({
        code: 'INVALID_MOVE',
        message: `Failed to parse SAN: ${san}`
      });
    }
  }

  // Convert UCI to SAN
  uciToSan(uci: string): Result<string, ChessError> {
    try {
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      const promotion = uci.slice(4, 5);
      
      // Create temporary chess to get SAN without modifying state
      const tempChess = new Chess(this.chess.fen());
      const move = promotion 
        ? tempChess.move({ from, to, promotion })
        : tempChess.move({ from, to });
      
      if (!move) {
        return createError({
          code: 'INVALID_MOVE',
          message: `Invalid UCI: ${uci}`
        });
      }
      
      return createOk(move.san);
    } catch {
      return createError({
        code: 'INVALID_MOVE',
        message: `Failed to convert UCI: ${uci}`
      });
    }
  }
}