import { getGameStatus, getShortGameStatus } from '@/utils/chess/gameStatus';

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
      // Queen vs empty - should default to win objective
      const fen = '4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.objective).toBe('win');
      expect(status.objectiveDisplay).toBe('Ziel: Gewinn');
    });

    test('should handle endgame positions correctly', () => {
      // King and pawn vs king
      const fen = '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.sideToMove).toBe('white');
      expect(status.sideToMoveDisplay).toBe('Weiß am Zug');
    });

    test('should provide correct move counts', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.moveNumber).toBe(1);
      expect(status.halfMoveClock).toBe(0);
    });

    test('should handle advanced move counts', () => {
      const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      const status = getGameStatus(fen);
      
      expect(status.moveNumber).toBe(4);
      expect(status.halfMoveClock).toBe(4);
    });

    test('should detect castling rights', () => {
      const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.castlingRights).toBe('KQkq');
    });

    test('should handle no castling rights', () => {
      const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.castlingRights).toBe('-');
    });

    test('should detect en passant square', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const status = getGameStatus(fen);
      
      expect(status.enPassantSquare).toBe('e3');
    });

    test('should handle no en passant', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.enPassantSquare).toBe('-');
    });
  });

  describe('getShortGameStatus', () => {
    test('should return short status for white', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const status = getShortGameStatus(fen);
      
      expect(status).toBe('Weiß');
    });

    test('should return short status for black', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const status = getShortGameStatus(fen);
      
      expect(status).toBe('Schwarz');
    });

    test('should handle invalid FEN', () => {
      const status = getShortGameStatus('invalid-fen');
      
      expect(status).toBe('Weiß'); // Default fallback
    });

    test('should be consistent with getGameStatus', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fullStatus = getGameStatus(fen);
      const shortStatus = getShortGameStatus(fen);
      
      const expectedShort = fullStatus.sideToMove === 'white' ? 'Weiß' : 'Schwarz';
      expect(shortStatus).toBe(expectedShort);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string FEN', () => {
      const status = getGameStatus('');
      
      expect(status.sideToMove).toBe('white');
      expect(status.objective).toBe('win');
    });

    test('should handle malformed FEN parts', () => {
      const status = getGameStatus('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x');
      
      expect(status.sideToMove).toBe('white');
    });

    test('should handle partial FEN', () => {
      const status = getGameStatus('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w');
      
      expect(status.sideToMove).toBe('white');
    });

    test('should handle complex endgame', () => {
      // Rook endgame
      const fen = '6k1/8/8/8/8/8/6R1/6K1 w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.sideToMove).toBe('white');
      expect(status.objective).toBe('win');
    });

    test('should handle pawn endgame', () => {
      // Pawn endgame
      const fen = '8/8/8/8/8/3k4/3P4/3K4 w - - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.sideToMove).toBe('white');
    });
  });

  describe('Goal Detection', () => {
    test('should prefer explicit goal over automatic detection', () => {
      const fen = '4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1'; // Clear win position
      const status = getGameStatus(fen, 'draw'); // But goal is draw
      
      expect(status.objective).toBe('draw');
      expect(status.objectiveDisplay).toBe('Ziel: Remis');
    });

    test('should handle all goal types', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const winStatus = getGameStatus(fen, 'win');
      expect(winStatus.objectiveDisplay).toBe('Ziel: Gewinn');
      
      const drawStatus = getGameStatus(fen, 'draw');
      expect(drawStatus.objectiveDisplay).toBe('Ziel: Remis');
      
      const defendStatus = getGameStatus(fen, 'defend');
      expect(defendStatus.objectiveDisplay).toBe('Ziel: Verteidigen');
    });
  });

  describe('Display Formatting', () => {
    test('should format display strings consistently', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const status = getGameStatus(fen);
      
      expect(status.sideToMoveDisplay.startsWith('Weiß')).toBe(true);
      expect(status.objectiveDisplay.startsWith('Ziel:')).toBe(true);
    });

    test('should use correct icons', () => {
      const whiteFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const blackFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      
      const whiteStatus = getGameStatus(whiteFen);
      const blackStatus = getGameStatus(blackFen);
      
      expect(whiteStatus.icon).toBe('🟢');
      expect(blackStatus.icon).toBe('⚫');
    });
  });
});