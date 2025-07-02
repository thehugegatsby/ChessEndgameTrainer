/**
 * Comprehensive tests for AnalysisPanel component - targeting 80%+ coverage
 * Tests: Analysis features, move selection, classification, UI interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisPanel } from '../AnalysisPanel/index';
import { Move } from 'chess.js';

describe('AnalysisPanel - Comprehensive Coverage', () => {
  const mockMoves: Move[] = [
    { san: 'e4', from: 'e2', to: 'e4', color: 'w', piece: 'p', flags: '' } as Move,
    { san: 'e5', from: 'e7', to: 'e5', color: 'b', piece: 'p', flags: '' } as Move,
    { san: 'Nf3', from: 'g1', to: 'f3', color: 'w', piece: 'n', flags: '' } as Move,
    { san: 'Nc6', from: 'b8', to: 'c6', color: 'b', piece: 'n', flags: '' } as Move,
  ];

  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render when visible', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      expect(screen.getAllByText('📊')[0]).toBeInTheDocument();
      expect(screen.getByText('Spielanalyse')).toBeInTheDocument();
      expect(screen.getByText('(4 Züge)')).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={false} 
        />
      );
      
      expect(screen.queryByText('Spielanalyse')).not.toBeInTheDocument();
    });

    it('should render close button', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Move List Display', () => {
    it('should display moves with move numbers', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('e5')).toBeInTheDocument();
      expect(screen.getByText('Nf3')).toBeInTheDocument();
      expect(screen.getByText('Nc6')).toBeInTheDocument();
    });

    it('should display "Zugfolge" header', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      expect(screen.getByText('Zugfolge')).toBeInTheDocument();
    });
  });

  describe('Move Selection', () => {
    it('should allow selecting moves', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      const e4Move = screen.getByText('e4').closest('div');
      expect(e4Move).toBeTruthy();
      
      if (e4Move) {
        fireEvent.click(e4Move);
        expect(e4Move).toHaveClass('bg-blue-100', 'border-blue-200');
      }
    });

    it('should show move details when selected', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      const e4Move = screen.getByText('e4').closest('div');
      if (e4Move) {
        fireEvent.click(e4Move);
        
        expect(screen.getByText(/Zug 1: e4/)).toBeInTheDocument();
      }
    });

    it('should show default text when no move selected', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      expect(screen.getByText('Wähle einen Zug')).toBeInTheDocument();
    });
  });

  describe('Move Classification', () => {
    it('should display classification symbols', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      // The component simulates different classifications
      // Check for classification symbols like !!, !, ?!, ?, ??
      const classificationElements = document.querySelectorAll('.text-green-600, .text-blue-600, .text-yellow-600, .text-orange-600, .text-red-600');
      expect(classificationElements.length).toBeGreaterThan(0);
    });

    it('should apply correct colors for classifications', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      // Test that classification colors are applied
      const excellent = document.querySelector('.text-green-600');
      const good = document.querySelector('.text-blue-600');
      const inaccuracy = document.querySelector('.text-yellow-600');
      const mistake = document.querySelector('.text-orange-600');
      const blunder = document.querySelector('.text-red-600');
      
      // At least some classification should be present
      const hasClassifications = excellent || good || inaccuracy || mistake || blunder;
      expect(hasClassifications).toBeTruthy();
    });
  });

  describe('Evaluation Display', () => {
    it('should display formatted evaluations', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      // The component generates simulated evaluations
      // Check for evaluation patterns like +0.50, -0.25, etc.
      const evaluationRegex = /[+-]?\d+\.\d{2}/;
      const evaluationTexts = screen.getAllByText(evaluationRegex);
      expect(evaluationTexts.length).toBeGreaterThan(0);
    });

    it('should show evaluation bar in analysis details', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      // Select a move to see analysis details
      const firstMove = screen.getByText('e4').closest('div');
      if (firstMove) {
        fireEvent.click(firstMove);
        
        expect(screen.getAllByText('Bewertung')[0]).toBeInTheDocument();
        expect(screen.getByText('Schwarz führt')).toBeInTheDocument();
      }
    });
  });

  describe('UI Interactions', () => {
    it('should call onClose when close button clicked', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have hover effects on moves', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      const moveElement = screen.getByText('e4').closest('div');
      expect(moveElement).toHaveClass('cursor-pointer');
    });
  });

  describe('Props Handling', () => {
    it('should use default initialFen when not provided', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      // Should render without errors with default FEN
      expect(screen.getByText('Spielanalyse')).toBeInTheDocument();
    });

    it('should use custom initialFen when provided', () => {
      const customFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      
      render(
        <AnalysisPanel 
          history={mockMoves} 
          initialFen={customFen}
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      // Should render without errors with custom FEN
      expect(screen.getByText('Spielanalyse')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty move history', () => {
      render(
        <AnalysisPanel 
          history={[]} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      expect(screen.getByText('Spielanalyse')).toBeInTheDocument();
      expect(screen.getByText('(0 Züge)')).toBeInTheDocument();
    });

    it('should handle single move', () => {
      render(
        <AnalysisPanel 
          history={[mockMoves[0]]} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      expect(screen.getByText('(1 Züge)')).toBeInTheDocument();
      expect(screen.getByText('e4')).toBeInTheDocument();
    });

    it('should handle odd number of moves', () => {
      const oddMoves = mockMoves.slice(0, 3);
      
      render(
        <AnalysisPanel 
          history={oddMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      expect(screen.getByText('(3 Züge)')).toBeInTheDocument();
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('e5')).toBeInTheDocument();
      expect(screen.getByText('Nf3')).toBeInTheDocument();
    });

    it('should handle very long move history', () => {
      const longMoves: Move[] = [];
      for (let i = 0; i < 50; i++) {
        longMoves.push({
          san: `move${i}`,
          from: 'a1',
          to: 'a2',
          color: i % 2 === 0 ? 'w' : 'b',
          piece: 'p',
          flags: ''
        } as Move);
      }
      
      render(
        <AnalysisPanel 
          history={longMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      expect(screen.getByText('(50 Züge)')).toBeInTheDocument();
      expect(screen.getByText('move0')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper container structure', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      const container = document.querySelector('.bg-white.rounded-xl.shadow-md');
      expect(container).toBeInTheDocument();
    });

    it('should have scrollable move list', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      const moveList = document.querySelector('.overflow-y-auto');
      expect(moveList).toBeInTheDocument();
    });

    it('should have proper layout proportions', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      const moveListSide = document.querySelector('.w-2\\/5');
      const analysisSide = document.querySelector('.w-3\\/5');
      
      expect(moveListSide).toBeInTheDocument();
      expect(analysisSide).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 4 })[0]).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(
        <AnalysisPanel 
          history={mockMoves} 
          onClose={mockOnClose} 
          isVisible={true} 
        />
      );
      
      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
    });
  });
}); 