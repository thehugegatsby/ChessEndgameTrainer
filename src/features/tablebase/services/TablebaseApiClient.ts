/**
 * TablebaseApiClient - Thin HTTP Client for Lichess Tablebase API
 *
 * Handles HTTP communication with the Lichess Tablebase API.
 * Includes retry logic, timeout handling, and response validation.
 */

import type { TablebaseApiClientInterface, TablebaseApiResponse } from '../types/interfaces';
import { TablebaseApiResponseSchema } from '../types/models';
import { z } from 'zod';
import type { HttpProvider } from './HttpProvider';
import { RealHttpProvider } from './HttpProvider';
import { HttpStatus } from '@/shared/constants/http';
import { HTTP_RETRY, HTTP_HEADERS } from '@/shared/constants/http.constants';
import { EXTERNAL_APIS, APP_META } from '@/shared/constants/meta.constants';
import { FEN, ARRAY_INDICES } from '@/shared/constants/chess.constants';
import { TABLEBASE_API_ERRORS, TABLEBASE_CONFIG } from '../constants/tablebase.constants';

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
    this.baseUrl = config.baseUrl ?? EXTERNAL_APIS.LICHESS_TABLEBASE.BASE_URL;
    this.timeout = config.timeout ?? TABLEBASE_CONFIG.QUERY_TIMEOUT;
    this.maxRetries = config.maxRetries ?? HTTP_RETRY.MAX_RETRIES;
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
    const normalizedFen = fen.split(' ').slice(0, FEN.NORMALIZATION_FIELDS).join(' ');

    // Check if request is already in flight (request deduplication)
    const existingRequest = this.pendingRequests.get(normalizedFen);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request promise WITHOUT finally() for clean tracking
    const requestPromise = this.executeQuery(fen);

    // Store the raw promise for deduplication (without finally() to avoid race condition)
    // See docs/troubleshooting/vitest-async-patterns.md for detailed explanation
    this.pendingRequests.set(normalizedFen, requestPromise);

    // Return promise with cleanup attached (but don't store this version)
    return requestPromise.finally(() => {
      this.pendingRequests.delete(normalizedFen);
    });
  }

  /**
   * Execute the actual API query with retries
   */
  private async executeQuery(fen: string): Promise<TablebaseApiResponse> {
    const url = `${this.baseUrl}?fen=${encodeURIComponent(fen)}`;

    // Try with retries
    let lastError: Error | undefined;

    for (let attempt = ARRAY_INDICES.LOOP_START; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.http.fetchWithTimeout(url, this.timeout, {
          headers: {
            ...HTTP_HEADERS.ACCEPT_JSON,
            'User-Agent': APP_META.USER_AGENT,
          },
        });

        // Handle different status codes
        if (response.status === HttpStatus.NOT_FOUND) {
          // Position not in tablebase - this is expected for some positions
          throw new ApiError(
            TABLEBASE_API_ERRORS.NOT_FOUND.MESSAGE,
            HttpStatus.NOT_FOUND,
            TABLEBASE_API_ERRORS.NOT_FOUND.CODE
          );
        }

        if (response.status === HttpStatus.TOO_MANY_REQUESTS) {
          // Rate limited - wait before retry
          const delay = this.getBackoffDelay(attempt);
          await this.http.sleep(delay);
          lastError = new ApiError(
            TABLEBASE_API_ERRORS.RATE_LIMITED.MESSAGE,
            HttpStatus.TOO_MANY_REQUESTS,
            TABLEBASE_API_ERRORS.RATE_LIMITED.CODE
          );
          continue;
        }

        if (!response.ok) {
          throw new ApiError(
            `${TABLEBASE_API_ERRORS.GENERIC_ERROR.MESSAGE}: ${response.status} ${response.statusText}`,
            response.status,
            TABLEBASE_API_ERRORS.GENERIC_ERROR.CODE
          );
        }

        // Parse and validate response
        const data = await response.json();
        const validated = TablebaseApiResponseSchema.parse(data);

        return validated;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation errors or 404s
        if (
          error instanceof z.ZodError ||
          (error instanceof ApiError && error.status === HttpStatus.NOT_FOUND)
        ) {
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
    throw (
      lastError ||
      new ApiError(
        TABLEBASE_API_ERRORS.MAX_RETRIES_EXCEEDED.MESSAGE,
        undefined,
        TABLEBASE_API_ERRORS.MAX_RETRIES_EXCEEDED.CODE
      )
    );
  }

  /**
   * Calculate exponential backoff delay with deterministic jitter
   */
  private getBackoffDelay(attempt: number): number {
    const baseDelay = HTTP_RETRY.BACKOFF_BASE_DELAY;
    const maxDelay =
      baseDelay * Math.pow(HTTP_RETRY.BACKOFF_FACTOR, HTTP_RETRY.MAX_BACKOFF_EXPONENT);
    const delay = Math.min(baseDelay * Math.pow(HTTP_RETRY.BACKOFF_FACTOR, attempt - 1), maxDelay);

    // Add jitter to prevent thundering herd (using injected random)
    const jitter = this.http.random() * HTTP_RETRY.JITTER_FACTOR * delay;

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
