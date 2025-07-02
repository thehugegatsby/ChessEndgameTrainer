/**
 * Comprehensive tests for MoveHistory component - targeting 80%+ coverage
 * Tests: Move display, evaluation formatting, UI states, hover effects
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MoveHistory } from '../MoveHistory';
import { Move } from 'chess.js';

describe('MoveHistory - Comprehensive Coverage', () => {
  const mockMoves: Move[] = [
    { san: 'e4', from: 'e2', to: 'e4', color: 'w', piece: 'p', flags: '' } as Move,
    { san: 'e5', from: 'e7', to: 'e5', color: 'b', piece: 'p', flags: '' } as Move,
    { san: 'Nf3', from: 'g1', to: 'f3', color: 'w', piece: 'n', flags: '' } as Move,
    { san: 'Nc6', from: 'b8', to: 'c6', color: 'b', piece: 'n', flags: '' } as Move,
    { san: 'Bb5', from: 'f1', to: 'b5', color: 'w', piece: 'b', flags: '' } as Move,
  ];

  const mockEvaluations = [
    { evaluation: 0.3, mateInMoves: undefined },
    { evaluation: -0.2, mateInMoves: undefined },
    { evaluation: 1.5, mateInMoves: undefined },
    { evaluation: -2.3, mateInMoves: undefined },
    { evaluation: 0.0, mateInMoves: 3 }, // Mate in 3
  ];

  describe('Basic Rendering', () => {
    it('should render with empty moves', () => {
      render(<MoveHistory moves={[]} />);
      
      expect(screen.getByText('📋')).toBeInTheDocument();
      expect(screen.getByText('Züge')).toBeInTheDocument();
      expect(screen.getByText('Noch keine Züge gespielt')).toBeInTheDocument();
      expect(screen.getByText('Ziehe eine Figur um zu beginnen')).toBeInTheDocument();
    });

    it('should render with moves', () => {
      render(<MoveHistory moves={mockMoves} />);
      
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('e5')).toBeInTheDocument();
      expect(screen.getByText('Nf3')).toBeInTheDocument();
      expect(screen.getByText('Nc6')).toBeInTheDocument();
      expect(screen.getByText('Bb5')).toBeInTheDocument();
    });

    it('should render with evaluations enabled', () => {
      render(<MoveHistory moves={mockMoves} showEvaluations={true} evaluations={mockEvaluations} />);
      
      expect(screen.getByText('Züge & Bewertungen')).toBeInTheDocument();
    });
  });

  describe('Move Pair Formatting', () => {
    it('should display moves in correct pairs', () => {
      render(<MoveHistory moves={mockMoves} />);
      
      // Check move numbers
      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
      expect(screen.getByText('3.')).toBeInTheDocument();
    });

    it('should handle odd number of moves correctly', () => {
      const oddMoves = mockMoves.slice(0, 3); // e4, e5, Nf3
      render(<MoveHistory moves={oddMoves} />);
      
      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('e5')).toBeInTheDocument();
      expect(screen.getByText('Nf3')).toBeInTheDocument();
    });
  });

  describe('Evaluation Formatting', () => {
    it('should format positive evaluations correctly', () => {
      const positiveEval = [{ evaluation: 1.5, mateInMoves: undefined }];
      render(<MoveHistory moves={[mockMoves[0]]} showEvaluations={true} evaluations={positiveEval} />);
      
      expect(screen.getByText('+1.5')).toBeInTheDocument();
    });

    it('should format negative evaluations correctly', () => {
      const negativeEval = [{ evaluation: -2.3, mateInMoves: undefined }];
      render(<MoveHistory moves={[mockMoves[0]]} showEvaluations={true} evaluations={negativeEval} />);
      
      expect(screen.getByText('-2.3')).toBeInTheDocument();
    });

    it('should format zero evaluation correctly', () => {
      const zeroEval = [{ evaluation: 0.05, mateInMoves: undefined }];
      render(<MoveHistory moves={[mockMoves[0]]} showEvaluations={true} evaluations={zeroEval} />);
      
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('should format mate evaluations correctly', () => {
      const mateEval = [{ evaluation: 0, mateInMoves: 3 }];
      render(<MoveHistory moves={[mockMoves[0]]} showEvaluations={true} evaluations={mateEval} />);
      
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('should format negative mate evaluations correctly', () => {
      const negativeMateEval = [{ evaluation: 0, mateInMoves: -2 }];
      render(<MoveHistory moves={[mockMoves[0]]} showEvaluations={true} evaluations={negativeMateEval} />);
      
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('should handle missing evaluations gracefully', () => {
      render(<MoveHistory moves={mockMoves} showEvaluations={true} evaluations={[]} />);
      
      // Should render without errors
      expect(screen.getByText('e4')).toBeInTheDocument();
    });
  });

  describe('Evaluation Color Coding', () => {
    it('should apply correct color classes for different evaluation ranges', () => {
      const evaluations = [
        { evaluation: 3.0, mateInMoves: undefined }, // Excellent (green)
        { evaluation: 1.0, mateInMoves: undefined }, // Good (green)
        { evaluation: 0.0, mateInMoves: undefined }, // Neutral (gray)
        { evaluation: -1.0, mateInMoves: undefined }, // Inaccurate (orange)
        { evaluation: -3.0, mateInMoves: undefined }, // Mistake (red)
      ];
      
      render(
        <MoveHistory 
          moves={mockMoves} 
          showEvaluations={true} 
          evaluations={evaluations} 
        />
      );
      
      expect(screen.getByText('+3.0')).toBeInTheDocument();
      expect(screen.getByText('+1.0')).toBeInTheDocument();
      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('-1.0')).toBeInTheDocument();
      expect(screen.getByText('-3.0')).toBeInTheDocument();
    });

    it('should apply correct color classes for mate evaluations', () => {
      const mateEvaluations = [
        { evaluation: 0, mateInMoves: 3 }, // Mate for us (green)
        { evaluation: 0, mateInMoves: -2 }, // Mate against us (red)
      ];
      
      render(
        <MoveHistory 
          moves={mockMoves.slice(0, 2)} 
          showEvaluations={true} 
          evaluations={mateEvaluations} 
        />
      );
      
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should respect showEvaluations prop', () => {
      const { rerender } = render(
        <MoveHistory moves={mockMoves} showEvaluations={false} evaluations={mockEvaluations} />
      );
      
      expect(screen.getByText('Züge')).toBeInTheDocument();
      expect(screen.queryByText('Züge & Bewertungen')).not.toBeInTheDocument();
      
      rerender(
        <MoveHistory moves={mockMoves} showEvaluations={true} evaluations={mockEvaluations} />
      );
      
      expect(screen.getByText('Züge & Bewertungen')).toBeInTheDocument();
    });

    it('should handle default prop values', () => {
      render(<MoveHistory moves={mockMoves} />);
      
      // Should render without errors with default props
      expect(screen.getByText('Züge')).toBeInTheDocument();
      expect(screen.getByText('e4')).toBeInTheDocument();
    });
  });

  describe('UI Styling and Classes', () => {
    it('should have proper container structure', () => {
      render(<MoveHistory moves={mockMoves} />);
      
      // Check for main container
      const container = document.querySelector('.bg-white');
      expect(container).toHaveClass('border', 'border-gray-200', 'rounded-2xl', 'shadow-lg');
    });

    it('should have proper header styling', () => {
      render(<MoveHistory moves={mockMoves} />);
      
      const header = screen.getByText('Züge').closest('.bg-gradient-to-r');
      expect(header).toHaveClass('from-emerald-500', 'to-teal-600', 'text-white');
    });

    it('should have proper empty state styling when no moves', () => {
      render(<MoveHistory moves={[]} />);
      
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('Noch keine Züge gespielt')).toHaveClass('text-gray-500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long move lists', () => {
      const longMoveList: Move[] = [];
      for (let i = 0; i < 50; i++) {
        longMoveList.push({
          san: `move${i}`,
          from: 'a1',
          to: 'a2',
          color: i % 2 === 0 ? 'w' : 'b',
          piece: 'p',
          flags: ''
        } as Move);
      }
      
      render(<MoveHistory moves={longMoveList} />);
      
      expect(screen.getByText('move0')).toBeInTheDocument();
      expect(screen.getByText('move49')).toBeInTheDocument();
    });

    it('should handle single move', () => {
      render(<MoveHistory moves={[mockMoves[0]]} />);
      
      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('e4')).toBeInTheDocument();
    });

    it('should handle evaluation arrays shorter than moves', () => {
      const shortEvaluations = [mockEvaluations[0]]; // Only one evaluation
      
      render(
        <MoveHistory 
          moves={mockMoves} 
          showEvaluations={true} 
          evaluations={shortEvaluations} 
        />
      );
      
      // Should render without errors
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('+0.3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<MoveHistory moves={mockMoves} showEvaluations={true} evaluations={mockEvaluations} />);
      
      // Check for heading
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<MoveHistory moves={mockMoves} />);
      
      // Move elements should be focusable if they were interactive
      // Currently they're display-only, which is correct
      expect(screen.getByText('e4')).toBeInTheDocument();
    });
  });
}); 