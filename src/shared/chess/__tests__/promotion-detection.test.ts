/**
 * Unit test for promotion detection
 */

import { describe, it, test, expect } from 'vitest';
import { Chess } from "chess.js";
import { createValidatedMove } from '@shared/types/chess.js';

describe("Promotion Detection", () => {
  it("should detect promotion in chess.js move", () => {
    // Set up position with pawn on e7, black king on d8 (not blocking e8)
    const chess = new Chess("3k4/4P3/4K3/8/8/8/8/8 w - - 0 1");

    // Make promotion move - use object notation
    const fenBefore = chess.fen();
    const move = chess.move({ from: "e7", to: "e8", promotion: "q" });
    const fenAfter = chess.fen();

    expect(move).toBeDefined();
    expect(move.promotion).toBe("q");
    expect(move.san).toBe("e8=Q+");

    // Test createValidatedMove
    const validatedMove = createValidatedMove(move, fenBefore, fenAfter);

    expect(validatedMove.promotion).toBe("q");
    expect(validatedMove.isPromotion()).toBe(true);
  });

  it("should handle different promotion pieces", () => {
    const testCases = [
      { piece: "q", expected: "q" },
      { piece: "r", expected: "r" },
      { piece: "b", expected: "b" },
      { piece: "n", expected: "n" },
    ];

    testCases.forEach(({ piece, expected }) => {
      const chess = new Chess("3k4/4P3/4K3/8/8/8/8/8 w - - 0 1");
      const move = chess.move({ from: "e7", to: "e8", promotion: piece });

      expect(move.promotion).toBe(expected);
    });
  });

  it("should handle promotion via object notation", () => {
    const chess = new Chess("3k4/4P3/4K3/8/8/8/8/8 w - - 0 1");

    const move = chess.move({
      from: "e7",
      to: "e8",
      promotion: "q",
    });

    expect(move).toBeDefined();
    expect(move.promotion).toBe("q");
  });
});
