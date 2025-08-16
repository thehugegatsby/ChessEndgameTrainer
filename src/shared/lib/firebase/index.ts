import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Initialize Firebase with proper error handling
function getFirebaseApp(): FirebaseApp {
  const existingApps = getApps();
  if (existingApps.length === 0) {
    return initializeApp(firebaseConfig);
  }

  const app = existingApps[0];
  if (!app) {
    throw new Error('Firebase initialization failed: No valid app instance found');
  }
  return app;
}

const app = getFirebaseApp();

const db: Firestore = getFirestore(app);

// Connect to Firestore emulator if in test environment
if (
  (process.env.NODE_ENV === 'test' ||
    process.env['IS_E2E_TEST'] === 'true' ||
    process.env['NEXT_PUBLIC_IS_E2E_TEST'] === 'true') &&
  process.env['FIRESTORE_EMULATOR_HOST']
) {
  const parts = process.env['FIRESTORE_EMULATOR_HOST'].split(':');
  if (!parts || parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid FIRESTORE_EMULATOR_HOST format: ${process.env['FIRESTORE_EMULATOR_HOST']}`
    );
  }
  const [host, port] = parts;
  try {
    connectFirestoreEmulator(db, host, parseInt(port));
    // Connected to Firestore emulator
  } catch {
    // Already connected, ignore
    // Firestore emulator already connected
  }
}

export { app, db };
