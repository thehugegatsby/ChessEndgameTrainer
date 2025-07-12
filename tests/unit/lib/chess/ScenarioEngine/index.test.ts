/**
 * @fileoverview Unit tests for ScenarioEngine
 * Tests the main orchestrator functionality, including initialization,
 * move handling, evaluation, and memory management
 */

// Mock all dependencies before imports
jest.mock('chess.js');
jest.mock('@shared/lib/chess/engine/singleton');
jest.mock('@shared/lib/chess/ScenarioEngine/evaluationService');
jest.mock('@shared/lib/chess/ScenarioEngine/tablebaseService');
jest.mock('@shared/lib/chess/ScenarioEngine/core');

// Mock the logger
jest.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    setContext: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  })
}));

import { Chess } from 'chess.js';
import { engine } from '@shared/lib/chess/engine/singleton';
import { EvaluationService } from '@shared/lib/chess/ScenarioEngine/evaluationService';
import { TablebaseService } from '@shared/lib/chess/ScenarioEngine/tablebaseService';
import {
  InstanceManager,
  MoveHandler,
  EvaluationManager,
  TablebaseManager,
  Utilities
} from '@shared/lib/chess/ScenarioEngine/core';
import { ScenarioEngine } from '@shared/lib/chess/ScenarioEngine';
import type { DualEvaluation, TablebaseInfo, EngineEvaluation } from '@shared/lib/chess/ScenarioEngine/types';

