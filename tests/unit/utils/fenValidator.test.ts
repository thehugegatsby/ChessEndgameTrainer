import { validateAndSanitizeFen } from '@shared/utils/fenValidator';

describe('FEN Validator', () => {
  describe('validateAndSanitizeFen', () => {
    it('should validate correct FEN strings', () => {
      const validFens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        '8/8/8/8/8/8/1K1k4/8 w - - 0 1',
        'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
        '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1'
      ];

      validFens.forEach(fen => {
        const result = validateAndSanitizeFen(fen);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(fen);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid FEN strings', () => {
      const invalidFens = [
        { fen: '', error: 'FEN must have exactly 6 parts separated by spaces' },
        { fen: 'invalid', error: 'FEN must have exactly 6 parts separated by spaces' },
        { fen: '8/8/8/8/8/8/8/8', error: 'FEN must have exactly 6 parts separated by spaces' },
        { fen: '9/8/8/8/8/8/8/8 w - - 0 1', error: 'Invalid piece placement' },
        { fen: '8/8/8/8/8/8/8/7 w - - 0 1', error: 'Invalid piece placement' },
        { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1', error: 'Active color must be "w" or "b"' },
        { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkqz - 0 1', error: 'Invalid castling availability' },
        { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e9 0 1', error: 'Invalid en passant target square' }
      ];

      invalidFens.forEach(({ fen, error }) => {
        const result = validateAndSanitizeFen(fen);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(error);
      });
    });

    it('should sanitize dangerous characters', () => {
      const dangerousFen = '<script>alert("xss")</script> w - - 0 1';
      const result = validateAndSanitizeFen(dangerousFen);
      expect(result.isValid).toBe(false);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).not.toContain('</script>');
    });

    it('should handle SQL injection attempts', () => {
      const sqlFen = "8/8/8/8/8/8/8/8 w - - 0 1'; DROP TABLE positions;--";
      const result = validateAndSanitizeFen(sqlFen);
      expect(result.sanitized).not.toContain("'");
      expect(result.sanitized).not.toContain('"');
    });

    it('should validate en passant squares correctly', () => {
      const validEnPassant = ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6'];
      
      validEnPassant.forEach(square => {
        const fen = `8/8/8/8/8/8/8/8 w - ${square} 0 1`;
        const result = validateAndSanitizeFen(fen);
        expect(result.isValid).toBe(true);
      });

      const invalidEnPassant = ['a1', 'a2', 'a4', 'a5', 'a7', 'a8', 'i3', 'a9'];
      
      invalidEnPassant.forEach(square => {
        const fen = `8/8/8/8/8/8/8/8 w - ${square} 0 1`;
        const result = validateAndSanitizeFen(fen);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid en passant target square');
      });
    });

    it('should validate halfmove and fullmove clocks', () => {
      const validClocks = [
        { half: '0', full: '1' },
        { half: '50', full: '100' },
        { half: '100', full: '9999' }
      ];

      validClocks.forEach(({ half, full }) => {
        const fen = `8/8/8/8/8/8/8/8 w - - ${half} ${full}`;
        const result = validateAndSanitizeFen(fen);
        expect(result.isValid).toBe(true);
      });

      const invalidClocks = [
        { half: '-1', full: '1' },
        { half: '101', full: '1' },
        { half: '0', full: '0' },
        { half: '0', full: '10000' }
      ];

      invalidClocks.forEach(({ half, full }) => {
        const fen = `8/8/8/8/8/8/8/8 w - - ${half} ${full}`;
        const result = validateAndSanitizeFen(fen);
        expect(result.isValid).toBe(false);
      });
    });
  });
});