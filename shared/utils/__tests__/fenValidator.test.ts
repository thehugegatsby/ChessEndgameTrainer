import { validateAndSanitizeFen, isValidFenQuick } from '../fenValidator';

describe('FEN Validator', () => {
  describe('validateAndSanitizeFen', () => {
    test('validates correct starting position', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    test('validates correct endgame position', () => {
      const result = validateAndSanitizeFen('8/8/8/8/8/8/1K2k3/8 w - - 0 1');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects empty string', () => {
      const result = validateAndSanitizeFen('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('sanitizes dangerous characters', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1<script>');
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).not.toContain('<');
      expect(result.sanitized).not.toContain('>');
    });

    test('detects wrong number of parts', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('6 parts');
    });

    test('detects wrong number of ranks', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid piece placement');
    });

    test('detects invalid piece characters', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKXNR w KQkq - 0 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid piece placement');
    });

    test('detects invalid active color', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Active color');
    });

    test('detects invalid castling rights', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w XYZ - 0 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid castling');
    });

    test('validates no castling rights', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
      expect(result.isValid).toBe(true);
    });

    test('detects invalid en passant square', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e9 0 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid en passant');
    });

    test('validates correct en passant square', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
      expect(result.isValid).toBe(true);
    });

    test('detects invalid halfmove clock', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid halfmove clock');
    });

    test('detects invalid fullmove number', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid fullmove number');
    });

    test('detects too many pieces in a rank', () => {
      const result = validateAndSanitizeFen('rnbqkbnrr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid piece placement');
    });

    test('detects too few pieces in a rank', () => {
      const result = validateAndSanitizeFen('rnbqkbn/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid piece placement');
    });

    test('validates complex position', () => {
      const result = validateAndSanitizeFen('r1bqkb1r/pp1ppppp/2n2n2/8/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq - 4 4');
      expect(result.isValid).toBe(true);
    });

    test('handles consecutive empty squares', () => {
      const result = validateAndSanitizeFen('8/8/8/8/8/8/8/8 w - - 0 1');
      expect(result.isValid).toBe(true);
    });

    test('detects invalid empty square count', () => {
      const result = validateAndSanitizeFen('9/8/8/8/8/8/8/8 w - - 0 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid piece placement');
    });

    test('detects non-numeric halfmove clock', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - abc 1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid halfmove clock');
    });

    test('detects non-numeric fullmove number', () => {
      const result = validateAndSanitizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 xyz');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid fullmove number');
    });

    test('validates all castling combinations', () => {
      const combinations = ['K', 'Q', 'k', 'q', 'KQ', 'Kk', 'Kq', 'Qk', 'Qq', 'kq', 'KQk', 'KQq', 'Kkq', 'Qkq', 'KQkq'];
      
      combinations.forEach(castling => {
        const result = validateAndSanitizeFen(`rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w ${castling} - 0 1`);
        expect(result.isValid).toBe(true);
      });
    });

    test('validates positions with mixed pieces', () => {
      const result = validateAndSanitizeFen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1');
      expect(result.isValid).toBe(true);
    });

    test('strips whitespace from FEN', () => {
      const result = validateAndSanitizeFen('  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  describe('isValidFenQuick', () => {
    test('returns true for valid FEN', () => {
      expect(isValidFenQuick('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(true);
    });

    test('returns false for invalid FEN', () => {
      expect(isValidFenQuick('invalid')).toBe(false);
    });

    test('returns false for empty string', () => {
      expect(isValidFenQuick('')).toBe(false);
    });

    test('returns false for null', () => {
      expect(isValidFenQuick(null as any)).toBe(false);
    });

    test('returns false for undefined', () => {
      expect(isValidFenQuick(undefined as any)).toBe(false);
    });

    test('returns false for object input', () => {
      expect(isValidFenQuick({} as any)).toBe(false);
    });

    test('returns false for array input', () => {
      expect(isValidFenQuick([] as any)).toBe(false);
    });

    test('validates endgame positions', () => {
      expect(isValidFenQuick('8/8/8/8/8/8/1K2k3/8 w - - 0 1')).toBe(true);
      expect(isValidFenQuick('8/8/8/8/8/8/1K2k3/8 b - - 0 1')).toBe(true);
    });

    test('detects basic invalid patterns', () => {
      expect(isValidFenQuick('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')).toBe(false); // Missing parts
      expect(isValidFenQuick('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1')).toBe(false); // Invalid color
      // Note: isValidFenQuick is designed for quick validation and may not catch all complex issues
      expect(isValidFenQuick('')).toBe(false); // Empty string
    });
  });
});