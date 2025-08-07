/**
 * Comprehensive test suite for optimized TablebaseService
 *
 * @remarks
 * Tests the single API call architecture and caching behavior
 * of the optimized TablebaseService implementation.
 */

import { tablebaseService } from "../../shared/services/TablebaseService";
import { TEST_FENS } from "../../shared/testing/TestFixtures";
import {
  EndgamePositions,
  SpecialPositions,
  StandardPositions,
} from "../fixtures/fenPositions";

// Mock fetch globally
global.fetch = jest.fn();

describe("TablebaseService", () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    tablebaseService.clearCache();
  });

  /**
   * Helper to create a standard tablebase response
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
      ok: true,
      /**
       *
       */
      json: async () => ({
        category: config.category || "draw",
        dtz: config.dtz ?? 0,
        dtm: config.dtm ?? null,
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: false,
        insufficient_material: false,
        moves: config.moves || [],
      }),
    } as Response;
  }

  describe("Core Functionality", () => {
    it("should fetch and return evaluation for a position", async () => {
      const fen = EndgamePositions.KQK_WIN;

      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "win",
          dtz: 13,
          dtm: 13,
          moves: [
            {
              uci: "h1b7",
              san: "Qb7+",
              category: "loss",
              dtz: -12,
              dtm: -12,
            },
          ],
        }),
      );

      const result = await tablebaseService.getEvaluation(fen);

      expect(result.isAvailable).toBe(true);
      expect(result.result).toEqual({
        wdl: 2,
        dtz: 13,
        dtm: 13,
        category: "win",
        precise: false,
        evaluation: "Gewinn in 13 Zügen",
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return top moves with correct perspective", async () => {
      const fen = EndgamePositions.KQK_WIN;

      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "win",
          dtz: 13,
          dtm: 13,
          moves: [
            {
              uci: "h1b7",
              san: "Qb7+",
              category: "loss", // API returns opponent's perspective
              dtz: -12,
              dtm: -12,
            },
            {
              uci: "h1h7",
              san: "Qh7",
              category: "loss",
              dtz: -14,
              dtm: -14,
            },
          ],
        }),
      );

      const result = await tablebaseService.getTopMoves(fen, 5);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toHaveLength(2);
      // All returned moves should be best moves (same WDL)
      expect(result.moves![0].category).toBe("win");
      expect(result.moves![0].wdl).toBe(2);
      expect(result.moves![1].wdl).toBe(2); // Same WDL as first move

      // Should contain both best moves (order may vary due to sorting)
      const moveUcis = result.moves!.map((m) => m.uci).sort();
      expect(moveUcis).toEqual(["h1b7", "h1h7"]);
    });
  });

  describe("Single API Call Architecture", () => {
    it("should use cached data for subsequent requests", async () => {
      const fen = EndgamePositions.KQK_WIN;

      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "win",
          dtz: 13,
          dtm: 13,
          moves: [
            {
              uci: "h1b7",
              san: "Qb7+",
              category: "loss",
              dtz: -12,
              dtm: -12,
            },
          ],
        }),
      );

      // First call - makes API request
      const eval1 = await tablebaseService.getEvaluation(fen);
      expect(eval1.isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - uses cache
      const eval2 = await tablebaseService.getEvaluation(fen);
      expect(eval2.isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call

      // Get moves - also uses cache
      const moves = await tablebaseService.getTopMoves(fen, 5);
      expect(moves.isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still no additional call
    });

    it("should normalize FEN for better cache efficiency", async () => {
      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "draw",
          dtz: 0,
        }),
      );

      // Different halfmove/fullmove counters but same position
      const fen1 = EndgamePositions.KQK_WIN;
      const fen2 = EndgamePositions.KQK_WIN.replace("0 1", "15 42"); // Same position, different counters

      await tablebaseService.getEvaluation(fen1);
      await tablebaseService.getEvaluation(fen2);

      // Should only make one API call due to FEN normalization
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid FEN gracefully", async () => {
      const invalidFen = "invalid fen string";

      // The service returns an error instead of throwing
      const result = await tablebaseService.getEvaluation(invalidFen);

      expect(result.isAvailable).toBe(false);
      expect(result.error).toContain("Invalid FEN");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle positions with too many pieces", async () => {
      const startingPosition = TEST_FENS.STARTING_POSITION;

      const result = await tablebaseService.getEvaluation(startingPosition);

      expect(result.isAvailable).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle 404 responses gracefully", async () => {
      const fen = EndgamePositions.KNK_DRAW; // Valid but rare position

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await tablebaseService.getEvaluation(fen);

      expect(result.isAvailable).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cached "not found" result
      const result2 = await tablebaseService.getEvaluation(fen);
      expect(result2.isAvailable).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });

    it("should retry on rate limiting", async () => {
      const fen = EndgamePositions.KQK_WIN;

      // First call fails with 429, second succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 429 } as Response)
        .mockResolvedValueOnce(
          createTablebaseResponse({
            category: "win",
            dtz: 13,
          }),
        );

      const result = await tablebaseService.getEvaluation(fen);

      expect(result.isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe("Black Perspective Handling", () => {
    it("should handle Black to move positions correctly", async () => {
      const fen = EndgamePositions.KQK_BLACK_TO_MOVE; // Black to move

      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "loss", // Black is losing
          dtz: -13,
          dtm: -13,
          moves: [
            {
              uci: "e8d7",
              san: "Kd7",
              category: "win", // Win for White after Black's move
              dtz: 12,
              dtm: 12,
            },
          ],
        }),
      );

      const result = await tablebaseService.getTopMoves(fen, 1);

      expect(result.isAvailable).toBe(true);
      expect(result.moves![0].category).toBe("loss"); // Inverted
      // Note: WDL is from the move's perspective, not the side to move
      // The move leads to a loss for Black, so it's positive (good for White)
      expect(result.moves![0].wdl).toBe(2);
    });
  });

  describe("Category to WDL Conversion", () => {
    it("should convert all category types correctly", async () => {
      const testCases = [
        { category: "win", expectedWdl: 2 },
        { category: "cursed-win", expectedWdl: 1 },
        { category: "draw", expectedWdl: 0 },
        { category: "blessed-loss", expectedWdl: -1 },
        { category: "loss", expectedWdl: -2 },
        { category: "unknown", expectedWdl: 0 }, // Default case
      ];

      for (const { category, expectedWdl } of testCases) {
        tablebaseService.clearCache();

        const fen = `8/8/8/8/8/8/k7/K7 w - - 0 1`;
        mockFetch.mockResolvedValueOnce(
          createTablebaseResponse({
            category,
            dtz: 0,
          }),
        );

        const result = await tablebaseService.getEvaluation(fen);

        expect(result.isAvailable).toBe(true);
        expect(result.result?.wdl).toBe(expectedWdl);
        expect(result.result?.category).toBe(category);
      }
    });
  });

  describe("Request Deduplication", () => {
    it("should handle concurrent requests for same position", async () => {
      const fen = EndgamePositions.KQK_WIN;

      // Delay the response to ensure requests are concurrent
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  createTablebaseResponse({
                    category: "win",
                    dtz: 13,
                  }),
                ),
              100,
            ),
          ),
      );

      // Make multiple concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() => tablebaseService.getEvaluation(fen));

      const results = await Promise.all(promises);

      // All should succeed with same result
      results.forEach((result) => {
        expect(result.isAvailable).toBe(true);
        expect(result.result?.category).toBe("win");
      });

      // But only one API call should be made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Move Limiting", () => {
    it("should respect move limit parameter", async () => {
      const fen = EndgamePositions.KQK_WIN;

      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "win",
          moves: Array(10)
            .fill(null)
            .map((_, i) => ({
              uci: `move${i}`,
              san: `Move${i}`,
              category: "loss",
              dtz: -(10 + i),
              dtm: -(10 + i),
            })),
        }),
      );

      // Request only 3 moves
      const result = await tablebaseService.getTopMoves(fen, 3);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toHaveLength(3);

      // Request all moves - should use cache
      const allMoves = await tablebaseService.getTopMoves(fen, 100);
      expect(allMoves.moves).toHaveLength(10);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });
  });

  describe("Empty Moves Handling", () => {
    it("should handle positions with no legal moves", async () => {
      const fen = EndgamePositions.KQK_WIN;

      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "win",
          dtz: 1,
          dtm: 1,
          moves: [], // No legal moves (e.g., checkmate)
        }),
      );

      const evalResult = await tablebaseService.getEvaluation(fen);
      expect(evalResult.isAvailable).toBe(true);

      const movesResult = await tablebaseService.getTopMoves(fen, 5);
      expect(movesResult.isAvailable).toBe(false);
      expect(movesResult.error).toContain("No moves available");
    });
  });

  describe("Metrics Tracking", () => {
    it("should track cache hits and API calls", async () => {
      const fen = EndgamePositions.KQK_WIN;

      mockFetch.mockResolvedValue(
        createTablebaseResponse({
          category: "win",
          dtz: 13,
        }),
      );

      // Clear cache and get initial metrics
      tablebaseService.clearCache();
      const initialMetrics = tablebaseService.getMetrics();
      const initialApiCalls = initialMetrics.totalApiCalls;

      // First call - cache miss
      await tablebaseService.getEvaluation(fen);

      // Second call - cache hit
      await tablebaseService.getEvaluation(fen);

      const finalMetrics = tablebaseService.getMetrics();
      // Should have made exactly one more API call
      expect(finalMetrics.totalApiCalls).toBe(initialApiCalls + 1);
      expect(finalMetrics.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases - En Passant Preservation", () => {
    it("should treat positions with different en passant squares as different", async () => {
      // Use valid endgame positions with ≤7 pieces
      const fenWithEp = StandardPositions.EN_PASSANT_COMPLEX; // En passant possible
      const fenWithoutEp = StandardPositions.EN_PASSANT_COMPLEX.replace(
        "c6",
        "-",
      ); // No en passant

      mockFetch
        .mockResolvedValueOnce(
          createTablebaseResponse({
            category: "draw",
            dtz: 0,
          }),
        )
        .mockResolvedValueOnce(
          createTablebaseResponse({
            category: "draw",
            dtz: 0,
          }),
        );

      await tablebaseService.getEvaluation(fenWithEp);
      await tablebaseService.getEvaluation(fenWithoutEp);

      // Should make two API calls since en passant is essential state
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Edge Cases - Partial API Responses", () => {
    it("should handle 200 OK with incomplete response gracefully", async () => {
      const fen = EndgamePositions.KQK_WIN;

      // Mock 200 OK but with empty/incomplete response
      // Service will retry 3 times, so mock all attempts
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          /**
           *
           */
          json: async () => ({}), // Missing required fields
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          /**
           *
           */
          json: async () => ({}), // Missing required fields
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          /**
           *
           */
          json: async () => ({}), // Missing required fields
        } as Response);

      const result = await tablebaseService.getEvaluation(fen);

      expect(result.isAvailable).toBe(false);
      expect(result.error).toContain("Malformed API response");

      // Verify it didn't cache the bad response
      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "win",
          dtz: 13,
        }),
      );

      const result2 = await tablebaseService.getEvaluation(fen);
      expect(result2.isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(4); // 3 failed + 1 success
    });

    it("should handle 200 OK with null moves array", async () => {
      const fen = EndgamePositions.KQK_WIN;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        /**
         *
         */
        json: async () => ({
          category: "win",
          dtz: 13,
          dtm: 13,
          moves: null, // Invalid: should be array
        }),
      } as Response);

      const movesResult = await tablebaseService.getTopMoves(fen, 5);

      expect(movesResult.isAvailable).toBe(false);
      expect(movesResult.error).toBeDefined();
    });
  });

  describe("Edge Cases - Concurrent Failure Handling", () => {
    it("should properly handle concurrent requests with retry logic", async () => {
      const fen = EndgamePositions.KQK_WIN;

      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call fails (will trigger retry)
          return Promise.reject(new Error("Network error"));
        } else {
          // Retry succeeds
          return Promise.resolve(
            createTablebaseResponse({
              category: "win",
              dtz: 13,
            }),
          );
        }
      });

      // Clear cache to ensure clean test
      tablebaseService.clearCache();

      // Make two concurrent requests - they will share the same promise due to deduplication
      const promise1 = tablebaseService.getEvaluation(fen);
      const promise2 = tablebaseService.getEvaluation(fen);

      const [result1, result2] = await Promise.allSettled([promise1, promise2]);

      // Both should succeed after retry (service retries on network error)
      expect(result1.status).toBe("fulfilled");
      if (result1.status === "fulfilled") {
        expect(result1.value.isAvailable).toBe(true);
        expect(result1.value.result?.category).toBe("win");
      }

      expect(result2.status).toBe("fulfilled");
      if (result2.status === "fulfilled") {
        expect(result2.value.isAvailable).toBe(true);
        expect(result2.value.result?.category).toBe("win");
      }

      // Verify deduplication worked - only 2 API calls (1 fail + 1 retry)
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // A third call should use cache
      const result3 = await tablebaseService.getEvaluation(fen);
      expect(result3.isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2); // No additional call
    });
  });

  describe("Issue #59 - DTM Sorting with Negative Values", () => {
    it("should correctly sort moves with negative DTM values (pawn promotion bug)", async () => {
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
        category: "win",
        moves: [
          {
            uci: "e6e7",
            san: "e7",
            zeroing: true,
            dtz: -2,
            precise_dtz: -2,
            dtm: -12,
            category: "loss"
          },
          {
            uci: "d7e8",
            san: "Ke8",
            zeroing: false,
            dtz: -2,
            precise_dtz: -2,
            dtm: -20,
            category: "loss"
          },
          {
            uci: "d7d8",
            san: "Kd8",
            zeroing: false,
            dtz: -2,
            precise_dtz: -2,
            dtm: -16,
            category: "loss"
          }
        ]
      };

      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse(mockResponse)
      );

      const fen = "6k1/3K4/4P3/8/8/8/8/8 w - - 3 4";
      const result = await tablebaseService.getTopMoves(fen, 5);

      expect(result.isAvailable).toBe(true);
      expect(result.moves).toBeDefined();
      expect(result.moves!.length).toBeGreaterThan(0);

      // e7 should be first (best DTM of -12)
      expect(result.moves![0].san).toBe("e7");
      expect(result.moves![0].dtm).toBe(-12);

      // Verify correct order: e7 (-12), Kd8 (-16), Ke8 (-20)
      if (result.moves!.length >= 3) {
        expect(result.moves![1].san).toBe("Kd8");
        expect(result.moves![2].san).toBe("Ke8");
      }
    });
  });

  describe("Edge Cases - Terminal States", () => {
    it("should handle checkmate positions correctly", async () => {
      // K+Q vs K checkmate position (Black is checkmated)
      const checkmatedFen = SpecialPositions.CHECKMATE;

      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "loss", // Black has lost (is checkmated)
          dtz: 0,
          dtm: 0,
          moves: [], // No legal moves (checkmate)
        }),
      );

      const result = await tablebaseService.getEvaluation(checkmatedFen);

      expect(result.isAvailable).toBe(true);
      expect(result.result?.category).toBe("loss"); // Black is checkmated
      expect(result.result?.wdl).toBe(-2);
      expect(result.result?.dtz).toBe(0);
    });

    it("should handle stalemate positions correctly", async () => {
      // K vs K+pawn stalemate position
      const stalemateFen = SpecialPositions.STALEMATE;

      mockFetch.mockResolvedValueOnce(
        createTablebaseResponse({
          category: "draw", // Stalemate is always a draw
          dtz: 0,
          dtm: null,
          moves: [], // No legal moves (stalemate)
        }),
      );

      const result = await tablebaseService.getEvaluation(stalemateFen);

      expect(result.isAvailable).toBe(true);
      expect(result.result?.category).toBe("draw");
      expect(result.result?.wdl).toBe(0);

      // Verify moves endpoint handles stalemate correctly
      const movesResult = await tablebaseService.getTopMoves(stalemateFen, 5);
      expect(movesResult.isAvailable).toBe(false);
      expect(movesResult.error).toContain("No moves available");
    });
  });
});
