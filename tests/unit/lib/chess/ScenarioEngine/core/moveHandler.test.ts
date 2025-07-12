/**
 * @fileoverview Unit tests for MoveHandler
 * Tests move validation, execution, and engine responses
 */

// Mock dependencies before imports
jest.mock('chess.js');

import { Chess, Move } from 'chess.js';
import { MoveHandler } from '@shared/lib/chess/ScenarioEngine/core/moveHandler';

describe('MoveHandler', () => {
  let moveHandler: MoveHandler;
  let mockChess: jest.Mocked<Chess>;
  let mockEngine: any;

  const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const customFen = 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Chess instance
    mockChess = {
      turn: jest.fn().mockReturnValue('w'),
      fen: jest.fn().mockReturnValue(defaultFen),
      move: jest.fn()
    } as any;

    // Mock engine
    mockEngine = {
      getBestMove: jest.fn()
    };

    // Create instance
    moveHandler = new MoveHandler(mockChess, mockEngine);
  });

  describe('constructor', () => {
    it('should initialize with chess and engine instances', () => {
      expect(moveHandler).toBeDefined();
      expect(moveHandler).toBeInstanceOf(MoveHandler);
    });
  });

  describe('makeMove', () => {
    it('should make a valid move and get engine response', async () => {
      const playerMove = { from: 'e2', to: 'e4' };
      const playerMoveResult = { 
        from: 'e2', 
        to: 'e4', 
        san: 'e4',
        color: 'w',
        piece: 'p',
        flags: 'b',
        captured: undefined,
        promotion: undefined
      };
      const engineMove = { from: 'e7', to: 'e5' };

      // First move() call returns player move
      mockChess.move.mockReturnValueOnce(playerMoveResult as unknown as Move);
      // Second move() call for engine move
      mockChess.move.mockReturnValueOnce({} as any);
      
      mockEngine.getBestMove.mockResolvedValue(engineMove);

      const result = await moveHandler.makeMove(playerMove);

      expect(mockChess.turn).toHaveBeenCalled();
      expect(mockChess.move).toHaveBeenCalledWith(playerMove);
      expect(mockEngine.getBestMove).toHaveBeenCalledWith(defaultFen, 1000);
      expect(mockChess.move).toHaveBeenCalledWith(engineMove);
      expect(result).toEqual({ ...playerMoveResult, color: 'w' });
    });

    it('should handle move with promotion', async () => {
      const playerMove = { from: 'e7', to: 'e8', promotion: 'q' as const };
      const playerMoveResult = { 
        from: 'e7', 
        to: 'e8', 
        san: 'e8=Q',
        color: 'w',
        piece: 'p',
        flags: 'p',
        captured: undefined,
        promotion: 'q'
      };

      mockChess.move.mockReturnValueOnce(playerMoveResult as unknown as Move);
      mockEngine.getBestMove.mockResolvedValue(null);

      const result = await moveHandler.makeMove(playerMove);

      expect(mockChess.move).toHaveBeenCalledWith(playerMove);
      expect(result).toEqual({ ...playerMoveResult, color: 'w' });
    });

    it('should return null for invalid move', async () => {
      const invalidMove = { from: 'e2', to: 'e5' };
      mockChess.move.mockReturnValueOnce(null as any);

      const result = await moveHandler.makeMove(invalidMove);

      expect(result).toBeNull();
      expect(mockEngine.getBestMove).not.toHaveBeenCalled();
    });

    it('should handle engine response failure gracefully', async () => {
      const playerMove = { from: 'e2', to: 'e4' };
      const playerMoveResult = { from: 'e2', to: 'e4', san: 'e4' };

      mockChess.move.mockReturnValueOnce(playerMoveResult as unknown as Move);
      mockEngine.getBestMove.mockResolvedValue({ from: 'e7', to: 'e5' });
      
      // Engine move throws error
      mockChess.move.mockImplementationOnce(() => {
        throw new Error('Invalid engine move');
      });

      const result = await moveHandler.makeMove(playerMove);

      // Should still return player move even if engine move fails
      expect(result).toEqual({ ...playerMoveResult, color: 'w' });
    });

    it('should handle no engine response', async () => {
      const playerMove = { from: 'e2', to: 'e4' };
      const playerMoveResult = { from: 'e2', to: 'e4', san: 'e4' };

      mockChess.move.mockReturnValueOnce(playerMoveResult as unknown as Move);
      mockEngine.getBestMove.mockResolvedValue(null);

      const result = await moveHandler.makeMove(playerMove);

      expect(result).toEqual({ ...playerMoveResult, color: 'w' });
      // Should only have been called once (for player move)
      expect(mockChess.move).toHaveBeenCalledTimes(1);
    });

    it('should handle engine move with promotion', async () => {
      const playerMove = { from: 'e2', to: 'e4' };
      const playerMoveResult = { from: 'e2', to: 'e4', san: 'e4' };
      const engineMove = { from: 'a7', to: 'a8', promotion: 'q' };

      mockChess.move.mockReturnValueOnce(playerMoveResult as unknown as Move);
      mockChess.move.mockReturnValueOnce({} as any);
      mockEngine.getBestMove.mockResolvedValue(engineMove);

      await moveHandler.makeMove(playerMove);

      expect(mockChess.move).toHaveBeenCalledWith(engineMove);
    });

    it('should catch errors in makeMove', async () => {
      const playerMove = { from: 'e2', to: 'e4' };
      
      // Make chess.move throw an error
      mockChess.move.mockImplementation(() => {
        throw new Error('Chess.js error');
      });

      const result = await moveHandler.makeMove(playerMove);

      expect(result).toBeNull();
    });

    it('should preserve turn color correctly', async () => {
      const playerMove = { from: 'e2', to: 'e4' };
      const playerMoveResult = { from: 'e2', to: 'e4', san: 'e4' };

      // Test black's turn
      mockChess.turn.mockReturnValue('b');
      mockChess.move.mockReturnValueOnce(playerMoveResult as unknown as Move);
      mockEngine.getBestMove.mockResolvedValue(null);

      const result = await moveHandler.makeMove(playerMove);

      expect(result).toEqual({ ...playerMoveResult, color: 'b' });
    });
  });

  describe('getBestMove', () => {
    it('should get best move from engine', async () => {
      const bestMove = { from: 'd2', to: 'd4' };
      mockEngine.getBestMove.mockResolvedValue(bestMove);

      const result = await moveHandler.getBestMove(customFen);

      expect(mockEngine.getBestMove).toHaveBeenCalledWith(customFen);
      expect(result).toEqual(bestMove);
    });

    it('should handle move with promotion', async () => {
      const bestMove = { from: 'e7', to: 'e8', promotion: 'q' };
      mockEngine.getBestMove.mockResolvedValue(bestMove);

      const result = await moveHandler.getBestMove(customFen);

      expect(result).toEqual({
        from: 'e7',
        to: 'e8',
        promotion: 'q'
      });
    });

    it('should return null when no best move available', async () => {
      mockEngine.getBestMove.mockResolvedValue(null);

      const result = await moveHandler.getBestMove(customFen);

      expect(result).toBeNull();
    });

    it('should handle engine errors', async () => {
      mockEngine.getBestMove.mockRejectedValue(new Error('Engine error'));

      const result = await moveHandler.getBestMove(customFen);

      expect(result).toBeNull();
    });

    it('should handle different promotion pieces', async () => {
      const promotions: Array<'q' | 'r' | 'b' | 'n'> = ['q', 'r', 'b', 'n'];
      
      for (const promotion of promotions) {
        const bestMove = { from: 'a7', to: 'a8', promotion };
        mockEngine.getBestMove.mockResolvedValue(bestMove);

        const result = await moveHandler.getBestMove(customFen);

        expect(result).toEqual({
          from: 'a7',
          to: 'a8',
          promotion
        });
      }
    });
  });

  describe('convertEngineNotation', () => {
    let mockChessConstructor: jest.Mock;

    beforeEach(() => {
      mockChessConstructor = Chess as jest.Mock;
      mockChessConstructor.mockClear();
    });

    it('should convert engine notation to algebraic notation', () => {
      const mockTempChess = {
        move: jest.fn().mockReturnValue({ san: 'e4' })
      };
      mockChessConstructor.mockReturnValue(mockTempChess);

      const result = moveHandler.convertEngineNotation('e2e4', defaultFen);

      expect(mockChessConstructor).toHaveBeenCalledWith(defaultFen);
      expect(mockTempChess.move).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4',
        promotion: undefined
      });
      expect(result).toBe('e4');
    });

    it('should handle promotion in engine notation', () => {
      const mockTempChess = {
        move: jest.fn().mockReturnValue({ san: 'e8=Q' })
      };
      mockChessConstructor.mockReturnValue(mockTempChess);

      const result = moveHandler.convertEngineNotation('e7e8q', customFen);

      expect(mockTempChess.move).toHaveBeenCalledWith({
        from: 'e7',
        to: 'e8',
        promotion: 'q'
      });
      expect(result).toBe('e8=Q');
    });

    it('should return original notation on error', () => {
      mockChessConstructor.mockImplementation(() => {
        throw new Error('Invalid FEN');
      });

      const result = moveHandler.convertEngineNotation('e2e4', 'invalid-fen');

      expect(result).toBe('e2e4');
    });

    it('should handle invalid move', () => {
      const mockTempChess = {
        move: jest.fn().mockReturnValue(null)
      };
      mockChessConstructor.mockReturnValue(mockTempChess);

      const result = moveHandler.convertEngineNotation('e2e5', defaultFen);

      expect(result).toBe('e2e5');
    });

    it('should handle different promotion pieces', () => {
      const promotionTests = [
        { notation: 'a7a8r', expected: 'a8=R', promotion: 'r' },
        { notation: 'b7b8b', expected: 'b8=B', promotion: 'b' },
        { notation: 'c7c8n', expected: 'c8=N', promotion: 'n' }
      ];

      promotionTests.forEach(test => {
        const mockTempChess = {
          move: jest.fn().mockReturnValue({ san: test.expected })
        };
        mockChessConstructor.mockReturnValue(mockTempChess);

        const result = moveHandler.convertEngineNotation(test.notation, customFen);

        expect(mockTempChess.move).toHaveBeenCalledWith({
          from: test.notation.substring(0, 2),
          to: test.notation.substring(2, 4),
          promotion: test.promotion
        });
        expect(result).toBe(test.expected);
      });
    });
  });
});