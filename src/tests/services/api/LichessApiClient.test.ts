/**
 * @jest-environment node
 *
 * Comprehensive test suite for LichessApiClient
 *
 * @remarks
 * Tests the HTTP communication layer with the Lichess Tablebase API.
 * Uses MSW (Mock Service Worker) for realistic API response mocking.
 * Focuses on network concerns: timeouts, retries, error handling, response validation.
 */

import { describe, it, test, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { 
  LichessApiClient, 
  LichessApiError, 
  LichessApiTimeoutError,
  type LichessApiClientConfig
} from '../../../shared/services/api/LichessApiClient';

// Test configuration
const TEST_BASE_URL = 'https://test-tablebase.lichess.ovh/standard';
const TEST_FEN = 'K7/8/k7/8/8/8/8/8 w - - 0 1';

// MSW server setup
const server = setupServer();

// Helper to create valid tablebase responses
interface TablebaseResponse {
  category: string;
  dtz: number;
  dtm: number;
  checkmate: boolean;
  stalemate: boolean;
  variant_win: boolean;
  variant_loss: boolean;
  insufficient_material: boolean;
  moves: Array<{
    uci: string;
    san: string;
    category: string;
    dtz: number;
    dtm: number;
    zeroing: boolean;
    checkmate: boolean;
    stalemate: boolean;
    variant_win: boolean;
    variant_loss: boolean;
    insufficient_material: boolean;
  }>;
}

const createTablebaseResponse = (overrides: Partial<TablebaseResponse> = {}): TablebaseResponse => ({
  category: 'win',
  dtz: 1,
  dtm: 1,
  checkmate: false,
  stalemate: false,
  variant_win: false,
  variant_loss: false,
  insufficient_material: false,
  moves: [
    {
      uci: 'a1a2',
      san: 'Ka2',
      category: 'loss',
      dtz: -2,
      dtm: -2,
      zeroing: false,
      checkmate: false,
      stalemate: false,
      variant_win: false,
      variant_loss: false,
      insufficient_material: false
    }
  ],
  ...overrides
});

describe('LichessApiClient', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('Constructor and Configuration', () => {
    it('should use default configuration when no config provided', () => {
      const client = new LichessApiClient();
      
      // Test with a quick lookup to verify defaults work
      expect(client).toBeInstanceOf(LichessApiClient);
    });

    it('should accept custom configuration', () => {
      const config: LichessApiClientConfig = {
        baseUrl: TEST_BASE_URL,
        timeoutMs: 1000,
        maxRetries: 2,
        maxBackoffMs: 5000
      };
      
      const client = new LichessApiClient(config);
      expect(client).toBeInstanceOf(LichessApiClient);
    });

    it('should validate configuration parameters', () => {
      // Test negative timeoutMs
      expect(() => new LichessApiClient({ timeoutMs: -1 }))
        .toThrow('timeoutMs must be positive');
      
      // Test zero timeoutMs
      expect(() => new LichessApiClient({ timeoutMs: 0 }))
        .toThrow('timeoutMs must be positive');

      // Test negative maxRetries
      expect(() => new LichessApiClient({ maxRetries: -1 }))
        .toThrow('maxRetries must be non-negative');

      // Test negative maxBackoffMs
      expect(() => new LichessApiClient({ maxBackoffMs: -1 }))
        .toThrow('maxBackoffMs must be positive');
      
      // Test zero maxBackoffMs
      expect(() => new LichessApiClient({ maxBackoffMs: 0 }))
        .toThrow('maxBackoffMs must be positive');

      // Test empty baseUrl
      expect(() => new LichessApiClient({ baseUrl: '' }))
        .toThrow('baseUrl cannot be empty');
      
      // Test whitespace-only baseUrl
      expect(() => new LichessApiClient({ baseUrl: '   ' }))
        .toThrow('baseUrl cannot be empty');

      // Test that maxRetries = 0 is allowed (no retries)
      expect(() => new LichessApiClient({ maxRetries: 0 }))
        .not.toThrow();
    });
  });

  describe('Successful API Communication', () => {
    it('should successfully fetch tablebase data', async () => {
      const responseData = createTablebaseResponse({
        moves: [
          {
            uci: 'c7c8',
            san: 'Kc8',
            category: 'loss',
            dtz: -1,
            dtm: -1,
            zeroing: false,
            checkmate: false,
            stalemate: false,
            variant_win: false,
            variant_loss: false,
            insufficient_material: false
          }
        ]
      });
      
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return HttpResponse.json(responseData);
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      const result = await client.lookup(TEST_FEN);

      expect(result).toMatchObject({
        category: "win",
        checkmate: false,
        dtm: 1,
        dtz: 1,
        insufficient_material: false,
        moves: expect.arrayContaining([
          expect.objectContaining({
            category: "loss",
            dtm: -1,
            dtz: -1,
            san: "Kc8",
            uci: "c7c8",
            variant_loss: false,
            variant_win: false,
            zeroing: false,
          })
        ]),
        stalemate: false,
        variant_loss: false,
        variant_win: false,
      });
    });

    it('should include correct query parameters', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('fen')).toBe(TEST_FEN);
          expect(url.searchParams.get('moves')).toBe('20'); // default
          
          return HttpResponse.json(createTablebaseResponse());
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      await client.lookup(TEST_FEN);
    });

    it('should respect custom maxMoves parameter', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('moves')).toBe('5');
          
          return HttpResponse.json(createTablebaseResponse());
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      await client.lookup(TEST_FEN, 5);
    });

    it('should include proper headers', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, ({ request }) => {
          expect(request.headers.get('Accept')).toBe('application/json');
          expect(request.headers.get('User-Agent')).toBe('ChessEndgameTrainer/1.0');
          
          return HttpResponse.json(createTablebaseResponse());
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      await client.lookup(TEST_FEN);
    });
  });

  describe('HTTP Error Handling', () => {
    it('should throw LichessApiError for 404 responses', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return new HttpResponse(null, { status: 404, statusText: 'Not Found' });
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      
      await expect(client.lookup(TEST_FEN)).rejects.toThrow(LichessApiError);
      await expect(client.lookup(TEST_FEN)).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should throw LichessApiError for 500 responses', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      
      await expect(client.lookup(TEST_FEN)).rejects.toThrow(LichessApiError);
      await expect(client.lookup(TEST_FEN)).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should include status code in LichessApiError', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return new HttpResponse(null, { status: 403, statusText: 'Forbidden' });
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      
      try {
        await client.lookup(TEST_FEN);
        fail('Should have thrown LichessApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(LichessApiError);
        expect((error as LichessApiError).statusCode).toBe(403);
      }
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout and throw LichessApiTimeoutError', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          // Simulate slow response that exceeds timeout
          return new Promise(resolve => {
            setTimeout(() => resolve(HttpResponse.json(createTablebaseResponse())), 2000);
          });
        })
      );

      const client = new LichessApiClient({ 
        baseUrl: TEST_BASE_URL, 
        timeoutMs: 100, // Very short timeout
        maxRetries: 1 // No retries to speed up test
      });
      
      await expect(client.lookup(TEST_FEN)).rejects.toThrow(LichessApiTimeoutError);
      await expect(client.lookup(TEST_FEN)).rejects.toThrow('Request timed out after 100ms');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on 5xx errors and eventually succeed', async () => {
      let attemptCount = 0;
      
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          attemptCount++;
          
          if (attemptCount < 3) {
            return new HttpResponse(null, { status: 503, statusText: 'Service Unavailable' });
          }
          
          return HttpResponse.json(createTablebaseResponse());
        })
      );

      const client = new LichessApiClient({ 
        baseUrl: TEST_BASE_URL,
        maxRetries: 3
      });
      
      const result = await client.lookup(TEST_FEN);
      expect(result).toMatchObject({
        category: "win",
        checkmate: false,
        dtm: 1,
        dtz: 1,
        insufficient_material: false,
        moves: expect.any(Array),
        stalemate: false,
        variant_loss: false,
        variant_win: false,
      });
      expect(attemptCount).toBe(3);
    });

    it('should retry on 429 (rate limiting) and eventually succeed', async () => {
      let attemptCount = 0;
      
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          attemptCount++;
          
          if (attemptCount < 2) {
            return new HttpResponse(null, { status: 429, statusText: 'Too Many Requests' });
          }
          
          return HttpResponse.json(createTablebaseResponse());
        })
      );

      const client = new LichessApiClient({ 
        baseUrl: TEST_BASE_URL,
        maxRetries: 3
      });
      
      const result = await client.lookup(TEST_FEN);
      expect(result).toMatchObject({
        category: "win",
        checkmate: false,
        dtm: 1,
        dtz: 1,
        insufficient_material: false,
        moves: expect.any(Array),
        stalemate: false,
        variant_loss: false,
        variant_win: false,
      });
      expect(attemptCount).toBe(2);
    });

    it('should NOT retry on 4xx client errors (except 429)', async () => {
      let attemptCount = 0;
      
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          attemptCount++;
          return new HttpResponse(null, { status: 400, statusText: 'Bad Request' });
        })
      );

      const client = new LichessApiClient({ 
        baseUrl: TEST_BASE_URL,
        maxRetries: 3
      });
      
      await expect(client.lookup(TEST_FEN)).rejects.toThrow(LichessApiError);
      expect(attemptCount).toBe(1); // Should not retry
    });

    it('should exhaust all retries and throw final error', async () => {
      let attemptCount = 0;
      
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          attemptCount++;
          return new HttpResponse(null, { status: 503, statusText: 'Service Unavailable' });
        })
      );

      const client = new LichessApiClient({ 
        baseUrl: TEST_BASE_URL,
        maxRetries: 2
      });
      
      await expect(client.lookup(TEST_FEN)).rejects.toThrow(LichessApiError);
      expect(attemptCount).toBe(2); // Should retry maxRetries times
    });

    it('should apply exponential backoff with jitter', async () => {
      const startTime = Date.now();
      let attemptCount = 0;
      
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          attemptCount++;
          return new HttpResponse(null, { status: 503, statusText: 'Service Unavailable' });
        })
      );

      const client = new LichessApiClient({ 
        baseUrl: TEST_BASE_URL,
        maxRetries: 2
      });
      
      await expect(client.lookup(TEST_FEN)).rejects.toThrow();
      
      const elapsedTime = Date.now() - startTime;
      // Should take at least 250ms for the backoff between attempts
      expect(elapsedTime).toBeGreaterThan(200);
    });
  });

  describe('Response Validation', () => {
    it('should reject malformed JSON responses', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return new HttpResponse('invalid json', {
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      
      await expect(client.lookup(TEST_FEN)).rejects.toThrow();
    });

    it('should reject responses missing required fields', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return HttpResponse.json({
            // Missing required 'category' field
            dtz: 1,
            moves: []
          });
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      
      await expect(client.lookup(TEST_FEN)).rejects.toThrow('Malformed API response');
    });

    it('should accept responses with optional fields missing', async () => {
      const minimalResponse = {
        category: 'draw',
        dtz: null, // Required but can be null
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: false,
        insufficient_material: false,
        moves: []
        // dtm is optional and missing
      };
      
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return HttpResponse.json(minimalResponse);
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      const result = await client.lookup(TEST_FEN);
      
      expect(result.category).toBe('draw');
      expect(result.dtz).toBeNull();
      expect(result.moves).toEqual([]);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          throw new Error('Network error');
        })
      );

      const client = new LichessApiClient({ 
        baseUrl: TEST_BASE_URL,
        maxRetries: 1 
      });
      
      await expect(client.lookup(TEST_FEN)).rejects.toThrow();
    });
  });

  describe('Health Check', () => {
    it('should return true when API is healthy', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return HttpResponse.json(createTablebaseResponse());
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      const isHealthy = await client.healthCheck();
      
      expect(isHealthy).toBe(true);
    });

    it('should return false when API is unhealthy', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return new HttpResponse(null, { status: 503 });
        })
      );

      const client = new LichessApiClient({ 
        baseUrl: TEST_BASE_URL,
        maxRetries: 1 // Reduce retries for faster test
      });
      const isHealthy = await client.healthCheck();
      
      expect(isHealthy).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty moves array', async () => {
      const responseWithoutMoves = createTablebaseResponse({ moves: [] });
      
      server.use(
        http.get(`${TEST_BASE_URL}`, () => {
          return HttpResponse.json(responseWithoutMoves);
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      const result = await client.lookup(TEST_FEN);
      
      expect(result.moves).toEqual([]);
    });

    it('should handle FEN with special characters', async () => {
      const specialFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      server.use(
        http.get(`${TEST_BASE_URL}`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('fen')).toBe(specialFen);
          
          return HttpResponse.json(createTablebaseResponse());
        })
      );

      const client = new LichessApiClient({ baseUrl: TEST_BASE_URL });
      await client.lookup(specialFen);
    });
  });
});