/**
 * Unit tests for tablebase result classification utilities
 */

import {
  getMoveResultType,
  getMoveResultTypeFromWdl,
  groupMovesByResult,
  sortMovesByResult,
  classifyMovesByDTZ,
  getColorClass,
  getEvaluationBarColor,
  getResultIcon,
  calculateBarWidth,
  formatDtzDisplay,
  getResultTypeTitle,
  type TablebaseMove,
} from "@shared/utils/tablebase/resultClassification";

describe("Result Classification Utilities", () => {
  const mockMoves: TablebaseMove[] = [
    { move: "e4", san: "e4", dtz: 5, dtm: 10, wdl: 2, category: "win" },
    { move: "e5", san: "e5", dtz: 0, dtm: 0, wdl: 0, category: "draw" },
    { move: "e6", san: "e6", dtz: -3, dtm: -6, wdl: -2, category: "loss" },
    { move: "f4", san: "f4", dtz: 2, dtm: 4, wdl: 2, category: "win" },
    { move: "f5", san: "f5", dtz: 0, dtm: 0, wdl: 0, category: "draw" },
    { move: "f6", san: "f6", dtz: -7, dtm: -14, wdl: -2, category: "loss" },
  ];

  describe("getMoveResultType", () => {
    it("should return win for positive DTZ values", () => {
      expect(getMoveResultType(5)).toBe("win");
      expect(getMoveResultType(1)).toBe("win");
    });

    it("should return draw for zero DTZ values", () => {
      expect(getMoveResultType(0)).toBe("draw");
    });

    it("should return loss for negative DTZ values", () => {
      expect(getMoveResultType(-3)).toBe("loss");
      expect(getMoveResultType(-1)).toBe("loss");
    });
  });

  describe("getMoveResultTypeFromWdl", () => {
    it("should return win for positive WDL values", () => {
      expect(getMoveResultTypeFromWdl(2)).toBe("win");
      expect(getMoveResultTypeFromWdl(1)).toBe("win");
    });

    it("should return draw for zero WDL values", () => {
      expect(getMoveResultTypeFromWdl(0)).toBe("draw");
    });

    it("should return loss for negative WDL values", () => {
      expect(getMoveResultTypeFromWdl(-2)).toBe("loss");
      expect(getMoveResultTypeFromWdl(-1)).toBe("loss");
    });
  });

  describe("groupMovesByResult", () => {
    it("should group moves by result type", () => {
      const grouped = groupMovesByResult(mockMoves);

      expect(grouped.win).toHaveLength(2);
      expect(grouped.draw).toHaveLength(2);
      expect(grouped.loss).toHaveLength(2);

      expect(grouped.win[0].san).toBe("e4");
      expect(grouped.win[1].san).toBe("f4");
      expect(grouped.draw[0].san).toBe("e5");
      expect(grouped.draw[1].san).toBe("f5");
      expect(grouped.loss[0].san).toBe("e6");
      expect(grouped.loss[1].san).toBe("f6");
    });
  });

  describe("sortMovesByResult", () => {
    it("should sort moves by result type priority and DTZ values", () => {
      const sorted = sortMovesByResult(mockMoves);

      // Should be ordered: win moves first, then draw, then loss
      expect(sorted[0].san).toBe("f4"); // Win with DTZ 2
      expect(sorted[1].san).toBe("e4"); // Win with DTZ 5
      expect(sorted[2].san).toBe("e5"); // Draw (alphabetical)
      expect(sorted[3].san).toBe("f5"); // Draw (alphabetical)
      expect(sorted[4].san).toBe("e6"); // Loss with DTZ -3
      expect(sorted[5].san).toBe("f6"); // Loss with DTZ -7
    });
  });

  describe("classifyMovesByDTZ", () => {
    it("should classify and sort moves correctly", () => {
      const classified = classifyMovesByDTZ(mockMoves);

      expect(classified.winningMoves).toHaveLength(2);
      expect(classified.drawingMoves).toHaveLength(2);
      expect(classified.losingMoves).toHaveLength(2);
      expect(classified.totalMoves).toBe(6);

      // Check sorting within groups
      expect(classified.winningMoves[0].san).toBe("f4"); // DTZ 2 before DTZ 5
      expect(classified.winningMoves[1].san).toBe("e4");
      expect(classified.losingMoves[0].san).toBe("e6"); // DTZ -3 before DTZ -7
      expect(classified.losingMoves[1].san).toBe("f6");
    });
  });

  describe("getColorClass", () => {
    it("should return correct color classes for each result type", () => {
      expect(getColorClass("win")).toContain("text-green-700");
      expect(getColorClass("draw")).toContain("text-yellow-700");
      expect(getColorClass("loss")).toContain("text-red-700");
    });
  });

  describe("getEvaluationBarColor", () => {
    it("should return correct bar colors for each result type", () => {
      expect(getEvaluationBarColor("win")).toBe("bg-green-500");
      expect(getEvaluationBarColor("draw")).toBe("bg-yellow-500");
      expect(getEvaluationBarColor("loss")).toBe("bg-red-500");
    });
  });

  describe("getResultIcon", () => {
    it("should return correct icons for each result type", () => {
      expect(getResultIcon("win")).toBe("✓");
      expect(getResultIcon("draw")).toBe("=");
      expect(getResultIcon("loss")).toBe("✗");
    });
  });

  describe("calculateBarWidth", () => {
    it("should calculate correct bar widths", () => {
      expect(calculateBarWidth(5, 10)).toBe(60); // (5/10) * 80 + 20 = 60
      expect(calculateBarWidth(0, 10)).toBe(20); // (0/10) * 80 + 20 = 20
      expect(calculateBarWidth(-5, 10)).toBe(60); // abs(-5/10) * 80 + 20 = 60
    });

    it("should handle edge cases", () => {
      expect(calculateBarWidth(0, 0)).toBe(50); // Default for draws when maxDtz is 0
      expect(calculateBarWidth(10, 10)).toBe(100); // Maximum width
    });
  });

  describe("formatDtzDisplay", () => {
    it("should format DTZ values correctly", () => {
      expect(formatDtzDisplay(5)).toBe("Win in 5");
      expect(formatDtzDisplay(0)).toBe("Draw");
      expect(formatDtzDisplay(-3)).toBe("Loss in 3");
    });
  });

  describe("getResultTypeTitle", () => {
    it("should return correct titles for each result type", () => {
      expect(getResultTypeTitle("win")).toBe("Winning Moves");
      expect(getResultTypeTitle("draw")).toBe("Drawing Moves");
      expect(getResultTypeTitle("loss")).toBe("Losing Moves");
    });
  });
});
