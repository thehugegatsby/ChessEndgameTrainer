import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChessboardContainer } from '../ChessboardContainer';
import { Move } from 'chess.js';

// Mock Chessboard component
jest.mock('react-chessboard', () => ({
  Chessboard: ({ position, onPieceDrop, boardWidth, arePiecesDraggable, customBoardStyle }: any) => (
    <div 
      data-testid="chessboard"
      data-position={position}
      data-board-width={boardWidth}
      data-pieces-draggable={arePiecesDraggable}
      style={customBoardStyle}
      onClick={() => onPieceDrop && onPieceDrop('e2', 'e4')}
    >
      Mock Chessboard
    </div>
  )
}));

// Mock EvaluationDisplay component
jest.mock('../../EvaluationDisplay', () => ({
  EvaluationDisplay: ({ evaluation, mateInMoves, move, isVisible }: any) => (
    <div 
      data-testid="evaluation-display"
      data-evaluation={evaluation}
      data-mate={mateInMoves || ''}
      data-move={move}
      data-visible={isVisible}
    >
      Evaluation: {evaluation} | Move: {move}
    </div>
  )
}));

describe('ChessboardContainer', () => {
  const defaultProps = {
    currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    onPieceDrop: jest.fn(),
    isGameFinished: false,
    resetKey: 0,
    lastEvaluation: null,
    history: [] as Move[],
    showLastEvaluation: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Chessboard Rendering', () => {
    it('should render chessboard with default props', () => {
      render(<ChessboardContainer {...defaultProps} />);

      const chessboard = screen.getByTestId('chessboard');
      expect(chessboard).toBeInTheDocument();
      expect(chessboard).toHaveAttribute('data-position', defaultProps.currentFen);
      expect(chessboard).toHaveAttribute('data-board-width', '800');
      expect(chessboard).toHaveAttribute('data-pieces-draggable', 'true');
    });

    it('should render with custom board width', () => {
      render(<ChessboardContainer {...defaultProps} boardWidth={600} />);

      const chessboard = screen.getByTestId('chessboard');
      expect(chessboard).toHaveAttribute('data-board-width', '600');
    });

    it('should disable piece dragging when game is finished', () => {
      render(<ChessboardContainer {...defaultProps} isGameFinished={true} />);

      const chessboard = screen.getByTestId('chessboard');
      expect(chessboard).toHaveAttribute('data-pieces-draggable', 'false');
    });

    it('should apply reset key to board container', () => {
      const { rerender, container: containerElement } = render(<ChessboardContainer {...defaultProps} resetKey={0} />);

      // Reset key should affect component re-rendering, but key attributes are React internal
      expect(containerElement.querySelector('[data-testid="chessboard"]')).toBeInTheDocument();

      rerender(<ChessboardContainer {...defaultProps} resetKey={1} />);
      
      // After re-render with different resetKey, component should still render
      expect(containerElement.querySelector('[data-testid="chessboard"]')).toBeInTheDocument();
    });

    it('should apply custom board styles', () => {
      render(<ChessboardContainer {...defaultProps} />);

      const chessboard = screen.getByTestId('chessboard');
      expect(chessboard).toHaveStyle({
        borderRadius: '8px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
      });
    });
  });

  describe('Evaluation Overlay', () => {
    const mockHistory: Move[] = [
      { san: 'e4', from: 'e2', to: 'e4' } as Move,
      { san: 'e5', from: 'e7', to: 'e5' } as Move
    ];

    it('should not show evaluation overlay when conditions not met', () => {
      render(<ChessboardContainer {...defaultProps} />);

      expect(screen.queryByTestId('evaluation-display')).not.toBeInTheDocument();
    });

    it('should not show evaluation overlay when lastEvaluation is null', () => {
      render(
        <ChessboardContainer 
          {...defaultProps}
          lastEvaluation={null}
          history={mockHistory}
          showLastEvaluation={true}
        />
      );

      expect(screen.queryByTestId('evaluation-display')).not.toBeInTheDocument();
    });

    it('should not show evaluation overlay when showLastEvaluation is false', () => {
      render(
        <ChessboardContainer 
          {...defaultProps}
          lastEvaluation={{ evaluation: 1.5 }}
          history={mockHistory}
          showLastEvaluation={false}
        />
      );

      expect(screen.queryByTestId('evaluation-display')).not.toBeInTheDocument();
    });

    it('should not show evaluation overlay when history is empty', () => {
      render(
        <ChessboardContainer 
          {...defaultProps}
          lastEvaluation={{ evaluation: 1.5 }}
          history={[]}
          showLastEvaluation={true}
        />
      );

      expect(screen.queryByTestId('evaluation-display')).not.toBeInTheDocument();
    });

    it('should show evaluation overlay when all conditions are met', () => {
      render(
        <ChessboardContainer 
          {...defaultProps}
          lastEvaluation={{ evaluation: 1.5 }}
          history={mockHistory}
          showLastEvaluation={true}
        />
      );

      const evaluationDisplay = screen.getByTestId('evaluation-display');
      expect(evaluationDisplay).toBeInTheDocument();
      expect(evaluationDisplay).toHaveAttribute('data-evaluation', '1.5');
      expect(evaluationDisplay).toHaveAttribute('data-move', 'e5');
      expect(evaluationDisplay).toHaveAttribute('data-visible', 'true');
    });

    it('should show evaluation with mate in moves', () => {
      render(
        <ChessboardContainer 
          {...defaultProps}
          lastEvaluation={{ evaluation: 100, mateInMoves: 3 }}
          history={mockHistory}
          showLastEvaluation={true}
        />
      );

      const evaluationDisplay = screen.getByTestId('evaluation-display');
      expect(evaluationDisplay).toHaveAttribute('data-evaluation', '100');
      expect(evaluationDisplay).toHaveAttribute('data-mate', '3');
    });

    it('should use last move from history', () => {
      const extendedHistory: Move[] = [
        ...mockHistory,
        { san: 'Nf3', from: 'g1', to: 'f3' } as Move
      ];

      render(
        <ChessboardContainer 
          {...defaultProps}
          lastEvaluation={{ evaluation: 0.3 }}
          history={extendedHistory}
          showLastEvaluation={true}
        />
      );

      const evaluationDisplay = screen.getByTestId('evaluation-display');
      expect(evaluationDisplay).toHaveAttribute('data-move', 'Nf3');
    });
  });

  describe('Container Structure', () => {
    it('should have correct CSS classes and structure', () => {
      const { container } = render(<ChessboardContainer {...defaultProps} />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('relative');

      // Check that the container has the proper structure
      expect(outerDiv.tagName).toBe('DIV');
      expect(outerDiv).toHaveClass('relative');
    });

    it('should maintain relative positioning for overlay', () => {
      const { container } = render(
        <ChessboardContainer 
          {...defaultProps}
          lastEvaluation={{ evaluation: 1.0 }}
          history={[{ san: 'e4', from: 'e2', to: 'e4' } as Move]}
          showLastEvaluation={true}
        />
      );

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('relative');
    });
  });

  describe('Event Handling', () => {
    it('should call onPieceDrop when piece is dropped', () => {
      const mockOnPieceDrop = jest.fn().mockReturnValue(true);
      
      render(
        <ChessboardContainer 
          {...defaultProps}
          onPieceDrop={mockOnPieceDrop}
        />
      );

      const chessboard = screen.getByTestId('chessboard');
      chessboard.click(); // Simulates the onPieceDrop call

      expect(mockOnPieceDrop).toHaveBeenCalledWith('e2', 'e4');
    });
  });

  describe('Prop Variations', () => {
    it('should handle different FEN positions', () => {
      const endgameFen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
      
      render(<ChessboardContainer {...defaultProps} currentFen={endgameFen} />);

      const chessboard = screen.getByTestId('chessboard');
      expect(chessboard).toHaveAttribute('data-position', endgameFen);
    });

    it('should handle evaluation without mateInMoves', () => {
      render(
        <ChessboardContainer 
          {...defaultProps}
          lastEvaluation={{ evaluation: -2.1 }}
          history={[{ san: 'e4', from: 'e2', to: 'e4' } as Move]}
          showLastEvaluation={true}
        />
      );

      const evaluationDisplay = screen.getByTestId('evaluation-display');
      expect(evaluationDisplay).toHaveAttribute('data-evaluation', '-2.1');
      expect(evaluationDisplay).toHaveAttribute('data-mate', '');
    });

    it('should handle moves without san notation', () => {
      const moveWithoutSan: Move[] = [
        { from: 'e2', to: 'e4' } as Move // Missing san
      ];

      render(
        <ChessboardContainer 
          {...defaultProps}
          lastEvaluation={{ evaluation: 0.5 }}
          history={moveWithoutSan}
          showLastEvaluation={true}
        />
      );

      const evaluationDisplay = screen.getByTestId('evaluation-display');
      expect(evaluationDisplay).toHaveAttribute('data-move', '');
    });
  });
}); 