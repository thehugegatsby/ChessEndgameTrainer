/**
 * @file MoveValidator Unit Tests - Edge Cases & Bug Reproduction
 * @description Comprehensive tests for all move input formats to prevent regression
 */

import { MoveValidator } from '../MoveValidator';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

describe('MoveValidator - Move Format Edge Cases', () => {
  let validator: MoveValidator;
  const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const pawnPromotionFen = '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1'; // White pawn ready to promote

  beforeEach(() => {
    validator = new MoveValidator();
  });

  describe('Valid Move Formats', () => {
    it('should handle SAN notation string (e.g., "e4")', () => {
      const result = validator.validateMove('e4', startingFen);
      expect(result.isValid).toBe(true);
    });

    it('should handle SAN notation with capture (e.g., "Nxf3")', () => {
      const fenWithCapture = 'rnbqkbnr/pppp1ppp/8/4p3/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 2';
      const result = validator.validateMove('Nxe5', fenWithCapture);
      expect(result.isValid).toBe(true);
    });

    it('should handle SAN promotion (e.g., "e8=Q")', () => {
      const result = validator.validateMove('e8=Q', pawnPromotionFen);
      expect(result.isValid).toBe(true);
    });

    it('should handle SAN promotion with check (e.g., "e8=Q+")', () => {
      const result = validator.validateMove('e8=Q+', pawnPromotionFen);
      expect(result.isValid).toBe(true);
    });

    it('should handle coordinate string without dash (e.g., "e2e4")', () => {
      const result = validator.validateMove('e2e4', startingFen);
      expect(result.isValid).toBe(true);
    });

    it('should handle dash notation (e.g., "e2-e4")', () => {
      const result = validator.validateMove('e2-e4', startingFen);
      expect(result.isValid).toBe(true);
    });

    it('should handle move object with from/to', () => {
      const result = validator.validateMove({ from: 'e2', to: 'e4' }, startingFen);
      expect(result.isValid).toBe(true);
    });

    it('should handle move object with promotion', () => {
      const result = validator.validateMove(
        { from: 'e7', to: 'e8', promotion: 'q' },
        pawnPromotionFen
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('Bug Reproduction - Unsafe Type Casting', () => {
    // Diese Tests reproduzieren den Bug der zu "from is not defined" führt
    
    it('should safely reject String object wrapper', () => {
      // String-Objekt hat typeof 'object' aber keine from/to Properties
      const stringObj = new String('e4');
      const result = validator.validateMove(stringObj as any, startingFen);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('format');
      // WICHTIG: Sollte NICHT crashen mit "from is not defined"
    });

    it('should safely reject objects without from/to properties', () => {
      const invalidObj = { san: 'e4', notation: 'algebraic' };
      const result = validator.validateMove(invalidObj as any, startingFen);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('format');
    });

    it('should safely reject plain objects with unexpected structure', () => {
      const weirdObj = { move: 'e4', type: 'pawn' };
      const result = validator.validateMove(weirdObj as any, startingFen);
      
      expect(result.isValid).toBe(false);
    });

    it('should safely reject arrays (which have typeof "object")', () => {
      const arrayMove = ['e2', 'e4'];
      const result = validator.validateMove(arrayMove as any, startingFen);
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('Null/Undefined Safety', () => {
    it('should reject null gracefully', () => {
      const result = validator.validateMove(null as any, startingFen);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBeDefined();
    });

    it('should reject undefined gracefully', () => {
      const result = validator.validateMove(undefined as any, startingFen);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBeDefined();
    });
  });

  describe('Invalid Moves', () => {
    it('should reject illegal moves in SAN', () => {
      const result = validator.validateMove('e5', startingFen); // Illegal from starting position
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid coordinate moves', () => {
      const result = validator.validateMove('e2e5', startingFen); // Illegal pawn move
      expect(result.isValid).toBe(false);
    });

    it('should reject malformed move objects', () => {
      const result = validator.validateMove({ from: 'invalid', to: 'e4' }, startingFen);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Edge Cases from Real Test Data', () => {
    // Verwende echte Positionen aus ChessTestData um Realitätsnähe zu gewährleisten
    
    it('should handle problematic SAN moves that failed in E2E', () => {
      // Dies sind die exakten Moves die den Bug ausgelöst haben
      const moves = ['e6', 'e7', 'e8=Q+'];
      
      // Verwende eine Position wo diese Moves Sinn machen könnten
      const promotionFen = '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1';
      
      for (const move of moves) {
        const result = validator.validateMove(move, promotionFen);
        
        // Diese sollten NICHT crashen, auch wenn sie invalide sind
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errorMessage');
        
        // Wichtig: Kein Runtime Error "from is not defined"!
        if (!result.isValid) {
          expect(typeof result.errorMessage).toBe('string');
          expect(result.errorMessage).not.toContain('from is not defined');
          expect(result.errorMessage).not.toContain('undefined');
        }
      }
    });
  });
});