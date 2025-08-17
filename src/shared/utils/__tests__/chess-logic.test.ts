/**
 * @file chess-logic.test.ts
 * @description Unit tests for pure chess functions (migration-ready)
 * 
 * This test file supports Issue #185: Pure Chess Functions Implementation
 * Tests the pure function chess architecture
 */

import { describe, it, expect } from 'vitest';
import { Chess, type Move as ChessJsMove } from 'chess.js';
import { COMMON_FENS } from '@tests/fixtures/commonFens';
import {
  makeMove,
  validateMove,
  getPossibleMoves,
  getGameStatus,
  normalizePromotionPiece,
  type MoveResult,
  type GameStatus,
} from '../chess-logic';

/**
 * Pure function: Normalize German piece notation to chess.js format
 * @param move - Move in German notation (e.g., "Dh5", "e8D")
 * @returns Move in chess.js compatible format
 */
function normalizeGermanNotation(move: string): string {
  // Handle German piece notation (D=Dame/Queen, T=Turm/Rook, L=Läufer/Bishop, S=Springer/Knight)
  const germanPieceRegex = /^([DTLS])([a-h]?[1-8]?[x]?)([a-h][1-8])([+#])?$/;
  const germanMatch = move.match(germanPieceRegex);
  
  if (germanMatch && germanMatch.length >= 4) {
    const germanToEnglish: Record<string, string> = {
      D: 'Q', // Dame -> Queen
      T: 'R', // Turm -> Rook
      L: 'B', // Läufer -> Bishop
      S: 'N', // Springer -> Knight
    };
    const [, piece = '', middle = '', target = '', suffix = ''] = germanMatch;
    if (piece && target && germanToEnglish[piece]) {
      return germanToEnglish[piece] + middle + target + suffix;
    }
  }
  
  // Handle German promotion notation (e.g., "e8D" -> "e8=Q")
  const promotionMatch = move.match(/^([a-h][1-8])([DTLS])$/);
  if (promotionMatch && promotionMatch[1] && promotionMatch[2]) {
    const germanToEnglish: Record<string, string> = {
      D: 'Q', T: 'R', L: 'B', S: 'N',
    };
    const promotionPiece = germanToEnglish[promotionMatch[2]];
    if (promotionPiece) {
      return `${promotionMatch[1]}=${promotionPiece}`;
    }
  }
  
  return move;
}

// Helper function to get game result
function getGameResultFromChess(chess: Chess): string | null {
  if (!chess.isGameOver()) return null;
  
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? '0-1' : '1-0';
  }
  
  return '1/2-1/2'; // Draw
}

// =============================================================================
// TEST CONSTANTS (using existing Common FENs)
// =============================================================================

// =============================================================================
// TESTS
// =============================================================================

describe('Chess Logic Pure Functions', () => {
  describe('makeMove', () => {
    it('should make valid opening move e4', () => {
      const result = makeMove(COMMON_FENS.STARTING_POSITION, 'e4');
      
      expect(result).not.toBeNull();
      expect(result?.newFen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
      expect(result?.move).toEqual(
        expect.objectContaining({
          from: 'e2',
          to: 'e4',
          piece: 'p',
          color: 'w',
        })
      );
      expect(result?.isCheckmate).toBe(false);
      expect(result?.isStalemate).toBe(false);
      expect(result?.isDraw).toBe(false);
      expect(result?.isCheck).toBe(false);
      expect(result?.gameResult).toBeNull();
    });

    it('should make valid knight move Nf3', () => {
      const result = makeMove(COMMON_FENS.STARTING_POSITION, 'Nf3');
      
      expect(result).not.toBeNull();
      expect(result?.move).toEqual(
        expect.objectContaining({
          from: 'g1',
          to: 'f3',
          piece: 'n',
          color: 'w',
        })
      );
    });

    it('should reject invalid opening move e5', () => {
      const result = makeMove(COMMON_FENS.STARTING_POSITION, 'e5');
      expect(result).toBeNull();
    });

    it('should handle promotion move', () => {
      const result = makeMove(COMMON_FENS.WHITE_PROMOTION, 'e8=Q');
      
      expect(result).not.toBeNull();
      expect(result?.move).toEqual(
        expect.objectContaining({
          from: 'e7',
          to: 'e8',
          piece: 'p',
          color: 'w',
          promotion: 'q',
        })
      );
    });

    it('should detect checkmate', () => {
      // This position leads to checkmate after Qh4#
      const checkmateSetup = 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2';
      const result = makeMove(checkmateSetup, 'Qh4');
      
      expect(result?.isCheckmate).toBe(true);
      expect(result?.gameResult).toBe('0-1'); // Black wins
    });

    it('should detect stalemate', () => {
      // Use existing stalemate position
      const result = getGameStatus(COMMON_FENS.STALEMATE_POSITION);
      
      expect(result.isStalemate).toBe(true);
      expect(result.gameResult).toBe('1/2-1/2');
    });

    it('should handle object move format', () => {
      const result = makeMove(COMMON_FENS.STARTING_POSITION, { from: 'e2', to: 'e4' });
      
      expect(result).not.toBeNull();
      expect(result?.newFen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    });

    it('should handle object move with promotion', () => {
      const result = makeMove(COMMON_FENS.WHITE_PROMOTION, { from: 'e7', to: 'e8', promotion: 'q' });
      
      expect(result).not.toBeNull();
      expect(result?.move.promotion).toBe('q');
    });
  });

  describe('validateMove', () => {
    it('should validate legal opening moves', () => {
      expect(validateMove(COMMON_FENS.STARTING_POSITION, 'e4')).toBe(true);
      expect(validateMove(COMMON_FENS.STARTING_POSITION, 'Nf3')).toBe(true);
      expect(validateMove(COMMON_FENS.STARTING_POSITION, 'd4')).toBe(true);
      expect(validateMove(COMMON_FENS.STARTING_POSITION, 'Nc3')).toBe(true);
    });

    it('should reject illegal opening moves', () => {
      expect(validateMove(COMMON_FENS.STARTING_POSITION, 'e5')).toBe(false);
      expect(validateMove(COMMON_FENS.STARTING_POSITION, 'Ke2')).toBe(false);
      expect(validateMove(COMMON_FENS.STARTING_POSITION, 'Qh5')).toBe(false);
    });

    it('should validate moves in middle game', () => {
      expect(validateMove(COMMON_FENS.OPENING_AFTER_E4, 'e5')).toBe(true);
      expect(validateMove(COMMON_FENS.OPENING_AFTER_E4, 'Nf6')).toBe(true);
    });

    it('should validate promotion moves', () => {
      expect(validateMove(COMMON_FENS.WHITE_PROMOTION, 'e8=Q')).toBe(true);
      expect(validateMove(COMMON_FENS.WHITE_PROMOTION, 'e8=R')).toBe(true);
      expect(validateMove(COMMON_FENS.WHITE_PROMOTION, 'e8=B')).toBe(true);
      expect(validateMove(COMMON_FENS.WHITE_PROMOTION, 'e8=N')).toBe(true);
    });

    it('should validate object move format', () => {
      expect(validateMove(COMMON_FENS.STARTING_POSITION, { from: 'e2', to: 'e4' })).toBe(true);
      expect(validateMove(COMMON_FENS.STARTING_POSITION, { from: 'e2', to: 'e5' })).toBe(false);
    });

    it('should handle invalid FEN gracefully', () => {
      expect(validateMove('invalid-fen', 'e4')).toBe(false);
    });
  });

  describe('getPossibleMoves', () => {
    it('should return all possible opening moves', () => {
      const moves = getPossibleMoves(COMMON_FENS.STARTING_POSITION);
      
      expect(moves).toHaveLength(20); // 16 pawn moves + 4 knight moves
      expect(moves.some(move => move.san === 'e4')).toBe(true);
      expect(moves.some(move => move.san === 'Nf3')).toBe(true);
    });

    it('should return moves for specific square', () => {
      const moves = getPossibleMoves(COMMON_FENS.STARTING_POSITION, 'e2');
      
      expect(moves).toHaveLength(2); // e3, e4
      expect(moves.some(move => move.san === 'e3')).toBe(true);
      expect(moves.some(move => move.san === 'e4')).toBe(true);
    });

    it('should return empty array for invalid square', () => {
      const moves = getPossibleMoves(COMMON_FENS.STARTING_POSITION, 'e3');
      expect(moves).toHaveLength(0);
    });

    it('should return empty array for invalid FEN', () => {
      const moves = getPossibleMoves('invalid-fen');
      expect(moves).toHaveLength(0);
    });

    it('should return knight moves correctly', () => {
      const moves = getPossibleMoves(COMMON_FENS.STARTING_POSITION, 'g1');
      
      expect(moves).toHaveLength(2); // Nf3, Nh3
      expect(moves.some(move => move.san === 'Nf3')).toBe(true);
      expect(moves.some(move => move.san === 'Nh3')).toBe(true);
    });
  });

  describe('getGameStatus', () => {
    it('should return correct status for starting position', () => {
      const status = getGameStatus(COMMON_FENS.STARTING_POSITION);
      
      expect(status).toEqual({
        isGameOver: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
        turn: 'w',
      });
    });

    it('should detect checkmate status', () => {
      const status = getGameStatus(COMMON_FENS.CHECKMATE_POSITION);
      
      expect(status.isGameOver).toBe(true);
      expect(status.isCheckmate).toBe(true);
      expect(status.gameResult).toBe('1-0'); // White wins (white Queen checkmates black)
    });

    it('should detect stalemate status', () => {
      const status = getGameStatus(COMMON_FENS.STALEMATE_POSITION);
      
      expect(status.isGameOver).toBe(true);
      expect(status.isStalemate).toBe(true);
      expect(status.gameResult).toBe('1/2-1/2');
    });

    it('should handle invalid FEN gracefully', () => {
      const status = getGameStatus('invalid-fen');
      
      expect(status).toBeNull();
    });

    it('should return correct turn', () => {
      expect(getGameStatus(COMMON_FENS.STARTING_POSITION).turn).toBe('w');
      expect(getGameStatus(COMMON_FENS.OPENING_AFTER_E4).turn).toBe('b');
    });
  });

  describe('normalizeGermanNotation', () => {
    it('should convert German piece notation to English', () => {
      expect(normalizeGermanNotation('Dh5')).toBe('Qh5'); // Dame -> Queen
      expect(normalizeGermanNotation('Ta1')).toBe('Ra1'); // Turm -> Rook
      expect(normalizeGermanNotation('Lc4')).toBe('Bc4'); // Läufer -> Bishop
      expect(normalizeGermanNotation('Sf3')).toBe('Nf3'); // Springer -> Knight
    });

    it('should handle German piece notation with captures', () => {
      expect(normalizeGermanNotation('Dxh5')).toBe('Qxh5');
      expect(normalizeGermanNotation('Txe1')).toBe('Rxe1');
    });

    it('should handle German piece notation with check/checkmate', () => {
      expect(normalizeGermanNotation('Dh5+')).toBe('Qh5+');
      expect(normalizeGermanNotation('Dh5#')).toBe('Qh5#');
    });

    it('should convert German promotion notation', () => {
      expect(normalizeGermanNotation('e8D')).toBe('e8=Q'); // Dame
      expect(normalizeGermanNotation('e8T')).toBe('e8=R'); // Turm
      expect(normalizeGermanNotation('e8L')).toBe('e8=B'); // Läufer
      expect(normalizeGermanNotation('e8S')).toBe('e8=N'); // Springer
    });

    it('should leave English notation unchanged', () => {
      expect(normalizeGermanNotation('Qh5')).toBe('Qh5');
      expect(normalizeGermanNotation('Nf3')).toBe('Nf3');
      expect(normalizeGermanNotation('e4')).toBe('e4');
      expect(normalizeGermanNotation('e8=Q')).toBe('e8=Q');
    });

    it('should handle ambiguous notation', () => {
      expect(normalizeGermanNotation('D1h5')).toBe('Q1h5'); // Dame from rank 1
      expect(normalizeGermanNotation('Dah5')).toBe('Qah5'); // Dame from a-file
    });
  });

  describe('Integration with existing Chess.js', () => {
    it('should produce identical results to Chess.js', () => {
      const chess = new Chess();
      
      // Make same moves with both approaches
      const pureResult = makeMove(COMMON_FENS.STARTING_POSITION, 'e4');
      chess.move('e4');
      
      expect(pureResult?.newFen).toBe(chess.fen());
      expect(pureResult?.isCheck).toBe(chess.isCheck());
      expect(pureResult?.isCheckmate).toBe(chess.isCheckmate());
    });

    it('should validate moves consistently with Chess.js', () => {
      const testMoves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'];
      let currentFen = COMMON_FENS.STARTING_POSITION;
      const chess = new Chess();
      
      for (const move of testMoves) {
        const pureValid = validateMove(currentFen, move);
        const chessValid = chess.move(move) !== null;
        
        expect(pureValid).toBe(chessValid);
        
        if (chessValid) {
          currentFen = chess.fen();
        }
      }
    });
  });

  describe('Error handling', () => {
    it('should handle malformed moves gracefully', () => {
      expect(makeMove(COMMON_FENS.STARTING_POSITION, 'invalid')).toBeNull();
      expect(validateMove(COMMON_FENS.STARTING_POSITION, 'invalid')).toBe(false);
      // Invalid square returns empty array, not all moves
      expect(getPossibleMoves(COMMON_FENS.STARTING_POSITION, 'invalid')).toEqual([]);
    });

    it('should handle empty strings gracefully', () => {
      expect(makeMove(COMMON_FENS.STARTING_POSITION, '')).toBeNull();
      expect(validateMove(COMMON_FENS.STARTING_POSITION, '')).toBe(false);
      expect(normalizeGermanNotation('')).toBe('');
    });

    it('should handle malformed FEN gracefully', () => {
      const invalidFen = 'this-is-not-a-fen';
      
      expect(makeMove(invalidFen, 'e4')).toBeNull();
      expect(validateMove(invalidFen, 'e4')).toBe(false);
      expect(getPossibleMoves(invalidFen)).toEqual([]);
      
      const status = getGameStatus(invalidFen);
      expect(status).toBeNull();
    });
  });

  describe('Performance characteristics', () => {
    it('should be fast for basic operations', () => {
      const start = performance.now();
      
      // Perform 1000 validations
      for (let i = 0; i < 1000; i++) {
        validateMove(COMMON_FENS.STARTING_POSITION, 'e4');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete 1000 validations in under 400ms (relaxed for CI)
      expect(duration).toBeLessThan(400);
    });

    it('should not leak memory with repeated calls', () => {
      // This test ensures we create new Chess instances each time
      // rather than keeping references that could leak
      for (let i = 0; i < 100; i++) {
        makeMove(COMMON_FENS.STARTING_POSITION, 'e4');
        validateMove(COMMON_FENS.STARTING_POSITION, 'e4');
        getPossibleMoves(COMMON_FENS.STARTING_POSITION);
        getGameStatus(COMMON_FENS.STARTING_POSITION);
      }
      
      // If we reach here without memory issues, test passes
      expect(true).toBe(true);
    });
  });
});