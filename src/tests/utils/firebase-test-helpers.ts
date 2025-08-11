/**
 * Firebase Test Helpers
 * Utilities for setting up and managing test data in Firebase Emulator
 * 
 * Enhanced with Authentication support and User Progress testing infrastructure
 * for Issue #83 - Firebase service integration test infrastructure
 */

import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { 
  getAuth, 
  connectAuthEmulator, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type UserCredential,
  type User
} from "firebase/auth";
import {
  type EndgamePosition,
  type EndgameCategory,
  type EndgameChapter,
} from "@shared/types/endgame";
import type { UserStats, CardProgress } from "@shared/store/slices/types";
import { clearAllEmulatorData } from "./firebase-emulator-api";

// Test Firebase configuration for emulator
const TEST_CONFIG = {
  projectId: process.env['TEST_PROJECT_ID'] || "endgame-trainer-test",
  apiKey: "test-api-key",
  authDomain: "localhost",
};

// Remove global singletons to prevent test isolation issues
// Each test should create its own Firebase instance
export interface TestFirebaseInstance {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

// Track all test instances for cleanup
const testInstances: TestFirebaseInstance[] = [];

/**
 * Initialize Firebase for tests with emulator - creates isolated instance
 * @param instanceName - Optional unique name for the app instance (defaults to timestamp)
 * @returns Test Firebase instance with app, db, and auth
 */
export async function initializeTestFirebase(
  instanceName?: string
): Promise<TestFirebaseInstance> {
  // Create unique instance name to prevent conflicts
  const appName = instanceName || `test-app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Initialize test app with unique name
  const app = initializeApp(TEST_CONFIG, appName);
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  // Connect to Firestore emulator
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (error: any) {
    // Only ignore "already connected" errors, throw real connection failures
    if (!error.message?.includes("already connected")) {
      console.error("Failed to connect to Firestore emulator:", error);
      throw error;
    }
  }
  
  // Connect to Auth emulator  
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  } catch (error: any) {
    // Only ignore "already connected" errors
    if (!error.message?.includes("already initialized")) {
      console.error("Failed to connect to Auth emulator:", error);
      throw error;
    }
  }
  
  const instance = { app, db, auth };
  testInstances.push(instance);
  
  return instance;
}

/**
 * Create and authenticate a test user
 * @param email - Optional email (defaults to random)
 * @param password - Optional password (defaults to "testpass123")
 * @returns UserCredential with authenticated user
 */
export async function createTestUser(
  auth: Auth,
  email?: string,
  password?: string
): Promise<UserCredential> {
  const testEmail = email || `test-${Date.now()}@example.com`;
  const testPassword = password || "testpass123";
  
  try {
    // Try to create new user
    return await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  } catch (error: any) {
    // If user exists, sign in instead
    if (error.code === "auth/email-already-in-use") {
      return await signInWithEmailAndPassword(auth, testEmail, testPassword);
    }
    throw error;
  }
}

/**
 * Create anonymous test user for quick testing
 * @param auth - Auth instance
 * @returns UserCredential with anonymous user
 */
export async function createAnonymousUser(auth: Auth): Promise<UserCredential> {
  return await signInAnonymously(auth);
}

/**
 * Clear all data from Firebase emulators - optimized version
 * Uses REST API for atomic clearing of both Firestore and Auth
 */
export async function clearFirestoreData(): Promise<void> {
  // Use the atomic cleanup method for both emulators
  await clearAllEmulatorData();
}

/**
 * Clear user-specific progress data
 * @param db - Firestore instance
 * @param userId - User ID to clear data for
 */
export async function clearUserProgressData(
  db: Firestore,
  userId: string
): Promise<void> {
  const userProgressRef = collection(db, `users/${userId}/userProgress`);
  const snapshot = await getDocs(userProgressRef);
  
  if (snapshot.empty) return;
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

// ========== USER PROGRESS TEST FIXTURES ==========

/**
 * Test UserStats fixture
 */
export const TEST_USER_STATS: UserStats = {
  userId: "test-user-123",
  totalPositionsCompleted: 25,
  overallSuccessRate: 0.85,
  totalTimeSpent: 3600000, // 1 hour in ms
  totalHintsUsed: 5,
  lastActive: Date.now(),
};

/**
 * Test CardProgress fixtures for spaced repetition
 */
export const TEST_CARD_PROGRESS: CardProgress[] = [
  {
    id: "pos-1",
    nextReviewAt: Date.now() + 86400000, // Due in 1 day
    lastReviewedAt: Date.now(),
    interval: 1,
    repetition: 1,
    efactor: 2.5,
    lapses: 0,
  },
  {
    id: "pos-2", 
    nextReviewAt: Date.now() - 3600000, // Overdue by 1 hour
    lastReviewedAt: Date.now() - 90000000,
    interval: 3,
    repetition: 3,
    efactor: 2.3,
    lapses: 1,
  },
  {
    id: "pos-3",
    nextReviewAt: Date.now() + 604800000, // Due in 1 week
    lastReviewedAt: Date.now() - 86400000,
    interval: 7,
    repetition: 5,
    efactor: 2.6,
    lapses: 0,
  },
];

/**
 * Seed User Progress data with authentication
 * @param db - Firestore instance
 * @param userId - User ID
 * @param stats - UserStats to seed
 * @param cards - CardProgress array to seed
 */
export async function seedUserProgress(
  db: Firestore,
  userId: string,
  stats?: Partial<UserStats>,
  cards?: CardProgress[]
): Promise<void> {
  // Seed UserStats document
  const userStats = {
    ...TEST_USER_STATS,
    ...stats,
    userId,
    lastActive: serverTimestamp(),
  };
  
  await setDoc(
    doc(db, `users/${userId}/userProgress/stats`),
    userStats
  );
  
  // Seed CardProgress documents
  if (cards && cards.length > 0) {
    const batch = writeBatch(db);
    
    cards.forEach((card) => {
      const docRef = doc(db, `users/${userId}/userProgress/${card.id}`);
      batch.set(docRef, {
        ...card,
        lastUpdated: serverTimestamp(),
      });
    });
    
    await batch.commit();
  }
}

/**
 * Create a test user with progress data
 * Convenience function that combines user creation and data seeding
 */
export async function createTestUserWithProgress(
  instance: TestFirebaseInstance,
  email?: string,
  stats?: Partial<UserStats>,
  cards?: CardProgress[]
): Promise<{ user: User; userId: string }> {
  const userCredential = await createTestUser(instance.auth, email);
  const userId = userCredential.user.uid;
  
  await seedUserProgress(
    instance.db,
    userId,
    stats,
    cards || TEST_CARD_PROGRESS
  );
  
  return { user: userCredential.user, userId };
}

// ========== REAL-TIME TESTING UTILITIES ==========

/**
 * Helper class for testing real-time updates with onSnapshot
 */
export class RealtimeTestHelper {
  private listeners: Array<() => void> = [];
  
  /**
   * Register a listener for cleanup
   */
  registerListener(unsubscribe: () => void): void {
    this.listeners.push(unsubscribe);
  }
  
  /**
   * Cleanup all registered listeners
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
  
  /**
   * Wait for a specific number of snapshot updates
   * @param expectedUpdates - Number of updates to wait for
   * @param timeoutMs - Maximum time to wait (default 5000ms)
   */
  async waitForUpdates(
    expectedUpdates: number,
    timeoutMs: number = 5000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${expectedUpdates} updates`));
      }, timeoutMs);
      
      let updateCount = 0;
      const checkUpdates = (): void => {
        updateCount++;
        if (updateCount >= expectedUpdates) {
          clearTimeout(timeout);
          resolve();
        }
      };
      
      // This would be called from within the onSnapshot callback
      (global as any).__rtTestUpdate = checkUpdates;
    });
  }
}

