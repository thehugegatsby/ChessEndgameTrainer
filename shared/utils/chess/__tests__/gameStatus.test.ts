import { getGameStatus, getShortGameStatus } from '../gameStatus';

describe('gameStatus', () => {
  describe('getGameStatus', () => {
    test('should return correct status for white to move', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.sideToMove).toBe('white');
      expect(status.sideToMoveDisplay).toBe('Weiß am Zug');
      expect(status.icon).toBe('🟢');
    });

    test('should return correct status for black to move', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.sideToMove).toBe('black');
      expect(status.sideToMoveDisplay).toBe('Schwarz am Zug');
      expect(status.icon).toBe('⚫');
    });

    test('should handle invalid FEN with fallback', () => {
      const status = getGameStatus('invalid-fen');
      
      expect(status.sideToMove).toBe('white');
      expect(status.sideToMoveDisplay).toBe('Weiß am Zug');
      expect(status.objective).toBe('win');
      expect(status.objectiveDisplay).toBe('Ziel: Gewinn');
      expect(status.icon).toBe('🟢');
    });

    test('should use provided goal when available', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const status = getGameStatus(fen, 'draw');
      
      expect(status.objective).toBe('draw');
      expect(status.objectiveDisplay).toBe('Ziel: Remis');
    });

    test('should use provided defend goal', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const status = getGameStatus(fen, 'defend');
      
      expect(status.objective).toBe('defend');
      expect(status.objectiveDisplay).toBe('Ziel: Verteidigen');
    });

    test('should detect win objective for material advantage', () => {
      // Queen vs empty
      const fen = '8/8/8/8/8/8/8/1k1Q1K2 w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.objective).toBe('win');
    });

    test('should detect win objective for pawn advantage', () => {
      // King + Pawn vs King
      const fen = '8/8/8/8/8/8/1P6/1k2K3 w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.objective).toBe('win');
    });

    test('should detect draw objective for equal material', () => {
      // Two kings only
      const fen = '8/8/8/8/8/8/8/1k2K3 w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.objective).toBe('draw');
    });

    test('should detect win for pawn endgame with extra pawn', () => {
      // White has extra pawn
      const fen = '8/pp6/8/8/8/8/PPP5/1k2K3 w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.objective).toBe('win');
    });

    test('should detect win for black with material advantage', () => {
      // Black has rook
      const fen = '8/8/8/8/8/8/8/1k2K1r1 b - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.objective).toBe('win');
    });

    test('should default to win for unclear positions', () => {
      // Slightly better for white but unclear
      const fen = '8/8/8/8/8/8/P7/1k2K3 w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.objective).toBe('win');
    });
  });

  describe('getShortGameStatus', () => {
    test('should return short status for white win', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const shortStatus = getShortGameStatus(fen, 'win');
      
      expect(shortStatus).toBe('Weiß • Gewinn');
    });

    test('should return short status for black draw', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const shortStatus = getShortGameStatus(fen, 'draw');
      
      expect(shortStatus).toBe('Schwarz • Remis');
    });

    test('should return short status for defend', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const shortStatus = getShortGameStatus(fen, 'defend');
      
      expect(shortStatus).toBe('Weiß • Verteidigen');
    });

    test('should auto-detect objective when not provided', () => {
      const fen = '8/8/8/8/8/8/8/1k2K3 w - - 0 1';
      const shortStatus = getShortGameStatus(fen);
      
      expect(shortStatus).toBe('Weiß • Remis');
    });
  });
});