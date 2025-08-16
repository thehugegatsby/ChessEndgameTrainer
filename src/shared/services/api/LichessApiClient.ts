/**
 * Dedicated API client for Lichess Tablebase communication
 *
 * @remarks
 * This client handles all HTTP communication with the Lichess Tablebase API.
 * It's responsible for:
 * - Request construction and execution
 * - Timeout handling with AbortController
 * - Retry logic with exponential backoff
 * - HTTP error translation to domain-specific errors
 * - Response parsing and validation
 *
 * The client is intentionally focused on network concerns only.
 * Data transformation, caching, and business logic remain in TablebaseService.
 *
 * @example
 * const client = new LichessApiClient();
 * try {
 *   const response = await client.lookup(fen);
 *   // console.log(`Category: ${response.category}`);
 * } catch (error) {
 *   if (error instanceof LichessApiError) {
 *     // console.error(`API Error ${error.statusCode}: ${error.message}`);
 *   }
 * }
 */

import { z } from 'zod';
import { getLogger } from '../logging';
import { LichessTablebaseResponseSchema } from '../../types/tablebaseSchemas';
import type { LichessTablebaseResponse } from '../../types/tablebase';
import { API_TIMEOUTS_MS } from '../../../constants/time.constants';
import { HTTP_STATUS } from '../../../constants/api.constants';

/**
 * API-specific error for Lichess Tablebase communication
 */
export class LichessApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'LichessApiError';

    // Maintain proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LichessApiError);
    }
  }
}

/**
 * Timeout-specific error for request timeouts
 */
export class LichessApiTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'LichessApiTimeoutError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LichessApiTimeoutError);
    }
  }
}

/**
 * Configuration interface for LichessApiClient
 */
export interface LichessApiClientConfig {
  /** Base URL for the Lichess Tablebase API */
  baseUrl?: string;

  /** Request timeout in milliseconds */
  timeoutMs?: number;

  /** Maximum number of retry attempts */
  maxRetries?: number;

  /** Maximum delay for exponential backoff in milliseconds */
  maxBackoffMs?: number;
}

/**
 * HTTP client for Lichess Tablebase API
 *
 * Handles all network communication with proper error handling,
 * retry logic, and timeout management.
 */
export class LichessApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly maxBackoffMs: number;

  constructor(config: LichessApiClientConfig = {}) {
    // Validate configuration parameters
    if (config.timeoutMs !== undefined && config.timeoutMs <= 0) {
      throw new Error('timeoutMs must be positive');
    }
    if (config.maxRetries !== undefined && config.maxRetries < 0) {
      throw new Error('maxRetries must be non-negative');
    }
    if (config.maxBackoffMs !== undefined && config.maxBackoffMs <= 0) {
      throw new Error('maxBackoffMs must be positive');
    }
    if (config.baseUrl !== undefined && !config.baseUrl.trim()) {
      throw new Error('baseUrl cannot be empty');
    }

    this.baseUrl = config.baseUrl || 'https://tablebase.lichess.ovh/standard';
    this.timeoutMs = config.timeoutMs || API_TIMEOUTS_MS.LICHESS_DEFAULT;
    this.maxRetries = config.maxRetries || 3;
    this.maxBackoffMs = config.maxBackoffMs || API_TIMEOUTS_MS.LICHESS_TABLEBASE;
  }

  /**
   * Fetch tablebase data for a given position
   *
   * @param fen - Position in FEN notation
   * @param maxMoves - Maximum number of moves to request (default: 20)
   * @returns Promise resolving to validated API response
   * @throws {LichessApiError} For HTTP errors (4xx, 5xx)
   * @throws {LichessApiTimeoutError} For request timeouts
   * @throws {Error} For validation errors or unexpected failures
   *
   * @example
   * const response = await client.lookup("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
   */
  async lookup(fen: string, maxMoves: number = 20): Promise<LichessTablebaseResponse> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this._executeRequest(fen, maxMoves);
        return response;
      } catch (error) {
        // Don't retry on client errors (4xx) except 429 (rate limiting)
        if (error instanceof LichessApiError) {
          if (
            error.statusCode >= HTTP_STATUS.BAD_REQUEST &&
            error.statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR &&
            error.statusCode !== HTTP_STATUS.TOO_MANY_REQUESTS
          ) {
            throw error;
          }
        }

        // Last attempt - throw the error
        if (attempt === this.maxRetries) {
          if (error instanceof LichessApiTimeoutError) {
            throw new LichessApiTimeoutError(this.timeoutMs * this.maxRetries);
          }
          throw error;
        }

        // Calculate backoff delay for retry
        const baseDelay = API_TIMEOUTS_MS.RETRY_DELAY_BASE * attempt;
        const jitter = Math.random() * API_TIMEOUTS_MS.RETRY_DELAY_MAX;
        const delay = Math.min(baseDelay + jitter, this.maxBackoffMs);

        await this._sleep(delay);
      }
    }

    // Should never reach here due to maxRetries check above
    throw new Error('Unexpected error in retry loop');
  }

  /**
   * Execute a single HTTP request to the API
   * @private
   */
  private async _executeRequest(fen: string, maxMoves: number): Promise<LichessTablebaseResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${this.baseUrl}?fen=${encodeURIComponent(fen)}&moves=${maxMoves}`;
      getLogger().info(`[LichessApiClient] Calling URL: ${url}`);
      getLogger().info(`[LichessApiClient] Raw FEN: "${fen}"`);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ChessEndgameTrainer/1.0',
        },
      });

      clearTimeout(timeoutId);
      getLogger().debug(
        `[LichessApiClient] Response status: ${response.status}, content-type: ${response.headers.get('content-type')}`
      );

      if (!response.ok) {
        throw new LichessApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const responseText = await response.text();
      getLogger().debug(
        `[LichessApiClient] Response body (first ${HTTP_STATUS.OK} chars): ${responseText.substring(0, HTTP_STATUS.OK)}`
      );

      const responseData = JSON.parse(responseText);

      // Validate response structure with Zod
      try {
        return LichessTablebaseResponseSchema.parse(responseData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          // Use the same error message format as the original TablebaseService
          throw new Error('Malformed API response');
        }
        throw validationError;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle AbortError (timeout) - can be Error or DOMException
      if (
        (error instanceof Error && error.name === 'AbortError') ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        throw new LichessApiTimeoutError(this.timeoutMs);
      }

      // Handle fetch errors (network issues, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new LichessApiError('Network error during API request', 0, error);
      }

      // Re-throw API errors and validation errors as-is
      throw error;
    }
  }

  /**
   * Sleep for specified milliseconds
   * @private
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for the API endpoint
   *
   * @returns Promise resolving to true if API is reachable
   *
   * @example
   * const isHealthy = await client.healthCheck();
   * if (!isHealthy) {
   *   console.warn('Lichess API is not responding');
   * }
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use a simple, known position for health check
      const testFen = '8/8/8/8/8/8/8/K7 w - - 0 1'; // King vs empty board
      await this.lookup(testFen, 1);
      return true;
    } catch {
      return false;
    }
  }
}
