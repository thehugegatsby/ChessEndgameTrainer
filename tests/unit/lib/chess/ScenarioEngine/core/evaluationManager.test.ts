/**
 * @fileoverview Unit tests for EvaluationManager
 * Tests evaluation methods, dual evaluations, and critical mistake detection
 */

// Mock dependencies before imports
jest.mock('chess.js');
jest.mock('@shared/lib/chess/ScenarioEngine/evaluationService');

import { Chess } from 'chess.js';
import { EvaluationService } from '@shared/lib/chess/ScenarioEngine/evaluationService';
import { EvaluationManager } from '@shared/lib/chess/ScenarioEngine/core/evaluationManager';
import type { DualEvaluation, EngineEvaluation } from '@shared/lib/chess/ScenarioEngine/types';

describe('EvaluationManager', () => {
  let evaluationManager: EvaluationManager;
  let mockChess: jest.Mocked<Chess>;
  let mockEngine: any;
  let mockEvaluationService: jest.Mocked<EvaluationService>;

  const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const customFen = 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Chess instance
    mockChess = {
      fen: jest.fn().mockReturnValue(defaultFen),
      move: jest.fn(),
      load: jest.fn()
    } as any;

    // Mock engine with evaluation methods
    mockEngine = {
      evaluatePosition: jest.fn(),
      getMultiPV: jest.fn()
    };

    // Mock EvaluationService
    mockEvaluationService = {
      isCriticalMistake: jest.fn(),
      getDualEvaluation: jest.fn()
    } as any;

    // Create instance
    evaluationManager = new EvaluationManager(mockChess, mockEngine, mockEvaluationService);
  });

  describe('constructor', () => {
    it('should initialize with required dependencies', () => {
      expect(evaluationManager).toBeDefined();
      // We can't directly test private properties, but we can verify the instance is created
      expect(evaluationManager).toBeInstanceOf(EvaluationManager);
    });
  });

  describe('isCriticalMistake', () => {
    it('should delegate to evaluationService', async () => {
      const fenBefore = defaultFen;
      const fenAfter = customFen;
      mockEvaluationService.isCriticalMistake.mockResolvedValue(true);

      const result = await evaluationManager.isCriticalMistake(fenBefore, fenAfter);

      expect(mockEvaluationService.isCriticalMistake).toHaveBeenCalledWith(fenBefore, fenAfter);
      expect(result).toBe(true);
    });

    it('should return false when not a critical mistake', async () => {
      const fenBefore = defaultFen;
      const fenAfter = customFen;
      mockEvaluationService.isCriticalMistake.mockResolvedValue(false);

      const result = await evaluationManager.isCriticalMistake(fenBefore, fenAfter);

      expect(result).toBe(false);
    });

    it('should handle evaluation service errors', async () => {
      const error = new Error('Evaluation failed');
      mockEvaluationService.isCriticalMistake.mockRejectedValue(error);

      await expect(evaluationManager.isCriticalMistake(defaultFen, customFen))
        .rejects.toThrow('Evaluation failed');
    });
  });

  describe('getDualEvaluation', () => {
    it('should delegate to evaluationService', async () => {
      const dualEval: DualEvaluation = {
        engine: { score: 0.5, mate: null, evaluation: '+0.5' },
        tablebase: {
          isAvailable: true,
          result: { wdl: 0, category: 'draw', precise: true },
          evaluation: 'Draw'
        }
      };
      mockEvaluationService.getDualEvaluation.mockResolvedValue(dualEval);

      const result = await evaluationManager.getDualEvaluation(customFen);

      expect(mockEvaluationService.getDualEvaluation).toHaveBeenCalledWith(customFen);
      expect(result).toEqual(dualEval);
    });

    it('should handle tablebase not available', async () => {
      const dualEval: DualEvaluation = {
        engine: { score: 1.2, mate: null, evaluation: '+1.2' },
        tablebase: {
          isAvailable: false
        }
      };
      mockEvaluationService.getDualEvaluation.mockResolvedValue(dualEval);

      const result = await evaluationManager.getDualEvaluation(customFen);

      expect(result).toEqual(dualEval);
    });

    it('should handle dual evaluation errors', async () => {
      const error = new Error('Dual evaluation failed');
      mockEvaluationService.getDualEvaluation.mockRejectedValue(error);

      await expect(evaluationManager.getDualEvaluation(customFen))
        .rejects.toThrow('Dual evaluation failed');
    });
  });

  describe('getEvaluation', () => {
    it('should evaluate provided FEN', async () => {
      const engineEval: EngineEvaluation = { score: 0.3, mate: null };
      mockEngine.evaluatePosition.mockResolvedValue(engineEval);

      const result = await evaluationManager.getEvaluation(customFen);

      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith(customFen);
      expect(result).toEqual(engineEval);
    });

    it('should use current position when FEN not provided', async () => {
      const engineEval: EngineEvaluation = { score: 0.0, mate: null };
      mockEngine.evaluatePosition.mockResolvedValue(engineEval);

      const result = await evaluationManager.getEvaluation();

      expect(mockChess.fen).toHaveBeenCalled();
      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith(defaultFen);
      expect(result).toEqual(engineEval);
    });

    it('should handle mate evaluations', async () => {
      const engineEval: EngineEvaluation = { score: 0, mate: 3 };
      mockEngine.evaluatePosition.mockResolvedValue(engineEval);

      const result = await evaluationManager.getEvaluation(customFen);

      expect(result).toEqual(engineEval);
    });

    it('should return default values on engine error', async () => {
      const error = new Error('Engine crashed');
      mockEngine.evaluatePosition.mockRejectedValue(error);

      const result = await evaluationManager.getEvaluation(customFen);

      expect(result).toEqual({ score: 0, mate: null });
    });
  });

  describe('getEngineBestMoves', () => {
    it('should get best moves with default count', async () => {
      const engineMoves = [
        { move: 'e4', score: 0.3, mate: null },
        { move: 'd4', score: 0.2, mate: null },
        { move: 'Nf3', score: 0.1, mate: null }
      ];
      mockEngine.getMultiPV.mockResolvedValue(engineMoves);

      const result = await evaluationManager.getEngineBestMoves(customFen);

      expect(mockEngine.getMultiPV).toHaveBeenCalledWith(customFen, 3);
      expect(result).toEqual([
        { move: 'e4', evaluation: 0.3, mate: null },
        { move: 'd4', evaluation: 0.2, mate: null },
        { move: 'Nf3', evaluation: 0.1, mate: null }
      ]);
    });

    it('should get best moves with custom count', async () => {
      const engineMoves = [
        { move: 'e4', score: 0.3 },
        { move: 'd4', score: 0.2 },
        { move: 'Nf3', score: 0.1 },
        { move: 'c4', score: 0.1 },
        { move: 'g3', score: 0.0 }
      ];
      mockEngine.getMultiPV.mockResolvedValue(engineMoves);

      const result = await evaluationManager.getEngineBestMoves(customFen, 5);

      expect(mockEngine.getMultiPV).toHaveBeenCalledWith(customFen, 5);
      expect(result).toHaveLength(5);
    });

    it('should handle mate in best moves', async () => {
      const engineMoves = [
        { move: 'Qh5', score: 0, mate: 2 },
        { move: 'Qf3', score: 0, mate: 3 }
      ];
      mockEngine.getMultiPV.mockResolvedValue(engineMoves);

      const result = await evaluationManager.getEngineBestMoves(customFen, 2);

      expect(result).toEqual([
        { move: 'Qh5', evaluation: 0, mate: 2 },
        { move: 'Qf3', evaluation: 0, mate: 3 }
      ]);
    });

    it('should return empty array on engine error', async () => {
      const error = new Error('MultiPV analysis failed');
      mockEngine.getMultiPV.mockRejectedValue(error);

      const result = await evaluationManager.getEngineBestMoves(customFen);

      expect(result).toEqual([]);
    });

    it('should handle missing properties in engine response', async () => {
      const engineMoves = [
        { move: 'e4', score: 0.3 }, // no mate property
        { move: 'd4' }, // missing score
        {} // missing all properties
      ];
      mockEngine.getMultiPV.mockResolvedValue(engineMoves);

      const result = await evaluationManager.getEngineBestMoves(customFen);

      expect(result).toEqual([
        { move: 'e4', evaluation: 0.3, mate: undefined },
        { move: 'd4', evaluation: undefined, mate: undefined },
        { move: undefined, evaluation: undefined, mate: undefined }
      ]);
    });
  });
});