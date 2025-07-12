/**
 * @fileoverview Unit tests for TablebaseManager
 * Tests tablebase queries, move analysis, and WDL perspective correction
 */

// Mock dependencies before imports
jest.mock('chess.js');
jest.mock('@shared/lib/chess/ScenarioEngine/tablebaseService');

import { Chess } from 'chess.js';
import { TablebaseService } from '@shared/lib/chess/ScenarioEngine/tablebaseService';
import { TablebaseManager } from '@shared/lib/chess/ScenarioEngine/core/tablebaseManager';
import type { TablebaseInfo } from '@shared/lib/chess/ScenarioEngine/types';

describe('TablebaseManager', () => {
  let tablebaseManager: TablebaseManager;
  let mockTablebaseService: jest.Mocked<TablebaseService>;
  let mockChessConstructor: jest.Mock;

  const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const endgameFen = '8/8/4k3/8/8/4K3/4P3/8 w - - 0 1'; // KPvK endgame

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock TablebaseService
    mockTablebaseService = {
      getTablebaseInfo: jest.fn(),
      getCacheStats: jest.fn(),
      clearCache: jest.fn()
    } as any;

    // Create instance
    tablebaseManager = new TablebaseManager(mockTablebaseService);

    // Mock Chess constructor for getTablebaseMoves tests
    mockChessConstructor = Chess as jest.Mock;
    mockChessConstructor.mockClear();
  });

  describe('constructor', () => {
    it('should initialize with tablebase service', () => {
      expect(tablebaseManager).toBeDefined();
      expect(tablebaseManager).toBeInstanceOf(TablebaseManager);
    });
  });

  describe('getTablebaseInfo', () => {
    it('should delegate to tablebase service', async () => {
      const tablebaseInfo: TablebaseInfo = {
        isTablebasePosition: true,
        result: {
          wdl: 2,
          dtz: 15,
          category: 'win',
          precise: true
        },
        bestMoves: [{ move: 'Kd2', evaluation: 'Win in 15' }]
      };
      mockTablebaseService.getTablebaseInfo.mockResolvedValue(tablebaseInfo);

      const result = await tablebaseManager.getTablebaseInfo(endgameFen);

      expect(mockTablebaseService.getTablebaseInfo).toHaveBeenCalledWith(endgameFen);
      expect(result).toEqual(tablebaseInfo);
    });

    it('should handle non-tablebase position', async () => {
      const tablebaseInfo: TablebaseInfo = {
        isTablebasePosition: false
      };
      mockTablebaseService.getTablebaseInfo.mockResolvedValue(tablebaseInfo);

      const result = await tablebaseManager.getTablebaseInfo(defaultFen);

      expect(result).toEqual(tablebaseInfo);
    });
  });

  describe('getTablebaseMoves', () => {
    it('should get tablebase moves with WDL perspective correction', async () => {
      const mockChess = {
        moves: jest.fn().mockReturnValue([
          { san: 'e4', from: 'e3', to: 'e4' },
          { san: 'Kd2', from: 'e3', to: 'd2' },
          { san: 'Kf2', from: 'e3', to: 'f2' }
        ]),
        move: jest.fn(),
        undo: jest.fn(),
        fen: jest.fn()
      };
      mockChessConstructor.mockReturnValue(mockChess);

      // Mock tablebase responses for each move
      mockChess.fen.mockReturnValueOnce('8/8/4k3/8/4P3/8/8/4K3 b - - 0 1');
      mockTablebaseService.getTablebaseInfo.mockResolvedValueOnce({
        isTablebasePosition: true,
        result: { wdl: -2, dtz: 20, category: 'loss', precise: true }
      });

      mockChess.fen.mockReturnValueOnce('8/8/4k3/8/8/8/3KP3/8 b - - 0 1');
      mockTablebaseService.getTablebaseInfo.mockResolvedValueOnce({
        isTablebasePosition: true,
        result: { wdl: -2, dtz: 18, category: 'loss', precise: true }
      });

      mockChess.fen.mockReturnValueOnce('8/8/4k3/8/8/8/4PK2/8 b - - 0 1');
      mockTablebaseService.getTablebaseInfo.mockResolvedValueOnce({
        isTablebasePosition: true,
        result: { wdl: 0, dtz: 0, category: 'draw', precise: true }
      });

      const result = await tablebaseManager.getTablebaseMoves(endgameFen, 2);

      expect(mockChess.moves).toHaveBeenCalledWith({ verbose: true });
      expect(mockChess.move).toHaveBeenCalledTimes(3);
      expect(mockChess.undo).toHaveBeenCalledTimes(3);
      
      // Results should be sorted by WDL (best first)
      expect(result).toEqual([
        { move: 'e4', wdl: 2, dtm: 20, evaluation: 'Win' },
        { move: 'Kd2', wdl: 2, dtm: 18, evaluation: 'Win' }
      ]);
    });

    it('should handle draws correctly', async () => {
      const mockChess = {
        moves: jest.fn().mockReturnValue([
          { san: 'Kd2', from: 'e3', to: 'd2' }
        ]),
        move: jest.fn(),
        undo: jest.fn(),
        fen: jest.fn().mockReturnValue('position-after-move')
      };
      mockChessConstructor.mockReturnValue(mockChess);

      mockTablebaseService.getTablebaseInfo.mockResolvedValue({
        isTablebasePosition: true,
        result: { wdl: 0, dtz: 0, category: 'draw', precise: true }
      });

      const result = await tablebaseManager.getTablebaseMoves(endgameFen, 1);

      expect(result).toEqual([
        { move: 'Kd2', wdl: 0, dtm: 0, evaluation: 'Draw' }
      ]);
    });

    it('should handle losses correctly', async () => {
      const mockChess = {
        moves: jest.fn().mockReturnValue([
          { san: 'Ke2', from: 'e3', to: 'e2' }
        ]),
        move: jest.fn(),
        undo: jest.fn(),
        fen: jest.fn().mockReturnValue('position-after-move')
      };
      mockChessConstructor.mockReturnValue(mockChess);

      mockTablebaseService.getTablebaseInfo.mockResolvedValue({
        isTablebasePosition: true,
        result: { wdl: 2, dtz: 5, category: 'win', precise: true }  // Win for opponent
      });

      const result = await tablebaseManager.getTablebaseMoves(endgameFen, 1);

      // Should negate WDL for current player's perspective
      expect(result).toEqual([
        { move: 'Ke2', wdl: -2, dtm: 5, evaluation: 'Loss' }
      ]);
    });

    it('should handle missing DTZ values', async () => {
      const mockChess = {
        moves: jest.fn().mockReturnValue([
          { san: 'e4', from: 'e3', to: 'e4' }
        ]),
        move: jest.fn(),
        undo: jest.fn(),
        fen: jest.fn().mockReturnValue('position-after-move')
      };
      mockChessConstructor.mockReturnValue(mockChess);

      mockTablebaseService.getTablebaseInfo.mockResolvedValue({
        isTablebasePosition: true,
        result: { wdl: -2, category: 'loss', precise: true }  // No dtz
      });

      const result = await tablebaseManager.getTablebaseMoves(endgameFen, 1);

      expect(result).toEqual([
        { move: 'e4', wdl: 2, dtm: undefined, evaluation: 'Win' }
      ]);
    });

    it('should skip non-tablebase positions', async () => {
      const mockChess = {
        moves: jest.fn().mockReturnValue([
          { san: 'e4', from: 'e2', to: 'e4' },
          { san: 'd4', from: 'd2', to: 'd4' }
        ]),
        move: jest.fn(),
        undo: jest.fn(),
        fen: jest.fn()
      };
      mockChessConstructor.mockReturnValue(mockChess);

      // First move is not in tablebase
      mockChess.fen.mockReturnValueOnce('position1');
      mockTablebaseService.getTablebaseInfo.mockResolvedValueOnce({
        isTablebasePosition: false
      });

      // Second move is in tablebase
      mockChess.fen.mockReturnValueOnce('position2');
      mockTablebaseService.getTablebaseInfo.mockResolvedValueOnce({
        isTablebasePosition: true,
        result: { wdl: -2, dtz: 10, category: 'loss', precise: true }
      });

      const result = await tablebaseManager.getTablebaseMoves(defaultFen, 2);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        move: 'd4',
        wdl: 2,
        dtm: 10,
        evaluation: 'Win'
      });
    });

    it('should handle tablebase service errors', async () => {
      const mockChess = {
        moves: jest.fn().mockReturnValue([
          { san: 'e4', from: 'e3', to: 'e4' }
        ]),
        move: jest.fn(),
        undo: jest.fn(),
        fen: jest.fn().mockReturnValue('position-after-move')
      };
      mockChessConstructor.mockReturnValue(mockChess);

      mockTablebaseService.getTablebaseInfo.mockRejectedValue(new Error('Tablebase error'));

      const result = await tablebaseManager.getTablebaseMoves(endgameFen, 1);

      expect(result).toEqual([]);
      expect(mockChess.undo).toHaveBeenCalled();
    });

    it('should handle Chess constructor errors', async () => {
      mockChessConstructor.mockImplementation(() => {
        throw new Error('Invalid FEN');
      });

      const result = await tablebaseManager.getTablebaseMoves('invalid-fen', 1);

      expect(result).toEqual([]);
    });
  });

  describe('isTablebasePosition', () => {
    it('should return true for 7 or fewer pieces', () => {
      const positions = [
        '8/8/4k3/8/8/4K3/4P3/8 w - - 0 1', // 3 pieces
        '8/8/2k5/8/8/2K5/2P5/2R5 w - - 0 1', // 4 pieces
        'r6k/8/8/8/8/8/8/R6K w - - 0 1', // 4 pieces
        'r3k3/8/8/8/8/8/8/R3K2R w - - 0 1', // 5 pieces
        'r1b1k3/8/8/8/8/8/8/R1B1K3 w - - 0 1', // 6 pieces
        'r1b1k3/p7/8/8/8/8/8/R1B1K3 w - - 0 1' // 7 pieces
      ];

      positions.forEach(fen => {
        expect(tablebaseManager.isTablebasePosition(fen)).toBe(true);
      });
    });

    it('should return false for more than 7 pieces', () => {
      const positions = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // 32 pieces
        'r1b1k3/p7/8/8/8/8/P7/R1B1K3 w - - 0 1', // 8 pieces
        'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2' // 31 pieces
      ];

      positions.forEach(fen => {
        expect(tablebaseManager.isTablebasePosition(fen)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      // Empty board (should count as 0 pieces)
      expect(tablebaseManager.isTablebasePosition('8/8/8/8/8/8/8/8 w - - 0 1')).toBe(true);
      
      // Just kings
      expect(tablebaseManager.isTablebasePosition('4k3/8/8/8/8/8/8/4K3 w - - 0 1')).toBe(true);
    });
  });

  describe('getCacheStats', () => {
    it('should delegate to tablebase service', () => {
      const stats = { size: 50, maxSize: 200 };
      mockTablebaseService.getCacheStats.mockReturnValue(stats);

      const result = tablebaseManager.getCacheStats();

      expect(mockTablebaseService.getCacheStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });

  describe('clearCache', () => {
    it('should delegate to tablebase service', () => {
      tablebaseManager.clearCache();

      expect(mockTablebaseService.clearCache).toHaveBeenCalled();
    });
  });
});