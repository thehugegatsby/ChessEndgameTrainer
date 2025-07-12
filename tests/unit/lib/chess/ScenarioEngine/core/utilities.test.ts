/**
 * @fileoverview Unit tests for Utilities
 * Tests statistics, debugging, and helper functions
 */

// Mock dependencies before imports
jest.mock('chess.js');
jest.mock('@shared/lib/chess/ScenarioEngine/core/instanceManager');

import { Chess } from 'chess.js';
import { TablebaseManager } from '@shared/lib/chess/ScenarioEngine/core/tablebaseManager';
import { EvaluationManager } from '@shared/lib/chess/ScenarioEngine/core/evaluationManager';
import { MoveHandler } from '@shared/lib/chess/ScenarioEngine/core/moveHandler';
import { InstanceManager } from '@shared/lib/chess/ScenarioEngine/core/instanceManager';
import { Utilities } from '@shared/lib/chess/ScenarioEngine/core/utilities';

describe('Utilities', () => {
  let utilities: Utilities;
  let mockChess: jest.Mocked<Chess>;
  let mockTablebaseManager: jest.Mocked<TablebaseManager>;
  let mockEvaluationManager: jest.Mocked<EvaluationManager>;
  let mockMoveHandler: jest.Mocked<MoveHandler>;

  const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const endgameFen = '8/8/4k3/8/8/4K3/4P3/8 w - - 0 1';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Chess instance
    mockChess = {
      fen: jest.fn().mockReturnValue(defaultFen)
    } as any;

    // Mock managers
    mockTablebaseManager = {
      isTablebasePosition: jest.fn(),
      getTablebaseMoves: jest.fn(),
      getCacheStats: jest.fn()
    } as any;

    mockEvaluationManager = {
      getEngineBestMoves: jest.fn()
    } as any;

    mockMoveHandler = {
      convertEngineNotation: jest.fn()
    } as any;

    // Mock InstanceManager static method
    (InstanceManager.getInstanceCount as jest.Mock) = jest.fn().mockReturnValue(2);

    // Create instance
    utilities = new Utilities(
      mockChess,
      mockTablebaseManager,
      mockEvaluationManager,
      mockMoveHandler,
      defaultFen
    );
  });

  describe('constructor', () => {
    it('should initialize with all dependencies', () => {
      expect(utilities).toBeDefined();
      expect(utilities).toBeInstanceOf(Utilities);
    });
  });

  describe('getBestMoves', () => {
    it('should get engine moves for non-tablebase position', async () => {
      const engineMoves = [
        { move: 'e2e4', evaluation: 0.3 },
        { move: 'd2d4', evaluation: 0.2 },
        { move: 'g1f3', evaluation: 0.1 }
      ];

      mockEvaluationManager.getEngineBestMoves.mockResolvedValue(engineMoves);
      mockMoveHandler.convertEngineNotation
        .mockReturnValueOnce('e4')
        .mockReturnValueOnce('d4')
        .mockReturnValueOnce('Nf3');
      mockTablebaseManager.isTablebasePosition.mockReturnValue(false);

      const result = await utilities.getBestMoves(defaultFen);

      expect(mockEvaluationManager.getEngineBestMoves).toHaveBeenCalledWith(defaultFen, 3);
      expect(mockMoveHandler.convertEngineNotation).toHaveBeenCalledTimes(3);
      expect(mockTablebaseManager.isTablebasePosition).toHaveBeenCalledWith(defaultFen);
      expect(mockTablebaseManager.getTablebaseMoves).not.toHaveBeenCalled();

      expect(result).toEqual({
        engine: [
          { move: 'e4', evaluation: 0.3 },
          { move: 'd4', evaluation: 0.2 },
          { move: 'Nf3', evaluation: 0.1 }
        ],
        tablebase: []
      });
    });

    it('should get both engine and tablebase moves for endgame position', async () => {
      const engineMoves = [
        { move: 'e3e4', evaluation: 10.5 },
        { move: 'e3d2', evaluation: 10.2 }
      ];

      const tablebaseMoves = [
        { move: 'e4', wdl: 2, dtm: 15, evaluation: 'Win' },
        { move: 'Kd2', wdl: 2, dtm: 18, evaluation: 'Win' }
      ];

      mockEvaluationManager.getEngineBestMoves.mockResolvedValue(engineMoves);
      mockMoveHandler.convertEngineNotation
        .mockReturnValueOnce('e4')
        .mockReturnValueOnce('Kd2');
      mockTablebaseManager.isTablebasePosition.mockReturnValue(true);
      mockTablebaseManager.getTablebaseMoves.mockResolvedValue(tablebaseMoves);

      const result = await utilities.getBestMoves(endgameFen, 2);

      expect(mockEvaluationManager.getEngineBestMoves).toHaveBeenCalledWith(endgameFen, 2);
      expect(mockTablebaseManager.isTablebasePosition).toHaveBeenCalledWith(endgameFen);
      expect(mockTablebaseManager.getTablebaseMoves).toHaveBeenCalledWith(endgameFen, 2);

      expect(result).toEqual({
        engine: [
          { move: 'e4', evaluation: 10.5 },
          { move: 'Kd2', evaluation: 10.2 }
        ],
        tablebase: tablebaseMoves
      });
    });

    it('should handle mate evaluations', async () => {
      const engineMoves = [
        { move: 'h5g7', evaluation: 0, mate: 1 },
        { move: 'h5f7', evaluation: 0, mate: 2 }
      ];

      mockEvaluationManager.getEngineBestMoves.mockResolvedValue(engineMoves);
      mockMoveHandler.convertEngineNotation
        .mockReturnValueOnce('Qg7#')
        .mockReturnValueOnce('Qf7+');
      mockTablebaseManager.isTablebasePosition.mockReturnValue(false);

      const result = await utilities.getBestMoves(defaultFen);

      expect(result.engine).toEqual([
        { move: 'Qg7#', evaluation: 0, mate: 1 },
        { move: 'Qf7+', evaluation: 0, mate: 2 }
      ]);
    });

    it('should handle errors gracefully', async () => {
      mockEvaluationManager.getEngineBestMoves.mockRejectedValue(new Error('Engine error'));

      const result = await utilities.getBestMoves(defaultFen);

      expect(result).toEqual({
        engine: [],
        tablebase: []
      });
    });

    it('should handle tablebase errors separately', async () => {
      const engineMoves = [{ move: 'e2e4', evaluation: 0.3 }];

      mockEvaluationManager.getEngineBestMoves.mockResolvedValue(engineMoves);
      mockMoveHandler.convertEngineNotation.mockReturnValue('e4');
      mockTablebaseManager.isTablebasePosition.mockReturnValue(true);
      mockTablebaseManager.getTablebaseMoves.mockRejectedValue(new Error('Tablebase error'));

      const result = await utilities.getBestMoves(defaultFen);

      // Should still return engine moves even if tablebase fails
      expect(result).toEqual({
        engine: [{ move: 'e4', evaluation: 0.3, mate: undefined }],
        tablebase: []
      });
    });
  });

  describe('getStats', () => {
    it('should return complete statistics', () => {
      const cacheStats = { size: 50, maxSize: 200 };
      mockTablebaseManager.getCacheStats.mockReturnValue(cacheStats);
      mockChess.fen.mockReturnValue(endgameFen);

      const result = utilities.getStats();

      expect(InstanceManager.getInstanceCount).toHaveBeenCalled();
      expect(mockChess.fen).toHaveBeenCalled();
      expect(mockTablebaseManager.getCacheStats).toHaveBeenCalled();

      expect(result).toEqual({
        instanceCount: 2,
        currentFen: endgameFen,
        initialFen: defaultFen,
        cacheStats: cacheStats
      });
    });

    it('should handle different instance counts', () => {
      (InstanceManager.getInstanceCount as jest.Mock).mockReturnValue(5);
      mockTablebaseManager.getCacheStats.mockReturnValue({ size: 0, maxSize: 100 });

      const result = utilities.getStats();

      expect(result.instanceCount).toBe(5);
    });
  });

  describe('getFen', () => {
    it('should return current FEN from chess instance', () => {
      mockChess.fen.mockReturnValue(endgameFen);

      const result = utilities.getFen();

      expect(mockChess.fen).toHaveBeenCalled();
      expect(result).toBe(endgameFen);
    });

    it('should always return current position', () => {
      // First call
      mockChess.fen.mockReturnValueOnce(defaultFen);
      expect(utilities.getFen()).toBe(defaultFen);

      // Second call with different position
      mockChess.fen.mockReturnValueOnce(endgameFen);
      expect(utilities.getFen()).toBe(endgameFen);
    });
  });

  describe('getChessInstance', () => {
    it('should return the chess instance', () => {
      const result = utilities.getChessInstance();

      expect(result).toBe(mockChess);
    });

    it('should return the same instance on multiple calls', () => {
      const instance1 = utilities.getChessInstance();
      const instance2 = utilities.getChessInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(mockChess);
    });
  });
});