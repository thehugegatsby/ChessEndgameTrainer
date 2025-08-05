#!/usr/bin/env node

/**
 * Firebase Data Import using Firebase CLI
 * Imports the chess endgame training data structure into Firestore
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");
const execPromise = util.promisify(exec);

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

    console.log("📁 Starting Firebase data import using CLI...");

    // Import positions
    console.log("📦 Importing positions...");
    for (const [positionId, position] of Object.entries(data.positions)) {
      const tempFile = `temp-position-${positionId}.json`;
      fs.writeFileSync(tempFile, JSON.stringify(position, null, 2));

      try {
        const command = `firebase firestore:set positions/${positionId} ${tempFile} --project chess-endgame-trainer-c1ea6`;
        await execPromise(command);
        console.log(`✅ Imported position ${positionId}: ${position.title}`);
      } catch (error) {
        console.error(
          `❌ Error importing position ${positionId}:`,
          error.message,
        );
      }

      // Clean up temp file
      fs.unlinkSync(tempFile);
    }

    // Import categories
    console.log("📦 Importing categories...");
    for (const [categoryId, category] of Object.entries(data.categories)) {
      const tempFile = `temp-category-${categoryId}.json`;
      fs.writeFileSync(tempFile, JSON.stringify(category, null, 2));

      try {
        const command = `firebase firestore:set categories/${categoryId} ${tempFile} --project chess-endgame-trainer-c1ea6`;
        await execPromise(command);
        console.log(`✅ Imported category ${categoryId}: ${category.name}`);
      } catch (error) {
        console.error(
          `❌ Error importing category ${categoryId}:`,
          error.message,
        );
      }

      // Clean up temp file
      fs.unlinkSync(tempFile);
    }

    // Import chapters
    console.log("📦 Importing chapters...");
    for (const [chapterId, chapter] of Object.entries(data.chapters)) {
      const tempFile = `temp-chapter-${chapterId}.json`;
      fs.writeFileSync(tempFile, JSON.stringify(chapter, null, 2));

      try {
        const command = `firebase firestore:set chapters/${chapterId} ${tempFile} --project chess-endgame-trainer-c1ea6`;
        await execPromise(command);
        console.log(`✅ Imported chapter ${chapterId}: ${chapter.name}`);
      } catch (error) {
        console.error(
          `❌ Error importing chapter ${chapterId}:`,
          error.message,
        );
      }

      // Clean up temp file
      fs.unlinkSync(tempFile);
    }

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
    const { stdout: positionsOutput } = await execPromise(
      "firebase firestore:get positions --project chess-endgame-trainer-c1ea6",
    );
    console.log("✅ Positions collection verified");

    // Check categories
    const { stdout: categoriesOutput } = await execPromise(
      "firebase firestore:get categories --project chess-endgame-trainer-c1ea6",
    );
    console.log("✅ Categories collection verified");

    // Check chapters
    const { stdout: chaptersOutput } = await execPromise(
      "firebase firestore:get chapters --project chess-endgame-trainer-c1ea6",
    );
    console.log("✅ Chapters collection verified");
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
