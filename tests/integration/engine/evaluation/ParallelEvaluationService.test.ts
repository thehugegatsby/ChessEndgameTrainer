/**
 * @fileoverview Tests for ParallelEvaluationService
 * @description Tests for parallel engine and tablebase evaluation service
 */

import { ParallelEvaluationService } from '@/shared/lib/chess/evaluation/ParallelEvaluationService';

// Mock dependencies
jest.mock('@/shared/lib/chess/evaluation/EvaluationDeduplicator');
jest.mock('@/shared/lib/chess/evaluation/ChessAwareCache');

const { EvaluationDeduplicator } = jest.requireMock('@/shared/lib/chess/evaluation/EvaluationDeduplicator');
const { ChessAwareCache } = jest.requireMock('@/shared/lib/chess/evaluation/ChessAwareCache');

describe('ParallelEvaluationService', () => {
  let service: ParallelEvaluationService;
  let mockEngineService: any;
  let mockTablebaseService: any;
  let mockDeduplicator: any;
  let mockCache: any;

  beforeEach(() => {
    // Mock engine service
    mockEngineService = {
      evaluatePosition: jest.fn(),
      cancelEvaluation: jest.fn()
    };

    // Mock tablebase service
    mockTablebaseService = {
      getTablebaseInfo: jest.fn()
    };

    // Mock deduplicator
    mockDeduplicator = {
      evaluate: jest.fn(),
      isPending: jest.fn(),
      getPendingCount: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        pendingEvaluations: 0,
        activeFENs: []
      })
    };

    // Mock cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        size: 0,
        maxSize: 200,
        endgamePositions: 0,
        criticalPositions: 0,
        avgPieceCount: 0
      })
    };

    // Set up mocks
    EvaluationDeduplicator.mockImplementation(() => mockDeduplicator);
    ChessAwareCache.mockImplementation(() => mockCache);

    service = new ParallelEvaluationService(mockEngineService, mockTablebaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Behavior', () => {
    test('should return cached result when available', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const cachedResult = {
        engine: { score: 0, mate: null },
        tablebase: { isTablebasePosition: false },
        source: 'engine',
        evaluationTime: 50,
        fromCache: false
      };

      mockCache.get.mockReturnValue(cachedResult);

      const result = await service.evaluatePosition(fen);

      expect(result).toEqual({
        ...cachedResult,
        fromCache: true,
        evaluationTime: expect.any(Number)
      });
      expect(mockCache.get).toHaveBeenCalledWith(fen);
      expect(mockDeduplicator.evaluate).not.toHaveBeenCalled();
    });

    test('should proceed with evaluation when not cached', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      mockCache.get.mockReturnValue(null);
      mockDeduplicator.evaluate.mockImplementation(async (_: string, evaluationFn: (fen: string) => Promise<any>) => {
        return evaluationFn(fen);
      });

      const engineResult = { score: 25, mate: null, depth: 15 };
      const tablebaseResult = { isTablebasePosition: false };

      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);
      mockTablebaseService.getTablebaseInfo.mockResolvedValue(tablebaseResult);

      const result = await service.evaluatePosition(fen);

      expect(result.engine).toEqual(engineResult);
      expect(result.source).toBe('engine');
      expect(result.fromCache).toBe(false);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe('Deduplication', () => {
    test('should use deduplicator to prevent duplicate evaluations', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      mockCache.get.mockReturnValue(null);
      mockDeduplicator.evaluate.mockImplementation(async (position: string, evaluationFn: (fen: string) => Promise<any>) => {
        expect(position).toBe(fen);
        expect(typeof evaluationFn).toBe('function');
        return { engine: { score: 0 }, source: 'engine', fromCache: false };
      });

      await service.evaluatePosition(fen);

      expect(mockDeduplicator.evaluate).toHaveBeenCalledWith(fen, expect.any(Function));
    });
  });

  describe('Parallel Evaluation Strategies', () => {
    beforeEach(() => {
      mockCache.get.mockReturnValue(null);
      mockDeduplicator.evaluate.mockImplementation(async (_: string, evaluationFn: (fen: string) => Promise<any>) => {
        return evaluationFn('test-fen');
      });
    });

    test('should prioritize quick tablebase results when preferTablebase=true', async () => {
      const quickTablebaseResult = {
        isTablebasePosition: true,
        wdl: 2,
        dtm: 10,
        category: 'win'
      };

      mockTablebaseService.getTablebaseInfo.mockResolvedValue(quickTablebaseResult);
      mockEngineService.evaluatePosition.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ score: 100 }), 100))
      );

      const options = { preferTablebase: true, tablebaseTimeout: 50 };
      const result = await service.evaluatePosition('test-fen', options);

      expect(result.source).toBe('tablebase');
      expect(result.tablebase).toEqual(quickTablebaseResult);
      expect(result.engine.score).toBe(1000); // Converted from tablebase win
      expect(result.engine.mate).toBe(5); // dtm/2 rounded up
      expect(mockEngineService.cancelEvaluation).toHaveBeenCalled();
    });

    test('should fall back to parallel evaluation when tablebase times out', async () => {
      mockTablebaseService.getTablebaseInfo.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ isTablebasePosition: false }), 100))
      );
      
      const engineResult = { score: 150, mate: null, depth: 12 };
      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);

      const options = { tablebaseTimeout: 20 };
      const result = await service.evaluatePosition('test-fen', options);

      expect(result.source).toBe('engine');
      expect(result.engine).toEqual(engineResult);
    });

    test('should create hybrid result when both engine and tablebase succeed', async () => {
      const engineResult = { score: 150, mate: null, depth: 12 };
      const tablebaseResult = { isTablebasePosition: true, wdl: 2, dtm: 8 };

      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);
      mockTablebaseService.getTablebaseInfo.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(tablebaseResult), 30))
      );

      const options = { tablebaseTimeout: 10 }; // Force timeout to race mode
      const result = await service.evaluatePosition('test-fen', options);

      expect(result.engine).toEqual(engineResult);
      expect(result.tablebase).toEqual(tablebaseResult);
      expect(result.source).toBe('hybrid');
    });

    test('should handle race between engine and tablebase', async () => {
      const engineResult = { score: 200, mate: null, depth: 15 };
      const tablebaseResult = { isTablebasePosition: false };

      // Engine wins the race
      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);
      mockTablebaseService.getTablebaseInfo.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(tablebaseResult), 50))
      );

      const options = { tablebaseTimeout: 10 };
      const result = await service.evaluatePosition('test-fen', options);

      expect(result.engine).toEqual(engineResult);
      expect(result.source).toBe('engine');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockCache.get.mockReturnValue(null);
      mockDeduplicator.evaluate.mockImplementation(async (_: string, evaluationFn: (fen: string) => Promise<any>) => {
        return evaluationFn('test-fen');
      });
    });

    test('should handle engine errors gracefully', async () => {
      mockEngineService.evaluatePosition.mockRejectedValue(new Error('Engine failed'));
      mockTablebaseService.getTablebaseInfo.mockResolvedValue({ isTablebasePosition: false });

      const result = await service.evaluatePosition('test-fen');

      expect(result.engine).toEqual({
        score: 0,
        mate: null,
        depth: 0,
        bestMove: undefined,
        pv: []
      });
      expect(result.source).toBe('engine');
    });

    test('should handle tablebase errors silently', async () => {
      const engineResult = { score: 100, mate: null, depth: 10 };
      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);
      mockTablebaseService.getTablebaseInfo.mockRejectedValue(new Error('Tablebase failed'));

      const result = await service.evaluatePosition('test-fen');

      expect(result.engine).toEqual(engineResult);
      expect(result.tablebase).toBeUndefined();
      expect(result.source).toBe('engine');
    });

    test('should handle engine and tablebase failures with fallback', async () => {
      mockEngineService.evaluatePosition.mockRejectedValue(new Error('Engine timeout'));
      mockTablebaseService.getTablebaseInfo.mockRejectedValue(new Error('Tablebase timeout'));

      const result = await service.evaluatePosition('test-fen');
      
      expect(result.engine).toEqual({
        score: 0,
        mate: null,
        depth: 0,
        bestMove: undefined,
        pv: []
      });
      expect(result.source).toBe('engine');
    });

    test('should provide fallback when both services fail', async () => {
      mockEngineService.evaluatePosition.mockRejectedValue(new Error('Engine failed'));
      mockTablebaseService.getTablebaseInfo.mockRejectedValue(new Error('Tablebase failed'));

      const result = await service.evaluatePosition('test-fen');

      expect(result.engine).toEqual({
        score: 0,
        mate: null,
        depth: 0,
        bestMove: undefined,
        pv: []
      });
      expect(result.source).toBe('engine');
    });
  });

  describe('Tablebase to Engine Conversion', () => {
    beforeEach(() => {
      mockCache.get.mockReturnValue(null);
      mockDeduplicator.evaluate.mockImplementation(async (_: string, evaluationFn: (fen: string) => Promise<any>) => {
        return evaluationFn('test-fen');
      });
    });

    test('should convert winning tablebase position correctly', async () => {
      const tablebaseResult = {
        isTablebasePosition: true,
        wdl: 2, // Win
        dtm: 14 // Distance to mate in plies
      };

      mockTablebaseService.getTablebaseInfo.mockResolvedValue(tablebaseResult);
      mockEngineService.evaluatePosition.mockImplementation(
        () => new Promise<any>(() => {}) // Will be cancelled
      );

      const options = { preferTablebase: true };
      const result = await service.evaluatePosition('test-fen', options);

      expect(result.engine.score).toBe(1000);
      expect(result.engine.mate).toBe(7); // 14/2 rounded up
      expect(result.engine.depth).toBe(32);
    });

    test('should convert losing tablebase position correctly', async () => {
      const tablebaseResult = {
        isTablebasePosition: true,
        wdl: -2, // Loss
        dtm: -20 // Distance to mate in plies (negative)
      };

      mockTablebaseService.getTablebaseInfo.mockResolvedValue(tablebaseResult);
      mockEngineService.evaluatePosition.mockImplementation(
        () => new Promise<any>(() => {}) // Will be cancelled
      );

      const options = { preferTablebase: true };
      const result = await service.evaluatePosition('test-fen', options);

      expect(result.engine.score).toBe(-1000);
      expect(result.engine.mate).toBe(-10); // Math.abs(20)/2 negated
      expect(result.engine.depth).toBe(32);
    });

    test('should convert draw tablebase position correctly', async () => {
      const tablebaseResult = {
        isTablebasePosition: true,
        wdl: 0 // Draw
      };

      mockTablebaseService.getTablebaseInfo.mockResolvedValue(tablebaseResult);
      mockEngineService.evaluatePosition.mockImplementation(
        () => new Promise<any>(() => {}) // Will be cancelled
      );

      const options = { preferTablebase: true };
      const result = await service.evaluatePosition('test-fen', options);

      expect(result.engine.score).toBe(0);
      expect(result.engine.mate).toBe(null);
      expect(result.engine.depth).toBe(32);
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should track evaluation statistics correctly', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('evaluations');
      expect(stats).toHaveProperty('sources');
      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('deduplication');

      expect(stats.evaluations).toHaveProperty('total');
      expect(stats.evaluations).toHaveProperty('averageTime');
      expect(stats.evaluations).toHaveProperty('cacheHitRate');

      expect(stats.sources).toHaveProperty('engine');
      expect(stats.sources).toHaveProperty('tablebase');
      expect(stats.sources).toHaveProperty('hybrid');
    });

    test('should calculate cache hit rate correctly', async () => {
      // Set up initial state
      mockCache.get.mockReturnValueOnce({ 
        engine: { score: 0 }, 
        source: 'engine', 
        fromCache: false 
      });

      await service.evaluatePosition('test-fen-1');
      
      // Mock internal stats to test calculation
      (service as any).stats = {
        totalEvaluations: 10,
        cacheHits: 3,
        engineWins: 5,
        tablebaseWins: 2,
        hybridResults: 3,
        averageTime: 150
      };

      const stats = service.getStats();
      expect(stats.evaluations.cacheHitRate).toBe(0.3); // 3/10
    });

    test('should handle zero evaluations in statistics', () => {
      const stats = service.getStats();
      expect(stats.evaluations.cacheHitRate).toBe(0);
      expect(stats.evaluations.total).toBe(0);
    });
  });

  describe('Reset Functionality', () => {
    test('should reset all caches and statistics', () => {
      service.reset();

      expect(mockCache.clear).toHaveBeenCalled();
      expect(mockDeduplicator.clear).toHaveBeenCalled();
      
      const stats = service.getStats();
      expect(stats.evaluations.total).toBe(0);
      expect(stats.sources.engine).toBe(0);
      expect(stats.sources.tablebase).toBe(0);
      expect(stats.sources.hybrid).toBe(0);
    });
  });

  describe('Options Handling', () => {
    beforeEach(() => {
      mockCache.get.mockReturnValue(null);
      mockDeduplicator.evaluate.mockImplementation(async (_: string, evaluationFn: (fen: string) => Promise<any>) => {
        return evaluationFn('test-fen');
      });
    });

    test('should use default options when none provided', async () => {
      const engineResult = { score: 100, mate: null };
      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);
      mockTablebaseService.getTablebaseInfo.mockResolvedValue({ isTablebasePosition: false });

      const result = await service.evaluatePosition('test-fen');
      
      expect(result).toBeDefined();
      expect(mockEngineService.evaluatePosition).toHaveBeenCalledWith('test-fen', {});
    });

    test('should pass options to engine service', async () => {
      const engineResult = { score: 100, mate: null };
      const options = { timeout: 3000, priority: 'high' as const };
      
      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);
      mockTablebaseService.getTablebaseInfo.mockResolvedValue({ isTablebasePosition: false });

      await service.evaluatePosition('test-fen', options);
      
      expect(mockEngineService.evaluatePosition).toHaveBeenCalledWith('test-fen', options);
    });

    test('should handle different timeout configurations', async () => {
      const engineResult = { score: 150, mate: null };
      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);
      mockTablebaseService.getTablebaseInfo.mockResolvedValue({ isTablebasePosition: false });

      const options = { timeout: 5000, tablebaseTimeout: 25 };
      const result = await service.evaluatePosition('test-fen', options);
      
      expect(result.engine).toEqual(engineResult);
      expect(result.source).toBe('engine');
    });
  });

  describe('Integration Edge Cases', () => {
    test('should handle null tablebase results correctly', async () => {
      mockCache.get.mockReturnValue(null);
      mockDeduplicator.evaluate.mockImplementation(async (_: string, evaluationFn: (fen: string) => Promise<any>) => {
        return evaluationFn('test-fen');
      });

      const engineResult = { score: 150, mate: null };
      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);
      mockTablebaseService.getTablebaseInfo.mockResolvedValue(null);

      const result = await service.evaluatePosition('test-fen');

      expect(result.engine).toEqual(engineResult);
      expect(result.tablebase).toBeUndefined();
      expect(result.source).toBe('engine');
    });

    test('should handle empty tablebase results', async () => {
      mockCache.get.mockReturnValue(null);
      mockDeduplicator.evaluate.mockImplementation(async (_: string, evaluationFn: (fen: string) => Promise<any>) => {
        return evaluationFn('test-fen');
      });

      const engineResult = { score: 150, mate: null };
      mockEngineService.evaluatePosition.mockResolvedValue(engineResult);
      mockTablebaseService.getTablebaseInfo.mockResolvedValue({ isTablebasePosition: false });

      const result = await service.evaluatePosition('test-fen');

      expect(result.engine).toEqual(engineResult);
      expect(result.tablebase).toEqual({ isTablebasePosition: false });
      expect(result.source).toBe('engine');
    });
  });
});