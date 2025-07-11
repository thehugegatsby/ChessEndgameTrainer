/**
 * Firebase Test Setup Utilities
 * Provides test environment management and data helpers
 */

import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  Firestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  setDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  connectAuthEmulator, 
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { EndgamePosition } from '@shared/types/endgame';
import { TEST_POSITIONS, TEST_CATEGORIES, TEST_CHAPTERS } from '../../../utils/firebase-test-helpers';

// Test Firebase configuration
const TEST_CONFIG = {
  projectId: 'endgame-trainer-test',
  apiKey: 'test-api-key',
  authDomain: 'localhost',
};

let testApp: FirebaseApp | null = null;
let testDb: Firestore | null = null;
let testAuth: Auth | null = null;

/**
 * Initialize Firebase for tests with emulators
 */
export async function setupFirebase(): Promise<{ db: Firestore; auth: Auth }> {
  if (testDb && testAuth) {
    return { db: testDb, auth: testAuth };
  }

  // Initialize test app
  testApp = initializeApp(TEST_CONFIG, 'test-app-' + Date.now());
  testDb = getFirestore(testApp);
  testAuth = getAuth(testApp);

  // Connect to emulators if not already connected
  try {
    connectFirestoreEmulator(testDb, 'localhost', 8080);
  } catch (error) {
    // Already connected, ignore
  }
  
  // Only connect Auth emulator if available
  try {
    connectAuthEmulator(testAuth, 'http://localhost:9099', { disableWarnings: true });
  } catch (error) {
    console.log('Auth emulator not available, using mock auth');
  }

  return { db: testDb, auth: testAuth };
}

/**
 * Get current test environment
 */
export function getTestEnv(): { db: Firestore; auth: Auth } {
  if (!testDb || !testAuth) {
    throw new Error('Firebase test environment not initialized. Call setupFirebase first.');
  }
  return { db: testDb, auth: testAuth };
}

/**
 * Clear all data from Firestore
 */
export async function clearFirestore(): Promise<void> {
  const { db } = getTestEnv();
  
  // Clear positions
  const positionsSnapshot = await getDocs(collection(db, 'positions'));
  const batch = writeBatch(db);
  
  positionsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Clear categories
  const categoriesSnapshot = await getDocs(collection(db, 'categories'));
  categoriesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Clear chapters  
  const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
  chaptersSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Clear users
  const usersSnapshot = await getDocs(collection(db, 'users'));
  usersSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

/**
 * Seed test positions
 */
export async function seedTestPositions(positions: EndgamePosition[] = TEST_POSITIONS): Promise<void> {
  const { db } = getTestEnv();
  const batch = writeBatch(db);

  positions.forEach(position => {
    const docRef = doc(db, 'positions', position.id.toString());
    batch.set(docRef, position);
  });

  await batch.commit();
}

/**
 * Seed test categories
 */
export async function seedTestCategories(): Promise<void> {
  const { db } = getTestEnv();
  const batch = writeBatch(db);

  TEST_CATEGORIES.forEach(category => {
    const docRef = doc(db, 'categories', category.id);
    batch.set(docRef, category);
  });

  await batch.commit();
}

/**
 * Seed test chapters
 */
export async function seedTestChapters(): Promise<void> {
  const { db } = getTestEnv();
  const batch = writeBatch(db);

  TEST_CHAPTERS.forEach(chapter => {
    const docRef = doc(db, 'chapters', chapter.id);
    batch.set(docRef, chapter);
  });

  await batch.commit();
}

/**
 * Create a test user
 */
export async function createTestUser(email: string, password: string): Promise<{ uid: string; email: string }> {
  const { auth, db } = getTestEnv();
  
  try {
    // Try to create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.email?.split('@')[0],
      createdAt: new Date(),
      settings: {
        theme: 'light',
        soundEnabled: true,
        autoPlay: false
      }
    });
    
    return { uid: user.uid, email: user.email! };
  } catch (error) {
    // Auth emulator not available, create mock user
    console.log('Using mock user (auth emulator not available)');
    const mockUid = 'test-user-' + Date.now();
    
    // Create user profile in Firestore only
    await setDoc(doc(db, 'users', mockUid), {
      uid: mockUid,
      email: email,
      displayName: email.split('@')[0],
      createdAt: new Date(),
      settings: {
        theme: 'light',
        soundEnabled: true,
        autoPlay: false
      }
    });
    
    return { uid: mockUid, email };
  }
}

/**
 * Sign in test user
 */
export async function signInTestUser(email: string, password: string): Promise<void> {
  const { auth } = getTestEnv();
  await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out current user
 */
export async function signOutTestUser(): Promise<void> {
  const { auth } = getTestEnv();
  await signOut(auth);
}

/**
 * Cleanup test Firebase app
 */
export async function cleanupFirebase(): Promise<void> {
  if (testApp) {
    await deleteApp(testApp);
    testApp = null;
    testDb = null;
    testAuth = null;
  }
}

/**
 * Seed all test data
 */
export async function seedAllTestData(): Promise<void> {
  await seedTestCategories();
  await seedTestChapters();
  await seedTestPositions();
}