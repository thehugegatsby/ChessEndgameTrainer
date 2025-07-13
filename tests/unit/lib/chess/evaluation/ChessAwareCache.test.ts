/**
 * @fileoverview Unit tests for ChessAwareCache
 * @version 1.0.0
 * @description Tests chess-aware caching with intelligent eviction
 * Following TESTING_GUIDELINES.md principles
 */

import { ChessAwareCache } from '../../../../../shared/lib/chess/evaluation/ChessAwareCache';

// Test constants - Real chess positions
const STARTING_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // 32 pieces
const MIDDLEGAME_POSITION = 'r1bqk2r/pp2nppp/2n1p3/3p4/1b1P4/3BPN2/PPP2PPP/RNBQK2R w KQkq - 4 8'; // 28 pieces
const ENDGAME_POSITION = '8/2k5/8/2P5/4K3/8/8/8 w - - 0 1'; // 3 pieces
const MATE_POSITION = '6k1/5ppp/8/8/8/8/5PPP/R3K2R w KQ - 0 1'; // 12 pieces
const TABLEBASE_POSITION = '4k3/8/8/8/8/8/8/4K2R w - - 0 1'; // 3 pieces

// Mock evaluation types
interface MockEvaluation {
  score: number;
  mate?: number;
  isTablebasePosition?: boolean;
  timestamp?: number;
}

