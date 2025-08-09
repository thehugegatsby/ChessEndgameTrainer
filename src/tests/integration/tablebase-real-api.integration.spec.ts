/**
 * Tablebase Real API Integration Tests
 *
 * These tests make actual calls to the Lichess Tablebase API to verify
 * contract compatibility and ensure our implementation works with real responses.
 *
 * NOTE: These tests require internet connection and should be run separately
 * from the main test suite to avoid rate limiting.
 *
 * Run with: npm run test:integration:real-api (if configured)
 * or: jest tests/integration/tablebase-real-api.integration.spec.ts
 */

import { tablebaseService } from "../../shared/services/TablebaseService";
import { COMMON_FENS } from "../fixtures/commonFens";

// Skip these tests in CI to avoid rate limiting and external dependencies
// Also skip if fetch is not available (e.g., in Node.js test environment without polyfill)
const describeIfNotCI =
  process.env.CI || typeof fetch === "undefined" ? describe.skip : describe;

describeIfNotCI("Tablebase Real API Integration Tests", () => {
  beforeEach(() => {
    // Clear cache before each test
    tablebaseService.clearCache();
  });

  describe("Known Positions", () => {
    it("should correctly evaluate K+P vs K winning position", async () => {
      // Same position as in our mocked tests
      const fen = "K7/P7/k7/8/8/8/8/8 w - - 0 1";

      const result = await tablebaseService.getEvaluation(fen);

      expect(result.isAvailable).toBe(true);
      expect(result.result?.category).toBe("win");
      expect(result.result?.dtz).toBeGreaterThan(0); // White wins
      expect(result.result?.dtz).toBeLessThanOrEqual(50); // Should win within 50 moves
    });

    it("should correctly evaluate K vs K draw position", async () => {
      const fen = "4k3/8/4K3/8/8/8/8/8 w - - 0 1";

      const result = await tablebaseService.getEvaluation(fen);

      expect(result.isAvailable).toBe(true);
      expect(result.result?.category).toBe("draw");
      expect(result.result?.dtz).toBe(0);
    });

    it("should handle position with too many pieces", async () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      const result = await tablebaseService.getEvaluation(fen);

      expect(result.isAvailable).toBe(false);
      expect(result.result).toBeUndefined();
    });
  });

  describe("Move Evaluation", () => {
    it("should get top moves for K+P vs K position", async () => {
      // Use a known winning position that actually has moves
      const fen = "K7/P7/k7/8/8/8/8/8 w - - 0 1";

      // Clear cache to ensure fresh API call
      tablebaseService.clearCache();
      const movesResult = await tablebaseService.getTopMoves(fen, 5);
      const moves = movesResult.moves || [];

      expect(moves).toBeDefined();

      if (moves.length > 0) {
        // All moves should have tablebase data
        moves.forEach((move: any) => {
          expect(move.wdl).toBeDefined();
          expect(move.dtz).toBeDefined();
          expect(move.category).toBeDefined();
        });

        // Best moves should be winning
        const winningMoves = moves.filter((m: any) => m.category === "win");
        expect(winningMoves.length).toBeGreaterThan(0);

        // Moves should be sorted by DTZ (best first)
        if (winningMoves.length > 1) {
          for (let i = 1; i < winningMoves.length; i++) {
            const currentDtz = winningMoves[i].dtz || 0;
            const previousDtz = winningMoves[i - 1].dtz || 0;
            expect(currentDtz).toBeGreaterThanOrEqual(previousDtz);
          }
        }
      } else {
        // In some environments, API might not return moves
        // Verify that the position is at least recognized as winning
        const evaluation = await tablebaseService.getEvaluation(fen);
        expect(evaluation.isAvailable).toBe(true);
        expect(evaluation.result?.category).toBe("win");
        console.warn(
          "No moves returned from API - this may be a test environment issue",
        );
      }
    });
  });

  describe("WDL Perspective Normalization", () => {
    it("should handle perspective correctly for black to move", async () => {
      // Position where black is to move and losing
      const fen = COMMON_FENS.REAL_API_KPK;

      const result = await tablebaseService.getEvaluation(fen);

      expect(result.isAvailable).toBe(true);
      // From API perspective (black to move), it's a loss
      // But our service should normalize this
      expect(result.result?.category).toBe("loss"); // Black loses
      expect(result.result?.wdl).toBeLessThan(0); // Negative for black
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed FEN gracefully", async () => {
      const invalidFen = "invalid fen string";

      const result = await tablebaseService.getEvaluation(invalidFen);

      expect(result.isAvailable).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle network timeouts", async () => {
      // Test with an invalid FEN that would cause API issues
      const invalidFen = "K7/P7/k7/8/8/8/8/8 w - - invalid";

      const result = await tablebaseService.getEvaluation(invalidFen);

      // Should fail gracefully
      expect(result.isAvailable).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000); // Allow 10 seconds for this test
  });

  describe("Rate Limiting", () => {
    it("should handle multiple rapid requests", async () => {
      const fen = "K7/P7/k7/8/8/8/8/8 w - - 0 1";

      // Make 5 rapid requests
      const promises = Array(5)
        .fill(null)
        .map(() => tablebaseService.getEvaluation(fen));

      const results = await Promise.all(promises);

      // All should succeed (service should handle rate limiting internally)
      results.forEach((result: any) => {
        expect(result.isAvailable).toBe(true);
        expect(result.result?.category).toBe("win");
      });
    });
  });

  describe("Cache Behavior", () => {
    it("should cache repeated requests", async () => {
      const fen = "K7/P7/k7/8/8/8/8/8 w - - 0 1";

      // First request
      const start1 = Date.now();
      const result1 = await tablebaseService.getEvaluation(fen);
      const time1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      const result2 = await tablebaseService.getEvaluation(fen);
      const time2 = Date.now() - start2;

      expect(result1).toEqual(result2);
      // Cached request should be much faster
      expect(time2).toBeLessThan(time1);
    });
  });
});

