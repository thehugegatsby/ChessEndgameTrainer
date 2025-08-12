/**
 * TablebaseApiClient - Thin HTTP Client for Lichess Tablebase API
 * 
 * Handles HTTP communication with the Lichess Tablebase API.
 * Includes retry logic, timeout handling, and response validation.
 */

import type { 
  TablebaseApiClientInterface, 
  TablebaseApiResponse
} from '../types/interfaces';
import { TablebaseApiResponseSchema, TablebaseConfig } from '../types/models';
import { z } from 'zod';

/**
 * Custom error for API-specific failures
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class TablebaseApiClient implements TablebaseApiClientInterface {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly pendingRequests = new Map<string, Promise<TablebaseApiResponse>>();

  constructor(
    baseUrl: string = TablebaseConfig.API_BASE_URL,
    timeout: number = TablebaseConfig.REQUEST_TIMEOUT,
    maxRetries: number = TablebaseConfig.MAX_RETRIES
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  /**
   * Query the tablebase API for a position
   * 
   * @param fen - Position in FEN notation
   * @returns Validated API response
   * @throws {ApiError} for HTTP errors
   * @throws {z.ZodError} for validation errors
   */
  async query(fen: string): Promise<TablebaseApiResponse> {
    // Normalize FEN for consistent caching (remove halfmove clock and fullmove number)
    const normalizedFen = fen.split(' ').slice(0, 4).join(' ');
    
    // Check if request is already in flight (request deduplication)
    const existingRequest = this.pendingRequests.get(normalizedFen);
    if (existingRequest) {
      return existingRequest;
    }
    
    // Create new request with cleanup
    const requestPromise = this.executeQuery(fen);
    
    // Store promise with cleanup on completion
    const requestWithCleanup = requestPromise.finally(() => {
      this.pendingRequests.delete(normalizedFen);
    });
    
    this.pendingRequests.set(normalizedFen, requestWithCleanup);
    return requestWithCleanup;
  }

  /**
   * Execute the actual API query with retries
   */
  private async executeQuery(fen: string): Promise<TablebaseApiResponse> {
    const url = `${this.baseUrl}?fen=${encodeURIComponent(fen)}`;
    
    // Try with retries
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url);
        
        // Handle different status codes
        if (response.status === 404) {
          // Position not in tablebase - this is expected for some positions
          throw new ApiError('Position not in tablebase', 404, 'NOT_FOUND');
        }
        
        if (response.status === 429) {
          // Rate limited - wait before retry
          const delay = this.getBackoffDelay(attempt);
          await this.sleep(delay);
          lastError = new ApiError('Rate limited', 429, 'RATE_LIMITED');
          continue;
        }
        
        if (!response.ok) {
          throw new ApiError(
            `API error: ${response.status} ${response.statusText}`,
            response.status,
            'API_ERROR'
          );
        }
        
        // Parse and validate response
        const data = await response.json();
        const validated = TablebaseApiResponseSchema.parse(data);
        
        return validated;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors or 404s
        if (error instanceof z.ZodError || 
            (error instanceof ApiError && error.status === 404)) {
          throw error;
        }
        
        // For other errors, retry if we have attempts left
        if (attempt < this.maxRetries) {
          const delay = this.getBackoffDelay(attempt);
          await this.sleep(delay);
          continue;
        }
      }
    }
    
    // All retries exhausted
    throw lastError || new ApiError('Max retries exceeded');
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      return response;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(`Request timeout after ${this.timeout}ms`, undefined, 'TIMEOUT');
      }
      throw error;
      
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private getBackoffDelay(attempt: number): number {
    const baseDelay = TablebaseConfig.BACKOFF_BASE_DELAY;
    const maxDelay = baseDelay * Math.pow(2, 4); // Cap at 16 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    
    return delay + jitter;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear pending requests (for testing)
   */
  clearPendingRequests(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get the number of pending requests (for monitoring)
   */
  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }
}

// Export singleton instance
export const tablebaseApiClient = new TablebaseApiClient();