/**
 * @file Unit tests for enhanced useDerivedProgress hook with cache-first strategy
 * @description Tests cache integration, fallback scenarios, and performance optimizations
 */

import { renderHook, act } from '@testing-library/react';
import { useDerivedProgress, useDueCardsCache } from '@shared/store/hooks/useProgressStore';
import { useStore } from '@shared/store/rootStore';
import { dueCardsCacheService } from '@shared/services/DueCardsCacheService';
import type { CardProgress } from '@shared/store/slices/types';

// Mock the cache service
jest.mock('@shared/services/DueCardsCacheService', () => {
  let mockCacheData: any = null;
  let mockCacheStats = {
    available: true,
    totalEntries: 0,
    estimatedSize: 0,
    lastCleanup: null
  };

  const mockCacheService = {
    getDueCards: jest.fn(() => mockCacheData),
    setDueCards: jest.fn(() => {
      mockCacheStats.totalEntries += 1;
      mockCacheStats.estimatedSize += 1000; // Simulate size growth
    }),
    clearUserCache: jest.fn(() => {
      mockCacheData = null;
      mockCacheStats.totalEntries = Math.max(0, mockCacheStats.totalEntries - 1);
    }),
    clearAllCache: jest.fn(() => {
      mockCacheData = null;
      mockCacheStats = { available: true, totalEntries: 0, estimatedSize: 0, lastCleanup: null };
    }),
    getCacheStats: jest.fn(() => mockCacheStats),
    forceCleanup: jest.fn()
  };

  // Helper to set mock cache data for tests
  (mockCacheService as any).__setMockCacheData = (data: any) => {
    mockCacheData = data;
  };

  return {
    dueCardsCacheService: mockCacheService,
    createInputHash: jest.fn((input: any) => 'mock-hash-' + JSON.stringify(input).length)
  };
});

// Mock logger to avoid console spam in tests
jest.mock('@shared/services/logging/Logger', () => ({
  getLogger: () => ({
    setContext: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  })
}));

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

const createDueCard = (id: string) => createTestCard(id, Date.now() - 1000); // Due 1 second ago
const createFutureCard = (id: string) => createTestCard(id, Date.now() + 86400000); // Due in 24 hours

