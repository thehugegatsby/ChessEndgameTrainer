#!/usr/bin/env node

/**
 * Firebase Data Import Script
 * Imports the chess endgame training data structure into Firestore
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin SDK
try {
  // Try to use service account key if available
  const serviceAccount = require("../firebase-service-account.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "chess-endgame-trainer-c1ea6",
  });
  console.log("✅ Firebase initialized with service account");
} catch (error) {
  // Fallback to application default credentials
  admin.initializeApp({
    projectId: "chess-endgame-trainer-c1ea6",
  });
  console.log("✅ Firebase initialized with default credentials");
}

const db = admin.firestore();

async function importData() {
  try {
    // Read the database structure file
    const dataPath = path.join(
      __dirname,
      "..",
      "firebase-database-structure.json",
    );
    const rawData = fs.readFileSync(dataPath, "utf8");
    const data = JSON.parse(rawData);

    console.log("📁 Starting Firebase data import...");

    // Import positions
    console.log("📦 Importing positions...");
    const positionsRef = db.collection("positions");
    for (const [positionId, position] of Object.entries(data.positions)) {
      await positionsRef.doc(positionId).set(position);
      console.log(`✅ Imported position ${positionId}: ${position.title}`);
    }

    // Import categories
    console.log("📦 Importing categories...");
    const categoriesRef = db.collection("categories");
    for (const [categoryId, category] of Object.entries(data.categories)) {
      await categoriesRef.doc(categoryId).set(category);
      console.log(`✅ Imported category ${categoryId}: ${category.name}`);
    }

    // Import chapters
    console.log("📦 Importing chapters...");
    const chaptersRef = db.collection("chapters");
    for (const [chapterId, chapter] of Object.entries(data.chapters)) {
      await chaptersRef.doc(chapterId).set(chapter);
      console.log(`✅ Imported chapter ${chapterId}: ${chapter.name}`);
    }

    // Note: userProgress is not imported as it's user-specific data
    console.log("ℹ️  Skipping userProgress (user-specific data)");

    console.log("🎉 Data import completed successfully!");
    console.log("📊 Summary:");
    console.log(`   - Positions: ${Object.keys(data.positions).length}`);
    console.log(`   - Categories: ${Object.keys(data.categories).length}`);
    console.log(`   - Chapters: ${Object.keys(data.chapters).length}`);
  } catch (error) {
    console.error("❌ Error importing data:", error);
    process.exit(1);
  }
}

async function verifyImport() {
  console.log("🔍 Verifying import...");

  try {
    // Check positions
    const positionsSnapshot = await db.collection("positions").get();
    console.log(`✅ Positions in database: ${positionsSnapshot.size}`);

    // Check categories
    const categoriesSnapshot = await db.collection("categories").get();
    console.log(`✅ Categories in database: ${categoriesSnapshot.size}`);

    // Check chapters
    const chaptersSnapshot = await db.collection("chapters").get();
    console.log(`✅ Chapters in database: ${chaptersSnapshot.size}`);

    // Show first position as example
    const firstPosition = await db.collection("positions").doc("1").get();
    if (firstPosition.exists) {
      const data = firstPosition.data();
      console.log("📍 First position:", data.title);
      console.log("   FEN:", data.fen);
      console.log("   Category:", data.category);
      console.log("   Difficulty:", data.difficulty);
    }
  } catch (error) {
    console.error("❌ Error verifying import:", error);
  }
}

// Run the import
importData()
  .then(() => verifyImport())
  .then(() => {
    console.log("🚀 All done! Your Firebase database is ready.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