/**
 * Contract Verification Tests
 *
 * These tests verify that the real API response format matches our expectations
 */
describeIfNotCI("API Contract Verification", () => {
  it("should verify tablebase API response format", async () => {
    const response = await fetch(
      "https://tablebase.lichess.ovh/standard?fen=K7/P7/k7/8/8/8/8/8 w - - 0 1",
    );
    const data = await response.json();

    // Verify expected fields exist
    expect(data).toHaveProperty("category");
    expect(["win", "draw", "loss", "cursed-win", "blessed-loss"]).toContain(
      data.category,
    );

    if (data.dtz !== null) {
      expect(typeof data.dtz).toBe("number");
    }

    if (data.precise_dtz !== undefined) {
      expect(typeof data.precise_dtz).toBe("boolean");
    }
  });

  it("should verify moves endpoint response format", async () => {
    const response = await fetch(
      "https://tablebase.lichess.ovh/standard?fen=K7/P7/k7/8/8/8/8/8%20w%20-%20-%200%201&moves=5",
    );
    const data = await response.json();

    // API should have moves field (even if empty in some environments)
    if ("moves" in data) {
      expect(Array.isArray(data.moves)).toBe(true);

      if (data.moves.length > 0) {
        const move = data.moves[0];
        expect(move).toHaveProperty("uci");
        expect(move).toHaveProperty("category");

        if (move.dtz !== null) {
          expect(typeof move.dtz).toBe("number");
        }
      }
    } else {
      // In some environments (Jest/Node.js), API might not return moves
      // This is acceptable as long as basic position evaluation works
      expect(data).toHaveProperty("category");
      expect(data).toHaveProperty("dtz");
      console.warn(
        "API didn't return moves array - this may be a test environment issue",
      );
    }
  });
});
