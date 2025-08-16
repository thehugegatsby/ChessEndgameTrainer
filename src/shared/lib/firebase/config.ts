import { type FirebaseOptions } from 'firebase/app';

// Use test configuration when in test environment
const isTestEnvironment =
  process.env.NODE_ENV === 'test' || process.env['NEXT_PUBLIC_IS_E2E_TEST'] === 'true';

export const firebaseConfig: FirebaseOptions = isTestEnvironment
  ? {
      // Test configuration for emulator
      apiKey: 'test-api-key',
      authDomain: 'localhost',
      projectId: 'endgame-trainer-test',
      storageBucket: 'endgame-trainer-test.appspot.com',
      messagingSenderId: '123456789',
      appId: 'test-app-id',
    }
  : {
      // Production configuration
      apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] || '',
      authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] || '',
      projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] || '',
      storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] || '',
      messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] || '',
      appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'] || '',
    };
