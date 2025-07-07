#!/usr/bin/env ts-node

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import chalk from 'chalk';

const firebaseConfig = {
  apiKey: "AIzaSyDDwAmoHKZSAbNLSnO2dGJRBDneDJyaHcI",
  authDomain: "endgame-trainer-2bd3f.firebaseapp.com",
  projectId: "endgame-trainer-2bd3f",
  storageBucket: "endgame-trainer-2bd3f.firebasestorage.app",
  messagingSenderId: "691290282542",
  appId: "1:691290282542:web:42a49a7d1f1988f5c39dbf"
};

async function testPositionWrite() {
  console.log(chalk.blue('🧪 Testing Position Write'));
  console.log(chalk.gray('========================\n'));

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Test minimal position write
    const testPosition = {
      id: 999,
      title: "Test Position",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      category: "test",
      difficulty: "beginner",
      goal: "win",
      sideToMove: "white",
      description: "Test description"
    };
    
    console.log(chalk.yellow('Writing test position to positions/999...'));
    const docRef = doc(db, 'positions', '999');
    await setDoc(docRef, testPosition);
    console.log(chalk.green('✅ Success! Basic position write works!'));
    
    // Now try with nested objects
    const complexPosition = {
      ...testPosition,
      material: {
        white: "K+Q+R",
        black: "K"
      },
      baseContent: {
        strategies: ["Test strategy"],
        commonMistakes: ["Test mistake"],
        keyPrinciples: ["Test principle"]
      }
    };
    
    console.log(chalk.yellow('\nWriting complex position to positions/998...'));
    const docRef2 = doc(db, 'positions', '998');
    await setDoc(docRef2, complexPosition);
    console.log(chalk.green('✅ Success! Complex position write works!'));
    
  } catch (error) {
    console.log(chalk.red('❌ Error:'));
    console.error(error);
  }
}

testPositionWrite().catch(console.error);