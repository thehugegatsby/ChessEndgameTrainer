#!/usr/bin/env node

/**
 * Firebase Firestore Bulk Import Script
 * Uses Firebase Admin SDK with batched writes
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
// Initialize Firebase Admin SDK with application default credentials
// This works because we're logged in via Firebase CLI
admin.initializeApp({
  projectId: 'chess-endgame-trainer-c1ea6'
});

const db = admin.firestore();

const DATA_ROOT_DIR = './firestore_import_data'; // Directory with collection folders
const COLLECTIONS_TO_IMPORT = ['positions', 'categories', 'chapters']; // Collections to import
const BATCH_SIZE = 400; // Firestore batch limit is 500, using 400 for safety

/**
 * Imports documents for a single collection from a specified directory.
 * Each JSON file in the directory is treated as one document.
 * The filename (without extension) is used as the document ID.
 */
async function importCollection(collectionName, collectionPath) {
  console.log(`\\n🔄 Starting import for collection: ${collectionName}`);
  
  if (!fs.existsSync(collectionPath)) {
    console.warn(`⚠️  Directory not found: ${collectionPath}. Skipping.`);
    return;
  }

  const files = fs.readdirSync(collectionPath);
  let batch = db.batch();
  let batchCount = 0;
  let totalDocsProcessed = 0;
  let totalDocsImported = 0;

  for (const file of files) {
    if (path.extname(file) === '.json') {
      const docId = path.basename(file, '.json'); // Use filename as document ID
      const filePath = path.join(collectionPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      let docData;

      try {
        docData = JSON.parse(fileContent);
      } catch (parseError) {
        console.error(`❌ Error parsing JSON for file ${filePath}:`, parseError);
        continue; // Skip this file and move to the next
      }

      const docRef = db.collection(collectionName).doc(docId);
      batch.set(docRef, docData); // Use .set() to create or overwrite documents
      batchCount++;
      totalDocsProcessed++;

      if (batchCount === BATCH_SIZE) {
        console.log(`📦 Committing batch of ${batchCount} documents for ${collectionName}...`);
        try {
          await batch.commit();
          totalDocsImported += batchCount;
          console.log(`✅ Batch committed successfully. Total imported: ${totalDocsImported}`);
          batch = db.batch(); // Start a new batch
          batchCount = 0;
        } catch (error) {
          console.error(`❌ Failed to commit batch for ${collectionName}:`, error);
          batch = db.batch(); // Clear the current batch
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
 * Main function to orchestrate the import process for all specified collections.
 */
async function main() {
  console.log('🚀 Starting Firestore bulk import...');
  
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