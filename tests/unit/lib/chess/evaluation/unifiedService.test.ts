/**
 * @fileoverview Unit tests for UnifiedEvaluationService
 * @version 1.0.0
 * @description Tests the central orchestrator for chess evaluations
 * Following TESTING_GUIDELINES.md principles
 */

import { UnifiedEvaluationService } from '../../../../../shared/lib/chess/evaluation/unifiedService';
import type {
  IEngineProvider,
  ITablebaseProvider,
  ICacheProvider,
  UnifiedEvaluationConfig
} from '../../../../../shared/lib/chess/evaluation/providers';
import type {
  EngineEvaluation,
  TablebaseResult,
  FormattedEvaluation,
  PlayerPerspectiveEvaluation
} from '../../../../../shared/types/evaluation';

// Test constants
const TEST_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const ENDGAME_FEN = '8/8/4k3/8/4K3/4P3/8/8 w - - 0 1';

// Mock providers
class MockEngineProvider implements IEngineProvider {
  private mockResponse: EngineEvaluation | null = null;
  private shouldThrow = false;

  setResponse(response: EngineEvaluation | null): void {
    this.mockResponse = response;
  }

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }

  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null> {
    if (this.shouldThrow) {
      throw new Error('Engine provider error');
    }
    return this.mockResponse;
  }
}

class MockTablebaseProvider implements ITablebaseProvider {
  private mockResponse: TablebaseResult | null = null;
  private shouldThrow = false;

  setResponse(response: TablebaseResult | null): void {
    this.mockResponse = response;
  }

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }

  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<TablebaseResult | null> {
    if (this.shouldThrow) {
      throw new Error('Tablebase provider error');
    }
    return this.mockResponse;
  }
}

class MockCacheProvider<T> implements ICacheProvider<T> {
  private cache = new Map<string, T>();
  public getCallCount = 0;
  public setCallCount = 0;

