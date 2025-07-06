/**
 * @fileoverview Tests for ChessAwareCache
 * @description Comprehensive tests for chess-aware caching system
 */

import { ChessAwareCache } from '@/shared/lib/chess/evaluation/ChessAwareCache';

describe('ChessAwareCache', () => {
  let cache: ChessAwareCache<any>;

  beforeEach(() => {
    cache = new ChessAwareCache(5); // Small cache for testing eviction
  });

  describe('Basic Operations', () => {
    test('should store and retrieve values', () => {
      const testValue = { score: 100 };
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      cache.set(fen, testValue);
      expect(cache.get(fen)).toEqual(testValue);
    });

    test('should return null for non-existent keys', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      expect(cache.get(fen)).toBeNull();
    });

    test('should check if key exists', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      expect(cache.has(fen)).toBe(false);
      
      cache.set(fen, { score: 0 });
      expect(cache.has(fen)).toBe(true);
    });

    test('should clear all entries', () => {
      const fen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fen2 = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      
      cache.set(fen1, { score: 0 });
      cache.set(fen2, { score: 100 });
      
      expect(cache.has(fen1)).toBe(true);
      expect(cache.has(fen2)).toBe(true);
      
      cache.clear();
      
      expect(cache.has(fen1)).toBe(false);
      expect(cache.has(fen2)).toBe(false);
    });
  });

  describe('Piece Counting', () => {
    test('should count pieces correctly in starting position', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      cache.set(fen, { score: 0 });
      
      const stats = cache.getStats();
      expect(stats.avgPieceCount).toBe(32);
    });

    test('should count pieces correctly in endgame position', () => {
      const fen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'; // 3 pieces
      cache.set(fen, { score: 0 });
      
      const stats = cache.getStats();
      expect(stats.avgPieceCount).toBe(3);
      expect(stats.endgamePositions).toBe(1);
    });

    test('should handle positions with promoted pieces', () => {
      const fen = '4k3/8/4K3/4Q3/8/8/8/8 w - - 0 1'; // K, k, Q = 3 pieces
      cache.set(fen, { score: 500 });
      
      const stats = cache.getStats();
      expect(stats.avgPieceCount).toBe(3);
    });
  });

  describe('Critical Position Detection', () => {
    test('should identify high evaluation as critical', () => {
      const criticalEvaluation = { score: 600 }; // Above threshold
      const normalEvaluation = { score: 100 };   // Below threshold
      
      const fen1 = '4k3/8/4K3/4Q3/8/8/8/8 w - - 0 1';
      const fen2 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      cache.set(fen1, criticalEvaluation);
      cache.set(fen2, normalEvaluation);
      
      const stats = cache.getStats();
      expect(stats.criticalPositions).toBe(1);
    });

    test('should identify mate positions as critical', () => {
      const mateEvaluation = { score: 50, mate: 3 };
      const fen = '4k3/8/4K3/4Q3/8/8/8/8 w - - 0 1';
      
      cache.set(fen, mateEvaluation);
      
      const stats = cache.getStats();
      expect(stats.criticalPositions).toBe(1);
    });

    test('should identify tablebase positions as critical', () => {
      const tablebaseEvaluation = { 
        score: 0, 
        isTablebasePosition: true,
        wdl: 2
      };
      const fen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      
      cache.set(fen, tablebaseEvaluation);
      
      const stats = cache.getStats();
      expect(stats.criticalPositions).toBe(1);
    });

    test('should handle non-object values gracefully', () => {
      const stringValue = 'test';
      const numberValue = 42;
      const nullValue = null;
      
      cache.set('fen1', stringValue);
      cache.set('fen2', numberValue);
      cache.set('fen3', nullValue);
      
      const stats = cache.getStats();
      expect(stats.criticalPositions).toBe(0);
    });
  });

  describe('Priority System', () => {
    test('should prioritize endgame positions', () => {
      const endgamePosition = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'; // 3 pieces
      const middlegamePositions = [
        'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1', // 28 pieces
        'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5', // 28 pieces
        'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQ1R1K b kq - 0 6', // 28 pieces
        'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNB1QRK1 b kq - 0 7', // 28 pieces
        'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RN1BQRK1 b kq - 0 8' // 28 pieces
      ];
      
      // Fill cache with middlegame positions first
      middlegamePositions.forEach((pos, index) => {
        cache.set(pos, { score: index });
      });
      
      // Add endgame position (should evict a middlegame position due to higher priority)
      cache.set(endgamePosition, { score: 0 });
      
      // Endgame position should be in cache
      expect(cache.has(endgamePosition)).toBe(true);
      
      const stats = cache.getStats();
      expect(stats.endgamePositions).toBe(1);
    });

    test('should prioritize critical positions', () => {
      const criticalPosition = '4k3/8/4K3/4Q3/8/8/8/8 w - - 0 1';
      const criticalEvaluation = { score: 600, mate: 2 }; // Critical
      
      // Fill cache with normal positions
      for (let i = 0; i < 5; i++) {
        cache.set(`normal${i}`, { score: 50 });
      }
      
      // Add critical position (should evict a normal position)
      cache.set(criticalPosition, criticalEvaluation);
      
      // Critical position should be in cache
      expect(cache.has(criticalPosition)).toBe(true);
      expect(cache.get(criticalPosition)).toEqual(criticalEvaluation);
      
      const stats = cache.getStats();
      expect(stats.criticalPositions).toBe(1);
    });
  });

  describe('LRU Behavior', () => {
    test('should update access time on get', async () => {
      const fen1 = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const fen2 = '4k3/8/4K3/5P2/8/8/8/8 w - - 0 1'; 
      const value1 = { score: 100 };
      const value2 = { score: 200 };
      
      // Add first item
      cache.set(fen1, value1);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Add second item
      cache.set(fen2, value2);
      
      // Access first item to update its access time
      const retrieved = cache.get(fen1);
      expect(retrieved).toEqual(value1);
      
      // Both should still be in cache
      expect(cache.has(fen1)).toBe(true);
      expect(cache.has(fen2)).toBe(true);
    });

    test('should evict least recently used when cache is full', () => {
      const positions = [
        'pos1', 'pos2', 'pos3', 'pos4', 'pos5'
      ];
      
      // Fill cache
      positions.forEach((pos, index) => {
        cache.set(pos, { score: index });
      });
      
      // Access some positions to update their LRU status
      cache.get('pos2');
      cache.get('pos4');
      
      // Add new position (should evict LRU)
      cache.set('pos6', { score: 6 });
      
      // Recently accessed positions should still be there
      expect(cache.has('pos2')).toBe(true);
      expect(cache.has('pos4')).toBe(true);
      expect(cache.has('pos6')).toBe(true);
      
      // Cache should be at max size
      expect(cache.getStats().size).toBe(5);
    });
  });

  describe('Statistics', () => {
    test('should provide accurate statistics', () => {
      const endgamePosition = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'; // 3 pieces
      const normalPosition1 = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1'; // 28 pieces
      const normalPosition2 = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5'; // 28 pieces
      
      const criticalEvaluation = { score: 700, mate: 2 };
      const normalEvaluation = { score: 100 };
      
      cache.set(endgamePosition, criticalEvaluation);
      cache.set(normalPosition1, normalEvaluation);
      cache.set(normalPosition2, { score: 50 });
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(3);
      expect(stats.maxSize).toBe(5);
      expect(stats.endgamePositions).toBe(1);
      expect(stats.criticalPositions).toBe(1);
      expect(stats.avgPieceCount).toBeGreaterThan(0);
    });

    test('should handle empty cache statistics', () => {
      const stats = cache.getStats();
      
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(5);
      expect(stats.endgamePositions).toBe(0);
      expect(stats.criticalPositions).toBe(0);
      expect(stats.avgPieceCount).toBe(0);
    });

    test('should calculate average piece count correctly', () => {
      cache.set('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', { score: 0 }); // 32 pieces (starting position)
      cache.set('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', { score: 0 }); // 3 pieces
      
      const stats = cache.getStats();
      expect(stats.avgPieceCount).toBe(17.5); // (32 + 3) / 2
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid FEN gracefully', () => {
      const invalidFen = 'invalid-fen-string';
      
      // Should not throw
      expect(() => {
        cache.set(invalidFen, { score: 0 });
      }).not.toThrow();
      
      expect(cache.get(invalidFen)).toEqual({ score: 0 });
    });

    test('should handle FEN with no pieces', () => {
      const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1';
      
      cache.set(emptyFen, { score: 0 });
      
      const stats = cache.getStats();
      expect(stats.avgPieceCount).toBe(0);
    });

    test('should handle updating existing entries', () => {
      const fen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const value1 = { score: 100 };
      const value2 = { score: 200 };
      
      cache.set(fen, value1);
      expect(cache.get(fen)).toEqual(value1);
      
      cache.set(fen, value2);
      expect(cache.get(fen)).toEqual(value2);
      
      // Cache size should not increase
      expect(cache.getStats().size).toBe(1);
    });

    test('should handle eviction when no candidates exist', () => {
      // Fill cache with high-priority positions
      for (let i = 0; i < 5; i++) {
        const fen = `4k3/8/4K3/4P3/8/8/8/${i} w - - 0 1`;
        cache.set(fen, { score: 700 }); // High priority (critical)
      }
      
      // Try to add another high-priority position
      const newFen = '4k3/8/4K3/4Q3/8/8/8/8 w - - 0 1';
      cache.set(newFen, { score: 800 });
      
      // Should still work (fall back to LRU)
      expect(cache.has(newFen)).toBe(true);
      expect(cache.getStats().size).toBe(5);
    });
  });

  describe('Performance', () => {
    test('should handle large number of operations efficiently', () => {
      const largeCache = new ChessAwareCache(1000);
      const startTime = performance.now();
      
      // Add many positions
      for (let i = 0; i < 500; i++) {
        const fen = `position${i}`;
        largeCache.set(fen, { score: i });
      }
      
      // Access many positions
      for (let i = 0; i < 100; i++) {
        largeCache.get(`position${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100); // 100ms
      expect(largeCache.getStats().size).toBe(500);
    });
  });
});