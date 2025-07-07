#!/usr/bin/env ts-node

/**
 * Debug script to identify migration issues
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../shared/lib/firebase/config';
import { allEndgamePositions } from '../shared/data/endgames';
import chalk from 'chalk';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugMigration() {
  console.log(chalk.blue('🔍 Debug Migration Tool'));
  console.log(chalk.gray('======================\n'));

  // Test with first position
  const testPosition = allEndgamePositions[0];
  console.log(chalk.yellow('Testing with position:'), testPosition.id, testPosition.title);
  
  // Log the full object to see what might be wrong
  console.log(chalk.gray('\nFull position object:'));
  console.log(JSON.stringify(testPosition, null, 2));
  
  // Try minimal write
  console.log(chalk.yellow('\n1. Testing minimal write...'));
  try {
    const minimalData = {
      id: testPosition.id,
      title: testPosition.title,
      fen: testPosition.fen
    };
    
    const docRef = doc(db, 'test', 'minimal');
    await setDoc(docRef, minimalData);
    console.log(chalk.green('✅ Minimal write successful!'));
  } catch (error) {
    console.log(chalk.red('❌ Minimal write failed:'), error);
  }
  
  // Try with more fields
  console.log(chalk.yellow('\n2. Testing with base fields...'));
  try {
    const baseData = {
      id: testPosition.id,
      title: testPosition.title,
      description: testPosition.description,
      fen: testPosition.fen,
      category: testPosition.category,
      difficulty: testPosition.difficulty,
      goal: testPosition.goal,
      sideToMove: testPosition.sideToMove
    };
    
    const docRef = doc(db, 'test', 'base');
    await setDoc(docRef, baseData);
    console.log(chalk.green('✅ Base fields write successful!'));
  } catch (error) {
    console.log(chalk.red('❌ Base fields write failed:'), error);
  }
  
  // Test each field individually
  console.log(chalk.yellow('\n3. Testing each field type...'));
  const fields = Object.entries(testPosition);
  
  for (const [key, value] of fields) {
    try {
      const testData = { [key]: value };
      const docRef = doc(db, 'test', `field_${key}`);
      await setDoc(docRef, testData);
      console.log(chalk.green(`✅ Field '${key}' OK`));
    } catch (error) {
      console.log(chalk.red(`❌ Field '${key}' FAILED:`), error.message);
      console.log(chalk.gray(`   Value type: ${typeof value}`));
      console.log(chalk.gray(`   Value: ${JSON.stringify(value, null, 2)}`));
    }
  }
  
  console.log(chalk.blue('\n🏁 Debug complete!'));
}

// Run debug
debugMigration().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});