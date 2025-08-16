/**
 * @file Async utility functions
 * @module utils/async
 *
 * @description
 * Provides testable async utilities for delays and timeouts
 */

/**
 * Creates a promise that resolves after the specified delay
 *
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Promise that resolves after delay
 *
 * @example
 * ```typescript
 * await delay(500); // Wait 500ms
 * const result = await fetchData();
 * ```
 */
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wraps a promise with a timeout
 *
 * @param {Promise<T>} promise - Promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {string} errorMessage - Error message on timeout
 * @returns {Promise<T>} Promise that rejects on timeout
 *
 * @example
 * ```typescript
 * const data = await withTimeout(
 *   fetchData(),
 *   5000,
 *   "Request timed out"
 * );
 * ```
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  errorMessage = 'Operation timed out'
): Promise<T> => {
  return Promise.race([promise, delay(ms).then(() => Promise.reject(new Error(errorMessage)))]);
};
