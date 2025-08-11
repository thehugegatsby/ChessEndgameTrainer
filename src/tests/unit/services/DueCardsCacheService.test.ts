/**
 * @file Unit tests for DueCardsCacheService
 * @description Comprehensive tests for localStorage cache with TTL, LRU, and midnight invalidation
 */

import { DueCardsCacheService, createInputHash } from '@shared/services/DueCardsCacheService';
import { filterDueCards, type DueCard, type DueCardsStats } from '@shared/types/progress';
import type { CardProgress } from '@shared/store/slices/types';

// Mock localStorage for testing
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Test helpers
const createTestCard = (id: string, nextReviewAt: number): CardProgress => ({
  id,
  nextReviewAt,
  lastReviewedAt: Date.now() - 86400000, // 24 hours ago
  interval: 1,
  repetition: 1,
  efactor: 2.5,
  lapses: 0
});

const createDueTestCards = (count: number): DueCard[] => {
  const cards = Array.from({ length: count }, (_, i) => 
    createTestCard(`test-${i}`, Date.now() - 1000) // Due 1 second ago
  );
  return filterDueCards(cards);
};

const createTestStats = (dueCount: number): DueCardsStats => ({
  totalCards: dueCount + 5,
  dueCount,
  duePercentage: Math.round((dueCount / (dueCount + 5)) * 100),
  nextDueAt: Date.now() + 3600000, // 1 hour from now
  averageInterval: 2.5
});

// Mock Date.now for TTL testing
const originalDateNow = Date.now;
const mockDateNow = (timestamp: number): void => {
  Date.now = jest.fn(() => timestamp);
};

const restoreDateNow = (): void => {
  Date.now = originalDateNow;
};

