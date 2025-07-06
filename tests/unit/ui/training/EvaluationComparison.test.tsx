/**
 * Comprehensive test suite for EvaluationComparison component
 * Tests agreement/disagreement logic, confidence levels, and edge cases
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EvaluationComparison } from '../../../../shared/components/training/DualEvaluationPanel/EvaluationComparison';
import { DualEvaluation } from '@shared/lib/chess/ScenarioEngine';

describe('EvaluationComparison', () => {
  const baseEvaluation: DualEvaluation = {
    engine: {
      score: 300,
      mate: null,
      evaluation: 'White is better'
    },
    tablebase: {
      isAvailable: true,
      result: {
        wdl: 1,
        dtz: 25,
        category: 'win',
        precise: true
      },
      evaluation: 'White wins with perfect play'
    }
  };

  describe('Component Structure and Styling', () => {
    it('should render with correct container styling', () => {
      const { container } = render(<EvaluationComparison evaluation={baseEvaluation} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass(
        'bg-blue-50',
        'dark:bg-blue-900/20',
        'rounded-lg',
        'p-4',
        'border',
        'border-blue-200',
        'dark:border-blue-800'
      );
    });

    it('should render header with correct structure', () => {
      render(<EvaluationComparison evaluation={baseEvaluation} />);
      
      const title = screen.getByText('Analysis Comparison');
      expect(title).toHaveClass('text-sm', 'font-medium', 'text-blue-800', 'dark:text-blue-300');
      
      expect(screen.getByText('Engine and tablebase agree')).toBeInTheDocument();
    });

    it('should render confidence section', () => {
      render(<EvaluationComparison evaluation={baseEvaluation} />);
      
      expect(screen.getByText('Confidence:')).toBeInTheDocument();
      expect(screen.getByText('High confidence (both sources agree)')).toBeInTheDocument();
    });
  });

  describe('Agreement Detection - Win Scenarios', () => {
    it('should detect agreement when both sources indicate win', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 300, mate: null, evaluation: 'Winning' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'win' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
      expect(screen.getByText('High confidence (both sources agree)')).toBeInTheDocument();
    });

    it('should detect agreement with engine mate and tablebase win', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 1000, mate: 3, evaluation: 'Mate in 3' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'win' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
    });

    it('should detect agreement with engine high score and tablebase cursed-win', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 500, mate: null, evaluation: 'Clearly winning' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'cursed-win' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
    });
  });

  describe('Agreement Detection - Loss Scenarios', () => {
    it('should detect agreement when both sources indicate loss', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: -400, mate: null, evaluation: 'Losing' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'loss' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
      expect(screen.getByText('High confidence (both sources agree)')).toBeInTheDocument();
    });

    it('should detect agreement with engine negative mate and tablebase loss', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: -1000, mate: -2, evaluation: 'Mate in 2' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'loss' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
    });

    it('should detect agreement with engine low score and tablebase blessed-loss', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: -300, mate: null, evaluation: 'Losing position' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'blessed-loss' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
    });
  });

  describe('Agreement Detection - Draw Scenarios', () => {
    it('should detect agreement when both sources indicate draw', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 50, mate: null, evaluation: 'Equal position' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'draw' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
      expect(screen.getByText('High confidence (both sources agree)')).toBeInTheDocument();
    });

    it('should detect agreement with engine score 0 and tablebase draw', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 0, mate: null, evaluation: 'Balanced' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'draw' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
    });

    it('should detect agreement with engine small negative score and tablebase draw', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: -100, mate: null, evaluation: 'Slightly worse' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'draw' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
    });
  });

  describe('Disagreement Detection', () => {
    it('should detect disagreement when engine shows win but tablebase shows loss', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 300, mate: null, evaluation: 'Winning' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'loss' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase disagree')).toHaveClass('text-red-600');
      expect(screen.getByText('Theoretical result differs from engine assessment')).toBeInTheDocument();
    });

    it('should detect disagreement when engine shows loss but tablebase shows win', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: -400, mate: null, evaluation: 'Losing' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'win' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase disagree')).toHaveClass('text-red-600');
      expect(screen.getByText('Theoretical result differs from engine assessment')).toBeInTheDocument();
    });

    it('should detect disagreement when engine shows draw but tablebase shows win', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 50, mate: null, evaluation: 'Equal' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'win' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase disagree')).toHaveClass('text-red-600');
    });

    it('should show disagreement warning when engines disagree', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 100, mate: null, evaluation: 'Better' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'loss' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('⚠️ Engine evaluation may not reflect perfect play. Tablebase shows theoretical result.')).toBeInTheDocument();
      
      const warningDiv = screen.getByText('⚠️ Engine evaluation may not reflect perfect play. Tablebase shows theoretical result.');
      expect(warningDiv).toHaveClass(
        'mt-3',
        'p-2',
        'bg-yellow-50',
        'dark:bg-yellow-900/20',
        'rounded',
        'text-xs',
        'text-yellow-800',
        'dark:text-yellow-300'
      );
    });
  });

  describe('No Tablebase Available', () => {
    it('should handle no tablebase data', () => {
      const evaluation = {
        ...baseEvaluation,
        tablebase: {
          isAvailable: false,
          result: { wdl: 0, category: 'draw' as const, precise: false },
          evaluation: 'Not available'
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('No tablebase data available')).toHaveClass('text-gray-500');
      expect(screen.getByText('Engine evaluation only')).toBeInTheDocument();
    });

    it('should handle undefined tablebase', () => {
      const evaluation = {
        ...baseEvaluation,
        tablebase: undefined
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('No tablebase data available')).toHaveClass('text-gray-500');
      expect(screen.getByText('Engine evaluation only')).toBeInTheDocument();
    });

    it('should not show theory/practice sections when no tablebase', () => {
      const evaluation = {
        ...baseEvaluation,
        tablebase: { isAvailable: false, result: { wdl: 0, category: 'draw' as const, precise: false }, evaluation: '' }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.queryByText('Theory:')).not.toBeInTheDocument();
      expect(screen.queryByText('Practice:')).not.toBeInTheDocument();
    });

    it('should not show disagreement warning when no tablebase', () => {
      const evaluation = {
        ...baseEvaluation,
        tablebase: { isAvailable: false, result: { wdl: 0, category: 'draw' as const, precise: false }, evaluation: '' }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
    });
  });

  describe('Theory vs Practice Display', () => {
    it('should display theory and practice sections when tablebase is available', () => {
      render(<EvaluationComparison evaluation={baseEvaluation} />);
      
      expect(screen.getByText('Theory:')).toBeInTheDocument();
      expect(screen.getByText('Practice:')).toBeInTheDocument();
      expect(screen.getByText('WIN')).toBeInTheDocument(); // tablebase category uppercase
      expect(screen.getByText('WINNING')).toBeInTheDocument(); // engine assessment
    });

    it('should display WINNING for high positive engine scores', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 250, mate: null, evaluation: 'Good position' }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('WINNING')).toBeInTheDocument();
    });

    it('should display LOSING for low negative engine scores', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: -300, mate: null, evaluation: 'Bad position' }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('LOSING')).toBeInTheDocument();
    });

    it('should display EQUAL for neutral engine scores', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 50, mate: null, evaluation: 'Balanced position' }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('EQUAL')).toBeInTheDocument();
    });

    it('should display theory categories in uppercase', () => {
      const testCases = [
        { category: 'win' as const, expected: 'WIN' },
        { category: 'loss' as const, expected: 'LOSS' },
        { category: 'draw' as const, expected: 'DRAW' },
        { category: 'cursed-win' as const, expected: 'CURSED-WIN' },
        { category: 'blessed-loss' as const, expected: 'BLESSED-LOSS' }
      ];
      
      testCases.forEach(({ category, expected }) => {
        const evaluation = {
          ...baseEvaluation,
          tablebase: {
            ...baseEvaluation.tablebase!,
            result: { ...baseEvaluation.tablebase!.result, category }
          }
        };
        
        const { rerender } = render(<EvaluationComparison evaluation={evaluation} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        
        rerender(<div />); // Clear for next test
      });
    });

    it('should handle undefined tablebase category', () => {
      const evaluation = {
        ...baseEvaluation,
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: undefined as any }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Boundary Values', () => {
    it('should handle engine score exactly at 200 threshold', () => {
      const evaluation1 = {
        ...baseEvaluation,
        engine: { score: 200, mate: null, evaluation: 'Good' }
      };
      
      render(<EvaluationComparison evaluation={evaluation1} />);
      expect(screen.getByText('EQUAL')).toBeInTheDocument(); // 200 is not > 200
      
      const evaluation2 = {
        ...baseEvaluation,
        engine: { score: 201, mate: null, evaluation: 'Better' }
      };
      
      const { rerender } = render(<EvaluationComparison evaluation={evaluation2} />);
      expect(screen.getByText('WINNING')).toBeInTheDocument(); // 201 is > 200
    });

    it('should handle engine score exactly at -200 threshold', () => {
      const evaluation1 = {
        ...baseEvaluation,
        engine: { score: -200, mate: null, evaluation: 'Worse' }
      };
      
      render(<EvaluationComparison evaluation={evaluation1} />);
      expect(screen.getByText('EQUAL')).toBeInTheDocument(); // -200 is not < -200
      
      const evaluation2 = {
        ...baseEvaluation,
        engine: { score: -201, mate: null, evaluation: 'Much worse' }
      };
      
      const { rerender } = render(<EvaluationComparison evaluation={evaluation2} />);
      expect(screen.getByText('LOSING')).toBeInTheDocument(); // -201 is < -200
    });

    it('should handle zero mate values', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 1000, mate: 0, evaluation: 'Immediate mate' }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('WINNING')).toBeInTheDocument();
    });

    it('should handle very large engine scores', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 9999, mate: null, evaluation: 'Overwhelming' }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('WINNING')).toBeInTheDocument();
    });

    it('should handle very large negative engine scores', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: -9999, mate: null, evaluation: 'Hopeless' }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('LOSING')).toBeInTheDocument();
    });
  });

  describe('Mate Handling in Agreement Logic', () => {
    it('should consider positive mate as winning regardless of score', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: -100, mate: 5, evaluation: 'Mate in 5' }, // Negative score but positive mate
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'win' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
    });

    it('should consider negative mate as losing regardless of score', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 500, mate: -3, evaluation: 'Getting mated' }, // Positive score but negative mate
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'loss' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase agree')).toHaveClass('text-green-600');
    });

    it('should prioritize mate over score in disagreement detection', () => {
      const evaluation = {
        ...baseEvaluation,
        engine: { score: 50, mate: 2, evaluation: 'Mate in 2' }, // Small score but mate
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'draw' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={evaluation} />);
      
      expect(screen.getByText('Engine and tablebase disagree')).toHaveClass('text-red-600');
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct spacing and typography classes', () => {
      const { container } = render(<EvaluationComparison evaluation={baseEvaluation} />);
      
      const spaceContainer = container.querySelector('.space-y-2.text-sm');
      expect(spaceContainer).toBeInTheDocument();
      
      const flexElements = container.querySelectorAll('.flex.justify-between');
      expect(flexElements.length).toBeGreaterThan(0);
    });

    it('should apply correct styling to confidence text', () => {
      render(<EvaluationComparison evaluation={baseEvaluation} />);
      
      const confidenceLabel = screen.getByText('Confidence:');
      expect(confidenceLabel).toHaveClass('text-gray-600', 'dark:text-gray-400');
      
      const confidenceValue = screen.getByText('High confidence (both sources agree)');
      expect(confidenceValue).toHaveClass('text-gray-800', 'dark:text-gray-200');
    });

    it('should apply correct styling to theory/practice labels and values', () => {
      render(<EvaluationComparison evaluation={baseEvaluation} />);
      
      const theoryLabel = screen.getByText('Theory:');
      expect(theoryLabel).toHaveClass('text-gray-600', 'dark:text-gray-400');
      
      const theoryValue = screen.getByText('WIN');
      expect(theoryValue).toHaveClass('font-medium', 'text-gray-800', 'dark:text-gray-200');
      
      const practiceLabel = screen.getByText('Practice:');
      expect(practiceLabel).toHaveClass('text-gray-600', 'dark:text-gray-400');
      
      const practiceValue = screen.getByText('WINNING');
      expect(practiceValue).toHaveClass('font-medium', 'text-gray-800', 'dark:text-gray-200');
    });
  });

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      render(<EvaluationComparison evaluation={baseEvaluation} />);
      
      const heading = screen.getByText('Analysis Comparison');
      expect(heading.tagName).toBe('H3');
    });

    it('should maintain proper reading order for screen readers', () => {
      render(<EvaluationComparison evaluation={baseEvaluation} />);
      
      const elements = [
        screen.getByText('Analysis Comparison'),
        screen.getByText('Engine and tablebase agree'),
        screen.getByText('Confidence:'),
        screen.getByText('High confidence (both sources agree)'),
        screen.getByText('Theory:'),
        screen.getByText('WIN'),
        screen.getByText('Practice:'),
        screen.getByText('WINNING')
      ];
      
      elements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });

    it('should provide clear status indicators', () => {
      // Test agreement status
      const { unmount } = render(<EvaluationComparison evaluation={baseEvaluation} />);
      expect(screen.getByText('Engine and tablebase agree')).toBeInTheDocument();
      
      unmount();
      
      // Test disagreement status
      const disagreementEvaluation = {
        ...baseEvaluation,
        engine: { score: 300, mate: null, evaluation: 'Winning' },
        tablebase: {
          ...baseEvaluation.tablebase!,
          result: { ...baseEvaluation.tablebase!.result, category: 'loss' as const }
        }
      };
      
      render(<EvaluationComparison evaluation={disagreementEvaluation} />);
      expect(screen.getByText('Engine and tablebase disagree')).toBeInTheDocument();
    });
  });
});