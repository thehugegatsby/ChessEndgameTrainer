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
import type { HttpProvider } from './HttpProvider';
import { RealHttpProvider } from './HttpProvider';
import { HttpStatus } from '@/shared/constants/http';
import { CACHE_THRESHOLDS } from '@/shared/constants/cache';

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

export interface TablebaseApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export class TablebaseApiClient implements TablebaseApiClientInterface {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly pendingRequests = new Map<string, Promise<TablebaseApiResponse>>();
  private readonly http: HttpProvider;

  constructor(
    config: TablebaseApiClientConfig = {},
    httpProvider: HttpProvider = new RealHttpProvider()
  ) {
    this.baseUrl = config.baseUrl ?? TablebaseConfig.API_BASE_URL;
    this.timeout = config.timeout ?? TablebaseConfig.REQUEST_TIMEOUT;
    this.maxRetries = config.maxRetries ?? TablebaseConfig.MAX_RETRIES;
    this.http = httpProvider;
  }

  /**
   * Query the tablebase API for a position
   * 
   * @param fen - Position in FEN notation
   * @returns Validated API response
   * @throws {ApiError} for HTTP errors
   * @throws {z.ZodError} for validation errors
   */
  query(fen: string): Promise<TablebaseApiResponse> {
    // Normalize FEN for consistent caching (remove halfmove clock and fullmove number)
    const normalizedFen = fen.split(' ').slice(0, 4).join(' ');
    
    // Check if request is already in flight (request deduplication)
    const existingRequest = this.pendingRequests.get(normalizedFen);
    if (existingRequest) {
      return existingRequest;
    }
    
    // Create new request promise
    const requestPromise = this.executeQuery(fen);
    
    // Store the promise IMMEDIATELY before adding cleanup
    // This prevents race conditions where multiple calls arrive between promise creation and storage
    this.pendingRequests.set(normalizedFen, requestPromise);
    
    // Add cleanup after the promise settles (resolve or reject)
    requestPromise.finally(() => {
      this.pendingRequests.delete(normalizedFen);
    });
    
    return requestPromise;
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
        const response = await this.http.fetchWithTimeout(url, this.timeout, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ChessEndgameTrainer/1.0.0 (https://github.com/thehugegatsby/ChessEndgameTrainer)',
          },
        });
        
        // Handle different status codes
        if (response.status === HttpStatus.NOT_FOUND) {
          // Position not in tablebase - this is expected for some positions
          throw new ApiError('Position not in tablebase', HttpStatus.NOT_FOUND, 'NOT_FOUND');
        }
        
        if (response.status === HttpStatus.TOO_MANY_REQUESTS) {
          // Rate limited - wait before retry
          const delay = this.getBackoffDelay(attempt);
          await this.http.sleep(delay);
          lastError = new ApiError('Rate limited', HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
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
            (error instanceof ApiError && error.status === HttpStatus.NOT_FOUND)) {
          throw error;
        }
        
        // For other errors, retry if we have attempts left
        if (attempt < this.maxRetries) {
          const delay = this.getBackoffDelay(attempt);
          await this.http.sleep(delay);
          continue;
        }
      }
    }
    
    // All retries exhausted
    throw lastError || new ApiError('Max retries exceeded');
  }

  /**
   * Calculate exponential backoff delay with deterministic jitter
   */
  private getBackoffDelay(attempt: number): number {
    const baseDelay = TablebaseConfig.BACKOFF_BASE_DELAY;
    const maxDelay = baseDelay * Math.pow(2, 4); // Cap at 16 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter to prevent thundering herd (using injected random)
    const jitter = this.http.random() * CACHE_THRESHOLDS.MIN_HIT_RATE * delay;
    
    return delay + jitter;
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

  /**
   * Waits for all pending requests to settle (for testing).
   * This ensures that async operations are complete before test cleanup.
   */
  async awaitPendingRequests(): Promise<void> {
    await Promise.allSettled(this.pendingRequests.values());
  }
}

// Export singleton instance
export const tablebaseApiClient = new TablebaseApiClient();