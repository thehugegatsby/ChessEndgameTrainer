/**
 * @file Slice type definitions for the refactored store architecture
 * @description Defines the structure and interfaces for each store slice
 */

import { type StateCreator } from 'zustand';
import type { MoveResult, GameStatus } from '@shared/utils/chess-logic';
import {
  type UIState,
  type Toast,
  type ModalType,
  type LoadingState,
  type AnalysisPanelState,
  type AnalysisStatus,
} from '../types';

// Re-export UIState for external use
export type { UIState };
import { type ValidatedMove } from '@shared/types/chess';
import { type PositionAnalysis } from '@shared/types/evaluation';
import { type EndgamePosition } from '@shared/types/endgame';
import { type Move as ChessJsMove } from 'chess.js';
import type { TrainingPosition } from './trainingSlice';

/**
 * Game slice - Pure chess game state
 */
export interface GameState {
  // Chess instance removed - created on-demand from currentFen
  currentFen: string;
  currentPgn: string;
  moveHistory: ValidatedMove[];
  currentMoveIndex: number;
  isGameFinished: boolean;
  gameResult?: string | null;
  // Game status flags
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
}

export interface GameActions {
  // State management
  // setGame removed - Chess instances created on-demand
  updatePosition: (fen: string, pgn: string) => void;
  addMove: (move: ValidatedMove) => void;
  setMoveHistory: (moves: ValidatedMove[]) => void;
  setCurrentMoveIndex: (index: number) => void;
  setGameFinished: (finished: boolean) => void;
  setGameStatus: (isCheckmate: boolean, isDraw: boolean, isStalemate: boolean) => void;
  resetGame: () => void;

  // Game operations
  initializeGame: (fen: string) => boolean;
  makeMove: (
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string
  ) => ValidatedMove | null;
  applyMove: (
    move: { from: string; to: string; promotion?: string } | string
  ) => ValidatedMove | null;
  undoMove: () => boolean;
  redoMove: () => boolean;

  // Navigation
  goToMove: (moveIndex: number) => boolean;
  goToFirst: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToLast: () => void;

  // State
  setCurrentFen: (fen: string) => void;

  // Pure function actions (ChessService replacement)
  makeMovePure: (move: { from: string; to: string; promotion?: string } | string) => MoveResult | null;
  validateMovePure: (move: { from: string; to: string; promotion?: string } | string) => boolean;
  getGameStatusPure: () => GameStatus | null;
  getPossibleMovesPure: (square?: string) => ChessJsMove[];
  goToMovePure: (targetIndex: number) => boolean;
  initializeGamePure: (fen: string) => boolean;
  resetGamePure: () => void;
}

/**
 * Tablebase slice - API interactions and caching
 */
export interface TablebaseState {
  tablebaseMove?: string | null | undefined;
  analysisStatus: AnalysisStatus;
  evaluations: PositionAnalysis[];
  currentEvaluation?: PositionAnalysis | undefined;
}

export interface TablebaseActions {
  setTablebaseMove: (move: string | null | undefined) => void;
  setAnalysisStatus: (status: AnalysisStatus) => void;
  addEvaluation: (evaluation: PositionAnalysis) => void;
  setEvaluations: (evaluations: PositionAnalysis[]) => void;
  setCurrentEvaluation: (evaluation: PositionAnalysis | undefined) => void;
  clearTablebaseState: () => void;
}

/**
 * Training slice - Training session specific state
 */
