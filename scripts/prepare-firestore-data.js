#!/usr/bin/env node

/**
 * Prepare Firebase Firestore Data for CLI Import
 * Converts JSON structure to Firebase CLI import format
 */

const fs = require('fs');
const path = require('path');

// Configuration
const inputFileName = 'firebase-database-structure.json';
const outputDirName = 'firestore_import_data';

console.log('🔄 Preparing Firebase data for CLI import...');

try {
  // 1. Read the input JSON file
  const rawData = fs.readFileSync(inputFileName, 'utf8');
  const data = JSON.parse(rawData);

  // 2. Clean output directory if it exists
  if (fs.existsSync(outputDirName)) {
    console.log(`🗑️  Cleaning existing output directory: ${outputDirName}`);
    fs.rmSync(outputDirName, { recursive: true, force: true });
  }
  
  // Create fresh output directory
  fs.mkdirSync(outputDirName, { recursive: true });
  console.log(`📁 Created output directory: ${outputDirName}`);

  // 3. Process each collection
  for (const collectionName in data) {
    if (Object.hasOwnProperty.call(data, collectionName)) {
      const collectionData = data[collectionName];
      const collectionPath = path.join(outputDirName, collectionName);

      // Create collection subdirectory
      fs.mkdirSync(collectionPath, { recursive: true });
      console.log(`📂 Created collection directory: ${collectionName}/`);

      // 4. Process each document in the collection
      for (const docId in collectionData) {
        if (Object.hasOwnProperty.call(collectionData, docId)) {
          const docData = collectionData[docId];
          const docFilePath = path.join(collectionPath, `${String(docId)}.json`);

          // Write document to individual JSON file
          fs.writeFileSync(docFilePath, JSON.stringify(docData, null, 2), 'utf8');
          console.log(`  ✅ Created document: ${collectionName}/${docId}.json`);
        }
      }
    }
  }

  console.log(`\\n🎉 Data prepared successfully in '${outputDirName}' directory!`);
  console.log('📊 Summary:');
  
  // Count collections and documents
  const collections = fs.readdirSync(outputDirName);
  for (const collection of collections) {
    const collectionPath = path.join(outputDirName, collection);
    if (fs.statSync(collectionPath).isDirectory()) {
      const documents = fs.readdirSync(collectionPath).filter(file => file.endsWith('.json'));
      console.log(`   - ${collection}: ${documents.length} documents`);
    }
  }

  console.log('\\n🚀 Ready to import with Firebase CLI:');
  console.log('   firebase firestore:import --project chess-endgame-trainer-c1ea6 firestore_import_data --overwrite');

} catch (error) {
  console.error('❌ Error preparing data:', error.message);
  if (error.code === 'ENOENT') {
    console.error(`Please ensure '${inputFileName}' exists in the same directory as the script.`);
  } else if (error instanceof SyntaxError) {
    console.error(`Please ensure '${inputFileName}' contains valid JSON.`);
  }
  process.exit(1);
}