import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { firebaseConfig } from "./config";

// Initialize Firebase only if it hasn't been initialized
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);

// Connect to Firestore emulator if in test environment
if (
  (process.env.NODE_ENV === "test" ||
    process.env.IS_E2E_TEST === "true" ||
    process.env.NEXT_PUBLIC_IS_E2E_TEST === "true") &&
  process.env.FIRESTORE_EMULATOR_HOST
) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  try {
    connectFirestoreEmulator(db, host, parseInt(port));
    // Connected to Firestore emulator
  } catch {
    // Already connected, ignore
    // Firestore emulator already connected
  }
}

export { app, db };
