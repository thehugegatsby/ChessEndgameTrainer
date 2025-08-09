/**
 * Simple test to verify TablebaseService basic functionality
 */

import { tablebaseService } from "../../shared/services/TablebaseService";

// Mock fetch globally
global.fetch = jest.fn();

describe.skip("TablebaseService Basic Test", () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    tablebaseService.clearCache();
  });

  it("should handle a simple successful response", async () => {
    const fen = "4k3/8/8/8/8/8/8/4K2Q w - - 0 1";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        category: "win",
        dtz: 13,
        dtm: 13,
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: false,
        insufficient_material: false,
        moves: [
          {
            uci: "h1b7",
            san: "Qb7",
            category: "loss",
            dtz: -12,
            dtm: -12,
            zeroing: false,
            checkmate: false,
            stalemate: false,
            variant_win: false,
            variant_loss: false,
            insufficient_material: false,
          },
        ],
      }),
    } as Response);

    const result = await tablebaseService.getEvaluation(fen);

    console.log("Result:", JSON.stringify(result, null, 2));

    expect(result.isAvailable).toBe(true);
    expect(result.result?.category).toBe("win");
    expect(result.result?.wdl).toBe(2);
  });

  it("should return moves from cache", async () => {
    const fen = "4k3/8/8/8/8/8/8/4K2Q w - - 0 1";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        category: "win",
        dtz: 13,
        dtm: 13,
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: false,
        insufficient_material: false,
        moves: [
          {
            uci: "h1b7",
            san: "Qb7",
            category: "loss",
            dtz: -12,
            dtm: -12,
            zeroing: false,
            checkmate: false,
            stalemate: false,
            variant_win: false,
            variant_loss: false,
            insufficient_material: false,
          },
        ],
      }),
    } as Response);

    // First call
    await tablebaseService.getEvaluation(fen);

    // Second call should use cache
    const moves = await tablebaseService.getTopMoves(fen, 1);

    console.log("Moves:", JSON.stringify(moves, null, 2));

    expect(moves.isAvailable).toBe(true);
    expect(moves.moves?.length).toBe(1);
    expect(moves.moves?.[0].category).toBe("win"); // Should be inverted
    expect(mockFetch).toHaveBeenCalledTimes(1); // Only one API call
  });
});
