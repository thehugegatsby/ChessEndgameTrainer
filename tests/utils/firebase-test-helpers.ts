/**
 * Firebase Test Helpers
 * Utilities for setting up and managing test data in Firebase Emulator
 */

import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  Firestore,
  collection,
  doc,
  getDocs,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { EndgamePosition, EndgameCategory, EndgameChapter } from '@shared/types/endgame';

// Test Firebase configuration for emulator
const TEST_CONFIG = {
  projectId: 'endgame-trainer-test',
  apiKey: 'test-api-key',
  authDomain: 'localhost',
};

let testApp: FirebaseApp | null = null;
let testDb: Firestore | null = null;

/**
 * Initialize Firebase for tests with emulator
 */
export async function initializeTestFirebase(): Promise<Firestore> {
  if (testDb) return testDb;

  // Initialize test app
  testApp = initializeApp(TEST_CONFIG, 'test-app');
  testDb = getFirestore(testApp);

  // Connect to emulator if not already connected
  try {
    connectFirestoreEmulator(testDb, 'localhost', 8080);
  } catch (error) {
    // Already connected, ignore
  }

  return testDb;
}

/**
 * Clear all data from Firestore collections
 */
export async function clearFirestoreData(): Promise<void> {
  const db = await initializeTestFirebase();
  
  // Clear positions collection
  const positionsSnapshot = await getDocs(collection(db, 'positions'));
  const batch = writeBatch(db);
  
  positionsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Clear categories collection
  const categoriesSnapshot = await getDocs(collection(db, 'categories'));
  categoriesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Clear chapters collection  
  const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
  chaptersSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

/**
 * Seed test positions into Firestore
 */
export async function seedTestPositions(positions: EndgamePosition[]): Promise<void> {
  const db = await initializeTestFirebase();
  const batch = writeBatch(db);

  positions.forEach(position => {
    const docRef = doc(db, 'positions', position.id.toString());
    batch.set(docRef, {
      ...position,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });

  await batch.commit();
}

/**
 * Seed test categories into Firestore
 */
export async function seedTestCategories(categories: EndgameCategory[]): Promise<void> {
  const db = await initializeTestFirebase();
  const batch = writeBatch(db);

  categories.forEach(category => {
    const docRef = doc(db, 'categories', category.id);
    batch.set(docRef, {
      ...category,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });

  await batch.commit();
}

/**
 * Seed test chapters into Firestore
 */
export async function seedTestChapters(chapters: EndgameChapter[]): Promise<void> {
  const db = await initializeTestFirebase();
  const batch = writeBatch(db);

  chapters.forEach(chapter => {
    const docRef = doc(db, 'chapters', chapter.id);
    batch.set(docRef, {
      ...chapter,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });

  await batch.commit();
}

/**
 * Common test data
 */
export const TEST_POSITIONS: EndgamePosition[] = [
  {
    id: 1,
    title: 'Opposition Basics',
    description: 'Learn the fundamental concept of opposition',
    fen: '4k3/8/4K3/8/8/8/8/8 w - - 0 1',
    category: 'king-pawn',
    difficulty: 'beginner',
    targetMoves: 1,
    hints: ['Opposition is key'],
    solution: ['Ke6-e7'],
    sideToMove: 'white',
    goal: 'win'
  },
  {
    id: 2,
    title: 'Advanced Opposition',
    description: 'Master more complex opposition patterns',
    fen: '8/8/4k3/8/8/4K3/8/8 w - - 0 1',
    category: 'king-pawn',
    difficulty: 'intermediate',
    targetMoves: 3,
    hints: ['Use opposition to control key squares'],
    solution: ['Ke3-e4', 'Ke4-e5', 'Ke5-d6'],
    sideToMove: 'white',
    goal: 'win'
  },
  {
    id: 12,
    title: 'Brückenbau',
    description: 'Build a bridge for your rook',
    fen: '1K6/1P6/8/8/8/8/r7/1k6 b - - 0 1',
    category: 'rook-pawn',
    difficulty: 'advanced',
    targetMoves: 5,
    hints: ['Create a bridge with your rook'],
    solution: ['Ra2-a8+', 'Kb8-c7', 'Ra8-a7', 'Kb1-b2', 'Ra7-b7'],
    sideToMove: 'black',
    goal: 'draw'
  }
];

export const TEST_CATEGORIES: EndgameCategory[] = [
  {
    id: 'king-pawn',
    name: 'King and Pawn',
    description: 'Fundamental king and pawn endgames',
    icon: '♔',
    positions: [],
    subcategories: []
  },
  {
    id: 'rook-pawn',
    name: 'Rook and Pawn',
    description: 'Rook endgames with pawns',
    icon: '♜',
    positions: [],
    subcategories: []
  }
];

export const TEST_CHAPTERS: EndgameChapter[] = [
  {
    id: 'opposition-basics',
    name: 'Opposition Fundamentals',
    description: 'Learn the basics of opposition',
    category: 'king-pawn',
    lessons: [],
    totalLessons: 5
  },
  {
    id: 'bridge-building',
    name: 'Bridge Building Technique',
    description: 'Master the bridge building technique',
    category: 'rook-pawn',
    lessons: [],
    totalLessons: 3
  }
];

/**
 * Cleanup test Firebase app
 */
export async function cleanupTestFirebase(): Promise<void> {
  if (testApp) {
    await deleteApp(testApp);
    testApp = null;
    testDb = null;
  }
}

/**
 * Wait for Firestore to be ready (for CI environments)
 */
export async function waitForFirestore(maxAttempts = 10): Promise<void> {
  const db = await initializeTestFirebase();
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Try to read from a collection
      await getDocs(collection(db, 'positions'));
      return; // Success
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}