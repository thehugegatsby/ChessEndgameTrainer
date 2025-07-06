/**
 * Comprehensive test suite for TablebaseEvaluationCard component
 * Tests rendering with different tablebase states, loading states, and edge cases
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TablebaseEvaluationCard } from '../../../../shared/components/training/DualEvaluationPanel/TablebaseEvaluationCard';
import { DualEvaluation } from '@shared/lib/chess/ScenarioEngine';

describe('TablebaseEvaluationCard', () => {
  const defaultTablebaseEvaluation: DualEvaluation['tablebase'] = {
    isAvailable: true,
    result: {
      wdl: 1,
      dtz: 15,
      category: 'win',
      precise: true
    },
    evaluation: 'White wins with perfect play'
  };

  describe('Loading State', () => {
    it('should render loading state with spinner', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} isLoading={true} />);
      
      expect(screen.getByText('Tablebase (Syzygy)')).toBeInTheDocument();
      
      // Check for loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full', 'h-4', 'w-4', 'border-b-2', 'border-purple-600');
      
      // Check for loading placeholder
      const placeholder = document.querySelector('.animate-pulse');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass('h-6', 'bg-gray-200', 'dark:bg-gray-700', 'rounded');
    });

    it('should apply correct loading container styling', () => {
      const { container } = render(
        <TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} isLoading={true} />
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
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} isLoading={true} />);
      
      const header = screen.getByText('Tablebase (Syzygy)');
      expect(header).toHaveClass('text-sm', 'font-medium', 'text-gray-700', 'dark:text-gray-300');
    });
  });

  describe('Tablebase Not Available', () => {
    it('should render not available state when tablebase is not available', () => {
      const unavailableEvaluation = {
        ...defaultTablebaseEvaluation,
        isAvailable: false
      };
      
      render(<TablebaseEvaluationCard evaluation={unavailableEvaluation} isLoading={false} />);
      
      expect(screen.getByText('Tablebase (Syzygy)')).toBeInTheDocument();
      expect(screen.getByText('Not Available')).toBeInTheDocument();
      expect(screen.getByText('Position not in tablebase (>7 pieces)')).toBeInTheDocument();
    });

    it('should render not available state when evaluation is undefined', () => {
      render(<TablebaseEvaluationCard evaluation={undefined} isLoading={false} />);
      
      expect(screen.getByText('Tablebase (Syzygy)')).toBeInTheDocument();
      expect(screen.getByText('Not Available')).toBeInTheDocument();
      expect(screen.getByText('Position not in tablebase (>7 pieces)')).toBeInTheDocument();
    });

    it('should apply correct not available container styling', () => {
      const { container } = render(
        <TablebaseEvaluationCard evaluation={undefined} isLoading={false} />
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass(
        'bg-gray-50',
        'dark:bg-gray-900',
        'rounded-lg',
        'p-4',
        'border',
        'border-gray-200',
        'dark:border-gray-700'
      );
    });

    it('should render correctly when evaluation exists but isAvailable is false', () => {
      const evaluation = {
        isAvailable: false,
        result: {
          wdl: 0,
          category: 'draw' as const,
          precise: false
        },
        evaluation: 'Position not available'
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} isLoading={false} />);
      
      expect(screen.getByText('Not Available')).toBeInTheDocument();
      expect(screen.getByText('Position not in tablebase (>7 pieces)')).toBeInTheDocument();
    });
  });

  describe('Tablebase Available - Normal Rendering', () => {
    it('should render card with tablebase data when available', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} isLoading={false} />);
      
      expect(screen.getByText('Tablebase (Syzygy)')).toBeInTheDocument();
      expect(screen.getByText('Perfect Knowledge')).toBeInTheDocument();
      expect(screen.getByText('Win')).toBeInTheDocument();
      expect(screen.getByText('White wins with perfect play')).toBeInTheDocument();
      expect(screen.getByText('WDL: 1')).toBeInTheDocument();
      expect(screen.getByText('DTZ: 15')).toBeInTheDocument();
    });

    it('should apply correct available container styling', () => {
      const { container } = render(
        <TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} isLoading={false} />
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
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} isLoading={false} />);
      
      const title = screen.getByText('Tablebase (Syzygy)');
      expect(title).toHaveClass('text-sm', 'font-medium', 'text-gray-700', 'dark:text-gray-300');
      
      const knowledge = screen.getByText('Perfect Knowledge');
      expect(knowledge).toHaveClass('text-xs', 'text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('Category Formatting and Colors', () => {
    it('should format and color win category correctly', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, category: 'win' as const }
      };
      
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Win')).toBeInTheDocument();
      const categoryElement = container.querySelector('.text-green-600');
      expect(categoryElement).toBeInTheDocument();
      expect(categoryElement).toHaveTextContent('Win');
    });

    it('should format and color loss category correctly', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, category: 'loss' as const }
      };
      
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Loss')).toBeInTheDocument();
      const categoryElement = container.querySelector('.text-red-600');
      expect(categoryElement).toBeInTheDocument();
      expect(categoryElement).toHaveTextContent('Loss');
    });

    it('should format and color draw category correctly', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, category: 'draw' as const }
      };
      
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Draw')).toBeInTheDocument();
      const categoryElement = container.querySelector('.text-gray-600');
      expect(categoryElement).toBeInTheDocument();
      expect(categoryElement).toHaveTextContent('Draw');
    });

    it('should format and color cursed-win category correctly', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, category: 'cursed-win' as const }
      };
      
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Cursed Win')).toBeInTheDocument();
      const categoryElement = container.querySelector('.text-yellow-600');
      expect(categoryElement).toBeInTheDocument();
      expect(categoryElement).toHaveTextContent('Cursed Win');
    });

    it('should format and color blessed-loss category correctly', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, category: 'blessed-loss' as const }
      };
      
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Blessed Loss')).toBeInTheDocument();
      const categoryElement = container.querySelector('.text-orange-600');
      expect(categoryElement).toBeInTheDocument();
      expect(categoryElement).toHaveTextContent('Blessed Loss');
    });

    it('should handle unknown category', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, category: 'unknown' as any }
      };
      
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
      const categoryElement = container.querySelector('.text-lg.font-mono.font-bold');
      expect(categoryElement).toBeInTheDocument();
      expect(categoryElement).toHaveTextContent('Unknown');
    });

    it('should handle undefined category', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, category: undefined as any }
      };
      
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
      const categoryElement = container.querySelector('.text-gray-500');
      expect(categoryElement).toBeInTheDocument();
    });
  });

  describe('WDL and DTZ Display', () => {
    it('should display WDL when provided', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      expect(screen.getByText('WDL: 1')).toBeInTheDocument();
    });

    it('should display DTZ when provided', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      expect(screen.getByText('DTZ: 15')).toBeInTheDocument();
    });

    it('should display both WDL and DTZ when both provided', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      expect(screen.getByText('WDL: 1')).toBeInTheDocument();
      expect(screen.getByText('DTZ: 15')).toBeInTheDocument();
    });

    it('should display only WDL when DTZ is undefined', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, dtz: undefined }
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('WDL: 1')).toBeInTheDocument();
      expect(screen.queryByText(/DTZ:/)).not.toBeInTheDocument();
    });

    it('should display only DTZ when WDL is undefined', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, wdl: undefined as any }
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.queryByText(/WDL:/)).not.toBeInTheDocument();
      expect(screen.getByText('DTZ: 15')).toBeInTheDocument();
    });

    it('should display WDL with zero value', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, wdl: 0 }
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('WDL: 0')).toBeInTheDocument();
    });

    it('should display DTZ with zero value', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, dtz: 0 }
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('DTZ: 0')).toBeInTheDocument();
    });

    it('should display negative WDL values', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, wdl: -1 }
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('WDL: -1')).toBeInTheDocument();
    });

    it('should display negative DTZ values', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, dtz: -50 }
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('DTZ: -50')).toBeInTheDocument();
    });

    it('should apply correct styling to WDL/DTZ display', () => {
      const { container } = render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      const flexContainer = container.querySelector('.flex.gap-4.mt-2.text-xs');
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toHaveClass('text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('Evaluation Text Display', () => {
    it('should display evaluation text when provided', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      expect(screen.getByText('White wins with perfect play')).toBeInTheDocument();
    });

    it('should not display evaluation text when not provided', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        evaluation: undefined as any
      };
      
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      // Should not render the evaluation text div
      const evaluationDiv = container.querySelector('.text-sm.text-gray-600.dark\\:text-gray-400.mt-1');
      expect(evaluationDiv).not.toBeInTheDocument();
    });

    it('should display empty evaluation text', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        evaluation: ''
      };
      
      // Should not render evaluation text div when empty
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      const evaluationDiv = container.querySelector('.text-sm.text-gray-600');
      expect(evaluationDiv).not.toBeInTheDocument();
    });

    it('should apply correct styling to evaluation text', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      const evaluationText = screen.getByText('White wins with perfect play');
      expect(evaluationText).toHaveClass('text-sm', 'text-gray-600', 'dark:text-gray-400', 'mt-1');
    });
  });

  describe('Typography and Styling', () => {
    it('should apply correct typography classes to category', () => {
      const { container } = render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      const categoryElement = container.querySelector('.text-lg.font-mono.font-bold');
      expect(categoryElement).toBeInTheDocument();
      expect(categoryElement).toHaveTextContent('Win');
    });

    it('should apply correct styling to header elements', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      const title = screen.getByText('Tablebase (Syzygy)');
      expect(title).toHaveClass('text-sm', 'font-medium', 'text-gray-700', 'dark:text-gray-300');
      
      const knowledge = screen.getByText('Perfect Knowledge');
      expect(knowledge).toHaveClass('text-xs', 'text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('Default Props', () => {
    it('should default isLoading to false when not provided', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      // Should not show loading state
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      expect(screen.getByText('Win')).toBeInTheDocument();
    });

    it('should handle undefined evaluation prop gracefully', () => {
      render(<TablebaseEvaluationCard />);
      
      expect(screen.getByText('Tablebase (Syzygy)')).toBeInTheDocument();
      expect(screen.getByText('Not Available')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long evaluation text', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        evaluation: 'This is a very long evaluation text that should wrap properly in the card layout and maintain readability across different screen sizes with perfect endgame knowledge'
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText(evaluation.evaluation)).toBeInTheDocument();
    });

    it('should handle special characters in evaluation text', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        evaluation: 'Position with ♔♕♖♗♘♙ symbols and éñçódìñg characters'
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText(evaluation.evaluation)).toBeInTheDocument();
    });

    it('should handle evaluation with HTML-like content safely', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        evaluation: '<script>alert("test")</script>Safe tablebase evaluation'
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      // Should render as text, not execute
      expect(screen.getByText(evaluation.evaluation)).toBeInTheDocument();
      expect(document.querySelector('script')).not.toBeInTheDocument();
    });

    it('should handle extremely large WDL values', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, wdl: 999999 }
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('WDL: 999999')).toBeInTheDocument();
    });

    it('should handle extremely large DTZ values', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: { ...defaultTablebaseEvaluation.result, dtz: 999999 }
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('DTZ: 999999')).toBeInTheDocument();
    });

    it('should handle result without category', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: {
          wdl: 1,
          dtz: 15,
          precise: true
        } as any
      };
      
      render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should handle missing result object', () => {
      const evaluation = {
        ...defaultTablebaseEvaluation,
        result: undefined as any
      };
      
      const { container } = render(<TablebaseEvaluationCard evaluation={evaluation} />);
      
      // Should show Unknown category
      const categoryElement = container.querySelector('.text-lg.font-mono.font-bold');
      expect(categoryElement).toHaveTextContent('Unknown');
    });
  });

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      // Should have proper heading structure
      const heading = screen.getByText('Tablebase (Syzygy)');
      expect(heading.tagName).toBe('H3');
    });

    it('should maintain proper reading order', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      const elements = [
        screen.getByText('Tablebase (Syzygy)'),
        screen.getByText('Perfect Knowledge'),
        screen.getByText('Win'),
        screen.getByText('White wins with perfect play'),
        screen.getByText('WDL: 1'),
        screen.getByText('DTZ: 15')
      ];
      
      elements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });

    it('should handle screen reader content appropriately', () => {
      render(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} />);
      
      // Important information should be accessible
      expect(screen.getByText('Win')).toBeInTheDocument();
      expect(screen.getByText('WDL: 1')).toBeInTheDocument();
      expect(screen.getByText('DTZ: 15')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should maintain consistent card structure across different states', () => {
      const { rerender, container } = render(
        <TablebaseEvaluationCard evaluation={undefined} isLoading={true} />
      );
      
      const loadingCard = container.firstChild as HTMLElement;
      const loadingClasses = Array.from(loadingCard.classList);
      
      rerender(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} isLoading={false} />);
      
      const loadedCard = container.firstChild as HTMLElement;
      const loadedClasses = Array.from(loadedCard.classList);
      
      // Container classes should include basic card styling
      const containerClasses = ['rounded-lg', 'p-4', 'border'];
      containerClasses.forEach(className => {
        expect(loadingClasses).toContain(className);
        expect(loadedClasses).toContain(className);
      });
    });

    it('should maintain header structure across all states', () => {
      // Test loading state
      const { rerender } = render(
        <TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} isLoading={true} />
      );
      expect(screen.getByText('Tablebase (Syzygy)')).toBeInTheDocument();
      
      // Test not available state
      rerender(<TablebaseEvaluationCard evaluation={undefined} isLoading={false} />);
      expect(screen.getByText('Tablebase (Syzygy)')).toBeInTheDocument();
      
      // Test available state
      rerender(<TablebaseEvaluationCard evaluation={defaultTablebaseEvaluation} isLoading={false} />);
      expect(screen.getByText('Tablebase (Syzygy)')).toBeInTheDocument();
    });
  });
});