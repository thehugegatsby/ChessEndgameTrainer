/**
 * Emulator Isolation and Cleanup Verification Tests
 * Ensures proper test isolation and emulator cleanup between test runs
 * Tests the Firebase Test Infrastructure's ability to maintain clean state
 */

import { test, expect } from '../firebase-test-fixture';
import { IPositionService } from '@shared/services/database/IPositionService';
import { createFirebasePositionService } from './helpers/firebase-test-setup';
import { EndgamePosition, EndgameCategory } from '@shared/types';

// Test data for isolation verification
const isolationTestPosition: EndgamePosition = {
  id: 42,
  title: 'Isolation Test Position',
  description: 'Position used to verify test isolation',
  fen: '8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1',
  category: 'isolation-test',
  difficulty: 'beginner',
  sideToMove: 'white',
  goal: 'win',
  hints: ['This is an isolation test'],
  solution: ['Qd5+', 'Kf6', 'Qf7#'],
  targetMoves: 3
};

const isolationTestCategory: EndgameCategory = {
  id: 'isolation-test',
  name: 'Isolation Test Category',
  description: 'Category for testing isolation',
  icon: '🧪',
  positions: []
};

test.describe('Emulator Isolation and Cleanup Verification', () => {
  test.describe('Pre-Test State Verification', () => {
    test('should start with completely empty database', async ({ firebaseData, apiClient }) => {
      // Verify database is empty at start
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(0);
      expect(status.collections.categories).toBe(0);
      expect(status.collections.chapters).toBe(0);
      
      // Verify data integrity
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
      expect(integrity.counts.positions).toBe(0);
      expect(integrity.counts.categories).toBe(0);
      expect(integrity.counts.chapters).toBe(0);
    });

    test('should have clean auth state', async ({ firebaseAuth, apiClient }) => {
      // Verify no users exist
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.users || 0).toBe(0);
      
      // Try to create a user to verify auth is working
      const { user } = await firebaseAuth.createUser({
        template: 'BEGINNER'
      });
      
      expect(user).toBeDefined();
      expect(user.uid).toBeTruthy();
      
      // Verify user was created
      const updatedStatus = await apiClient.getFirebaseStatus();
      expect(updatedStatus.collections.users).toBe(1);
    });
  });

  test.describe('State Pollution Detection', () => {
    test('should detect if previous test left data (Test A)', async ({ firebaseData, apiClient }) => {
      // Verify we start clean
      const initialStatus = await apiClient.getFirebaseStatus();
      expect(initialStatus.collections.positions).toBe(0);
      expect(initialStatus.collections.categories).toBe(0);
      
      // Seed test data
      await firebaseData.seedBatch({
        positions: [isolationTestPosition],
        categories: [isolationTestCategory]
      });
      
      // Verify data was seeded
      const afterSeedStatus = await apiClient.getFirebaseStatus();
      expect(afterSeedStatus.collections.positions).toBe(1);
      expect(afterSeedStatus.collections.categories).toBe(1);
      
      // Create position service instance and verify it can read data
      const positionService = createFirebasePositionService();
      const position = await positionService.getPosition(42);
      expect(position).not.toBeNull();
      expect(position!.title).toBe('Isolation Test Position');
      
      // Check cache is populated
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(1);
      expect(cacheStats.keys).toContain(42);
    });

    test('should start completely clean after previous test (Test B)', async ({ firebaseData, apiClient }) => {
      // This test verifies that the cleanup from Test A worked properly
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(0);
      expect(status.collections.categories).toBe(0);
      
      // Verify data integrity
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
      expect(integrity.issues).toHaveLength(0);
      
      // Create new position service and verify no cached data
      const positionService = createFirebasePositionService();
      const position = await positionService.getPosition(42);
      expect(position).toBeNull();
      
      // Check cache is empty
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(0);
      expect(cacheStats.keys).toHaveLength(0);
    });
  });

  test.describe('Parallel Test Isolation', () => {
    test('should handle concurrent test runs without interference (Instance 1)', async ({ firebaseData, apiClient }) => {
      // Each test gets its own isolated environment
      const testId = Math.random().toString(36).substring(7);
      
      const testPosition: EndgamePosition = {
        ...isolationTestPosition,
        id: 100,
        title: `Parallel Test Position ${testId}`,
        category: `parallel-test-${testId}`
      };
      
      await firebaseData.seedBatch({ positions: [testPosition] });
      
      // Verify only our data exists
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(1);
      
      const positionService = createFirebasePositionService();
      const position = await positionService.getPosition(100);
      expect(position).not.toBeNull();
      expect(position!.title).toContain(testId);
    });

    test('should handle concurrent test runs without interference (Instance 2)', async ({ firebaseData, apiClient }) => {
      // This should run in parallel with Instance 1 but in isolated environment
      const testId = Math.random().toString(36).substring(7);
      
      const testPosition: EndgamePosition = {
        ...isolationTestPosition,
        id: 200,
        title: `Parallel Test Position ${testId}`,
        category: `parallel-test-${testId}`
      };
      
      await firebaseData.seedBatch({ positions: [testPosition] });
      
      // Verify only our data exists (shouldn't see Instance 1's data)
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(1);
      
      const positionService = createFirebasePositionService();
      const position = await positionService.getPosition(200);
      expect(position).not.toBeNull();
      expect(position!.title).toContain(testId);
      
      // Verify we can't see Instance 1's data
      const instance1Position = await positionService.getPosition(100);
      expect(instance1Position).toBeNull();
    });
  });

  test.describe('Service Instance Isolation', () => {
    test('should isolate different service instances within same test', async ({ firebaseData }) => {
      // Seed data
      await firebaseData.seedBatch({
        positions: [isolationTestPosition]
      });
      
      // Create first service instance and load data
      const service1 = createFirebasePositionService();
      const position1 = await service1.getPosition(42);
      expect(position1).not.toBeNull();
      
      // Verify cache in first instance
      const cache1Stats = service1.getCacheStats();
      expect(cache1Stats.size).toBe(1);
      
      // Create second service instance
      const service2 = createFirebasePositionService();
      
      // Second instance should have empty cache initially
      const cache2StatsInitial = service2.getCacheStats();
      expect(cache2StatsInitial.size).toBe(0);
      
      // Load same data in second instance
      const position2 = await service2.getPosition(42);
      expect(position2).not.toBeNull();
      expect(position2!.title).toBe(position1!.title);
      
      // Now second instance should have cached data
      const cache2StatsFinal = service2.getCacheStats();
      expect(cache2StatsFinal.size).toBe(1);
      
      // Instances should have independent caches
      service1.clearCache();
      const cache1AfterClear = service1.getCacheStats();
      const cache2AfterService1Clear = service2.getCacheStats();
      
      expect(cache1AfterClear.size).toBe(0);
      expect(cache2AfterService1Clear.size).toBe(1); // Should remain unaffected
    });
  });

  test.describe('Cleanup Verification', () => {
    test('should properly clean auth data', async ({ firebaseAuth, firebaseData, apiClient }) => {
      // Create multiple users with different templates
      const users = await Promise.all([
        firebaseAuth.createUser({ template: 'BEGINNER' }),
        firebaseAuth.createUser({ template: 'INTERMEDIATE' }),
        firebaseAuth.createUser({ template: 'ADVANCED' })
      ]);
      
      // Verify users were created
      let status = await apiClient.getFirebaseStatus();
      expect(status.collections.users).toBe(3);
      
      // Manually trigger auth cleanup
      await firebaseAuth.clearAllUsers();
      
      // Verify auth cleanup
      status = await apiClient.getFirebaseStatus();
      expect(status.collections.users || 0).toBe(0);
      
      // Verify data integrity after auth cleanup
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
    });

    test('should properly clean Firestore data', async ({ firebaseData, apiClient }) => {
      // Seed multiple types of data
      const positions = Array.from({ length: 10 }, (_, i) => ({
        ...isolationTestPosition,
        id: i + 1,
        title: `Test Position ${i + 1}`
      }));
      
      const categories = Array.from({ length: 3 }, (_, i) => ({
        id: `category-${i + 1}`,
        name: `Category ${i + 1}`,
        description: `Test category ${i + 1}`,
        icon: '🔍',
        positions: []
      }));
      
      await firebaseData.seedBatch({ positions, categories });
      
      // Verify data was seeded
      let status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(10);
      expect(status.collections.categories).toBe(3);
      
      // Manually trigger Firestore cleanup
      await firebaseData.clearAll();
      
      // Verify cleanup
      status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(0);
      expect(status.collections.categories).toBe(0);
      
      // Verify data integrity after cleanup
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
      expect(integrity.counts.positions).toBe(0);
      expect(integrity.counts.categories).toBe(0);
    });

    test('should handle cleanup failures gracefully', async ({ firebaseData, apiClient }) => {
      // Seed some data
      await firebaseData.seedBatch({
        positions: [isolationTestPosition]
      });
      
      // Verify data exists
      let status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(1);
      
      // Force cleanup multiple times (should be idempotent)
      await firebaseData.clearAll();
      await firebaseData.clearAll();
      await firebaseData.clearAll();
      
      // Should still be clean
      status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(0);
      
      // Integrity should still be good
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
    });
  });

  test.describe('Memory and Resource Cleanup', () => {
    test('should not accumulate cached data across tests', async ({ firebaseData }) => {
      // Create many position services and load data
      const services: IPositionService[] = [];
      
      // Seed data
      const positions = Array.from({ length: 20 }, (_, i) => ({
        ...isolationTestPosition,
        id: i + 1,
        title: `Memory Test Position ${i + 1}`
      }));
      
      await firebaseData.seedBatch({ positions });
      
      // Create multiple service instances and load data
      for (let i = 0; i < 5; i++) {
        const service = createFirebasePositionService();
        services.push(service);
        
        // Load different subsets of data in each service
        for (let j = i * 4 + 1; j <= (i + 1) * 4; j++) {
          await service.getPosition(j);
        }
        
        // Verify cache is populated
        const cacheStats = service.getCacheStats();
        expect(cacheStats.size).toBe(4);
      }
      
      // Clear all caches
      services.forEach(service => service.clearCache());
      
      // Verify all caches are empty
      services.forEach(service => {
        const cacheStats = service.getCacheStats();
        expect(cacheStats.size).toBe(0);
      });
    });

    test('should handle large datasets without memory issues', async ({ firebaseData, apiClient }) => {
      // Create large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...isolationTestPosition,
        id: i + 1,
        title: `Large Dataset Position ${i + 1}`,
        description: `Large dataset position ${i + 1} with extended description that contains more text to simulate realistic data sizes`,
        hints: Array.from({ length: 5 }, (_, j) => `Hint ${j + 1} for position ${i + 1}`),
        solution: Array.from({ length: 10 }, (_, j) => `Move${j + 1}-${i + 1}`)
      }));
      
      // Seed in batches to avoid timeouts
      for (let i = 0; i < largeDataset.length; i += 20) {
        const batch = largeDataset.slice(i, i + 20);
        await firebaseData.seedBatch({ positions: batch });
      }
      
      // Verify all data was seeded
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(100);
      
      // Create service and load all data
      const positionService = createFirebasePositionService();
      const allPositions = await positionService.getAllPositions();
      expect(allPositions).toHaveLength(100);
      
      // Verify cache is populated
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(100);
      
      // Clear cache
      positionService.clearCache();
      
      // Verify cleanup worked
      const finalCacheStats = positionService.getCacheStats();
      expect(finalCacheStats.size).toBe(0);
    });
  });

  test.describe('Test Fixture Robustness', () => {
    test('should handle fixture initialization failures gracefully', async ({ apiClient }) => {
      // Verify we can always get status (basic connectivity)
      const status = await apiClient.getFirebaseStatus();
      expect(status).toBeDefined();
      expect(status.status).toBeTruthy();
    });

    test('should recover from temporary emulator issues', async ({ firebaseData, apiClient }) => {
      // Test rapid successive operations
      const operations = [];
      
      // Queue many operations simultaneously
      for (let i = 0; i < 10; i++) {
        operations.push(
          firebaseData.seedBatch({
            positions: [{
              ...isolationTestPosition,
              id: i + 1,
              title: `Concurrent Operation ${i + 1}`
            }]
          })
        );
      }
      
      // All should complete successfully
      const results = await Promise.all(operations);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.results).toBeDefined();
      });
      
      // Verify final state
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(10);
      
      // Verify integrity
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
    });
  });
});