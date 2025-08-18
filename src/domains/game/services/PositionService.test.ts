/**
 * @file PositionService.test.ts
 * @description Unit tests for PositionService implementation
 * @module domains/game/services/PositionService.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PositionService } from './PositionService';
import type { ChessGameLogicInterface } from '@domains/game/engine/types';

// Mock the tablebase service
vi.mock('@domains/evaluation', () => ({
  tablebaseService: {
    getEvaluation: vi.fn(),
    getTopMoves: vi.fn()
  }
}));

import { tablebaseService } from '@domains/evaluation';

const TEST_POSITIONS = {
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  AFTER_E4: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  KPK_ENDGAME: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  COMPLEX_POSITION: 'r2qkb1r/pp2nppp/3p1n2/2pP4/2P1P3/2N2N2/PP1B1PPP/R2QK2R w KQkq c6 0 8'
};

describe('PositionService', () => {
  let positionService: PositionService;
  let mockChessGameLogic: ChessGameLogicInterface;

  beforeEach(() => {
    mockChessGameLogic = {
      getFen: vi.fn(),
      loadFen: vi.fn(),
      makeMove: vi.fn(),
      getValidMoves: vi.fn(),
      isMoveLegal: vi.fn(),
      isGameOver: vi.fn(),
      isCheck: vi.fn(),
      isCheckmate: vi.fn(),
      isStalemate: vi.fn(),
      isDraw: vi.fn(),
      getPgn: vi.fn(),
      getMoveHistory: vi.fn(),
      reset: vi.fn(),
      undo: vi.fn()
    };
    
    positionService = new PositionService(mockChessGameLogic);
  });

  describe('exportToFEN()', () => {
    it('should return FEN string from chess engine', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      
      const result = positionService.exportToFEN();
      
      expect(result).toBe(TEST_POSITIONS.STARTING_POSITION);
      expect(mockChessGameLogic.getFen).toHaveBeenCalledOnce();
    });

    it('should return current position FEN after move', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.AFTER_E4);
      
      const result = positionService.exportToFEN();
      
      expect(result).toBe(TEST_POSITIONS.AFTER_E4);
      expect(mockChessGameLogic.getFen).toHaveBeenCalledOnce();
    });

    it('should handle endgame positions correctly', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.KPK_ENDGAME);
      
      const result = positionService.exportToFEN();
      
      expect(result).toBe(TEST_POSITIONS.KPK_ENDGAME);
      expect(mockChessGameLogic.getFen).toHaveBeenCalledOnce();
    });

    it('should handle complex middlegame positions', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.COMPLEX_POSITION);
      
      const result = positionService.exportToFEN();
      
      expect(result).toBe(TEST_POSITIONS.COMPLEX_POSITION);
      expect(mockChessGameLogic.getFen).toHaveBeenCalledOnce();
    });

    it('should properly delegate to chess engine without modification', () => {
      const customFen = '8/8/8/8/8/8/8/K3k3 w - - 0 1';
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(customFen);
      
      const result = positionService.exportToFEN();
      
      expect(result).toBe(customFen);
      expect(mockChessGameLogic.getFen).toHaveBeenCalledOnce();
      expect(mockChessGameLogic.getFen).toHaveBeenCalledWith();
    });
  });

  describe('validatePosition()', () => {
    it('should return true for valid starting position', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      
      const result = positionService.validatePosition(TEST_POSITIONS.STARTING_POSITION);
      
      expect(result).toBe(true);
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(TEST_POSITIONS.STARTING_POSITION);
    });

    it('should return true for valid endgame position', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.KPK_ENDGAME);
      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      
      const result = positionService.validatePosition(TEST_POSITIONS.KPK_ENDGAME);
      
      expect(result).toBe(true);
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(TEST_POSITIONS.KPK_ENDGAME);
    });

    it('should return false for FEN with wrong number of fields', () => {
      const invalidFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq'; // Missing last 2 fields
      
      const result = positionService.validatePosition(invalidFen);
      
      expect(result).toBe(false);
      expect(mockChessGameLogic.loadFen).not.toHaveBeenCalled();
    });

    it('should return false for empty FEN string', () => {
      const result = positionService.validatePosition('');
      
      expect(result).toBe(false);
      expect(mockChessGameLogic.loadFen).not.toHaveBeenCalled();
    });

    it('should return false for FEN with too many fields', () => {
      const invalidFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 extra';
      
      const result = positionService.validatePosition(invalidFen);
      
      expect(result).toBe(false);
      expect(mockChessGameLogic.loadFen).not.toHaveBeenCalled();
    });

    it('should return false when chess engine rejects FEN', () => {
      const invalidChessFen = 'invalid/chess/position/8/8/8/8/8 w KQkq - 0 1'; // Valid structure, invalid chess
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(false);
      
      const result = positionService.validatePosition(invalidChessFen);
      
      expect(result).toBe(false);
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(invalidChessFen);
    });

    it('should restore original position after validation', () => {
      const originalFen = TEST_POSITIONS.STARTING_POSITION;
      const testFen = TEST_POSITIONS.AFTER_E4;
      
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(originalFen);
      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      
      positionService.validatePosition(testFen);
      
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(testFen);
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(originalFen);
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledTimes(2);
    });

    it('should handle chess engine exceptions gracefully', () => {
      const problematicFen = 'malformed fen string with 6 spaces - - - 0 1';
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      mockChessGameLogic.loadFen = vi.fn().mockImplementation(() => {
        throw new Error('Chess engine error');
      });
      
      const result = positionService.validatePosition(problematicFen);
      
      expect(result).toBe(false);
    });

    it('should handle FEN with extra whitespace', () => {
      const fenWithSpaces = `  ${TEST_POSITIONS.STARTING_POSITION}  `;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      
      const result = positionService.validatePosition(fenWithSpaces);
      
      expect(result).toBe(true);
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(TEST_POSITIONS.STARTING_POSITION);
    });
  });

  describe('loadFromFEN()', () => {
    it('should load valid FEN position', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      
      const result = positionService.loadFromFEN(TEST_POSITIONS.AFTER_E4);
      
      expect(result).toBe(true);
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(TEST_POSITIONS.AFTER_E4);
    });

    it('should reject invalid FEN without calling engine', () => {
      const invalidFen = 'invalid fen';
      
      const result = positionService.loadFromFEN(invalidFen);
      
      expect(result).toBe(false);
      expect(mockChessGameLogic.loadFen).not.toHaveBeenCalled();
    });

    it('should return false when engine rejects valid structure FEN', () => {
      const validStructureFen = 'invalid/chess/position/8/8/8/8/8 w KQkq - 0 1';
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      mockChessGameLogic.loadFen = vi.fn()
        .mockReturnValueOnce(false) // validation call
        .mockReturnValueOnce(true); // restore original position
      
      const result = positionService.loadFromFEN(validStructureFen);
      
      expect(result).toBe(false);
    });

    it('should load complex endgame position', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      
      const result = positionService.loadFromFEN(TEST_POSITIONS.KPK_ENDGAME);
      
      expect(result).toBe(true);
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(TEST_POSITIONS.KPK_ENDGAME);
    });

    it('should handle FEN with extra whitespace', () => {
      const fenWithSpaces = `  ${TEST_POSITIONS.STARTING_POSITION}  `;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      
      const result = positionService.loadFromFEN(fenWithSpaces);
      
      expect(result).toBe(true);
    });
  });

  describe('evaluatePosition()', () => {
    const mockTablebaseService = vi.mocked(tablebaseService);

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return evaluation result when tablebase is available', async () => {
      // Arrange
      const testFen = TEST_POSITIONS.KPK_ENDGAME;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(testFen);
      mockTablebaseService.getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: 2,
          category: 'win',
          dtz: 23,
          dtm: 23,
          precise: true
        }
      });

      // Act
      const result = await positionService.evaluatePosition();

      // Assert
      expect(result).toEqual({
        wdl: 2,
        category: 'win',
        dtz: 23
      });
      expect(mockTablebaseService.getEvaluation).toHaveBeenCalledWith(testFen);
    });

    it('should use provided FEN when specified', async () => {
      // Arrange
      const customFen = TEST_POSITIONS.AFTER_E4;
      mockTablebaseService.getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: 0,
          category: 'draw',
          dtz: null,
          dtm: null,
          precise: true
        }
      });

      // Act
      const result = await positionService.evaluatePosition(customFen);

      // Assert
      expect(result).toEqual({
        wdl: 0,
        category: 'draw'
      });
      expect(mockTablebaseService.getEvaluation).toHaveBeenCalledWith(customFen);
      expect(mockChessGameLogic.getFen).not.toHaveBeenCalled();
    });

    it('should return null when tablebase is not available', async () => {
      // Arrange
      const testFen = TEST_POSITIONS.STARTING_POSITION;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(testFen);
      mockTablebaseService.getEvaluation.mockResolvedValue({
        isAvailable: false
      });

      // Act
      const result = await positionService.evaluatePosition();

      // Assert
      expect(result).toBeNull();
      expect(mockTablebaseService.getEvaluation).toHaveBeenCalledWith(testFen);
    });

    it('should handle tablebase service errors gracefully', async () => {
      // Arrange
      const testFen = TEST_POSITIONS.KPK_ENDGAME;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(testFen);
      mockTablebaseService.getEvaluation.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await positionService.evaluatePosition();

      // Assert
      expect(result).toBeNull();
    });

    it('should not include dtz when it is null', async () => {
      // Arrange
      const testFen = TEST_POSITIONS.KPK_ENDGAME;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(testFen);
      mockTablebaseService.getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: -2,
          category: 'loss',
          dtz: null,
          dtm: 15,
          precise: true
        }
      });

      // Act
      const result = await positionService.evaluatePosition();

      // Assert
      expect(result).toEqual({
        wdl: -2,
        category: 'loss'
      });
      expect(result).not.toHaveProperty('dtz');
    });
  });

  describe('getBestMove()', () => {
    const mockTablebaseService = vi.mocked(tablebaseService);

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return best move when tablebase has moves', async () => {
      // Arrange
      const testFen = TEST_POSITIONS.KPK_ENDGAME;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(testFen);
      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            uci: 'e5e6',
            san: 'e6',
            wdl: 2,
            dtz: 22,
            dtm: 22,
            category: 'win'
          },
          {
            uci: 'e6e7',
            san: 'Ke7',
            wdl: 2,
            dtz: 24,
            dtm: 24,
            category: 'win'
          }
        ]
      });

      // Act
      const result = await positionService.getBestMove();

      // Assert
      expect(result).toBe('e5e6');
      expect(mockTablebaseService.getTopMoves).toHaveBeenCalledWith(testFen, 1);
    });

    it('should use provided FEN when specified', async () => {
      // Arrange
      const customFen = TEST_POSITIONS.AFTER_E4;
      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            uci: 'e7e5',
            san: 'e5',
            wdl: 0,
            dtz: null,
            dtm: null,
            category: 'draw'
          }
        ]
      });

      // Act
      const result = await positionService.getBestMove(customFen);

      // Assert
      expect(result).toBe('e7e5');
      expect(mockTablebaseService.getTopMoves).toHaveBeenCalledWith(customFen, 1);
      expect(mockChessGameLogic.getFen).not.toHaveBeenCalled();
    });

    it('should return null when tablebase is not available', async () => {
      // Arrange
      const testFen = TEST_POSITIONS.STARTING_POSITION;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(testFen);
      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: false
      });

      // Act
      const result = await positionService.getBestMove();

      // Assert
      expect(result).toBeNull();
      expect(mockTablebaseService.getTopMoves).toHaveBeenCalledWith(testFen, 1);
    });

    it('should return null when no moves are available', async () => {
      // Arrange
      const testFen = TEST_POSITIONS.KPK_ENDGAME;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(testFen);
      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: []
      });

      // Act
      const result = await positionService.getBestMove();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when moves array is undefined', async () => {
      // Arrange
      const testFen = TEST_POSITIONS.KPK_ENDGAME;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(testFen);
      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true
        // moves is undefined
      });

      // Act
      const result = await positionService.getBestMove();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle tablebase service errors gracefully', async () => {
      // Arrange
      const testFen = TEST_POSITIONS.KPK_ENDGAME;
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(testFen);
      mockTablebaseService.getTopMoves.mockRejectedValue(new Error('Network Error'));

      // Act
      const result = await positionService.getBestMove();

      // Assert
      expect(result).toBeNull();
    });
  });
});