/**
 * Tests for GermanNotation utility
 * Tests conversion between German and English chess notation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { IGermanNotation } from '../types/interfaces';
import GermanNotation from '../utils/GermanNotation';

describe('GermanNotation', () => {
  let notation: IGermanNotation;

  beforeEach(() => {
    notation = new GermanNotation();
  });

  describe('toChessJs', () => {
    it('should convert German pieces to chess.js format', () => {
      expect(notation.toChessJs('D')).toBe('q'); // Dame -> Queen
      expect(notation.toChessJs('d')).toBe('q'); // Lower case Dame
      expect(notation.toChessJs('T')).toBe('r'); // Turm -> Rook
      expect(notation.toChessJs('t')).toBe('r'); // Lower case Turm
      expect(notation.toChessJs('L')).toBe('b'); // Läufer -> Bishop
      expect(notation.toChessJs('l')).toBe('b'); // Lower case Läufer
      expect(notation.toChessJs('S')).toBe('n'); // Springer -> Knight
      expect(notation.toChessJs('s')).toBe('n'); // Lower case Springer
    });

    it('should pass through English notation', () => {
      expect(notation.toChessJs('Q')).toBe('q');
      expect(notation.toChessJs('R')).toBe('r');
      expect(notation.toChessJs('B')).toBe('b');
      expect(notation.toChessJs('N')).toBe('n');
    });

    it('should return undefined for invalid input', () => {
      expect(notation.toChessJs('')).toBeUndefined();
      expect(notation.toChessJs('XX')).toBeUndefined();
      expect(notation.toChessJs('Z')).toBeUndefined();
    });
  });

  describe('toGerman', () => {
    it('should convert chess.js pieces to German format', () => {
      expect(notation.toGerman('q')).toBe('D'); // Queen -> Dame
      expect(notation.toGerman('Q')).toBe('D'); // Upper case Queen
      expect(notation.toGerman('r')).toBe('T'); // Rook -> Turm
      expect(notation.toGerman('R')).toBe('T'); // Upper case Rook
      expect(notation.toGerman('b')).toBe('L'); // Bishop -> Läufer
      expect(notation.toGerman('B')).toBe('L'); // Upper case Bishop
      expect(notation.toGerman('n')).toBe('S'); // Knight -> Springer
      expect(notation.toGerman('N')).toBe('S'); // Upper case Knight
    });

    it('should handle pawn and king', () => {
      expect(notation.toGerman('p')).toBe('B'); // Pawn -> Bauer
      expect(notation.toGerman('k')).toBe('K'); // King -> König
    });

    it('should return undefined for invalid input', () => {
      expect(notation.toGerman('')).toBeUndefined();
      expect(notation.toGerman('XX')).toBeUndefined();
      expect(notation.toGerman('Z')).toBeUndefined();
    });
  });

  describe('normalizeMove', () => {
    it('should normalize from-to notation with German promotion', () => {
      const result1 = notation.normalizeMove('e7e8D');
      expect(result1).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });

      const result2 = notation.normalizeMove('e7-e8D');
      expect(result2).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });

      const result3 = notation.normalizeMove('a7a8T');
      expect(result3).toEqual({ from: 'a7', to: 'a8', promotion: 'r' });
    });

    it('should normalize SAN notation with German promotion', () => {
      const result1 = notation.normalizeMove('e8D');
      expect(result1).toBe('e8=Q');

      const result2 = notation.normalizeMove('e8=D');
      expect(result2).toBe('e8=Q');

      const result3 = notation.normalizeMove('a8T');
      expect(result3).toBe('a8=R');
    });

    it('should handle English notation in normalizeMove', () => {
      const result1 = notation.normalizeMove('e7e8Q');
      expect(result1).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });

      const result2 = notation.normalizeMove('e8=Q');
      expect(result2).toBe('e8=Q');
    });

    it('should return undefined for non-promotion moves', () => {
      expect(notation.normalizeMove('e2e4')).toBeUndefined();
      expect(notation.normalizeMove('Nf3')).toBeUndefined();
      expect(notation.normalizeMove('O-O')).toBeUndefined();
    });
  });

  describe('hasGermanNotation', () => {
    it('should detect German piece letters', () => {
      expect(notation.hasGermanNotation('e8D')).toBe(true);
      expect(notation.hasGermanNotation('Sf3')).toBe(true);
      expect(notation.hasGermanNotation('Txd4')).toBe(true);
      expect(notation.hasGermanNotation('Lc4')).toBe(true);
    });

    it('should return false for English notation', () => {
      expect(notation.hasGermanNotation('e8Q')).toBe(false);
      expect(notation.hasGermanNotation('Nf3')).toBe(false);
      expect(notation.hasGermanNotation('Rxd4')).toBe(false);
      expect(notation.hasGermanNotation('Bc4')).toBe(false);
    });

    it('should return false for simple moves', () => {
      expect(notation.hasGermanNotation('e4')).toBe(false);
      expect(notation.hasGermanNotation('O-O')).toBe(false);
      expect(notation.hasGermanNotation('e2e4')).toBe(false);
    });
  });

  describe('sanToGerman', () => {
    it('should convert piece moves to German', () => {
      expect(notation.sanToGerman('Nf3')).toBe('Sf3');
      expect(notation.sanToGerman('Rxd4')).toBe('Txd4');
      expect(notation.sanToGerman('Bc4')).toBe('Lc4');
      expect(notation.sanToGerman('Qh5')).toBe('Dh5');
    });

    it('should convert promotion notation', () => {
      expect(notation.sanToGerman('e8=Q')).toBe('e8=D');
      expect(notation.sanToGerman('a8=R')).toBe('a8=T');
      expect(notation.sanToGerman('h8=B')).toBe('h8=L');
      expect(notation.sanToGerman('f8=N')).toBe('f8=S');
    });

    it('should leave pawn moves unchanged', () => {
      expect(notation.sanToGerman('e4')).toBe('e4');
      expect(notation.sanToGerman('exd5')).toBe('exd5');
    });

    it('should leave castling unchanged', () => {
      expect(notation.sanToGerman('O-O')).toBe('O-O');
      expect(notation.sanToGerman('O-O-O')).toBe('O-O-O');
    });
  });

  describe('germanToSan', () => {
    it('should convert German piece moves to English', () => {
      expect(notation.germanToSan('Sf3')).toBe('Nf3');
      expect(notation.germanToSan('Txd4')).toBe('Rxd4');
      expect(notation.germanToSan('Lc4')).toBe('Bc4');
      expect(notation.germanToSan('Dh5')).toBe('Qh5');
    });

    it('should convert German promotion notation', () => {
      expect(notation.germanToSan('e8=D')).toBe('e8=Q');
      expect(notation.germanToSan('a8=T')).toBe('a8=R');
      expect(notation.germanToSan('h8=L')).toBe('h8=B');
      expect(notation.germanToSan('f8=S')).toBe('f8=N');
    });

    it('should handle case insensitive German pieces', () => {
      expect(notation.germanToSan('sf3')).toBe('Nf3');
      expect(notation.germanToSan('e8=d')).toBe('e8=Q');
    });

    it('should leave non-German moves unchanged', () => {
      expect(notation.germanToSan('e4')).toBe('e4');
      expect(notation.germanToSan('O-O')).toBe('O-O');
      expect(notation.germanToSan('Nf3')).toBe('Nf3'); // Already English
    });
  });

  describe('Integration with promotion scenarios', () => {
    it('should handle common German promotion patterns', () => {
      // Pawn to Queen (most common)
      expect(notation.normalizeMove('e7e8D')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
      expect(notation.normalizeMove('e8D')).toBe('e8=Q');

      // Pawn to Knight (underpromotion)
      expect(notation.normalizeMove('f7f8S')).toEqual({ from: 'f7', to: 'f8', promotion: 'n' });
      expect(notation.normalizeMove('f8S')).toBe('f8=N');

      // Pawn to Rook
      expect(notation.normalizeMove('a7a8T')).toEqual({ from: 'a7', to: 'a8', promotion: 'r' });
      expect(notation.normalizeMove('a8T')).toBe('a8=R');

      // Pawn to Bishop
      expect(notation.normalizeMove('h7h8L')).toEqual({ from: 'h7', to: 'h8', promotion: 'b' });
      expect(notation.normalizeMove('h8L')).toBe('h8=B');
    });
  });
});