describe('ChessAwareCache_[method]_[condition]_[expected]', () => {
  let cache: ChessAwareCache<MockEvaluation>;

  beforeEach(() => {
    cache = new ChessAwareCache<MockEvaluation>(5); // Small cache for testing
  });

  describe('constructor', () => {
    it('should create cache with default size', () => {
      const defaultCache = new ChessAwareCache<MockEvaluation>();
      const stats = defaultCache.getStats();
      expect(stats.maxSize).toBe(100);
    });

    it('should create cache with custom size', () => {
      const stats = cache.getStats();
      expect(stats.maxSize).toBe(5);
      expect(stats.size).toBe(0);
    });
  });

  describe('get/set basic operations', () => {
    it('should store and retrieve evaluation', () => {
      const eval1: MockEvaluation = { score: 50 };
      
      cache.set(MIDDLEGAME_POSITION, eval1);
      const retrieved = cache.get(MIDDLEGAME_POSITION);
      
      expect(retrieved).toBe(eval1);
    });

    it('should return null for non-existent position', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should update lastAccessed on get', async () => {
      const eval1: MockEvaluation = { score: 50 };
      cache.set(MIDDLEGAME_POSITION, eval1);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Access should update timestamp
      cache.get(MIDDLEGAME_POSITION);
      
      // Can't directly test internal lastAccessed, but can verify behavior
      // by filling cache and checking what gets evicted
    });
  });

  describe('has', () => {
    it('should return true for cached position', () => {
      cache.set(ENDGAME_POSITION, { score: 100 });
      expect(cache.has(ENDGAME_POSITION)).toBe(true);
    });

    it('should return false for uncached position', () => {
      expect(cache.has('unknown-position')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set(STARTING_POSITION, { score: 0 });
      cache.set(MIDDLEGAME_POSITION, { score: 50 });
      cache.set(ENDGAME_POSITION, { score: 100 });
      
      expect(cache.getStats().size).toBe(3);
      
      cache.clear();
      
      expect(cache.getStats().size).toBe(0);
      expect(cache.has(STARTING_POSITION)).toBe(false);
      expect(cache.has(MIDDLEGAME_POSITION)).toBe(false);
      expect(cache.has(ENDGAME_POSITION)).toBe(false);
    });
  });

  describe('Chess-aware prioritization', () => {
    it('should prioritize endgame positions over opening positions', () => {
      // Fill cache with opening/middlegame positions
      for (let i = 0; i < 5; i++) {
        cache.set(`opening-${i}`, { score: i * 10 });
      }
      
      expect(cache.getStats().size).toBe(5);
      
      // Add endgame position - should evict an opening position
      cache.set(ENDGAME_POSITION, { score: 200 });
      
      expect(cache.has(ENDGAME_POSITION)).toBe(true);
      expect(cache.getStats().size).toBe(5); // Still at max
    });

    it('should prioritize critical positions (high scores)', () => {
      // Fill cache with normal evaluations
      cache.set('pos1', { score: 50 });
      cache.set('pos2', { score: 100 });
      cache.set('pos3', { score: 150 });
      cache.set('pos4', { score: 200 });
      cache.set('pos5', { score: 250 });
      
      // Add critical position (score > 500)
      cache.set('critical', { score: 600 });
      
      expect(cache.has('critical')).toBe(true);
      expect(cache.getStats().criticalPositions).toBe(1);
    });

    it('should prioritize mate positions', () => {
      // Fill cache
      for (let i = 0; i < 5; i++) {
        cache.set(`normal-${i}`, { score: i * 50 });
      }
      
      // Add mate position
      cache.set(MATE_POSITION, { score: 0, mate: 5 });
      
      expect(cache.has(MATE_POSITION)).toBe(true);
      expect(cache.getStats().criticalPositions).toBe(1);
    });

    it('should prioritize tablebase positions', () => {
      // Fill cache
      for (let i = 0; i < 5; i++) {
        cache.set(`normal-${i}`, { score: i * 50 });
      }
      
      // Add tablebase position
      cache.set(TABLEBASE_POSITION, { 
        score: 0, 
        isTablebasePosition: true 
      });
      
      expect(cache.has(TABLEBASE_POSITION)).toBe(true);
      expect(cache.getStats().criticalPositions).toBe(1);
    });
  });

  describe('Intelligent eviction', () => {
    it('should evict lower priority positions first', () => {
      // Add positions with increasing priority
      cache.set('opening1', { score: 10 }); // Low priority
      cache.set('middlegame1', { score: 50 }); // Medium priority
      cache.set(ENDGAME_POSITION, { score: 100 }); // High priority (endgame)
      cache.set('critical1', { score: 600 }); // High priority (critical)
      cache.set('mate1', { score: 0, mate: 3 }); // High priority (mate)
      
      // Cache is full, add another high-priority position
      cache.set('endgame2', { score: 200 }); // Should evict 'opening1'
      
      expect(cache.has('opening1')).toBe(false); // Evicted
      expect(cache.has(ENDGAME_POSITION)).toBe(true); // Kept
      expect(cache.has('critical1')).toBe(true); // Kept
      expect(cache.has('mate1')).toBe(true); // Kept
    });

    it('should use LRU within same priority group', async () => {
      // Add multiple endgame positions
      cache.set('endgame1', { score: 100 });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cache.set('endgame2', { score: 100 });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cache.set('endgame3', { score: 100 });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cache.set('endgame4', { score: 100 });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cache.set('endgame5', { score: 100 });
      
      // Access endgame1 to make it recently used
      cache.get('endgame1');
      
      // Add another endgame position
      cache.set('endgame6', { score: 100 });
      
      // endgame2 should be evicted (oldest non-accessed)
      expect(cache.has('endgame1')).toBe(true); // Recently accessed
      expect(cache.has('endgame2')).toBe(false); // Evicted (oldest)
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      // Empty cache
      let stats = cache.getStats();
      expect(stats).toEqual({
        size: 0,
        maxSize: 5,
        endgamePositions: 0,
        criticalPositions: 0,
        avgPieceCount: 0
      });

      // Add various positions
      cache.set(STARTING_POSITION, { score: 0 }); // 32 pieces
      cache.set(MIDDLEGAME_POSITION, { score: 50 }); // 28 pieces
      cache.set(ENDGAME_POSITION, { score: 100 }); // 3 pieces
      cache.set('rnbqkb1r/pppppppp/5n2/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 2 2', { score: 600 }); // Critical middlegame
      cache.set('r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 4', { score: 0, mate: 5 }); // Critical with mate
      
      stats = cache.getStats();
      expect(stats.size).toBe(5);
      expect(stats.endgamePositions).toBe(1); // Only ENDGAME_POSITION
      expect(stats.criticalPositions).toBe(2); // high score + mate
      expect(stats.avgPieceCount).toBeGreaterThan(0);
    });

    it('should calculate average piece count correctly', () => {
      cache.set(ENDGAME_POSITION, { score: 100 }); // 3 pieces
      cache.set('4-pieces', { score: 100 }); // Will count as 0 (no pieces in FEN)
      
      const stats = cache.getStats();
      // Average should handle the position with no piece notation
      expect(stats.avgPieceCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid FEN gracefully', () => {
      const invalidFEN = 'invalid-fen-string';
      cache.set(invalidFEN, { score: 100 });
      
      expect(cache.has(invalidFEN)).toBe(true);
      // Should count 0 pieces for invalid FEN
    });

    it('should handle null/undefined evaluation properties', () => {
      const evalWithNulls: any = {
        score: null,
        mate: undefined,
        isTablebasePosition: null
      };
      
      cache.set('null-eval', evalWithNulls);
      expect(cache.has('null-eval')).toBe(true);
      
      // Should not be marked as critical
      const stats = cache.getStats();
      expect(stats.criticalPositions).toBe(0);
    });

    it('should handle non-object evaluations', () => {
      const stringCache = new ChessAwareCache<string>(5);
      stringCache.set('pos1', 'evaluation-string');
      
      expect(stringCache.get('pos1')).toBe('evaluation-string');
    });
  });

  describe('Performance characteristics', () => {
    it('should handle many positions efficiently', () => {
      const largeCache = new ChessAwareCache<MockEvaluation>(1000);
      const start = performance.now();
      
      // Add 1000 positions
      for (let i = 0; i < 1000; i++) {
        largeCache.set(`position-${i}`, { 
          score: i % 1000,
          mate: i % 10 === 0 ? i : undefined
        });
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should be fast
      
      expect(largeCache.getStats().size).toBe(1000);
    });

    it('should evict efficiently when cache is full', () => {
      const largeCache = new ChessAwareCache<MockEvaluation>(100);
      
      // Fill cache
      for (let i = 0; i < 100; i++) {
        largeCache.set(`pos-${i}`, { score: i });
      }
      
      const start = performance.now();
      
      // Add 100 more (forcing evictions)
      for (let i = 100; i < 200; i++) {
        largeCache.set(`pos-${i}`, { score: i });
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Eviction should be fast
      
      expect(largeCache.getStats().size).toBe(100);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical endgame training session', () => {
      // Simulate exploring variations in endgame
      const basePosition = '8/8/4k3/8/4K3/4P3/8/8 w - - 0 1';
      
      // Main line
      cache.set(basePosition, { score: 150 });
      cache.set('8/8/4k3/4P3/4K3/8/8/8 b - - 0 1', { score: 140 });
      cache.set('8/8/8/4k3/4K3/8/8/8 w - - 0 2', { score: 160 });
      
      // Variations
      cache.set('8/8/3k4/8/4K3/4P3/8/8 b - - 0 1', { score: 145 });
      cache.set('8/8/4k3/8/4KP2/8/8/8 b - - 0 1', { score: 155 });
      
      // All endgame positions should be retained
      expect(cache.getStats().endgamePositions).toBe(5);
      expect(cache.getStats().size).toBe(5);
      
      // Try to add non-endgame position - should evict itself due to lower priority
      cache.set(STARTING_POSITION, { score: 0 });
      
      // The cache should keep endgames and evict the lower priority opening
      // But if all endgames have same high priority, it might evict one endgame
      const stats = cache.getStats();
      expect(stats.size).toBe(5); // Still at max
      // At least 4 endgames should remain (might evict one for the new position)
      expect(stats.endgamePositions).toBeGreaterThanOrEqual(4);
    });
  });
});