/**
 * Unit Tests for Chess Validation & Normalization
 * 
 * Comprehensive tests for the Zod-based chess piece validation system.
 * These tests ensure that our normalization functions handle all possible
 * input formats correctly and prevent the type safety bugs we've encountered.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  // Schemas
  PieceCodeSchema,
  SquareSchema,
  ExternalPieceSchema,
  SquareClickEventSchema,
  PieceDropEventSchema,
  
  // Normalization functions
  normalizePieceData,
  tryNormalizePieceData,
  normalizeSquareClickEvent,
  normalizePieceDropEvent,
  
  // Type guards
  isPieceCode,
  isSquare,
  isChessPiece,
  
  
  // Types
  type ChessPiece,
  type PieceCode,
  type Square,
  PIECE_CODES,
  SQUARES
} from '../chess-validation';

describe('Chess Validation Schemas', () => {
  describe('PieceCodeSchema', () => {
    it('should accept all valid piece codes', () => {
      PIECE_CODES.forEach(code => {
        expect(() => PieceCodeSchema.parse(code)).not.toThrow();
      });
    });

    it('should reject invalid piece codes', () => {
      const invalidCodes = ['xK', 'wZ', 'black_king', 'WK', '', 'w', 'K', 'wk'];
      
      invalidCodes.forEach(code => {
        expect(() => PieceCodeSchema.parse(code)).toThrow();
      });
    });

    it('should provide helpful error messages', () => {
      try {
        PieceCodeSchema.parse('invalid');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.issues[0].message).toContain('Invalid option');
        expect(zodError.issues[0].message).toContain('wK');
      }
    });
  });

  describe('SquareSchema', () => {
    it('should accept all valid squares', () => {
      SQUARES.forEach(square => {
        expect(() => SquareSchema.parse(square)).not.toThrow();
      });
    });

    it('should reject invalid squares', () => {
      const invalidSquares = ['a0', 'i1', 'a9', 'h0', 'z5', '', 'A1', 'a11'];
      
      invalidSquares.forEach(square => {
        expect(() => SquareSchema.parse(square)).toThrow();
      });
    });
  });

  describe('ExternalPieceSchema', () => {
    it('should accept string piece codes', () => {
      expect(() => ExternalPieceSchema.parse('wK')).not.toThrow();
      expect(() => ExternalPieceSchema.parse('bQ')).not.toThrow();
    });

    it('should accept object with pieceType property', () => {
      expect(() => ExternalPieceSchema.parse({ pieceType: 'wK' })).not.toThrow();
      expect(() => ExternalPieceSchema.parse({ pieceType: 'bQ' })).not.toThrow();
    });

    it('should accept object with type property', () => {
      expect(() => ExternalPieceSchema.parse({ type: 'wK' })).not.toThrow();
      expect(() => ExternalPieceSchema.parse({ type: 'bQ' })).not.toThrow();
    });

    it('should accept object with code property', () => {
      expect(() => ExternalPieceSchema.parse({ code: 'wK' })).not.toThrow();
      expect(() => ExternalPieceSchema.parse({ code: 'bQ' })).not.toThrow();
    });

    it('should accept null and undefined', () => {
      expect(() => ExternalPieceSchema.parse(null)).not.toThrow();
      expect(() => ExternalPieceSchema.parse(undefined)).not.toThrow();
    });

    it('should reject invalid formats', () => {
      const invalidInputs = [
        'invalid',
        { invalidProp: 'wK' },
        { pieceType: 'invalid' },
        123,
        [],
        {},
        { pieceType: null },
        { type: undefined }
      ];
      
      invalidInputs.forEach(input => {
        expect(() => ExternalPieceSchema.parse(input)).toThrow();
      });
    });
  });
});

describe('normalizePieceData', () => {
  describe('String input format', () => {
    it('should normalize valid piece code strings', () => {
      const result = normalizePieceData('wK');
      expect(result).toEqual({
        code: 'wK',
        color: 'w',
        kind: 'K'
      });
    });

    it('should handle all piece types', () => {
      const testCases: Array<[PieceCode, { color: 'w' | 'b', kind: string }]> = [
        ['wK', { color: 'w', kind: 'K' }],
        ['wQ', { color: 'w', kind: 'Q' }],
        ['wR', { color: 'w', kind: 'R' }],
        ['wB', { color: 'w', kind: 'B' }],
        ['wN', { color: 'w', kind: 'N' }],
        ['wP', { color: 'w', kind: 'P' }],
        ['bK', { color: 'b', kind: 'K' }],
        ['bQ', { color: 'b', kind: 'Q' }],
        ['bR', { color: 'b', kind: 'R' }],
        ['bB', { color: 'b', kind: 'B' }],
        ['bN', { color: 'b', kind: 'N' }],
        ['bP', { color: 'b', kind: 'P' }]
      ];
      
      testCases.forEach(([code, expected]) => {
        const result = normalizePieceData(code);
        expect(result).toEqual({
          code,
          color: expected.color,
          kind: expected.kind
        });
      });
    });
  });

  describe('Object input formats', () => {
    it('should normalize pieceType object format', () => {
      const result = normalizePieceData({ pieceType: 'bQ' });
      expect(result).toEqual({
        code: 'bQ',
        color: 'b',
        kind: 'Q'
      });
    });

    it('should normalize type object format', () => {
      const result = normalizePieceData({ type: 'wR' });
      expect(result).toEqual({
        code: 'wR',
        color: 'w',
        kind: 'R'
      });
    });

    it('should normalize code object format', () => {
      const result = normalizePieceData({ code: 'bN' });
      expect(result).toEqual({
        code: 'bN',
        color: 'b',
        kind: 'N'
      });
    });
  });

  describe('Null/undefined handling', () => {
    it('should return null for null input', () => {
      expect(normalizePieceData(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(normalizePieceData(undefined)).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should throw ZodError for invalid string input', () => {
      expect(() => normalizePieceData('invalid')).toThrow(z.ZodError);
    });

    it('should throw ZodError for invalid object input', () => {
      expect(() => normalizePieceData({ invalid: 'wK' })).toThrow(z.ZodError);
    });

    it('should throw ZodError for completely invalid input', () => {
      const invalidInputs = [123, [], {}, 'xK', { pieceType: 'invalid' }];
      
      invalidInputs.forEach(input => {
        expect(() => normalizePieceData(input)).toThrow(z.ZodError);
      });
    });
  });
});

describe('tryNormalizePieceData', () => {
  it('should return success result for valid input', () => {
    const result = tryNormalizePieceData('wK');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        code: 'wK',
        color: 'w',
        kind: 'K'
      });
    }
  });

  it('should return success result with null for null input', () => {
    const result = tryNormalizePieceData(null);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeNull();
    }
  });

  it('should return error result for invalid input', () => {
    const result = tryNormalizePieceData('invalid');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(z.ZodError);
    }
  });

  it('should handle object formats correctly', () => {
    const result = tryNormalizePieceData({ pieceType: 'bQ' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        code: 'bQ',
        color: 'b',
        kind: 'Q'
      });
    }
  });
});

describe('normalizeSquareClickEvent', () => {
  it('should normalize valid square click events', () => {
    const input = {
      piece: 'wK',
      square: 'e1'
    };
    
    const result = normalizeSquareClickEvent(input);
    expect(result).toEqual({
      piece: {
        code: 'wK',
        color: 'w',
        kind: 'K'
      },
      square: 'e1'
    });
  });

  it('should handle null piece (empty square)', () => {
    const input = {
      piece: null,
      square: 'e4'
    };
    
    const result = normalizeSquareClickEvent(input);
    expect(result).toEqual({
      piece: null,
      square: 'e4'
    });
  });

  it('should handle object piece format', () => {
    const input = {
      piece: { pieceType: 'bQ' },
      square: 'd8'
    };
    
    const result = normalizeSquareClickEvent(input);
    expect(result).toEqual({
      piece: {
        code: 'bQ',
        color: 'b',
        kind: 'Q'
      },
      square: 'd8'
    });
  });

  it('should throw for invalid input', () => {
    const invalidInputs = [
      { piece: 'wK', square: 'invalid' },
      { piece: 'invalid', square: 'e1' },
      'invalid'
    ];
    
    invalidInputs.forEach(input => {
      expect(() => normalizeSquareClickEvent(input)).toThrow();
    });
  });
});

describe('normalizePieceDropEvent', () => {
  it('should normalize valid piece drop events', () => {
    const input = {
      sourceSquare: 'e2',
      targetSquare: 'e4',
      piece: 'wP'
    };
    
    const result = normalizePieceDropEvent(input);
    expect(result).toEqual({
      sourceSquare: 'e2',
      targetSquare: 'e4',
      piece: {
        code: 'wP',
        color: 'w',
        kind: 'P'
      }
    });
  });

  it('should throw for null piece', () => {
    const input = {
      sourceSquare: 'e2',
      targetSquare: 'e4',
      piece: null
    };
    
    expect(() => normalizePieceDropEvent(input)).toThrow();
  });

  it('should throw for invalid squares', () => {
    const invalidInputs = [
      { sourceSquare: 'invalid', targetSquare: 'e4', piece: 'wP' },
      { sourceSquare: 'e2', targetSquare: 'invalid', piece: 'wP' },
      { sourceSquare: 'e2', targetSquare: 'e4', piece: 'invalid' }
    ];
    
    invalidInputs.forEach(input => {
      expect(() => normalizePieceDropEvent(input)).toThrow();
    });
  });
});

describe('Type Guards', () => {
  describe('isPieceCode', () => {
    it('should return true for valid piece codes', () => {
      PIECE_CODES.forEach(code => {
        expect(isPieceCode(code)).toBe(true);
      });
    });

    it('should return false for invalid values', () => {
      const invalidValues = ['invalid', 123, null, undefined, {}, []];
      invalidValues.forEach(value => {
        expect(isPieceCode(value)).toBe(false);
      });
    });
  });

  describe('isSquare', () => {
    it('should return true for valid squares', () => {
      SQUARES.forEach(square => {
        expect(isSquare(square)).toBe(true);
      });
    });

    it('should return false for invalid values', () => {
      const invalidValues = ['a0', 'z1', 123, null, undefined, {}, []];
      invalidValues.forEach(value => {
        expect(isSquare(value)).toBe(false);
      });
    });
  });

  describe('isChessPiece', () => {
    it('should return true for valid ChessPiece objects', () => {
      const validPieces: ChessPiece[] = [
        { code: 'wK', color: 'w', kind: 'K' },
        { code: 'bQ', color: 'b', kind: 'Q' }
      ];
      
      validPieces.forEach(piece => {
        expect(isChessPiece(piece)).toBe(true);
      });
    });

    it('should return false for invalid values', () => {
      const invalidValues = [
        'wK',
        { pieceType: 'wK' },
        { code: 'wK' }, // missing color and kind
        { code: 'invalid', color: 'w', kind: 'K' },
        null,
        undefined,
        123,
        []
      ];
      
      invalidValues.forEach(value => {
        expect(isChessPiece(value)).toBe(false);
      });
    });
  });
});


describe('Edge Cases & Regression Tests', () => {
  it('should handle the exact bug scenario from DEBUG_NAVIGATION_BUG.md', () => {
    // The original bug: piece = {pieceType: "wK"}, trying piece?.[0] → undefined
    const piece = { pieceType: 'wK' };
    
    // Using our normalization function
    const normalized = normalizePieceData(piece);
    expect(normalized).toEqual({
      code: 'wK',
      color: 'w',
      kind: 'K'
    });
  });

  it('should handle all documented piece formats from react-chessboard', () => {
    const formats = [
      'wK',                    // String format
      { pieceType: 'wK' },     // Object with pieceType
      { type: 'wK' },          // Object with type
      { code: 'wK' }           // Object with code
    ];
    
    formats.forEach(format => {
      const normalized = normalizePieceData(format);
      expect(normalized).toEqual({
        code: 'wK',
        color: 'w',
        kind: 'K'
      });
    });
  });

  it('should never throw on common JavaScript falsy values', () => {
    const falsyValues = [null, undefined, false, 0, '', NaN];
    
    falsyValues.forEach(value => {
      const result = tryNormalizePieceData(value);
      expect(typeof result).toBe('object');
      expect('ok' in result).toBe(true);
    });
  });

  it('should handle mixed case and whitespace gracefully', () => {
    // These should fail validation (case sensitive)
    const invalidCases = ['WK', 'wk', ' wK ', '\twK\n'];
    
    invalidCases.forEach(value => {
      const result = tryNormalizePieceData(value);
      expect(result.ok).toBe(false);
    });
  });

  it('should preserve exact piece codes without transformation', () => {
    // Ensure we don't accidentally transform the piece codes
    PIECE_CODES.forEach(originalCode => {
      const normalized = normalizePieceData(originalCode);
      expect(normalized?.code).toBe(originalCode);
    });
  });
});