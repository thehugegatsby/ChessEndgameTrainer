import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrainingProvider, useTraining } from '@shared/contexts/TrainingContext';
import { EndgamePosition } from '@shared/data/endgames';

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

    it('sollte CLEAR_MOVES alle Moves löschen', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      // Add some moves first
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

      // Clear moves
      act(() => {
        result.current.dispatch({
          type: 'CLEAR_MOVES'
        });
      });

      expect(result.current.state.moves).toEqual([]);
    });

    it('sollte UNDO_MOVE letzten Move entfernen', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      // Add moves
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

      // Undo last move
      act(() => {
        result.current.dispatch({
          type: 'UNDO_MOVE'
        });
      });

      expect(result.current.state.moves).toHaveLength(1);
      expect(result.current.state.moves[0].san).toBe('e6');
    });
  });

  describe('Game State Actions', () => {
    it('sollte UPDATE_GAME_STATE FEN und PGN updaten', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      const newFen = '4k3/8/4K3/4P3/8/8/8/8 b - - 1 1';
      const newPgn = '1. e6';

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_GAME_STATE',
          payload: {
            fen: newFen,
            pgn: newPgn
          }
        });
      });

      expect(result.current.state.currentFen).toBe(newFen);
      expect(result.current.state.currentPgn).toBe(newPgn);
    });

    it('sollte SET_GAME_FINISHED Game finished state setzen', () => {
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

    it('sollte SET_MOVE_INDEX aktuellen Move Index setzen', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      act(() => {
        result.current.dispatch({
          type: 'SET_MOVE_INDEX',
          payload: 3
        });
      });

      expect(result.current.state.currentMoveIndex).toBe(3);
    });

    it('sollte SET_JUMP_TO_MOVE_FUNC Funktion setzen', () => {
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

  describe('Panel Visibility Actions', () => {
    it('sollte TOGGLE_ANALYSIS Panel toggled', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      expect(result.current.state.showAnalysis).toBe(true);

      act(() => {
        result.current.dispatch({
          type: 'TOGGLE_ANALYSIS'
        });
      });

      expect(result.current.state.showAnalysis).toBe(false);

      act(() => {
        result.current.dispatch({
          type: 'TOGGLE_ANALYSIS'
        });
      });

      expect(result.current.state.showAnalysis).toBe(true);
    });

    it('sollte TOGGLE_EVALUATION_PANEL Evaluation Panel toggled', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      expect(result.current.state.showEvaluationPanel).toBe(false);

      act(() => {
        result.current.dispatch({
          type: 'TOGGLE_EVALUATION_PANEL'
        });
      });

      expect(result.current.state.showEvaluationPanel).toBe(true);
    });

    it('sollte TOGGLE_ENGINE_EVALUATION Engine Evaluation toggled', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      expect(result.current.state.showEngineEvaluation).toBe(true);

      act(() => {
        result.current.dispatch({
          type: 'TOGGLE_ENGINE_EVALUATION'
        });
      });

      expect(result.current.state.showEngineEvaluation).toBe(false);
    });

    it('sollte TOGGLE_TABLEBASE_EVALUATION Tablebase Evaluation toggled', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      expect(result.current.state.showTablebaseEvaluation).toBe(true);

      act(() => {
        result.current.dispatch({
          type: 'TOGGLE_TABLEBASE_EVALUATION'
        });
      });

      expect(result.current.state.showTablebaseEvaluation).toBe(false);
    });
  });

  describe('Evaluation Actions', () => {
    it('sollte ADD_EVALUATION Evaluation hinzufügen', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      const mockEvaluation = {
        move: mockMove,
        score: 0.5,
        mate: null,
        depth: 15
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_EVALUATION',
          payload: mockEvaluation
        });
      });

      expect(result.current.state.evaluations).toHaveLength(1);
      expect(result.current.state.evaluations[0]).toEqual(mockEvaluation);
    });

    it('sollte CLEAR_EVALUATIONS alle Evaluationen löschen', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      const mockEvaluation = {
        move: mockMove,
        score: 0.5,
        mate: null,
        depth: 15
      };

      // Add evaluation first
      act(() => {
        result.current.dispatch({
          type: 'ADD_EVALUATION',
          payload: mockEvaluation
        });
      });

      expect(result.current.state.evaluations).toHaveLength(1);

      // Clear evaluations
      act(() => {
        result.current.dispatch({
          type: 'CLEAR_EVALUATIONS'
        });
      });

      expect(result.current.state.evaluations).toEqual([]);
    });
  });

  describe('Complex State Updates', () => {
    it('sollte mehrere Actions in Folge handhaben', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      act(() => {
        // Set position
        result.current.dispatch({
          type: 'SET_POSITION',
          payload: mockPosition
        });

        // Add moves
        result.current.dispatch({
          type: 'ADD_MOVE',
          payload: mockMove
        });

        // Update game state
        result.current.dispatch({
          type: 'UPDATE_GAME_STATE',
          payload: {
            fen: '4k3/8/4K3/4P3/8/8/8/8 b - - 1 1',
            pgn: '1. e6'
          }
        });

        // Toggle panels
        result.current.dispatch({
          type: 'TOGGLE_EVALUATION_PANEL'
        });
      });

      const { state } = result.current;
      expect(state.currentPosition).toEqual(mockPosition);
      expect(state.moves).toHaveLength(1);
      expect(state.currentFen).toBe('4k3/8/4K3/4P3/8/8/8/8 b - - 1 1');
      expect(state.currentPgn).toBe('1. e6');
      expect(state.showEvaluationPanel).toBe(true);
    });

    it('sollte State korrekt nach Position reset', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      // Set initial position and add some state
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
          type: 'SET_GAME_FINISHED',
          payload: true
        });
      });

      // Set new position (should reset most state)
      const newPosition = { ...mockPosition, id: 2, title: 'New Position' };
      act(() => {
        result.current.dispatch({
          type: 'SET_POSITION',
          payload: newPosition
        });
      });

      const { state } = result.current;
      expect(state.currentPosition).toEqual(newPosition);
      expect(state.moves).toEqual([]);
      expect(state.evaluations).toEqual([]);
      expect(state.isGameFinished).toBe(false);
      expect(state.currentMoveIndex).toBe(-1);
    });
  });

  describe('Error Handling', () => {
    it('sollte unbekannte Actions ignorieren', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      const initialState = result.current.state;

      act(() => {
        result.current.dispatch({
          type: 'UNKNOWN_ACTION' as any,
          payload: 'test'
        });
      });

      // State should remain unchanged
      expect(result.current.state).toEqual(initialState);
    });

    it('sollte UNDO_MOVE graceful handhaben wenn keine Moves vorhanden', () => {
      const { result } = renderHookWithProvider(() => useTraining());

      expect(result.current.state.moves).toEqual([]);

      act(() => {
        result.current.dispatch({
          type: 'UNDO_MOVE'
        });
      });

      // Should still be empty array
      expect(result.current.state.moves).toEqual([]);
    });
  });

  describe('State Persistence', () => {
    it('sollte State zwischen re-renders beibehalten', () => {
      const { result, rerender } = renderHookWithProvider(() => useTraining());

      act(() => {
        result.current.dispatch({
          type: 'SET_POSITION',
          payload: mockPosition
        });
      });

      rerender();

      expect(result.current.state.currentPosition).toEqual(mockPosition);
    });
  });
});