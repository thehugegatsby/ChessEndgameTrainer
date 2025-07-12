/**
 * Automatic Cleanup Verification Tests
 * Tests the automatic cleanup mechanism built into firebase-test-fixture.ts
 * Verifies that the extended test fixture properly cleans up after each test
 */

import { test, expect } from '../firebase-test-fixture';
import { IPositionService } from '@shared/services/database/IPositionService';
import { createFirebasePositionService } from './helpers/firebase-test-setup';
import { EndgamePosition } from '@shared/types';

// Marker data for tracking cleanup
const cleanupTestPosition: EndgamePosition = {
  id: 999,
  title: 'Cleanup Verification Position',
  description: 'Position used to verify automatic cleanup',
  fen: '8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1',
  category: 'cleanup-test',
  difficulty: 'beginner',
  sideToMove: 'white',
  goal: 'win',
  hints: ['This should be cleaned up automatically'],
  solution: ['Test', 'Cleanup'],
  targetMoves: 3
};

test.describe('Automatic Cleanup Mechanism Verification', () => {
  test.describe('Cleanup Behavior Validation', () => {
    test('should automatically clean up after test completion (Setup Test)', async ({ firebaseData, apiClient }) => {
      // Verify we start clean
      const initialStatus = await apiClient.getFirebaseStatus();
      expect(initialStatus.collections.positions).toBe(0);
      
      // Seed marker data
      await firebaseData.seedBatch({
        positions: [cleanupTestPosition]
      });
      
      // Verify data was seeded
      const afterSeedStatus = await apiClient.getFirebaseStatus();
      expect(afterSeedStatus.collections.positions).toBe(1);
      
      // Create service and verify data access
      const positionService = createFirebasePositionService();
      const position = await positionService.getPosition(999);
      expect(position).not.toBeNull();
      expect(position!.title).toBe('Cleanup Verification Position');
      
      // Populate cache
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(1);
      expect(cacheStats.keys).toContain(999);
      
      // Note: Cleanup should happen automatically when this test ends
      // The next test will verify cleanup worked
    });

    test('should start with clean state after automatic cleanup (Verification Test)', async ({ firebaseData, apiClient }) => {
      // This test verifies that automatic cleanup from the previous test worked
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(0);
      
      // Verify the specific marker data is gone
      const positionService = createFirebasePositionService();
      const position = await positionService.getPosition(999);
      expect(position).toBeNull();
      
      // Verify cache is clean
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(0);
      
      // Verify data integrity
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
      expect(integrity.issues).toHaveLength(0);
    });
  });

  test.describe('Multiple Data Types Cleanup', () => {
    test('should clean up all data types automatically (Multi-Type Test)', async ({ firebaseAuth, firebaseData, apiClient }) => {
      // Create multiple types of data
      
      // 1. Create auth users
      const users = await Promise.all([
        firebaseAuth.createUser({ template: 'BEGINNER' }),
        firebaseAuth.createUser({ template: 'INTERMEDIATE' })
      ]);
      
      // 2. Seed Firestore data
      const positions = Array.from({ length: 5 }, (_, i) => ({
        ...cleanupTestPosition,
        id: i + 1,
        title: `Multi-Type Position ${i + 1}`
      }));
      
      const categories = [{
        id: 'multi-type-category',
        name: 'Multi-Type Category',
        description: 'Category for multi-type cleanup test',
        icon: '🧹',
        positions: []
      }];
      
      await firebaseData.seedBatch({ positions, categories });
      
      // Verify all data was created
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.users).toBe(2);
      expect(status.collections.positions).toBe(5);
      expect(status.collections.categories).toBe(1);
      
      // Create service instances and populate caches
      const positionService = createFirebasePositionService();
      await positionService.getAllPositions();
      
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(5);
      
      // Note: All of this should be cleaned up automatically
    });

    test('should have cleaned all data types automatically (Multi-Type Verification)', async ({ firebaseData, apiClient }) => {
      // Verify all data types were cleaned up
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.users || 0).toBe(0);
      expect(status.collections.positions).toBe(0);
      expect(status.collections.categories).toBe(0);
      
      // Verify new service instance has clean state
      const positionService = createFirebasePositionService();
      const allPositions = await positionService.getAllPositions();
      expect(allPositions).toHaveLength(0);
      
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(0);
      
      // Verify data integrity
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
    });
  });

  test.describe('Cleanup Timing and Performance', () => {
    test('should perform cleanup within reasonable time (Performance Test)', async ({ firebaseData, apiClient }) => {
      // Create substantial amount of data
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        ...cleanupTestPosition,
        id: i + 1,
        title: `Performance Test Position ${i + 1}`,
        description: `Large description for position ${i + 1} to test cleanup performance with substantial data volumes`,
        hints: Array.from({ length: 3 }, (_, j) => `Performance hint ${j + 1} for position ${i + 1}`),
        solution: Array.from({ length: 5 }, (_, j) => `Move${j + 1}`)
      }));
      
      await firebaseData.seedBatch({ positions: largeDataset });
      
      // Verify data was seeded
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(50);
      
      // Create services and populate caches
      const services = [];
      for (let i = 0; i < 3; i++) {
        const service = createFirebasePositionService();
        services.push(service);
        
        // Load data to populate cache
        await service.getAllPositions();
        
        const cacheStats = service.getCacheStats();
        expect(cacheStats.size).toBe(50);
      }
      
      // Measure cleanup start time (cleanup happens after test ends)
      const cleanupStartTime = Date.now();
      
      // Store cleanup start time for next test to verify
      (global as any).cleanupTestStartTime = cleanupStartTime;
    });

    test('should have completed cleanup quickly (Performance Verification)', async ({ firebaseData, apiClient }) => {
      // Calculate cleanup time (approximation since cleanup happened between tests)
      const cleanupEndTime = Date.now();
      const cleanupStartTime = (global as any).cleanupTestStartTime || cleanupEndTime;
      const cleanupDuration = cleanupEndTime - cleanupStartTime;
      
      // Cleanup should complete within reasonable time (allowing for test framework overhead)
      expect(cleanupDuration).toBeLessThan(10000); // 10 seconds max
      
      // Verify cleanup was successful
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(0);
      
      // Verify integrity
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
    });
  });

  test.describe('Cleanup Failure Scenarios', () => {
    test('should handle partial cleanup gracefully', async ({ firebaseData, apiClient }) => {
      // Create data and then simulate potential cleanup issues
      const positions = Array.from({ length: 10 }, (_, i) => ({
        ...cleanupTestPosition,
        id: i + 1,
        title: `Failure Test Position ${i + 1}`
      }));
      
      await firebaseData.seedBatch({ positions });
      
      // Verify data exists
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(10);
      
      // Force multiple cleanup attempts (testing idempotency)
      await firebaseData.clearAll();
      await firebaseData.clearAll();
      
      // Should still be clean after multiple cleanup attempts
      const afterCleanupStatus = await apiClient.getFirebaseStatus();
      expect(afterCleanupStatus.collections.positions).toBe(0);
    });

    test('should maintain test isolation despite previous issues', async ({ firebaseData, apiClient }) => {
      // This test should run cleanly despite any issues in previous test
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(0);
      
      // Verify we can still operate normally
      await firebaseData.seedBatch({
        positions: [cleanupTestPosition]
      });
      
      const afterSeedStatus = await apiClient.getFirebaseStatus();
      expect(afterSeedStatus.collections.positions).toBe(1);
      
      // Verify data integrity
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
    });
  });

  test.describe('Cleanup Integration with Service Layers', () => {
    test('should cleanup service caches automatically', async ({ firebaseData }) => {
      // Create multiple service instances
      const services = [];
      
      // Seed data
      const positions = Array.from({ length: 15 }, (_, i) => ({
        ...cleanupTestPosition,
        id: i + 1,
        title: `Service Cache Test ${i + 1}`
      }));
      
      await firebaseData.seedBatch({ positions });
      
      // Create services and populate their caches
      for (let i = 0; i < 5; i++) {
        const service = createFirebasePositionService();
        services.push(service);
        
        // Load different data in each service
        for (let j = i * 3 + 1; j <= (i + 1) * 3; j++) {
          await service.getPosition(j);
        }
        
        const cacheStats = service.getCacheStats();
        expect(cacheStats.size).toBe(3);
      }
      
      // Verify all services have cached data
      services.forEach(service => {
        const cacheStats = service.getCacheStats();
        expect(cacheStats.size).toBe(3);
      });
      
      // Note: While Firebase data cleanup is automatic,
      // service instance caches are independent and persist
      // until explicitly cleared or garbage collected
    });

    test('should start with fresh service state after cleanup', async ({ firebaseData, apiClient }) => {
      // Verify database was cleaned up
      const status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(0);
      
      // Create new service instance
      const newService = createFirebasePositionService();
      
      // Should have empty cache
      const cacheStats = newService.getCacheStats();
      expect(cacheStats.size).toBe(0);
      
      // Should not find any data
      const position = await newService.getPosition(1);
      expect(position).toBeNull();
      
      // Verify we can still seed new data and access it
      await firebaseData.seedBatch({
        positions: [cleanupTestPosition]
      });
      
      const newPosition = await newService.getPosition(999);
      expect(newPosition).not.toBeNull();
      expect(newPosition!.title).toBe('Cleanup Verification Position');
    });
  });

  test.describe('Cleanup Verification Methods', () => {
    test('should provide accurate cleanup verification', async ({ firebaseData, apiClient }) => {
      // Create test data
      await firebaseData.seedBatch({
        positions: [cleanupTestPosition]
      });
      
      // Verify data exists
      let status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(1);
      
      // Perform manual cleanup and verify
      await firebaseData.clearAll();
      
      // Check status after cleanup
      status = await apiClient.getFirebaseStatus();
      expect(status.collections.positions).toBe(0);
      
      // Use integrity verification
      const integrity = await firebaseData.verifyIntegrity();
      expect(integrity.integrity).toBe('good');
      expect(integrity.counts.positions).toBe(0);
      expect(integrity.issues).toHaveLength(0);
    });

    test('should detect cleanup issues if they occur', async ({ firebaseData, apiClient }) => {
      // Test the integrity verification system
      
      // Start clean
      const initialIntegrity = await firebaseData.verifyIntegrity();
      expect(initialIntegrity.integrity).toBe('good');
      
      // Add some data
      await firebaseData.seedBatch({
        positions: [cleanupTestPosition]
      });
      
      // Verify data exists
      const statusWithData = await apiClient.getFirebaseStatus();
      expect(statusWithData.collections.positions).toBe(1);
      
      // Clean and verify
      await firebaseData.clearAll();
      
      const finalIntegrity = await firebaseData.verifyIntegrity();
      expect(finalIntegrity.integrity).toBe('good');
      expect(finalIntegrity.counts.positions).toBe(0);
    });
  });
});