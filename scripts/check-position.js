#!/usr/bin/env node

const admin = require("firebase-admin");
const path = require("path");

const SERVICE_ACCOUNT_PATH = "./src/config/serviceAccountKey.json";
const serviceAccount = require(path.resolve(SERVICE_ACCOUNT_PATH));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkPosition(id) {
  try {
    const doc = await db.collection("positions").doc(String(id)).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`Position ${id}:`);
      console.log(`  FEN: ${data.fen}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Description: ${data.description}`);
      console.log(`  Turn: ${data.fen.split(' ')[1] === 'w' ? 'White' : 'Black'} to move`);
    } else {
      console.log(`Position ${id} not found`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

checkPosition(2);