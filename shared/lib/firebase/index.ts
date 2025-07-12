import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let db: Firestore;

// Initialize Firebase only if it hasn't been initialized
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);

// Connect to Firestore emulator if in test environment
if ((process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true') && process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  try {
    connectFirestoreEmulator(db, host, parseInt(port));
    console.log(`Connected to Firestore emulator at ${host}:${port}`);
  } catch (error) {
    // Already connected, ignore
    console.log('Firestore emulator already connected');
  }
}

export { app, db };