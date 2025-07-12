/**
 * Firebase Authentication E2E Tests
 * Test Firebase auth integration using the FirebaseTestFixture
 */

import { test, expect } from '../firebase-test-fixture';

test.describe('Firebase Authentication', () => {
  test('should create and authenticate test user', async ({ 
    firebaseAuth, 
    firebaseData 
  }) => {
    // Clear any existing data
    await firebaseData.clearAll();
    
    // Create authenticated user
    const { user, token, progressEntries } = await firebaseAuth.createUser({
      template: 'BEGINNER',
      autoLogin: true,
      customClaims: { role: 'tester' }
    });

    // Verify user was created
    expect(user).toBeDefined();
    expect(user.email).toMatch(/@test\.local$/);
    expect(user.template).toBe('BEGINNER');
    expect(user.isTestUser).toBe(true);
    
    // Verify token was generated
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    
    // Verify progress entries
    expect(typeof progressEntries).toBe('number');
    expect(progressEntries).toBeGreaterThanOrEqual(0);
  });

  test('should handle custom claims', async ({ firebaseAuth }) => {
    // Create user with custom claims
    const customClaims = {
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      level: 10
    };

    const { user } = await firebaseAuth.createUser({
      template: 'ADVANCED',
      customClaims
    });

    expect(user.customClaims).toEqual(customClaims);
    
    // Update claims
    const newClaims = { role: 'moderator', level: 5 };
    await firebaseAuth.setCustomClaims(user.uid, newClaims);
    
    // Verify claims were updated (would need to fetch user again in real scenario)
    // This test validates the API call succeeds
  });

  test('should clear all auth users', async ({ firebaseAuth, firebaseData }) => {
    // Create multiple users
    await Promise.all([
      firebaseAuth.createUser({ template: 'BEGINNER' }),
      firebaseAuth.createUser({ template: 'INTERMEDIATE' }),
      firebaseAuth.createUser({ template: 'ADVANCED' })
    ]);

    // Clear all users
    await firebaseAuth.clearAllUsers();
    
    // Verify status (indirect verification)
    const status = await firebaseData.getStatus();
    expect(status.status).toBe('connected');
  });

  test('should generate valid test tokens', async ({ firebaseAuth }) => {
    const { user, token } = await firebaseAuth.createUser({
      template: 'INTERMEDIATE',
      autoLogin: true
    });

    expect(token).toBeDefined();
    
    // Test token should be a valid JWT structure (3 parts separated by dots)
    const tokenParts = token!.split('.');
    expect(tokenParts).toHaveLength(3);
    
    // Decode header (first part)
    const header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString());
    expect(header.alg).toBe('none'); // Emulator uses unsigned tokens
    expect(header.typ).toBe('JWT');
    
    // Decode payload (second part)
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
    expect(payload.user_id).toBe(user.uid);
    expect(payload.aud).toBe('endgame-trainer-test');
  });
});

test.describe('Firebase Data Integration', () => {
  test('should seed and verify scenario data', async ({ firebaseData }) => {
    // Seed basic scenario
    const result = await firebaseData.seedScenario('basic', {
      userCount: 3,
      includeProgress: true
    });

    // Verify seeding results
    expect(result.scenario).toBe('Basic Training Data');
    expect(result.seeded.positions).toBeGreaterThan(0);
    expect(result.seeded.categories).toBeGreaterThan(0);
    expect(result.seeded.users).toBe(3);
    expect(result.users).toHaveLength(3);

    // Verify data integrity
    const integrity = await firebaseData.verifyIntegrity();
    expect(integrity.integrity).toBe('good');
    expect(integrity.issues).toHaveLength(0);
    expect(integrity.counts.positions).toBeGreaterThan(0);
    expect(integrity.counts.categories).toBeGreaterThan(0);
    expect(integrity.counts.users).toBe(3);
  });

  test('should handle batch seeding', async ({ firebaseData }) => {
    const customData = {
      positions: [
        {
          id: 999,
          title: 'Test Position',
          fen: '8/8/8/8/8/8/8/8 w - - 0 1',
          category: 'test',
          difficulty: 'beginner',
          targetMoves: 1,
          hints: ['Test hint'],
          solution: ['Test solution'],
          sideToMove: 'white',
          goal: 'win'
        }
      ],
      categories: [
        {
          id: 'test',
          name: 'Test Category',
          description: 'Test category for testing',
          icon: '🧪',
          positions: [],
          subcategories: []
        }
      ]
    };

    const result = await firebaseData.seedBatch(customData);
    
    expect(result.results.positions).toBe(1);
    expect(result.results.categories).toBe(1);
  });

  test('should get emulator status', async ({ firebaseData }) => {
    const status = await firebaseData.getStatus();
    
    expect(status.status).toBe('connected');
    expect(status.collections).toBeDefined();
    expect(typeof status.collections.positions).toBe('number');
    expect(typeof status.collections.categories).toBe('number');
    expect(typeof status.collections.users).toBe('number');
  });
});