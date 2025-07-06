/**
 * Comprehensive test suite for EngineEvaluationCard component
 * Tests rendering with different evaluation states, loading states, and edge cases
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EngineEvaluationCard } from '../../../../shared/components/training/DualEvaluationPanel/EngineEvaluationCard';
import type { DualEvaluation, EngineEvaluation } from '@shared/lib/chess/ScenarioEngine';

describe('EngineEvaluationCard', () => {
  const defaultEvaluation: EngineEvaluation = {
    score: 50,
    mate: null,
    evaluation: 'Slightly favorable for White'
  };

  describe('Loading State', () => {
    it('should render loading state with spinner', () => {
      render(<EngineEvaluationCard evaluation={defaultEvaluation} isLoading={true} />);
      
      expect(screen.getByText('Engine (Stockfish)')).toBeInTheDocument();
      
      // Check for loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full', 'h-4', 'w-4', 'border-b-2', 'border-blue-600');
      
      // Check for loading placeholder
      const placeholder = document.querySelector('.animate-pulse');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass('h-6', 'bg-gray-200', 'dark:bg-gray-700', 'rounded');
    });

    it('should apply correct loading container styling', () => {
      const { container } = render(
        <EngineEvaluationCard evaluation={defaultEvaluation} isLoading={true} />
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass(
        'bg-white',
        'dark:bg-gray-800',
        'rounded-lg',
        'p-4',
        'border',
        'border-gray-200',
        'dark:border-gray-700'
      );
    });

    it('should show loading header with correct styling', () => {
      render(<EngineEvaluationCard evaluation={defaultEvaluation} isLoading={true} />);
      
      const header = screen.getByText('Engine (Stockfish)');
      expect(header).toHaveClass('text-sm', 'font-medium', 'text-gray-700', 'dark:text-gray-300');
    });
  });

  describe('Normal Rendering', () => {
    it('should render card with evaluation data', () => {
      render(<EngineEvaluationCard evaluation={defaultEvaluation} isLoading={false} />);
      
      expect(screen.getByText('Engine (Stockfish)')).toBeInTheDocument();
      expect(screen.getByText('UCI Protocol')).toBeInTheDocument();
      expect(screen.getByText('0.5')).toBeInTheDocument(); // 50 / 100 = 0.5
      expect(screen.getByText('Slightly favorable for White')).toBeInTheDocument();
    });

    it('should apply correct container styling', () => {
      const { container } = render(
        <EngineEvaluationCard evaluation={defaultEvaluation} isLoading={false} />
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass(
        'bg-white',
        'dark:bg-gray-800',
        'rounded-lg',
        'p-4',
        'border',
        'border-gray-200',
        'dark:border-gray-700'
      );
    });

    it('should render header with correct structure', () => {
      render(<EngineEvaluationCard evaluation={defaultEvaluation} isLoading={false} />);
      
      const title = screen.getByText('Engine (Stockfish)');
      expect(title).toHaveClass('text-sm', 'font-medium', 'text-gray-700', 'dark:text-gray-300');
      
      const protocol = screen.getByText('UCI Protocol');
      expect(protocol).toHaveClass('text-xs', 'text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('Score Formatting', () => {
    it('should format positive scores correctly', () => {
      const evaluation = { ...defaultEvaluation, score: 150 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('1.5')).toBeInTheDocument(); // 150 / 100 = 1.5
    });

    it('should format negative scores correctly', () => {
      const evaluation = { ...defaultEvaluation, score: -250 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('-2.5')).toBeInTheDocument(); // -250 / 100 = -2.5
    });

    it('should format zero score correctly', () => {
      const evaluation = { ...defaultEvaluation, score: 0 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('should format decimal scores correctly', () => {
      const evaluation = { ...defaultEvaluation, score: 123 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('1.2')).toBeInTheDocument(); // 123 / 100 = 1.23, rounded to 1 decimal
    });

    it('should format large positive scores', () => {
      const evaluation = { ...defaultEvaluation, score: 9999 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('100.0')).toBeInTheDocument(); // 9999 / 100 = 99.99, rounds to 100.0
    });

    it('should format large negative scores', () => {
      const evaluation = { ...defaultEvaluation, score: -9999 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('-100.0')).toBeInTheDocument(); // -9999 / 100 = -99.99, rounds to -100.0
    });
  });

  describe('Mate Handling', () => {
    it('should display mate notation instead of score when mate is positive', () => {
      const evaluation = { ...defaultEvaluation, score: 1000, mate: 3 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('M3')).toBeInTheDocument();
      expect(screen.queryByText('10.0')).not.toBeInTheDocument();
    });

    it('should display mate notation for negative mate', () => {
      const evaluation = { ...defaultEvaluation, score: -1000, mate: -5 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('M5')).toBeInTheDocument(); // Math.abs(-5) = 5
      expect(screen.queryByText('-10.0')).not.toBeInTheDocument();
    });

    it('should display mate in 1', () => {
      const evaluation = { ...defaultEvaluation, score: 5000, mate: 1 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('M1')).toBeInTheDocument();
    });

    it('should display mate in 0 (immediate checkmate)', () => {
      const evaluation = { ...defaultEvaluation, score: 10000, mate: 0 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('M0')).toBeInTheDocument();
    });

    it('should show mate description when mate is provided', () => {
      const evaluation = { ...defaultEvaluation, mate: 4 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Mate in 4 moves')).toBeInTheDocument();
    });

    it('should show mate description for negative mate values', () => {
      const evaluation = { ...defaultEvaluation, mate: -2 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Mate in 2 moves')).toBeInTheDocument(); // Math.abs(-2) = 2
    });

    it('should not show mate description when mate is null', () => {
      render(<EngineEvaluationCard evaluation={defaultEvaluation} />);
      
      expect(screen.queryByText(/Mate in/)).not.toBeInTheDocument();
    });

    it('should not show mate description when mate is undefined', () => {
      const evaluation = { ...defaultEvaluation };
      delete (evaluation as any).mate;
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.queryByText(/Mate in/)).not.toBeInTheDocument();
    });

    it('should handle mate value of 0 correctly', () => {
      const evaluation = { ...defaultEvaluation, mate: 0 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('M0')).toBeInTheDocument();
      expect(screen.getByText('Mate in 0 moves')).toBeInTheDocument();
    });
  });

  describe('Score Color Coding', () => {
    it('should apply yellow color for small positive scores', () => {
      const evaluation = { ...defaultEvaluation, score: 30 }; // < 50
      const { container } = render(<EngineEvaluationCard evaluation={evaluation} />);
      
      const scoreElement = container.querySelector('.text-yellow-600');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveTextContent('0.3');
    });

    it('should apply yellow color for small negative scores', () => {
      const evaluation = { ...defaultEvaluation, score: -40 }; // > -50
      const { container } = render(<EngineEvaluationCard evaluation={evaluation} />);
      
      const scoreElement = container.querySelector('.text-yellow-600');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveTextContent('-0.4');
    });

    it('should apply green color for larger positive scores', () => {
      const evaluation = { ...defaultEvaluation, score: 100 }; // > 50
      const { container } = render(<EngineEvaluationCard evaluation={evaluation} />);
      
      const scoreElement = container.querySelector('.text-green-600');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveTextContent('1.0');
    });

    it('should apply red color for larger negative scores', () => {
      const evaluation = { ...defaultEvaluation, score: -75 }; // < -50
      const { container } = render(<EngineEvaluationCard evaluation={evaluation} />);
      
      const scoreElement = container.querySelector('.text-red-600');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveTextContent('-0.8');
    });

    it('should apply yellow color for exactly zero score', () => {
      const evaluation = { ...defaultEvaluation, score: 0 };
      const { container } = render(<EngineEvaluationCard evaluation={evaluation} />);
      
      const scoreElement = container.querySelector('.text-yellow-600');
      expect(scoreElement).toBeInTheDocument();
    });

    it('should apply yellow color for boundary values', () => {
      // Test score of exactly 49 (should be yellow as Math.abs(49) < 50)
      const evaluation1 = { ...defaultEvaluation, score: 49 };
      const { container: container1 } = render(<EngineEvaluationCard evaluation={evaluation1} />);
      expect(container1.querySelector('.text-yellow-600')).toBeInTheDocument();

      // Test score of exactly -49 (should be yellow as Math.abs(-49) < 50)
      const evaluation2 = { ...defaultEvaluation, score: -49 };
      const { container: container2 } = render(<EngineEvaluationCard evaluation={evaluation2} />);
      expect(container2.querySelector('.text-yellow-600')).toBeInTheDocument();
    });

    it('should apply green color for mate positions (positive mate)', () => {
      const evaluation = { ...defaultEvaluation, score: 1000, mate: 3 };
      const { container } = render(<EngineEvaluationCard evaluation={evaluation} />);
      
      // Mate positions use score for color determination
      const scoreElement = container.querySelector('.text-green-600');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveTextContent('M3');
    });

    it('should apply red color for mate positions (negative mate)', () => {
      const evaluation = { ...defaultEvaluation, score: -1000, mate: -2 };
      const { container } = render(<EngineEvaluationCard evaluation={evaluation} />);
      
      const scoreElement = container.querySelector('.text-red-600');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveTextContent('M2');
    });
  });

  describe('Typography and Styling', () => {
    it('should apply correct typography classes to score', () => {
      const { container } = render(<EngineEvaluationCard evaluation={defaultEvaluation} />);
      
      const scoreElement = container.querySelector('.text-lg.font-mono.font-bold');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveTextContent('0.5');
    });

    it('should apply correct styling to evaluation text', () => {
      render(<EngineEvaluationCard evaluation={defaultEvaluation} />);
      
      const evaluationText = screen.getByText('Slightly favorable for White');
      expect(evaluationText).toHaveClass('text-sm', 'text-gray-600', 'dark:text-gray-400', 'mt-1');
    });

    it('should apply correct styling to mate description', () => {
      const evaluation = { ...defaultEvaluation, mate: 3 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      const mateText = screen.getByText('Mate in 3 moves');
      expect(mateText).toHaveClass('text-xs', 'text-gray-500', 'dark:text-gray-400', 'mt-1');
    });
  });

  describe('Default Props', () => {
    it('should default isLoading to false when not provided', () => {
      render(<EngineEvaluationCard evaluation={defaultEvaluation} />);
      
      // Should not show loading state
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      expect(screen.getByText('0.5')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long evaluation text', () => {
      const evaluation = {
        ...defaultEvaluation,
        evaluation: 'This is a very long evaluation text that should wrap properly in the card layout and maintain readability across different screen sizes'
      };
      
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText(evaluation.evaluation)).toBeInTheDocument();
    });

    it('should handle empty evaluation text', () => {
      const evaluation = { ...defaultEvaluation, evaluation: '' };
      const { container } = render(<EngineEvaluationCard evaluation={evaluation} />);
      
      // Check that the evaluation div is present but empty
      const evaluationDiv = container.querySelector('.text-sm.text-gray-600');
      expect(evaluationDiv).toBeInTheDocument();
      expect(evaluationDiv).toHaveTextContent('');
    });

    it('should handle special characters in evaluation text', () => {
      const evaluation = { 
        ...defaultEvaluation, 
        evaluation: 'Position with ♔♕♖♗♘♙ symbols and éñçódìñg'
      };
      
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText(evaluation.evaluation)).toBeInTheDocument();
    });

    it('should handle evaluation with HTML-like content safely', () => {
      const evaluation = { 
        ...defaultEvaluation, 
        evaluation: '<script>alert("test")</script>Safe evaluation text'
      };
      
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      // Should render as text, not execute
      expect(screen.getByText(evaluation.evaluation)).toBeInTheDocument();
      expect(document.querySelector('script')).not.toBeInTheDocument();
    });

    it('should handle extremely large mate values', () => {
      const evaluation = { ...defaultEvaluation, mate: 999 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('M999')).toBeInTheDocument();
      expect(screen.getByText('Mate in 999 moves')).toBeInTheDocument();
    });

    it('should handle float score values correctly', () => {
      const evaluation = { ...defaultEvaluation, score: 33.7 };
      render(<EngineEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('0.3')).toBeInTheDocument(); // 33.7 / 100 = 0.337, rounded to 0.3
    });
  });

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      const { container } = render(<EngineEvaluationCard evaluation={defaultEvaluation} />);
      
      // Should have proper heading structure
      const heading = screen.getByText('Engine (Stockfish)');
      expect(heading.tagName).toBe('H3');
    });

    it('should maintain proper reading order', () => {
      render(<EngineEvaluationCard evaluation={{ ...defaultEvaluation, mate: 2 }} />);
      
      const elements = [
        screen.getByText('Engine (Stockfish)'),
        screen.getByText('UCI Protocol'),
        screen.getByText('M2'),
        screen.getByText(defaultEvaluation.evaluation),
        screen.getByText('Mate in 2 moves')
      ];
      
      elements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    it('should maintain consistent card structure between loading and loaded states', () => {
      const { rerender, container } = render(
        <EngineEvaluationCard evaluation={defaultEvaluation} isLoading={true} />
      );
      
      const loadingCard = container.firstChild as HTMLElement;
      const loadingClasses = Array.from(loadingCard.classList);
      
      rerender(<EngineEvaluationCard evaluation={defaultEvaluation} isLoading={false} />);
      
      const loadedCard = container.firstChild as HTMLElement;
      const loadedClasses = Array.from(loadedCard.classList);
      
      // Main container classes should be the same
      const containerClasses = ['bg-white', 'dark:bg-gray-800', 'rounded-lg', 'p-4', 'border'];
      containerClasses.forEach(className => {
        expect(loadingClasses).toContain(className);
        expect(loadedClasses).toContain(className);
      });
    });
  });
});