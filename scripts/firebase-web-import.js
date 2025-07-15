#!/usr/bin/env node

/**
 * Firebase Firestore Bulk Import Script using Web SDK
 * This approach uses the Firebase Web SDK instead of Admin SDK
 * to avoid authentication issues in development
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, writeBatch } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAtMncqDwhbZtbIjYjTlL1ViKqW3sJSHjs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "chess-endgame-trainer-c1ea6.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chess-endgame-trainer-c1ea6",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "chess-endgame-trainer-c1ea6.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "884956836859",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:884956836859:web:e8fef7fd2bcdc3cd46115e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DATA_ROOT_DIR = './firestore_import_data';
const COLLECTIONS_TO_IMPORT = ['positions', 'categories', 'chapters'];
const BATCH_SIZE = 400; // Firestore batch limit is 500

/**
 * Imports documents for a single collection
 */
async function importCollection(collectionName, collectionPath) {
  console.log(`\\n🔄 Starting import for collection: ${collectionName}`);
  
  if (!fs.existsSync(collectionPath)) {
    console.warn(`⚠️  Directory not found: ${collectionPath}. Skipping.`);
    return;
  }

  const files = fs.readdirSync(collectionPath);
  let batch = writeBatch(db);
  let batchCount = 0;
  let totalDocsProcessed = 0;
  let totalDocsImported = 0;

  for (const file of files) {
    if (path.extname(file) === '.json') {
      const docId = path.basename(file, '.json');
      const filePath = path.join(collectionPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      let docData;

      try {
        docData = JSON.parse(fileContent);
      } catch (parseError) {
        console.error(`❌ Error parsing JSON for file ${filePath}:`, parseError);
        continue;
      }

      const docRef = doc(db, collectionName, docId);
      batch.set(docRef, docData);
      batchCount++;
      totalDocsProcessed++;

      if (batchCount === BATCH_SIZE) {
        console.log(`📦 Committing batch of ${batchCount} documents for ${collectionName}...`);
        try {
          await batch.commit();
          totalDocsImported += batchCount;
          console.log(`✅ Batch committed successfully. Total imported: ${totalDocsImported}`);
          batch = writeBatch(db);
          batchCount = 0;
        } catch (error) {
          console.error(`❌ Failed to commit batch for ${collectionName}:`, error);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }
  }

  // Commit any remaining documents in the last batch
  if (batchCount > 0) {
    console.log(`📦 Committing final batch of ${batchCount} documents for ${collectionName}...`);
    try {
      await batch.commit();
      totalDocsImported += batchCount;
      console.log(`✅ Final batch committed successfully.`);
    } catch (error) {
      console.error(`❌ Failed to commit final batch for ${collectionName}:`, error);
    }
  }

  console.log(`🎉 Finished import for collection: ${collectionName}`);
  console.log(`   📊 Total processed: ${totalDocsProcessed}, Successfully imported: ${totalDocsImported}`);
}

/**
 * Main function to orchestrate the import process
 */
async function main() {
  console.log('🚀 Starting Firestore bulk import using Web SDK...');
  
  try {
    for (const collectionName of COLLECTIONS_TO_IMPORT) {
      const collectionPath = path.join(DATA_ROOT_DIR, collectionName);
      await importCollection(collectionName, collectionPath);
    }
    console.log('\\n🎉 All collections processed. Import complete!');
  } catch (error) {
    console.error('❌ An error occurred during import:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the main import function
main().catch(error => {
  console.error('❌ Unhandled error during import:', error);
  process.exit(1);
});