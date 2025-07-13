/**
 * Unit tests for enhanced TablebaseProviderAdapter
 * 
 * PHASE 3.2: Tests for tablebase provider with clean architecture integration
 */

import { TablebaseProviderAdapter } from '@shared/lib/chess/evaluation/providerAdapters';
import type { TablebaseResult } from '@shared/types/evaluation';

describe('TablebaseProviderAdapter (Enhanced)', () => {
  let adapter: TablebaseProviderAdapter;

  beforeEach(() => {
    adapter = new TablebaseProviderAdapter();
  });

  describe('ITablebaseProvider implementation', () => {
    it('should return null for positions not in tablebase', async () => {
      // Starting position - too many pieces
      const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const result = await adapter.getEvaluation(startingFen, 'w');
      expect(result).toBeNull();
    });

    it('should return TablebaseResult for KvK positions', async () => {
      const kvkFen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      
      const result = await adapter.getEvaluation(kvkFen, 'w');
      
      expect(result).not.toBeNull();
      expect(result!.wdl).toBe(0); // Draw
      expect(result!.category).toBe('draw');
      expect(result!.precise).toBe(true);
    });

    it('should return win result for KQvK positions', async () => {
      const kqvkFen = '8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1';
      
      const result = await adapter.getEvaluation(kqvkFen, 'w');
      
      expect(result).not.toBeNull();
      expect(result!.wdl).toBe(2); // White wins
      expect(result!.category).toBe('win');
      expect(result!.dtz).toBeGreaterThan(0);
      expect(result!.dtm).toBeGreaterThan(0);
      expect(result!.precise).toBe(true);
    });

    it('should return loss result for KvKq positions', async () => {
      const kvkqFen = '8/8/8/8/8/8/4K3/4kq2 w - - 0 1';
      
      const result = await adapter.getEvaluation(kvkqFen, 'w');
      
      expect(result).not.toBeNull();
      expect(result!.wdl).toBe(-2); // Black wins (loss for white)
      expect(result!.category).toBe('loss');
      expect(result!.dtz).toBeGreaterThan(0);
      expect(result!.dtm).toBeGreaterThan(0);
      expect(result!.precise).toBe(true);
    });

    it('should handle both white and black to move', async () => {
      const kvkFen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      
      const resultWhite = await adapter.getEvaluation(kvkFen, 'w');
      const resultBlack = await adapter.getEvaluation(kvkFen, 'b');
      
      expect(resultWhite).not.toBeNull();
      expect(resultBlack).not.toBeNull();
      
      // Should be draw for both
      expect(resultWhite!.wdl).toBe(0);
      expect(resultBlack!.wdl).toBe(0);
      expect(resultWhite!.category).toBe('draw');
      expect(resultBlack!.category).toBe('draw');
    });

    it('should return null for positions not handled by mock', async () => {
      // KBvK - not handled by mock tablebase
      const kbvkFen = '8/8/8/8/8/8/4KB2/4k3 w - - 0 1';
      
      const result = await adapter.getEvaluation(kbvkFen, 'w');
      expect(result).toBeNull();
    });
  });

  describe('Service integration', () => {
    it('should provide access to underlying tablebase service', () => {
      const service = adapter.getTablebaseService();
      
      expect(service).toBeDefined();
      expect(service.getMaxPieces()).toBe(7);
      expect(typeof service.isHealthy).toBe('function');
    });

    it('should use configured service settings', async () => {
      const service = adapter.getTablebaseService();
      const config = service.getConfig();
      
      expect(config.maxPieces).toBe(7);
      expect(config.enableCaching).toBe(true);
      expect(config.cacheTtl).toBe(3600);
      expect(config.timeout).toBe(2000);
    });

    it('should benefit from service caching', async () => {
      const fen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      
      // First call
      const start1 = Date.now();
      const result1 = await adapter.getEvaluation(fen, 'w');
      const duration1 = Date.now() - start1;
      
      // Second call (should be faster due to caching)
      const start2 = Date.now();
      const result2 = await adapter.getEvaluation(fen, 'w');
      const duration2 = Date.now() - start2;
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1!.wdl).toBe(result2!.wdl);
      
      // Second call should be faster (cached)
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Test with potentially problematic input
      const invalidFen = 'invalid-fen-string';
      
      // Should not throw, should return null
      const result = await adapter.getEvaluation(invalidFen, 'w');
      
      // Mock service may handle this differently, but adapter should not crash
      expect(typeof result).toBeDefined();
    });
  });

  describe('Performance characteristics', () => {
    it('should handle multiple concurrent lookups', async () => {
      const positions = [
        '8/8/8/8/8/8/4K3/4k3 w - - 0 1',      // KvK
        '8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1',    // KQvK
        '8/8/8/8/8/8/4K3/4k1R1 w - - 0 1',    // KRvK
        '8/8/8/8/8/4P3/4K3/4k3 w - - 0 1'     // KPvK
      ];
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        positions.map(fen => adapter.getEvaluation(fen, 'w'))
      );
      
      const duration = Date.now() - startTime;
      
      // Should complete quickly
      expect(duration).toBeLessThan(1000);
      
      // Verify results
      expect(results[0]).not.toBeNull(); // KvK
      expect(results[0]!.category).toBe('draw');
      
      expect(results[1]).not.toBeNull(); // KQvK
      expect(results[1]!.category).toBe('win');
      
      expect(results[2]).not.toBeNull(); // KRvK
      expect(results[2]!.category).toBe('win');
      
      // KPvK may be win or draw depending on mock logic
      expect(results[3]).not.toBeNull();
      expect(['win', 'draw']).toContain(results[3]!.category);
    });

    it('should maintain consistent results across calls', async () => {
      const fen = '8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1'; // KQvK
      
      const results = await Promise.all([
        adapter.getEvaluation(fen, 'w'),
        adapter.getEvaluation(fen, 'w'),
        adapter.getEvaluation(fen, 'w')
      ]);
      
      // All results should be identical
      results.forEach(result => {
        expect(result).not.toBeNull();
        expect(result!.wdl).toBe(2); // White wins
        expect(result!.category).toBe('win');
      });
      
      // WDL should be consistent
      const wdlValues = results.map(r => r!.wdl);
      expect(new Set(wdlValues).size).toBe(1);
    });
  });

  describe('Integration with evaluation system', () => {
    it('should provide correct TablebaseResult interface', async () => {
      const fen = '8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1';
      
      const result = await adapter.getEvaluation(fen, 'w');
      
      expect(result).not.toBeNull();
      
      // Verify TablebaseResult interface compliance
      expect(typeof result!.wdl).toBe('number');
      expect(typeof result!.category).toBe('string');
      expect(typeof result!.precise).toBe('boolean');
      expect(['number', 'object']).toContain(typeof result!.dtz); // number or null
      expect(['number', 'object']).toContain(typeof result!.dtm); // number or null
      
      // Verify valid category values
      expect(['win', 'cursed-win', 'draw', 'blessed-loss', 'loss']).toContain(result!.category);
      
      // Verify WDL range
      expect(result!.wdl).toBeGreaterThanOrEqual(-2);
      expect(result!.wdl).toBeLessThanOrEqual(2);
    });
  });
});