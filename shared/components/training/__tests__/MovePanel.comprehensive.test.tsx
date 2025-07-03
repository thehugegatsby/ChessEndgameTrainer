/**
 * Comprehensive tests for MovePanel component - targeting 80%+ coverage
 * Tests: Move navigation, evaluation display, click handlers, UI interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MovePanel } from '../MovePanel';
import { Move } from 'chess.js';

describe('MovePanel - Comprehensive Coverage', () => {
  const mockMoves: Move[] = [
    { san: 'e4', from: 'e2', to: 'e4', color: 'w', piece: 'p', flags: '' } as Move,
    { san: 'e5', from: 'e7', to: 'e5', color: 'b', piece: 'p', flags: '' } as Move,
    { san: 'Nf3', from: 'g1', to: 'f3', color: 'w', piece: 'n', flags: '' } as Move,
    { san: 'Nc6', from: 'b8', to: 'c6', color: 'b', piece: 'n', flags: '' } as Move,
  ];

  const mockEvaluations = [
    { evaluation: 0.3, mateInMoves: undefined },
    { evaluation: -0.2, mateInMoves: undefined },
    { evaluation: 2.5, mateInMoves: undefined }, // Excellent
    { evaluation: -2.5, mateInMoves: undefined }, // Mistake
  ];

  const mockMoveClickHandler = jest.fn();

  beforeEach(() => {
    mockMoveClickHandler.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render empty state when no moves', () => {
      render(<MovePanel moves={[]} />);
      
      expect(screen.getByText('Noch keine Züge gespielt')).toBeInTheDocument();
    });

    it('should render with moves', () => {
      render(<MovePanel moves={mockMoves} />);
      
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('e5')).toBeInTheDocument();
      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
    });

    it('should render with evaluations enabled', () => {
      render(<MovePanel moves={mockMoves} showEvaluations={true} evaluations={mockEvaluations} />);
      
      // Check that evaluations are displayed (using emoji icons)
      const excellentMoves = screen.queryAllByText('✨');
      expect(excellentMoves.length).toBeGreaterThan(0);
    });
  });

  describe('Click Handlers', () => {
    it('should call onMoveClick for white moves', () => {
      render(<MovePanel moves={mockMoves} onMoveClick={mockMoveClickHandler} />);
      
      const e4Button = screen.getByText('e4');
      fireEvent.click(e4Button);
      
      expect(mockMoveClickHandler).toHaveBeenCalledWith(0);
    });

    it('should call onMoveClick for black moves', () => {
      render(<MovePanel moves={mockMoves} onMoveClick={mockMoveClickHandler} />);
      
      const e5Button = screen.getByText('e5');
      fireEvent.click(e5Button);
      
      expect(mockMoveClickHandler).toHaveBeenCalledWith(1);
    });
  });

  describe('Current Move Highlighting', () => {
    it('should highlight current move', () => {
      render(<MovePanel moves={mockMoves} currentMoveIndex={0} />);
      
      const e4Button = screen.getByText('e4');
      expect(e4Button).toHaveClass('text-blue-400', 'bg-blue-900/30');
    });
  });

  describe('Evaluation Display', () => {
    it('should display evaluation symbol for excellent moves', () => {
      const excellentEval = [{ evaluation: 2.5, mateInMoves: undefined }];
      render(<MovePanel moves={[mockMoves[0]]} showEvaluations={true} evaluations={excellentEval} />);
      
      expect(screen.getByText('✨')).toBeInTheDocument();
    });

    it('should display evaluation symbol for neutral moves', () => {
      const neutralEval = [{ evaluation: 0.0, mateInMoves: undefined }];
      render(<MovePanel moves={[mockMoves[0]]} showEvaluations={true} evaluations={neutralEval} />);
      
      expect(screen.getByText('⚪')).toBeInTheDocument();
    });

    it('should display mate evaluations correctly', () => {
      const mateEval = [{ evaluation: 0, mateInMoves: 3 }];
      render(<MovePanel moves={[mockMoves[0]]} showEvaluations={true} evaluations={mateEval} />);
      
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('should display tablebase symbols when available', () => {
      const tablebaseEval = [{ 
        evaluation: 0, 
        mateInMoves: undefined,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 1, // win
          wdlAfter: 1,  // win maintained
          category: 'win'
        }
      }];
      render(<MovePanel moves={[mockMoves[0]]} showEvaluations={true} evaluations={tablebaseEval} />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should prioritize tablebase over engine evaluation', () => {
      const tablebaseEval = [{ 
        evaluation: -5.0, // Would be catastrophic by engine
        mateInMoves: undefined,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 1, // win
          wdlAfter: 1,  // win maintained  
          category: 'win'
        }
      }];
      render(<MovePanel moves={[mockMoves[0]]} showEvaluations={true} evaluations={tablebaseEval} />);
      
      // Should show tablebase symbol (✅) not engine symbol (🔴)
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.queryByText('🔴')).not.toBeInTheDocument();
    });
  });
}); 