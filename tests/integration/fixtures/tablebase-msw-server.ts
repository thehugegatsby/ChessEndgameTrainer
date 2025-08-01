/**
 * MSW Server Setup for Tablebase API Integration Tests
 *
 * Following expert consensus: Fast mocked integration tests as primary defense,
 * with separate real API tests for contract validation.
 */

import { setupServer } from "msw/node";
import {
  tablebaseHandlers,
  tablebaseErrorHandlers,
} from "./tablebase-msw-handlers";

/**
 * MSW Server instance for integration tests
 * Intercepts tablebase API calls with realistic mock responses
 */
export /**
 *
 */
const tablebaseServer = setupServer(...tablebaseHandlers);

/**
 * MSW Server with error simulation for robustness testing
 */
export /**
 *
 */
const tablebaseErrorServer = setupServer(...tablebaseErrorHandlers);

/**
 * Start MSW server for integration tests
 * Call this in test setup to enable API mocking
 */
export function startTablebaseMSW() {
  tablebaseServer.listen({
    onUnhandledRequest: "warn", // Warn about unmocked requests for debugging
  });
  console.log("🎯 Tablebase MSW Server started for integration tests");
}

/**
 * Stop MSW server after tests
 * Clean shutdown to prevent memory leaks
 */
export function stopTablebaseMSW() {
  tablebaseServer.close();
  console.log("🛑 Tablebase MSW Server stopped");
}

/**
 * Reset MSW handlers between tests
 * Ensures clean test isolation
 */
export function resetTablebaseMSW() {
  tablebaseServer.resetHandlers();
}

/**
 * Switch to error simulation mode
 * Use for testing error recovery workflows
 */
export function enableTablebaseErrorSimulation() {
  tablebaseServer.use(...tablebaseErrorHandlers);
  console.log("⚠️ Tablebase MSW: Error simulation enabled");
}

/**
 * Switch back to normal handlers
 * Use after error recovery tests
 */
export function disableTablebaseErrorSimulation() {
  tablebaseServer.resetHandlers(...tablebaseHandlers);
  console.log("✅ Tablebase MSW: Normal mode restored");
}
