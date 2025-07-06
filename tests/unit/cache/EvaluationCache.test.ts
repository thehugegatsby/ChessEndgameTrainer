import { EvaluationCache } from '@/shared/lib/cache/EvaluationCache';
import { LRUCache } from '@/shared/lib/cache/LRUCache';

// Mock LRUCache
jest.mock('@/shared/lib/cache/LRUCache');

describe('EvaluationCache', () => {
  let mockLRUCache: jest.Mocked<LRUCache<any>>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup LRUCache mock
    mockLRUCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      size: jest.fn().mockReturnValue(0),
      keys: jest.fn().mockReturnValue([]),
      values: jest.fn().mockReturnValue([]),
      forEach: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        hits: 0,
        misses: 0,
        size: 0,
        maxSize: 100,
        hitRate: 0
      }),
      getMemoryUsage: jest.fn().mockReturnValue(0)
    } as any;
    
    (LRUCache as jest.MockedClass<typeof LRUCache>).mockImplementation(() => mockLRUCache);
  });

  describe('Constructor Pattern', () => {
    test('should create new instances', () => {
      const instance1 = new EvaluationCache();
      const instance2 = new EvaluationCache();
      
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Engine Evaluation Cache', () => {
    test('should have evaluation cache methods', () => {
      const cache = new EvaluationCache();
      
      expect(typeof cache.evaluatePositionCached).toBe('function');
      expect(typeof cache.getBestMoveCached).toBe('function');
      expect(typeof cache.getStats).toBe('function');
      expect(typeof cache.clear).toBe('function');
    });

    test('should have clear method that clears caches', () => {
      const cache = new EvaluationCache();
      
      cache.clear();
      
      expect(mockLRUCache.clear).toHaveBeenCalledTimes(2); // evaluation + bestMove caches
    });

    test('should provide cache statistics', () => {
      const cache = new EvaluationCache();
      
      // Mock LRU cache stats
      mockLRUCache.getStats = jest.fn().mockReturnValue({
        hits: 10,
        misses: 5,
        size: 15,
        maxSize: 100,
        hitRate: 0.67
      });
      mockLRUCache.getMemoryUsage = jest.fn().mockReturnValue(1024);
      
      const stats = cache.getStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
    });
  });

  describe('Tablebase Cache', () => {
    test('should cache tablebase data', () => {
      const cache = new EvaluationCache();
      const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
      const tablebaseData = { wdl: 2, dtm: 15 };
      
      cache.setTablebase(fen, tablebaseData);
      
      expect(mockLRUCache.set).toHaveBeenCalledWith(
        `tb:${fen}`,
        tablebaseData
      );
    });

    test('should get cached tablebase data', () => {
      const cache = new EvaluationCache();
      const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
      const tablebaseData = { wdl: 2, dtm: 15 };
      
      mockLRUCache.get.mockReturnValue(tablebaseData);
      
      const result = cache.getTablebase(fen);
      
      expect(mockLRUCache.get).toHaveBeenCalledWith(`tb:${fen}`);
      expect(result).toEqual(tablebaseData);
    });

    test('should check if tablebase data exists', () => {
      const cache = new EvaluationCache();
      const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
      
      mockLRUCache.has.mockReturnValue(true);
      
      const result = cache.hasTablebase(fen);
      
      expect(mockLRUCache.has).toHaveBeenCalledWith(`tb:${fen}`);
      expect(result).toBe(true);
    });

    test('should return null for missing tablebase data', () => {
      const cache = new EvaluationCache();
      const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
      
      mockLRUCache.get.mockReturnValue(undefined);
      
      const result = cache.getTablebase(fen);
      
      expect(result).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    test('should get cache statistics', () => {
      const cache = new EvaluationCache();
      
      const mockEngineEvals = ['engine:fen1', 'engine:fen2'];
      const mockTablebaseDatas = ['tb:fen1'];
      const allKeys = [...mockEngineEvals, ...mockTablebaseDatas];
      
      mockLRUCache.keys.mockReturnValue(allKeys);
      mockLRUCache.size.mockReturnValue(3);
      
      const stats = cache.getStats();
      
      expect(stats).toEqual(expect.objectContaining({
        deduplicationHits: 0,
        deduplicationMisses: 0,
        hitRate: 0,
        hits: 0,
        maxSize: 200,
        memoryUsageBytes: 0,
        misses: 0,
        size: 0,
        engineEvals: 0,
        tablebasePositions: 0
      }));
    });

    test('should track hit rate', () => {
      const cache = new EvaluationCache();
      
      // Mock getStats to return correct hit/miss counts
      mockLRUCache.getStats
        .mockReturnValueOnce({ hits: 1, misses: 1, size: 1, maxSize: 100, hitRate: 0.5 }) // First cache
        .mockReturnValueOnce({ hits: 1, misses: 1, size: 1, maxSize: 100, hitRate: 0.5 }); // Second cache
      
      mockLRUCache.getMemoryUsage.mockReturnValue(0);
      
      const stats = cache.getStats();
      
      expect(stats.hitRate).toBe(0.5); // 2 hits / 4 attempts
    });

    test('should handle zero attempts for hit rate', () => {
      const cache = new EvaluationCache();
      
      mockLRUCache.keys.mockReturnValue([]);
      mockLRUCache.size.mockReturnValue(0);
      
      const stats = cache.getStats();
      
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Clear Operations', () => {
    test('should clear all cache', () => {
      const cache = new EvaluationCache();
      
      cache.clear();
      
      expect(mockLRUCache.clear).toHaveBeenCalled();
    });

    test('should clear engine evaluations only', () => {
      const cache = new EvaluationCache();
      
      const allKeys = ['engine:fen1', 'engine:fen2', 'tb:fen3', 'tb:fen4'];
      mockLRUCache.keys.mockReturnValue(allKeys);
      
      cache.clearEngineEvals();
      
      expect(mockLRUCache.delete).toHaveBeenCalledWith('engine:fen1');
      expect(mockLRUCache.delete).toHaveBeenCalledWith('engine:fen2');
      expect(mockLRUCache.delete).not.toHaveBeenCalledWith('tb:fen3');
      expect(mockLRUCache.delete).not.toHaveBeenCalledWith('tb:fen4');
    });

    test('should clear tablebase data only', () => {
      const cache = new EvaluationCache();
      
      const allKeys = ['engine:fen1', 'engine:fen2', 'tb:fen3', 'tb:fen4'];
      mockLRUCache.keys.mockReturnValue(allKeys);
      
      cache.clearTablebase();
      
      expect(mockLRUCache.delete).not.toHaveBeenCalledWith('engine:fen1');
      expect(mockLRUCache.delete).not.toHaveBeenCalledWith('engine:fen2');
      expect(mockLRUCache.delete).toHaveBeenCalledWith('tb:fen3');
      expect(mockLRUCache.delete).toHaveBeenCalledWith('tb:fen4');
    });
  });

  describe('Memory Management', () => {
    test('should get memory usage estimate', () => {
      const cache = new EvaluationCache();
      
      mockLRUCache.getMemoryUsage.mockReturnValue(35000);
      
      const memory = cache.getMemoryUsage();
      
      // Memory usage is returned as a number
      expect(memory).toBe(70000); // 2 caches * 35000
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty FEN strings', () => {
      const cache = new EvaluationCache();
      
      cache.setEngineEval('', { score: 0, mate: null });
      
      expect(mockLRUCache.set).toHaveBeenCalledWith('engine:', expect.objectContaining({
        score: 0,
        mate: null,
        timestamp: expect.any(Number)
      }));
    });

    test('should handle special characters in FEN', () => {
      const cache = new EvaluationCache();
      const specialFen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      
      cache.setEngineEval(specialFen, { score: 0.3, mate: null });
      
      expect(mockLRUCache.set).toHaveBeenCalledWith(
        `engine:${specialFen}`,
        expect.objectContaining({
          score: 0.3,
          mate: null,
          timestamp: expect.any(Number)
        })
      );
    });

    test('should reset hit tracking on clear', () => {
      const cache = new EvaluationCache();
      
      // Generate some hits
      mockLRUCache.get.mockReturnValue({ score: 0.15 });
      cache.getEngineEval('fen1');
      
      // Clear cache
      cache.clear();
      
      // Stats should be reset
      mockLRUCache.keys.mockReturnValue([]);
      mockLRUCache.size.mockReturnValue(0);
      
      const stats = cache.getStats();
      
      // After clear, stats should be reset
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track cache performance', () => {
      const cache = new EvaluationCache();
      
      // Simulate various cache operations
      mockLRUCache.get
        .mockReturnValueOnce({ score: 0.15 })
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce({ score: 0.25 });
      
      cache.getEngineEval('fen1'); // Hit
      cache.getEngineEval('fen2'); // Miss
      cache.setEngineEval('fen2', { score: 0.20, mate: null });
      cache.getEngineEval('fen2'); // Hit
      
      mockLRUCache.keys.mockReturnValue(['engine:fen1', 'engine:fen2']);
      mockLRUCache.getStats.mockReturnValue({ hits: 2, misses: 1, size: 2, maxSize: 100, hitRate: 0.67 });
      
      const stats = cache.getStats();
      
      expect(stats.engineEvals).toBe(2);
      expect(stats.hitRate).toBeGreaterThan(0.6); // 2 hits out of 3 attempts
    });
  });
});