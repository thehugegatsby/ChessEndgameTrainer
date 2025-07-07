/**
 * @fileoverview Unit tests for TrainingContext
 * @description Testing the central training state management system
 * 
 * Test guidelines followed:
 * - Each test has a single responsibility
 * - Self-explanatory test names
 * - No magic values
 * - Deterministic behavior
 * - Fast execution
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { TrainingProvider, useTraining } from '../../../shared/contexts/TrainingContext';
import { EndgamePosition } from '../../../shared/data/endgames';
import { Move } from 'chess.js';

// Mock data
const mockEndgamePosition: EndgamePosition = {
  id: 1,
  title: 'Test Position',
  description: 'A test endgame position',
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  category: 'pawn',
  difficulty: 'beginner',
  goal: 'win',
  sideToMove: 'white',
  material: {
    white: 'K+P',
    black: 'K'
  },
  tags: ['test', 'basic']
};

const mockMove: Move = {
  from: 'e2',
  to: 'e4',
  san: 'e4',
  color: 'w',
  piece: 'p',
  flags: '',
  lan: 'e2e4',
  before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  isCapture: () => false,
  isPromotion: () => false,
  isEnPassant: () => false,
  isKingsideCastle: () => false,
  isQueensideCastle: () => false,
  isBigPawn: () => true
} as Move;

const mockEvaluation = {
  evaluation: 0.3,
  mateInMoves: undefined,
  tablebase: {
    isTablebasePosition: false
  }
};

// Wrapper component for hook testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TrainingProvider>{children}</TrainingProvider>
);

describe('TrainingContext', () => {
  describe('Initial State', () => {
    it('TrainingContext_InitialState_DefaultValues_ReturnsExpectedState', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      expect(result.current.state.currentPosition).toBeNull();
      expect(result.current.state.moves).toEqual([]);
      expect(result.current.state.evaluations).toEqual([]);
      expect(result.current.state.currentFen).toBe('');
      expect(result.current.state.currentPgn).toBe('');
      expect(result.current.state.currentMoveIndex).toBe(-1);
      expect(result.current.state.showAnalysis).toBe(true);
      expect(result.current.state.showEvaluationPanel).toBe(false);
      expect(result.current.state.showEngineEvaluation).toBe(true);
      expect(result.current.state.showTablebaseEvaluation).toBe(true);
      expect(result.current.state.isGameFinished).toBe(false);
      expect(result.current.state.jumpToMoveFunc).toBeNull();
    });
  });

  describe('SET_POSITION Action', () => {
    it('TrainingContext_SetPosition_NewPosition_ResetsGameStateCorrectly', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'SET_POSITION', payload: mockEndgamePosition });
      });

      expect(result.current.state.currentPosition).toEqual(mockEndgamePosition);
      expect(result.current.state.currentFen).toBe(mockEndgamePosition.fen);
      expect(result.current.state.moves).toEqual([]);
      expect(result.current.state.evaluations).toEqual([]);
      expect(result.current.state.currentPgn).toBe('');
      expect(result.current.state.currentMoveIndex).toBe(-1);
      expect(result.current.state.isGameFinished).toBe(false);
    });

    it('TrainingContext_SetPosition_PreviousMovesExist_ClearsAllHistory', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      // Add some moves and evaluations first
      act(() => {
        result.current.dispatch({ type: 'ADD_MOVE', payload: mockMove });
        result.current.dispatch({ type: 'ADD_EVALUATION', payload: mockEvaluation });
        result.current.dispatch({ type: 'SET_CURRENT_MOVE_INDEX', payload: 0 });
      });

      // Now set a new position
      act(() => {
        result.current.dispatch({ type: 'SET_POSITION', payload: mockEndgamePosition });
      });

      // Verify everything was reset
      expect(result.current.state.moves).toEqual([]);
      expect(result.current.state.evaluations).toEqual([]);
      expect(result.current.state.currentMoveIndex).toBe(-1);
    });
  });

  describe('Move Actions', () => {
    it('TrainingContext_AddMove_SingleMove_AppendsToMovesArray', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'ADD_MOVE', payload: mockMove });
      });

      expect(result.current.state.moves).toHaveLength(1);
      expect(result.current.state.moves[0]).toEqual(mockMove);
    });

    it('TrainingContext_AddMove_MultipleMoves_PreservesOrder', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });
      const move2 = { ...mockMove, san: 'd4' };
      const move3 = { ...mockMove, san: 'Nf3' };

      act(() => {
        result.current.dispatch({ type: 'ADD_MOVE', payload: mockMove });
        result.current.dispatch({ type: 'ADD_MOVE', payload: move2 as Move });
        result.current.dispatch({ type: 'ADD_MOVE', payload: move3 as Move });
      });

      expect(result.current.state.moves).toHaveLength(3);
      expect(result.current.state.moves[0].san).toBe('e4');
      expect(result.current.state.moves[1].san).toBe('d4');
      expect(result.current.state.moves[2].san).toBe('Nf3');
    });

    it('TrainingContext_SetMoves_NewMovesArray_ReplacesEntireArray', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });
      const newMoves = [
        { ...mockMove, san: 'e4' },
        { ...mockMove, san: 'd4' },
        { ...mockMove, san: 'Nf3' }
      ];

      // Add initial moves
      act(() => {
        result.current.dispatch({ type: 'ADD_MOVE', payload: mockMove });
      });

      // Replace with new moves array
      act(() => {
        result.current.dispatch({ type: 'SET_MOVES', payload: newMoves as Move[] });
      });

      expect(result.current.state.moves).toEqual(newMoves);
      expect(result.current.state.moves).toHaveLength(3);
    });
  });

  describe('Evaluation Actions', () => {
    it('TrainingContext_AddEvaluation_SingleEvaluation_AppendsToArray', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'ADD_EVALUATION', payload: mockEvaluation });
      });

      expect(result.current.state.evaluations).toHaveLength(1);
      expect(result.current.state.evaluations[0]).toEqual(mockEvaluation);
    });

    it('TrainingContext_SetEvaluations_NewEvaluationsArray_ReplacesEntireArray', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });
      const newEvaluations = [
        { ...mockEvaluation, evaluation: 0.5 },
        { ...mockEvaluation, evaluation: 0.8 },
        { ...mockEvaluation, evaluation: 1.2 }
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_EVALUATIONS', payload: newEvaluations });
      });

      expect(result.current.state.evaluations).toEqual(newEvaluations);
    });
  });

  describe('Position Update Actions', () => {
    it('TrainingContext_UpdatePosition_NewFenAndPgn_UpdatesWithoutClearingHistory', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });
      const newFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const newPgn = '1. e4';

      // Add some history first
      act(() => {
        result.current.dispatch({ type: 'ADD_MOVE', payload: mockMove });
        result.current.dispatch({ type: 'ADD_EVALUATION', payload: mockEvaluation });
      });

      // Update position
      act(() => {
        result.current.dispatch({ 
          type: 'UPDATE_POSITION', 
          payload: { fen: newFen, pgn: newPgn } 
        });
      });

      expect(result.current.state.currentFen).toBe(newFen);
      expect(result.current.state.currentPgn).toBe(newPgn);
      // History should be preserved
      expect(result.current.state.moves).toHaveLength(1);
      expect(result.current.state.evaluations).toHaveLength(1);
    });
  });

  describe('UI Toggle Actions', () => {
    it('TrainingContext_ToggleAnalysis_InitiallyTrue_TogglesToFalse', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_ANALYSIS' });
      });

      expect(result.current.state.showAnalysis).toBe(false);

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_ANALYSIS' });
      });

      expect(result.current.state.showAnalysis).toBe(true);
    });

    it('TrainingContext_ToggleEvaluationPanel_InitiallyFalse_TogglesToTrue', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_EVALUATION_PANEL' });
      });

      expect(result.current.state.showEvaluationPanel).toBe(true);
    });

    it('TrainingContext_ToggleEngineEvaluation_WhenDisabled_AlsoShowsPanel', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      // Initially engine is true, panel is false
      expect(result.current.state.showEngineEvaluation).toBe(true);
      expect(result.current.state.showEvaluationPanel).toBe(false);

      // Toggle engine off
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_ENGINE_EVALUATION' });
      });

      expect(result.current.state.showEngineEvaluation).toBe(false);
      expect(result.current.state.showEvaluationPanel).toBe(false);

      // Toggle engine back on - should auto-show panel
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_ENGINE_EVALUATION' });
      });

      expect(result.current.state.showEngineEvaluation).toBe(true);
      expect(result.current.state.showEvaluationPanel).toBe(true);
    });

    it('TrainingContext_ToggleTablebaseEvaluation_WhenDisabled_AlsoShowsPanel', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      // Toggle tablebase off
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_TABLEBASE_EVALUATION' });
      });

      expect(result.current.state.showTablebaseEvaluation).toBe(false);

      // Toggle tablebase back on - should auto-show panel
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_TABLEBASE_EVALUATION' });
      });

      expect(result.current.state.showTablebaseEvaluation).toBe(true);
      expect(result.current.state.showEvaluationPanel).toBe(true);
    });
  });

  describe('Game State Actions', () => {
    it('TrainingContext_SetCurrentMoveIndex_ValidIndex_UpdatesCorrectly', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });
      const targetIndex = 5;

      act(() => {
        result.current.dispatch({ type: 'SET_CURRENT_MOVE_INDEX', payload: targetIndex });
      });

      expect(result.current.state.currentMoveIndex).toBe(targetIndex);
    });

    it('TrainingContext_SetGameFinished_True_UpdatesGameState', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'SET_GAME_FINISHED', payload: true });
      });

      expect(result.current.state.isGameFinished).toBe(true);
    });

    it('TrainingContext_SetJumpToMoveFunc_ValidFunction_StoresInState', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });
      const mockJumpFunc = jest.fn();

      act(() => {
        result.current.dispatch({ type: 'SET_JUMP_TO_MOVE_FUNC', payload: mockJumpFunc });
      });

      expect(result.current.state.jumpToMoveFunc).toBe(mockJumpFunc);
    });
  });

  describe('RESET_TRAINING Action', () => {
    it('TrainingContext_ResetTraining_WithCurrentPosition_PreservesPositionAndUISettings', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      // Setup initial state with position, moves, and UI settings
      act(() => {
        result.current.dispatch({ type: 'SET_POSITION', payload: mockEndgamePosition });
        result.current.dispatch({ type: 'ADD_MOVE', payload: mockMove });
        result.current.dispatch({ type: 'ADD_EVALUATION', payload: mockEvaluation });
        result.current.dispatch({ type: 'TOGGLE_ANALYSIS' }); // showAnalysis = false
        result.current.dispatch({ type: 'TOGGLE_EVALUATION_PANEL' }); // showEvaluationPanel = true
        result.current.dispatch({ type: 'SET_GAME_FINISHED', payload: true });
      });

      // Reset training
      act(() => {
        result.current.dispatch({ type: 'RESET_TRAINING' });
      });

      // Verify: Position and UI settings preserved, game state reset
      expect(result.current.state.currentPosition).toEqual(mockEndgamePosition);
      expect(result.current.state.currentFen).toBe(mockEndgamePosition.fen);
      expect(result.current.state.showAnalysis).toBe(false); // Preserved
      expect(result.current.state.showEvaluationPanel).toBe(true); // Preserved
      expect(result.current.state.showEngineEvaluation).toBe(true); // Preserved
      expect(result.current.state.showTablebaseEvaluation).toBe(true); // Preserved
      
      // Game state should be reset
      expect(result.current.state.moves).toEqual([]);
      expect(result.current.state.evaluations).toEqual([]);
      expect(result.current.state.currentPgn).toBe('');
      expect(result.current.state.currentMoveIndex).toBe(-1);
      expect(result.current.state.isGameFinished).toBe(false);
      expect(result.current.state.jumpToMoveFunc).toBeNull();
    });

    it('TrainingContext_ResetTraining_NoCurrentPosition_HandlesGracefully', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      // Add some moves without setting position
      act(() => {
        result.current.dispatch({ type: 'ADD_MOVE', payload: mockMove });
        result.current.dispatch({ type: 'RESET_TRAINING' });
      });

      expect(result.current.state.currentPosition).toBeNull();
      expect(result.current.state.currentFen).toBe('');
      expect(result.current.state.moves).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('TrainingContext_UseTrainingHook_OutsideProvider_ThrowsError', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTraining());
      }).toThrow('useTraining must be used within a TrainingProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Complex Scenarios', () => {
    it('TrainingContext_MultipleActions_ComplexGameFlow_MaintainsStateIntegrity', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      // Simulate a complex game flow
      act(() => {
        // 1. Set initial position
        result.current.dispatch({ type: 'SET_POSITION', payload: mockEndgamePosition });
        
        // 2. Make several moves
        result.current.dispatch({ type: 'ADD_MOVE', payload: mockMove });
        result.current.dispatch({ type: 'ADD_EVALUATION', payload: mockEvaluation });
        
        const move2 = { ...mockMove, san: 'd4' };
        result.current.dispatch({ type: 'ADD_MOVE', payload: move2 as Move });
        result.current.dispatch({ type: 'ADD_EVALUATION', payload: { ...mockEvaluation, evaluation: 0.5 } });
        
        // 3. Update position
        result.current.dispatch({ 
          type: 'UPDATE_POSITION', 
          payload: { 
            fen: 'rnbqkbnr/pppppppp/8/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2',
            pgn: '1. e4 e5 2. d4'
          } 
        });
        
        // 4. Update move index
        result.current.dispatch({ type: 'SET_CURRENT_MOVE_INDEX', payload: 1 });
        
        // 5. Toggle some UI settings
        result.current.dispatch({ type: 'TOGGLE_ENGINE_EVALUATION' });
        
        // 6. Finish game
        result.current.dispatch({ type: 'SET_GAME_FINISHED', payload: true });
      });

      // Verify final state
      expect(result.current.state.currentPosition).toEqual(mockEndgamePosition);
      expect(result.current.state.moves).toHaveLength(2);
      expect(result.current.state.evaluations).toHaveLength(2);
      expect(result.current.state.currentMoveIndex).toBe(1);
      expect(result.current.state.showEngineEvaluation).toBe(false);
      expect(result.current.state.showEvaluationPanel).toBe(false);
      expect(result.current.state.isGameFinished).toBe(true);
      expect(result.current.state.currentPgn).toBe('1. e4 e5 2. d4');
    });

    it('TrainingContext_JumpToMove_SimulatedNavigation_UpdatesStateCorrectly', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      // Setup game with multiple moves
      act(() => {
        result.current.dispatch({ type: 'SET_POSITION', payload: mockEndgamePosition });
        
        // Add 5 moves
        for (let i = 0; i < 5; i++) {
          result.current.dispatch({ 
            type: 'ADD_MOVE', 
            payload: { ...mockMove, san: `move${i}` } as Move 
          });
          result.current.dispatch({ 
            type: 'ADD_EVALUATION', 
            payload: { ...mockEvaluation, evaluation: i * 0.1 } 
          });
        }
      });

      // Jump to different positions
      act(() => {
        result.current.dispatch({ type: 'SET_CURRENT_MOVE_INDEX', payload: 2 });
      });
      expect(result.current.state.currentMoveIndex).toBe(2);

      act(() => {
        result.current.dispatch({ type: 'SET_CURRENT_MOVE_INDEX', payload: 0 });
      });
      expect(result.current.state.currentMoveIndex).toBe(0);

      act(() => {
        result.current.dispatch({ type: 'SET_CURRENT_MOVE_INDEX', payload: 4 });
      });
      expect(result.current.state.currentMoveIndex).toBe(4);
    });
  });

  describe('Performance Considerations', () => {
    it('TrainingContext_StateUpdates_ImmutabilityCheck_CreatesNewReferences', () => {
      const { result } = renderHook(() => useTraining(), { wrapper });

      const initialMovesRef = result.current.state.moves;
      const initialEvaluationsRef = result.current.state.evaluations;

      act(() => {
        result.current.dispatch({ type: 'ADD_MOVE', payload: mockMove });
        result.current.dispatch({ type: 'ADD_EVALUATION', payload: mockEvaluation });
      });

      // Verify new array references were created (immutability)
      expect(result.current.state.moves).not.toBe(initialMovesRef);
      expect(result.current.state.evaluations).not.toBe(initialEvaluationsRef);
    });
  });
});

describe('TrainingContext Edge Cases', () => {
  it('TrainingContext_InvalidAction_UnknownActionType_ReturnsUnchangedState', () => {
    const { result } = renderHook(() => useTraining(), { wrapper });
    const initialState = { ...result.current.state };

    act(() => {
      // @ts-expect-error Testing invalid action type
      result.current.dispatch({ type: 'INVALID_ACTION', payload: {} });
    });

    // State should remain unchanged
    expect(result.current.state).toEqual(initialState);
  });

  it('TrainingContext_TablebaseData_ComplexEvaluationObject_HandlesCorrectly', () => {
    const { result } = renderHook(() => useTraining(), { wrapper });
    
    const complexEvaluation = {
      evaluation: 0,
      mateInMoves: 15,
      tablebase: {
        isTablebasePosition: true,
        wdlBefore: 2,
        wdlAfter: 2,
        category: 'win',
        dtz: 30
      }
    };

    act(() => {
      result.current.dispatch({ type: 'ADD_EVALUATION', payload: complexEvaluation });
    });

    expect(result.current.state.evaluations[0]).toEqual(complexEvaluation);
    expect(result.current.state.evaluations[0].tablebase?.isTablebasePosition).toBe(true);
    expect(result.current.state.evaluations[0].tablebase?.wdlBefore).toBe(2);
  });
});