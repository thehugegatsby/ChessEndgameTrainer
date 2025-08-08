// Test script to debug the store structure
// Run this in a Node environment with the store

import { useStore } from './shared/store/rootStore.js';

// Get the store state
const state = useStore.getState();

console.log("🔍 Store Structure Debug:");
console.log("=========================");

// Check root level keys
console.log("Root keys:", Object.keys(state));

// Check tablebase slice
console.log("\nTablebase slice keys:", Object.keys(state.tablebase || {}));

// Check what's in tablebase
console.log("\nTablebase slice contents:");
for (const key in state.tablebase) {
  console.log(`  ${key}: ${typeof state.tablebase[key]}`);
}

// Check specific actions
console.log("\nTablebase actions check:");
console.log("  setTablebaseMove:", typeof state.tablebase?.setTablebaseMove);
console.log("  setAnalysisStatus:", typeof state.tablebase?.setAnalysisStatus);
console.log("  setEvaluations:", typeof state.tablebase?.setEvaluations);

// Check if actions are at root level
console.log("\nRoot level actions check:");
console.log("  setTablebaseMove:", typeof state.setTablebaseMove);
console.log("  setAnalysisStatus:", typeof state.setAnalysisStatus);
console.log("  setEvaluations:", typeof state.setEvaluations);