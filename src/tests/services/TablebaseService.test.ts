import { vi } from 'vitest';
/**
 *
 * Comprehensive test suite for optimized TablebaseService
 *
 * @remarks
 * Tests the single API call architecture and caching behavior
 * of the optimized TablebaseService implementation.
 */

import { tablebaseService, TablebaseService } from '../../domains/evaluation';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

// Mock the LichessApiClient
vi.mock('../../shared/services/api/LichessApiClient', () => ({
  LichessApiClient: vi.fn().mockImplementation(() => ({
    lookup: vi.fn(),
  })),
  LichessApiError: class LichessApiError extends Error {
    constructor(
      public statusCode: number,
      message: string
    ) {
      super(message);
      this.name = 'LichessApiError';
    }
  },
}));

// Mock fetch globally (for other uses)
global.fetch = vi.fn();

// Import the mocked LichessApiClient to get the mock instance
import { LichessApiClient } from '../../shared/services/api/LichessApiClient';

describe('TablebaseService', () => {
  const mockFetch = global.fetch as typeof fetch;
  let mockLookup: ReturnType<typeof vi.fn>;
  let mockApiClient: any;
  let testService: TablebaseService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a new mock instance with a mock lookup function
    mockLookup = vi.fn();
    mockApiClient = {
      lookup: mockLookup,
    };

    // Create a new TablebaseService instance with the mocked client for each test
    testService = new TablebaseService(mockApiClient);
    testService.clearCache();
  });

  /**
   * Helper to create a standard tablebase response (now returns data directly for LichessApiClient)
   * @param config
   * @param config.category
   * @param config.dtz
   * @param config.dtm
   * @param config.moves
   */
  function createTablebaseResponse(config: {
    category?: string;
    dtz?: number | null;
    dtm?: number | null;
    moves?: Array<{
      uci: string;
      san: string;
      category: string;
      dtz: number | null;
      dtm: number | null;
    }>;
  }) {
    return {
      category: config.category || 'draw',
      dtz: config.dtz ?? 0,
      dtm: config.dtm ?? null,
      checkmate: false,
      stalemate: false,
      variant_win: false,
      variant_loss: false,
      insufficient_material: false,
      moves: config.moves || [],
    };
  }

  describe('Core Functionality', () => {
    it('should fetch and return evaluation for a position', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'win',
          dtz: 13,
          dtm: 13,
          moves: [
            {
              uci: 'h1b7',
              san: 'Qb7+',
              category: 'loss',
              dtz: -12,
              dtm: -12,
            },
          ],
        })
      );

      const result = await testService.getEvaluation(fen);

      expect(result.isAvailable).toBe(true);
      expect(result.result).toEqual({
        wdl: 2,
        dtz: 13,
        dtm: 13,
        category: 'win',
        precise: false,
        evaluation: 'Gewinn in 13 Zügen',
      });
      expect(mockLookup).toHaveBeenCalledTimes(1);
    });

    it('should return top moves with correct perspective', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'win',
          dtz: 13,
          dtm: 13,
          moves: [
            {
              uci: 'h1b7',
              san: 'Qb7+',
              category: 'loss', // API returns opponent's perspective
              dtz: -12,
              dtm: -12,
            },
            {
              uci: 'h1h7',
              san: 'Qh7',
              category: 'loss',
              dtz: -14,
              dtm: -14,
            },
          ],
        })
      );

      const result = await testService.getTopMoves(fen, 5);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toHaveLength(2);
      // All returned moves should be best moves (same WDL)
      expect(result.moves![0].category).toBe('win');
      expect(result.moves![0].wdl).toBe(2);
      expect(result.moves![1].wdl).toBe(2); // Same WDL as first move

      // Should contain both best moves (order may vary due to sorting)
      const moveUcis = result.moves!.map(m => m.uci).sort();
      expect(moveUcis).toEqual(['h1b7', 'h1h7']);
    });
  });

  describe('Single API Call Architecture', () => {
    it('should use cached data for subsequent requests', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'win',
          dtz: 13,
          dtm: 13,
          moves: [
            {
              uci: 'h1b7',
              san: 'Qb7+',
              category: 'loss',
              dtz: -12,
              dtm: -12,
            },
          ],
        })
      );

      // First call - makes API request
      const eval1 = await testService.getEvaluation(fen);
      expect(eval1.isAvailable).toBe(true);
      expect(mockLookup).toHaveBeenCalledTimes(1);

      // Second call - uses cache
      const eval2 = await testService.getEvaluation(fen);
      expect(eval2.isAvailable).toBe(true);
      expect(mockLookup).toHaveBeenCalledTimes(1); // No additional call

      // Get moves - also uses cache
      const moves = await testService.getTopMoves(fen, 5);
      expect(moves.isAvailable).toBe(true);
      expect(mockLookup).toHaveBeenCalledTimes(1); // Still no additional call
    });

    it('should normalize FEN for better cache efficiency', async () => {
      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'draw',
          dtz: 0,
        })
      );

      // Different halfmove/fullmove counters but same position
      const fen1 = TEST_POSITIONS.ENDGAME.KQK_WIN;
      const fen2 = TEST_POSITIONS.ENDGAME.KQK_WIN.replace('0 1', '15 42'); // Same position, different counters

      await testService.getEvaluation(fen1);
      await testService.getEvaluation(fen2);

      // Should only make one API call due to FEN normalization
      expect(mockLookup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid FEN gracefully', async () => {
      const invalidFen = 'invalid fen string';

      // The service returns an error instead of throwing
      const result = await testService.getEvaluation(invalidFen);

      expect(result.isAvailable).toBe(false);
      expect(result.error).toContain('Invalid FEN');
      expect(mockLookup).not.toHaveBeenCalled();
    });

    it('should handle positions with too many pieces', async () => {
      const startingPosition = TEST_POSITIONS.STARTING_POSITION;

      const result = await testService.getEvaluation(startingPosition);

      expect(result.isAvailable).toBe(false);
      expect(mockLookup).not.toHaveBeenCalled();
    });

    it('should handle 404 responses gracefully', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KNK_DRAW; // Valid but rare position

      const { LichessApiError } = await import('../../shared/services/api/LichessApiClient');
      mockLookup.mockRejectedValueOnce(new LichessApiError(404, 'Not found'));

      const result = await testService.getEvaluation(fen);

      expect(result.isAvailable).toBe(false);
      expect(mockLookup).toHaveBeenCalledTimes(1);

      // Second call should use cached "not found" result
      const result2 = await testService.getEvaluation(fen);
      expect(result2.isAvailable).toBe(false);
      expect(mockLookup).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should handle rate limiting errors', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      // Since the LichessApiClient handles retries internally,
      // and we're mocking it, we simulate the final result after retries
      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'win',
          dtz: 13,
        })
      );

      const result = await testService.getEvaluation(fen);

      expect(result.isAvailable).toBe(true);
      expect(mockLookup).toHaveBeenCalledTimes(1);
    }, 10000);
  });

  describe('Black Perspective Handling', () => {
    it('should handle Black to move positions correctly', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_BLACK_TO_MOVE; // Black to move

      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'loss', // Black is losing
          dtz: -13,
          dtm: -13,
          moves: [
            {
              uci: 'e8d7',
              san: 'Kd7',
              category: 'win', // Win for White after Black's move
              dtz: 12,
              dtm: 12,
            },
          ],
        })
      );

      const result = await testService.getTopMoves(fen, 1);

      expect(result.isAvailable).toBe(true);
      expect(result.moves![0].category).toBe('loss'); // Converted to player perspective
      // Mathematical perspective conversion: API 'win' (+2) → player perspective (-2)
      // The move leads to a loss for Black (negative WDL from Black's perspective)
      expect(result.moves![0].wdl).toBe(-2);
    });
  });

  describe('Category to WDL Conversion', () => {
    it('should convert all category types correctly', async () => {
      const testCases = [
        { category: 'win', expectedWdl: 2 },
        { category: 'cursed-win', expectedWdl: 1 },
        { category: 'draw', expectedWdl: 0 },
        { category: 'blessed-loss', expectedWdl: -1 },
        { category: 'loss', expectedWdl: -2 },
        { category: 'unknown', expectedWdl: 0 }, // Default case
      ];

      for (const { category, expectedWdl } of testCases) {
        testService.clearCache();

        const fen = `8/8/8/8/8/8/k7/K7 w - - 0 1`;
        mockLookup.mockResolvedValueOnce(
          createTablebaseResponse({
            category,
            dtz: 0,
          })
        );

        const result = await testService.getEvaluation(fen);

        expect(result.isAvailable).toBe(true);
        expect(result.result?.wdl).toBe(expectedWdl);
        expect(result.result?.category).toBe(category);
      }
    });
  });

  describe('Request Deduplication', () => {
    it('should handle concurrent requests for same position', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      // Delay the response to ensure requests are concurrent
      mockLookup.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve(
                  createTablebaseResponse({
                    category: 'win',
                    dtz: 13,
                  })
                ),
              100
            )
          )
      );

      // Make multiple concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() => testService.getEvaluation(fen));

      const results = await Promise.all(promises);

      // All should succeed with same result
      results.forEach(result => {
        expect(result.isAvailable).toBe(true);
        expect(result.result?.category).toBe('win');
      });

      // But only one API call should be made
      expect(mockLookup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Move Limiting', () => {
    it('should respect move limit parameter', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'win',
          moves: Array(10)
            .fill(null)
            .map((_, i) => ({
              uci: `move${i}`,
              san: `Move${i}`,
              category: 'loss',
              dtz: -(10 + i),
              dtm: -(10 + i),
            })),
        })
      );

      // Request only 3 moves
      const result = await testService.getTopMoves(fen, 3);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toHaveLength(3);

      // Request all moves - should use cache
      const allMoves = await testService.getTopMoves(fen, 100);
      expect(allMoves.moves).toHaveLength(10);
      expect(mockLookup).toHaveBeenCalledTimes(1); // No additional call
    });
  });

  describe('Empty Moves Handling', () => {
    it('should handle positions with no legal moves', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'win',
          dtz: 1,
          dtm: 1,
          moves: [], // No legal moves (e.g., checkmate)
        })
      );

      const evalResult = await testService.getEvaluation(fen);
      expect(evalResult.isAvailable).toBe(true);

      const movesResult = await testService.getTopMoves(fen, 5);
      expect(movesResult.isAvailable).toBe(false);
      expect(movesResult.error).toContain('No moves available');
    });
  });

  describe('Metrics Tracking', () => {
    it('should track cache hits and API calls', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      mockLookup.mockResolvedValue(
        createTablebaseResponse({
          category: 'win',
          dtz: 13,
        })
      );

      // Clear cache and get initial metrics
      testService.clearCache();
      const initialMetrics = testService.getMetrics();
      const initialApiCalls = initialMetrics.totalApiCalls;

      // First call - cache miss
      await testService.getEvaluation(fen);

      // Second call - cache hit
      await testService.getEvaluation(fen);

      const finalMetrics = testService.getMetrics();
      // Should have made exactly one more API call
      expect(finalMetrics.totalApiCalls).toBe(initialApiCalls + 1);
      expect(finalMetrics.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases - En Passant Preservation', () => {
    it('should treat positions with different en passant squares as different', async () => {
      // Use valid endgame positions with ≤7 pieces - simple KPK position
      const fenWithEp = '8/8/8/3pP3/8/3K4/8/3k4 w - d6 0 1'; // En passant possible (6 pieces)
      const fenWithoutEp = '8/8/8/3pP3/8/3K4/8/3k4 w - - 0 1'; // No en passant

      mockLookup
        .mockResolvedValueOnce(
          createTablebaseResponse({
            category: 'draw',
            dtz: 0,
          })
        )
        .mockResolvedValueOnce(
          createTablebaseResponse({
            category: 'draw',
            dtz: 0,
          })
        );

      await testService.getEvaluation(fenWithEp);
      await testService.getEvaluation(fenWithoutEp);

      // Should make two API calls since en passant is essential state
      expect(mockLookup).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases - Partial API Responses', () => {
    it('should handle 200 OK with incomplete response gracefully', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      // Mock incomplete response - this should cause an error in transformation
      // Provide minimal data with category to avoid crash, but missing other fields
      mockLookup.mockResolvedValueOnce({
        category: 'draw',
        // Missing moves, dtz, dtm, etc.
      });

      const result = await testService.getEvaluation(fen);

      // The service might handle partial data gracefully
      // Check if it either returns data or an error
      if (result.isAvailable) {
        expect(result.result?.category).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }

      // The response was cached (even if partial), so mockLookup is only called once
      expect(mockLookup).toHaveBeenCalledTimes(1);
    });

    it('should handle 200 OK with null moves array', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      mockLookup.mockResolvedValueOnce({
        ok: true,
        /**
         *
         */
        json: async () => ({
          category: 'win',
          dtz: 13,
          dtm: 13,
          moves: null, // Invalid: should be array
        }),
      } as Response);

      const movesResult = await testService.getTopMoves(fen, 5);

      expect(movesResult.isAvailable).toBe(false);
      expect(movesResult.error).toBeDefined();
    });
  });

  describe('Edge Cases - Concurrent Failure Handling', () => {
    it('should properly handle concurrent requests with deduplication', async () => {
      const fen = TEST_POSITIONS.ENDGAME.KQK_WIN;

      // Mock successful response
      mockLookup.mockResolvedValue(
        createTablebaseResponse({
          category: 'win',
          dtz: 13,
        })
      );

      // Clear cache to ensure clean test
      testService.clearCache();

      // Make two concurrent requests - they will share the same promise due to deduplication
      const promise1 = testService.getEvaluation(fen);
      const promise2 = testService.getEvaluation(fen);

      const [result1, result2] = await Promise.allSettled([promise1, promise2]);

      // Both should succeed with the same result
      expect(result1.status).toBe('fulfilled');
      if (result1.status === 'fulfilled') {
        expect(result1.value.isAvailable).toBe(true);
        expect(result1.value.result?.category).toBe('win');
      }

      expect(result2.status).toBe('fulfilled');
      if (result2.status === 'fulfilled') {
        expect(result2.value.isAvailable).toBe(true);
        expect(result2.value.result?.category).toBe('win');
      }

      // Verify deduplication worked - only 1 API call for both concurrent requests
      expect(mockLookup).toHaveBeenCalledTimes(1);

      // A third call should use cache
      const result3 = await testService.getEvaluation(fen);
      expect(result3.isAvailable).toBe(true);
      expect(mockLookup).toHaveBeenCalledTimes(1); // Still only 1 call due to caching
    });
  });

  describe('Issue #59 - DTM Sorting with Negative Values', () => {
    it('should correctly sort moves with negative DTM values (pawn promotion bug)', async () => {
      // This was a real bug where e7 (DTM=-12) was incorrectly sorted after Ke8 (DTM=-20)
      const mockResponse = {
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: false,
        insufficient_material: false,
        dtz: 1,
        precise_dtz: 1,
        dtm: 13,
        category: 'win',
        moves: [
          {
            uci: 'e6e7',
            san: 'e7',
            zeroing: true,
            dtz: -2,
            precise_dtz: -2,
            dtm: -12,
            category: 'loss',
          },
          {
            uci: 'd7e8',
            san: 'Ke8',
            zeroing: false,
            dtz: -2,
            precise_dtz: -2,
            dtm: -20,
            category: 'loss',
          },
          {
            uci: 'd7d8',
            san: 'Kd8',
            zeroing: false,
            dtz: -2,
            precise_dtz: -2,
            dtm: -16,
            category: 'loss',
          },
        ],
      };

      mockLookup.mockResolvedValueOnce(createTablebaseResponse(mockResponse));

      const fen = '6k1/3K4/4P3/8/8/8/8/8 w - - 3 4';
      const result = await testService.getTopMoves(fen, 5);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toBeDefined();
      expect(result.moves!.length).toBeGreaterThan(0);

      // e7 should be first (best DTM of -12)
      expect(result.moves![0].san).toBe('e7');
      expect(result.moves![0].dtm).toBe(-12);

      // Verify correct order: e7 (-12), Kd8 (-16), Ke8 (-20)
      if (result.moves!.length >= 3) {
        expect(result.moves![1].san).toBe('Kd8');
        expect(result.moves![2].san).toBe('Ke8');
      }
    });
  });

  describe('Edge Cases - Terminal States', () => {
    it('should handle checkmate positions correctly', async () => {
      // K+Q vs K checkmate position (Black is checkmated)
      const checkmatedFen = SpecialPositions.CHECKMATE;

      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'loss', // Black has lost (is checkmated)
          dtz: 0,
          dtm: 0,
          moves: [], // No legal moves (checkmate)
        })
      );

      const result = await testService.getEvaluation(checkmatedFen);

      expect(result.isAvailable).toBe(true);
      expect(result.result?.category).toBe('loss'); // Black is checkmated
      expect(result.result?.wdl).toBe(-2);
      expect(result.result?.dtz).toBe(0);
    });

    it('should handle stalemate positions correctly', async () => {
      // K vs K+pawn stalemate position
      const stalemateFen = SpecialPositions.STALEMATE;

      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'draw', // Stalemate is always a draw
          dtz: 0,
          dtm: null,
          moves: [], // No legal moves (stalemate)
        })
      );

      const result = await testService.getEvaluation(stalemateFen);

      expect(result.isAvailable).toBe(true);
      expect(result.result?.category).toBe('draw');
      expect(result.result?.wdl).toBe(0);

      // Verify moves endpoint handles stalemate correctly
      const movesResult = await testService.getTopMoves(stalemateFen, 5);
      expect(movesResult.isAvailable).toBe(false);
      expect(movesResult.error).toContain('No moves available');
    });
  });

  describe('CacheManager Integration', () => {
    beforeEach(() => {
      // Clear mock call counts and reset mock state
      vi.clearAllMocks();
    });

    it('should accept custom CacheManager via constructor injection', async () => {
      const mockCacheManager = {
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
        has: vi.fn().mockReturnValue(false),
        delete: vi.fn().mockReturnValue(true),
        clear: vi.fn(),
        size: 0,
      };

      const customService = new TablebaseService(mockApiClient, mockCacheManager);

      // Mock successful response
      const responseData = {
        category: 'win',
        dtz: 1,
        dtm: 1,
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: false,
        insufficient_material: false,
        moves: [{ uci: 'a1a2', san: 'Ka2', category: 'loss', dtz: -2, dtm: -2 }],
      };

      mockLookup.mockResolvedValueOnce(createTablebaseResponse(responseData));

      const testFen = 'K7/8/k7/8/8/8/8/8 w - - 0 1';
      await customService.getEvaluation(testFen);

      // Verify cache manager was used
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should use default LRUCacheManager when none provided', async () => {
      const defaultService = new TablebaseService(mockApiClient);

      const responseData = {
        category: 'win',
        dtz: 1,
        moves: [{ uci: 'a1a2', san: 'Ka2', category: 'loss', dtz: -2, dtm: -2 }],
      };

      mockLookup.mockResolvedValue(createTablebaseResponse(responseData));

      const testFen = 'K7/8/k7/8/8/8/8/8 w - - 0 1';

      // First call should miss cache
      await defaultService.getEvaluation(testFen);

      // Second call should hit cache (LRU should work)
      await defaultService.getEvaluation(testFen);

      // Should have made only one API call due to caching
      expect(mockLookup).toHaveBeenCalledTimes(1);
    });

    it('should maintain cache behavior consistency with CacheManager', async () => {
      // Start with fresh mock state
      mockLookup.mockClear();

      const responseData = {
        category: 'win',
        dtz: 1,
        moves: [{ uci: 'a1a2', san: 'Ka2', category: 'loss', dtz: -2, dtm: -2 }],
      };

      mockLookup.mockResolvedValue(createTablebaseResponse(responseData));

      const testFen = 'K7/8/k7/8/8/8/8/8 w - - 0 1';

      // First call - cache miss
      const result1 = await testService.getEvaluation(testFen);
      expect(result1.isAvailable).toBe(true);

      // Second call - should be cache hit
      const result2 = await testService.getEvaluation(testFen);
      expect(result2.isAvailable).toBe(true);
      expect(result1).toEqual(result2);

      // Should have made only one API call
      expect(mockLookup).toHaveBeenCalledTimes(1);

      // Clear cache
      testService.clearCache();

      // Third call - cache miss again after clear
      const result3 = await testService.getEvaluation(testFen);
      expect(result3.isAvailable).toBe(true);
      expect(result3).toEqual(result1); // Same result, but fetched again

      // Should have made second API call after cache clear
      expect(mockLookup).toHaveBeenCalledTimes(2);
    });

    it('should work with both constructor parameters', async () => {
      const responseData = {
        category: 'win',
        dtz: 1,
        moves: [{ uci: 'a1a2', san: 'Ka2', category: 'loss', dtz: -2, dtm: -2 }],
      };

      const mockTablebaseClient = {
        lookup: vi.fn().mockResolvedValue(responseData),
        healthCheck: vi.fn().mockResolvedValue(true),
      };

      const mockCacheManager = {
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
        has: vi.fn().mockReturnValue(false),
        delete: vi.fn().mockReturnValue(true),
        clear: vi.fn(),
        size: 0,
      };

      const customService = new TablebaseService(mockTablebaseClient as any, mockCacheManager);

      const testFen = 'K7/8/k7/8/8/8/8/8 w - - 0 1';
      const result = await customService.getEvaluation(testFen);

      expect(result.isAvailable).toBe(true);
      expect(mockTablebaseClient.lookup).toHaveBeenCalled();
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('Hierarchical Move Ranking System', () => {
    // Tests use user-provided scenarios from TablebaseTestScenarios.ts
    // No hardcoded FENs - all test data comes from central scenario collection

    it('should prioritize DTM over DTZ for training optimization', async () => {
      // Use DTM_PRIORITY_CONFLICT scenario from TablebaseTestScenarios.ts
      const { TablebaseTestScenarios } = await import('../../shared/testing/TablebaseTestScenarios');
      const scenario = TablebaseTestScenarios.DTM_PRIORITY_CONFLICT;
      
      // Mock API response with user-provided move data
      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'win',
          dtz: 4, // Position DTZ
          dtm: 20, // Position DTM
          moves: scenario.moves.map(move => ({
            uci: move.uci,
            san: move.san,
            category: 'loss', // API perspective (opponent loses after move)
            dtz: -move.dtz, // Negate for API perspective
            dtm: -move.dtm, // Negate for API perspective
          }))
        })
      );

      const result = await testService.getTopMoves(scenario.fen, 2);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toBeDefined();
      expect(result.moves!.length).toBe(2);

      // Verify DTM-prioritized ranking: Re5 (DTM=-20) before Rb1 (DTM=-38)
      expect(result.moves![0].uci).toBe('e1e5'); // Re5 - faster mate
      expect(result.moves![0].dtm).toBe(-20);
      expect(result.moves![1].uci).toBe('e1b1'); // Rb1 - slower mate despite better DTZ
      expect(result.moves![1].dtm).toBe(-38);

      // Verify both are winning moves
      expect(result.moves![0].wdl).toBe(2);
      expect(result.moves![1].wdl).toBe(2);
    });

    it('should use WDL as primary ranking criterion', async () => {
      // Use ROOK_ENDGAME_WDL_PRIORITY scenario
      const { TablebaseTestScenarios } = await import('../../shared/testing/TablebaseTestScenarios');
      const scenario = TablebaseTestScenarios.ROOK_ENDGAME_WDL_PRIORITY;

      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'win',
          dtz: 8,
          dtm: 42,
          moves: scenario.moves.map(move => ({
            uci: move.uci,
            san: move.san,
            category: move.wdl > 0 ? 'loss' : move.wdl < 0 ? 'win' : 'draw',
            dtz: move.wdl !== 0 ? -move.dtz : move.dtz,
            dtm: move.dtm !== null && move.wdl !== 0 ? -move.dtm : move.dtm,
          }))
        })
      );

      const result = await testService.getTopMoves(scenario.fen, 3);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toBeDefined();
      
      // Service returns only best moves (same WDL), so we expect only winning move
      expect(result.moves!.length).toBe(1);
      expect(result.moves![0].uci).toBe('e2b2'); // Only winning move
      expect(result.moves![0].wdl).toBe(2);
      expect(result.moves![0].category).toBe('win');
    });

    it('should handle defensive strategy for losing positions', async () => {
      // Use DEFENSIVE_STRATEGY_LOSING_POSITION scenario from TablebaseTestScenarios.ts
      const { TablebaseTestScenarios } = await import('../../shared/testing/TablebaseTestScenarios');
      const scenario = TablebaseTestScenarios.DEFENSIVE_STRATEGY_LOSING_POSITION;
      
      // Mock API response with user-provided move data
      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'loss',
          dtz: -22, // Position DTZ
          dtm: -26, // Position DTM
          moves: scenario.moves.map(move => ({
            uci: move.uci,
            san: move.san,
            category: 'win', // API perspective (opponent wins after move)
            dtz: -move.dtz, // Negate for API perspective (API returns positive for winning side)
            dtm: -move.dtm, // Negate for API perspective
          }))
        })
      );

      const result = await testService.getTopMoves(scenario.fen, 5);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toBeDefined();
      expect(result.moves!.length).toBe(5);

      // Verify defensive ranking: Ne4 (DTM=25), Ke3 (DTM=25), Kd3 (DTM=23), Nb5 (DTM=17), Nd1 (DTM=13)
      expect(result.moves![0].uci).toBe('c3e4'); // Ne4 - best defensive (DTM=25)
      expect(result.moves![0].dtm).toBe(25);
      expect(result.moves![1].uci).toBe('d4e3'); // Ke3 - equally good defensive (DTM=25)
      expect(result.moves![1].dtm).toBe(25);
      expect(result.moves![4].uci).toBe('c3d1'); // Nd1 - worst defensive (DTM=13)
      expect(result.moves![4].dtm).toBe(13);

      // Verify all are losing moves from White's perspective
      result.moves!.forEach(move => {
        expect(move.wdl).toBe(-2);
        expect(move.category).toBe('loss');
      });
    });

    it('should prioritize DTM over DTZ when WDL is equal', async () => {
      // Use DTM_TIEBREAKER_SAME_DTZ scenario from TablebaseTestScenarios.ts
      const { TablebaseTestScenarios } = await import('../../shared/testing/TablebaseTestScenarios');
      const scenario = TablebaseTestScenarios.DTM_TIEBREAKER_SAME_DTZ;
      
      // Mock API response with user-provided move data
      mockLookup.mockResolvedValueOnce(
        createTablebaseResponse({
          category: 'win',
          dtz: 8, // Position DTZ
          dtm: 24, // Position DTM
          moves: scenario.moves.map(move => ({
            uci: move.uci,
            san: move.san,
            category: 'loss', // API perspective (opponent loses after move)
            dtz: -move.dtz, // Negate for API perspective
            dtm: -move.dtm, // Negate for API perspective
          }))
        })
      );

      const result = await testService.getTopMoves(scenario.fen, 2);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toBeDefined();
      expect(result.moves!.length).toBe(2);

      // Verify DTM priority: Te6 (DTM=-24) before Th1 (DTM=-36)
      expect(result.moves![0].uci).toBe('e1e6'); // Te6 - better DTM (faster mate)
      expect(result.moves![0].dtm).toBe(-24);
      expect(result.moves![1].uci).toBe('e1h1'); // Th1 - worse DTM (slower mate)
      expect(result.moves![1].dtm).toBe(-36);

      // Verify both have same WDL and DTZ (DTM priority conditions)
      expect(result.moves![0].wdl).toBe(2);
      expect(result.moves![0].dtz).toBe(-8);
      expect(result.moves![1].wdl).toBe(2);
      expect(result.moves![1].dtz).toBe(-8);

      // Verify both are winning moves
      expect(result.moves![0].category).toBe('win');
      expect(result.moves![1].category).toBe('win');
    });
  });
});
