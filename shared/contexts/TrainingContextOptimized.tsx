import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Chess } from 'chess.js';
import { EndgamePosition } from '../data/endgames';

/**
 * OPTIMIZED TrainingContext - Phase 2 Performance Enhancement
 * 
 * Key Changes:
 * 1. Store moves as simple string arrays instead of full Move objects
 * 2. Store evaluations as primitive numbers instead of complex objects
 * 3. Use FEN strings as primary state (already optimized)
 * 4. Compute Chess.js objects transiently when needed
 */

// Simplified interfaces for performance
interface OptimizedEvaluationData {
  score: number;           // Just the centipawn score
  mate?: number;          // Mate in N moves (optional)
}

interface OptimizedTrainingState {
  currentPosition: EndgamePosition | null;
  
  // OPTIMIZED: Store moves as strings instead of objects
  moveHistory: string[];   // ['e4', 'e5', 'Nf3'] instead of Move[]
  
  // OPTIMIZED: Store evaluations as primitives
  evaluationHistory: OptimizedEvaluationData[];
  
  // These were already optimal (primitive strings/numbers)
  currentFen: string;
  currentPgn: string;
  currentMoveIndex: number;
  showAnalysis: boolean;
  showEvaluationPanel: boolean;
  isGameFinished: boolean;
  jumpToMoveFunc: ((moveIndex: number) => void) | null;
}

type OptimizedTrainingAction =
  | { type: 'SET_POSITION'; payload: EndgamePosition }
  | { type: 'ADD_MOVE'; payload: string }                    // Now just a move string
  | { type: 'SET_MOVES'; payload: string[] }                 // Array of move strings
  | { type: 'ADD_EVALUATION'; payload: OptimizedEvaluationData }
  | { type: 'SET_EVALUATIONS'; payload: OptimizedEvaluationData[] }
  | { type: 'UPDATE_POSITION'; payload: { fen: string; pgn: string } }
  | { type: 'SET_CURRENT_MOVE_INDEX'; payload: number }
  | { type: 'TOGGLE_ANALYSIS' }
  | { type: 'TOGGLE_EVALUATION_PANEL' }
  | { type: 'SET_GAME_FINISHED'; payload: boolean }
  | { type: 'SET_JUMP_TO_MOVE_FUNC'; payload: (moveIndex: number) => void }
  | { type: 'RESET_TRAINING' };

const optimizedInitialState: OptimizedTrainingState = {
  currentPosition: null,
  moveHistory: [],                    // Empty array instead of Move objects
  evaluationHistory: [],              // Simple objects instead of complex ones
  currentFen: '',
  currentPgn: '',
  currentMoveIndex: -1,
  showAnalysis: true,
  showEvaluationPanel: true,
  isGameFinished: false,
  jumpToMoveFunc: null,
};

const optimizedTrainingReducer = (
  state: OptimizedTrainingState, 
  action: OptimizedTrainingAction
): OptimizedTrainingState => {
  switch (action.type) {
    case 'SET_POSITION':
      return {
        ...state,
        currentPosition: action.payload,
        currentFen: action.payload.fen,
        moveHistory: [],                // Reset to empty array
        evaluationHistory: [],          // Reset to empty array
        currentPgn: '',
        currentMoveIndex: -1,
        isGameFinished: false,
      };
      
    case 'ADD_MOVE':
      return {
        ...state,
        moveHistory: [...state.moveHistory, action.payload],  // Add string to array
      };
      
    case 'SET_MOVES':
      return {
        ...state,
        moveHistory: action.payload,    // Set array of strings
      };
      
    case 'ADD_EVALUATION':
      return {
        ...state,
        evaluationHistory: [...state.evaluationHistory, action.payload],
      };
      
    case 'SET_EVALUATIONS':
      return {
        ...state,
        evaluationHistory: action.payload,
      };
      
    case 'UPDATE_POSITION':
      return {
        ...state,
        currentFen: action.payload.fen,
        currentPgn: action.payload.pgn,
      };
      
    case 'SET_CURRENT_MOVE_INDEX':
      return {
        ...state,
        currentMoveIndex: action.payload,
      };
      
    case 'TOGGLE_ANALYSIS':
      return {
        ...state,
        showAnalysis: !state.showAnalysis,
      };
      
    case 'TOGGLE_EVALUATION_PANEL':
      return {
        ...state,
        showEvaluationPanel: !state.showEvaluationPanel,
      };
      
    case 'SET_GAME_FINISHED':
      return {
        ...state,
        isGameFinished: action.payload,
      };
      
    case 'SET_JUMP_TO_MOVE_FUNC':
      return {
        ...state,
        jumpToMoveFunc: action.payload,
      };
      
    case 'RESET_TRAINING':
      return {
        ...optimizedInitialState,
        currentPosition: state.currentPosition,
        currentFen: state.currentPosition?.fen || '',
        showAnalysis: state.showAnalysis,
        showEvaluationPanel: state.showEvaluationPanel,
      };
      
    default:
      return state;
  }
};

