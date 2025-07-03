import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Move } from 'chess.js';
import { EndgamePosition } from '../data/endgames';

interface EvaluationData {
  evaluation: number;
  mateInMoves?: number;
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
  isGameFinished: false,
  jumpToMoveFunc: null,
};

const trainingReducer = (state: TrainingState, action: TrainingAction): TrainingState => {
  switch (action.type) {
    case 'SET_POSITION':
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
      return {
        ...state,
        moves: [...state.moves, action.payload],
      };
    case 'SET_MOVES':
      return {
        ...state,
        moves: action.payload,
      };
    case 'ADD_EVALUATION':
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
        ...initialState,
        currentPosition: state.currentPosition,
        currentFen: state.currentPosition?.fen || '',
        showAnalysis: state.showAnalysis,
        showEvaluationPanel: state.showEvaluationPanel,
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

export const TrainingProvider: React.FC<TrainingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(trainingReducer, initialState);

  return (
    <TrainingContext.Provider value={{ state, dispatch }}>
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = () => {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
}; 