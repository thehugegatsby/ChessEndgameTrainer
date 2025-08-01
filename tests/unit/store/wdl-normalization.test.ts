/**
 * Unit tests for WDL normalization logic
 *
 * Tests the perspective normalization of WDL values from the Tablebase API
 * to ensure consistent evaluation from the training player's perspective.
 */

import {
  normalizeWdl,
  getTurnFromFen,
} from "../../../shared/utils/wdlNormalization";

describe("WDL Normalization", () => {
  describe("White perspective (training as white)", () => {
    const trainingSide = "white";

    it("should keep WDL unchanged when white is to move", () => {
      // Win for white
      expect(normalizeWdl(2, "w", trainingSide)).toBe(2);
      // Draw
      expect(normalizeWdl(0, "w", trainingSide)).toBe(0);
      // Loss for white
      expect(normalizeWdl(-2, "w", trainingSide)).toBe(-2);
    });

    it("should invert WDL when black is to move", () => {
      // Black loses (2) = White wins = 2 from white perspective
      expect(normalizeWdl(2, "b", trainingSide)).toBe(-2);
      // Draw remains draw
      expect(normalizeWdl(0, "b", trainingSide)).toBe(0);
      // Black wins (-2) = White loses = -2 from white perspective
      expect(normalizeWdl(-2, "b", trainingSide)).toBe(2);
    });
  });

  describe("Black perspective (training as black)", () => {
    const trainingSide = "black";

    it("should invert WDL when white is to move", () => {
      // White wins (2) = Black loses = -2 from black perspective
      expect(normalizeWdl(2, "w", trainingSide)).toBe(-2);
      // Draw remains draw
      expect(normalizeWdl(0, "w", trainingSide)).toBe(0);
      // White loses (-2) = Black wins = 2 from black perspective
      expect(normalizeWdl(-2, "w", trainingSide)).toBe(2);
    });

    it("should keep WDL unchanged when black is to move", () => {
      // Win for black
      expect(normalizeWdl(2, "b", trainingSide)).toBe(2);
      // Draw
      expect(normalizeWdl(0, "b", trainingSide)).toBe(0);
      // Loss for black
      expect(normalizeWdl(-2, "b", trainingSide)).toBe(-2);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined WDL values", () => {
      expect(normalizeWdl(undefined, "w", "white")).toBeUndefined();
      expect(normalizeWdl(null, "w", "white")).toBeNull();
    });

    it("should handle invalid turn values gracefully", () => {
      // Mock console.warn to suppress warning output during tests
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      // Should default to not inverting if turn is invalid
      expect(normalizeWdl(2, "x" as any, "white")).toBe(2);
      expect(normalizeWdl(2, "", "white")).toBe(2);

      // Verify warnings were called
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      // Clean up
      consoleSpy.mockRestore();
    });
  });
});

describe("getTurnFromFen", () => {
  it("should extract turn from valid FEN strings", () => {
    expect(
      getTurnFromFen(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ),
    ).toBe("w");
    expect(
      getTurnFromFen(
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      ),
    ).toBe("b");
  });

  it("should handle invalid FEN strings", () => {
    expect(getTurnFromFen("invalid fen")).toBeNull();
    expect(
      getTurnFromFen(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1",
      ),
    ).toBeNull();
    expect(getTurnFromFen("")).toBeNull();
  });
});
