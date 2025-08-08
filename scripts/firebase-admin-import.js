#!/usr/bin/env node

/**
 * Firebase Admin SDK Import/Update Script
 * Uses service account authentication for full admin access
 * 
 * Usage:
 *   node scripts/firebase-admin-import.js                    # Import all collections
 *   node scripts/firebase-admin-import.js --position 2       # Update specific position
 *   node scripts/firebase-admin-import.js --collection positions  # Import specific collection
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const SERVICE_ACCOUNT_PATH = "./config/serviceAccountKey.json";
const DATA_ROOT_DIR = "./firestore_import_data";
const COLLECTIONS_TO_IMPORT = ["positions", "categories", "chapters"];
const BATCH_SIZE = 400; // Firestore batch limit is 500

// Check if service account key exists
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ Service account key not found at: ${SERVICE_ACCOUNT_PATH}`);
  console.error(`
📝 To fix this:
1. Go to Firebase Console → Your Project → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the downloaded JSON file as: ${SERVICE_ACCOUNT_PATH}
4. Make sure the file is in .gitignore (already configured)
`);
  process.exit(1);
}

// Initialize Firebase Admin SDK with service account
const serviceAccount = require(path.resolve(SERVICE_ACCOUNT_PATH));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

console.log("✅ Firebase Admin SDK initialized successfully");

/**
 * Updates a specific document in a collection
 */
async function updateDocument(collectionName, docId, data) {
  try {
    const docRef = db.collection(collectionName).doc(String(docId));
    await docRef.set(data, { merge: true }); // Merge to preserve existing fields
    console.log(`✅ Updated ${collectionName}/${docId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update ${collectionName}/${docId}:`, error.message);
    return false;
  }
}

/**
 * Imports all documents in a collection from JSON files
 */
async function importCollection(collectionName, collectionPath) {
  console.log(`\n🔄 Starting import for collection: ${collectionName}`);

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
    if (path.extname(file) === ".json") {
      const docId = path.basename(file, ".json");
      const filePath = path.join(collectionPath, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      
      try {
        const docData = JSON.parse(fileContent);
        
        // Create document reference
        const docRef = db.collection(collectionName).doc(docId);
        batch.set(docRef, docData, { merge: true });
        
        batchCount++;
        totalDocsProcessed++;
        
        // Commit batch when it reaches the limit
        if (batchCount >= BATCH_SIZE) {
          console.log(`📦 Committing batch of ${batchCount} documents...`);
          await batch.commit();
          totalDocsImported += batchCount;
          
          // Start new batch
          batch = db.batch();
          batchCount = 0;
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
  }

  // Commit any remaining documents
  if (batchCount > 0) {
    console.log(`📦 Committing final batch of ${batchCount} documents...`);
    try {
      await batch.commit();
      totalDocsImported += batchCount;
    } catch (error) {
      console.error(`❌ Failed to commit final batch:`, error.message);
    }
  }

  console.log(`✅ Finished ${collectionName}: ${totalDocsImported}/${totalDocsProcessed} imported`);
}

/**
 * Main function to handle command line arguments
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  if (args.includes("--position")) {
    // Update specific position
    const positionIndex = args.indexOf("--position");
    const positionId = args[positionIndex + 1];
    
    if (!positionId) {
      console.error("❌ Please provide a position ID");
      process.exit(1);
    }
    
    const positionFile = path.join(DATA_ROOT_DIR, "positions", `${positionId}.json`);
    if (!fs.existsSync(positionFile)) {
      console.error(`❌ Position file not found: ${positionFile}`);
      process.exit(1);
    }
    
    const positionData = JSON.parse(fs.readFileSync(positionFile, "utf8"));
    await updateDocument("positions", positionId, positionData);
    
  } else if (args.includes("--collection")) {
    // Import specific collection
    const collectionIndex = args.indexOf("--collection");
    const collectionName = args[collectionIndex + 1];
    
    if (!collectionName) {
      console.error("❌ Please provide a collection name");
      process.exit(1);
    }
    
    const collectionPath = path.join(DATA_ROOT_DIR, collectionName);
    await importCollection(collectionName, collectionPath);
    
  } else {
    // Import all collections
    console.log("🚀 Starting full Firestore import...\n");
    
    for (const collectionName of COLLECTIONS_TO_IMPORT) {
      const collectionPath = path.join(DATA_ROOT_DIR, collectionName);
      await importCollection(collectionName, collectionPath);
    }
    
    console.log("\n✅ All collections imported successfully!");
  }
  
  // Terminate the app to close connections
  await admin.app().delete();
  process.exit(0);
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});