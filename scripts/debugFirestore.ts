/**
 * Debug script to check Firestore emulator data
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
} from "firebase/firestore";

async function debugFirestore() {
  console.log("🔍 Debugging Firestore emulator...");

  try {
    // Initialize Firebase
    const app = initializeApp({
      projectId: "test-project",
      apiKey: "test-key",
      authDomain: "test.firebaseapp.com",
    });

    const db = getFirestore(app);

    // Connect to emulator
    console.log("📡 Connecting to Firestore emulator...");
    try {
      connectFirestoreEmulator(db, "localhost", 8080);
    } catch (error) {
      console.log("📡 Emulator already connected");
    }

    // List all positions
    console.log("📋 Listing all positions...");
    const positionsRef = collection(db, "positions");
    const snapshot = await getDocs(positionsRef);

    console.log(`Found ${snapshot.size} positions:`);
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(
        `- Position ${doc.id}: "${data['title']}" (data.id: ${data['id']})`,
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugFirestore();
