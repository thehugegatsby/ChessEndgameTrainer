/**
 * @file ChessGameLogic - Chess.js Abstraction Layer
 * @description Mobile-compatible wrapper for chess.js with German notation support
 */

import { Chess, type Square, type Move as ChessJsMove } from 'chess.js';
import type { ChessGameLogicInterface, MoveInput, GamePosition } from './types';
import { PIECE_NOTATION_MAP } from './types';

/**
 * Chess game logic implementation wrapping chess.js
 * Provides consistent interface for web and future mobile platforms
 */
export class ChessGameLogic implements ChessGameLogicInterface {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  // Position Management
  loadFen(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  getFen(): string {
    return this.chess.fen();
  }

  // Move Operations
  makeMove(move: MoveInput): ChessJsMove | null {
    try {
      const normalizedMove = this.normalizeMove(move);
      return this.chess.move(normalizedMove);
    } catch {
      return null;
    }
  }

  validateMove(move: MoveInput): boolean {
    try {
      const normalizedMove = this.normalizeMove(move);
      // Performance Note: Creates temporary Chess instance to test move without modifying state
      // This is the safest approach as chess.js modifies state on .move() calls
      const testChess = new Chess(this.chess.fen());
      return testChess.move(normalizedMove) !== null;
    } catch {
      return false;
    }
  }

  getValidMoves(square?: Square): ChessJsMove[] {
    try {
      const options = square ? { square, verbose: true } : { verbose: true };
      return this.chess.moves(options) as ChessJsMove[];
    } catch {
      return [];
    }
  }

  isMoveLegal(move: MoveInput): boolean {
    try {
      const normalizedMove = this.normalizeMove(move);
      const testChess = new Chess(this.chess.fen());
      return testChess.move(normalizedMove) !== null;
    } catch {
      return false;
    }
  }

  // Game Status
  isGameOver(): boolean {
    return this.chess.isGameOver();
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

  isCheck(): boolean {
    return this.chess.isCheck();
  }

  getTurn(): 'w' | 'b' {
    return this.chess.turn();
  }

  // History
  undo(): ChessJsMove | null {
    return this.chess.undo();
  }

  getHistory(): ChessJsMove[] {
    return this.chess.history({ verbose: true }) as ChessJsMove[];
  }

  // German Notation Support (Private API)
  // @ts-expect-error - Method reserved for future use when extending German notation support
  private parseGermanMove(move: string): MoveInput | null {
    // TODO: Implement comprehensive German notation parsing
    // For now, delegate to normalizeMove
    try {
      return this.normalizeMove(move);
    } catch {
      return null;
    }
  }

  // Get complete game position
  getPosition(): GamePosition {
    return {
      fen: this.getFen(),
      turn: this.getTurn(),
      moveHistory: this.getHistory(),
      gameStatus: {
        isGameOver: this.isGameOver(),
        isCheckmate: this.isCheckmate(),
        isStalemate: this.isStalemate(),
        isDraw: this.isDraw(),
        isCheck: this.isCheck(),
        gameResult: this.getGameResult(),
      },
    };
  }

  // Private helper methods
  private normalizeMove(move: MoveInput): string | { from: Square; to: Square; promotion?: string } {
    if (typeof move === 'string') {
      return this.normalizeGermanMove(move);
    }
    
    if (typeof move === 'object' && 'from' in move && 'to' in move) {
      // Handle both simple move objects and full ChessJsMove objects
      const result: { from: Square; to: Square; promotion?: string } = {
        from: move.from,
        to: move.to,
      };
      
      if (move.promotion) {
        const normalizedPromotion = this.normalizePromotionPiece(move.promotion);
        if (normalizedPromotion) {
          result.promotion = normalizedPromotion;
        }
      }
      
      return result;
    }

    // Fallback - should not reach here with proper typing
    throw new Error('Invalid move format');
  }

  private normalizeGermanMove(move: string): string | { from: Square; to: Square; promotion?: string } {
    // Format 1: "e7e8D" or "e7-e8D" (from-to-promotion with optional dash)
    let promotionMatch = move.match(/^([a-h][1-8])-?([a-h][1-8])([DTLSQRBN])$/i);
    if (promotionMatch && promotionMatch[1] && promotionMatch[2] && promotionMatch[3]) {
      const normalizedPromotion = this.normalizePromotionPiece(promotionMatch[3]);
      return {
        from: promotionMatch[1] as Square,
        to: promotionMatch[2] as Square,
        ...(normalizedPromotion && { promotion: normalizedPromotion })
      };
    }
    
    // Format 2: Standard SAN with German promotion (handles captures and regular moves)
    // Examples: "e8D", "e8=D", "exd8D", "exd8=D", "Nd7-e5D"
    const sanPromotionRegex = /^(.+?)=?([DTLSQRBN])$/i;
    promotionMatch = move.match(sanPromotionRegex);
    if (promotionMatch && promotionMatch[2]) {
      const baseMoveStr = promotionMatch[1];
      const promotionPiece = promotionMatch[2];
      const normalizedPromotion = this.normalizePromotionPiece(promotionPiece);
      
      // Return normalized SAN notation with standardized promotion piece
      return `${baseMoveStr}=${(normalizedPromotion || '').toLowerCase()}`;
    }
    
    return move;
  }

  private normalizePromotionPiece(piece: string): string | undefined {
    return PIECE_NOTATION_MAP[piece as keyof typeof PIECE_NOTATION_MAP] || piece.toLowerCase();
  }

  private getGameResult(): string | null {
    if (this.isCheckmate()) {
      return this.getTurn() === 'w' ? '0-1' : '1-0';
    }
    if (this.isDraw() || this.isStalemate()) {
      return '1/2-1/2';
    }
    return null;
  }
}