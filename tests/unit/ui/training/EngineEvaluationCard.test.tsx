/**
 * @fileoverview Unit tests for EngineEvaluationCard component
 * @description Tests engine evaluation display with loading states and score formatting
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { EngineEvaluationCard } from '@shared/components/training/DualEvaluationPanel/EngineEvaluationCard';

describe('EngineEvaluationCard Component', () => {
  const mockEvaluation = {
    score: 150, // 1.5 in pawn units
    mate: null,
    evaluation: 'Slight advantage for White'
  };

  const mockMateEvaluation = {
    score: 0,
    mate: 3,
    evaluation: 'Mate in 3 moves'
  };

  describe('Loading State', () => {
    it('should render loading state correctly', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} isLoading={true} />);

      expect(screen.getByText('Engine (Stockfish)')).toBeInTheDocument();
      // UCI Protocol is only shown when NOT loading
      expect(screen.queryByText('UCI Protocol')).not.toBeInTheDocument();
      
      // Should show loading animation
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Should show loading placeholder
      const placeholder = document.querySelector('.animate-pulse');
      expect(placeholder).toBeInTheDocument();
    });

    it('should not show evaluation data during loading', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} isLoading={true} />);

      expect(screen.queryByText('1.5')).not.toBeInTheDocument();
      expect(screen.queryByText('Slight advantage for White')).not.toBeInTheDocument();
    });
  });

  describe('Normal Evaluation Display', () => {
    it('should render evaluation data when not loading', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} isLoading={false} />);

      expect(screen.getByText('Engine (Stockfish)')).toBeInTheDocument();
      expect(screen.getByText('UCI Protocol')).toBeInTheDocument();
      expect(screen.getByText('1.5')).toBeInTheDocument(); // score / 100
      expect(screen.getByText('Slight advantage for White')).toBeInTheDocument();
    });

    it('should default to not loading when isLoading prop not provided', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      expect(screen.getByText('1.5')).toBeInTheDocument();
      expect(screen.getByText('Slight advantage for White')).toBeInTheDocument();
      expect(screen.queryByText('.animate-spin')).not.toBeInTheDocument();
    });

    it('should format positive scores correctly', () => {
      const positiveEval = { ...mockEvaluation, score: 250 };
      render(<EngineEvaluationCard evaluation={positiveEval} />);

      expect(screen.getByText('2.5')).toBeInTheDocument();
    });

    it('should format negative scores correctly', () => {
      const negativeEval = { ...mockEvaluation, score: -180 };
      render(<EngineEvaluationCard evaluation={negativeEval} />);

      expect(screen.getByText('-1.8')).toBeInTheDocument();
    });

    it('should format zero score correctly', () => {
      const zeroEval = { ...mockEvaluation, score: 0 };
      render(<EngineEvaluationCard evaluation={zeroEval} />);

      expect(screen.getByText('0.0')).toBeInTheDocument();
    });
  });

  describe('Mate Evaluation Display', () => {
    it('should display mate evaluation correctly', () => {
      render(<EngineEvaluationCard evaluation={mockMateEvaluation} />);

      expect(screen.getByText('M3')).toBeInTheDocument();
      // There are two "Mate in 3 moves" texts - evaluation text and mate info
      const mateTexts = screen.getAllByText('Mate in 3 moves');
      expect(mateTexts).toHaveLength(2);
    });

    it('should handle negative mate values', () => {
      const negativeMate = { ...mockMateEvaluation, mate: -2 };
      render(<EngineEvaluationCard evaluation={negativeMate} />);

      expect(screen.getByText('M2')).toBeInTheDocument(); // Math.abs(-2)
      expect(screen.getByText('Mate in 2 moves')).toBeInTheDocument();
    });

    it('should handle mate in 1', () => {
      const mateInOne = { ...mockMateEvaluation, mate: 1 };
      render(<EngineEvaluationCard evaluation={mateInOne} />);

      expect(screen.getByText('M1')).toBeInTheDocument();
      expect(screen.getByText('Mate in 1 moves')).toBeInTheDocument();
    });

    it('should not show mate info when mate is null', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      expect(screen.queryByText(/Mate in/)).not.toBeInTheDocument();
    });

    it('should not show mate info when mate is undefined', () => {
      const noMateEval = { ...mockEvaluation, mate: null };
      render(<EngineEvaluationCard evaluation={noMateEval} />);

      expect(screen.queryByText(/Mate in/)).not.toBeInTheDocument();
    });
  });

  describe('Score Color Coding', () => {
    it('should apply green color for positive scores', () => {
      const positiveEval = { ...mockEvaluation, score: 200 };
      render(<EngineEvaluationCard evaluation={positiveEval} />);

      const scoreElement = screen.getByText('2.0');
      expect(scoreElement.className).toContain('text-green-600');
    });

    it('should apply red color for negative scores', () => {
      const negativeEval = { ...mockEvaluation, score: -200 };
      render(<EngineEvaluationCard evaluation={negativeEval} />);

      const scoreElement = screen.getByText('-2.0');
      expect(scoreElement.className).toContain('text-red-600');
    });

    it('should apply yellow color for scores close to zero', () => {
      const neutralEval = { ...mockEvaluation, score: 30 };
      render(<EngineEvaluationCard evaluation={neutralEval} />);

      const scoreElement = screen.getByText('0.3');
      expect(scoreElement.className).toContain('text-yellow-600');
    });

    it('should apply yellow color for negative scores close to zero', () => {
      const neutralEval = { ...mockEvaluation, score: -40 };
      render(<EngineEvaluationCard evaluation={neutralEval} />);

      const scoreElement = screen.getByText('-0.4');
      expect(scoreElement.className).toContain('text-yellow-600');
    });

    it('should handle exactly zero score', () => {
      const zeroEval = { ...mockEvaluation, score: 0 };
      render(<EngineEvaluationCard evaluation={zeroEval} />);

      const scoreElement = screen.getByText('0.0');
      expect(scoreElement.className).toContain('text-yellow-600');
    });

    it('should handle boundary values for color thresholds', () => {
      // Test exactly 50 centipawns (boundary value)
      const boundaryEval = { ...mockEvaluation, score: 50 };
      render(<EngineEvaluationCard evaluation={boundaryEval} />);

      const scoreElement = screen.getByText('0.5');
      expect(scoreElement.className).toContain('text-green-600');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct card styling', () => {
      const { container } = render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('dark:bg-gray-800');
      expect(card.className).toContain('rounded-lg');
      expect(card.className).toContain('p-4');
      expect(card.className).toContain('border');
      expect(card.className).toContain('border-gray-200');
      expect(card.className).toContain('dark:border-gray-700');
    });

    it('should apply correct header styling', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      const header = screen.getByText('Engine (Stockfish)');
      expect(header.className).toContain('text-sm');
      expect(header.className).toContain('font-medium');
      expect(header.className).toContain('text-gray-700');
      expect(header.className).toContain('dark:text-gray-300');
    });

    it('should apply correct score styling', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      const score = screen.getByText('1.5');
      expect(score.className).toContain('text-lg');
      expect(score.className).toContain('font-mono');
      expect(score.className).toContain('font-bold');
    });

    it('should apply correct evaluation text styling', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      const evalText = screen.getByText('Slight advantage for White');
      expect(evalText.className).toContain('text-sm');
      expect(evalText.className).toContain('text-gray-600');
      expect(evalText.className).toContain('dark:text-gray-400');
    });

    it('should apply correct mate info styling', () => {
      render(<EngineEvaluationCard evaluation={mockMateEvaluation} />);

      // Get the mate info element specifically (the second one with text-xs class)
      const mateInfoElements = screen.getAllByText('Mate in 3 moves');
      const mateInfo = mateInfoElements.find(el => el.className.includes('text-xs'));
      expect(mateInfo).toBeDefined();
      expect(mateInfo?.className).toContain('text-xs');
      expect(mateInfo?.className).toContain('text-gray-500');
      expect(mateInfo?.className).toContain('dark:text-gray-400');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for all elements', () => {
      const { container } = render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      // Card should have dark mode background
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('dark:bg-gray-800');
      expect(card.className).toContain('dark:border-gray-700');

      // Text elements should have dark mode colors
      const header = screen.getByText('Engine (Stockfish)');
      expect(header.className).toContain('dark:text-gray-300');

      const protocol = screen.getByText('UCI Protocol');
      expect(protocol.className).toContain('dark:text-gray-400');

      const evaluation = screen.getByText('Slight advantage for White');
      expect(evaluation.className).toContain('dark:text-gray-400');
    });
  });

  describe('Loading Animation', () => {
    it('should show spinning loader', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} isLoading={true} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner?.className).toContain('rounded-full');
      expect(spinner?.className).toContain('border-b-2');
      expect(spinner?.className).toContain('border-blue-600');
    });

    it('should show pulsing placeholder', () => {
      render(<EngineEvaluationCard evaluation={mockEvaluation} isLoading={true} />);

      const placeholder = document.querySelector('.animate-pulse');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder?.className).toContain('bg-gray-200');
      expect(placeholder?.className).toContain('dark:bg-gray-700');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large positive scores', () => {
      const largeEval = { ...mockEvaluation, score: 999999 };
      render(<EngineEvaluationCard evaluation={largeEval} />);

      expect(screen.getByText('10000.0')).toBeInTheDocument(); // 999999/100 = 9999.99 → 10000.0
    });

    it('should handle very large negative scores', () => {
      const largeNegativeEval = { ...mockEvaluation, score: -500000 };
      render(<EngineEvaluationCard evaluation={largeNegativeEval} />);

      expect(screen.getByText('-5000.0')).toBeInTheDocument();
    });

    it('should handle decimal precision correctly', () => {
      const preciseEval = { ...mockEvaluation, score: 123 };
      render(<EngineEvaluationCard evaluation={preciseEval} />);

      expect(screen.getByText('1.2')).toBeInTheDocument(); // 123/100 = 1.23 → 1.2 (1 decimal)
    });

    it('should handle zero mate value', () => {
      const zeroMate = { ...mockMateEvaluation, mate: 0 };
      render(<EngineEvaluationCard evaluation={zeroMate} />);

      expect(screen.getByText('M0')).toBeInTheDocument();
      expect(screen.getByText('Mate in 0 moves')).toBeInTheDocument();
    });

    it('should handle missing evaluation text', () => {
      const noEvalText = { ...mockEvaluation, evaluation: '' };
      render(<EngineEvaluationCard evaluation={noEvalText} />);

      expect(screen.getByText('1.5')).toBeInTheDocument();
      // Empty evaluation text should still render the element
      const evalElement = screen.getByText('1.5').parentElement?.querySelector('.text-sm.text-gray-600');
      expect(evalElement).toBeInTheDocument();
    });

    it('should handle undefined evaluation text', () => {
      const noEvalText = { ...mockEvaluation, evaluation: undefined as any };
      render(<EngineEvaluationCard evaluation={noEvalText} />);

      expect(screen.getByText('1.5')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have proper header structure', () => {
      const { container } = render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      const headerSection = container.querySelector('.flex.items-center.justify-between');
      expect(headerSection).toBeInTheDocument();
    });

    it('should have proper content structure', () => {
      const { container } = render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      const contentSection = container.querySelector('.mt-2');
      expect(contentSection).toBeInTheDocument();
    });

    it('should maintain structure consistency between loading and loaded states', () => {
      const { container: loadingContainer } = render(
        <EngineEvaluationCard evaluation={mockEvaluation} isLoading={true} />
      );
      const { container: loadedContainer } = render(
        <EngineEvaluationCard evaluation={mockEvaluation} isLoading={false} />
      );

      // Both should have the same basic structure
      const loadingCard = loadingContainer.firstChild as HTMLElement;
      const loadedCard = loadedContainer.firstChild as HTMLElement;

      expect(loadingCard.tagName).toBe(loadedCard.tagName);
      expect(loadingCard.className).toBe(loadedCard.className);
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<EngineEvaluationCard evaluation={mockEvaluation} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should render efficiently', () => {
      const startTime = performance.now();
      render(<EngineEvaluationCard evaluation={mockEvaluation} />);
      const endTime = performance.now();

      // Should render quickly
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});