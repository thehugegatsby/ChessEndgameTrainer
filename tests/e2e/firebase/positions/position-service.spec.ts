/**
 * PositionService Firebase Integration Tests
 * Tests the real Firestore queries with emulator
 */

import { test, expect } from '../fixtures/firebase-fixtures';
import { TrainingPage } from '../../../pages/TrainingPage';
import { positionService } from '@shared/services/database/positionService';
import { PositionFactory } from '../../../factories/PositionFactory';
import { collection, doc, setDoc } from 'firebase/firestore';

test.describe('PositionService with Firebase', () => {
  test.beforeEach(async ({ firebaseEnv }) => {
    // Clear cache to ensure fresh data
    positionService.clearCache();
  });

  test('should fetch position from Firestore emulator', async ({ firebaseEnv, page, testApiClient }) => {
    // ARRANGE: Add test position via Test API
    const testPosition = PositionFactory.createEndgame({
      id: 999,
      title: 'Firebase Test Position',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    });
    
    // Use test API to seed the position
    await testApiClient.seedPositions([testPosition]);

    // ACT: Navigate to page which will use positionService
    await page.goto('/train/999');
    
    // Wait for position to be loaded
    await page.waitForSelector('[data-testid="position-title"]', { timeout: 5000 });

    // ASSERT: Verify position was displayed correctly
    const title = await page.textContent('[data-testid="position-title"]');
    expect(title).toContain('Firebase Test Position');
  });

  test('should handle missing positions gracefully', async ({ firebaseEnv }) => {
    // ACT: Try to fetch non-existent position
    const result = await positionService.getPosition(99999);

    // ASSERT: Should return null without throwing
    expect(result).toBeNull();
  });

  test('should fetch all positions with pagination', async ({ firebaseEnv }) => {
    // ARRANGE: Create multiple test positions
    const positions = Array.from({ length: 5 }, (_, i) => 
      PositionFactory.createEndgame({
        id: 1000 + i,
        title: `Pagination Test ${i + 1}`
      })
    );

    // Add all positions to Firestore
    for (const position of positions) {
      const ref = doc(firebaseEnv.db, 'positions', position.id.toString());
      await setDoc(ref, position);
    }

    // ACT: Fetch all positions
    const allPositions = await positionService.getAllPositions();

    // ASSERT: Should include our test positions
    const testPositions = allPositions.filter(p => p.id >= 1000 && p.id < 1005);
    expect(testPositions).toHaveLength(5);
    expect(testPositions[0].title).toContain('Pagination Test');
  });

  test('should filter positions by category', async ({ firebaseEnv }) => {
    // ARRANGE: Create positions with different categories
    const rookPosition = PositionFactory.createEndgame({
      id: 2001,
      category: 'rook-endgames',
      title: 'Rook Endgame Test'
    });
    
    const pawnPosition = PositionFactory.createEndgame({
      id: 2002,
      category: 'pawn-endgames',
      title: 'Pawn Endgame Test'
    });

    await setDoc(doc(firebaseEnv.db, 'positions', rookPosition.id.toString()), rookPosition);
    await setDoc(doc(firebaseEnv.db, 'positions', pawnPosition.id.toString()), pawnPosition);

    // ACT: Filter by category
    const rookEndgames = await positionService.getPositionsByCategory('rook-endgames');

    // ASSERT: Should only return rook endgames
    const testRookEndgames = rookEndgames.filter(p => p.id >= 2000);
    expect(testRookEndgames).toHaveLength(1);
    expect(testRookEndgames[0].title).toBe('Rook Endgame Test');
  });

  test('should validate and sanitize FEN from Firestore', async ({ firebaseEnv }) => {
    // ARRANGE: Add position with potentially malicious FEN
    const maliciousPosition = {
      id: 3001,
      title: 'XSS Test Position',
      fen: '<script>alert("xss")</script>',
      category: 'test',
      difficulty: 'beginner'
    };

    await setDoc(
      doc(firebaseEnv.db, 'positions', maliciousPosition.id.toString()), 
      maliciousPosition
    );

    // ACT: Try to fetch the position
    const result = await positionService.getPosition(3001);

    // ASSERT: Should return null due to invalid FEN
    expect(result).toBeNull();
  });

  test('should work with Training Page integration', async ({ page, firebaseEnv }) => {
    // ARRANGE: Seed a training position
    const trainingPosition = PositionFactory.createEndgame({
      id: 4001,
      title: 'Integration Test Position',
      fen: '4k3/8/4K3/8/8/8/8/8 w - - 0 1'
    });

    await setDoc(
      doc(firebaseEnv.db, 'positions', trainingPosition.id.toString()), 
      trainingPosition
    );

    // ACT: Navigate to training page with this position
    const trainingPage = new TrainingPage(page);
    await page.goto(`/train/${trainingPosition.id}`);
    await trainingPage.waitForPageLoad();

    // ASSERT: Position should be loaded
    const title = await trainingPage.getPositionTitle();
    expect(title).toBe('Integration Test Position');
    
    const fen = await trainingPage.getCurrentFEN();
    expect(fen).toBe('4k3/8/4K3/8/8/8/8/8 w - - 0 1');
  });

  test('should handle concurrent reads efficiently', async ({ firebaseEnv }) => {
    // ARRANGE: Create a test position
    const position = PositionFactory.createEndgame({ id: 5001 });
    await setDoc(doc(firebaseEnv.db, 'positions', position.id.toString()), position);

    // ACT: Make multiple concurrent requests
    const promises = Array.from({ length: 10 }, () => 
      positionService.getPosition(5001)
    );
    
    const start = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    // ASSERT: All requests should succeed quickly
    expect(results.every(r => r?.id === 5001)).toBe(true);
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    
    // Cache should be working
    const cacheStats = positionService.getCacheStats();
    expect(cacheStats.keys).toContain(5001);
  });
});

test.describe('Firebase Cleanup Verification', () => {
  test('should clean up data between tests', async ({ firebaseEnv }) => {
    // This test verifies that clearFirestore() in beforeEach works
    const { db } = firebaseEnv;
    const positionsCollection = collection(db, 'positions');
    const { getDocs } = await import('firebase/firestore');
    
    const snapshot = await getDocs(positionsCollection);
    
    // Should only have seeded test data, not data from previous tests
    const ids = snapshot.docs.map(doc => parseInt(doc.id));
    const hasTestDataFromPreviousTests = ids.some(id => id >= 999);
    
    expect(hasTestDataFromPreviousTests).toBe(false);
  });
});