describe('ScenarioEngine', () => {
  let scenarioEngine: ScenarioEngine;
  let mockChess: jest.Mocked<Chess>;
  let mockEngine: jest.Mocked<typeof engine>;
  let mockEvaluationService: jest.Mocked<EvaluationService>;
  let mockTablebaseService: jest.Mocked<TablebaseService>;
  let mockMoveHandler: jest.Mocked<MoveHandler>;
  let mockEvaluationManager: jest.Mocked<EvaluationManager>;
  let mockTablebaseManager: jest.Mocked<TablebaseManager>;
  let mockUtilities: jest.Mocked<Utilities>;

  const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const customFen = 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock Chess.js instance
    mockChess = {
      fen: jest.fn().mockReturnValue(defaultFen),
      move: jest.fn(),
      load: jest.fn(),
      reset: jest.fn()
    } as any;

    // Mock engine singleton
    mockEngine = {} as any;
    (engine as any) = mockEngine;

    // Mock services
    mockEvaluationService = {} as any;
    (EvaluationService as jest.Mock).mockImplementation(() => mockEvaluationService);

    mockTablebaseService = {} as any;
    (TablebaseService as jest.Mock).mockImplementation(() => mockTablebaseService);

    // Mock core managers
    mockMoveHandler = {
      makeMove: jest.fn(),
      getBestMove: jest.fn()
    } as any;

    mockEvaluationManager = {
      isCriticalMistake: jest.fn(),
      getDualEvaluation: jest.fn(),
      getEvaluation: jest.fn()
    } as any;

    mockTablebaseManager = {
      getTablebaseInfo: jest.fn(),
      clearCache: jest.fn()
    } as any;

    mockUtilities = {
      getFen: jest.fn().mockReturnValue(defaultFen),
      getChessInstance: jest.fn().mockReturnValue(mockChess),
      getBestMoves: jest.fn(),
      getStats: jest.fn()
    } as any;

    // Mock constructors to return our mocked instances
    (MoveHandler as jest.Mock).mockImplementation(() => mockMoveHandler);
    (EvaluationManager as jest.Mock).mockImplementation(() => mockEvaluationManager);
    (TablebaseManager as jest.Mock).mockImplementation(() => mockTablebaseManager);
    (Utilities as jest.Mock).mockImplementation(() => mockUtilities);

    // Mock InstanceManager static methods
    (InstanceManager.validateFen as jest.Mock) = jest.fn();
    (InstanceManager.trackInstanceCount as jest.Mock) = jest.fn();
    (InstanceManager.createChessInstance as jest.Mock) = jest.fn().mockReturnValue(mockChess);
    (InstanceManager.validateEngineInitialization as jest.Mock) = jest.fn();
    (InstanceManager.updateChessPosition as jest.Mock) = jest.fn();
    (InstanceManager.resetChessPosition as jest.Mock) = jest.fn();
    (InstanceManager.decrementInstanceCount as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    // Clean up
    if (scenarioEngine) {
      scenarioEngine.quit();
    }
  });

  describe('constructor', () => {
    it('should initialize with default FEN when none provided', () => {
      scenarioEngine = new ScenarioEngine();

      expect(InstanceManager.validateFen).not.toHaveBeenCalled();
      expect(InstanceManager.trackInstanceCount).toHaveBeenCalled();
      expect(InstanceManager.createChessInstance).toHaveBeenCalledWith(defaultFen);
      expect(InstanceManager.validateEngineInitialization).toHaveBeenCalledWith(mockEngine);
    });

    it('should initialize with custom FEN when provided', () => {
      scenarioEngine = new ScenarioEngine(customFen);

      expect(InstanceManager.validateFen).toHaveBeenCalledWith(customFen);
      expect(InstanceManager.trackInstanceCount).toHaveBeenCalled();
      expect(InstanceManager.createChessInstance).toHaveBeenCalledWith(customFen);
    });

    it('should initialize all services and managers', () => {
      scenarioEngine = new ScenarioEngine();

      expect(EvaluationService).toHaveBeenCalledWith(mockEngine);
      expect(TablebaseService).toHaveBeenCalledWith();
      expect(MoveHandler).toHaveBeenCalledWith(mockChess, mockEngine);
      expect(EvaluationManager).toHaveBeenCalledWith(mockChess, mockEngine, mockEvaluationService);
      expect(TablebaseManager).toHaveBeenCalledWith(mockTablebaseService);
      expect(Utilities).toHaveBeenCalledWith(
        mockChess,
        mockTablebaseManager,
        mockEvaluationManager,
        mockMoveHandler,
        defaultFen
      );
    });
  });

  describe('Position Management', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    it('should get current FEN', () => {
      const result = scenarioEngine.getFen();

      expect(mockUtilities.getFen).toHaveBeenCalled();
      expect(result).toBe(defaultFen);
    });

    it('should update position', () => {
      scenarioEngine.updatePosition(customFen);

      expect(InstanceManager.updateChessPosition).toHaveBeenCalledWith(mockChess, customFen);
    });

    it('should reset to initial position', () => {
      scenarioEngine.reset();

      expect(InstanceManager.resetChessPosition).toHaveBeenCalledWith(mockChess, defaultFen);
    });

    it('should get chess instance', () => {
      const result = scenarioEngine.getChessInstance();

      expect(mockUtilities.getChessInstance).toHaveBeenCalled();
      expect(result).toBe(mockChess);
    });
  });

  describe('Move Operations', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    it('should make a move', async () => {
      const move = { from: 'e2', to: 'e4' };
      const expectedResult = { from: 'e2', to: 'e4', san: 'e4' };
      mockMoveHandler.makeMove.mockResolvedValue(expectedResult);

      const result = await scenarioEngine.makeMove(move);

      expect(mockMoveHandler.makeMove).toHaveBeenCalledWith(move);
      expect(result).toEqual(expectedResult);
    });

    it('should make a move with promotion', async () => {
      const move = { from: 'e7', to: 'e8', promotion: 'q' as const };
      const expectedResult = { from: 'e7', to: 'e8', san: 'e8=Q', promotion: 'q' };
      mockMoveHandler.makeMove.mockResolvedValue(expectedResult);

      const result = await scenarioEngine.makeMove(move);

      expect(mockMoveHandler.makeMove).toHaveBeenCalledWith(move);
      expect(result).toEqual(expectedResult);
    });

    it('should get best move', async () => {
      const fen = customFen;
      const expectedMove = { from: 'd2', to: 'd4' };
      mockMoveHandler.getBestMove.mockResolvedValue(expectedMove);

      const result = await scenarioEngine.getBestMove(fen);

      expect(mockMoveHandler.getBestMove).toHaveBeenCalledWith(fen);
      expect(result).toEqual(expectedMove);
    });

    it('should return null for invalid position', async () => {
      mockMoveHandler.getBestMove.mockResolvedValue(null);

      const result = await scenarioEngine.getBestMove('invalid-fen');

      expect(result).toBeNull();
    });
  });

  describe('Evaluation Methods', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    it('should check if move is critical mistake', async () => {
      const fenBefore = defaultFen;
      const fenAfter = customFen;
      mockEvaluationManager.isCriticalMistake.mockResolvedValue(true);

      const result = await scenarioEngine.isCriticalMistake(fenBefore, fenAfter);

      expect(mockEvaluationManager.isCriticalMistake).toHaveBeenCalledWith(fenBefore, fenAfter);
      expect(result).toBe(true);
    });

    it('should get dual evaluation', async () => {
      const dualEval: DualEvaluation = {
        engine: { score: 0.5, mate: null, evaluation: '+0.5' },
        tablebase: {
          isAvailable: true,
          result: { wdl: 0, category: 'draw', precise: true },
          evaluation: 'Draw'
        }
      };
      mockEvaluationManager.getDualEvaluation.mockResolvedValue(dualEval);

      const result = await scenarioEngine.getDualEvaluation(customFen);

      expect(mockEvaluationManager.getDualEvaluation).toHaveBeenCalledWith(customFen);
      expect(result).toEqual(dualEval);
    });

    it('should get simple evaluation with provided FEN', async () => {
      const engineEval: EngineEvaluation = { score: 1.2, mate: null };
      mockEvaluationManager.getEvaluation.mockResolvedValue(engineEval);

      const result = await scenarioEngine.getEvaluation(customFen);

      expect(mockEvaluationManager.getEvaluation).toHaveBeenCalledWith(customFen);
      expect(result).toEqual(engineEval);
    });

    it('should get simple evaluation without FEN (uses current position)', async () => {
      const engineEval: EngineEvaluation = { score: 0.0, mate: null };
      mockEvaluationManager.getEvaluation.mockResolvedValue(engineEval);

      const result = await scenarioEngine.getEvaluation();

      expect(mockEvaluationManager.getEvaluation).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(engineEval);
    });
  });

  describe('Tablebase Methods', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    it('should get tablebase info', async () => {
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
      mockTablebaseManager.getTablebaseInfo.mockResolvedValue(tablebaseInfo);

      const result = await scenarioEngine.getTablebaseInfo(customFen);

      expect(mockTablebaseManager.getTablebaseInfo).toHaveBeenCalledWith(customFen);
      expect(result).toEqual(tablebaseInfo);
    });

    it('should handle non-tablebase position', async () => {
      const tablebaseInfo: TablebaseInfo = {
        isTablebasePosition: false
      };
      mockTablebaseManager.getTablebaseInfo.mockResolvedValue(tablebaseInfo);

      const result = await scenarioEngine.getTablebaseInfo(defaultFen);

      expect(result).toEqual(tablebaseInfo);
    });
  });

  describe('Analysis Methods', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    it('should get best moves with default count', async () => {
      const bestMoves = {
        engine: [
          { move: 'e4', evaluation: 0.3, mate: null },
          { move: 'd4', evaluation: 0.2, mate: null },
          { move: 'Nf3', evaluation: 0.1, mate: null }
        ],
        tablebase: []
      };
      mockUtilities.getBestMoves.mockResolvedValue(bestMoves);

      const result = await scenarioEngine.getBestMoves(customFen);

      expect(mockUtilities.getBestMoves).toHaveBeenCalledWith(customFen, 3);
      expect(result).toEqual(bestMoves);
    });

    it('should get best moves with custom count', async () => {
      const bestMoves = {
        engine: [
          { move: 'e4', evaluation: 0.3, mate: null },
          { move: 'd4', evaluation: 0.2, mate: null },
          { move: 'Nf3', evaluation: 0.1, mate: null },
          { move: 'c4', evaluation: 0.1, mate: null },
          { move: 'g3', evaluation: 0.0, mate: null }
        ],
        tablebase: []
      };
      mockUtilities.getBestMoves.mockResolvedValue(bestMoves);

      const result = await scenarioEngine.getBestMoves(customFen, 5);

      expect(mockUtilities.getBestMoves).toHaveBeenCalledWith(customFen, 5);
      expect(result).toEqual(bestMoves);
    });
  });

  describe('Statistics & Debugging', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    it('should get stats', () => {
      const stats = {
        instanceCount: 1,
        currentFen: defaultFen,
        initialFen: defaultFen,
        cacheStats: { size: 10, maxSize: 100 }
      };
      mockUtilities.getStats.mockReturnValue(stats);

      const result = scenarioEngine.getStats();

      expect(mockUtilities.getStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    it('should properly clean up resources on quit', () => {
      scenarioEngine.quit();

      expect(InstanceManager.decrementInstanceCount).toHaveBeenCalled();
      expect(mockTablebaseManager.clearCache).toHaveBeenCalled();
      
      // Verify references are nullified (we can't directly check null assignment)
      // but we can verify the cleanup methods were called
    });

    it('should handle cleanup errors gracefully', () => {
      // Make clearCache throw an error
      mockTablebaseManager.clearCache.mockImplementation(() => {
        throw new Error('Cache clear failed');
      });

      // Should not throw
      expect(() => scenarioEngine.quit()).not.toThrow();
      
      // Should still try to decrement instance count
      expect(InstanceManager.decrementInstanceCount).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    it('should handle evaluation errors', async () => {
      const error = new Error('Engine evaluation failed');
      mockEvaluationManager.getEvaluation.mockRejectedValue(error);

      await expect(scenarioEngine.getEvaluation()).rejects.toThrow('Engine evaluation failed');
    });

    it('should handle move handler errors', async () => {
      const error = new Error('Invalid move');
      mockMoveHandler.makeMove.mockRejectedValue(error);

      await expect(scenarioEngine.makeMove({ from: 'e2', to: 'e5' })).rejects.toThrow('Invalid move');
    });

    it('should handle tablebase errors', async () => {
      const error = new Error('Tablebase lookup failed');
      mockTablebaseManager.getTablebaseInfo.mockRejectedValue(error);

      await expect(scenarioEngine.getTablebaseInfo(customFen)).rejects.toThrow('Tablebase lookup failed');
    });
  });
});