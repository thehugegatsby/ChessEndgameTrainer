import { vi } from 'vitest';
/**
 * Tests for TablebaseApiClient with request deduplication
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TablebaseApiClient, ApiError } from '../TablebaseApiClient';
import { TablebaseConfig } from '../../types/models';

// Mock fetch globally
global.fetch = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

// Mock AbortController for timeout tests
global.AbortController = vi.fn(() => ({
  signal: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
  abort: vi.fn(),
})) as unknown as typeof AbortController;

describe('TablebaseApiClient', () => {
  let client: TablebaseApiClient;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TablebaseApiClient();
    
    // Default successful response mock
    mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
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
      }),
    };
    mockFetch.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    client.clearPendingRequests();
  });

  describe('Basic functionality', () => {
    it('should make API request and return parsed response', async () => {
      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const result = await client.query(fen);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`fen=${encodeURIComponent(fen)}`),
        expect.objectContaining({
          headers: expect.objectContaining({ 
            'Accept': 'application/json',
            'User-Agent': 'ChessEndgameTrainer/1.0.0 (https://github.com/thehugegatsby/ChessEndgameTrainer)'
          }),
        })
      );
      expect(result).toEqual({
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
      });
    });

    it('should use provided configuration', () => {
      const customClient = new TablebaseApiClient(
        'https://custom.api.com',
        10000,
        5
      );
      expect(customClient).toBeDefined();
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
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
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
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not deduplicate different positions', async () => {
      const fen1 = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const fen2 = '8/8/8/8/8/8/8/7K w - - 0 1'; // Different position
      
      // Make concurrent requests for different positions
      const promises = [
        client.query(fen1),
        client.query(fen2)
      ];

      await Promise.all(promises);

      // Should make separate API calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
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
      
      // Mock a network error
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      expect(client.getPendingRequestsCount()).toBe(0);
      
      const promise = client.query(fen);
      expect(client.getPendingRequestsCount()).toBe(1);
      
      await expect(promise).rejects.toThrow();
      expect(client.getPendingRequestsCount()).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      await expect(client.query(fen)).rejects.toThrow(ApiError);
      await expect(client.query(fen)).rejects.toThrow('Position not in tablebase');
    });

    it('should handle rate limiting with retries', async () => {
      // Mock rate limit response, then success
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        })
        .mockResolvedValueOnce(mockResponse);

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      const result = await client.query(fen);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      // Mock AbortController behavior for timeout
      const abortController = {
        signal: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
        abort: vi.fn(),
      };
      global.AbortController = vi.fn(() => abortController) as any;

      // Mock fetch to throw AbortError
      mockFetch.mockRejectedValue(Object.assign(new Error('Request aborted'), { name: 'AbortError' }));

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      await expect(client.query(fen)).rejects.toThrow(ApiError);
      await expect(client.query(fen)).rejects.toThrow('timeout');
    }, 10000); // Increase timeout to 10 seconds

    it('should retry on transient errors', async () => {
      // Mock network error, then success
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      const result = await client.query(fen);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should exhaust retries and throw final error', async () => {
      // Create a client with shorter backoff for faster test
      const freshClient = new TablebaseApiClient(
        'https://tablebase.lichess.ovh/standard',
        5000,
        3  // 3 retries
      );
      
      // Mock persistent failure
      mockFetch.mockRejectedValue(new Error('Persistent error'));

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      await expect(freshClient.query(fen)).rejects.toThrow('Persistent error');
      
      // Should make maxRetries attempts (3 attempts total)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for this test
  });

  describe('Request management', () => {
    it('should allow clearing pending requests', () => {
      // Start a request but don't await it
      client.query('8/8/8/8/8/8/8/K7 w - - 0 1');
      
      expect(client.getPendingRequestsCount()).toBe(1);
      
      client.clearPendingRequests();
      expect(client.getPendingRequestsCount()).toBe(0);
    });

    it('should track pending requests count correctly', async () => {
      const fen1 = '8/8/8/8/8/8/8/K7 w - - 0 1';
      const fen2 = '8/8/8/8/8/8/8/7K w - - 0 1';
      
      expect(client.getPendingRequestsCount()).toBe(0);
      
      // Start concurrent requests for different positions
      const promise1 = client.query(fen1);
      const promise2 = client.query(fen2);
      
      expect(client.getPendingRequestsCount()).toBe(2);
      
      await Promise.all([promise1, promise2]);
      expect(client.getPendingRequestsCount()).toBe(0);
    });
  });

  describe('Configuration validation', () => {
    it('should accept valid custom configuration', () => {
      const client = new TablebaseApiClient(
        'https://api.example.com',
        8000,
        2
      );
      expect(client).toBeDefined();
    });

    it('should work with default configuration when no params provided', () => {
      const client = new TablebaseApiClient();
      expect(client).toBeDefined();
    });
  });

  describe('Response validation', () => {
    it('should validate response schema', async () => {
      // Mock invalid response
      mockResponse.json.mockResolvedValue({
        invalidField: 'invalid'
      });

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      await expect(client.query(fen)).rejects.toThrow();
    });

    it('should handle JSON parse errors', async () => {
      mockResponse.json.mockRejectedValue(new Error('Invalid JSON'));

      const fen = '8/8/8/8/8/8/8/K7 w - - 0 1';
      
      await expect(client.query(fen)).rejects.toThrow();
    });
  });
});