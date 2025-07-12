/**
 * Position Service Performance Tests
 * Load testing and performance validation for positionService with real Firestore
 * Tests scalability, response times, and memory efficiency
 */

import { test, expect } from '../firebase-test-fixture';
import { IPositionService } from '@shared/services/database/IPositionService';
import { createFirebasePositionService } from './helpers/firebase-test-setup';
import { EndgamePosition, EndgameCategory, EndgameChapter } from '@shared/types';

// Performance test configuration
const PERFORMANCE_CONFIG = {
  LARGE_DATASET_SIZE: 100,
  MASSIVE_DATASET_SIZE: 500,
  CONCURRENT_REQUESTS: 50,
  MAX_RESPONSE_TIME_MS: 2000,
  MAX_BULK_RESPONSE_TIME_MS: 10000,
  CACHE_EFFICIENCY_THRESHOLD: 0.9
};

// Helper function to generate test positions
function generateTestPositions(count: number, categoryPrefix = 'perf-test'): EndgamePosition[] {
  const difficulties = ['beginner', 'intermediate', 'advanced', 'master'];
  const goals = ['win', 'draw', 'defend'];
  const sides = ['white', 'black'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Performance Test Position ${i + 1}`,
    description: `Generated position ${i + 1} for performance testing with detailed description that includes multiple keywords for search testing`,
    fen: '8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1', // Simple but valid FEN
    category: `${categoryPrefix}-${Math.floor(i / 20) + 1}`, // Group into categories of 20
    difficulty: difficulties[i % difficulties.length] as 'beginner' | 'intermediate' | 'advanced' | 'master',
    sideToMove: sides[i % sides.length] as 'white' | 'black',
    goal: goals[i % goals.length] as 'win' | 'draw' | 'defend',
    targetMoves: 5 + (i % 10),
    hints: [
      `Hint 1 for position ${i + 1}`,
      `Hint 2 for position ${i + 1}`,
      `Advanced hint for position ${i + 1}`
    ],
    solution: [
      `Move1-${i}`,
      `Move2-${i}`,
      `Move3-${i}`
    ]
  }));
}

test.describe('PositionService Performance Tests', () => {
  let positionService: IPositionService;

  test.beforeEach(async ({ firebaseData }) => {
    await firebaseData.clearAll();
    positionService = createFirebasePositionService();
  });

  test.describe('Response Time Performance', () => {
    test('should retrieve single position within acceptable time', async ({ firebaseData }) => {
      const positions = generateTestPositions(10);
      await firebaseData.seedBatch({ positions });

      const startTime = Date.now();
      const position = await positionService.getPosition(1);
      const responseTime = Date.now() - startTime;

      expect(position).not.toBeNull();
      expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME_MS);
    });

    test('should retrieve all positions within acceptable time', async ({ firebaseData }) => {
      const positions = generateTestPositions(PERFORMANCE_CONFIG.LARGE_DATASET_SIZE);
      await firebaseData.seedBatch({ positions });

      const startTime = Date.now();
      const allPositions = await positionService.getAllPositions();
      const responseTime = Date.now() - startTime;

      expect(allPositions).toHaveLength(PERFORMANCE_CONFIG.LARGE_DATASET_SIZE);
      expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_RESPONSE_TIME_MS);
    });

    test('should handle category filtering efficiently', async ({ firebaseData }) => {
      const positions = generateTestPositions(PERFORMANCE_CONFIG.LARGE_DATASET_SIZE);
      await firebaseData.seedBatch({ positions });

      const startTime = Date.now();
      const categoryPositions = await positionService.getPositionsByCategory('perf-test-1');
      const responseTime = Date.now() - startTime;

      expect(categoryPositions.length).toBeGreaterThan(0);
      expect(categoryPositions.length).toBeLessThanOrEqual(20); // 20 positions per category
      expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME_MS);

      // Verify all returned positions are from the correct category
      categoryPositions.forEach((pos: EndgamePosition) => {
        expect(pos.category).toBe('perf-test-1');
      });
    });

    test('should handle difficulty filtering efficiently', async ({ firebaseData }) => {
      const positions = generateTestPositions(PERFORMANCE_CONFIG.LARGE_DATASET_SIZE);
      await firebaseData.seedBatch({ positions });

      const startTime = Date.now();
      const beginnerPositions = await positionService.getPositionsByDifficulty('beginner');
      const responseTime = Date.now() - startTime;

      expect(beginnerPositions.length).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME_MS);

      // Verify all returned positions have correct difficulty
      beginnerPositions.forEach((pos: EndgamePosition) => {
        expect(pos.difficulty).toBe('beginner');
      });
    });

    test('should handle search efficiently with large dataset', async ({ firebaseData }) => {
      const positions = generateTestPositions(PERFORMANCE_CONFIG.LARGE_DATASET_SIZE);
      await firebaseData.seedBatch({ positions });

      const startTime = Date.now();
      const searchResults = await positionService.searchPositions('Performance');
      const responseTime = Date.now() - startTime;

      expect(searchResults).toHaveLength(PERFORMANCE_CONFIG.LARGE_DATASET_SIZE); // All positions contain "Performance"
      expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_RESPONSE_TIME_MS);
    });
  });

  test.describe('Cache Performance', () => {
    test('should demonstrate cache efficiency with repeated access', async ({ firebaseData }) => {
      const positions = generateTestPositions(50);
      await firebaseData.seedBatch({ positions });

      // First access - should populate cache
      const firstAccessTimes: number[] = [];
      for (let i = 1; i <= 10; i++) {
        const startTime = Date.now();
        await positionService.getPosition(i);
        firstAccessTimes.push(Date.now() - startTime);
      }

      // Second access - should use cache
      const secondAccessTimes: number[] = [];
      for (let i = 1; i <= 10; i++) {
        const startTime = Date.now();
        await positionService.getPosition(i);
        secondAccessTimes.push(Date.now() - startTime);
      }

      // Cache access should be significantly faster
      const avgFirstAccess = firstAccessTimes.reduce((a, b) => a + b, 0) / firstAccessTimes.length;
      const avgSecondAccess = secondAccessTimes.reduce((a, b) => a + b, 0) / secondAccessTimes.length;

      expect(avgSecondAccess).toBeLessThan(avgFirstAccess);
      
      // Most cache accesses should be very fast (< 10ms)
      const fastCacheAccesses = secondAccessTimes.filter(time => time < 10).length;
      const cacheEfficiency = fastCacheAccesses / secondAccessTimes.length;
      expect(cacheEfficiency).toBeGreaterThan(PERFORMANCE_CONFIG.CACHE_EFFICIENCY_THRESHOLD);

      // Verify cache is populated
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(10);
    });

    test('should handle cache with large number of positions', async ({ firebaseData }) => {
      const positions = generateTestPositions(PERFORMANCE_CONFIG.LARGE_DATASET_SIZE);
      await firebaseData.seedBatch({ positions });

      // Load many positions into cache
      const startTime = Date.now();
      for (let i = 1; i <= PERFORMANCE_CONFIG.LARGE_DATASET_SIZE; i += 5) {
        await positionService.getPosition(i);
      }
      const loadTime = Date.now() - startTime;

      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(20); // Every 5th position
      expect(loadTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_RESPONSE_TIME_MS);

      // Verify cached access is fast
      const cacheAccessStart = Date.now();
      await positionService.getPosition(1);
      await positionService.getPosition(6);
      await positionService.getPosition(11);
      const cacheAccessTime = Date.now() - cacheAccessStart;

      expect(cacheAccessTime).toBeLessThan(100); // Should be very fast
    });
  });

  test.describe('Concurrent Access Performance', () => {
    test('should handle concurrent single position requests', async ({ firebaseData }) => {
      const positions = generateTestPositions(20);
      await firebaseData.seedBatch({ positions });

      const startTime = Date.now();
      
      // Create many concurrent requests
      const promises = Array.from({ length: PERFORMANCE_CONFIG.CONCURRENT_REQUESTS }, (_, i) => 
        positionService.getPosition((i % 20) + 1)
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      expect(results).toHaveLength(PERFORMANCE_CONFIG.CONCURRENT_REQUESTS);
      results.forEach((result: EndgamePosition | null) => {
        expect(result).not.toBeNull();
      });

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_RESPONSE_TIME_MS);

      // Average time per request should be reasonable
      const avgTimePerRequest = totalTime / PERFORMANCE_CONFIG.CONCURRENT_REQUESTS;
      expect(avgTimePerRequest).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME_MS / 2);
    });

    test('should handle mixed concurrent operations', async ({ firebaseData }) => {
      const positions = generateTestPositions(PERFORMANCE_CONFIG.LARGE_DATASET_SIZE);
      const categories = Array.from({ length: 5 }, (_, i) => ({
        id: `perf-test-${i + 1}`,
        name: `Performance Category ${i + 1}`,
        description: `Category ${i + 1} for performance testing`,
        icon: '♔',
        positions: []
      }));
      
      await firebaseData.seedBatch({ positions, categories });

      const startTime = Date.now();

      // Mix of different operation types
      const mixedPromises = [
        ...Array.from({ length: 10 }, (_, i) => positionService.getPosition(i + 1)),
        ...Array.from({ length: 5 }, (_, i) => positionService.getPositionsByCategory(`perf-test-${i + 1}`)),
        ...Array.from({ length: 3 }, () => positionService.getAllPositions()),
        ...Array.from({ length: 5 }, () => positionService.searchPositions('Performance')),
        positionService.getTotalPositionCount(),
        positionService.getCategories()
      ];

      const results = await Promise.all(mixedPromises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(mixedPromises.length);
      expect(totalTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_RESPONSE_TIME_MS * 2); // Allow more time for mixed operations
    });
  });

  test.describe('Scalability Tests', () => {
    test('should handle large dataset efficiently', async ({ firebaseData }) => {
      const positions = generateTestPositions(PERFORMANCE_CONFIG.MASSIVE_DATASET_SIZE);
      
      // Seed in batches to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < positions.length; i += batchSize) {
        const batch = positions.slice(i, i + batchSize);
        await firebaseData.seedBatch({ positions: batch });
      }

      // Test various operations with large dataset
      const tests = [
        async () => {
          const startTime = Date.now();
          const count = await positionService.getTotalPositionCount();
          const time = Date.now() - startTime;
          expect(count).toBe(PERFORMANCE_CONFIG.MASSIVE_DATASET_SIZE);
          return time;
        },
        async () => {
          const startTime = Date.now();
          const categoryPositions = await positionService.getPositionsByCategory('perf-test-1');
          const time = Date.now() - startTime;
          expect(categoryPositions.length).toBeGreaterThan(0);
          return time;
        },
        async () => {
          const startTime = Date.now();
          const beginnerPositions = await positionService.getPositionsByDifficulty('beginner');
          const time = Date.now() - startTime;
          expect(beginnerPositions.length).toBeGreaterThan(0);
          return time;
        }
      ];

      for (const testFn of tests) {
        const responseTime = await testFn();
        expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_RESPONSE_TIME_MS);
      }
    });

    test('should maintain performance with navigation operations', async ({ firebaseData }) => {
      const positions = generateTestPositions(PERFORMANCE_CONFIG.LARGE_DATASET_SIZE);
      await firebaseData.seedBatch({ positions });

      // Test navigation performance
      const navigationTests = [
        () => positionService.getNextPosition(50),
        () => positionService.getPreviousPosition(50),
        () => positionService.getNextPosition(25, 'perf-test-2'),
        () => positionService.getPreviousPosition(75, 'perf-test-4')
      ];

      for (const testFn of navigationTests) {
        const startTime = Date.now();
        const result = await testFn();
        const responseTime = Date.now() - startTime;

        expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME_MS);
        // Result might be null if no next/previous exists, which is fine
      }
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should not leak memory with repeated operations', async ({ firebaseData }) => {
      const positions = generateTestPositions(50);
      await firebaseData.seedBatch({ positions });

      // Perform many operations that could potentially leak memory
      for (let round = 0; round < 10; round++) {
        // Load some positions
        for (let i = 1; i <= 10; i++) {
          await positionService.getPosition(i);
        }

        // Clear cache periodically
        if (round % 3 === 0) {
          positionService.clearCache();
        }

        // Perform bulk operations
        await positionService.getAllPositions();
        await positionService.getPositionsByCategory('perf-test-1');
        await positionService.searchPositions('test');
      }

      // Final cache should be reasonable size
      const finalCacheStats = positionService.getCacheStats();
      expect(finalCacheStats.size).toBeLessThanOrEqual(50); // Shouldn't exceed total positions
    });

    test('should handle cache clearing efficiently', async ({ firebaseData }) => {
      const positions = generateTestPositions(100);
      await firebaseData.seedBatch({ positions });

      // Fill cache
      for (let i = 1; i <= 50; i++) {
        await positionService.getPosition(i);
      }

      let cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(50);

      // Clear cache should be fast
      const startTime = Date.now();
      positionService.clearCache();
      const clearTime = Date.now() - startTime;

      expect(clearTime).toBeLessThan(100); // Should be very fast
      
      cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(0);
      expect(cacheStats.keys).toHaveLength(0);
    });
  });

  test.describe('Real-world Usage Patterns', () => {
    test('should handle typical user browsing pattern', async ({ firebaseData }) => {
      const positions = generateTestPositions(100);
      const categories = Array.from({ length: 5 }, (_, i) => ({
        id: `perf-test-${i + 1}`,
        name: `Category ${i + 1}`,
        description: `Description ${i + 1}`,
        icon: '♔',
        positions: []
      }));

      await firebaseData.seedBatch({ positions, categories });

      // Simulate user browsing: view categories, select category, browse positions
      const startTime = Date.now();

      // 1. User views all categories
      const allCategories = await positionService.getCategories();
      expect(allCategories).toHaveLength(5);

      // 2. User selects a category and views positions
      const categoryPositions = await positionService.getPositionsByCategory('perf-test-1');
      expect(categoryPositions.length).toBeGreaterThan(0);

      // 3. User views specific positions
      for (let i = 0; i < Math.min(5, categoryPositions.length); i++) {
        const position = await positionService.getPosition(categoryPositions[i].id);
        expect(position).not.toBeNull();
      }

      // 4. User searches for something
      const searchResults = await positionService.searchPositions('test');
      expect(searchResults.length).toBeGreaterThan(0);

      // 5. User navigates between positions
      await positionService.getNextPosition(categoryPositions[0].id);
      await positionService.getPreviousPosition(categoryPositions[2].id);

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_RESPONSE_TIME_MS);
    });

    test('should handle admin/debugging usage pattern', async ({ firebaseData }) => {
      const positions = generateTestPositions(100);
      await firebaseData.seedBatch({ positions });

      // Simulate admin operations: bulk queries, counts, full data access
      const startTime = Date.now();

      // Admin views all data
      const allPositions = await positionService.getAllPositions();
      expect(allPositions).toHaveLength(100);

      // Admin gets various counts
      const totalCount = await positionService.getTotalPositionCount();
      const category1Count = await positionService.getPositionCountByCategory('perf-test-1');
      const category2Count = await positionService.getPositionCountByCategory('perf-test-2');

      expect(totalCount).toBe(100);
      expect(category1Count).toBeGreaterThan(0);
      expect(category2Count).toBeGreaterThan(0);

      // Admin performs bulk analysis
      const beginnerPositions = await positionService.getPositionsByDifficulty('beginner');
      const intermediatePositions = await positionService.getPositionsByDifficulty('intermediate');
      const advancedPositions = await positionService.getPositionsByDifficulty('advanced');

      expect(beginnerPositions.length + intermediatePositions.length + advancedPositions.length)
        .toBeLessThanOrEqual(totalCount);

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_RESPONSE_TIME_MS * 2);
    });
  });
});