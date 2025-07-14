/**
 * MSW Server Setup for E2E Tests
 * Handles server-side mocking during getStaticProps build-time
 * Expert validated: Industry Standard for Next.js SSG + E2E Testing
 */

import { setupServer } from 'msw/node';
import { handlers, errorHandlers } from './msw-handlers';

/**
 * MSW Server instance for Node.js environment
 * Intercepts fetch calls during getStaticProps execution
 */
export const server = setupServer(...handlers);

/**
 * MSW Server with error simulation
 * Use for error recovery and resilience testing
 */
export const errorServer = setupServer(...errorHandlers);

/**
 * Start MSW server for E2E tests
 * Call this before running tests that need API mocking
 */
export function startMSWServer() {
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unmocked requests for debugging
  });
  console.log('🚀 MSW Server started for E2E tests');
}

/**
 * Stop MSW server after tests
 * Clean shutdown to prevent memory leaks
 */
export function stopMSWServer() {
  server.close();
  console.log('🛑 MSW Server stopped');
}

/**
 * Reset MSW handlers between tests
 * Ensures clean test isolation
 */
export function resetMSWHandlers() {
  server.resetHandlers();
}

/**
 * Switch to error simulation mode
 * Use for testing error recovery workflows
 */
export function enableErrorSimulation() {
  server.use(...errorHandlers);
  console.log('⚠️ MSW Server: Error simulation enabled');
}

/**
 * Switch back to normal handlers
 * Use after error recovery tests
 */
export function disableErrorSimulation() {
  server.resetHandlers(...handlers);
  console.log('✅ MSW Server: Normal mode restored');
}