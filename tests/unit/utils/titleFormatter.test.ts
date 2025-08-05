/**
 * Tests for title formatting utilities
 */

import {
  formatPositionTitle,
  getShortTitle,
  getTrainingDisplayTitle,
} from "@shared/utils/titleFormatter";
import { EndgamePosition } from "@shared/types";

describe("titleFormatter", () => {
  const brückenbauPosition: EndgamePosition = {
    id: 12,
    title: "Brückenbau",
    description: "Build a bridge for your rook",
    fen: "1K6/1P6/8/8/8/8/r7/1k6 b - - 0 1",
    category: "rook-pawn",
    difficulty: "advanced",
    targetMoves: 5,
    hints: ["Create a bridge with your rook"],
    solution: ["Ra2-a8+", "Kb8-c7", "Ra8-a7", "Kb1-b2", "Ra7-b7"],
    sideToMove: "black",
    goal: "draw",
  };

  const regularPosition: EndgamePosition = {
    id: 1,
    title: "King and Pawn vs King",
    description: "Basic endgame technique",
    fen: "8/8/8/4k3/4P3/4K3/8/8 w - - 0 1",
    category: "basic-checkmates",
    difficulty: "beginner",
    targetMoves: 3,
    hints: ["Use opposition"],
    solution: ["Ke4", "Kf6", "e5+"],
    sideToMove: "white",
    goal: "win",
  };

  describe("formatPositionTitle", () => {
    it("formats Brückenbau titles with position number", () => {
      const result = formatPositionTitle(brückenbauPosition);
      expect(result).toBe("Brückenbau 12");
    });

    it("formats Brückenbau titles with total positions", () => {
      const result = formatPositionTitle(brückenbauPosition, 20);
      expect(result).toBe("Brückenbau 12/20");
    });

    it("returns original title for regular positions", () => {
      const result = formatPositionTitle(regularPosition);
      expect(result).toBe("King and Pawn vs King");
    });

    it("handles case-insensitive Brückenbau detection", () => {
      const position = { ...brückenbauPosition, title: "brückenbau technique" };
      const result = formatPositionTitle(position);
      expect(result).toBe("Brückenbau 12");
    });

    it("handles rook-pawn category with Brückenbau title", () => {
      const position = {
        ...brückenbauPosition,
        category: "rook-pawn" as const,
      };
      const result = formatPositionTitle(position, 15);
      expect(result).toBe("Brückenbau 12/15");
    });
  });

  describe("getShortTitle", () => {
    it("keeps Brückenbau titles as-is since they are already short", () => {
      const result = getShortTitle(brückenbauPosition);
      expect(result).toBe("Brückenbau 12");
    });

    it("returns regular titles as-is if short enough", () => {
      const result = getShortTitle(regularPosition);
      expect(result).toBe("King and Pawn vs King");
    });

    it("truncates very long titles", () => {
      const longTitlePosition = {
        ...regularPosition,
        title:
          "This is a very long title that should be truncated for display purposes",
      };
      const result = getShortTitle(longTitlePosition);
      expect(result).toBe("This is a very long title t...");
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe("getTrainingDisplayTitle", () => {
    it("returns basic title for new sessions", () => {
      const result = getTrainingDisplayTitle(brückenbauPosition);
      expect(result).toBe("Brückenbau 12");
    });

    it("adds move progress indicator for longer sessions", () => {
      const result = getTrainingDisplayTitle(brückenbauPosition, 8);
      expect(result).toBe("Brückenbau 12 🔥 4");
    });

    it("does not add progress indicator for short sessions", () => {
      const result = getTrainingDisplayTitle(brückenbauPosition, 3);
      expect(result).toBe("Brückenbau 12");
    });

    it("includes total positions when provided", () => {
      const result = getTrainingDisplayTitle(brückenbauPosition, 2, 20);
      expect(result).toBe("Brückenbau 12/20");
    });

    it("combines progress indicator with total positions", () => {
      const result = getTrainingDisplayTitle(brückenbauPosition, 10, 20);
      expect(result).toBe("Brückenbau 12/20 🔥 5");
    });
  });
});
