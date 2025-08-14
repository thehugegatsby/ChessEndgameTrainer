/**
 * MockHttpProvider - Test implementation of HttpProvider
 * 
 * Provides deterministic HTTP and async operations for testing.
 * Features:
 * - Configurable responses and errors
 * - Call tracking for assertions
 * - Instant resolution (no real delays)
 * - Deterministic random numbers
 */

import type { HttpProvider } from '../HttpProvider';

type FetchHandler = (url: string, timeoutMs: number, options?: RequestInit) => Promise<Response>;

interface MockResponse {
  data?: unknown;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  error?: Error;
}

export class MockHttpProvider implements HttpProvider {
  private fetchHandler!: FetchHandler;
  private randomValue: number = 0.5; // Default deterministic random value
  private abortHandlers: Set<() => void> = new Set(); // Track abort handlers for cleanup
  
  // Call tracking
  public sleepCalls: number[] = [];
  public fetchCalls: Array<{ url: string; timeoutMs: number; options?: RequestInit }> = [];
  public randomCalls: number = 0;
  public abortCalls: number = 0; // Track external abort calls

  constructor() {
    this.reset();
  }

  fetchWithTimeout(url: string, timeoutMs: number, options?: RequestInit): Promise<Response> {
    if (options) {
      this.fetchCalls.push({ url, timeoutMs, options });
    } else {
      this.fetchCalls.push({ url, timeoutMs });
    }
    return this.fetchHandler(url, timeoutMs, options);
  }

  sleep(ms: number): Promise<void> {
    this.sleepCalls.push(ms);
    // In tests, sleep resolves immediately for deterministic behavior
    return Promise.resolve();
  }

  random(): number {
    this.randomCalls++;
    return this.randomValue;
  }

  // --- Test Configuration Methods ---

  /**
   * Reset all state and set default behavior
   * Cleans up all tracking arrays and counters
   */
  reset(): void {
    this.sleepCalls = [];
    this.fetchCalls = [];
    this.randomCalls = 0;
    this.abortCalls = 0;
    this.randomValue = 0.5;
    this.abortHandlers.clear();
    
    // Default to successful empty JSON response
    this.mockFetchJson({});
  }

  /**
   * Set the value returned by random()
   */
  setRandomValue(value: number): void {
    this.randomValue = value;
  }

  /**
   * Mock a JSON response
   */
  mockFetchJson(data: unknown, status = 200, statusText = 'OK'): void {
    this.fetchHandler = () => {
      const body = JSON.stringify(data);
      const init: ResponseInit = {
        status,
        statusText,
        headers: { 'Content-Type': 'application/json' }
      };
      
      // Create Response with proper json() method
      const response = new Response(body, init);
      return Promise.resolve(response);
    };
  }

  /**
   * Mock an error response
   * Uses async rejection to avoid Vitest unhandled rejection warnings
   */
  mockFetchError(error: Error): void {
    this.fetchHandler = () => {
      // Return a rejected promise directly instead of throwing
      // This ensures the rejection is properly handled in the promise chain
      return Promise.reject(error);
    };
  }

  /**
   * Mock a specific status code response
   */
  mockFetchStatus(status: number, statusText?: string): void {
    this.fetchHandler = () => {
      return Promise.resolve(new Response(null, { 
        status, 
        statusText: statusText || this.getDefaultStatusText(status) 
      }));
    };
  }

  /**
   * Mock a sequence of responses (for retry testing)
   */
  mockFetchSequence(responses: MockResponse[]): void {
    let callCount = 0;
    this.fetchHandler = () => {
      const response = responses[callCount++];
      
      if (!response) {
        // Return rejected promise instead of throwing
        return Promise.reject(new Error('Mock fetch sequence exhausted'));
      }
      
      if (response.error) {
        // Return rejected promise instead of throwing
        return Promise.reject(response.error);
      }
      
      const body = response.data ? JSON.stringify(response.data) : null;
      const headers = new Headers(response.headers || {});
      
      if (response.data && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      
      return Promise.resolve(new Response(body, {
        status: response.status || 200,
        statusText: response.statusText || this.getDefaultStatusText(response.status || 200),
        headers
      }));
    };
  }

  /**
   * Helper to get default status text for common codes
   */
  private getDefaultStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable'
    };
    return statusTexts[status] || '';
  }

  // --- Assertion Helpers ---

  /**
   * Check if fetch was called with expected URL
   */
  wasCalledWithUrl(url: string): boolean {
    return this.fetchCalls.some(call => call.url === url);
  }

  /**
   * Get the total delay from all sleep calls
   */
  getTotalSleepTime(): number {
    return this.sleepCalls.reduce((sum, ms) => sum + ms, 0);
  }

  /**
   * Check if expected number of retries occurred
   */
  getRetryCount(): number {
    // First call is not a retry
    return Math.max(0, this.fetchCalls.length - 1);
  }

  /**
   * Simulate an external abort signal
   * Useful for testing cancellation behavior
   */
  simulateAbort(): void {
    this.abortCalls++;
    this.abortHandlers.forEach(handler => handler());
  }

  /**
   * Clean up all resources (for use in afterEach)
   */
  cleanup(): void {
    this.reset();
  }
}