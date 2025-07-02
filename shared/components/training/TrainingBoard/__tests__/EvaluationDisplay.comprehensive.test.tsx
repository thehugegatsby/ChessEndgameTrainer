import React from 'react';
import { render, screen } from '@testing-library/react';
import { EvaluationDisplay } from '../EvaluationDisplay';
import * as evaluationHelpers from '../../../../utils/chess/evaluationHelpers';

// Mock the utility function
jest.mock('../../../../utils/chess/evaluationHelpers', () => ({
  getEvaluationDisplay: jest.fn()
}));

const mockGetEvaluationDisplay = evaluationHelpers.getEvaluationDisplay as jest.MockedFunction<typeof evaluationHelpers.getEvaluationDisplay>;

describe('EvaluationDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock return value
    mockGetEvaluationDisplay.mockReturnValue({
      text: '+0.5',
      className: 'eval-good',
      color: '#28a745',
      bgColor: '#f8fff9'
    });
  });

  describe('Visibility Control', () => {
    it('should render nothing when isVisible is false', () => {
      const { container } = render(
        <EvaluationDisplay
          evaluation={0.5}
          move="e4"
          isVisible={false}
        />
      );
      
      expect(container.firstChild).toBeNull();
      expect(mockGetEvaluationDisplay).not.toHaveBeenCalled();
    });

    it('should render content when isVisible is true', () => {
      render(
        <EvaluationDisplay
          evaluation={0.5}
          move="e4"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('Zug: e4')).toBeInTheDocument();
      expect(screen.getByText('+0.5')).toBeInTheDocument();
      expect(mockGetEvaluationDisplay).toHaveBeenCalledWith(0.5, undefined);
    });
  });

  describe('Move Display', () => {
    it('should display the correct move notation', () => {
      render(
        <EvaluationDisplay
          evaluation={1.2}
          move="Qxf7+"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('Zug: Qxf7+')).toBeInTheDocument();
    });

    it('should handle long move notation', () => {
      render(
        <EvaluationDisplay
          evaluation={-0.8}
          move="O-O-O"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('Zug: O-O-O')).toBeInTheDocument();
    });

    it('should handle empty move string', () => {
      render(
        <EvaluationDisplay
          evaluation={0}
          move=""
          isVisible={true}
        />
      );
      
      expect(screen.getByText('Zug:')).toBeInTheDocument();
    });
  });

  describe('Evaluation Display Integration', () => {
    it('should call getEvaluationDisplay with correct parameters', () => {
      render(
        <EvaluationDisplay
          evaluation={2.5}
          mateInMoves={3}
          move="Rxh7"
          isVisible={true}
        />
      );
      
      expect(mockGetEvaluationDisplay).toHaveBeenCalledWith(2.5, 3);
      expect(mockGetEvaluationDisplay).toHaveBeenCalledTimes(1);
    });

    it('should display evaluation text from utility function', () => {
      mockGetEvaluationDisplay.mockReturnValue({
        text: 'M3',
        className: 'eval-excellent',
        color: '#dc3545',
        bgColor: '#fff5f5'
      });

      render(
        <EvaluationDisplay
          evaluation={9999}
          mateInMoves={3}
          move="Qh8#"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('M3')).toBeInTheDocument();
    });

    it('should handle negative evaluations', () => {
      mockGetEvaluationDisplay.mockReturnValue({
        text: '-1.8',
        className: 'eval-mistake',
        color: '#dc3545',
        bgColor: '#fff5f5'
      });

      render(
        <EvaluationDisplay
          evaluation={-1.8}
          move="Bxf7"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('-1.8')).toBeInTheDocument();
      expect(mockGetEvaluationDisplay).toHaveBeenCalledWith(-1.8, undefined);
    });
  });

  describe('Mate Information Display', () => {
    it('should display mate information when mateInMoves is provided', () => {
      render(
        <EvaluationDisplay
          evaluation={9999}
          mateInMoves={5}
          move="Qf7#"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('Matt in 5 Zügen')).toBeInTheDocument();
    });

    it('should display mate information for opponent mate', () => {
      render(
        <EvaluationDisplay
          evaluation={-9999}
          mateInMoves={-2}
          move="Kh1"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('Matt in 2 Zügen')).toBeInTheDocument();
    });

    it('should not display mate information when mateInMoves is undefined', () => {
      render(
        <EvaluationDisplay
          evaluation={1.5}
          move="Nf6"
          isVisible={true}
        />
      );
      
      expect(screen.queryByText(/Matt in/)).not.toBeInTheDocument();
    });

    it('should handle mate in 1', () => {
      render(
        <EvaluationDisplay
          evaluation={9999}
          mateInMoves={1}
          move="Qh8#"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('Matt in 1 Zügen')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct CSS classes', () => {
      const { container } = render(
        <EvaluationDisplay
          evaluation={0.8}
          move="e4"
          isVisible={true}
        />
      );
      
      const displayDiv = container.firstChild as HTMLElement;
      expect(displayDiv).toHaveClass('fixed', 'top-20', 'right-4', 'z-50');
      expect(displayDiv).toHaveClass('px-4', 'py-2', 'rounded-lg', 'shadow-lg', 'border', 'max-w-xs');
    });

    it('should apply correct inline styles from evaluation helper', () => {
      mockGetEvaluationDisplay.mockReturnValue({
        text: '+2.1',
        className: 'eval-excellent',
        color: '#28a745',
        bgColor: '#f8fff9'
      });

      const { container } = render(
        <EvaluationDisplay
          evaluation={2.1}
          move="Bb5"
          isVisible={true}
        />
      );
      
      const displayDiv = container.firstChild as HTMLElement;
      expect(displayDiv).toHaveStyle({
        backgroundColor: '#f8fff9',
        borderColor: '#28a745',
        color: '#28a745'
      });
    });

    it('should apply different styles for different evaluations', () => {
      mockGetEvaluationDisplay.mockReturnValue({
        text: '-0.9',
        className: 'eval-mistake',
        color: '#dc3545',
        bgColor: '#fff5f5'
      });

      const { container } = render(
        <EvaluationDisplay
          evaluation={-0.9}
          move="Qc2"
          isVisible={true}
        />
      );
      
      const displayDiv = container.firstChild as HTMLElement;
      expect(displayDiv).toHaveStyle({
        backgroundColor: '#fff5f5',
        borderColor: '#dc3545',
        color: '#dc3545'
      });
    });
  });

  describe('Component Structure', () => {
    it('should render with correct structure and separators', () => {
      render(
        <EvaluationDisplay
          evaluation={1.0}
          move="Nf3"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('Zug: Nf3')).toBeInTheDocument();
      expect(screen.getByText('|')).toBeInTheDocument();
      expect(screen.getByText('+0.5')).toBeInTheDocument();
    });

    it('should have flex layout with correct gap classes', () => {
      const { container } = render(
        <EvaluationDisplay
          evaluation={0.3}
          move="d4"
          isVisible={true}
        />
      );
      
      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toHaveClass('flex', 'items-center', 'gap-2');
    });

    it('should apply correct typography classes', () => {
      render(
        <EvaluationDisplay
          evaluation={0.7}
          move="Nc3"
          isVisible={true}
        />
      );
      
      const moveSpan = screen.getByText('Zug: Nc3');
      const evalSpan = screen.getByText('+0.5');
      
      expect(moveSpan).toHaveClass('font-bold', 'text-sm');
      expect(evalSpan).toHaveClass('font-medium', 'text-sm');
    });
  });

  describe('React.memo Optimization', () => {
    it('should be wrapped in React.memo', () => {
      // Check if component has memo wrapper
      expect(EvaluationDisplay.displayName).toBe('EvaluationDisplay');
      
      // Component should be a memoized component
      expect(React.isValidElement(<EvaluationDisplay evaluation={0} move="test" isVisible={true} />)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero evaluation', () => {
      mockGetEvaluationDisplay.mockReturnValue({
        text: '0.0',
        className: 'eval-neutral',
        color: '#6c757d',
        bgColor: '#f8f9fa'
      });

      render(
        <EvaluationDisplay
          evaluation={0}
          move="e4"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(mockGetEvaluationDisplay).toHaveBeenCalledWith(0, undefined);
    });

    it('should handle very high evaluation values', () => {
      mockGetEvaluationDisplay.mockReturnValue({
        text: '+9.99',
        className: 'eval-excellent',
        color: '#28a745',
        bgColor: '#f8fff9'
      });

      render(
        <EvaluationDisplay
          evaluation={9.99}
          move="Qxh7#"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('+9.99')).toBeInTheDocument();
    });

    it('should handle mate in 0 (immediate checkmate)', () => {
      render(
        <EvaluationDisplay
          evaluation={9999}
          mateInMoves={0}
          move="Qh8#"
          isVisible={true}
        />
      );
      
      expect(screen.getByText('Matt in 0 Zügen')).toBeInTheDocument();
    });
  });
}); 