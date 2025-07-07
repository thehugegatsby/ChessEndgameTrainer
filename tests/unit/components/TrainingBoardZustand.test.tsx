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
  useEvaluation: jest.fn(() => ({
    evaluations: [],
    lastEvaluation: null,
    isEvaluating: false,
    error: null,
    addEvaluation: jest.fn(),
    clearEvaluations: jest.fn()
  }))
}));

// Mock ChessboardContainer
jest.mock('@shared/components/training/TrainingBoard/components/ChessboardContainer', () => ({
  ChessboardContainer: ({ onPieceDrop }: any) => (
    <div data-testid="chessboard">
      <button onClick={() => onPieceDrop('e2', 'e4')}>Move e2-e4</button>
    </div>
  )
}));

// Mock ErrorDisplay
jest.mock('@shared/components/training/TrainingBoard/ErrorDisplay', () => ({
  ErrorDisplay: () => null
}));

// Mock hooks
jest.mock('@shared/components/training/TrainingBoard/hooks', () => ({
  useScenarioEngine: jest.fn(() => ({
    scenarioEngine: {},
    isEngineReady: true,
    engineError: null
  })),
  useTrainingState: jest.fn(() => ({
    resetKey: 0,
    showLastEvaluation: false,
    warning: '',
    engineError: null,
    moveError: null,
    showMoveErrorDialog: false,
    setWarning: jest.fn(),
    setEngineError: jest.fn(),
    showEvaluationBriefly: jest.fn(),
    handleReset: jest.fn(),
    handleDismissMoveError: jest.fn(),
    handleClearWarning: jest.fn(),
    handleClearEngineError: jest.fn()
  })),
  useEnhancedMoveHandler: jest.fn(() => ({
    handleMove: jest.fn()
  }))
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

  it('should update Zustand when making a move', () => {
    const { useEnhancedMoveHandler } = require('@shared/components/training/TrainingBoard/hooks');
    const handleMoveMock = jest.fn();
    
    useEnhancedMoveHandler.mockReturnValue({
      handleMove: handleMoveMock
    });

    render(
      <TrainingBoardZustand
        position={mockPosition}
        onComplete={jest.fn()}
      />
    );

    // Simulate move
    fireEvent.click(screen.getByText('Move e2-e4'));

    // Check that handleMove was called
    expect(handleMoveMock).toHaveBeenCalled();
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

    const { useChessGame } = require('@shared/hooks');
    useChessGame.mockReturnValue({
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

    // Check Zustand state
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

  it('should handle game completion through onComplete callback', () => {
    const onCompleteMock = jest.fn();
    const { useChessGame } = require('@shared/hooks');
    
    // Mock useChessGame to capture onComplete callback
    let capturedOnComplete: ((success: boolean) => void) | null = null;
    useChessGame.mockImplementation(({ onComplete }: { onComplete: (success: boolean) => void }) => {
      capturedOnComplete = onComplete;
      return {
        game: { 
          fen: () => 'test-fen',
          pgn: () => 'test-pgn'
        },
        history: [],
        isGameFinished: true, // Set to true to avoid reset
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

    // Call the captured onComplete callback
    act(() => {
      if (capturedOnComplete) {
        capturedOnComplete(true);
      }
    });
    
    // Check that Zustand state is updated
    const state = useStore.getState().training;
    expect(state.isGameFinished).toBe(true);
    expect(state.isSuccess).toBe(true);
    expect(onCompleteMock).toHaveBeenCalledWith(true);
  });

  it('should handle reset correctly', () => {
    const { useChessGame, useEvaluation } = require('@shared/hooks');
    const { useTrainingState } = require('@shared/components/training/TrainingBoard/hooks');
    
    const resetGameMock = jest.fn();
    const clearEvaluationsMock = jest.fn();
    const handleResetMock = jest.fn();
    
    useChessGame.mockReturnValue({
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
    
    useTrainingState.mockReturnValue({
      resetKey: 0,
      showLastEvaluation: false,
      warning: '',
      engineError: null,
      moveError: null,
      showMoveErrorDialog: false,
      setWarning: jest.fn(),
      setEngineError: jest.fn(),
      showEvaluationBriefly: jest.fn(),
      handleReset: handleResetMock,
      handleDismissMoveError: jest.fn(),
      handleClearWarning: jest.fn(),
      handleClearEngineError: jest.fn()
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
    expect(handleResetMock).toHaveBeenCalled();
    
    // Check Zustand state
    const state = useStore.getState().training;
    expect(state.moveHistory).toHaveLength(0);
  });
});