/**
 * @file Firebase Service Integration Tests
 * @description Comprehensive Firebase integration tests with emulator
 * 
 * Tests for Issue #83: Firebase service integration test infrastructure
 * Covers User Progress CRUD, Authentication, Real-time updates, and concurrency
 * 
 * @jest-environment node
 */

// Setup fetch for Firebase Auth in Node environment
import '../../setup/firebase-test-setup';

// Path abstraction layer
import { 
  getUserProgressPath, 
  getUserStatsPath, 
  getCardProgressPath 
} from '@tests/utils/firebase-paths';

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  Timestamp
} from 'firebase/firestore';

import {
  initializeTestFirebase,
  createTestUser,
  createAnonymousUser,
  createTestUserWithProgress,
  seedUserProgress,
  clearUserProgressData,
  clearFirestoreData,
  cleanupAllTestFirebase,
  TEST_USER_STATS,
  TEST_CARD_PROGRESS,
  RealtimeTestHelper,
  type TestFirebaseInstance
} from '@tests/utils/firebase-test-helpers';

import { signOut, signInWithEmailAndPassword } from 'firebase/auth';

import { waitForEmulator, isEmulatorRunning } from '@tests/utils/firebase-emulator-api';
import type { UserStats, CardProgress } from '@shared/store/slices/types';

// Increase timeout for integration tests
jest.setTimeout(30000);

