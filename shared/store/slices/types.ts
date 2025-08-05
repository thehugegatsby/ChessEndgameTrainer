/**
 * @file Slice type definitions for the refactored store architecture
 * @description Defines the structure and interfaces for each store slice
 */

import { StateCreator } from "zustand";
import {
  UIState,
  Toast,
  ModalType,
  LoadingState,
  AnalysisPanelState,
  AnalysisStatus,
} from "../types";
import { ValidatedMove, ChessInstance } from "@shared/types/chess";
import { PositionAnalysis } from "@shared/types/evaluation";
import { EndgamePosition } from "@shared/types/endgame";
import { Move as ChessJsMove } from "chess.js";
import type { TrainingPosition } from "./trainingSlice";

/**
 * Game slice - Pure chess game state
 */
export interface GameState {
  game?: ChessInstance;
  currentFen: string;
  currentPgn: string;
  moveHistory: ValidatedMove[];
  currentMoveIndex: number;
  isGameFinished: boolean;
  gameResult?: string | null;
}

export interface GameActions {
  // State management
  setGame: (game: ChessInstance) => void;
  updatePosition: (fen: string, pgn: string) => void;
  addMove: (move: ValidatedMove) => void;
  setMoveHistory: (moves: ValidatedMove[]) => void;
  setCurrentMoveIndex: (index: number) => void;
  setGameFinished: (finished: boolean) => void;
  resetGame: () => void;

  // Game operations
  initializeGame: (fen: string) => ChessInstance | null;
  makeMove: (
    move:
      | ChessJsMove
      | { from: string; to: string; promotion?: string }
      | string,
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
}

/**
 * Tablebase slice - API interactions and caching
 */
export interface TablebaseState {
  tablebaseMove?: string | null;
  analysisStatus: AnalysisStatus;
  evaluations: PositionAnalysis[];
  currentEvaluation?: PositionAnalysis;
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
  nextPosition?: TrainingPosition | null | undefined;
  previousPosition?: TrainingPosition | null | undefined;
  isLoadingNavigation: boolean;
  navigationError: string | null;
  chapterProgress: {
    completed: number;
    total: number;
  } | null;
  isPlayerTurn: boolean;
  isSuccess: boolean;
  sessionStartTime?: number;
  sessionEndTime?: number;
  hintsUsed: number;
  mistakeCount: number;
}

export interface TrainingActions {
  setPosition: (position: TrainingPosition) => void;
  setNavigationPositions: (
    next?: TrainingPosition | null,
    previous?: TrainingPosition | null,
  ) => void;
  setNavigationLoading: (loading: boolean) => void;
  setNavigationError: (error: string | null) => void;
  setChapterProgress: (
    progress: { completed: number; total: number } | null,
  ) => void;
  setPlayerTurn: (isPlayerTurn: boolean) => void;
  completeTraining: (success: boolean) => void;
  incrementHint: () => void;
  incrementMistake: () => void;
  addTrainingMove: (move: ValidatedMove) => void;
  resetTraining: () => void;
  resetPosition: () => void;
}

/**
 * UI slice actions
 */
export interface UIActions {
  toggleSidebar: () => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
  showToast: (message: string, type: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  updateAnalysisPanel: (update: Partial<AnalysisPanelState>) => void;
  setMoveErrorDialog: (
    dialog: {
      isOpen: boolean;
      wdlBefore?: number;
      wdlAfter?: number;
      bestMove?: string;
    } | null,
  ) => void;
}

/**
 * Combined slice types
 */
// UserSlice removed - was over-engineered and unused in UI
export type GameSlice = GameState & GameActions;
export type TablebaseSlice = TablebaseState & TablebaseActions;
export type TrainingSlice = TrainingState & TrainingActions;
// ProgressSlice removed - was over-engineered and unused in UI
export type UISlice = UIState & UIActions;
// SettingsSlice removed - was over-engineered and unused in UI

/**
 * Base state combining all slices
 */
type BaseState = GameSlice & TablebaseSlice & TrainingSlice & UISlice;

/**
 * Root state combining all slices with orchestrator actions
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
export type ImmerStateCreator<T> = StateCreator<
  RootState,
  [["zustand/immer", never]],
  [],
  T
>;

/**
 * Async actions that orchestrate across slices
 */
export interface AsyncActions {
  handlePlayerMove: (
    move:
      | ChessJsMove
      | { from: string; to: string; promotion?: string }
      | string,
  ) => Promise<boolean>;
  handleOpponentTurn: () => Promise<void>;
  requestPositionEvaluation: (fen?: string) => Promise<void>;
  loadTrainingContext: (position: EndgamePosition) => Promise<void>;
}

/**
 * Complete actions interface
 */
export type Actions = GameActions &
  TablebaseActions &
  TrainingActions &
  UIActions &
  AsyncActions & {
    reset: () => void;
    hydrate: (state: Partial<RootState>) => void;
  };
