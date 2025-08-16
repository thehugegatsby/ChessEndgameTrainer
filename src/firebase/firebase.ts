import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { env } from '@/config/env';

// Ensure all Firebase config values are present
if (
  !env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  !env.NEXT_PUBLIC_FIREBASE_APP_ID
) {
  throw new Error('Missing required Firebase environment variables');
}

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    `${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);

// Auth und Firestore Services exportieren
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
