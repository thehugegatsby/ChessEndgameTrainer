import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrainingProvider, useTraining } from '../TrainingContext';
import { EndgamePosition } from '../../data/endgames';

describe('TrainingContext - Comprehensive Coverage', () => {
  const mockPosition: EndgamePosition = {
    id: 1,
    title: 'Test Endgame',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    category: 'pawn',
    difficulty: 'beginner',
    description: 'Test position',
    goal: 'win',
    sideToMove: 'white',
    material: { white: 'K+P', black: 'K' },
    tags: ['test']
  };

  const mockMove = {
    from: 'e5',
    to: 'e6',
    piece: 'p',
    color: 'w',
    san: 'e6',
    flags: 'n'
  } as any;

  const renderWithProvider = (children: React.ReactNode) => {
    return render(
      <TrainingProvider>
        {children}
      </TrainingProvider>
    );
  };

  const renderHookWithProvider = <T,>(hook: () => T) => {
    return renderHook(hook, {
      wrapper: ({ children }) => (
        <TrainingProvider>
          {children}
        </TrainingProvider>
      )
    });
  };

  describe('Provider Initialization', () => {
    it('sollte TrainingProvider korrekt rendern', () => {
      const TestComponent = () => {
        const { state } = useTraining();
        return <div>{state.currentPosition ? 'Has Position' : 'No Position'}</div>;
      };

      renderWithProvider(<TestComponent />);
      expect(document.body).toBeInTheDocument();
    });

    it('sollte initial state korrekt setzen', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      expect(result.current.state).toEqual({
        currentPosition: null,
        moves: [],
        evaluations: [],
        currentFen: '',
        currentPgn: '',
        currentMoveIndex: -1,
        showAnalysis: true,
        showEvaluationPanel: false,
        showEngineEvaluation: true,
        showTablebaseEvaluation: true,
        isGameFinished: false,
        jumpToMoveFunc: null,
      });
    });

    it('sollte useTraining hook verfügbar machen', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      expect(result.current.state).toBeDefined();
      expect(result.current.dispatch).toBeDefined();
      expect(typeof result.current.dispatch).toBe('function');
    });

    it('sollte Fehler werfen wenn useTraining außerhalb Provider genutzt wird', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useTraining());
      }).toThrow('useTraining must be used within a TrainingProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('SET_POSITION Action', () => {
    it('sollte Position korrekt setzen', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      act(() => {
        result.current.dispatch({
          type: 'SET_POSITION',
          payload: mockPosition
        });
      });

      const { state } = result.current;
      expect(state.currentPosition).toEqual(mockPosition);
      expect(state.currentFen).toBe(mockPosition.fen);
      expect(state.moves).toEqual([]);
      expect(state.evaluations).toEqual([]);
      expect(state.currentPgn).toBe('');
      expect(state.currentMoveIndex).toBe(-1);
      expect(state.isGameFinished).toBe(false);
    });
  });

  describe('Move Management Actions', () => {
    it('sollte Move hinzufügen mit ADD_MOVE', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      act(() => {
        result.current.dispatch({
          type: 'ADD_MOVE',
          payload: mockMove
        });
      });

      expect(result.current.state.moves).toHaveLength(1);
      expect(result.current.state.moves[0]).toEqual(mockMove);
    });

    it('sollte mehrere Moves hinzufügen können', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      act(() => {
        result.current.dispatch({
          type: 'ADD_MOVE',
          payload: mockMove
        });
        result.current.dispatch({
          type: 'ADD_MOVE',
          payload: { ...mockMove, san: 'e7' }
        });
      });

      expect(result.current.state.moves).toHaveLength(2);
    });

    it('sollte alle Moves setzen mit SET_MOVES', () => {
      const { result } = renderHookWithProvider(() => useTraining());
      const moves = [mockMove, { ...mockMove, san: 'e7' }];

      act(() => {
        result.current.dispatch({
          type: 'SET_MOVES',
          payload: moves
        });
      });

      expect(result.current.state.moves).toEqual(moves);
      expect(result.current.state.moves).toHaveLength(2);
    });
  });

  describe('Evaluation Management Actions', () => {
    const mockEvaluation = { evaluation: 0.5, mateInMoves: 3 };

    it('sollte Evaluation hinzufügen mit ADD_EVALUATION', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      act(() => {
        result.current.dispatch({
          type: 'ADD_EVALUATION',
          payload: mockEvaluation
        });
      });

      expect(result.current.state.evaluations).toHaveLength(1);
      expect(result.current.state.evaluations[0]).toEqual(mockEvaluation);
    });

    it('sollte alle Evaluations setzen mit SET_EVALUATIONS', () => {
      const { result } = renderHookWithProvider(() => useTraining());
      const evaluations = [mockEvaluation, { evaluation: -0.2 }];

      act(() => {
        result.current.dispatch({
          type: 'SET_EVALUATIONS',
          payload: evaluations
        });
      });

      expect(result.current.state.evaluations).toEqual(evaluations);
    });
  });

  describe('Position Update Actions', () => {
    it('sollte Position aktualisieren mit UPDATE_POSITION', () => {
      const { result } = renderHookWithProvider(() => useTraining());
      const newPosition = {
        fen: '4k3/8/4K3/8/4P3/8/8/8 b - - 1 1',
        pgn: '1. e5'
      };

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_POSITION',
          payload: newPosition
        });
      });

      expect(result.current.state.currentFen).toBe(newPosition.fen);
      expect(result.current.state.currentPgn).toBe(newPosition.pgn);
    });

    it('sollte aktuellen Move Index setzen mit SET_CURRENT_MOVE_INDEX', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      act(() => {
        result.current.dispatch({
          type: 'SET_CURRENT_MOVE_INDEX',
          payload: 5
        });
      });

      expect(result.current.state.currentMoveIndex).toBe(5);
    });
  });

  describe('UI Toggle Actions', () => {
    it('sollte Analysis Panel togglen mit TOGGLE_ANALYSIS', () => {
      const { result } = renderHookWithProvider(() => useTraining());
      const initialShow = result.current.state.showAnalysis;

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_ANALYSIS' });
      });

      expect(result.current.state.showAnalysis).toBe(!initialShow);

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_ANALYSIS' });
      });

      expect(result.current.state.showAnalysis).toBe(initialShow);
    });

    it('sollte Evaluation Panel togglen mit TOGGLE_EVALUATION_PANEL', () => {
      const { result } = renderHookWithProvider(() => useTraining());
      const initialShow = result.current.state.showEvaluationPanel;

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_EVALUATION_PANEL' });
      });

      expect(result.current.state.showEvaluationPanel).toBe(!initialShow);
    });
  });

  describe('Game State Management', () => {
    it('sollte Game Finished Status setzen', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      act(() => {
        result.current.dispatch({
          type: 'SET_GAME_FINISHED',
          payload: true
        });
      });

      expect(result.current.state.isGameFinished).toBe(true);

      act(() => {
        result.current.dispatch({
          type: 'SET_GAME_FINISHED',
          payload: false
        });
      });

      expect(result.current.state.isGameFinished).toBe(false);
    });

    it('sollte Jump to Move Function setzen', () => {
      const { result } = renderHookWithProvider(() => useTraining());
      const mockJumpFunc = jest.fn();

      act(() => {
        result.current.dispatch({
          type: 'SET_JUMP_TO_MOVE_FUNC',
          payload: mockJumpFunc
        });
      });

      expect(result.current.state.jumpToMoveFunc).toBe(mockJumpFunc);
    });
  });

  describe('RESET_TRAINING Action', () => {
    it('sollte Training State zurücksetzen aber Position behalten', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      // Setup initial state
      act(() => {
        result.current.dispatch({
          type: 'SET_POSITION',
          payload: mockPosition
        });
        result.current.dispatch({
          type: 'ADD_MOVE',
          payload: mockMove
        });
        result.current.dispatch({
          type: 'SET_CURRENT_MOVE_INDEX',
          payload: 3
        });
        result.current.dispatch({
          type: 'SET_GAME_FINISHED',
          payload: true
        });
      });

      // Reset training
      act(() => {
        result.current.dispatch({ type: 'RESET_TRAINING' });
      });

      const { state } = result.current;
      expect(state.currentPosition).toEqual(mockPosition); // Position bleibt
      expect(state.currentFen).toBe(mockPosition.fen); // FEN wird zurückgesetzt
      expect(state.moves).toEqual([]);
      expect(state.evaluations).toEqual([]);
      expect(state.currentPgn).toBe('');
      expect(state.currentMoveIndex).toBe(-1);
      expect(state.isGameFinished).toBe(false);
      expect(state.jumpToMoveFunc).toBeNull();
      // UI preferences bleiben erhalten
      expect(state.showAnalysis).toBe(true);
      expect(state.showEvaluationPanel).toBe(false);
    });

    it('sollte UI Toggle States beim Reset beibehalten', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      // Toggle UI states
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_ANALYSIS' });
        result.current.dispatch({ type: 'TOGGLE_EVALUATION_PANEL' });
      });

      const preResetAnalysis = result.current.state.showAnalysis;
      const preResetEvaluation = result.current.state.showEvaluationPanel;

      // Reset training
      act(() => {
        result.current.dispatch({ type: 'RESET_TRAINING' });
      });

      expect(result.current.state.showAnalysis).toBe(preResetAnalysis);
      expect(result.current.state.showEvaluationPanel).toBe(preResetEvaluation);
    });
  });

  describe('Complex State Interactions', () => {
    it('sollte komplexen Trainings-Workflow korrekt handhaben', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      // 1. Set position
      act(() => {
        result.current.dispatch({
          type: 'SET_POSITION',
          payload: mockPosition
        });
      });

      // 2. Add moves and evaluations
      act(() => {
        result.current.dispatch({
          type: 'ADD_MOVE',
          payload: mockMove
        });
        result.current.dispatch({
          type: 'ADD_EVALUATION',
          payload: { evaluation: 0.5 }
        });
      });

      // 3. Update position
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_POSITION',
          payload: {
            fen: '4k3/8/4K3/8/4P3/8/8/8 b - - 1 1',
            pgn: '1. e5'
          }
        });
      });

      // 4. Set move index
      act(() => {
        result.current.dispatch({
          type: 'SET_CURRENT_MOVE_INDEX',
          payload: 0
        });
      });

      const { state } = result.current;
      expect(state.currentPosition).toEqual(mockPosition);
      expect(state.moves).toHaveLength(1);
      expect(state.evaluations).toHaveLength(1);
      expect(state.currentFen).toBe('4k3/8/4K3/8/4P3/8/8/8 b - - 1 1');
      expect(state.currentPgn).toBe('1. e5');
      expect(state.currentMoveIndex).toBe(0);
    });
  });

  describe('Reducer Edge Cases', () => {
    it('sollte unknown action types ignorieren', () => {
      const { result } = renderHookWithProvider(() => useTraining());
      const initialState = result.current.state;

      act(() => {
        result.current.dispatch({ type: 'UNKNOWN_ACTION' } as any);
      });

      expect(result.current.state).toEqual(initialState);
    });
  });
}); 