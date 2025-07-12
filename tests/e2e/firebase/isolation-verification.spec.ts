/**
 * Basic Isolation Verification Tests
 * Tests emulator cleanup and isolation without relying on Test API infrastructure
 * Verifies that tests maintain clean state between executions
 */

import { test, expect } from '@playwright/test';
import { IPositionService } from '@shared/services/database/IPositionService';
import { createFirebasePositionService } from './helpers/firebase-test-setup';
import { EndgamePosition } from '@shared/types';

// Test data for isolation verification
const testPosition: EndgamePosition = {
  id: 777,
  title: 'Isolation Test Position',
  description: 'Position used to verify test isolation',
  fen: '8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1',
  category: 'isolation-test',
  difficulty: 'beginner',
  targetMoves: 3,
  sideToMove: 'white',
  goal: 'win',
  hints: ['This is an isolation test'],
  solution: ['Qd5+', 'Kf6', 'Qf7#']
};

test.describe('Basic Isolation Verification', () => {
  test.describe('Service Instance Isolation', () => {
    test('should have independent service instances', async () => {
      const service1 = createFirebasePositionService();
      const service2 = createFirebasePositionService();
      
      // Both services should start with empty caches
      const cache1Initial = service1.getCacheStats();
      const cache2Initial = service2.getCacheStats();
      
      expect(cache1Initial.size).toBe(0);
      expect(cache2Initial.size).toBe(0);
      
      // Services should be different instances
      expect(service1).not.toBe(service2);
    });

    test('should isolate cache operations between instances', async () => {
      const service1 = createFirebasePositionService();
      const service2 = createFirebasePositionService();
      
      // Manually add to cache of first service
      // Note: This simulates cache population without requiring real Firestore data
      const privateCache1 = (service1 as any).cache;
      privateCache1.set(testPosition.id, testPosition);
      
      // Verify first service has cached data
      const cache1Stats = service1.getCacheStats();
      expect(cache1Stats.size).toBe(1);
      expect(cache1Stats.keys).toContain(testPosition.id);
      
      // Second service should remain unaffected
      const cache2Stats = service2.getCacheStats();
      expect(cache2Stats.size).toBe(0);
      
      // Clear cache in first service
      service1.clearCache();
      
      // First service should be clean
      const cache1After = service1.getCacheStats();
      expect(cache1After.size).toBe(0);
      
      // Second service should still be unaffected
      const cache2After = service2.getCacheStats();
      expect(cache2After.size).toBe(0);
    });
  });

  test.describe('Test-to-Test Isolation', () => {
    test('should start with clean service state (Test A)', async () => {
      const service = createFirebasePositionService();
      
      // Should start clean
      const initialCache = service.getCacheStats();
      expect(initialCache.size).toBe(0);
      
      // Simulate data loading by manually populating cache
      const privateCache = (service as any).cache;
      privateCache.set(testPosition.id, testPosition);
      
      // Verify cache is populated
      const populatedCache = service.getCacheStats();
      expect(populatedCache.size).toBe(1);
      expect(populatedCache.keys).toContain(testPosition.id);
      
      // Note: This state should not affect the next test
    });

    test('should start with clean service state (Test B)', async () => {
      const service = createFirebasePositionService();
      
      // Should start clean, unaffected by previous test
      const cache = service.getCacheStats();
      expect(cache.size).toBe(0);
      expect(cache.keys).toHaveLength(0);
      
      // Previous test's cache population should not be visible
      // (because it was a different service instance)
    });
  });

  test.describe('Cache Management Verification', () => {
    test('should clear cache correctly', async () => {
      const service = createFirebasePositionService();
      
      // Manually populate cache
      const privateCache = (service as any).cache;
      for (let i = 1; i <= 5; i++) {
        const pos = { ...testPosition, id: i, title: `Test Position ${i}` };
        privateCache.set(i, pos);
      }
      
      // Verify cache is populated
      const populatedCache = service.getCacheStats();
      expect(populatedCache.size).toBe(5);
      expect(populatedCache.keys.sort()).toEqual([1, 2, 3, 4, 5]);
      
      // Clear cache
      service.clearCache();
      
      // Verify cache is empty
      const clearedCache = service.getCacheStats();
      expect(clearedCache.size).toBe(0);
      expect(clearedCache.keys).toHaveLength(0);
    });

    test('should handle multiple cache operations', async () => {
      const service = createFirebasePositionService();
      const privateCache = (service as any).cache;
      
      // Add items one by one and verify
      for (let i = 1; i <= 3; i++) {
        const pos = { ...testPosition, id: i, title: `Position ${i}` };
        privateCache.set(i, pos);
        
        const stats = service.getCacheStats();
        expect(stats.size).toBe(i);
        expect(stats.keys).toHaveLength(i);
        expect(stats.keys).toContain(i);
      }
      
      // Remove items and verify
      privateCache.delete(2);
      
      const afterDelete = service.getCacheStats();
      expect(afterDelete.size).toBe(2);
      expect(afterDelete.keys.sort()).toEqual([1, 3]);
      
      // Clear all
      service.clearCache();
      
      const afterClear = service.getCacheStats();
      expect(afterClear.size).toBe(0);
    });
  });

  test.describe('Memory Management', () => {
    test('should not accumulate memory across instances', async () => {
      const services: IPositionService[] = [];
      
      // Create multiple service instances
      for (let i = 0; i < 10; i++) {
        const service = createFirebasePositionService();
        services.push(service);
        
        // Populate each with some test data
        const privateCache = (service as any).cache;
        for (let j = 1; j <= 5; j++) {
          const pos = { ...testPosition, id: j, title: `Instance ${i} Position ${j}` };
          privateCache.set(j, pos);
        }
        
        // Verify cache is populated
        const stats = service.getCacheStats();
        expect(stats.size).toBe(5);
      }
      
      // Each service should have independent cache
      services.forEach((service, index) => {
        const stats = service.getCacheStats();
        expect(stats.size).toBe(5);
        expect(stats.keys.sort()).toEqual([1, 2, 3, 4, 5]);
      });
      
      // Clear half of the services
      for (let i = 0; i < 5; i++) {
        services[i].clearCache();
      }
      
      // First half should be cleared
      for (let i = 0; i < 5; i++) {
        const stats = services[i].getCacheStats();
        expect(stats.size).toBe(0);
      }
      
      // Second half should still have data
      for (let i = 5; i < 10; i++) {
        const stats = services[i].getCacheStats();
        expect(stats.size).toBe(5);
      }
    });

    test('should handle large cache datasets', async () => {
      const service = createFirebasePositionService();
      const privateCache = (service as any).cache;
      
      // Populate with large dataset
      const largeDatasetSize = 100;
      for (let i = 1; i <= largeDatasetSize; i++) {
        const pos = { 
          ...testPosition, 
          id: i, 
          title: `Large Dataset Position ${i}`,
          description: `Description for position ${i} in large dataset test`
        };
        privateCache.set(i, pos);
      }
      
      // Verify large cache
      const largeCache = service.getCacheStats();
      expect(largeCache.size).toBe(largeDatasetSize);
      expect(largeCache.keys).toHaveLength(largeDatasetSize);
      
      // Verify specific items exist
      expect(largeCache.keys).toContain(1);
      expect(largeCache.keys).toContain(50);
      expect(largeCache.keys).toContain(100);
      
      // Clear should handle large dataset efficiently
      const startTime = Date.now();
      service.clearCache();
      const clearTime = Date.now() - startTime;
      
      // Should clear quickly (under 100ms even for large datasets)
      expect(clearTime).toBeLessThan(100);
      
      // Verify cleared
      const clearedCache = service.getCacheStats();
      expect(clearedCache.size).toBe(0);
    });
  });

  test.describe('Concurrent Operations', () => {
    test('should handle concurrent cache operations', async () => {
      const service = createFirebasePositionService();
      const privateCache = (service as any).cache;
      
      // Simulate concurrent cache operations
      const operations = [];
      
      // Add operations
      for (let i = 1; i <= 20; i++) {
        operations.push(Promise.resolve().then(() => {
          const pos = { ...testPosition, id: i, title: `Concurrent Position ${i}` };
          privateCache.set(i, pos);
        }));
      }
      
      // Wait for all operations to complete
      await Promise.all(operations);
      
      // Verify all items were added
      const stats = service.getCacheStats();
      expect(stats.size).toBe(20);
      expect(stats.keys).toHaveLength(20);
      
      // Verify we have all expected keys
      for (let i = 1; i <= 20; i++) {
        expect(stats.keys).toContain(i);
      }
    });

    test('should maintain consistency during mixed operations', async () => {
      const service = createFirebasePositionService();
      const privateCache = (service as any).cache;
      
      // Initial population
      for (let i = 1; i <= 10; i++) {
        const pos = { ...testPosition, id: i, title: `Mixed Op Position ${i}` };
        privateCache.set(i, pos);
      }
      
      // Mixed operations: add some, remove some
      const mixedOps = [
        // Add more items
        () => {
          for (let i = 11; i <= 15; i++) {
            const pos = { ...testPosition, id: i, title: `Added Position ${i}` };
            privateCache.set(i, pos);
          }
        },
        // Remove some items
        () => {
          privateCache.delete(3);
          privateCache.delete(7);
        },
        // Check stats
        () => {
          const stats = service.getCacheStats();
          expect(stats.size).toBeGreaterThan(0);
        }
      ];
      
      // Execute mixed operations
      await Promise.all(mixedOps.map(op => Promise.resolve().then(op)));
      
      // Final verification
      const finalStats = service.getCacheStats();
      expect(finalStats.size).toBe(13); // 10 + 5 - 2
      expect(finalStats.keys).not.toContain(3);
      expect(finalStats.keys).not.toContain(7);
      expect(finalStats.keys).toContain(11);
      expect(finalStats.keys).toContain(15);
    });
  });

  test.describe('State Consistency', () => {
    test('should maintain consistent state across operations', async () => {
      const service = createFirebasePositionService();
      const privateCache = (service as any).cache;
      
      // Test state consistency through multiple operations
      let expectedSize = 0;
      
      // Add items and verify size consistency
      for (let batch = 1; batch <= 5; batch++) {
        for (let i = 1; i <= 3; i++) {
          const id = (batch - 1) * 3 + i;
          const pos = { ...testPosition, id, title: `Batch ${batch} Position ${i}` };
          privateCache.set(id, pos);
          expectedSize++;
          
          const stats = service.getCacheStats();
          expect(stats.size).toBe(expectedSize);
          expect(stats.keys).toHaveLength(expectedSize);
        }
      }
      
      // Verify final state
      const finalStats = service.getCacheStats();
      expect(finalStats.size).toBe(15);
      expect(finalStats.keys.sort((a: number, b: number) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });

    test('should verify cache statistics accuracy', async () => {
      const service = createFirebasePositionService();
      const privateCache = (service as any).cache;
      
      // Empty state
      let stats = service.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
      expect(stats.size).toBe(stats.keys.length);
      
      // Add items and verify stats accuracy
      const testIds = [1, 5, 10, 25, 100];
      testIds.forEach(id => {
        const pos = { ...testPosition, id, title: `Stats Test Position ${id}` };
        privateCache.set(id, pos);
      });
      
      stats = service.getCacheStats();
      expect(stats.size).toBe(testIds.length);
      expect(stats.keys).toHaveLength(testIds.length);
      expect(stats.size).toBe(stats.keys.length);
      expect(stats.keys.sort((a: number, b: number) => a - b)).toEqual(testIds.sort((a: number, b: number) => a - b));
      
      // Remove some items
      privateCache.delete(5);
      privateCache.delete(25);
      
      stats = service.getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.keys).toHaveLength(3);
      expect(stats.keys.sort((a: number, b: number) => a - b)).toEqual([1, 10, 100]);
      
      // Clear and verify
      service.clearCache();
      
      stats = service.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });
  });
});