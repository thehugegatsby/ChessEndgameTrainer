/**
 * Comprehensive test suite for DualEvaluationPanel main component
 * Targets >80% code coverage by testing all rendering paths, user interactions, and edge cases
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock child components before importing the main component
jest.mock('../../../../shared/components/training/DualEvaluationPanel/EngineEvaluationCard', () => ({
  EngineEvaluationCard: ({ evaluation, isLoading }: any) => (
    <div data-testid="engine-evaluation-card">
      <span data-testid="engine-loading">{isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="engine-score">{evaluation.score}</span>
      <span data-testid="engine-evaluation">{evaluation.evaluation}</span>
      {(evaluation.mate !== null && evaluation.mate !== undefined) && <span data-testid="engine-mate">{evaluation.mate}</span>}
    </div>
  )
}));

jest.mock('../../../../shared/components/training/DualEvaluationPanel/TablebaseEvaluationCard', () => ({
  TablebaseEvaluationCard: ({ evaluation, isLoading }: any) => (
    <div data-testid="tablebase-evaluation-card">
      <span data-testid="tablebase-loading">{isLoading ? 'loading' : 'loaded'}</span>
      {evaluation && (
        <>
          <span data-testid="tablebase-available">{evaluation.isAvailable ? 'available' : 'unavailable'}</span>
          {evaluation.result && <span data-testid="tablebase-category">{evaluation.result.category}</span>}
        </>
      )}
    </div>
  )
}));

jest.mock('../../../../shared/components/training/DualEvaluationPanel/EvaluationComparison', () => ({
  EvaluationComparison: ({ evaluation }: any) => (
    <div data-testid="evaluation-comparison">
      <span data-testid="comparison-data">{JSON.stringify(evaluation)}</span>
    </div>
  )
}));

// Mock the useEngine hook
const mockEngine = {
  updatePosition: jest.fn(),
  getDualEvaluation: jest.fn(),
  quit: jest.fn()
};

jest.mock('../../../../shared/hooks', () => ({
  useEngine: jest.fn()
}));

// Mock EngineErrorBoundary
jest.mock('../../../../shared/components/ui', () => ({
  EngineErrorBoundary: ({ children, engineId }: any) => (
    <div data-testid="engine-error-boundary" data-engine-id={engineId}>
      {children}
    </div>
  )
}));

// Import components after mocking
import { DualEvaluationPanel } from '../../../../shared/components/training/DualEvaluationPanel';
import { DualEvaluation } from '../../../../shared/lib/chess/ScenarioEngine';

const mockUseEngine = require('../../../../shared/hooks').useEngine as jest.MockedFunction<any>;

describe('DualEvaluationPanel', () => {
  const defaultProps = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    isVisible: true
  };

  const mockDualEvaluation: DualEvaluation = {
    engine: {
      score: 50,
      mate: null,
      evaluation: 'Slightly favorable for White'
    },
    tablebase: {
      isAvailable: true,
      result: {
        wdl: 1,
        dtz: 15,
        category: 'win',
        precise: true
      },
      evaluation: 'White wins with perfect play'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock setup
    mockUseEngine.mockReturnValue({
      engine: mockEngine,
      isLoading: false,
      error: null
    });
    
    mockEngine.getDualEvaluation.mockResolvedValue(mockDualEvaluation);
  });

  describe('Visibility Control', () => {
    it('should render nothing when isVisible is false', () => {
      const { container } = render(
        <DualEvaluationPanel {...defaultProps} isVisible={false} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should render content when isVisible is true', () => {
      render(<DualEvaluationPanel {...defaultProps} />);
      
      expect(screen.getByTestId('engine-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('engine-evaluation-card')).toBeInTheDocument();
      expect(screen.getByTestId('tablebase-evaluation-card')).toBeInTheDocument();
    });
  });

  describe('Engine Loading States', () => {
    it('should show loading state when engine is loading', () => {
      mockUseEngine.mockReturnValue({
        engine: mockEngine,
        isLoading: true,
        error: null
      });

      render(<DualEvaluationPanel {...defaultProps} />);
      
      expect(screen.getByTestId('engine-loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('tablebase-loading')).toHaveTextContent('loading');
    });

    it('should show loading state during evaluation', async () => {
      // Mock a delayed evaluation
      mockEngine.getDualEvaluation.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockDualEvaluation), 100))
      );

      render(<DualEvaluationPanel {...defaultProps} />);
      
      // Should show loading immediately
      expect(screen.getByTestId('engine-loading')).toHaveTextContent('loading');
    });

    it('should hide loading state after evaluation completes', async () => {
      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('engine-loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('tablebase-loading')).toHaveTextContent('loaded');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display engine error when engine hook returns error', () => {
      mockUseEngine.mockReturnValue({
        engine: null,
        isLoading: false,
        error: 'Engine failed to initialize'
      });

      render(<DualEvaluationPanel {...defaultProps} />);
      
      expect(screen.getByText('Engine Error: Engine failed to initialize')).toBeInTheDocument();
      expect(screen.queryByTestId('engine-evaluation-card')).not.toBeInTheDocument();
    });

    it('should display evaluation error when getDualEvaluation fails', async () => {
      mockEngine.getDualEvaluation.mockRejectedValue(new Error('Evaluation timeout'));

      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Evaluation Error: Evaluation timeout')).toBeInTheDocument();
      });
    });

    it('should handle non-Error evaluation failures', async () => {
      mockEngine.getDualEvaluation.mockRejectedValue('String error');

      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Evaluation Error: Evaluation failed')).toBeInTheDocument();
      });
    });

    it('should not update state if component unmounts during evaluation', async () => {
      let resolveEvaluation: (value: any) => void;
      const evaluationPromise = new Promise(resolve => {
        resolveEvaluation = resolve;
      });
      
      mockEngine.getDualEvaluation.mockReturnValue(evaluationPromise);

      const { unmount } = render(<DualEvaluationPanel {...defaultProps} />);
      
      // Unmount before evaluation completes
      unmount();
      
      // Complete evaluation after unmount - should not cause errors
      act(() => {
        resolveEvaluation!(mockDualEvaluation);
      });
      
      // No assertions needed - test passes if no errors thrown
    });
  });

  describe('FEN Position Updates', () => {
    it('should trigger evaluation when FEN changes', async () => {
      const { rerender } = render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockEngine.updatePosition).toHaveBeenCalledWith(defaultProps.fen);
        expect(mockEngine.getDualEvaluation).toHaveBeenCalledWith(defaultProps.fen);
      });

      // Change FEN
      const newFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      rerender(<DualEvaluationPanel {...defaultProps} fen={newFen} />);
      
      await waitFor(() => {
        expect(mockEngine.updatePosition).toHaveBeenCalledWith(newFen);
        expect(mockEngine.getDualEvaluation).toHaveBeenCalledWith(newFen);
      });
    });

    it('should not evaluate when FEN is empty', () => {
      render(<DualEvaluationPanel {...defaultProps} fen="" />);
      
      expect(mockEngine.updatePosition).not.toHaveBeenCalled();
      expect(mockEngine.getDualEvaluation).not.toHaveBeenCalled();
    });

    it('should not evaluate when engine is not available', () => {
      mockUseEngine.mockReturnValue({
        engine: null,
        isLoading: false,
        error: null
      });

      render(<DualEvaluationPanel {...defaultProps} />);
      
      expect(mockEngine.updatePosition).not.toHaveBeenCalled();
      expect(mockEngine.getDualEvaluation).not.toHaveBeenCalled();
    });

    it('should not evaluate when engine is loading', () => {
      mockUseEngine.mockReturnValue({
        engine: mockEngine,
        isLoading: true,
        error: null
      });

      render(<DualEvaluationPanel {...defaultProps} />);
      
      expect(mockEngine.updatePosition).not.toHaveBeenCalled();
      expect(mockEngine.getDualEvaluation).not.toHaveBeenCalled();
    });

    it('should not evaluate when component is not visible', () => {
      render(<DualEvaluationPanel {...defaultProps} isVisible={false} />);
      
      expect(mockEngine.updatePosition).not.toHaveBeenCalled();
      expect(mockEngine.getDualEvaluation).not.toHaveBeenCalled();
    });
  });

  describe('Component Rendering', () => {
    it('should render EngineEvaluationCard with correct props', async () => {
      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('engine-score')).toHaveTextContent('50');
        expect(screen.getByTestId('engine-evaluation')).toHaveTextContent('Slightly favorable for White');
      });
    });

    it('should render TablebaseEvaluationCard with correct props', async () => {
      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('tablebase-available')).toHaveTextContent('available');
        expect(screen.getByTestId('tablebase-category')).toHaveTextContent('win');
      });
    });

    it('should render EvaluationComparison when evaluation is available', async () => {
      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('evaluation-comparison')).toBeInTheDocument();
        expect(screen.getByTestId('comparison-data')).toHaveTextContent(JSON.stringify(mockDualEvaluation));
      });
    });

    it('should not render EvaluationComparison when no evaluation', () => {
      mockEngine.getDualEvaluation.mockResolvedValue(null);

      render(<DualEvaluationPanel {...defaultProps} />);
      
      expect(screen.queryByTestId('evaluation-comparison')).not.toBeInTheDocument();
    });

    it('should wrap content in EngineErrorBoundary with correct engineId', () => {
      render(<DualEvaluationPanel {...defaultProps} />);
      
      const errorBoundary = screen.getByTestId('engine-error-boundary');
      expect(errorBoundary).toHaveAttribute('data-engine-id', 'dual-evaluation');
    });
  });

  describe('Default Engine Evaluation', () => {
    it('should provide default engine evaluation when no evaluation available', () => {
      mockEngine.getDualEvaluation.mockResolvedValue(null);

      render(<DualEvaluationPanel {...defaultProps} />);
      
      // Should pass default evaluation to EngineEvaluationCard
      expect(screen.getByTestId('engine-score')).toHaveTextContent('0');
      expect(screen.getByTestId('engine-evaluation')).toHaveTextContent('Loading...');
    });

    it('should handle evaluation with only engine data', async () => {
      const engineOnlyEvaluation = {
        engine: {
          score: -100,
          mate: 3,
          evaluation: 'White is winning'
        }
      };
      
      mockEngine.getDualEvaluation.mockResolvedValue(engineOnlyEvaluation);

      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('engine-score')).toHaveTextContent('-100');
        expect(screen.getByTestId('engine-mate')).toHaveTextContent('3');
        expect(screen.getByTestId('engine-evaluation')).toHaveTextContent('White is winning');
      });
    });
  });

  describe('Callback Handling', () => {
    it('should call onEvaluationUpdate when evaluation completes', async () => {
      const onEvaluationUpdate = jest.fn();
      
      render(
        <DualEvaluationPanel 
          {...defaultProps} 
          onEvaluationUpdate={onEvaluationUpdate}
        />
      );
      
      await waitFor(() => {
        expect(onEvaluationUpdate).toHaveBeenCalledWith(mockDualEvaluation);
      });
    });

    it('should not call onEvaluationUpdate when callback is not provided', async () => {
      // Should not throw error when callback is undefined
      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('engine-evaluation-card')).toBeInTheDocument();
      });
    });

    it('should not call onEvaluationUpdate when component unmounts during evaluation', async () => {
      const onEvaluationUpdate = jest.fn();
      let resolveEvaluation: (value: any) => void;
      const evaluationPromise = new Promise(resolve => {
        resolveEvaluation = resolve;
      });
      
      mockEngine.getDualEvaluation.mockReturnValue(evaluationPromise);

      const { unmount } = render(
        <DualEvaluationPanel 
          {...defaultProps} 
          onEvaluationUpdate={onEvaluationUpdate}
        />
      );
      
      unmount();
      
      act(() => {
        resolveEvaluation!(mockDualEvaluation);
      });
      
      expect(onEvaluationUpdate).not.toHaveBeenCalled();
    });
  });

  describe('useEngine Hook Integration', () => {
    it('should pass correct options to useEngine hook', () => {
      render(<DualEvaluationPanel {...defaultProps} />);
      
      expect(mockUseEngine).toHaveBeenCalledWith({
        id: 'dual-evaluation',
        autoCleanup: true
      });
    });

    it('should handle engine service initialization', () => {
      mockUseEngine.mockReturnValue({
        engine: null,
        isLoading: true,
        error: null
      });

      render(<DualEvaluationPanel {...defaultProps} />);
      
      expect(screen.getByTestId('engine-loading')).toHaveTextContent('loading');
    });
  });

  describe('Grid Layout', () => {
    it('should render evaluation cards in grid layout', () => {
      const { container } = render(<DualEvaluationPanel {...defaultProps} />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'gap-4');
    });

    it('should apply correct spacing classes', () => {
      const { container } = render(<DualEvaluationPanel {...defaultProps} />);
      
      const spaceContainer = container.querySelector('.space-y-4');
      expect(spaceContainer).toBeInTheDocument();
    });
  });

  describe('Error State Styling', () => {
    it('should apply correct error styling for engine errors', () => {
      mockUseEngine.mockReturnValue({
        engine: null,
        isLoading: false,
        error: 'Test engine error'
      });

      const { container } = render(<DualEvaluationPanel {...defaultProps} />);
      
      const errorDiv = container.querySelector('.bg-red-50');
      expect(errorDiv).toHaveClass(
        'bg-red-50', 
        'dark:bg-red-900/20', 
        'border', 
        'border-red-200', 
        'dark:border-red-800', 
        'rounded-lg', 
        'p-4'
      );
    });

    it('should apply correct error styling for evaluation errors', async () => {
      mockEngine.getDualEvaluation.mockRejectedValue(new Error('Test evaluation error'));

      const { container } = render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        const errorDiv = container.querySelector('.bg-red-50');
        expect(errorDiv).toHaveClass(
          'bg-red-50', 
          'dark:bg-red-900/20', 
          'border', 
          'border-red-200', 
          'dark:border-red-800', 
          'rounded-lg', 
          'p-4'
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle evaluation with mate in 0', async () => {
      const mateEvaluation = {
        engine: {
          score: 0,
          mate: 0,
          evaluation: 'Checkmate'
        }
      };
      
      mockEngine.getDualEvaluation.mockResolvedValue(mateEvaluation);

      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('engine-mate')).toHaveTextContent('0');
      });
    });

    it('should handle very large evaluation scores', async () => {
      const largeScoreEvaluation = {
        engine: {
          score: 9999,
          mate: null,
          evaluation: 'Overwhelming advantage'
        }
      };
      
      mockEngine.getDualEvaluation.mockResolvedValue(largeScoreEvaluation);

      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('engine-score')).toHaveTextContent('9999');
      });
    });

    it('should handle tablebase with all available properties', async () => {
      const fullTablebaseEvaluation = {
        engine: {
          score: 200,
          mate: null,
          evaluation: 'Winning'
        },
        tablebase: {
          isAvailable: true,
          result: {
            wdl: 2,
            dtz: 50,
            category: 'cursed-win' as const,
            precise: false
          },
          evaluation: 'Cursed win position'
        }
      };
      
      mockEngine.getDualEvaluation.mockResolvedValue(fullTablebaseEvaluation);

      render(<DualEvaluationPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('tablebase-category')).toHaveTextContent('cursed-win');
      });
    });
  });
});