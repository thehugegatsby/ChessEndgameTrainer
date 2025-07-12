/**
 * Firebase Test Utilities
 * Pure utility functions for Firebase testing
 */

import { TEST_TIMEOUTS } from './firebase.constants';

/**
 * Generate unique test user email with optional seed for deterministic testing
 */
export function generateTestUserEmail(
  template: string = 'test',
  seed?: string
): string {
  const identifier = seed || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  return `${template}-${identifier}@test.local`;
}

/**
 * Generate unique test data ID with optional seed for deterministic testing
 */
export function generateTestId(
  prefix: string = 'test',
  seed?: string
): string {
  const identifier = seed || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  return `${prefix}-${identifier}`;
}

/**
 * Wait for async condition with configurable timeout and polling interval
 * @param condition Function that returns a Promise<boolean>
 * @param timeoutMs Maximum time to wait in milliseconds
 * @param intervalMs Polling interval in milliseconds
 * @throws Error if condition is not met within timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeoutMs: number = TEST_TIMEOUTS.DEFAULT_WAIT,
  intervalMs: number = TEST_TIMEOUTS.POLLING_INTERVAL
): Promise<void> {
  const startTime = Date.now();
  let attempt = 0;
  
  while (Date.now() - startTime < timeoutMs) {
    attempt++;
    
    try {
      if (await condition()) {
        return;
      }
    } catch (error) {
      // Log error but continue trying
      console.debug(`waitForCondition attempt ${attempt} failed:`, error);
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(
    `Condition not met within ${timeoutMs}ms after ${attempt} attempts`
  );
}

/**
 * Create a retry wrapper for flaky operations
 * @param operation Function to retry
 * @param maxAttempts Maximum number of attempts
 * @param delay Delay between attempts in milliseconds
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw new Error(
          `Operation failed after ${maxAttempts} attempts. Last error: ${lastError.message}`
        );
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Generate a deterministic test ID for reproducible tests
 */
export function generateDeterministicId(
  prefix: string,
  testName: string,
  index?: number
): string {
  const parts = [prefix, testName.replace(/\s+/g, '-').toLowerCase()];
  if (index !== undefined) {
    parts.push(index.toString());
  }
  return parts.join('-');
}

/**
 * Validate email format for test users
 */
export function isValidTestEmail(email: string): boolean {
  const testEmailPattern = /^[a-zA-Z0-9._-]+@test\.local$/;
  return testEmailPattern.test(email);
}

/**
 * Clean up test resources with error handling
 */
export async function cleanupWithTimeout<T>(
  cleanupFn: () => Promise<T>,
  timeoutMs: number = TEST_TIMEOUTS.DATA_OPERATION
): Promise<T | null> {
  try {
    return await Promise.race([
      cleanupFn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Cleanup timeout')), timeoutMs)
      )
    ]);
  } catch (error) {
    console.warn('Cleanup failed:', error);
    return null;
  }
}