export interface TrainingState {
  currentPosition?: TrainingPosition;
  nextPosition?: TrainingPosition | null;
  previousPosition?: TrainingPosition | null;
  isLoadingNavigation: boolean;
  navigationError: string | null;
  chapterProgress: {
    completed: number;
    total: number;
  } | null;
  isPlayerTurn: boolean;
  isOpponentThinking: boolean; // New flag to prevent race conditions
  moveInFlight: boolean; // Prevents double-processing of rapid clicks
  isSuccess: boolean;
  hintsUsed: number;
  mistakeCount: number;
  currentStreak: number;
  bestStreak: number;
  showCheckmark: boolean;
  autoProgressEnabled: boolean;
  moveErrorDialog: {
    isOpen: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    bestMove?: string;
    playedMove?: string;
    moveNumber?: number;
  } | null;
  moveSuccessDialog: {
    isOpen: boolean;
    promotionPiece?: string;
    moveDescription?: string;
  } | null;
  evaluationBaseline: {
    wdl: number | null;
    fen: string | null;
    timestamp: number | null;
  } | null;
}

export interface TrainingActions {
  setPosition: (position: TrainingPosition) => void;
  setNavigationPositions: (
    next?: TrainingPosition | null,
    previous?: TrainingPosition | null
  ) => void;
  setNavigationLoading: (loading: boolean) => void;
  setNavigationError: (error: string | null) => void;
  setChapterProgress: (progress: { completed: number; total: number } | null) => void;
  setPlayerTurn: (isPlayerTurn: boolean) => void;
  clearOpponentThinking: () => void;
  completeTraining: (success: boolean) => void;
  incrementHint: () => void;
  incrementMistake: () => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  showCheckmarkAnimation: (duration?: number) => void;
  setAutoProgressEnabled: (enabled: boolean) => void;
  setMoveErrorDialog: (
    dialog: {
      isOpen: boolean;
      wdlBefore?: number;
      wdlAfter?: number;
      bestMove?: string;
    } | null
  ) => void;
  setMoveSuccessDialog: (
    dialog: {
      isOpen: boolean;
      promotionPiece?: string;
      moveDescription?: string;
    } | null
  ) => void;
  addTrainingMove: (move: ValidatedMove) => void;
  resetTraining: () => void;
  resetPosition: () => void;
  setEvaluationBaseline: (wdl: number, fen: string) => void;
  clearEvaluationBaseline: () => void;
}

/**
 * UI slice actions
 */
export interface UIActions {
  toggleSidebar: () => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
  showToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  updateAnalysisPanel: (update: Partial<AnalysisPanelState>) => void;
}

/**
 * Combined slice types
 */
// UserSlice removed - was over-engineered and unused in UI
export type GameSlice = GameState & GameActions;
export type TablebaseSlice = TablebaseState & TablebaseActions;
export type TrainingSlice = TrainingState & TrainingActions;
export type UISlice = UIState & UIActions;
// SettingsSlice removed - was over-engineered and unused in UI

/**
 * Base state with nested structure
 */
type BaseState = {
  game: GameSlice;
  training: TrainingSlice;
  tablebase: TablebaseSlice;
  ui: UISlice;
};

/**
 * Root state combining nested slices with orchestrator actions
 *
 * @remarks
 * With Slice-in-Slice pattern, CRITICAL FIX workarounds are eliminated.
 * Actions are preserved directly within each slice.
 */
export type RootState = BaseState &
  AsyncActions & {
    reset: () => void;
    hydrate: (state: Partial<BaseState>) => void;
  };

/**
 * Store creator type with middleware
 */
export type StoreCreator<T> = StateCreator<RootState, [], [], T>;

/**
 * Immer-aware state creator for slice pattern with middleware
 * This correctly types the immer middleware's mutative state updates
 */
export type ImmerStateCreator<T> = StateCreator<RootState, [['zustand/immer', never]], [], T>;

/**
 * Async actions that orchestrate across slices
 */
export interface AsyncActions {
  handlePlayerMove: (
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string
  ) => Promise<boolean>;
  // handleOpponentTurn and requestPositionEvaluation removed - functionality moved to chessService
  loadTrainingContext: (position: EndgamePosition) => Promise<void>;
}

/**
 * Complete actions interface
 */
export type Actions = AsyncActions & {
  reset: () => void;
  hydrate: (state: Partial<RootState>) => void;
};
