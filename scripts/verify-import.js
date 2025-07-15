#!/usr/bin/env node

/**
 * Verify Firebase Firestore Import
 * Checks if the data was imported correctly
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtMncqDwhbZtbIjYjTlL1ViKqW3sJSHjs",
  authDomain: "chess-endgame-trainer-c1ea6.firebaseapp.com",
  projectId: "chess-endgame-trainer-c1ea6",
  storageBucket: "chess-endgame-trainer-c1ea6.firebasestorage.app",
  messagingSenderId: "884956836859",
  appId: "1:884956836859:web:e8fef7fd2bcdc3cd46115e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyCollection(collectionName) {
  console.log(`\\n🔍 Verifying collection: ${collectionName}`);
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    console.log(`✅ Collection ${collectionName}: ${querySnapshot.size} documents`);
    
    // Show first document as example
    if (querySnapshot.size > 0) {
      const firstDoc = querySnapshot.docs[0];
      console.log(`📄 First document ID: ${firstDoc.id}`);
      const data = firstDoc.data();
      console.log(`📋 Fields: ${Object.keys(data).join(', ')}`);
      
      // Show specific fields based on collection
      if (collectionName === 'positions') {
        console.log(`   Title: ${data.title}`);
        console.log(`   FEN: ${data.fen}`);
        console.log(`   Category: ${data.category}`);
        console.log(`   Difficulty: ${data.difficulty}`);
      } else if (collectionName === 'categories') {
        console.log(`   Name: ${data.name}`);
        console.log(`   Description: ${data.description}`);
        console.log(`   Icon: ${data.icon}`);
      } else if (collectionName === 'chapters') {
        console.log(`   Name: ${data.name}`);
        console.log(`   Category: ${data.category}`);
        console.log(`   Total Lessons: ${data.totalLessons}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error verifying collection ${collectionName}:`, error);
  }
}

async function main() {
  console.log('🔍 Verifying Firebase Firestore import...');
  
  const collections = ['positions', 'categories', 'chapters'];
  
  for (const collectionName of collections) {
    await verifyCollection(collectionName);
  }
  
  console.log('\\n🎉 Verification complete!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error during verification:', error);
  process.exit(1);
});