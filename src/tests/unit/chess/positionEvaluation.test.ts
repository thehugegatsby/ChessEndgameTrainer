/**
 * @fileoverview Unit tests for position evaluation display
 * @description Tests getEvaluationDisplay function for position assessment
 */

import { describe, it, test, expect } from "vitest";
import { getEvaluationDisplay } from "../../../shared/utils/chess/evaluation";

describe("Position Evaluation - getEvaluationDisplay", () => {
  describe("Mate Evaluations", () => {
    test("should_display_positive_mate_as_winning", () => {
      const result = getEvaluationDisplay(0, 3);

      expect(result.text).toBe("#3");
      expect(result.className).toBe("eval-excellent");
      expect(result.color).toBe("#10b981");
      expect(result.bgColor).toBe("#065f46");
    });

    test("should_display_negative_mate_as_losing", () => {
      const result = getEvaluationDisplay(0, -5);

      expect(result.text).toBe("#5");
      expect(result.className).toBe("eval-blunder");
      expect(result.color).toBe("#ef4444");
      expect(result.bgColor).toBe("#991b1b");
    });
  });

  describe("Positional Evaluations - White Advantage", () => {
    test("should_display_dominating_white_position_with_star", () => {
      const result = getEvaluationDisplay(5.5);

      expect(result.text).toBe("⭐");
      expect(result.className).toBe("eval-excellent");
    });

    test("should_display_winning_white_position_with_sparkles", () => {
      const result = getEvaluationDisplay(3.0);

      expect(result.text).toBe("✨");
      expect(result.className).toBe("eval-excellent");
    });

    test("should_display_better_white_position_with_ok_hand", () => {
      const result = getEvaluationDisplay(1.0);

      expect(result.text).toBe("👌");
      expect(result.className).toBe("eval-good");
      expect(result.color).toBe("#3b82f6");
      expect(result.bgColor).toBe("#1e40af");
    });

    test("should_display_equal_position_with_circle", () => {
      const result = getEvaluationDisplay(0.0);

      expect(result.text).toBe("⚪");
      expect(result.className).toBe("eval-neutral");
    });
  });

  describe("Positional Evaluations - Black Advantage", () => {
    test("should_display_slightly_worse_position_with_warning", () => {
      const result = getEvaluationDisplay(-1.0);

      expect(result.text).toBe("⚠️");
      expect(result.className).toBe("eval-inaccurate");
      expect(result.color).toBe("#f59e0b");
      expect(result.bgColor).toBe("#92400e");
    });

    test("should_display_clearly_worse_position_with_orange_diamond", () => {
      const result = getEvaluationDisplay(-3.0);

      expect(result.text).toBe("🔶");
      expect(result.className).toBe("eval-mistake");
      expect(result.color).toBe("#fb923c");
      expect(result.bgColor).toBe("#c2410c");
    });

    test("should_display_losing_position_with_red_circle", () => {
      const result = getEvaluationDisplay(-6.0);

      expect(result.text).toBe("🔴");
      expect(result.className).toBe("eval-blunder");
      expect(result.color).toBe("#ef4444");
      expect(result.bgColor).toBe("#991b1b");
    });
  });

  describe("Threshold Tests", () => {
    test("should_handle_exact_thresholds", () => {
      expect(getEvaluationDisplay(5.0).text).toBe("⭐");
      expect(getEvaluationDisplay(2.0).text).toBe("✨");
      expect(getEvaluationDisplay(0.5).text).toBe("👌");
      expect(getEvaluationDisplay(-0.5).text).toBe("⚪");
      expect(getEvaluationDisplay(-2.0).text).toBe("⚠️");
      expect(getEvaluationDisplay(-5.0).text).toBe("🔶");
    });

    test("should_handle_values_just_below_thresholds", () => {
      expect(getEvaluationDisplay(4.99).text).toBe("✨");
      expect(getEvaluationDisplay(1.99).text).toBe("👌");
      expect(getEvaluationDisplay(0.49).text).toBe("⚪");
      expect(getEvaluationDisplay(-0.51).text).toBe("⚠️");
      expect(getEvaluationDisplay(-2.01).text).toBe("🔶");
      expect(getEvaluationDisplay(-5.01).text).toBe("🔴");
    });
  });

  describe("Edge Cases", () => {
    test("should_handle_very_large_positive_values", () => {
      const result = getEvaluationDisplay(100.0);

      expect(result.text).toBe("⭐");
      expect(result.className).toBe("eval-excellent");
    });

    test("should_handle_very_large_negative_values", () => {
      const result = getEvaluationDisplay(-100.0);

      expect(result.text).toBe("🔴");
      expect(result.className).toBe("eval-blunder");
    });

    test("should_handle_NaN", () => {
      const result = getEvaluationDisplay(NaN);

      // NaN comparisons are always false, so falls through to last case
      expect(result.text).toBe("🔴");
      expect(result.className).toBe("eval-blunder");
    });

    test("should_handle_Infinity", () => {
      const result = getEvaluationDisplay(Infinity);

      expect(result.text).toBe("⭐");
      expect(result.className).toBe("eval-excellent");
    });

    test("should_handle_negative_Infinity", () => {
      const result = getEvaluationDisplay(-Infinity);

      expect(result.text).toBe("🔴");
      expect(result.className).toBe("eval-blunder");
    });
  });

  describe("Complete Display Object", () => {
    test("should_return_all_required_properties", () => {
      const result = getEvaluationDisplay(1.0);

      expect(result).toHaveProperty("text");
      expect(result).toHaveProperty("className");
      expect(result).toHaveProperty("color");
      expect(result).toHaveProperty("bgColor");

      expect(typeof result.text).toBe("string");
      expect(typeof result.className).toBe("string");
      expect(typeof result.color).toBe("string");
      expect(typeof result.bgColor).toBe("string");
    });
  });
});
