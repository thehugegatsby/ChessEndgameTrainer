import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { TrainingBoardZustand } from '@shared/components/training/TrainingBoard/TrainingBoardZustand';
import { useStore } from '@shared/store/store';
import { EndgamePosition } from '@shared/data/endgames/types';

// Mock the chess hooks
jest.mock('@shared/hooks', () => ({
  useChessGame: jest.fn(() => ({
    game: { 
      fen: () => 'test-fen',
      pgn: () => 'test-pgn'
    },
    history: [],
    isGameFinished: false,
    currentFen: 'test-fen',
    currentPgn: '',
    makeMove: jest.fn(),
    jumpToMove: jest.fn(),
    resetGame: jest.fn(),
    undoMove: jest.fn()
  })),
  useTrainingGame: jest.fn(() => ({
    game: { 
      fen: () => 'test-fen',
      pgn: () => 'test-pgn'
    },
    history: [],
    isGameFinished: false,
    currentFen: 'test-fen',
    currentPgn: '',
    makeMove: jest.fn(),
    jumpToMove: jest.fn(),
    resetGame: jest.fn(),
    undoMove: jest.fn()
  })),
  useEvaluation: jest.fn(() => ({
    evaluations: [],
    lastEvaluation: null,
    isEvaluating: false,
    error: null,
    addEvaluation: jest.fn(),
    clearEvaluations: jest.fn()
  }))
}));

// Mock react-chessboard
jest.mock('react-chessboard', () => ({
  Chessboard: ({ onPieceDrop }: any) => (
    <div data-testid="chessboard">
      <button onClick={() => onPieceDrop('e2', 'e4')}>Move e2-e4</button>
    </div>
  )
}));

// Mock ScenarioEngine
jest.mock('@shared/lib/chess/ScenarioEngine', () => ({
  ScenarioEngine: jest.fn().mockImplementation(() => ({
    getFen: jest.fn(() => 'test-fen'),
    makeMove: jest.fn(),
    reset: jest.fn()
  }))
}));

// Mock ErrorService
jest.mock('@shared/services/errorService', () => ({
  ErrorService: {
    handleChessEngineError: jest.fn()
  }
}));

const mockPosition: EndgamePosition = {
  id: 1,
  title: 'Test Position',
  description: 'Test description',
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  category: 'pawn',
  difficulty: 'beginner',
  goal: 'draw',
  sideToMove: 'white',
  material: {
    white: 'K+P',
    black: 'K'
  },
  tags: ['basic']
};

