#!/usr/bin/env ts-node

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../shared/lib/firebase/config';
import { allEndgamePositions } from '../shared/data/endgames';
import chalk from 'chalk';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testIndividualWrites() {
  console.log(chalk.blue('🧪 Testing Individual Position Writes'));
  console.log(chalk.gray('===================================\n'));

  // Try writing each position individually
  for (const position of allEndgamePositions) {
    try {
      console.log(chalk.yellow(`Writing position ${position.id}: ${position.title}...`));
      
      // Prepare the data exactly as the migration service does
      const firestoreData = {
        id: position.id,
        title: position.title,
        description: position.description,
        fen: position.fen,
        category: position.category,
        difficulty: position.difficulty,
        goal: position.goal,
        sideToMove: position.sideToMove,
        material: position.material,
        tags: position.tags || [],
        baseContent: {
          strategies: position.baseContent?.strategies || [],
          commonMistakes: position.baseContent?.commonMistakes || [],
          keyPrinciples: position.baseContent?.keyPrinciples || []
        },
        specialContent: {
          keySquares: position.specialContent?.keySquares || [],
          criticalMoves: position.specialContent?.criticalMoves || [],
          ...(position.specialContent?.historicalNote && { historicalNote: position.specialContent.historicalNote }),
          specificTips: position.specialContent?.specificTips || []
        },
        bridgeHints: position.bridgeHints || []
      };
      
      const docRef = doc(db, 'positions', position.id.toString());
      await setDoc(docRef, firestoreData);
      console.log(chalk.green(`  ✅ Success`));
      
    } catch (error) {
      console.log(chalk.red(`  ❌ Failed: ${error.message}`));
      console.log(chalk.gray(`     Full error:`, error));
      break;
    }
  }
}

async function testBatchWrite() {
  console.log(chalk.blue('\n\n🧪 Testing Batch Write'));
  console.log(chalk.gray('====================\n'));

  try {
    const batch = writeBatch(db);
    
    // Add just the first 3 positions to test
    const testPositions = allEndgamePositions.slice(0, 3);
    
    for (const position of testPositions) {
      console.log(chalk.yellow(`Adding to batch: ${position.id} - ${position.title}`));
      
      const docRef = doc(db, 'positions', position.id.toString());
      const firestoreData = {
        id: position.id,
        title: position.title,
        description: position.description,
        fen: position.fen,
        category: position.category,
        difficulty: position.difficulty,
        goal: position.goal,
        sideToMove: position.sideToMove
        // Simplified - no nested objects for now
      };
      
      batch.set(docRef, firestoreData);
    }
    
    console.log(chalk.yellow('\nCommitting batch...'));
    await batch.commit();
    console.log(chalk.green('✅ Batch write successful!'));
    
  } catch (error) {
    console.log(chalk.red('❌ Batch write failed:'), error.message);
    console.log(chalk.gray('Full error:'), error);
  }
}

async function main() {
  await testIndividualWrites();
  await testBatchWrite();
}

main().catch(console.error);