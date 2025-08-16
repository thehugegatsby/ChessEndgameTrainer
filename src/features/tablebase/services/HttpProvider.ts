/**
 * HttpProvider - Abstraction for HTTP, time, and random operations
 *
 * Split into separate interfaces for better Interface Segregation (SOLID)
 * Enables dependency injection for testability
 */

import { ApiError } from './TablebaseApiClient';

/**
 * Interface for network operations
 */
export interface NetworkProvider {
  /**
   * Fetch with timeout support and optional abort signal
   * @param url - The URL to fetch
   * @param timeoutMs - Timeout in milliseconds
   * @param options - Fetch options including optional AbortSignal
   * @returns Promise that resolves to Response or rejects with timeout
   */
  fetchWithTimeout(
    url: string,
    timeoutMs: number,
    options?: RequestInit & { signal?: AbortSignal }
  ): Promise<Response>;
}

/**
 * Interface for time-based operations
 */
export interface TimeProvider {
  /**
   * Async sleep/delay
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after the delay
   */
  sleep(ms: number): Promise<void>;
}

/**
 * Interface for random number generation
 */
export interface RandomProvider {
  /**
   * Random number generator for jitter
   * @returns Random number between 0 and 1
   */
  random(): number;
}

/**
 * Combined interface for backward compatibility
 * Extends all three interfaces
 */
export interface HttpProvider extends NetworkProvider, TimeProvider, RandomProvider {}

/**
 * Production implementation using native browser/Node.js APIs
 */
export class RealHttpProvider implements HttpProvider {
  async fetchWithTimeout(
    url: string,
    timeoutMs: number,
    options: RequestInit & { signal?: AbortSignal } = {}
  ): Promise<Response> {
    // Create internal abort controller for timeout
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    // Combine external signal (if provided) with timeout signal
    const signals = [timeoutController.signal];
    if (options.signal) {
      signals.push(options.signal);
    }

    // Create combined abort controller
    const combinedController = new AbortController();

    // Abort combined controller if any signal fires
    const abortHandler = (): void => combinedController.abort();
    signals.forEach(signal => {
      signal.addEventListener('abort', abortHandler);
    });

    try {
      const response = await fetch(url, {
        ...options,
        signal: combinedController.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        // Use feature detection instead of string matching
        if (error.name === 'AbortError') {
          // Check if it was due to timeout or external cancellation
          if (timeoutController.signal.aborted) {
            throw new ApiError(`Request timeout after ${timeoutMs}ms`, undefined, 'TIMEOUT');
          } else {
            throw new ApiError('Request cancelled', undefined, 'CANCELLED');
          }
        }

        // Detect network errors using TypeError (standard for fetch failures)
        if (error instanceof TypeError) {
          throw new ApiError(`Network error: ${error.message}`, undefined, 'NETWORK_ERROR');
        }

        // Additional Node.js specific errors
        if (
          error.message &&
          (error.message.includes('ENOTFOUND') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('ETIMEDOUT'))
        ) {
          throw new ApiError(`Network error: ${error.message}`, undefined, 'NETWORK_ERROR');
        }
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      // Clean up event listeners
      signals.forEach(signal => {
        signal.removeEventListener('abort', abortHandler);
      });
    }
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  random(): number {
    return Math.random();
  }
}
