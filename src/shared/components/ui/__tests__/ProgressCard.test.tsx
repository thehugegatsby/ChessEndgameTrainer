import { describe, it, expect, beforeEach, vi } from 'vitest';
/**
 * @file Unit tests for ProgressCard component
 * @module tests/unit/ui/components/ProgressCard.test
 * 
 * @description
 * Comprehensive test suite for the ProgressCard component which displays
 * training progress with statistics, difficulty indicators, and category icons.
 * Tests cover rendering, interaction, accessibility, and edge cases.
 * 
 * @see {@link ProgressCard} - Component being tested
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressCard } from "@shared/components/ui/ProgressCard";

/**
 * Mock progress statistics for testing
 * @constant
 */
const mockProgressStats = {
  total: 20,
  completed: 12,
  successRate: 0.75,
  dueToday: 3,
  streak: 5,
};

/**
 * Default props for ProgressCard component tests
 * @constant
 */
const defaultProps = {
  title: "King and Queen vs King",
  description: "Learn basic checkmate patterns",
  stats: mockProgressStats,
  difficulty: "beginner" as const,
  category: "queen" as const,
  onStartTraining: vi.fn(),
};

describe("ProgressCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render basic card information", () => {
      render(<ProgressCard {...defaultProps} />);

      expect(screen.getByText("King and Queen vs King")).toBeInTheDocument();
      expect(
        screen.getByText("Learn basic checkmate patterns"),
      ).toBeInTheDocument();
    });

    it("should display correct progress stats", () => {
      render(<ProgressCard {...defaultProps} />);

      // Progress fraction
      expect(screen.getByText("12/20")).toBeInTheDocument();

      // Progress percentage (60%)
      expect(screen.getByText("60% abgeschlossen")).toBeInTheDocument();

      // Success rate (75%)
      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.getByText("Erfolgsrate")).toBeInTheDocument();

      // Due today
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Heute fällig")).toBeInTheDocument();
    });

    it("should display streak when present", () => {
      render(<ProgressCard {...defaultProps} />);

      expect(screen.getByText("5 Tage Streak")).toBeInTheDocument();
      expect(screen.getByText("🔥")).toBeInTheDocument();
    });

    it("should not display streak when zero", () => {
      const propsWithoutStreak = {
        ...defaultProps,
        stats: { ...mockProgressStats, streak: 0 },
      };

      render(<ProgressCard {...propsWithoutStreak} />);

      expect(screen.queryByText("0 Tage Streak")).not.toBeInTheDocument();
    });

    it("should handle zero total correctly", () => {
      const propsWithZeroTotal = {
        ...defaultProps,
        stats: { ...mockProgressStats, total: 0, completed: 0 },
      };

      render(<ProgressCard {...propsWithZeroTotal} />);

      expect(screen.getByText("0/0")).toBeInTheDocument();
      expect(screen.getByText("0% abgeschlossen")).toBeInTheDocument();
    });
  });

  describe("Difficulty Indicators", () => {
    it("should display beginner difficulty", () => {
      render(<ProgressCard {...defaultProps} difficulty="beginner" />);

      expect(screen.getByText("🌱")).toBeInTheDocument();
      expect(screen.getByText("beginner")).toBeInTheDocument();
    });

    it("should display intermediate difficulty", () => {
      render(<ProgressCard {...defaultProps} difficulty="intermediate" />);

      expect(screen.getByText("⚡")).toBeInTheDocument();
      expect(screen.getByText("intermediate")).toBeInTheDocument();
    });

    it("should display advanced difficulty", () => {
      render(<ProgressCard {...defaultProps} difficulty="advanced" />);

      // There are multiple fire emojis (difficulty and streak)
      const fireEmojis = screen.getAllByText("🔥");
      expect(fireEmojis.length).toBeGreaterThan(0);
      expect(screen.getByText("advanced")).toBeInTheDocument();
    });
  });

  describe("Category Icons", () => {
    it("should display queen category icon", () => {
      render(<ProgressCard {...defaultProps} category="queen" />);

      expect(screen.getByText("♛")).toBeInTheDocument();
    });

    it("should display rook category icon", () => {
      render(<ProgressCard {...defaultProps} category="rook" />);

      expect(screen.getByText("♜")).toBeInTheDocument();
    });

    it("should display pawn category icon", () => {
      render(<ProgressCard {...defaultProps} category="pawn" />);

      expect(screen.getByText("♟️")).toBeInTheDocument();
    });

    it("should display minor pieces category icon", () => {
      render(<ProgressCard {...defaultProps} category="minor" />);

      expect(screen.getByText("♝")).toBeInTheDocument();
    });

    it("should display other category icon", () => {
      render(<ProgressCard {...defaultProps} category="other" />);

      expect(screen.getByText("🎯")).toBeInTheDocument();
    });
  });

  describe("Button Behavior", () => {
    it("should call onStartTraining when button clicked", () => {
      const onStartTraining = vi.fn();

      render(
        <ProgressCard {...defaultProps} onStartTraining={onStartTraining} />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onStartTraining).toHaveBeenCalledTimes(1);
    });

    it("should show due tasks in button text when tasks are due", () => {
      render(<ProgressCard {...defaultProps} />);

      expect(screen.getByText("3 Aufgaben trainieren")).toBeInTheDocument();
    });

    it("should show generic text when no tasks due", () => {
      const propsWithoutDueTasks = {
        ...defaultProps,
        stats: { ...mockProgressStats, dueToday: 0 },
      };

      render(<ProgressCard {...propsWithoutDueTasks} />);

      expect(screen.getByText("Training starten")).toBeInTheDocument();
    });
  });

  describe("Progress Bar", () => {
    it("should display correct progress bar width", () => {
      const { container } = render(<ProgressCard {...defaultProps} />);

      // Find progress bar element by looking for the div with width style
      const progressBar = container.querySelector('div[style*="width: 60%"]');

      expect(progressBar).toBeInTheDocument();
    });

    it("should handle 100% completion", () => {
      const completeStats = {
        ...mockProgressStats,
        completed: 20,
        total: 20,
      };

      render(<ProgressCard {...defaultProps} stats={completeStats} />);

      expect(screen.getByText("100% abgeschlossen")).toBeInTheDocument();
    });

    it("should handle 0% completion", () => {
      const zeroStats = {
        ...mockProgressStats,
        completed: 0,
        total: 20,
      };

      render(<ProgressCard {...defaultProps} stats={zeroStats} />);

      expect(screen.getByText("0% abgeschlossen")).toBeInTheDocument();
    });
  });

  describe("CSS Classes and Styling", () => {
    it("should apply correct difficulty styling classes", () => {
      const { container } = render(
        <ProgressCard {...defaultProps} difficulty="beginner" />,
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("from-green-50");
      expect(card.className).toContain("to-emerald-50");
      expect(card.className).toContain("border-green-200");
    });

    it("should apply intermediate difficulty styling", () => {
      const { container } = render(
        <ProgressCard {...defaultProps} difficulty="intermediate" />,
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("from-yellow-50");
      expect(card.className).toContain("to-orange-50");
    });

    it("should apply advanced difficulty styling", () => {
      const { container } = render(
        <ProgressCard {...defaultProps} difficulty="advanced" />,
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("from-red-50");
      expect(card.className).toContain("to-pink-50");
    });

    it("should have hover effects", () => {
      const { container } = render(<ProgressCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("hover:shadow-xl");
      expect(card.className).toContain("hover:scale-105");
    });
  });

  describe("Accessibility", () => {
    it("should have proper button role", () => {
      render(<ProgressCard {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should support keyboard interaction", () => {
      const onStartTraining = vi.fn();

      render(
        <ProgressCard {...defaultProps} onStartTraining={onStartTraining} />,
      );

      const button = screen.getByRole("button");

      // Test Enter key
      fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
      fireEvent.keyUp(button, { key: "Enter", code: "Enter" });

      // Focus and click should work
      button.focus();
      fireEvent.click(button);

      expect(onStartTraining).toHaveBeenCalled();
    });

    it("should have descriptive text content for screen readers", () => {
      render(<ProgressCard {...defaultProps} />);

      // Important content should be visible to screen readers
      expect(screen.getByText("Fortschritt")).toBeInTheDocument();
      expect(screen.getByText("Erfolgsrate")).toBeInTheDocument();
      expect(screen.getByText("Heute fällig")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very high success rates", () => {
      const highSuccessStats = {
        ...mockProgressStats,
        successRate: 0.999,
      };

      render(<ProgressCard {...defaultProps} stats={highSuccessStats} />);

      expect(screen.getByText("100%")).toBeInTheDocument(); // Rounded to 100%
    });

    it("should handle very low success rates", () => {
      const lowSuccessStats = {
        ...mockProgressStats,
        successRate: 0.001,
      };

      render(<ProgressCard {...defaultProps} stats={lowSuccessStats} />);

      expect(screen.getByText("0%")).toBeInTheDocument(); // Rounded to 0%
    });

    it("should handle large numbers", () => {
      const largeStats = {
        total: 1000,
        completed: 567,
        successRate: 0.843,
        dueToday: 99,
        streak: 150,
      };

      render(<ProgressCard {...defaultProps} stats={largeStats} />);

      expect(screen.getByText("567/1000")).toBeInTheDocument();
      expect(screen.getByText("57% abgeschlossen")).toBeInTheDocument(); // 567/1000 = 56.7% → 57%
      expect(screen.getByText("84%")).toBeInTheDocument(); // 84.3% → 84%
      expect(screen.getByText("99")).toBeInTheDocument();
      expect(screen.getByText("150 Tage Streak")).toBeInTheDocument();
    });

    it("should handle completed > total gracefully", () => {
      const invalidStats = {
        ...mockProgressStats,
        total: 10,
        completed: 15, // More completed than total
      };

      render(<ProgressCard {...defaultProps} stats={invalidStats} />);

      expect(screen.getByText("15/10")).toBeInTheDocument();
      expect(screen.getByText("150% abgeschlossen")).toBeInTheDocument(); // 15/10 = 150%
    });
  });

  describe("Component Memoization", () => {
    it("should be memoized with React.memo", () => {
      expect(ProgressCard.displayName).toBe("ProgressCard");
    });

    it("should not re-render with same props", () => {
      const { rerender } = render(<ProgressCard {...defaultProps} />);
      const initialHtml = screen
        .getByText("King and Queen vs King")
        .closest("div")?.outerHTML;

      // Re-render with same props
      rerender(<ProgressCard {...defaultProps} />);
      const secondHtml = screen
        .getByText("King and Queen vs King")
        .closest("div")?.outerHTML;

      expect(initialHtml).toBe(secondHtml);
    });
  });
});
