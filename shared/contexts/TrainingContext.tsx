/**
 * @fileoverview Central Training State Management
 * @description Global state for chess training sessions using React Context
 * 
 * AI_NOTE: This is the MAIN STATE CONTAINER for training!
 * - Used by ALL training components
 * - Contains game state, evaluations, UI toggles
 * - Heavy reducer with 12+ action types
 * 
 * ARCHITECTURE DECISION: Using Context instead of Zustand
 * - Zustand is installed but unused (tech debt)
 * - Context re-renders can be expensive with deep state
 * - Consider migration to Zustand for performance
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Move } from 'chess.js';
import { EndgamePosition } from '../data/endgames';

interface EvaluationData {
  evaluation: number;
  mateInMoves?: number;
  tablebase?: {
    isTablebasePosition: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    category?: string;
    dtz?: number;
  };
}

interface TrainingState {
  currentPosition: EndgamePosition | null;
  moves: Move[];
  evaluations: EvaluationData[];
  currentFen: string;
  currentPgn: string;
  currentMoveIndex: number;
  showAnalysis: boolean;
  showEvaluationPanel: boolean;
  showEngineEvaluation: boolean;
  showTablebaseEvaluation: boolean;
  isGameFinished: boolean;
  jumpToMoveFunc: ((moveIndex: number) => void) | null;
}

type TrainingAction =
  | { type: 'SET_POSITION'; payload: EndgamePosition }
  | { type: 'ADD_MOVE'; payload: Move }
  | { type: 'SET_MOVES'; payload: Move[] }
  | { type: 'ADD_EVALUATION'; payload: EvaluationData }
  | { type: 'SET_EVALUATIONS'; payload: EvaluationData[] }
  | { type: 'UPDATE_POSITION'; payload: { fen: string; pgn: string } }
  | { type: 'SET_CURRENT_MOVE_INDEX'; payload: number }
  | { type: 'TOGGLE_ANALYSIS' }
  | { type: 'TOGGLE_EVALUATION_PANEL' }
  | { type: 'TOGGLE_ENGINE_EVALUATION' }
  | { type: 'TOGGLE_TABLEBASE_EVALUATION' }
  | { type: 'SET_GAME_FINISHED'; payload: boolean }
  | { type: 'SET_JUMP_TO_MOVE_FUNC'; payload: (moveIndex: number) => void }
  | { type: 'RESET_TRAINING' };

const initialState: TrainingState = {
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
};

/**
 * Main training state reducer
 * 
 * AI_NOTE: HEAVY REDUCER with many actions!
 * - 12+ action types, each triggers re-render
 * - State updates are IMMUTABLE (spread operator)
 * - Some actions have SIDE EFFECTS (see comments)
 * 
 * PERFORMANCE ISSUE: Every state change re-renders ALL consumers
 * Consider splitting into smaller contexts or using Zustand
 */
const trainingReducer = (state: TrainingState, action: TrainingAction): TrainingState => {
  switch (action.type) {
    case 'SET_POSITION':
      // AI_NOTE: FULL RESET of game state when position changes
      // This clears moves, evaluations, everything!
      return {
        ...state,
        currentPosition: action.payload,
        currentFen: action.payload.fen,
        moves: [],
        evaluations: [],
        currentPgn: '',
        currentMoveIndex: -1,
        isGameFinished: false,
      };
    case 'ADD_MOVE':
      // AI_NOTE: Appends to move array - triggers re-render!
      // Used after each chess move to build game history
      return {
        ...state,
        moves: [...state.moves, action.payload],
      };
    case 'SET_MOVES':
      // AI_NOTE: REPLACES entire move array
      // Used when jumping to different positions in game history
      return {
        ...state,
        moves: action.payload,
      };
    case 'ADD_EVALUATION':
      // AI_NOTE: Stores engine/tablebase evaluation after each move
      // Array index corresponds to move index
      return {
        ...state,
        evaluations: [...state.evaluations, action.payload],
      };
    case 'SET_EVALUATIONS':
      return {
        ...state,
        evaluations: action.payload,
      };
    case 'UPDATE_POSITION':
      // AI_NOTE: Updates board state without clearing history
      // FEN = current position, PGN = game notation
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
    case 'TOGGLE_ENGINE_EVALUATION':
      // AI_NOTE: AUTO-SHOWS panel when enabling engine!
      // This is UX convenience - engine eval needs panel visible
      return {
        ...state,
        showEngineEvaluation: !state.showEngineEvaluation,
        // If turning on engine, also turn on the panel
        showEvaluationPanel: !state.showEngineEvaluation ? true : state.showEvaluationPanel,
      };
    case 'TOGGLE_TABLEBASE_EVALUATION':
      // AI_NOTE: AUTO-SHOWS panel when enabling tablebase!
      // Same UX pattern as engine toggle
      return {
        ...state,
        showTablebaseEvaluation: !state.showTablebaseEvaluation,
        // If turning on tablebase, also turn on the panel
        showEvaluationPanel: !state.showTablebaseEvaluation ? true : state.showEvaluationPanel,
      };
    case 'SET_GAME_FINISHED':
      return {
        ...state,
        isGameFinished: action.payload,
      };
    case 'SET_JUMP_TO_MOVE_FUNC':
      // AI_NOTE: WEIRD PATTERN - storing a function in state!
      // This is a callback from TrainingBoard for move navigation
      // TODO: This should be a ref or separate context
      return {
        ...state,
        jumpToMoveFunc: action.payload,
      };
    case 'RESET_TRAINING':
      // AI_NOTE: PARTIAL RESET - keeps position and UI preferences!
      // Clears moves/evaluations but preserves:
      // - Current endgame position
      // - User's UI toggle preferences
      // Used when restarting same position
      return {
        ...initialState,
        currentPosition: state.currentPosition,
        currentFen: state.currentPosition?.fen || '',
        showAnalysis: state.showAnalysis,
        showEvaluationPanel: state.showEvaluationPanel,
        showEngineEvaluation: state.showEngineEvaluation,
        showTablebaseEvaluation: state.showTablebaseEvaluation,
      };
    default:
      return state;
  }
};

const TrainingContext = createContext<{
  state: TrainingState;
  dispatch: React.Dispatch<TrainingAction>;
} | undefined>(undefined);

interface TrainingProviderProps {
  children: ReactNode;
}

/**
 * Training Context Provider
 * 
 * AI_NOTE: WRAPS entire training UI!
 * - No memoization = every dispatch re-renders ALL children
 * - Consider React.memo() on heavy child components
 * - Or migrate to Zustand for selective subscriptions
 */
export const TrainingProvider: React.FC<TrainingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(trainingReducer, initialState);

  // AI_NOTE: Could memoize context value to prevent re-renders
  // const value = useMemo(() => ({ state, dispatch }), [state]);
  
  return (
    <TrainingContext.Provider value={{ state, dispatch }}>
      {children}
    </TrainingContext.Provider>
  );
};

/**
 * Hook for accessing training state
 * 
 * AI_NOTE: EVERY component using this re-renders on ANY state change!
 * - Even if they only read one field (e.g., just currentFen)
 * - Major performance bottleneck in complex UIs
 * 
 * OPTIMIZATION IDEAS:
 * 1. Split into multiple contexts (UIContext, GameContext, etc.)
 * 2. Use selector pattern: useTraining(state => state.moves)
 * 3. Migrate to Zustand with built-in selectors
 */
export const useTraining = () => {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
}; 