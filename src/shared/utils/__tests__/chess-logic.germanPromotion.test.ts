/**
 * @file German Promotion Notation Tests
 * @description Tests for handling German piece notation in pawn promotion
 */

import { describe, it, test, expect, beforeEach } from 'vitest';
import { makeMove, validateMove } from '@shared/utils/chess-logic';

// Import aus der zentralen Fixtures-Datenbank
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

describe('Chess Logic - German Promotion Notation', () => {
  // No service setup needed - using pure functions

  describe('German notation conversion', () => {
    it('should handle German "D" for Dame (Queen) promotion', () => {
      // Test move with German notation (e7 to e8)
      const result = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'D' });

      expect(result).not.toBeNull();
      expect(result?.move.san).toContain('=Q'); // Should be converted to Queen
      expect(result?.move.promotion).toBe('q'); // Internal representation should be 'q'
    });

    it('should handle lowercase German "d" for Dame (Queen) promotion', () => {
      const result = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'd' });

      expect(result).not.toBeNull();
      expect(result?.move.san).toContain('=Q');
      expect(result?.move.promotion).toBe('q');
    });

    it('should handle German "T" for Turm (Rook) promotion', () => {
      const result = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'T' });

      expect(result).not.toBeNull();
      expect(result?.move.san).toContain('=R');
      expect(result?.move.promotion).toBe('r');
    });

    it('should handle German "L" for Läufer (Bishop) promotion', () => {
      const result = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'L' });

      expect(result).not.toBeNull();
      expect(result?.move.san).toContain('=B');
      expect(result?.move.promotion).toBe('b');
    });

    it('should handle German "S" for Springer (Knight) promotion', () => {
      const result = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'S' });

      expect(result).not.toBeNull();
      expect(result?.move.san).toContain('=N');
      expect(result?.move.promotion).toBe('n');
    });

    it('should handle string notation with German promotion "f7f8D"', () => {
      const result = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, 'e7e8D');

      expect(result).not.toBeNull();
      expect(result?.move.san).toContain('=Q');
      expect(result?.move.from).toBe('e7');
      expect(result?.move.to).toBe('e8');
      expect(result?.move.promotion).toBe('q');
    });

    it('should handle string notation with German promotion and dash "f7-f8D"', () => {
      const result = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, 'e7-e8D');

      expect(result).not.toBeNull();
      expect(result?.move.san).toContain('=Q');
      expect(result?.move.from).toBe('e7');
      expect(result?.move.to).toBe('e8');
      expect(result?.move.promotion).toBe('q');
    });

    it('should still handle English notation correctly', () => {
      // Test with standard English notation
      const resultQ = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'Q' });
      expect(resultQ?.move.promotion).toBe('q');

      const resultLowerQ = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'q' });
      expect(resultLowerQ?.move.promotion).toBe('q');
    });

    it('should validate moves with German promotion notation', () => {
      // Validate with German notation
      const isValidD = validateMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'D' });
      expect(isValidD).toBe(true);

      const isValidT = validateMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'T' });
      expect(isValidT).toBe(true);

      const isValidL = validateMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'L' });
      expect(isValidL).toBe(true);

      const isValidS = validateMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'S' });
      expect(isValidS).toBe(true);
    });

    it('should validate string notation with German promotion', () => {
      const isValid = validateMove(TEST_POSITIONS.PAWN_PROMOTION_READY, 'e7e8D');
      expect(isValid).toBe(true);
    });

    it('should validate string notation with German promotion and dash', () => {
      const isValid = validateMove(TEST_POSITIONS.PAWN_PROMOTION_READY, 'e7-e8D');
      expect(isValid).toBe(true);
    });

    it('should handle invalid German notation gracefully', () => {
      // Test with invalid notation (should pass through and fail in chess.js)
      const result = makeMove(TEST_POSITIONS.PAWN_PROMOTION_READY, { from: 'e7', to: 'e8', promotion: 'X' });
      expect(result).toBeNull(); // Invalid promotion piece
    });
  });
});
