import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

async function testEmulatorConnection() {
  console.log("Testing Firebase Emulator connection...");

  try {
    // Initialize Firebase with dummy config (emulator doesn't need real config)
    const app = initializeApp({
      projectId: "test-project",
      apiKey: "test-key",
      authDomain: "test.firebaseapp.com",
    });

    const db = getFirestore(app);

    // Connect to emulator
    connectFirestoreEmulator(db, "localhost", 8080);

    // Test write
    console.log("Testing write operation...");
    const testCollection = collection(db, "test");
    const docRef = await addDoc(testCollection, {
      message: "Hello from emulator test!",
      timestamp: new Date(),
    });
    console.log("✓ Write successful:", docRef.id);

    // Test read
    console.log("Testing read operation...");
    const snapshot = await getDocs(testCollection);
    console.log("✓ Read successful, documents:", snapshot.size);

    console.log("\n✅ Emulator connection test passed!");
  } catch (error) {
    console.error("\n❌ Emulator connection test failed:", error);
    process.exit(1);
  }
}

testEmulatorConnection();
