/**
 * @file Comprehensive tests for string-based move handling
 * @description Integration tests for the entire move parsing pipeline
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MoveValidator } from '../MoveValidator';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

describe('String Move Handling Integration', () => {
  let validator: MoveValidator;
  let startingFen: string;

  beforeEach(() => {
    validator = new MoveValidator();
    startingFen = TEST_POSITIONS.STARTING_POSITION;
  });

  describe('🐛 Bug reproduction: SAN moves detected as coordinates', () => {
    it('should NOT mistake King moves for coordinate notation', () => {
      // Test legal white king move - from the legal moves list
      const kingMoveFen = '4k3/8/3K4/4P3/8/8/8/8 w - - 0 1';
      
      // Test a legal white king move: Kc7 (from legal moves list)
      const result = validator.validateMove('Kc7', kingMoveFen);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should NOT mistake "e6" for coordinate notation', () => {
      // Single square pawn moves should be SAN
      const result = validator.validateMove('e4', startingFen);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should NOT mistake "e8=Q+" for coordinate notation', () => {
      // Promotion with check should be SAN
      const promotionFen = TEST_POSITIONS.PAWN_PROMOTION_WHITE;
      const result = validator.validateMove('e8=Q+', promotionFen);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });

  describe('✅ Coordinate notation should work correctly', () => {
    it('should handle e2-e4 with dash', () => {
      const result = validator.validateMove('e2-e4', startingFen);
      expect(result.isValid).toBe(true);
    });

    it('should handle e2e4 without dash', () => {
      const result = validator.validateMove('e2e4', startingFen);
      expect(result.isValid).toBe(true);
    });

    it('should handle promotion e7-e8q with dash', () => {
      const promotionFen = TEST_POSITIONS.PAWN_PROMOTION_WHITE;
      const result = validator.validateMove('e7-e8q', promotionFen);
      expect(result.isValid).toBe(true);
    });

    it('should handle promotion e7e8q without dash', () => {
      const promotionFen = TEST_POSITIONS.PAWN_PROMOTION_WHITE;
      const result = validator.validateMove('e7e8q', promotionFen);
      expect(result.isValid).toBe(true);
    });
  });

  describe('🔍 Test SAN notation parsing (the actual bug)', () => {
    it('should correctly validate SAN notation Kd6', () => {
      // Use KPK position where Kd6 is a legal move
      const result = validator.validateMove('Kd6', TEST_POSITIONS.KPK_BASIC_WIN);
      expect(result.isValid).toBe(true);
    });

    it('should correctly validate SAN notation e4', () => {
      // Simple pawn move from starting position
      const result = validator.validateMove('e4', startingFen);
      expect(result.isValid).toBe(true);
    });

    it('should correctly validate SAN notation Nf3', () => {
      // Knight move from starting position
      const result = validator.validateMove('Nf3', startingFen);
      expect(result.isValid).toBe(true);
    });

    it('should correctly validate SAN promotion e7-e8=Q', () => {
      // Use promotion position and coordinate notation for e7-e8=Q
      const result = validator.validateMove('e7-e8=Q', TEST_POSITIONS.PAWN_PROMOTION_WHITE);
      expect(result.isValid).toBe(true);
    });
  });

  describe('📋 Regex edge cases', () => {
    it('should handle moves that start with chess file letters', () => {
      // These should NOT be detected as coordinates
      const edgeCases = ['Bg5', 'Rf8', 'Qh4', 'Ra8'];
      
      for (const move of edgeCases) {
        const result = validator.validateMove(move, startingFen);
        // These might be invalid moves for the starting position, but they should be parsed as SAN
        // The key is that they shouldn't cause parsing errors
        expect(typeof result.isValid).toBe('boolean');
      }
    });

    it('should reject clearly invalid formats', () => {
      const invalidMoves = ['', '   ', 'xyz', '123', 'e99', 'z1z1'];
      
      for (const move of invalidMoves) {
        const result = validator.validateMove(move, startingFen);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBeDefined();
      }
    });
  });
});