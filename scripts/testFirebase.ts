#!/usr/bin/env ts-node

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import chalk from 'chalk';

// Direct config (no env vars)
const firebaseConfig = {
  apiKey: "AIzaSyDDwAmoHKZSAbNLSnO2dGJRBDneDJyaHcI",
  authDomain: "endgame-trainer-2bd3f.firebaseapp.com",
  projectId: "endgame-trainer-2bd3f",
  storageBucket: "endgame-trainer-2bd3f.firebasestorage.app",
  messagingSenderId: "691290282542",
  appId: "1:691290282542:web:42a49a7d1f1988f5c39dbf"
};

async function testConnection() {
  console.log(chalk.blue('🔌 Testing Firebase Connection'));
  console.log(chalk.gray('=============================\n'));

  try {
    // Initialize
    console.log(chalk.yellow('1. Initializing Firebase...'));
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log(chalk.green('✅ Firebase initialized'));

    // Simple write test
    console.log(chalk.yellow('\n2. Testing simple write...'));
    const testData = {
      test: "Hello Firestore",
      timestamp: new Date().toISOString()
    };
    
    const docRef = doc(db, 'test', 'connection');
    await setDoc(docRef, testData);
    console.log(chalk.green('✅ Write successful!'));

    // Read back
    console.log(chalk.yellow('\n3. Testing read...'));
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(chalk.green('✅ Read successful!'));
      console.log(chalk.gray('Data:'), docSnap.data());
    } else {
      console.log(chalk.red('❌ Document not found'));
    }

    console.log(chalk.green('\n✨ Firebase connection is working!'));
    
  } catch (error) {
    console.log(chalk.red('\n❌ Firebase error:'));
    console.error(error);
  }
}

testConnection().catch(console.error);