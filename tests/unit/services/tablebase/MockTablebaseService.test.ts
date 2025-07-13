/**
 * Unit tests for MockTablebaseService
 * 
 * PHASE 3.1: Comprehensive tests for mock tablebase service implementation
 */

import { MockTablebaseService } from '@shared/services/tablebase/MockTablebaseService';
import type { TablebaseServiceConfig } from '@shared/services/tablebase/ITablebaseService';

describe('MockTablebaseService', () => {
  let service: MockTablebaseService;

  beforeEach(() => {
    service = new MockTablebaseService();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = service.getConfig();
      
      expect(config.baseUrl).toBe('mock://tablebase');
      expect(config.timeout).toBe(1000);
      expect(config.maxPieces).toBe(7);
      expect(config.enableCaching).toBe(true);
      expect(config.cacheTtl).toBe(3600);
      expect(config.userAgent).toBe('EndgameTrainer/Mock');
    });

    it('should accept custom configuration', () => {
      const customConfig: TablebaseServiceConfig = {
        maxPieces: 5,
        timeout: 2000,
        enableCaching: false
      };
      
      const customService = new MockTablebaseService(customConfig);
      const config = customService.getConfig();
      
      expect(config.maxPieces).toBe(5);
      expect(config.timeout).toBe(2000);
      expect(config.enableCaching).toBe(false);
      // Defaults should still apply
      expect(config.baseUrl).toBe('mock://tablebase');
    });
  });

  describe('Position validation', () => {
    it('should identify valid tablebase positions', () => {
      // KQvK - 3 pieces
      expect(service.isTablebasePosition('8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1')).toBe(true);
      
      // KRvK - 3 pieces  
      expect(service.isTablebasePosition('8/8/8/8/8/8/4K3/4k1R1 w - - 0 1')).toBe(true);
      
      // KPvK - 3 pieces
      expect(service.isTablebasePosition('8/8/8/8/8/4P3/4K3/4k3 w - - 0 1')).toBe(true);
    });

    it('should reject positions with too few pieces', () => {
      // Only 1 piece (invalid FEN but tests edge case)
      expect(service.isTablebasePosition('8/8/8/8/8/8/8/4K3 w - - 0 1')).toBe(false);
    });

    it('should reject positions with too many pieces', () => {
      // Starting position - 32 pieces
      const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      expect(service.isTablebasePosition(startingFen)).toBe(false);
    });

    it('should respect custom max pieces setting', () => {
      const limitedService = new MockTablebaseService({ maxPieces: 3 });
      
      // 3 pieces - should be valid
      expect(limitedService.isTablebasePosition('8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1')).toBe(true);
      
      // 4 pieces - should be invalid with maxPieces=3
      expect(limitedService.isTablebasePosition('8/8/8/8/8/4P3/4K3/4k1Q1 w - - 0 1')).toBe(false);
    });
  });

  describe('Position lookup', () => {
    it('should return null for positions not in tablebase range', async () => {
      const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const result = await service.lookupPosition(startingFen);
      
      expect(result).toBeNull();
    });

    it('should handle KvK (draw)', async () => {
      const kvkFen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      const result = await service.lookupPosition(kvkFen);
      
      expect(result).not.toBeNull();
      expect(result!.result.wdl).toBe(0);
      expect(result!.result.category).toBe('draw');
      expect(result!.pieceCount).toBe(2);
      expect(result!.source).toBe('mock');
    });

    it('should handle KQvK (white wins)', async () => {
      const kqvkFen = '8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1';
      const result = await service.lookupPosition(kqvkFen);
      
      expect(result).not.toBeNull();
      expect(result!.result.wdl).toBe(2); // White wins
      expect(result!.result.category).toBe('win');
      expect(result!.result.dtz).toBeGreaterThan(0);
      expect(result!.result.dtm).toBeGreaterThan(0);
      expect(result!.pieceCount).toBe(3);
    });

    it('should handle KvKq (black wins)', async () => {
      const kvkqFen = '8/8/8/8/8/8/4K3/4kq2 w - - 0 1';
      const result = await service.lookupPosition(kvkqFen);
      
      expect(result).not.toBeNull();
      expect(result!.result.wdl).toBe(-2); // Black wins
      expect(result!.result.category).toBe('loss');
      expect(result!.result.dtz).toBeGreaterThan(0);
      expect(result!.result.dtm).toBeGreaterThan(0);
    });

    it('should handle KRvK (white wins)', async () => {
      const krvkFen = '8/8/8/8/8/8/4K3/4k1R1 w - - 0 1';
      const result = await service.lookupPosition(krvkFen);
      
      expect(result).not.toBeNull();
      expect(result!.result.wdl).toBe(2); // White wins
      expect(result!.result.category).toBe('win');
      expect(result!.result.dtz).toBeGreaterThan(0);
    });

    it('should include lookup metadata', async () => {
      const kvkFen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      const result = await service.lookupPosition(kvkFen);
      
      expect(result).not.toBeNull();
      expect(result!.source).toBe('mock');
      expect(result!.lookupTime).toBeGreaterThan(0);
      expect(result!.fromCache).toBe(false);
      expect(typeof result!.pieceCount).toBe('number');
    });
  });

  describe('Caching', () => {
    it('should cache results when caching is enabled', async () => {
      const fen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      
      // First lookup
      const result1 = await service.lookupPosition(fen);
      expect(result1!.fromCache).toBe(false);
      
      // Second lookup should be from cache
      const result2 = await service.lookupPosition(fen);
      expect(result2!.fromCache).toBe(true);
      
      // Results should be identical except for fromCache flag
      expect(result2!.result).toEqual(result1!.result);
    });

    it('should not cache when caching is disabled', async () => {
      const noCacheService = new MockTablebaseService({ enableCaching: false });
      const fen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      
      // First lookup
      const result1 = await noCacheService.lookupPosition(fen);
      expect(result1!.fromCache).toBe(false);
      
      // Second lookup should also not be from cache
      const result2 = await noCacheService.lookupPosition(fen);
      expect(result2!.fromCache).toBe(false);
    });

    it('should clear cache', async () => {
      const fen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      
      // First lookup to populate cache
      await service.lookupPosition(fen);
      
      // Clear cache
      await service.clearCache();
      
      // Next lookup should not be from cache
      const result = await service.lookupPosition(fen);
      expect(result!.fromCache).toBe(false);
    });
  });

  describe('Health check', () => {
    it('should report as healthy', async () => {
      const healthy = await service.isHealthy();
      expect(healthy).toBe(true);
    });
  });

  describe('Utility methods', () => {
    it('should return correct max pieces', () => {
      expect(service.getMaxPieces()).toBe(7);
      
      const customService = new MockTablebaseService({ maxPieces: 5 });
      expect(customService.getMaxPieces()).toBe(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid FEN gracefully', async () => {
      const invalidFen = 'invalid-fen';
      
      // Should not throw, but may return null
      const result = await service.lookupPosition(invalidFen);
      // We don't enforce specific behavior for invalid FEN in mock
      // Just ensure it doesn't crash
      expect(typeof result).toBeDefined();
    });

    it('should handle positions not recognized by mock', async () => {
      // KBvK - not specifically handled by mock  
      const kbvkFen = '8/8/8/8/8/8/4KB2/4k3 w - - 0 1';
      const result = await service.lookupPosition(kbvkFen);
      
      // Mock doesn't handle this, should return null
      expect(result).toBeNull();
    });
  });
});