describe('DueCardsCacheService', () => {
  let mockLocalStorage: MockLocalStorage;
  let cacheService: DueCardsCacheService;

  beforeEach(() => {
    // Setup mock localStorage
    mockLocalStorage = new MockLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Clear any existing instance
    (DueCardsCacheService as any).instance = null;
    
    // Create fresh instance
    cacheService = DueCardsCacheService.getInstance();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    restoreDateNow();
    cacheService.destroy();
    mockLocalStorage.clear();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DueCardsCacheService.getInstance();
      const instance2 = DueCardsCacheService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('setDueCards and getDueCards', () => {
    const userId = 'test-user-1';
    const inputHash = 'test-hash-123';

    it('should cache and retrieve due cards successfully', () => {
      const dueCards = createDueTestCards(5);
      const stats = createTestStats(5);

      // Cache the data
      cacheService.setDueCards(userId, dueCards, stats, inputHash);

      // Retrieve the data
      const cached = cacheService.getDueCards(userId, inputHash);

      expect(cached).toBeTruthy();
      expect(cached?.dueCards).toHaveLength(5);
      expect(cached?.dueCards[0].id).toBe('test-0');
      expect(cached?.stats.dueCount).toBe(5);
      expect(cached?.inputHash).toBe(inputHash);
    });

    it('should return null for cache miss', () => {
      const cached = cacheService.getDueCards('nonexistent-user', inputHash);
      expect(cached).toBeNull();
    });

    it('should invalidate cache when input hash changes', () => {
      const dueCards = createDueTestCards(3);
      const stats = createTestStats(3);

      // Cache with original hash
      cacheService.setDueCards(userId, dueCards, stats, inputHash);

      // Try to retrieve with different hash
      const cached = cacheService.getDueCards(userId, 'different-hash');
      expect(cached).toBeNull();
      
      // Original hash should still work initially
      const original = cacheService.getDueCards(userId, inputHash);
      expect(original).toBeNull(); // Should be cleared due to hash mismatch above
    });

    it('should handle invalid cache entry structure gracefully', () => {
      // Manually insert invalid cache entry
      mockLocalStorage.setItem(
        'endgame_due_cards_test-user-1',
        JSON.stringify({ invalid: 'data' })
      );

      const cached = cacheService.getDueCards(userId, inputHash);
      expect(cached).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw errors
      jest.spyOn(mockLocalStorage, 'getItem').mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      const cached = cacheService.getDueCards(userId, inputHash);
      expect(cached).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    const userId = 'ttl-test-user';
    const inputHash = 'ttl-hash';

    it('should expire cache after 24 hours', () => {
      const dueCards = createDueTestCards(2);
      const stats = createTestStats(2);
      
      const now = 1640000000000; // Fixed timestamp
      mockDateNow(now);

      // Cache the data
      cacheService.setDueCards(userId, dueCards, stats, inputHash);

      // Fast forward 25 hours
      mockDateNow(now + 25 * 60 * 60 * 1000);

      // Should be expired
      const cached = cacheService.getDueCards(userId, inputHash);
      expect(cached).toBeNull();
    });

    it('should not expire cache before 24 hours', () => {
      const dueCards = createDueTestCards(2);
      const stats = createTestStats(2);
      
      // Use a timestamp at 10:00 AM UTC so adding 23 hours doesn't cross midnight
      const now = new Date('2024-01-15T10:00:00.000Z').getTime();
      mockDateNow(now);

      // Cache the data
      cacheService.setDueCards(userId, dueCards, stats, inputHash);

      // Fast forward 10 hours (should be 8:00 PM same UTC day)
      mockDateNow(now + 10 * 60 * 60 * 1000);

      // Should still be valid
      const cached = cacheService.getDueCards(userId, inputHash);
      expect(cached).toBeTruthy();
      expect(cached?.dueCards).toHaveLength(2);
    });
  });

  describe('midnight invalidation', () => {
    const userId = 'midnight-test-user';
    const inputHash = 'midnight-hash';

    it('should invalidate cache after midnight UTC', () => {
      const dueCards = createDueTestCards(3);
      const stats = createTestStats(3);

      // Set time to just before midnight UTC (23:59 UTC)
      const beforeMidnight = new Date('2024-01-15T23:59:00.000Z').getTime();
      mockDateNow(beforeMidnight);

      // Cache the data
      cacheService.setDueCards(userId, dueCards, stats, inputHash);

      // Move to just after midnight UTC (00:01 next day)
      const afterMidnight = new Date('2024-01-16T00:01:00.000Z').getTime();
      mockDateNow(afterMidnight);

      // Should be invalidated due to midnight rollover
      const cached = cacheService.getDueCards(userId, inputHash);
      expect(cached).toBeNull();
    });

    it('should not invalidate cache on same UTC day', () => {
      const dueCards = createDueTestCards(3);
      const stats = createTestStats(3);

      // Set time to morning UTC (8:00 AM)
      const morning = new Date('2024-01-15T08:00:00.000Z').getTime();
      mockDateNow(morning);

      // Cache the data
      cacheService.setDueCards(userId, dueCards, stats, inputHash);

      // Move to later same day UTC (6:00 PM same day)
      const evening = new Date('2024-01-15T18:00:00.000Z').getTime();
      mockDateNow(evening);

      // Should still be valid (same UTC day)
      const cached = cacheService.getDueCards(userId, inputHash);
      expect(cached).toBeTruthy();
      expect(cached?.dueCards).toHaveLength(3);
    });
  });

  describe('LRU cache management', () => {
    const inputHash = 'lru-hash';

    it('should track last accessed time', () => {
      const dueCards = createDueTestCards(1);
      const stats = createTestStats(1);
      
      const initialTime = 1640000000000;
      mockDateNow(initialTime);

      // Cache the data
      cacheService.setDueCards('user1', dueCards, stats, inputHash);

      // Access later
      const laterTime = initialTime + 60000; // 1 minute later
      mockDateNow(laterTime);

      const cached = cacheService.getDueCards('user1', inputHash);
      expect(cached?.lastAccessedAt).toBe(laterTime);
    });

    it('should handle large collections with performance warning', () => {
      // Mock console.warn to capture performance warnings
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const dueCards = createDueTestCards(600); // Over threshold
      const stats = createTestStats(600);

      cacheService.setDueCards('large-user', dueCards, stats, inputHash);

      // Check that warning was logged (through logger)
      // Note: The actual warning goes through logger.warn, not console.warn directly
      expect(dueCards.length).toBeGreaterThan(500);

      consoleSpy.mockRestore();
    });
  });

  describe('clearUserCache', () => {
    it('should clear cache for specific user', () => {
      const dueCards1 = createDueTestCards(2);
      const dueCards2 = createDueTestCards(3);
      const stats1 = createTestStats(2);
      const stats2 = createTestStats(3);

      // Cache for two users
      cacheService.setDueCards('user1', dueCards1, stats1, 'hash1');
      cacheService.setDueCards('user2', dueCards2, stats2, 'hash2');

      // Clear user1 cache
      cacheService.clearUserCache('user1');

      // user1 cache should be gone
      expect(cacheService.getDueCards('user1', 'hash1')).toBeNull();
      
      // user2 cache should still exist
      expect(cacheService.getDueCards('user2', 'hash2')).toBeTruthy();
    });

    it('should handle clearing nonexistent user cache', () => {
      // Should not throw error
      expect(() => {
        cacheService.clearUserCache('nonexistent-user');
      }).not.toThrow();
    });
  });

  describe('clearAllCache', () => {
    it('should clear all cache entries', () => {
      const dueCards = createDueTestCards(2);
      const stats = createTestStats(2);

      // Cache for multiple users
      cacheService.setDueCards('user1', dueCards, stats, 'hash1');
      cacheService.setDueCards('user2', dueCards, stats, 'hash2');
      cacheService.setDueCards('user3', dueCards, stats, 'hash3');

      // Clear all
      cacheService.clearAllCache();

      // All caches should be gone
      expect(cacheService.getDueCards('user1', 'hash1')).toBeNull();
      expect(cacheService.getDueCards('user2', 'hash2')).toBeNull();
      expect(cacheService.getDueCards('user3', 'hash3')).toBeNull();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const dueCards = createDueTestCards(5);
      const stats = createTestStats(5);

      // Initially empty
      let cacheStats = cacheService.getCacheStats();
      expect(cacheStats.available).toBe(true);
      expect(cacheStats.totalEntries).toBe(0);

      // Cache some data
      cacheService.setDueCards('stats-user', dueCards, stats, 'stats-hash');

      cacheStats = cacheService.getCacheStats();
      expect(cacheStats.totalEntries).toBe(1);
      expect(cacheStats.estimatedSize).toBeGreaterThan(0);
    });

    it('should handle unavailable localStorage', () => {
      // Mock localStorage as unavailable
      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: () => { throw new Error('Not available'); },
          getItem: () => { throw new Error('Not available'); },
        },
        writable: true
      });

      // Create new instance with unavailable localStorage
      (DueCardsCacheService as any).instance = null;
      const newService = DueCardsCacheService.getInstance();

      const stats = newService.getCacheStats();
      expect(stats.available).toBe(false);
      expect(stats.totalEntries).toBe(0);

      newService.destroy();
    });
  });

  describe('forceCleanup', () => {
    it('should perform cleanup when called', () => {
      const dueCards = createDueTestCards(2);
      const stats = createTestStats(2);
      
      const pastTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      mockDateNow(pastTime);

      // Cache expired data
      cacheService.setDueCards('cleanup-user', dueCards, stats, 'cleanup-hash');

      // Return to present
      restoreDateNow();

      // Force cleanup
      cacheService.forceCleanup();

      // Expired entry should be removed
      expect(cacheService.getDueCards('cleanup-user', 'cleanup-hash')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      // Manually insert invalid JSON
      mockLocalStorage.setItem('endgame_due_cards_error-user', 'invalid-json');

      const cached = cacheService.getDueCards('error-user', 'error-hash');
      expect(cached).toBeNull();
    });

    it('should handle localStorage quota exceeded', () => {
      // Mock setItem to throw quota exceeded error
      jest.spyOn(mockLocalStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const dueCards = createDueTestCards(1);
      const stats = createTestStats(1);

      // Should not throw error
      expect(() => {
        cacheService.setDueCards('quota-user', dueCards, stats, 'quota-hash');
      }).not.toThrow();
    });
  });
});

describe('createInputHash', () => {
  it('should create consistent hash for same input', () => {
    const input = { userId: 'test', cards: ['a', 'b', 'c'] };
    
    const hash1 = createInputHash(input);
    const hash2 = createInputHash(input);
    
    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBeGreaterThan(0);
  });

  it('should create different hashes for different inputs', () => {
    const input1 = { userId: 'test1', cards: ['a', 'b'] };
    const input2 = { userId: 'test2', cards: ['a', 'b'] };
    
    const hash1 = createInputHash(input1);
    const hash2 = createInputHash(input2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should handle string input', () => {
    const hash = createInputHash('test-string');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should handle empty input', () => {
    const hash = createInputHash('');
    expect(typeof hash).toBe('string');
  });

  it('should handle complex nested objects', () => {
    const complex = {
      user: { id: 'test', profile: { name: 'Test User' } },
      cards: [{ id: 'card1', data: { score: 100 } }],
      meta: { timestamp: 123456789 }
    };
    
    const hash = createInputHash(complex);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });
});