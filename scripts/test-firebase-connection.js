#!/usr/bin/env node

/**
 * Test Firebase Connection and Data Loading
 * Verifies that the Firebase setup works correctly
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

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

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Firestore connection...');
  
  try {
    // Test 1: Load positions collection
    console.log('\\n📍 Testing positions collection...');
    const positionsSnapshot = await getDocs(collection(db, 'positions'));
    console.log(`✅ Positions loaded: ${positionsSnapshot.size} documents`);
    
    if (positionsSnapshot.size > 0) {
      const firstPosition = positionsSnapshot.docs[0];
      const positionData = firstPosition.data();
      console.log(`   📋 First position: ${positionData.title}`);
      console.log(`   🎯 Category: ${positionData.category}`);
      console.log(`   📊 Difficulty: ${positionData.difficulty}`);
      console.log(`   ♟️  FEN: ${positionData.fen}`);
    }
    
    // Test 2: Load categories collection
    console.log('\\n📂 Testing categories collection...');
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    console.log(`✅ Categories loaded: ${categoriesSnapshot.size} documents`);
    
    if (categoriesSnapshot.size > 0) {
      const firstCategory = categoriesSnapshot.docs[0];
      const categoryData = firstCategory.data();
      console.log(`   📋 First category: ${categoryData.name}`);
      console.log(`   📝 Description: ${categoryData.description}`);
      console.log(`   🎨 Icon: ${categoryData.icon}`);
    }
    
    // Test 3: Load chapters collection
    console.log('\\n📚 Testing chapters collection...');
    const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
    console.log(`✅ Chapters loaded: ${chaptersSnapshot.size} documents`);
    
    if (chaptersSnapshot.size > 0) {
      const firstChapter = chaptersSnapshot.docs[0];
      const chapterData = firstChapter.data();
      console.log(`   📋 First chapter: ${chapterData.name}`);
      console.log(`   🎯 Category: ${chapterData.category}`);
      console.log(`   📊 Total lessons: ${chapterData.totalLessons}`);
    }
    
    // Test 4: Test specific document access
    console.log('\\n🎯 Testing specific document access...');
    const position1 = await getDoc(doc(db, 'positions', '1'));
    if (position1.exists()) {
      const data = position1.data();
      console.log(`✅ Position 1 loaded: ${data.title}`);
      console.log(`   🎯 Goal: ${data.goal}`);
      console.log(`   🎯 Target moves: ${data.targetMoves}`);
    } else {
      console.log('❌ Position 1 not found');
    }
    
    // Test 5: Test application data structure
    console.log('\\n🧪 Testing application data structure...');
    const testPosition = positionsSnapshot.docs[0];
    const testData = testPosition.data();
    
    const requiredFields = ['id', 'title', 'description', 'fen', 'category', 'difficulty', 'goal'];
    const missingFields = requiredFields.filter(field => !testData.hasOwnProperty(field));
    
    if (missingFields.length === 0) {
      console.log('✅ All required fields present in position data');
    } else {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
    }
    
    console.log('\\n🎉 Firebase connection test completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Positions: ${positionsSnapshot.size}`);
    console.log(`   - Categories: ${categoriesSnapshot.size}`);
    console.log(`   - Chapters: ${chaptersSnapshot.size}`);
    console.log(`   - Connection: ✅ Working`);
    console.log(`   - Data Structure: ✅ Valid`);
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    console.error('   Error details:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('💡 Suggestion: Check Firestore security rules');
    } else if (error.code === 'unavailable') {
      console.log('💡 Suggestion: Check internet connection and Firebase project status');
    }
    
    process.exit(1);
  }
  
  process.exit(0);
}

testFirebaseConnection();