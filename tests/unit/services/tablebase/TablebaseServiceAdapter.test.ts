/**
 * Unit tests for TablebaseServiceAdapter
 * 
 * PHASE 3.1: Tests for adapter that bridges ITablebaseService with ITablebaseProvider
 */

import { TablebaseServiceAdapter } from '@shared/services/tablebase/TablebaseServiceAdapter';
import { MockTablebaseService } from '@shared/services/tablebase/MockTablebaseService';
import type { ITablebaseService } from '@shared/services/tablebase/ITablebaseService';

describe('TablebaseServiceAdapter', () => {
  let mockService: ITablebaseService;
  let adapter: TablebaseServiceAdapter;

  beforeEach(() => {
    mockService = new MockTablebaseService();
    adapter = new TablebaseServiceAdapter(mockService);
  });

  describe('ITablebaseProvider implementation', () => {
    it('should return null for positions not in tablebase range', async () => {
      // Starting position - too many pieces
      const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const result = await adapter.getEvaluation(startingFen, 'w');
      expect(result).toBeNull();
    });

    it('should return null for positions not found in tablebase', async () => {
      // Position in range but not handled by mock
      const kbvkFen = '8/8/8/8/8/8/4KB2/4k3 w - - 0 1';
      
      const result = await adapter.getEvaluation(kbvkFen, 'w');
      expect(result).toBeNull();
    });

    it('should return TablebaseResult for valid positions', async () => {
      // KvK position - should be draw
      const kvkFen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      
      const result = await adapter.getEvaluation(kvkFen, 'w');
      
      expect(result).not.toBeNull();
      expect(result!.wdl).toBe(0);
      expect(result!.category).toBe('draw');
      expect(result!.precise).toBe(true);
    });

    it('should return win result for winning positions', async () => {
      // KQvK position - white should win
      const kqvkFen = '8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1';
      
      const result = await adapter.getEvaluation(kqvkFen, 'w');
      
      expect(result).not.toBeNull();
      expect(result!.wdl).toBe(2); // White wins
      expect(result!.category).toBe('win');
      expect(result!.dtz).toBeGreaterThan(0);
      expect(result!.dtm).toBeGreaterThan(0);
    });

    it('should handle player parameter (interface requirement)', async () => {
      const kvkFen = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
      
      // Should work with both white and black to move
      const resultWhite = await adapter.getEvaluation(kvkFen, 'w');
      const resultBlack = await adapter.getEvaluation(kvkFen, 'b');
      
      expect(resultWhite).not.toBeNull();
      expect(resultBlack).not.toBeNull();
      
      // Results should be the same for this draw position
      expect(resultWhite!.wdl).toBe(resultBlack!.wdl);
      expect(resultWhite!.category).toBe(resultBlack!.category);
    });
  });

  describe('Error handling', () => {
    it('should return null and not throw when service throws error', async () => {
      // Create a mock service that throws
      const throwingService: ITablebaseService = {
        lookupPosition: jest.fn().mockRejectedValue(new Error('Service error')),
        isTablebasePosition: jest.fn().mockReturnValue(true),
        getMaxPieces: jest.fn().mockReturnValue(7),
        getConfig: jest.fn().mockReturnValue({}),
        isHealthy: jest.fn().mockResolvedValue(true),
        clearCache: jest.fn().mockResolvedValue(undefined),
        getTopMoves: jest.fn().mockResolvedValue([])
      };
      
      const throwingAdapter = new TablebaseServiceAdapter(throwingService);
      
      // Should not throw, should return null
      const result = await throwingAdapter.getEvaluation('8/8/8/8/8/8/4K3/4k3 w - - 0 1', 'w');
      expect(result).toBeNull();
    });

    it('should handle service returning null gracefully', async () => {
      // Create a mock service that returns null
      const nullService: ITablebaseService = {
        lookupPosition: jest.fn().mockResolvedValue(null),
        isTablebasePosition: jest.fn().mockReturnValue(true),
        getMaxPieces: jest.fn().mockReturnValue(7),
        getConfig: jest.fn().mockReturnValue({}),
        isHealthy: jest.fn().mockResolvedValue(true),
        clearCache: jest.fn().mockResolvedValue(undefined),
        getTopMoves: jest.fn().mockResolvedValue([])
      };
      
      const nullAdapter = new TablebaseServiceAdapter(nullService);
      
      const result = await nullAdapter.getEvaluation('8/8/8/8/8/8/4K3/4k3 w - - 0 1', 'w');
      expect(result).toBeNull();
    });
  });

  describe('Service access', () => {
    it('should provide access to underlying service', () => {
      const underlyingService = adapter.getTablebaseService();
      expect(underlyingService).toBe(mockService);
    });
  });

  describe('Integration with MockTablebaseService', () => {
    it('should correctly adapt MockTablebaseService results', async () => {
      // Test various positions to ensure adapter correctly extracts TablebaseResult
      
      // KQvK - should be win
      const kqvkResult = await adapter.getEvaluation('8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1', 'w');
      expect(kqvkResult).not.toBeNull();
      expect(kqvkResult!.category).toBe('win');
      expect(kqvkResult!.wdl).toBe(2);
      
      // KvKq - should be loss  
      const kvkqResult = await adapter.getEvaluation('8/8/8/8/8/8/4K3/4kq2 w - - 0 1', 'w');
      expect(kvkqResult).not.toBeNull();
      expect(kvkqResult!.category).toBe('loss');
      expect(kvkqResult!.wdl).toBe(-2);
      
      // KvK - should be draw
      const kvkResult = await adapter.getEvaluation('8/8/8/8/8/8/4K3/4k3 w - - 0 1', 'w');
      expect(kvkResult).not.toBeNull();
      expect(kvkResult!.category).toBe('draw');
      expect(kvkResult!.wdl).toBe(0);
    });

    it('should respect service tablebase position filtering', async () => {
      // Create service with limited piece count
      const limitedService = new MockTablebaseService({ maxPieces: 3 });
      const limitedAdapter = new TablebaseServiceAdapter(limitedService);
      
      // 4 piece position should return null
      const result = await limitedAdapter.getEvaluation('8/8/8/8/8/4P3/4K3/4k1Q1 w - - 0 1', 'w');
      expect(result).toBeNull();
    });
  });

  describe('Performance characteristics', () => {
    it('should maintain reasonable performance for multiple lookups', async () => {
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
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (well under 1 second for mock)
      expect(duration).toBeLessThan(1000);
      
      // All positions should return results
      results.forEach(result => {
        expect(result).not.toBeNull();
      });
    });
  });
});