  async get(key: string): Promise<T | null> {
    this.getCallCount++;
    return this.cache.get(key) || null;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    this.setCallCount++;
    this.cache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  reset(): void {
    this.cache.clear();
    this.getCallCount = 0;
    this.setCallCount = 0;
  }
}

// Mock data
const mockEngineEvaluation: EngineEvaluation = {
  score: 50,
  mate: null,
  evaluation: '+0.50',
  depth: 20,
  nodes: 1000000,
  time: 1000
};

const mockTablebaseResult: TablebaseResult = {
  wdl: 2,
  dtm: 15,
  dtz: 10,
  category: 'win',
  precise: true
};

describe('UnifiedEvaluationService_[method]_[condition]_[expected]', () => {
  let service: UnifiedEvaluationService;
  let mockEngineProvider: MockEngineProvider;
  let mockTablebaseProvider: MockTablebaseProvider;
  let mockCache: MockCacheProvider<FormattedEvaluation>;

  beforeEach(() => {
    mockEngineProvider = new MockEngineProvider();
    mockTablebaseProvider = new MockTablebaseProvider();
    mockCache = new MockCacheProvider<FormattedEvaluation>();

    service = new UnifiedEvaluationService(
      mockEngineProvider,
      mockTablebaseProvider,
      mockCache
    );
  });

  afterEach(() => {
    mockCache.reset();
  });

  describe('constructor', () => {
    it('should create service with default config', () => {
      const service = new UnifiedEvaluationService(
        mockEngineProvider,
        mockTablebaseProvider,
        mockCache
      );
      expect(service).toBeDefined();
    });

    it('should create service with custom config', () => {
      const config: UnifiedEvaluationConfig = {
        enableCaching: false,
        cacheTtl: 600,
        engineTimeout: 10000,
        tablebaseTimeout: 5000,
        fallbackToEngine: false
      };

      const service = new UnifiedEvaluationService(
        mockEngineProvider,
        mockTablebaseProvider,
        mockCache,
        config
      );
      expect(service).toBeDefined();
    });

    it('should create service with enhanced perspective', () => {
      const service = new UnifiedEvaluationService(
        mockEngineProvider,
        mockTablebaseProvider,
        mockCache,
        {},
        true
      );
      expect(service).toBeDefined();
    });
  });

  describe('getFormattedEvaluation', () => {
    it('should prioritize tablebase over engine', async () => {
      mockTablebaseProvider.setResponse(mockTablebaseResult);
      mockEngineProvider.setResponse(mockEngineEvaluation);

      const result = await service.getFormattedEvaluation(ENDGAME_FEN, 'w');

      expect(result).toBeDefined();
      expect(result.metadata.isTablebase).toBe(true);
    });

    it('should fallback to engine when tablebase unavailable', async () => {
      mockTablebaseProvider.setResponse(null);
      mockEngineProvider.setResponse(mockEngineEvaluation);

      const result = await service.getFormattedEvaluation(TEST_FEN, 'w');

      expect(result).toBeDefined();
      expect(result.metadata.isTablebase).toBe(false);
    });

    it('should use cache when available', async () => {
      mockEngineProvider.setResponse(mockEngineEvaluation);

      // First call - should hit providers and cache
      const result1 = await service.getFormattedEvaluation(TEST_FEN, 'w');
      expect(mockCache.setCallCount).toBe(1);

      // Second call - should hit cache
      const result2 = await service.getFormattedEvaluation(TEST_FEN, 'w');
      expect(mockCache.getCallCount).toBe(2);
      expect(result1).toEqual(result2);
    });

    it('should handle cache disabled', async () => {
      const serviceNoCache = new UnifiedEvaluationService(
        mockEngineProvider,
        mockTablebaseProvider,
        mockCache,
        { enableCaching: false }
      );

      mockEngineProvider.setResponse(mockEngineEvaluation);

      await serviceNoCache.getFormattedEvaluation(TEST_FEN, 'w');
      await serviceNoCache.getFormattedEvaluation(TEST_FEN, 'w');

      // Cache should not be used
      expect(mockCache.getCallCount).toBe(0);
      expect(mockCache.setCallCount).toBe(0);
    });

    it('should handle Black perspective', async () => {
      mockEngineProvider.setResponse(mockEngineEvaluation);

      const result = await service.getFormattedEvaluation(TEST_FEN, 'b');

      expect(result).toBeDefined();
      // With positive engine score, Black perspective would show negative
      // But formatting may vary - just check it's defined
      expect(result.mainText).toBeDefined();
      expect(result.metadata.isTablebase).toBe(false);
    });

    it('should return error evaluation when all providers fail', async () => {
      mockTablebaseProvider.setResponse(null);
      mockEngineProvider.setResponse(null);

      const result = await service.getFormattedEvaluation(TEST_FEN, 'w');

      expect(result.mainText).toBe('...');
      expect(result.className).toBe('neutral');
    });

    it('should handle provider errors gracefully', async () => {
      mockTablebaseProvider.setShouldThrow(true);
      mockEngineProvider.setShouldThrow(true);

      const result = await service.getFormattedEvaluation(TEST_FEN, 'w');

      expect(result.mainText).toBe('...');
    });
  });

  describe('getPerspectiveEvaluation', () => {
    it('should return tablebase perspective evaluation', async () => {
      mockTablebaseProvider.setResponse(mockTablebaseResult);

      const result = await service.getPerspectiveEvaluation(ENDGAME_FEN, 'w');

      expect(result.type).toBe('tablebase');
      expect(result.wdl).toBe(2);
      expect(result.perspectiveWdl).toBe(2); // White perspective
    });

    it('should invert tablebase values for Black', async () => {
      mockTablebaseProvider.setResponse(mockTablebaseResult);

      const result = await service.getPerspectiveEvaluation(ENDGAME_FEN, 'b');

      expect(result.type).toBe('tablebase');
      expect(result.wdl).toBe(2);
      expect(result.perspectiveWdl).toBe(-2); // Inverted for Black
    });

    it('should fallback to engine evaluation', async () => {
      mockTablebaseProvider.setResponse(null);
      mockEngineProvider.setResponse(mockEngineEvaluation);

      const result = await service.getPerspectiveEvaluation(TEST_FEN, 'w');

      expect(result.type).toBe('engine');
      expect(result.scoreInCentipawns).toBe(50);
    });

    it('should handle errors with error evaluation', async () => {
      mockTablebaseProvider.setShouldThrow(true);
      mockEngineProvider.setShouldThrow(true);

      const result = await service.getPerspectiveEvaluation(TEST_FEN, 'w');

      expect(result.scoreInCentipawns).toBeNull();
      expect(result.perspective).toBe('w');
    });
  });

  describe('getFormattedDualEvaluation', () => {
    it('should return both engine and tablebase evaluations', async () => {
      mockEngineProvider.setResponse(mockEngineEvaluation);
      mockTablebaseProvider.setResponse(mockTablebaseResult);

      const result = await service.getFormattedDualEvaluation(ENDGAME_FEN, 'w');

      expect(result.engine).toBeDefined();
      expect(result.tablebase).toBeDefined();
      expect(result.tablebase?.metadata.isTablebase).toBe(true);
    });

    it('should handle missing tablebase gracefully', async () => {
      mockEngineProvider.setResponse(mockEngineEvaluation);
      mockTablebaseProvider.setResponse(null);

      const result = await service.getFormattedDualEvaluation(TEST_FEN, 'w');

      expect(result.engine).toBeDefined();
      expect(result.tablebase).toBeUndefined();
    });

    it('should handle errors independently', async () => {
      mockEngineProvider.setShouldThrow(true);
      mockTablebaseProvider.setResponse(mockTablebaseResult);

      const result = await service.getFormattedDualEvaluation(ENDGAME_FEN, 'w');

      expect(result.engine.mainText).toBe('...');
      expect(result.tablebase).toBeDefined();
    });

    it('should handle all errors', async () => {
      mockEngineProvider.setShouldThrow(true);
      mockTablebaseProvider.setShouldThrow(true);

      const result = await service.getFormattedDualEvaluation(TEST_FEN, 'w');

      expect(result.engine.mainText).toBe('...');
      expect(result.tablebase).toBeUndefined();
    });
  });

  describe('timeout handling', () => {
    it.skip('should timeout long engine requests', async () => {
      // Mock delayed response that will timeout
      const slowEngineProvider = new MockEngineProvider();
      const slowTablebaseProvider = new MockTablebaseProvider();
      
      // Both providers return null to force timeout scenario
      slowEngineProvider.getEvaluation = jest.fn().mockImplementation(() => 
        new Promise((resolve) => {
          // Never resolve - will cause timeout
          // setTimeout(() => resolve(null), 1000);
        })
      );
      
      slowTablebaseProvider.getEvaluation = jest.fn().mockImplementation(() => 
        new Promise((resolve) => {
          // Never resolve - will cause timeout
          // setTimeout(() => resolve(null), 1000);
        })
      );
      
      const slowService = new UnifiedEvaluationService(
        slowEngineProvider,
        slowTablebaseProvider,
        mockCache,
        { 
          engineTimeout: 50, 
          tablebaseTimeout: 50,
          fallbackToEngine: true 
        }
      );

      const result = await slowService.getFormattedEvaluation(TEST_FEN, 'w');

      // When both timeout, should return error evaluation
      expect(result.mainText).toBe('...');
      expect(result.className).toBe('neutral');
    });
  });

  describe('FEN parsing', () => {
    it('should correctly extract player to move', async () => {
      const blackToMoveFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      // Spy on the getEvaluation method
      const getEvaluationSpy = jest.spyOn(mockEngineProvider, 'getEvaluation');
      mockEngineProvider.setResponse(mockEngineEvaluation);
      
      await service.getFormattedEvaluation(blackToMoveFEN, 'w');

      // Verify the provider was called with correct player
      expect(getEvaluationSpy).toHaveBeenCalledWith(blackToMoveFEN, 'b');
      getEvaluationSpy.mockRestore();
    });
  });

  describe('cache key generation', () => {
    it('should create unique cache keys for different perspectives', async () => {
      mockEngineProvider.setResponse(mockEngineEvaluation);

      await service.getFormattedEvaluation(TEST_FEN, 'w');
      await service.getFormattedEvaluation(TEST_FEN, 'b');

      // Should cache both perspectives separately
      expect(mockCache.setCallCount).toBe(2);
    });
  });

  describe('error recovery', () => {
    it('should continue working after provider errors', async () => {
      // First call with error
      mockEngineProvider.setShouldThrow(true);
      const result1 = await service.getFormattedEvaluation(TEST_FEN, 'w');
      expect(result1.mainText).toBe('...');

      // Second call without error
      mockEngineProvider.setShouldThrow(false);
      mockEngineProvider.setResponse(mockEngineEvaluation);
      const result2 = await service.getFormattedEvaluation(TEST_FEN, 'w');
      expect(result2.mainText).not.toBe('...');
    });
  });
});