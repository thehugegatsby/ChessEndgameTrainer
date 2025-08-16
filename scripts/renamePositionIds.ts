/**
 * Script to rename position IDs in Firestore
 * Renames positions 12→9, 13→10, 14→11 to fill gaps
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { env } from '../src/config/env';

async function renamePositionIds() {
  console.log('🔄 Starting position ID rename process...');

  try {
    // Initialize Firebase with production config or emulator
    const app = initializeApp({
      projectId: env.FIREBASE_PROJECT_ID || 'endgametrainer-dev',
      apiKey: env.FIREBASE_API_KEY || 'test-key',
      authDomain: env.FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com',
    });

    const db = getFirestore(app);

    // Use emulator only if explicitly requested
    if (env.USE_EMULATOR) {
      console.log('📡 Connecting to Firestore emulator...');
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
      } catch (error) {
        console.log('📡 Emulator already connected or not available');
      }
    } else {
      console.log('🌐 Using production Firestore');
    }

    // Define the rename mapping: oldId → newId
    const renameMap = new Map([
      [12, 9],
      [13, 10],
      [14, 11],
    ]);

    console.log('📋 Rename mapping:', Object.fromEntries(renameMap));

    // Check source and target positions
    const positionsToRename: Array<[number, number]> = [];
    for (const [oldId, newId] of renameMap) {
      // Check if source exists
      const sourceDocRef = doc(db, 'positions', oldId.toString());
      const sourceSnap = await getDoc(sourceDocRef);
      console.log(`🔍 Checking source position ${oldId}: exists = ${sourceSnap.exists()}`);

      if (!sourceSnap.exists()) {
        console.warn(`⚠️  Source position ${oldId} does not exist, skipping`);
        continue;
      }

      // Check if target exists
      const targetDocRef = doc(db, 'positions', newId.toString());
      const targetSnap = await getDoc(targetDocRef);
      console.log(`🔍 Checking target position ${newId}: exists = ${targetSnap.exists()}`);

      if (targetSnap.exists()) {
        console.warn(`⚠️  Position ${newId} already exists, skipping rename from ${oldId}`);
      } else {
        positionsToRename.push([oldId, newId]);
        console.log(`✅ Will rename ${oldId} → ${newId}`);
      }
    }

    if (positionsToRename.length === 0) {
      console.log('✅ No positions need to be renamed');
      return;
    }

    // Perform the renames
    for (const [oldId, newId] of positionsToRename) {
      console.log(`🔄 Renaming position ${oldId} → ${newId}...`);

      // Get the source position
      const sourceDocRef = doc(db, 'positions', oldId.toString());
      const sourceSnap = await getDoc(sourceDocRef);

      if (!sourceSnap.exists()) {
        console.warn(`⚠️  Position ${oldId} does not exist, skipping`);
        continue;
      }

      const positionData = sourceSnap.data();
      console.log(`📄 Source data for ${oldId}:`, positionData);

      // Update the ID in the data
      const updatedPosition = {
        ...positionData,
        id: newId,
      };

      console.log(`📄 Updated data for ${newId}:`, updatedPosition);

      // Create new document with new ID
      const targetDocRef = doc(db, 'positions', newId.toString());
      await setDoc(targetDocRef, updatedPosition);
      console.log(`✅ Created position ${newId}`);

      // Delete old document
      await deleteDoc(sourceDocRef);
      console.log(`🗑️  Deleted old position ${oldId}`);

      console.log(`✅ Successfully renamed position ${oldId} → ${newId}`);
    }

    console.log('🎉 Position ID rename process completed successfully!');

    // Verify the rename was successful
    console.log('\n🔍 Verifying renamed positions...');
    for (const [, newId] of positionsToRename) {
      const newDocRef = doc(db, 'positions', newId.toString());
      const newSnap = await getDoc(newDocRef);

      if (newSnap.exists()) {
        const position = newSnap.data();
        console.log(`✅ Position ${newId}: "${position?.['title']}" (ID: ${position?.['id']})`);
      } else {
        console.error(`❌ Position ${newId} not found after rename!`);
      }
    }
  } catch (error) {
    console.error('❌ Error during position ID rename:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  renamePositionIds()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { renamePositionIds };
