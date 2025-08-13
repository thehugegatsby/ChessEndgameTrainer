/**
 * Tests for TablebaseApiClient with request deduplication
 * 
 * Now using HttpProvider pattern for deterministic testing
 * without real timers or global mocks
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TablebaseApiClient, ApiError, type TablebaseApiClientConfig } from '../TablebaseApiClient';
import { MockHttpProvider } from './MockHttpProvider';
import { TablebaseConfig } from '../../types/models';
import { z } from 'zod';

describe('TablebaseApiClient', () => {
  let client: TablebaseApiClient;
  let mockHttp: MockHttpProvider;
  let mockApiResponse: any;

  beforeEach(() => {
    mockHttp = new MockHttpProvider();
    client = new TablebaseApiClient({}, mockHttp);
    
    // Default successful response
    mockApiResponse = {
      category: 'win',
      wdl: 2,
      dtz: 12,
      dtm: null,
      moves: [
        {
          uci: 'e2e4',
          san: 'e4',
          wdl: -1,
          dtz: 15,
          dtm: 12,
          category: 'blessed-loss'
        }
      ]
    };
    
    mockHttp.mockFetchJson(mockApiResponse);
  });

  afterEach(async () => {
    // Wait for any in-flight requests from the test to complete.
    // This prevents race conditions where a promise resolves *after* the test is done.
    await client.awaitPendingRequests();
    
    // Now that all requests are settled, we can safely check the final state.
    expect(client.getPendingRequestsCount()).toBe(0);
    
    // The explicit clearPendingRequests() call is now redundant and can be removed,
    // as the .finally() block in the production code should have already cleaned up.
    // client.clearPendingRequests();
    
    mockHttp.cleanup();
  });

  describe('Basic functionality', () => {
    it('should make API request and return parsed response', async () => {
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const result = await client.query(fen);

      // Check that fetch was called correctly
      expect(mockHttp.fetchCalls.length).toBe(1);
      const fetchCall = mockHttp.fetchCalls[0];
      expect(fetchCall.url).toContain(`fen=${encodeURIComponent(fen)}`);
      expect(fetchCall.timeoutMs).toBe(TablebaseConfig.REQUEST_TIMEOUT);
      expect(fetchCall.options?.headers).toEqual({
        'Accept': 'application/json',
        'User-Agent': 'ChessEndgameTrainer/1.0.0 (https://github.com/thehugegatsby/ChessEndgameTrainer)',
      });

      expect(result).toEqual(mockApiResponse);
    });

    it('should use provided configuration', async () => {
      const config: TablebaseApiClientConfig = {
        baseUrl: 'https://custom.api.com',
        timeout: 10000,
        maxRetries: 5
      };
      const customMockHttp = new MockHttpProvider();
      customMockHttp.mockFetchJson(mockApiResponse);
      const customClient = new TablebaseApiClient(config, customMockHttp);
      
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      await customClient.query(fen);

      // Verify the config is used
      expect(customMockHttp.fetchCalls[0].url).toContain('https://custom.api.com');
      expect(customMockHttp.fetchCalls[0].timeoutMs).toBe(10000);
      
      // Clean up custom client and mock
      await customClient.awaitPendingRequests();
      customMockHttp.cleanup();
      expect(customClient.getPendingRequestsCount()).toBe(0);
    });

    it('should use default configuration', () => {
      const defaultClient = new TablebaseApiClient();
      expect(defaultClient).toBeDefined();
    });
  });

  describe('Request deduplication', () => {
    it('should deduplicate identical concurrent requests', async () => {
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      // Make multiple concurrent requests
      const promises = [
        client.query(fen),
        client.query(fen),
        client.query(fen)
      ];

      const results = await Promise.all(promises);

      // Should only make one API call
      expect(mockHttp.fetchCalls.length).toBe(1);
      
      // All results should be identical
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
      
      // No pending requests after completion
      expect(client.getPendingRequestsCount()).toBe(0);
    });

    it('should normalize FEN for deduplication (ignore halfmove clock)', async () => {
      const fen1 = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const fen2 = '8/8/8/8/8/8/8/K7 w - - 5 10'; // Different halfmove/fullmove
      
      // Make concurrent requests with different move clocks
      const promises = [
        client.query(fen1),
        client.query(fen2)
      ];

      await Promise.all(promises);

      // Should only make one API call (FENs normalized to same key)
      expect(mockHttp.fetchCalls.length).toBe(1);
    });

    it('should not deduplicate different positions', async () => {
      const fen1 = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const fen2 = '8/8/8/8/8/8/8/7K w - - 0 1'; // Different position
      
      // Mock responses for both positions
      mockHttp.mockFetchSequence([
        { data: mockApiResponse },
        { data: { ...mockApiResponse, category: 'draw' } }
      ]);
      
      // Make concurrent requests for different positions
      const promises = [
        client.query(fen1),
        client.query(fen2)
      ];

      await Promise.all(promises);

      // Should make separate API calls
      expect(mockHttp.fetchCalls.length).toBe(2);
    });

    it('should clean up pending requests after completion', async () => {
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      expect(client.getPendingRequestsCount()).toBe(0);
      
      const promise = client.query(fen);
      expect(client.getPendingRequestsCount()).toBe(1);
      
      await promise;
      expect(client.getPendingRequestsCount()).toBe(0);
    });

    it('should clean up pending requests after error', async () => {
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      mockHttp.mockFetchError(new Error('Network error'));
      
      expect(client.getPendingRequestsCount()).toBe(0);
      
      try {
        // Act and await immediately inside the try block
        await client.query(fen);
        
        // This line should not be reached
        expect.fail('Expected query to reject, but it resolved');
      } catch (error) {
        // Assert that the error was caught correctly
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
      
      // Assert that the cleanup logic in .finally() has run
      expect(client.getPendingRequestsCount()).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle 404 not found without retrying', async () => {
      mockHttp.mockFetchStatus(404, 'Not Found');
      
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      // Test error type and message
      try {
        await client.query(fen);
        expect.fail('Expected query to reject with 404, but it resolved');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe('Position not in tablebase');
          expect(error.status).toBe(404);
          expect(error.code).toBe('NOT_FOUND');
        }
      }
      
      // Should not retry on 404
      expect(mockHttp.fetchCalls.length).toBe(1);
      expect(mockHttp.sleepCalls.length).toBe(0);
    });

    it('should handle rate limiting with retries', async () => {
      // Use mockFetchSequence for precise control
      mockHttp.mockFetchSequence([
        { status: 429 }, // First call: rate limited
        { data: mockApiResponse, status: 200 } // Second call: success
      ]);

      mockHttp.setRandomValue(0.5); // For deterministic jitter

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const result = await client.query(fen);
      
      // Assertions
      expect(mockHttp.fetchCalls.length).toBe(2); // Initial call + 1 retry
      expect(mockHttp.sleepCalls.length).toBe(1); // One sleep for the backoff
      
      // Check the backoff delay calculation
      const baseDelay = TablebaseConfig.BACKOFF_BASE_DELAY;
      const jitter = 0.5 * 0.3 * baseDelay;
      expect(mockHttp.sleepCalls[0]).toBe(baseDelay + jitter);

      expect(result).toEqual(mockApiResponse);
    });

    it('should handle timeout errors with retries', async () => {
      const timeoutError = new ApiError('Request timeout after 5000ms', undefined, 'TIMEOUT');
      
      // First two attempts timeout, third succeeds
      mockHttp.mockFetchSequence([
        { error: timeoutError },
        { error: timeoutError },
        { data: mockApiResponse, status: 200 }
      ]);
      
      mockHttp.setRandomValue(0); // No jitter for predictable delays

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const result = await client.query(fen);
      
      expect(mockHttp.fetchCalls.length).toBe(3);
      expect(mockHttp.sleepCalls.length).toBe(2);
      
      // Check exponential backoff
      const baseDelay = TablebaseConfig.BACKOFF_BASE_DELAY;
      expect(mockHttp.sleepCalls[0]).toBe(baseDelay); // First retry: base delay
      expect(mockHttp.sleepCalls[1]).toBe(baseDelay * 2); // Second retry: doubled
      
      expect(result).toEqual(mockApiResponse);
    });

    it('should handle network errors with retries', async () => {
      const networkError = new ApiError('Network error: Failed to fetch', undefined, 'NETWORK_ERROR');
      
      // Network error, then success
      mockHttp.mockFetchSequence([
        { error: networkError },
        { data: mockApiResponse, status: 200 }
      ]);
      
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const result = await client.query(fen);
      
      expect(mockHttp.fetchCalls.length).toBe(2);
      expect(result).toEqual(mockApiResponse);
    });

    it('should exhaust retries and throw final error', async () => {
      const customClient = new TablebaseApiClient({ maxRetries: 3 }, mockHttp);
      const persistentError = new Error('Network Error');
      mockHttp.mockFetchError(persistentError);

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      try {
        await customClient.query(fen);
        expect.fail('Expected query to reject after retries, but it resolved');
      } catch (error) {
        expect(error).toBe(persistentError);
      }

      // 1 initial attempt + 2 retries = 3 total attempts
      expect(mockHttp.fetchCalls.length).toBe(3);
      // A sleep should be called after the first and second failed attempts
      expect(mockHttp.sleepCalls.length).toBe(2);
      
      // Clean up custom client
      await customClient.awaitPendingRequests();
    });

    it('should handle API errors (500, 503, etc.) with retries', async () => {
      mockHttp.mockFetchSequence([
        { status: 503, statusText: 'Service Unavailable' },
        { status: 500, statusText: 'Internal Server Error' },
        { data: mockApiResponse, status: 200 }
      ]);
      
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const result = await client.query(fen);
      
      expect(mockHttp.fetchCalls.length).toBe(3);
      expect(mockHttp.sleepCalls.length).toBe(2);
      expect(result).toEqual(mockApiResponse);
    });

    it('should not retry on validation errors', async () => {
      const invalidResponse = { invalid: 'data' };
      mockHttp.mockFetchJson(invalidResponse);
      
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      await expect(client.query(fen)).rejects.toThrow(z.ZodError);
      
      // Should not retry on validation errors
      expect(mockHttp.fetchCalls.length).toBe(1);
      expect(mockHttp.sleepCalls.length).toBe(0);
    });

    it('should handle malformed JSON response', async () => {
      // Mock a response that will fail JSON parsing
      mockHttp.fetchHandler = async () => {
        return new Response('not json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      };
      
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      // Will throw on JSON parse, which should trigger retries
      try {
        await client.query(fen);
        expect.fail('Expected query to reject with JSON parse error, but it resolved');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(SyntaxError);
      }
      
      // Should retry on JSON parse errors
      expect(mockHttp.fetchCalls.length).toBe(TablebaseConfig.MAX_RETRIES);
    });
  });

  describe('Exponential backoff', () => {
    it('should apply exponential backoff with jitter', async () => {
      const config: TablebaseApiClientConfig = { maxRetries: 5 };
      const customClient = new TablebaseApiClient(config, mockHttp);
      
      // All attempts fail to test all backoff delays
      mockHttp.mockFetchError(new Error('Persistent error'));
      mockHttp.setRandomValue(0.5); // Deterministic jitter
      
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      try {
        await customClient.query(fen);
        expect.fail('Expected query to reject after retries, but it resolved');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Persistent error');
      }
      
      // Check that delays follow exponential pattern
      expect(mockHttp.sleepCalls.length).toBe(4); // 4 retries after initial attempt
      
      const baseDelay = TablebaseConfig.BACKOFF_BASE_DELAY;
      const jitterFactor = 0.5 * 0.3; // random() * 0.3
      
      // Expected delays with exponential backoff and jitter
      expect(mockHttp.sleepCalls[0]).toBeCloseTo(baseDelay * (1 + jitterFactor), 1);
      expect(mockHttp.sleepCalls[1]).toBeCloseTo(baseDelay * 2 * (1 + jitterFactor), 1);
      expect(mockHttp.sleepCalls[2]).toBeCloseTo(baseDelay * 4 * (1 + jitterFactor), 1);
      expect(mockHttp.sleepCalls[3]).toBeCloseTo(baseDelay * 8 * (1 + jitterFactor), 1);
      
      // Clean up custom client
      await customClient.awaitPendingRequests();
    });

    it('should cap backoff delay at maximum', async () => {
      const config: TablebaseApiClientConfig = { maxRetries: 6 };
      const customClient = new TablebaseApiClient(config, mockHttp);
      
      mockHttp.mockFetchError(new Error('Persistent error'));
      mockHttp.setRandomValue(0); // No jitter for clearer max cap test
      
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      try {
        await customClient.query(fen);
        expect.fail('Expected query to reject after retries, but it resolved');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Persistent error');
      }
      
      const baseDelay = TablebaseConfig.BACKOFF_BASE_DELAY;
      const maxDelay = baseDelay * Math.pow(2, 4); // Cap at 16x base
      
      // Last delay should be capped
      const lastDelay = mockHttp.sleepCalls[mockHttp.sleepCalls.length - 1];
      expect(lastDelay).toBeLessThanOrEqual(maxDelay);
      
      // Clean up custom client
      await customClient.awaitPendingRequests();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty moves array', async () => {
      const responseWithNoMoves = {
        category: 'draw',
        wdl: 0,
        dtz: null,
        dtm: null,
        moves: []
      };
      mockHttp.mockFetchJson(responseWithNoMoves);
      
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const result = await client.query(fen);
      
      expect(result.moves).toEqual([]);
      expect(result.category).toBe('draw');
    });

    it('should handle FEN with special characters', async () => {
      const complexFen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      
      await client.query(complexFen);
      
      const fetchCall = mockHttp.fetchCalls[0];
      expect(fetchCall.url).toContain(`fen=${encodeURIComponent(complexFen)}`);
    });

    it('should allow new requests after clearing pending ones', async () => {
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      // Mock a sequence of two successful responses
      mockHttp.mockFetchSequence([
        { data: mockApiResponse, status: 200 },
        { data: mockApiResponse, status: 200 }
      ]);

      // Start the first request. It gets stored in pendingRequests.
      const promise1 = client.query(fen);
      expect(client.getPendingRequestsCount()).toBe(1);
      expect(mockHttp.fetchCalls.length).toBe(1); // First API call is made

      // Immediately clear the pending request map.
      client.clearPendingRequests();
      expect(client.getPendingRequestsCount()).toBe(0);

      // Now, make the *same* query again. Since the map was cleared,
      // it should NOT be deduplicated and should trigger a new API call.
      const promise2 = client.query(fen);
      expect(client.getPendingRequestsCount()).toBe(1);
      expect(mockHttp.fetchCalls.length).toBe(2); // A second API call proves it wasn't deduplicated

      // Await both promises to ensure they complete cleanly before the test ends.
      // This is critical to prevent lifecycle errors.
      await Promise.all([promise1, promise2]);
    });
  });
});