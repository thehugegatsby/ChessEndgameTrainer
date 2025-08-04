/**
 * Unit Tests for TablebaseService
 *
 * Tests the Lichess Tablebase API integration with mocked fetch
 * Coverage targets:
 * - Happy path (successful API responses)
 * - Error handling (network errors, invalid responses)
 * - Caching behavior
 * - Retry logic
 * - FEN validation
 */

import { tablebaseService } from "@shared/services/TablebaseService";
import { Chess } from "chess.js";

// Mock APP_CONFIG
jest.mock("../../../config/constants", () => ({
  APP_CONFIG: {
    TABLEBASE_API_URL: "https://tablebase.lichess.ovh",
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

// Create reusable mock functions for chess.js
const mockChessMoves = jest.fn();
const mockChessMove = jest.fn();
const mockChessFen = jest.fn();

// Mock chess.js
jest.mock("chess.js", () => ({
  Chess: jest.fn().mockImplementation((fen) => {
    // Simulate chess.js validation
    if (fen && typeof fen === "string") {
      const trimmed = fen.trim();
      if (trimmed === "invalid fen" || trimmed.split(" ").length !== 6) {
        throw new Error("Invalid FEN: must contain six space-delimited fields");
      }
    }

    return {
      moves: mockChessMoves,
      move: mockChessMove,
      fen: mockChessFen.mockReturnValue(fen?.trim() || ""),
    };
  }),
}));

// Mock logger to prevent console spam
jest.mock("@shared/services/logging", () => ({
  getLogger: jest.fn().mockReturnValue({
    setContext: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Type-safe references to mocks
const MockedChess = Chess as jest.Mock;

// Helper to mock fetch responses
/**
 *
 * @param data
 * @param status
 */
function mockFetchResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    /**
     *
     */
    json: () => Promise.resolve(data),
  } as Response);
}

describe("TablebaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tablebaseService.clearCache();
    // Remove global fake timers - only use in specific tests

    // Reset mock behavior
    mockChessMoves.mockReturnValue([]);
    mockChessMove.mockReturnValue(null);
    mockChessFen.mockReturnValue("");
  });

  afterEach(() => {
    // Ensure real timers are restored if any test used fake timers
    jest.useRealTimers();
  });

  describe("getEvaluation", () => {
    describe("Happy Path", () => {
      it("should return evaluation for valid position", async () => {
        const mockResponse = {
          category: "win",
          dtz: 15,
          dtm: 8,
          precise_dtz: true,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce(
          mockFetchResponse(mockResponse),
        );

        const result = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );

        expect(result.isAvailable).toBe(true);
        expect(result.result).toEqual({
          wdl: 2,
          dtz: 15,
          dtm: 8,
          category: "win",
          precise: true,
          evaluation: "Gewinn in 15 Zügen",
        });
        expect(result.error).toBeUndefined();
      });

      it("should handle draw positions", async () => {
        const mockResponse = {
          category: "draw",
          dtz: 0,
          dtm: null,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce(
          mockFetchResponse(mockResponse),
        );

        const result = await tablebaseService.getEvaluation(
          "4k3/8/4K3/8/8/8/8/8 w - - 0 1",
        );

        expect(result.isAvailable).toBe(true);
        expect(result.result?.category).toBe("draw");
        expect(result.result?.wdl).toBe(0);
        expect(result.result?.evaluation).toBe("Theoretisches Remis");
      });

      it("should handle cursed-win positions", async () => {
        const mockResponse = {
          category: "cursed-win",
          dtz: 52,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce(
          mockFetchResponse(mockResponse),
        );

        const result = await tablebaseService.getEvaluation(
          "8/8/8/8/8/8/8/k6K w - - 0 1",
        );

        expect(result.result?.category).toBe("cursed-win");
        expect(result.result?.wdl).toBe(1);
        expect(result.result?.evaluation).toBe(
          "Gewinn in 52 Zügen (50-Zug-Regel)",
        );
      });
    });

    describe("Error Handling", () => {
      it("should reject invalid FEN", async () => {
        const result = await tablebaseService.getEvaluation("invalid fen");

        expect(result.isAvailable).toBe(false);
        expect(result.error).toContain("Invalid FEN");
        expect(global.fetch).not.toHaveBeenCalled();
      }, 10000);

      it("should handle empty FEN", async () => {
        const result = await tablebaseService.getEvaluation("");

        expect(result.isAvailable).toBe(false);
        expect(result.error).toContain("Invalid FEN");
      });

      it("should handle too many pieces", async () => {
        const result = await tablebaseService.getEvaluation(
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        );

        expect(result.isAvailable).toBe(false);
        expect(result.error).toBeUndefined();
        expect(global.fetch).not.toHaveBeenCalled();
      }, 10000);

      it("should handle 404 responses", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce(
          mockFetchResponse({}, 404),
        );

        const result = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );

        expect(result.isAvailable).toBe(false);
        expect(result.error).toContain("Client error: 404");
      });

      it("should retry on server errors", async () => {
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce(mockFetchResponse({}, 500))
          .mockResolvedValueOnce(mockFetchResponse({}, 503))
          .mockResolvedValueOnce(
            mockFetchResponse({ category: "win", dtz: 10 }),
          );

        const result = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );

        expect(result.isAvailable).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(3);
      }, 10000);

      it("should handle network timeouts", async () => {
        jest.useRealTimers(); // Use real timers for this test

        const abortError = new Error("AbortError");
        abortError.name = "AbortError";

        (global.fetch as jest.Mock).mockRejectedValue(abortError);

        const result = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );

        expect(result.isAvailable).toBe(false);
        expect(result.error).toContain("Request timeout after retries");
        expect(global.fetch).toHaveBeenCalledTimes(3); // 3 retry attempts

        jest.useFakeTimers(); // Restore fake timers
      }, 10000);

      it("should handle malformed JSON responses", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          /**
           *
           */
          json: () => Promise.reject(new Error("Invalid JSON")),
        } as Response);

        const result = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );

        expect(result.isAvailable).toBe(false);
        expect(result.error).toContain("attempts: Invalid JSON");
      }, 10000);
    });

    describe("Caching", () => {
      it("should cache successful responses", async () => {
        const mockResponse = { category: "win", dtz: 10 };
        (global.fetch as jest.Mock).mockResolvedValueOnce(
          mockFetchResponse(mockResponse),
        );

        // First call
        const result1 = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Second call (should use cache)
        const result2 = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);

        expect(result1).toEqual(result2);
      });

      it("should respect cache TTL", async () => {
        jest.useFakeTimers(); // Enable fake timers for this test

        const mockResponse1 = { category: "win", dtz: 10 };
        const mockResponse2 = { category: "win", dtz: 12 };

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce(mockFetchResponse(mockResponse1))
          .mockResolvedValueOnce(mockFetchResponse(mockResponse2));

        // First call
        await tablebaseService.getEvaluation("K7/P7/k7/8/8/8/8/8 w - - 0 1");

        // Advance time past cache TTL (5 minutes)
        jest.advanceTimersByTime(5 * 60 * 1000 + 1000);

        // Second call (cache should be expired)
        const result = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.result?.dtz).toBe(12);

        jest.useRealTimers(); // Restore real timers
      });

      it("should not cache failed requests", async () => {
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce(mockFetchResponse({}, 500))
          .mockResolvedValueOnce(mockFetchResponse({}, 500))
          .mockResolvedValueOnce(mockFetchResponse({}, 500))
          .mockResolvedValueOnce(
            mockFetchResponse({ category: "win", dtz: 10 }),
          );

        // First call fails
        const result1 = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );
        expect(result1.isAvailable).toBe(false);

        // Second call succeeds
        const result2 = await tablebaseService.getEvaluation(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        );
        expect(result2.isAvailable).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(4); // 3 failures + 1 success
      }, 10000);
    });
  });

  describe("getTopMoves", () => {
    describe("Happy Path", () => {
      it("should return top moves sorted by evaluation", async () => {
        // Configure chess.js mock for this test
        const testFen = "K7/P7/4k3/8/8/8/8/8 w - - 0 1";
        mockChessFen.mockReturnValue(testFen);
        mockChessMoves.mockReturnValue([
          { from: "a7", to: "a8", san: "a8=Q", promotion: "q" },
          { from: "a8", to: "d8", san: "Kd8" },
          { from: "a8", to: "f8", san: "Kf8" },
        ]);
        mockChessMove.mockImplementation((move) => move);

        // Mock tablebase responses for each move
        const mockResponses = [
          { category: "win", dtz: 5 }, // a8=Q
          { category: "win", dtz: 15 }, // Kd8
          { category: "draw", dtz: 0 }, // Kf8
        ];

        let callCount = 0;
        (global.fetch as jest.Mock).mockImplementation(() => {
          return mockFetchResponse(
            mockResponses[callCount++ % mockResponses.length],
          );
        });

        const result = await tablebaseService.getTopMoves(testFen, 3);

        expect(result.isAvailable).toBe(true);
        expect(result.moves).toHaveLength(3);

        // Check sorting: wins first (by DTZ), then draws
        expect(result.moves![0].san).toBe("a8=Q");
        expect(result.moves![0].wdl).toBe(2);
        expect(result.moves![0].dtz).toBe(5);

        expect(result.moves![1].san).toBe("Kd8");
        expect(result.moves![1].wdl).toBe(2);
        expect(result.moves![1].dtz).toBe(15);

        expect(result.moves![2].san).toBe("Kf8");
        expect(result.moves![2].wdl).toBe(0);
      }, 10000);

      it("should handle black to move correctly", async () => {
        // Configure chess.js mock for black to move
        const testFen = "8/8/8/8/8/8/p7/k6K b - - 0 1";
        mockChessFen.mockReturnValue(testFen);
        mockChessMoves.mockReturnValue([
          { from: "a2", to: "a1", san: "a1=Q", promotion: "q" },
        ]);
        mockChessMove.mockImplementation((move) => move);

        (global.fetch as jest.Mock).mockResolvedValueOnce(
          mockFetchResponse({ category: "loss", dtz: -5 }),
        );

        const result = await tablebaseService.getTopMoves(testFen, 1);

        expect(result.isAvailable).toBe(true);
        expect(result.moves![0].wdl).toBe(2); // Inverted for black
        expect(result.moves![0].category).toBe("win"); // Inverted category
      });
    });

    describe("Error Handling", () => {
      it("should handle invalid FEN", async () => {
        // The mock will automatically throw for 'invalid fen'
        const result = await tablebaseService.getTopMoves("invalid fen", 5);

        expect(result.isAvailable).toBe(false);
        expect(result.error).toContain("Invalid FEN");
      }, 10000);

      it("should handle positions with too many pieces", async () => {
        // This FEN has 32 pieces
        const result = await tablebaseService.getTopMoves(
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          5,
        );

        expect(result.isAvailable).toBe(false);
        // Service counts pieces and returns specific error
        expect(result.error).toContain("Position has 32 pieces");
      }, 10000);

      it("should handle chess.js errors", async () => {
        // Make the Chess constructor throw an error
        MockedChess.mockImplementationOnce(() => {
          throw new Error("Chess.js error");
        });

        const result = await tablebaseService.getTopMoves(
          "K7/P7/k7/8/8/8/8/8 w - - 0 1",
          5,
        );

        expect(result.isAvailable).toBe(false);
        expect(result.error).toContain("Chess.js error");
      });
    });
  });

  describe("clearCache", () => {
    it("should clear all cached entries", async () => {
      const mockResponse = { category: "win", dtz: 10 };
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse(mockResponse),
      );

      // Cache some entries - need different FENs to avoid reusing cache
      const fen1 = "K7/P7/k7/8/8/8/8/8 w - - 0 1";
      const fen2 = "4k3/8/4K3/8/8/8/8/8 w - - 0 1";

      await tablebaseService.getEvaluation(fen1);
      await tablebaseService.getEvaluation(fen2);

      // Verify both were cached (only 2 API calls)
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Test cache by calling again - should not increase call count
      await tablebaseService.getEvaluation(fen1);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Still 2

      // Clear cache
      tablebaseService.clearCache();

      // Try to get same positions again
      await tablebaseService.getEvaluation(fen1);
      await tablebaseService.getEvaluation(fen2);

      // Should make new API calls
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe("FEN Normalization", () => {
    it("should normalize FEN before API calls", async () => {
      const mockResponse = { category: "win", dtz: 10 };
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(mockResponse),
      );

      // Configure chess.js mock to return normalized FEN
      mockChessFen.mockReturnValueOnce("K7/P7/k7/8/8/8/8/8 w - - 0 1");

      // FEN with extra spaces
      await tablebaseService.getEvaluation("  K7/P7/k7/8/8/8/8/8 w - - 0 1  ");

      // Check that fetch was called
      expect(global.fetch).toHaveBeenCalled();

      // Get the actual call and extract the URL
      const [[url]] = (global.fetch as jest.Mock).mock.calls;
      expect(url).toContain("fen=");
      expect(url).toContain(encodeURIComponent("K7/P7/k7/8/8/8/8/8 w - - 0 1"));
    });
  });

  describe("Retry Logic", () => {
    it("should use exponential backoff for retries", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockFetchResponse({}, 500))
        .mockResolvedValueOnce(mockFetchResponse({}, 500))
        .mockResolvedValueOnce(mockFetchResponse({ category: "win", dtz: 10 }));

      const result = await tablebaseService.getEvaluation(
        "K7/P7/k7/8/8/8/8/8 w - - 0 1",
      );

      expect(result.isAvailable).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should not retry on client errors except 429", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({}, 400),
      );

      const result = await tablebaseService.getEvaluation(
        "K7/P7/k7/8/8/8/8/8 w - - 0 1",
      );

      expect(result.isAvailable).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should retry on rate limiting (429)", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockFetchResponse({}, 429))
        .mockResolvedValueOnce(mockFetchResponse({ category: "win", dtz: 10 }));

      const result = await tablebaseService.getEvaluation(
        "K7/P7/k7/8/8/8/8/8 w - - 0 1",
      );

      expect(result.isAvailable).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
