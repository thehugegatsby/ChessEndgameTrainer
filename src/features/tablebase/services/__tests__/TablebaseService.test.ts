import { vi } from 'vitest';
/**
 * Tests for TablebaseService - Main Orchestration Service
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';
import { TablebaseService, tablebaseService } from '../TablebaseService';
import { tablebaseApiClient, ApiError } from '../TablebaseApiClient';
import { tablebaseTransformer } from '../TablebaseTransformer';
import type { TablebaseApiResponse, TablebaseEvaluation, TablebaseMove } from '../../types/interfaces';
import { TablebaseError } from '../../types/interfaces';

// Mock dependencies
vi.mock('../TablebaseApiClient', () => ({
  tablebaseApiClient: {
    query: vi.fn()
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public status?: number, public code?: string) {
      super(message);
      this.name = 'ApiError';
    }
  }
}));

vi.mock('../TablebaseTransformer', () => ({
  tablebaseTransformer: {
    validateFen: vi.fn(),
    normalizePositionEvaluation: vi.fn(),
    normalizeMoveEvaluation: vi.fn()
  }
}));

vi.mock('../../types/models', () => ({
  FenUtils: {
    isBlackToMove: vi.fn((fen: string) => {
      // Check the color field in FEN (second part)
      const parts = fen.split(' ');
      return parts[1] === 'b';
    })
  }
}));
vi.mock('../../../../shared/services/logging/Logger', () => ({
  getLogger: () => ({
    setContext: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn()
    })
  })
}));

describe('TablebaseService', () => {
  let service: TablebaseService;
  let mockApiClient: any;
  let mockTransformer: any;
  
  const mockApiResponse: TablebaseApiResponse = {
    category: 'win',
    wdl: 2,
    dtz: 12,
    dtm: 5,
    moves: [
      {
        uci: 'e2e4',
        san: 'e4',
        wdl: 1,
        dtz: 10,
        dtm: 4,
        category: 'win'
      },
      {
        uci: 'd2d4',
        san: 'd4',
        wdl: 0,
        dtz: 0,
        dtm: null,
        category: 'draw'
      },
      {
        uci: 'g1f3',
        san: 'Nf3',
        wdl: -1,
        dtz: -20,
        dtm: -8,
        category: 'loss'
      }
    ]
  };
  
  const mockEvaluation: TablebaseEvaluation = {
    outcome: 'win',
    dtm: 5,
    dtz: 12
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh service instance
    service = new TablebaseService();
    
    // Setup mock behaviors
    mockApiClient = tablebaseApiClient as any;
    mockTransformer = tablebaseTransformer as any;
    
    mockApiClient.query.mockResolvedValue(mockApiResponse);
    mockTransformer.validateFen.mockImplementation(() => {});
    mockTransformer.normalizePositionEvaluation.mockReturnValue(mockEvaluation);
    mockTransformer.normalizeMoveEvaluation.mockImplementation((wdl: number) => {
      if (wdl > 0) return 'win';
      if (wdl < 0) return 'loss';
      return 'draw';
    });
    
    // Clear caches
    service.clearCache();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('evaluate', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    it('should evaluate a position successfully', async () => {
      const result = await service.evaluate(testFen);
      
      expect(mockTransformer.validateFen).toHaveBeenCalledWith(testFen);
      expect(mockApiClient.query).toHaveBeenCalledWith(testFen);
      expect(mockTransformer.normalizePositionEvaluation).toHaveBeenCalledWith(
        mockApiResponse,
        testFen
      );
      expect(result).toEqual(mockEvaluation);
    });

    it('should cache evaluation results', async () => {
      // First call
      const result1 = await service.evaluate(testFen);
      expect(mockApiClient.query).toHaveBeenCalledTimes(1);
      
      // Second call - should hit cache
      const result2 = await service.evaluate(testFen);
      expect(mockApiClient.query).toHaveBeenCalledTimes(1); // Still 1
      
      expect(result1).toEqual(result2);
    });

    it('should normalize FEN for cache key', async () => {
      const fen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fen2 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 5 10';
      
      await service.evaluate(fen1);
      expect(mockApiClient.query).toHaveBeenCalledTimes(1);
      
      // Different move counters but same position - should hit cache
      await service.evaluate(fen2);
      expect(mockApiClient.query).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should handle position not in tablebase', async () => {
      const notFoundError = new ApiError('Not found', 404, 'NOT_FOUND');
      mockApiClient.query.mockRejectedValue(notFoundError);
      
      await expect(service.evaluate(testFen)).rejects.toThrow(TablebaseError);
      await expect(service.evaluate(testFen)).rejects.toThrow('Position not in tablebase');
    });

    it('should handle API timeout', async () => {
      const timeoutError = new ApiError('Timeout', undefined, 'TIMEOUT');
      mockApiClient.query.mockRejectedValue(timeoutError);
      
      await expect(service.evaluate(testFen)).rejects.toThrow(TablebaseError);
      await expect(service.evaluate(testFen)).rejects.toThrow('temporarily unavailable');
    });

    it('should handle validation errors', async () => {
      mockTransformer.validateFen.mockImplementation(() => {
        throw new Error('Invalid FEN: missing piece placement');
      });
      
      await expect(service.evaluate(testFen)).rejects.toThrow(TablebaseError);
      await expect(service.evaluate(testFen)).rejects.toThrow('Invalid FEN');
    });
  });

  describe('getBestMoves', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    it('should get best moves successfully', async () => {
      const result = await service.getBestMoves(testFen, 2);
      
      expect(mockTransformer.validateFen).toHaveBeenCalledWith(testFen);
      expect(mockApiClient.query).toHaveBeenCalledWith(testFen);
      expect(result).toHaveLength(2);
      
      // Should be sorted by quality (wins first)
      expect(result[0].outcome).toBe('win');
    });

    it('should cache moves results', async () => {
      // First call
      const result1 = await service.getBestMoves(testFen, 2);
      expect(mockApiClient.query).toHaveBeenCalledTimes(1);
      
      // Second call with same limit - should hit cache
      const result2 = await service.getBestMoves(testFen, 2);
      expect(mockApiClient.query).toHaveBeenCalledTimes(1); // Still 1
      
      expect(result1).toEqual(result2);
      
      // Third call with different limit - should make new request
      const result3 = await service.getBestMoves(testFen, 3);
      expect(mockApiClient.query).toHaveBeenCalledTimes(2);
      expect(result3).toHaveLength(3);
    });

    it('should sort moves by quality', async () => {
      const moves = await service.getBestMoves(testFen, 3);
      
      // Check ordering: win > draw > loss
      expect(moves[0].outcome).toBe('win');
      expect(moves[1].outcome).toBe('draw');
      expect(moves[2].outcome).toBe('loss');
    });

    it('should sort wins by DTM (faster mate first)', async () => {
      // Create new object to avoid polluting other tests
      mockApiClient.query.mockResolvedValue({
        ...mockApiResponse,
        moves: [
          { uci: 'e2e4', san: 'e4', wdl: 2, dtm: 10, dtz: 20, category: 'win' },
          { uci: 'd2d4', san: 'd4', wdl: 2, dtm: 5, dtz: 10, category: 'win' },
          { uci: 'g1f3', san: 'Nf3', wdl: 2, dtm: 15, dtz: 30, category: 'win' }
        ]
      });
      
      const moves = await service.getBestMoves(testFen);
      
      // Should be sorted by DTM ascending (faster mate first)
      expect(moves[0].dtm).toBe(5);
      expect(moves[1].dtm).toBe(10);
      expect(moves[2].dtm).toBe(15);
    });

    it('should sort losses by DTM (slower mate first)', async () => {
      // Create new object to avoid polluting other tests
      mockApiClient.query.mockResolvedValue({
        ...mockApiResponse,
        moves: [
          { uci: 'e2e4', san: 'e4', wdl: -2, dtm: -10, dtz: -20, category: 'loss' },
          { uci: 'd2d4', san: 'd4', wdl: -2, dtm: -5, dtz: -10, category: 'loss' },
          { uci: 'g1f3', san: 'Nf3', wdl: -2, dtm: -15, dtz: -30, category: 'loss' }
        ]
      });
      
      const moves = await service.getBestMoves(testFen);
      
      // Should be sorted by DTM descending (slower mate first - better defense)
      expect(moves[0].dtm).toBe(-15);
      expect(moves[1].dtm).toBe(-10);
      expect(moves[2].dtm).toBe(-5);
    });

    it('should limit number of returned moves', async () => {
      const moves = await service.getBestMoves(testFen, 1);
      expect(moves).toHaveLength(1);
      // After sorting, the first move should be the best one
      // The mock data has moves with wdl: 1, 0, -1
      // So the best move should have outcome: 'win'
      expect(moves[0].outcome).toBe('win');
      expect(moves[0].uci).toBe('e2e4'); // The winning move
    });

    it('should handle empty move list', async () => {
      // Create new object to avoid polluting other tests
      mockApiClient.query.mockResolvedValue({
        ...mockApiResponse,
        moves: []
      });
      
      const moves = await service.getBestMoves(testFen);
      expect(moves).toEqual([]);
    });
  });

  describe('Cache Management', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    it('should clear caches', async () => {
      // Populate caches
      await service.evaluate(testFen);
      await service.getBestMoves(testFen);
      
      let stats = service.getCacheStats();
      expect(stats.evaluationCacheSize).toBe(1);
      expect(stats.movesCacheSize).toBe(1);
      
      // Clear caches
      service.clearCache();
      
      stats = service.getCacheStats();
      expect(stats.evaluationCacheSize).toBe(0);
      expect(stats.movesCacheSize).toBe(0);
      
      // Should make new API calls after clearing
      await service.evaluate(testFen);
      expect(mockApiClient.query).toHaveBeenCalledTimes(3); // 2 from before + 1 new
    });

    it('should return cache statistics', async () => {
      const stats1 = service.getCacheStats();
      expect(stats1.evaluationCacheSize).toBe(0);
      expect(stats1.movesCacheSize).toBe(0);
      
      await service.evaluate(testFen);
      await service.getBestMoves(testFen, 2);
      await service.getBestMoves(testFen, 3);
      
      const stats2 = service.getCacheStats();
      expect(stats2.evaluationCacheSize).toBe(1);
      expect(stats2.movesCacheSize).toBe(2); // Two different limits
    });
  });

  describe('Prefetching', () => {
    it('should prefetch multiple positions', async () => {
      const fens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkb1r/pppppppp/5n2/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1 1',
        'rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq e6 0 2'
      ];
      
      await service.prefetch(fens);
      
      expect(mockApiClient.query).toHaveBeenCalledTimes(3);
      
      // Positions should now be cached
      const stats = service.getCacheStats();
      expect(stats.evaluationCacheSize).toBe(3);
    });

    it('should handle partial failures in prefetch', async () => {
      const fens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'invalid-fen',
        'rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq e6 0 2'
      ];
      
      // Make second FEN fail
      mockApiClient.query.mockImplementation((fen: string) => {
        if (fen === 'invalid-fen') {
          return Promise.reject(new Error('Invalid FEN'));
        }
        return Promise.resolve(mockApiResponse);
      });
      
      // Should not throw even if some fail
      await expect(service.prefetch(fens)).resolves.not.toThrow();
      
      // Should have cached the successful ones
      const stats = service.getCacheStats();
      expect(stats.evaluationCacheSize).toBe(2);
    });
  });

  describe('Error Handling', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    it('should preserve TablebaseError instances', async () => {
      const tablebaseError = new TablebaseError('Custom error', 'CUSTOM');
      mockApiClient.query.mockRejectedValue(tablebaseError);
      
      await expect(service.evaluate(testFen)).rejects.toThrow(tablebaseError);
    });

    it('should convert generic errors to TablebaseError', async () => {
      mockApiClient.query.mockRejectedValue(new Error('Generic error'));
      
      const error = await service.evaluate(testFen).catch(e => e);
      expect(error).toBeInstanceOf(TablebaseError);
      expect(error.code).toBe('API_ERROR');
      expect(error.message).toBe('Generic error');
    });

    it('should handle unknown error types', async () => {
      mockApiClient.query.mockRejectedValue('String error');
      
      const error = await service.evaluate(testFen).catch(e => e);
      expect(error).toBeInstanceOf(TablebaseError);
      expect(error.message).toBe('An unknown error occurred');
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(tablebaseService).toBeDefined();
      expect(tablebaseService).toBeInstanceOf(TablebaseService);
    });
  });
});