#!/usr/bin/env ts-node

import chalk from 'chalk';

console.log(chalk.blue('🔍 Checking Firebase Configuration'));
console.log(chalk.gray('================================\n'));

// Check environment variables
console.log(chalk.yellow('Environment Variables:'));
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || chalk.red('NOT SET'));
console.log('GOOGLE_CLOUD_PROJECT:', process.env.GOOGLE_CLOUD_PROJECT || chalk.red('NOT SET'));

// Import config
import { firebaseConfig } from '../shared/lib/firebase/config';

console.log(chalk.yellow('\nFirebase Config:'));
console.log('projectId:', firebaseConfig.projectId || chalk.red('MISSING'));
console.log('apiKey:', firebaseConfig.apiKey ? chalk.green('SET') : chalk.red('MISSING'));
console.log('authDomain:', firebaseConfig.authDomain || chalk.red('MISSING'));
console.log('appId:', firebaseConfig.appId || chalk.red('MISSING'));

// Direct test with hardcoded values
console.log(chalk.yellow('\n\nTesting with direct config...'));

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const directConfig = {
  apiKey: "AIzaSyDDwAmoHKZSAbNLSnO2dGJRBDneDJyaHcI",
  authDomain: "endgame-trainer-2bd3f.firebaseapp.com",
  projectId: "endgame-trainer-2bd3f",
  storageBucket: "endgame-trainer-2bd3f.firebasestorage.app",
  messagingSenderId: "691290282542",
  appId: "1:691290282542:web:42a49a7d1f1988f5c39dbf"
};

try {
  const app = initializeApp(directConfig);
  const db = getFirestore(app);
  
  // Try the simplest possible write
  const testData = {
    test: true,
    timestamp: Date.now()
  };
  
  console.log('Writing simple test data...');
  const docRef = doc(db, 'positions', 'test123');
  await setDoc(docRef, testData);
  console.log(chalk.green('✅ Direct config write successful!'));
  
} catch (error) {
  console.log(chalk.red('❌ Direct config write failed:'), error.message);
}

// Try with Timestamps
console.log(chalk.yellow('\n\nTesting with Firestore Timestamp...'));
import { Timestamp } from 'firebase/firestore';

try {
  const app2 = initializeApp(directConfig, 'app2');
  const db2 = getFirestore(app2);
  
  const testData2 = {
    test: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  console.log('Writing with Timestamps...');
  const docRef2 = doc(db2, 'positions', 'test456');
  await setDoc(docRef2, testData2);
  console.log(chalk.green('✅ Timestamp write successful!'));
  
} catch (error) {
  console.log(chalk.red('❌ Timestamp write failed:'), error.message);
}