const OptimizedTrainingContext = createContext<{
  state: OptimizedTrainingState;
  dispatch: React.Dispatch<OptimizedTrainingAction>;
  // Helper functions for transient Chess.js operations
  getCurrentGame: () => Chess;
  getGameAtMove: (moveIndex: number) => Chess;
  makeMove: (moveNotation: string) => { success: boolean; fen: string; pgn: string };
} | undefined>(undefined);

interface OptimizedTrainingProviderProps {
  children: ReactNode;
}

export const OptimizedTrainingProvider: React.FC<OptimizedTrainingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(optimizedTrainingReducer, optimizedInitialState);

  // Helper function: Create Chess.js instance at current position
  const getCurrentGame = React.useCallback((): Chess => {
    const game = new Chess();
    if (state.currentPosition) {
      game.load(state.currentPosition.fen);
      // Apply move history
      for (const moveStr of state.moveHistory) {
        try {
          game.move(moveStr);
        } catch (error) {
          console.warn('[OptimizedTrainingContext] Invalid move in history:', moveStr);
          break;
        }
      }
    }
    return game;
  }, [state.currentPosition, state.moveHistory]);

  // Helper function: Create Chess.js instance at specific move index
  const getGameAtMove = React.useCallback((moveIndex: number): Chess => {
    const game = new Chess();
    if (state.currentPosition) {
      game.load(state.currentPosition.fen);
      // Apply moves up to moveIndex
      const movesToApply = state.moveHistory.slice(0, moveIndex + 1);
      for (const moveStr of movesToApply) {
        try {
          game.move(moveStr);
        } catch (error) {
          console.warn('[OptimizedTrainingContext] Invalid move at index:', moveIndex, moveStr);
          break;
        }
      }
    }
    return game;
  }, [state.currentPosition, state.moveHistory]);

  // Helper function: Make a move and return new state data
  const makeMove = React.useCallback((moveNotation: string): { success: boolean; fen: string; pgn: string } => {
    try {
      const game = getCurrentGame();
      const move = game.move(moveNotation);
      
      if (move) {
        return {
          success: true,
          fen: game.fen(),
          pgn: game.pgn()
        };
      } else {
        return {
          success: false,
          fen: state.currentFen,
          pgn: state.currentPgn
        };
      }
    } catch (error) {
      console.warn('[OptimizedTrainingContext] Move failed:', moveNotation, error);
      return {
        success: false,
        fen: state.currentFen,
        pgn: state.currentPgn
      };
    }
  }, [getCurrentGame, state.currentFen, state.currentPgn]);

  const contextValue = React.useMemo(() => ({
    state,
    dispatch,
    getCurrentGame,
    getGameAtMove,
    makeMove
  }), [state, dispatch, getCurrentGame, getGameAtMove, makeMove]);

  return (
    <OptimizedTrainingContext.Provider value={contextValue}>
      {children}
    </OptimizedTrainingContext.Provider>
  );
};

export const useOptimizedTraining = () => {
  const context = useContext(OptimizedTrainingContext);
  if (context === undefined) {
    throw new Error('useOptimizedTraining must be used within an OptimizedTrainingProvider');
  }
  return context;
};

// Backward compatibility hook that provides the same interface as the original
export const useTrainingOptimized = () => {
  const { state, dispatch, getCurrentGame, getGameAtMove, makeMove } = useOptimizedTraining();
  
  // Transform the optimized state to match the original interface when needed
  const compatibleState = React.useMemo(() => {
    // Lazily compute Move objects only when accessed
    const moves = React.useMemo(() => {
      if (state.moveHistory.length === 0) return [];
      
      try {
        const game = new Chess();
        if (state.currentPosition) {
          game.load(state.currentPosition.fen);
        }
        
        const moveObjects = [];
        for (const moveStr of state.moveHistory) {
          try {
            const move = game.move(moveStr);
            if (move) {
              moveObjects.push(move);
            }
          } catch (error) {
            console.warn('[TrainingOptimized] Failed to convert move string to object:', moveStr);
            break;
          }
        }
        return moveObjects;
      } catch (error) {
        console.warn('[TrainingOptimized] Failed to compute move objects:', error);
        return [];
      }
    }, [state.moveHistory, state.currentPosition]);

    // Transform evaluations to match original interface
    const evaluations = state.evaluationHistory.map(evalItem => ({
      evaluation: evalItem.score / 100, // Convert centipawns to pawns
      mateInMoves: evalItem.mate
    }));

    return {
      ...state,
      moves,           // Computed Move objects (lazy)
      evaluations,     // Transformed evaluations
      moveHistory: state.moveHistory,     // Keep optimized version available
      evaluationHistory: state.evaluationHistory // Keep optimized version available
    };
  }, [state]);

  return {
    state: compatibleState,
    dispatch,
    getCurrentGame,
    getGameAtMove,
    makeMove
  };
};