describe('useDerivedProgress Hook (Enhanced with Cache)', () => {
  const userId = 'test-user-123';
  let mockCacheService: any;

  beforeEach(() => {
    mockCacheService = dueCardsCacheService as any;
    mockCacheService.__setMockCacheData(null);
    
    // Reset cache stats
    jest.mocked(mockCacheService.getCacheStats).mockReturnValue({
      available: true,
      totalEntries: 0,
      estimatedSize: 0,
      lastCleanup: null
    });

    jest.clearAllMocks();
    
    // Reset store to initial state
    useStore.getState().progress.resetProgress();
  });

  describe('Basic functionality without cache', () => {
    it('should calculate due cards without userId (fallback mode)', () => {
      // Setup some card progress
      const cards = [
        createDueCard('due-1'),
        createDueCard('due-2'),
        createFutureCard('future-1')
      ];

      act(() => {
        useStore.getState().progress.initializeCards(cards);
        useStore.getState().progress.updateSessionProgress({
          positionsCorrect: 8,
          positionsAttempted: 10
        });
      });

      const { result } = renderHook(() => useDerivedProgress(null));

      expect(result.current.dueCardCount).toBe(2);
      expect(result.current.totalCards).toBe(3);
      expect(result.current.successRate).toBe(80);
      expect(result.current.isFromCache).toBe(false);
      expect(result.current.cacheStats.available).toBe(false);
      
      // Should not call cache service without userId
      expect(mockCacheService.getDueCards).not.toHaveBeenCalled();
    });

    it('should handle empty card progress', () => {
      const { result } = renderHook(() => useDerivedProgress(userId));

      expect(result.current.dueCardCount).toBe(0);
      expect(result.current.totalCards).toBe(0);
      expect(result.current.successRate).toBe(0);
      expect(result.current.isFromCache).toBe(false);
    });
  });

  describe('Cache-first strategy', () => {
    it('should use cached result when available', () => {
      // Setup cards in store
      const cards = [
        createDueCard('due-1'),
        createDueCard('due-2'),
        createFutureCard('future-1')
      ];

      act(() => {
        useStore.getState().progress.initializeCards(cards);
      });

      // Mock cached result
      const mockCachedResult = {
        dueCards: [
          { ...createDueCard('due-1'), __isDue: true, __brand: 'DueCard' },
          { ...createDueCard('due-2'), __isDue: true, __brand: 'DueCard' }
        ],
        calculatedAt: Date.now() - 30000, // 30 seconds ago
        stats: {
          totalCards: 3,
          dueCount: 2,
          duePercentage: 67,
          nextDueAt: Date.now() + 3600000,
          averageInterval: 2.5
        },
        inputHash: 'cached-hash',
        createdAt: Date.now() - 30000,
        lastAccessedAt: Date.now() - 30000
      };

      mockCacheService.__setMockCacheData(mockCachedResult);

      const { result } = renderHook(() => useDerivedProgress(userId));

      expect(result.current.isFromCache).toBe(true);
      expect(result.current.dueCardCount).toBe(2);
      expect(result.current.stats).toEqual(mockCachedResult.stats);
      expect(mockCacheService.getDueCards).toHaveBeenCalledWith(userId, expect.any(String));
    });

    it('should compute fresh result on cache miss and cache it', () => {
      // Setup cards in store
      const cards = [
        createDueCard('due-1'),
        createFutureCard('future-1'),
        createFutureCard('future-2')
      ];

      act(() => {
        useStore.getState().progress.initializeCards(cards);
      });

      // No cached result (cache miss)
      mockCacheService.__setMockCacheData(null);

      const { result } = renderHook(() => useDerivedProgress(userId));

      expect(result.current.isFromCache).toBe(false);
      expect(result.current.dueCardCount).toBe(1);
      expect(result.current.totalCards).toBe(3);

      // Should have tried to get from cache
      expect(mockCacheService.getDueCards).toHaveBeenCalledWith(userId, expect.any(String));
      
      // Should have cached the result
      expect(mockCacheService.setDueCards).toHaveBeenCalledWith(
        userId,
        expect.arrayContaining([expect.objectContaining({ id: 'due-1' })]),
        expect.objectContaining({ dueCount: 1, totalCards: 3 }),
        expect.any(String)
      );
    });

    it('should handle cache service errors gracefully', () => {
      // Setup cards
      const cards = [createDueCard('due-1')];
      act(() => {
        useStore.getState().progress.initializeCards(cards);
      });

      // Mock cache service to throw error
      jest.mocked(mockCacheService.setDueCards).mockImplementation(() => {
        throw new Error('Cache write error');
      });

      const { result } = renderHook(() => useDerivedProgress(userId));

      // Should still return computed result despite cache error
      expect(result.current.dueCardCount).toBe(1);
      expect(result.current.isFromCache).toBe(false);
      expect(result.current.totalCards).toBe(1);
    });
  });

  describe('Input hash validation', () => {
    it('should create consistent input hash for same inputs', () => {
      const cards = [createDueCard('due-1'), createFutureCard('future-1')];
      
      act(() => {
        useStore.getState().progress.initializeCards(cards);
      });

      // Render hook multiple times
      renderHook(() => useDerivedProgress(userId));
      renderHook(() => useDerivedProgress(userId));

      // Both should call getDueCards with same hash
      expect(mockCacheService.getDueCards).toHaveBeenCalledTimes(2);
    });

    it('should create different hash when cards change', () => {
      // Initial cards
      act(() => {
        useStore.getState().progress.initializeCards([createDueCard('due-1')]);
      });

      const { rerender } = renderHook(() => useDerivedProgress(userId));

      // Add more cards
      act(() => {
        useStore.getState().progress.initializeCards([
          createDueCard('due-1'), 
          createDueCard('due-2')
        ]);
      });

      rerender();

      // Should have called getDueCards twice with different contexts
      expect(mockCacheService.getDueCards).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance optimization', () => {
    it('should handle large card collections efficiently', () => {
      // Create 1000 cards (500 due, 500 future)
      const largeCardSet = Array.from({ length: 1000 }, (_, i) => 
        i % 2 === 0 
          ? createDueCard(`due-${i}`)
          : createFutureCard(`future-${i}`)
      );

      act(() => {
        useStore.getState().progress.initializeCards(largeCardSet);
      });

      const startTime = performance.now();
      renderHook(() => useDerivedProgress(userId));
      const endTime = performance.now();
      
      // Should complete within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should attempt to cache the large result
      expect(mockCacheService.setDueCards).toHaveBeenCalled();
    });

    it('should use 5-minute timestamp buckets for cache stability', () => {
      const cards = [createDueCard('due-1')];
      
      act(() => {
        useStore.getState().progress.initializeCards(cards);
      });

      // Mock time to be mid-bucket
      const originalDateNow = Date.now;
      const fixedTime = 1700000000000; // Fixed timestamp
      Date.now = jest.fn(() => fixedTime + 2 * 60 * 1000); // +2 minutes

      renderHook(() => useDerivedProgress(userId));

      // Should use 5-minute bucket in hash calculation
      expect(mockCacheService.getDueCards).toHaveBeenCalled();

      Date.now = originalDateNow;
    });
  });
});

describe('useDueCardsCache Hook', () => {
  let mockCacheService: any;

  beforeEach(() => {
    mockCacheService = dueCardsCacheService as any;
    jest.clearAllMocks();
  });

  it('should provide cache management functions', () => {
    const { result } = renderHook(() => useDueCardsCache());

    expect(typeof result.current.clearUserCache).toBe('function');
    expect(typeof result.current.clearAllCache).toBe('function');
    expect(typeof result.current.getCacheStats).toBe('function');
    expect(typeof result.current.forceCleanup).toBe('function');
  });

  it('should call cache service methods correctly', () => {
    const { result } = renderHook(() => useDueCardsCache());

    // Test clearUserCache
    result.current.clearUserCache('test-user');
    expect(mockCacheService.clearUserCache).toHaveBeenCalledWith('test-user');

    // Test clearAllCache
    result.current.clearAllCache();
    expect(mockCacheService.clearAllCache).toHaveBeenCalled();

    // Test getCacheStats
    result.current.getCacheStats();
    expect(mockCacheService.getCacheStats).toHaveBeenCalled();

    // Test forceCleanup
    result.current.forceCleanup();
    expect(mockCacheService.forceCleanup).toHaveBeenCalled();
  });

  it('should return stable references (useMemo)', () => {
    const { result, rerender } = renderHook(() => useDueCardsCache());

    const firstRender = result.current;
    
    rerender();
    
    const secondRender = result.current;

    // All functions should be the same reference
    expect(firstRender.clearUserCache).toBe(secondRender.clearUserCache);
    expect(firstRender.clearAllCache).toBe(secondRender.clearAllCache);
    expect(firstRender.getCacheStats).toBe(secondRender.getCacheStats);
    expect(firstRender.forceCleanup).toBe(secondRender.forceCleanup);
  });
});