// ========== EXISTING GAME CONTENT TEST DATA (preserved for compatibility) ==========

/**
 * Seed test positions into Firestore
 */
export async function seedTestPositions(
  db: Firestore,
  positions: EndgamePosition[],
): Promise<void> {
  const batch = writeBatch(db);

  positions.forEach((position) => {
    const docRef = doc(db, "positions", position.id.toString());
    batch.set(docRef, {
      ...position,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  await batch.commit();
}

/**
 * Seed test categories into Firestore
 */
export async function seedTestCategories(
  db: Firestore,
  categories: EndgameCategory[],
): Promise<void> {
  const batch = writeBatch(db);

  categories.forEach((category) => {
    const docRef = doc(db, "categories", category.id);
    batch.set(docRef, {
      ...category,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  await batch.commit();
}

/**
 * Seed test chapters into Firestore
 */
export async function seedTestChapters(
  db: Firestore,
  chapters: EndgameChapter[],
): Promise<void> {
  const batch = writeBatch(db);

  chapters.forEach((chapter) => {
    const docRef = doc(db, "chapters", chapter.id);
    batch.set(docRef, {
      ...chapter,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  await batch.commit();
}

/**
 * Common test data for game content
 */
export const TEST_POSITIONS: EndgamePosition[] = [
  {
    id: 1,
    title: "Opposition Basics",
    description: "Learn the fundamental concept of opposition",
    fen: "4k3/8/4K3/8/8/8/8/8 w - - 0 1",
    category: "king-pawn",
    difficulty: "beginner",
    targetMoves: 1,
    hints: ["Opposition is key"],
    solution: ["Ke6-e7"],
    sideToMove: "white",
    goal: "win",
  },
  {
    id: 2,
    title: "Advanced Opposition",
    description: "Master more complex opposition patterns",
    fen: "8/8/4k3/8/8/4K3/8/8 w - - 0 1",
    category: "king-pawn",
    difficulty: "intermediate",
    targetMoves: 3,
    hints: ["Use opposition to control key squares"],
    solution: ["Ke3-e4", "Ke4-e5", "Ke5-d6"],
    sideToMove: "white",
    goal: "win",
  },
  {
    id: 12,
    title: "Brückenbau",
    description: "Build a bridge for your rook",
    fen: "1K6/1P6/8/8/8/8/r7/1k6 b - - 0 1",
    category: "rook-pawn",
    difficulty: "advanced",
    targetMoves: 5,
    hints: ["Create a bridge with your rook"],
    solution: ["Ra2-a8+", "Kb8-c7", "Ra8-a7", "Kb1-b2", "Ra7-b7"],
    sideToMove: "black",
    goal: "draw",
  },
];

export const TEST_CATEGORIES: EndgameCategory[] = [
  {
    id: "king-pawn",
    name: "King and Pawn",
    description: "Fundamental king and pawn endgames",
    icon: "♔",
    positions: [],
    subcategories: [],
  },
  {
    id: "rook-pawn",
    name: "Rook and Pawn",
    description: "Rook endgames with pawns",
    icon: "♜",
    positions: [],
    subcategories: [],
  },
];

export const TEST_CHAPTERS: EndgameChapter[] = [
  {
    id: "opposition-basics",
    name: "Opposition Fundamentals",
    description: "Learn the basics of opposition",
    category: "king-pawn",
    lessons: [],
    totalLessons: 5,
  },
  {
    id: "bridge-building",
    name: "Bridge Building Technique",
    description: "Master the bridge building technique",
    category: "rook-pawn",
    lessons: [],
    totalLessons: 3,
  },
];

/**
 * Cleanup all test Firebase apps
 * Should be called in afterAll() to prevent memory leaks
 */
export async function cleanupAllTestFirebase(): Promise<void> {
  const cleanupPromises = testInstances.map(async (instance) => {
    try {
      await deleteApp(instance.app);
    } catch (error) {
      // App might already be deleted
    }
  });
  
  await Promise.all(cleanupPromises);
  testInstances.length = 0; // Clear the array
}

/**
 * Wait for Firestore to be ready (for CI environments)
 */
export async function waitForFirestore(
  db: Firestore,
  maxAttempts = 10
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Try to read from a collection
      await getDocs(collection(db, "positions"));
      return; // Success
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}