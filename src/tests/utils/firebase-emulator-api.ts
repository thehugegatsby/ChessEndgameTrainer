/**
 * Firebase Emulator REST API Client
 * Clean architecture for test data management using official Emulator APIs
 */

// Node.js 18+ has native fetch, no import needed

const EMULATOR_HOST = process.env['FIRESTORE_EMULATOR_HOST'] || "localhost:8080";
const PROJECT_ID = "endgame-trainer-test";

/**
 * Clear all Firestore data using Emulator REST API
 * This is the cleanest and fastest way to reset test data
 */
export async function clearAllFirestoreData(): Promise<void> {
  const url = `http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

  const response = await fetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to clear Firestore: ${response.status} ${response.statusText}`,
    );
  }
}

/**
 * Clear specific collection using Emulator REST API
 */
export async function clearCollection(collectionName: string): Promise<void> {
  const url = `http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}`;

  const response = await fetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to clear collection ${collectionName}: ${response.status} ${response.statusText}`,
    );
  }
}

/**
 * Import data into Firestore using Emulator REST API
 * This allows bulk import of test data efficiently
 */
export async function importFirestoreData(data: any): Promise<void> {
  const url = `http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents:import`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to import data: ${response.status} ${response.statusText}`,
    );
  }
}

/**
 * Export current Firestore data using Emulator REST API
 * Useful for debugging test failures
 */
export async function exportFirestoreData(): Promise<any> {
  const url = `http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents:export`;

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to export data: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Check if emulator is running
 */
export async function isEmulatorRunning(): Promise<boolean> {
  try {
    const url = `http://${EMULATOR_HOST}/`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for emulator to be ready
 */
export async function waitForEmulator(
  maxAttempts = 30,
  delayMs = 1000,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isEmulatorRunning()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error("Firebase Emulator did not start in time");
}

/**
 * Clear all data from Auth emulator
 * Ensures complete cleanup between tests
 */
export async function clearAllAuthData(): Promise<void> {
  const AUTH_EMULATOR_HOST = process.env['AUTH_EMULATOR_HOST'] || "localhost:9099";
  const url = `http://${AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
      // 404 is OK - means no accounts exist
      throw new Error(
        `Failed to clear Auth data: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error: any) {
    // Ignore connection errors if Auth emulator is not running
    if (error.code !== 'ECONNREFUSED') {
      console.warn("Warning: Could not clear Auth data:", error.message);
    }
  }
}

/**
 * Atomic cleanup of all Firebase emulator data
 * Clears both Firestore and Auth data in parallel
 */
export async function clearAllEmulatorData(): Promise<void> {
  await Promise.all([
    clearAllFirestoreData(),
    clearAllAuthData()
  ]);
}
