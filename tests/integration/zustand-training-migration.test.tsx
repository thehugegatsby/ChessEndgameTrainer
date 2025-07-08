import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useStore, useTraining, useTrainingActions } from '@shared/store/store';
import { EndgamePosition } from '@shared/data/endgames/types';

// Mock data
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

// Only use the properties that chess.js expects for a move
const mockMove = {
  from: 'e2',
  to: 'e4'
};

describe('Zustand Training Store Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.getState().reset();
  });

  describe('Training State Management', () => {
    it('should set position correctly', () => {
      const { result } = renderHook(() => ({
        training: useTraining(),
        actions: useTrainingActions()
      }));

      act(() => {
        result.current.actions.setPosition(mockPosition);
      });

      expect(result.current.training.currentPosition).toEqual(mockPosition);
      expect(result.current.training.isGameFinished).toBe(false);
      expect(result.current.training.isSuccess).toBe(false);
      expect(result.current.training.hintsUsed).toBe(0);
      expect(result.current.training.mistakeCount).toBe(0);
    });

    it('should handle move making and history', () => {
      const { result } = renderHook(() => ({
        training: useTraining(),
        actions: useTrainingActions()
      }));

      act(() => {
        result.current.actions.setPosition(mockPosition);
        result.current.actions.makeMove(mockMove);
      });

      expect(result.current.training.moveHistory).toHaveLength(1);
      // Check core move properties (the store will have enriched the move)
      const storedMove = result.current.training.moveHistory[0];
      expect(storedMove.from).toBe(mockMove.from);
      expect(storedMove.to).toBe(mockMove.to);
      expect(storedMove.san).toBe('e4'); // chess.js will have added this
      expect(storedMove.piece).toBe('p'); // chess.js will have added this
      expect(storedMove.color).toBe('w'); // chess.js will have added this
      expect(result.current.training.isPlayerTurn).toBe(false);
    });

    it('should handle undo move', () => {
      const { result } = renderHook(() => ({
        training: useTraining(),
        actions: useTrainingActions()
      }));

      act(() => {
        result.current.actions.setPosition(mockPosition);
        result.current.actions.makeMove(mockMove);
        result.current.actions.undoMove();
      });

      expect(result.current.training.moveHistory).toHaveLength(0);
      expect(result.current.training.isPlayerTurn).toBe(true);
    });

    it('should reset position correctly', () => {
      const { result } = renderHook(() => ({
        training: useTraining(),
        actions: useTrainingActions()
      }));

      act(() => {
        result.current.actions.setPosition(mockPosition);
        result.current.actions.makeMove(mockMove);
        result.current.actions.useHint();
        result.current.actions.incrementMistake();
        result.current.actions.resetPosition();
      });

      expect(result.current.training.moveHistory).toHaveLength(0);
      expect(result.current.training.hintsUsed).toBe(0);
      expect(result.current.training.mistakeCount).toBe(0);
      expect(result.current.training.isPlayerTurn).toBe(true);
    });

    it('should handle training completion', () => {
      const { result } = renderHook(() => ({
        training: useTraining(),
        actions: useTrainingActions(),
        progress: useStore(state => state.progress)
      }));

      act(() => {
        result.current.actions.setPosition(mockPosition);
        result.current.actions.completeTraining(true);
      });

      expect(result.current.training.isGameFinished).toBe(true);
      expect(result.current.training.isSuccess).toBe(true);
      
      // Check progress update - note: store uses numeric IDs
      // This test would need adjustment based on how we handle string->number ID conversion
    });

    it('should handle evaluation updates', () => {
      const { result } = renderHook(() => ({
        training: useTraining(),
        actions: useTrainingActions()
      }));

      const mockEvaluation = {
        evaluation: 50,
        bestMove: 'e4',
        score: 0.5,
        depth: 20
      };

      act(() => {
        result.current.actions.setEvaluation(mockEvaluation);
      });

      expect(result.current.training.currentEvaluation).toEqual(mockEvaluation);
    });

    it('should track hints and mistakes', () => {
      const { result } = renderHook(() => ({
        training: useTraining(),
        actions: useTrainingActions()
      }));

      act(() => {
        result.current.actions.setPosition(mockPosition);
        result.current.actions.useHint();
        result.current.actions.useHint();
        result.current.actions.incrementMistake();
        result.current.actions.incrementMistake();
        result.current.actions.incrementMistake();
      });

      expect(result.current.training.hintsUsed).toBe(2);
      expect(result.current.training.mistakeCount).toBe(3);
    });

    it('should handle engine status updates', () => {
      const { result } = renderHook(() => ({
        training: useTraining(),
        actions: useTrainingActions()
      }));

      act(() => {
        result.current.actions.setEngineStatus('initializing');
      });
      expect(result.current.training.engineStatus).toBe('initializing');

      act(() => {
        result.current.actions.setEngineStatus('ready');
      });
      expect(result.current.training.engineStatus).toBe('ready');
    });
  });

  describe('Component Integration', () => {
    // Mock component that uses Zustand store
    const TestTrainingComponent = () => {
      const training = useTraining();
      const { makeMove, undoMove, resetPosition } = useTrainingActions();

      // Choose move based on current state
      const getNextMove = () => {
        if (training.moveHistory.length === 0) {
          return { from: 'e2', to: 'e4' };
        } else {
          return { from: 'e7', to: 'e5' }; // Black's response
        }
      };

      return (
        <div>
          <div data-testid="move-count">{training.moveHistory.length}</div>
          <div data-testid="is-player-turn">{training.isPlayerTurn ? 'true' : 'false'}</div>
          <button onClick={() => makeMove(getNextMove())}>Make Move</button>
          <button onClick={undoMove}>Undo Move</button>
          <button onClick={resetPosition}>Reset</button>
        </div>
      );
    };

    it.skip('should integrate with React components correctly', async () => {
      // First set position so the game instance is initialized
      act(() => {
        useStore.getState().setPosition(mockPosition);
      });

      render(<TestTrainingComponent />);

      expect(screen.getByTestId('move-count')).toHaveTextContent('0');
      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('true');

      // Make a move
      fireEvent.click(screen.getByText('Make Move'));
      await waitFor(() => {
        expect(screen.getByTestId('move-count')).toHaveTextContent('1');
      });
      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('false');

      // Undo the move
      fireEvent.click(screen.getByText('Undo Move'));
      await waitFor(() => {
        expect(screen.getByTestId('move-count')).toHaveTextContent('0');
      });
      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('true');

      // Reset position
      fireEvent.click(screen.getByText('Make Move'));
      await waitFor(() => {
        expect(screen.getByTestId('move-count')).toHaveTextContent('1');
      });
      
      fireEvent.click(screen.getByText('Reset'));
      await waitFor(() => {
        expect(screen.getByTestId('move-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Store Persistence', () => {
    it('should persist and hydrate user and progress state', () => {
      const { result: initial } = renderHook(() => useStore());

      // Make some changes
      act(() => {
        initial.current.setUser({ rating: 1500 });
        initial.current.addCompletedPosition(1);
        initial.current.updatePositionProgress(1, {
          attempts: 5,
          successes: 3
        });
      });

      // Get the persisted state
      const state = useStore.getState();
      
      // Reset and hydrate
      act(() => {
        useStore.getState().reset();
        useStore.getState().hydrate({
          user: state.user,
          progress: state.progress
        });
      });

      const { result: hydrated } = renderHook(() => useStore());
      
      expect(hydrated.current.user.rating).toBe(1500);
      expect(hydrated.current.user.completedPositions).toContain(1);
      expect(hydrated.current.progress.positionProgress[1].attempts).toBe(5);
      expect(hydrated.current.progress.positionProgress[1].successes).toBe(3);
    });
  });

  describe('Migration Compatibility', () => {
    it('should match TrainingContext behavior for position changes', async () => {
      const { result } = renderHook(() => ({
        training: useTraining(),
        actions: useTrainingActions()
      }));

      act(() => {
        result.current.actions.setPosition(mockPosition);
      });

      // Verify all expected state is set
      expect(result.current.training.currentPosition).toEqual(mockPosition);
      expect(result.current.training.moveHistory).toEqual([]);
      expect(result.current.training.isPlayerTurn).toBe(true);
      expect(result.current.training.startTime).toBeDefined();
    });

    it('should handle concurrent updates correctly', async () => {
      const { result } = renderHook(() => ({
        actions: useTrainingActions()
      }));

      // First set position to initialize game instance
      act(() => {
        result.current.actions.setPosition(mockPosition);
      });

      // Simulate concurrent updates
      await act(async () => {
        result.current.actions.makeMove(mockMove);
        result.current.actions.useHint();
        result.current.actions.incrementMistake();
      });

      const finalState = useStore.getState().training;
      expect(finalState.moveHistory).toHaveLength(1);
      expect(finalState.hintsUsed).toBe(1);
      expect(finalState.mistakeCount).toBe(1);
    });
  });
});