describe('TrainingBoardZustand', () => {
  beforeEach(() => {
    useStore.getState().reset();
  });

  it('should set position in Zustand store on mount', () => {
    render(
      <TrainingBoardZustand
        position={mockPosition}
        onComplete={jest.fn()}
      />
    );

    const state = useStore.getState().training;
    expect(state.currentPosition).toEqual(mockPosition);
  });

  it('should render chessboard', () => {
    render(
      <TrainingBoardZustand
        position={mockPosition}
        onComplete={jest.fn()}
      />
    );

    // Check that chessboard is rendered
    expect(screen.getByTestId('chessboard')).toBeInTheDocument();
  });

  it('should sync move history with Zustand', () => {
    const mockMove = {
      from: 'e2',
      to: 'e4',
      san: 'e4',
      flags: 'n',
      piece: 'p',
      color: 'w'
    };

    // First, set up the store with a position and move
    act(() => {
      useStore.getState().setPosition(mockPosition);
      useStore.getState().makeMove(mockMove);
    });

    const { useTrainingGame } = require('@shared/hooks');
    useTrainingGame.mockReturnValue({
      game: { 
        fen: () => 'test-fen',
        pgn: () => 'test-pgn'
      },
      history: [mockMove],
      isGameFinished: false,
      currentFen: 'test-fen',
      currentPgn: '',
      makeMove: jest.fn(),
      jumpToMove: jest.fn(),
      resetGame: jest.fn(),
      undoMove: jest.fn()
    });

    render(
      <TrainingBoardZustand
        position={mockPosition}
        onComplete={jest.fn()}
      />
    );

    // Check Zustand state has the move we added
    const state = useStore.getState().training;
    expect(state.moveHistory).toHaveLength(1);
    // Check core move properties (adapter adds helper methods and additional fields)
    const storedMove = state.moveHistory[0];
    expect(storedMove.from).toBe(mockMove.from);
    expect(storedMove.to).toBe(mockMove.to);
    expect(storedMove.san).toBe(mockMove.san);
    expect(storedMove.piece).toBe(mockMove.piece);
    expect(storedMove.color).toBe(mockMove.color);
  });

  it('should handle game completion through onComplete callback', async () => {
    const onCompleteMock = jest.fn();
    
    // First set up the store with a position
    act(() => {
      useStore.getState().setPosition(mockPosition);
    });

    // Mock useTrainingGame to simulate the real hook behavior
    const { useTrainingGame } = require('@shared/hooks');
    useTrainingGame.mockImplementation(({ onComplete }: { onComplete: (success: boolean) => void }) => {
      // Simulate the real hook by setting up an effect that watches Store state
      React.useEffect(() => {
        const state = useStore.getState().training;
        if (state.isGameFinished && onComplete) {
          onComplete(state.isSuccess);
        }
      }, [onComplete]);
      
      return {
        game: { 
          fen: () => 'test-fen',
          pgn: () => 'test-pgn'
        },
        history: [],
        isGameFinished: false,
        currentFen: 'test-fen',
        currentPgn: '',
        makeMove: jest.fn(),
        jumpToMove: jest.fn(),
        resetGame: jest.fn(),
        undoMove: jest.fn()
      };
    });
    
    render(
      <TrainingBoardZustand
        position={mockPosition}
        onComplete={onCompleteMock}
      />
    );

    // Trigger game completion via store action (simulating what would happen in real usage)
    act(() => {
      useStore.getState().completeTraining(true);
    });
    
    // Check that Zustand state is updated
    const state = useStore.getState().training;
    expect(state.isGameFinished).toBe(true);
    expect(state.isSuccess).toBe(true);
    
    // Wait for React component to process state change and call onComplete callback
    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalledWith(true);
    });
  });

  it('should handle reset correctly', () => {
    const { useTrainingGame, useEvaluation } = require('@shared/hooks');
    
    const resetGameMock = jest.fn();
    const clearEvaluationsMock = jest.fn();
    
    // First set up the store with a position and some state
    act(() => {
      useStore.getState().setPosition(mockPosition);
      useStore.getState().makeMove({
        from: 'a2',
        to: 'a4',
        san: 'a4',
        piece: 'p',
        color: 'w'
      });
    });
    
    useTrainingGame.mockReturnValue({
      game: { 
        fen: () => 'test-fen',
        pgn: () => 'test-pgn'
      },
      history: [],
      isGameFinished: false,
      currentFen: 'test-fen',
      currentPgn: '',
      makeMove: jest.fn(),
      jumpToMove: jest.fn(),
      resetGame: resetGameMock,
      undoMove: jest.fn()
    });
    
    useEvaluation.mockReturnValue({
      evaluations: [],
      lastEvaluation: null,
      isEvaluating: false,
      error: null,
      addEvaluation: jest.fn(),
      clearEvaluations: clearEvaluationsMock
    });

    const { rerender } = render(
      <TrainingBoardZustand
        position={mockPosition}
        onComplete={jest.fn()}
      />
    );

    // Trigger reset through props change
    rerender(
      <TrainingBoardZustand
        position={mockPosition}
        onComplete={jest.fn()}
        resetTrigger={1}
      />
    );

    expect(resetGameMock).toHaveBeenCalled();
    expect(clearEvaluationsMock).toHaveBeenCalled();
    
    // Check Zustand state
    const state = useStore.getState().training;
    expect(state.moveHistory).toHaveLength(0);
  });
});