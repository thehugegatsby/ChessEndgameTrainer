/**
 * Firebase Infrastructure Smoke Test
 * Verifies that all Firebase test infrastructure is working
 */

import { test, expect } from '../fixtures/firebase-fixtures';
import { collection, addDoc, getDocs } from 'firebase/firestore';

test.describe('Firebase Infrastructure', () => {
  test('should connect to Firestore emulator', async ({ firebaseEnv }) => {
    // Test basic Firestore operations
    const testCollection = collection(firebaseEnv.db, 'test-collection');
    
    // Add a document
    const docRef = await addDoc(testCollection, {
      name: 'Test Document',
      timestamp: new Date()
    });
    
    expect(docRef.id).toBeTruthy();
    
    // Read documents
    const snapshot = await getDocs(testCollection);
    expect(snapshot.size).toBe(1);
    
    const doc = snapshot.docs[0];
    expect(doc.data().name).toBe('Test Document');
  });

  test('should use test API client', async ({ testApiClient }) => {
    // Test API health check
    const health = await testApiClient.health();
    expect(health.status).toBe('ok');
    expect(health.environment).toBe('test');
  });

  test('should seed positions via Test API', async ({ firebaseEnv, testApiClient }) => {
    // Clear data first
    await testApiClient.clearFirestore();
    
    // Seed test positions
    const positions = [
      {
        id: 100,
        title: 'Infrastructure Test Position',
        fen: '8/8/8/8/8/8/8/8 w - - 0 1',
        category: 'test',
        difficulty: 'beginner' as const,
        targetMoves: 1,
        description: 'Empty board for testing'
      }
    ];
    
    await testApiClient.seedPositions(positions);
    
    // Verify via Firestore
    const positionsRef = collection(firebaseEnv.db, 'positions');
    const snapshot = await getDocs(positionsRef);
    
    expect(snapshot.size).toBeGreaterThanOrEqual(1);
    
    const testPosition = snapshot.docs.find(doc => doc.id === '100');
    expect(testPosition).toBeTruthy();
    expect(testPosition?.data().title).toBe('Infrastructure Test Position');
  });

  test('should have test user fixture', async ({ testUser }) => {
    expect(testUser.uid).toBeTruthy();
    expect(testUser.email).toContain('@');
    expect(testUser.password).toBeTruthy();
  });

  test('should navigate to app', async ({ page }) => {
    await page.goto('/');
    
    // Check if Next.js app loaded
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/infrastructure-home.png' });
  });
});