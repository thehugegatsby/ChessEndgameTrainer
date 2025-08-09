/**
 * @file ChessService German Promotion Notation Tests
 * @description Tests for handling German piece notation in pawn promotion
 */

import { ChessService } from '@shared/services/ChessService';

// Import aus der zentralen Fixtures-Datenbank
import { COMMON_FENS } from '@tests/fixtures/commonFens';

describe('ChessService - German Promotion Notation', () => {
  let service: ChessService;

  beforeEach(() => {
    service = new ChessService();
  });

  describe('German notation conversion', () => {
    it('should handle German "D" for Dame (Queen) promotion', () => {
      // Verwende pawn promotion position aus der zentralen Fixtures-Datenbank
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      // Test move with German notation (f7 to f8)
      const result = service.move({ from: 'f7', to: 'f8', promotion: 'D' });
      
      expect(result).not.toBeNull();
      expect(result?.san).toContain('=Q'); // Should be converted to Queen
      expect(result?.promotion).toBe('q'); // Internal representation should be 'q'
    });

    it('should handle lowercase German "d" for Dame (Queen) promotion', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      const result = service.move({ from: 'f7', to: 'f8', promotion: 'd' });
      
      expect(result).not.toBeNull();
      expect(result?.san).toContain('=Q');
      expect(result?.promotion).toBe('q');
    });

    it('should handle German "T" for Turm (Rook) promotion', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      const result = service.move({ from: 'f7', to: 'f8', promotion: 'T' });
      
      expect(result).not.toBeNull();
      expect(result?.san).toContain('=R');
      expect(result?.promotion).toBe('r');
    });

    it('should handle German "L" for Läufer (Bishop) promotion', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      const result = service.move({ from: 'f7', to: 'f8', promotion: 'L' });
      
      expect(result).not.toBeNull();
      expect(result?.san).toContain('=B');
      expect(result?.promotion).toBe('b');
    });

    it('should handle German "S" for Springer (Knight) promotion', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      const result = service.move({ from: 'f7', to: 'f8', promotion: 'S' });
      
      expect(result).not.toBeNull();
      expect(result?.san).toContain('=N');
      expect(result?.promotion).toBe('n');
    });

    it('should handle string notation with German promotion "f7f8D"', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);
      
      const result = service.move('f7f8D');
      
      expect(result).not.toBeNull();
      expect(result?.san).toContain('=Q');
      expect(result?.from).toBe('f7');
      expect(result?.to).toBe('f8');
      expect(result?.promotion).toBe('q');
    });

    it('should handle string notation with German promotion and dash "f7-f8D"', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);
      
      const result = service.move('f7-f8D');
      
      expect(result).not.toBeNull();
      expect(result?.san).toContain('=Q');
      expect(result?.from).toBe('f7');
      expect(result?.to).toBe('f8');
      expect(result?.promotion).toBe('q');
    });

    it('should still handle English notation correctly', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      // Test with standard English notation
      const resultQ = service.move({ from: 'f7', to: 'f8', promotion: 'Q' });
      expect(resultQ?.promotion).toBe('q');

      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);
      const resultLowerQ = service.move({ from: 'f7', to: 'f8', promotion: 'q' });
      expect(resultLowerQ?.promotion).toBe('q');
    });

    it('should validate moves with German promotion notation', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      // Validate with German notation
      const isValidD = service.validateMove({ from: 'f7', to: 'f8', promotion: 'D' });
      expect(isValidD).toBe(true);

      const isValidT = service.validateMove({ from: 'f7', to: 'f8', promotion: 'T' });
      expect(isValidT).toBe(true);

      const isValidL = service.validateMove({ from: 'f7', to: 'f8', promotion: 'L' });
      expect(isValidL).toBe(true);

      const isValidS = service.validateMove({ from: 'f7', to: 'f8', promotion: 'S' });
      expect(isValidS).toBe(true);
    });

    it('should validate string notation with German promotion', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      const isValid = service.validateMove('f7f8D');
      expect(isValid).toBe(true);
    });

    it('should validate string notation with German promotion and dash', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      const isValid = service.validateMove('f7-f8D');
      expect(isValid).toBe(true);
    });

    it('should handle invalid German notation gracefully', () => {
      service.initialize(COMMON_FENS.PAWN_PROMOTION_READY);

      // Test with invalid notation (should pass through and fail in chess.js)
      const result = service.move({ from: 'f7', to: 'f8', promotion: 'X' });
      expect(result).toBeNull(); // Invalid promotion piece
    });
  });
});