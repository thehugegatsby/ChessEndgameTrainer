/**
 * @fileoverview EvaluationCache Unit Tests
 * @description Tests for evaluation caching with SimpleEngine
 */

import { EvaluationCache } from '../../../shared/lib/cache/EvaluationCache';
import type { EvaluationResult } from '../../../shared/lib/chess/engine/simple/SimpleEngine';
// ChessJsMove import removed - not used

// Mock the SimpleEngine module
jest.mock('../../../shared/lib/chess/engine/simple/SimpleEngine', () => ({
  getSimpleEngine: jest.fn(() => mockEngine)
}));

// Mock SimpleEngine instance
const mockEngine = {
  evaluatePosition: jest.fn(),
  findBestMove: jest.fn(),
  waitForInit: jest.fn(),
  terminate: jest.fn()
};

describe('EvaluationCache', () => {
  let cache: EvaluationCache;
  
  beforeEach(() => {
    cache = new EvaluationCache(100, 50); // Small sizes for testing
    jest.clearAllMocks();
    mockEngine.waitForInit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cache.clear();
  });

  describe('constructor', () => {
    it('should create cache with default sizes', () => {
      const defaultCache = new EvaluationCache();
      const stats = defaultCache.getStats();
      
      expect(stats.maxSize).toBe(700); // 200 + 500
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should create cache with custom sizes', () => {
      const customCache = new EvaluationCache(200, 100);
      const stats = customCache.getStats();
      
      expect(stats.maxSize).toBe(300); // 200 + 100
      expect(stats.size).toBe(0);
    });
  });

  describe('evaluatePositionCached', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const testResult: EvaluationResult = {
      score: { type: 'cp', value: 30 },
      depth: 15,
      pv: 'e2e4',
      nodes: 1000,
      time: 100
    };

    it('should call engine on cache miss', async () => {
      mockEngine.evaluatePosition.mockResolvedValue(testResult);
      
      const result = await cache.evaluatePositionCached(testFen);
      
      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith(testFen);
      expect(result).toEqual(testResult);
    });

    it('should return cached result on cache hit', async () => {
      mockEngine.evaluatePosition.mockResolvedValue(testResult);
      
      // First call - cache miss
      await cache.evaluatePositionCached(testFen);
      
      // Second call - cache hit
      const result = await cache.evaluatePositionCached(testFen);
      
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(1);
      expect(result).toEqual(testResult);
    });

    it('should handle engine errors', async () => {
      const error = new Error('Engine error');
      mockEngine.evaluatePosition.mockRejectedValue(error);
      
      await expect(cache.evaluatePositionCached(testFen)).rejects.toThrow('Engine error');
    });
  });

  describe('getBestMoveCached', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const testMove = 'e2e4';

    it('should call engine on cache miss', async () => {
      mockEngine.findBestMove.mockResolvedValue(testMove);
      
      const result = await cache.getBestMoveCached(testFen);
      
      expect(mockEngine.findBestMove).toHaveBeenCalledWith(testFen, 1000);
      expect(result).toBe(testMove);
    });

    it('should return cached result on cache hit', async () => {
      mockEngine.findBestMove.mockResolvedValue(testMove);
      
      // First call - cache miss
      await cache.getBestMoveCached(testFen);
      
      // Second call - cache hit
      const result = await cache.getBestMoveCached(testFen);
      
      expect(mockEngine.findBestMove).toHaveBeenCalledTimes(1);
      expect(result).toBe(testMove);
    });

    it('should handle different time limits', async () => {
      mockEngine.findBestMove.mockResolvedValue(testMove);
      
      await cache.getBestMoveCached(testFen, 1000);
      await cache.getBestMoveCached(testFen, 2000);
      
      expect(mockEngine.findBestMove).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache management', () => {
    it('should provide stats', () => {
      const stats = cache.getStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
    });

    it('should clear cache', async () => {
      const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const testResult: EvaluationResult = {
        score: { type: 'cp', value: 30 },
        depth: 15
      };
      
      mockEngine.evaluatePosition.mockResolvedValue(testResult);
      
      // Cache something
      await cache.evaluatePositionCached(testFen);
      
      // Clear cache
      cache.clear();
      
      // Should call engine again
      await cache.evaluatePositionCached(testFen);
      
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(2);
    });
  });
});