describe('Firebase Service Integration', () => {
  let testInstance: TestFirebaseInstance;
  let testUserId: string;
  let realtimeHelper: RealtimeTestHelper;

  beforeAll(async () => {
    // Ensure emulator is running
    const emulatorReady = await isEmulatorRunning();
    if (!emulatorReady) {
      console.log('Waiting for Firebase emulator to start...');
      await waitForEmulator();
    }
    
    // Clear all data before starting tests
    await clearFirestoreData();
  });

  beforeEach(async () => {
    // Create isolated Firebase instance for each test
    testInstance = await initializeTestFirebase();
    realtimeHelper = new RealtimeTestHelper();
    
    // Create authenticated test user
    const userCredential = await createTestUser(testInstance.auth);
    testUserId = userCredential.user.uid;
  });

  afterEach(async () => {
    // Cleanup real-time listeners
    realtimeHelper.cleanup();
    
    // Clear user data BEFORE signing out (needs auth for security rules)
    if (testUserId && testInstance?.db) {
      try {
        await clearUserProgressData(testInstance.db, testUserId);
      } catch (error) {
        // Ignore errors if user data doesn't exist
      }
    }
    
    // Sign out any authenticated user AFTER clearing data
    if (testInstance?.auth) {
      await signOut(testInstance.auth);
    }
  });

  afterAll(async () => {
    // Cleanup all test Firebase instances
    await cleanupAllTestFirebase();
  });

  describe('Firestore CRUD Operations', () => {
    describe('UserStats Operations', () => {
      it('creates user progress document with authentication', async () => {
        const userStats: UserStats = {
          ...TEST_USER_STATS,
          userId: testUserId,
        };
        
        const docRef = doc(testInstance.db, getUserStatsPath(testUserId));
        
        await setDoc(docRef, {
          ...userStats,
          lastActive: serverTimestamp(),
        });
        
        const docSnap = await getDoc(docRef);
        expect(docSnap.exists()).toBe(true);
        expect(docSnap.data()?.userId).toBe(testUserId);
        expect(docSnap.data()?.totalPositionsCompleted).toBe(25);
      });

      it('reads user progress document', async () => {
        await seedUserProgress(testInstance.db, testUserId);
        
        const docRef = doc(testInstance.db, getUserStatsPath(testUserId));
        const docSnap = await getDoc(docRef);
        
        expect(docSnap.exists()).toBe(true);
        expect(docSnap.data()?.totalPositionsCompleted).toBe(25);
        expect(docSnap.data()?.overallSuccessRate).toBe(0.85);
      });

      it('updates user progress document', async () => {
        await seedUserProgress(testInstance.db, testUserId);
        
        const docRef = doc(testInstance.db, getUserStatsPath(testUserId));
        
        await updateDoc(docRef, {
          totalPositionsCompleted: 30,
          overallSuccessRate: 0.90,
          lastActive: serverTimestamp(),
        });
        
        const docSnap = await getDoc(docRef);
        expect(docSnap.data()?.totalPositionsCompleted).toBe(30);
        expect(docSnap.data()?.overallSuccessRate).toBe(0.90);
      });

      it('deletes user progress document', async () => {
        await seedUserProgress(testInstance.db, testUserId);
        
        const docRef = doc(testInstance.db, getUserStatsPath(testUserId));
        await deleteDoc(docRef);
        
        const docSnap = await getDoc(docRef);
        expect(docSnap.exists()).toBe(false);
      });
    });

    describe('CardProgress Operations', () => {
      it('creates multiple card progress documents', async () => {
        const batch = writeBatch(testInstance.db);
        
        TEST_CARD_PROGRESS.forEach((card) => {
          const docRef = doc(
            testInstance.db, 
            `users/${testUserId}/userProgress/${card.id}`
          );
          batch.set(docRef, {
            ...card,
            lastUpdated: serverTimestamp(),
          });
        });
        
        await batch.commit();
        
        // Verify all cards were created
        const progressCollection = collection(
          testInstance.db, 
          `users/${testUserId}/userProgress`
        );
        const snapshot = await getDocs(progressCollection);
        
        // Filter out stats document, count only card documents
        const cardDocs = snapshot.docs.filter(d => d.id !== 'stats');
        expect(cardDocs.length).toBe(TEST_CARD_PROGRESS.length);
      });

      it('queries due cards using where clause', async () => {
        await seedUserProgress(testInstance.db, testUserId, undefined, TEST_CARD_PROGRESS);
        
        const now = Date.now();
        const progressCollection = collection(
          testInstance.db,
          `users/${testUserId}/userProgress`
        );
        
        // Query for due cards (nextReviewAt <= now)
        const dueCardsQuery = query(
          progressCollection,
          where('nextReviewAt', '<=', now)
        );
        
        const snapshot = await getDocs(dueCardsQuery);
        
        // Should find pos-2 which is overdue
        expect(snapshot.size).toBeGreaterThan(0);
        const dueCard = snapshot.docs.find(d => d.id === 'pos-2');
        expect(dueCard).toBeDefined();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('receives real-time updates through onSnapshot for UserStats', (done) => {
      const docRef = doc(testInstance.db, `users/${testUserId}/userProgress/stats`);
      let updateCount = 0;
      
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        updateCount++;
        
        if (updateCount === 1) {
          // Initial empty snapshot
          expect(snapshot.exists()).toBe(false);
          
          // Trigger first write
          setDoc(docRef, {
            ...TEST_USER_STATS,
            userId: testUserId,
            totalPositionsCompleted: 10,
          });
        } else if (updateCount === 2) {
          // After first write
          expect(snapshot.exists()).toBe(true);
          expect(snapshot.data()?.totalPositionsCompleted).toBe(10);
          
          // Trigger update
          updateDoc(docRef, {
            totalPositionsCompleted: 15,
          });
        } else if (updateCount === 3) {
          // After update
          expect(snapshot.data()?.totalPositionsCompleted).toBe(15);
          unsubscribe();
          done();
        }
      });
      
      realtimeHelper.registerListener(unsubscribe);
    });

    it('receives real-time updates for CardProgress collection', (done) => {
      const progressCollection = collection(
        testInstance.db,
        `users/${testUserId}/userProgress`
      );
      
      let snapshotCount = 0;
      
      const unsubscribe = onSnapshot(progressCollection, (snapshot) => {
        snapshotCount++;
        
        if (snapshotCount === 1) {
          // Initial empty collection
          expect(snapshot.empty).toBe(true);
          
          // Add first card
          const card1Ref = doc(progressCollection, 'card-1');
          setDoc(card1Ref, {
            id: 'card-1',
            nextReviewAt: Date.now() + 86400000,
            lastReviewedAt: Date.now(),
            interval: 1,
            repetition: 1,
            efactor: 2.5,
            lapses: 0,
          });
        } else if (snapshotCount === 2) {
          // After first card added
          expect(snapshot.size).toBe(1);
          
          // Add second card
          const card2Ref = doc(progressCollection, 'card-2');
          setDoc(card2Ref, {
            id: 'card-2',
            nextReviewAt: Date.now() + 172800000,
            lastReviewedAt: Date.now(),
            interval: 2,
            repetition: 2,
            efactor: 2.4,
            lapses: 1,
          });
        } else if (snapshotCount === 3) {
          // After second card added
          expect(snapshot.size).toBe(2);
          unsubscribe();
          done();
        }
      });
      
      realtimeHelper.registerListener(unsubscribe);
    });
  });

  describe('Authentication & Security', () => {
    it('allows user to access only their own progress data', async () => {
      // Create first user with progress
      const { userId: userId1 } = await createTestUserWithProgress(
        testInstance,
        'user1@test.com'
      );
      
      // Sign out user1
      await signOut(testInstance.auth);
      
      // Create and sign in as user2
      const userCredential2 = await createTestUser(
        testInstance.auth,
        'user2@test.com'
      );
      const userId2 = userCredential2.user.uid;
      
      // Now as user2, try to read user1's data (should fail with security rules)
      const user1DocRef = doc(
        testInstance.db,
        getUserStatsPath(userId1)
      );
      
      // This should fail with security rules enabled
      await expect(getDoc(user1DocRef)).rejects.toThrow();
      
      // User2 should be able to write and read their own data
      await seedUserProgress(testInstance.db, userId2);
      const user2DocRef = doc(testInstance.db, getUserStatsPath(userId2));
      const user2Doc = await getDoc(user2DocRef);
      
      expect(user2Doc.exists()).toBe(true);
      expect(user2Doc.data()?.userId).toBe(userId2);
    });

    it('supports anonymous user progress tracking', async () => {
      const anonCredential = await createAnonymousUser(testInstance.auth);
      const anonUserId = anonCredential.user.uid;
      
      await seedUserProgress(
        testInstance.db,
        anonUserId,
        { userId: anonUserId }
      );
      
      const docRef = doc(
        testInstance.db,
        `users/${anonUserId}/userProgress/stats`
      );
      const docSnap = await getDoc(docRef);
      
      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()?.userId).toBe(anonUserId);
    });
  });

  describe('Concurrent Operations', () => {
    it('handles concurrent updates to the same document', async () => {
      const docRef = doc(
        testInstance.db,
        `users/${testUserId}/userProgress/stats`
      );
      
      // Set initial value
      await setDoc(docRef, {
        ...TEST_USER_STATS,
        userId: testUserId,
        totalPositionsCompleted: 0,
      });
      
      // Simulate concurrent updates
      const updates = Array.from({ length: 5 }, (_, i) => 
        updateDoc(docRef, {
          totalPositionsCompleted: i + 1,
          lastActive: serverTimestamp(),
        })
      );
      
      await Promise.all(updates);
      
      // Check final state
      const finalDoc = await getDoc(docRef);
      expect(finalDoc.exists()).toBe(true);
      expect(finalDoc.data()?.totalPositionsCompleted).toBeDefined();
      expect(typeof finalDoc.data()?.totalPositionsCompleted).toBe('number');
    });

    it('handles batch operations with multiple cards', async () => {
      const batch = writeBatch(testInstance.db);
      
      // Create 10 cards in a batch
      for (let i = 0; i < 10; i++) {
        const cardRef = doc(
          testInstance.db,
          `users/${testUserId}/userProgress/card-${i}`
        );
        
        batch.set(cardRef, {
          id: `card-${i}`,
          nextReviewAt: Date.now() + (i * 86400000), // Stagger by days
          lastReviewedAt: Date.now(),
          interval: i + 1,
          repetition: 1,
          efactor: 2.5,
          quality: 4,
          lastUpdated: serverTimestamp(),
        });
      }
      
      await batch.commit();
      
      // Verify all cards were created
      const progressCollection = collection(
        testInstance.db,
        `users/${testUserId}/userProgress`
      );
      const snapshot = await getDocs(progressCollection);
      
      expect(snapshot.size).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('handles invalid document paths gracefully', async () => {
      // Test invalid path construction
      expect(() => {
        // This creates an invalid path with empty segment
        doc(testInstance.db, 'users', '', 'userProgress', 'stats');
      }).toThrow('Invalid document reference');
    });

    it('handles missing required fields', async () => {
      const docRef = doc(
        testInstance.db,
        `users/${testUserId}/userProgress/stats`
      );
      
      // Missing required userId field
      const invalidStats = {
        totalPositionsCompleted: 10,
        // userId missing
      };
      
      // This should succeed at Firestore level but fail validation in app
      await setDoc(docRef, invalidStats);
      
      const docSnap = await getDoc(docRef);
      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()?.userId).toBeUndefined();
    });
  });

  describe('Multi-device Sync Scenarios', () => {
    it('simulates progress sync between multiple devices', async () => {
      const statsDocRef = doc(
        testInstance.db,
        `users/${testUserId}/userProgress/stats`
      );
      
      // Device A initial write
      await setDoc(statsDocRef, {
        ...TEST_USER_STATS,
        userId: testUserId,
        totalPositionsCompleted: 10,
        device: 'A',
        lastActive: Timestamp.fromMillis(Date.now()),
      });
      
      // Device B reads current state
      const deviceBRead = await getDoc(statsDocRef);
      expect(deviceBRead.data()?.totalPositionsCompleted).toBe(10);
      
      // Device B updates
      await updateDoc(statsDocRef, {
        totalPositionsCompleted: 15,
        device: 'B',
        lastActive: Timestamp.fromMillis(Date.now() + 1000),
      });
      
      // Device A reads updated state
      const deviceARead = await getDoc(statsDocRef);
      expect(deviceARead.data()?.totalPositionsCompleted).toBe(15);
      expect(deviceARead.data()?.device).toBe('B');
    });

    it('handles conflicting card progress updates', async () => {
      const cardRef = doc(
        testInstance.db,
        `users/${testUserId}/userProgress/card-1`
      );
      
      // Initial card state
      await setDoc(cardRef, {
        id: 'card-1',
        nextReviewAt: Date.now() + 86400000,
        lastReviewedAt: Date.now(),
        interval: 1,
        repetition: 1,
        efactor: 2.5,
        quality: 4,
      });
      
      // Simulate two devices updating the same card
      const device1Update = updateDoc(cardRef, {
        lapses: 0,
        repetition: 2,
        lastReviewedAt: Timestamp.fromMillis(Date.now() + 1000),
      });
      
      const device2Update = updateDoc(cardRef, {
        quality: 3,
        repetition: 2,
        lastReviewedAt: Timestamp.fromMillis(Date.now() + 2000),
      });
      
      // Both updates should succeed (last write wins)
      await Promise.all([device1Update, device2Update]);
      
      const finalState = await getDoc(cardRef);
      expect(finalState.exists()).toBe(true);
      expect(finalState.data()?.repetition).toBe(2);
      // Lapses will be either 0 or 1 depending on timing
      expect([0, 1]).toContain(finalState.data()?.lapses);
    });
  });
});