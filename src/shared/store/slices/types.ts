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

// Re-export UIState for external use
export type { UIState };
import { ValidatedMove } from "@shared/types/chess";
import { PositionAnalysis } from "@shared/types/evaluation";
import { EndgamePosition } from "@shared/types/endgame";
import { Move as ChessJsMove } from "chess.js";
import type { TrainingPosition } from "./trainingSlice";

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
    move:
      | ChessJsMove
      | { from: string; to: string; promotion?: string }
      | string,
  ) => ValidatedMove | null;
  applyMove: (
    move: { from: string; to: string; promotion?: string } | string,
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
  isOpponentThinking: boolean; // New flag to prevent race conditions
  isSuccess: boolean;
  sessionStartTime?: number;
  sessionEndTime?: number;
  hintsUsed: number;
  mistakeCount: number;
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
    previous?: TrainingPosition | null,
  ) => void;
  setNavigationLoading: (loading: boolean) => void;
  setNavigationError: (error: string | null) => void;
  setChapterProgress: (
    progress: { completed: number; total: number } | null,
  ) => void;
  setPlayerTurn: (isPlayerTurn: boolean) => void;
  clearOpponentThinking: () => void;
  completeTraining: (success: boolean) => void;
  incrementHint: () => void;
  incrementMistake: () => void;
  setMoveErrorDialog: (
    dialog: {
      isOpen: boolean;
      wdlBefore?: number;
      wdlAfter?: number;
      bestMove?: string;
    } | null,
  ) => void;
  setMoveSuccessDialog: (
    dialog: {
      isOpen: boolean;
      promotionPiece?: string;
      moveDescription?: string;
    } | null,
  ) => void;
  addTrainingMove: (move: ValidatedMove) => void;
  resetTraining: () => void;
  resetPosition: () => void;
  setEvaluationBaseline: (wdl: number, fen: string) => void;
  clearEvaluationBaseline: () => void;
}

/**
 * Progress slice - User progress tracking and statistics
 */
export interface ProgressState {
  // Core progress data
  userStats: UserStats | null;
  sessionProgress: SessionProgress;
  cardProgress: Record<string, CardProgress>; // Map from positionId to progress

  // Sync status
  loading: boolean;
  syncStatus: "idle" | "syncing" | "error";
  lastSync: number | null;
  syncError: string | null;
}

export interface ProgressActions {
  // State setters (synchronous)
  setUserStats: (stats: UserStats | null) => void;
  updateSessionProgress: (progress: Partial<SessionProgress>) => void;
  setLoading: (loading: boolean) => void;
  setSyncStatus: (status: "idle" | "syncing" | "error") => void;
  setLastSync: (timestamp: number | null) => void;
  setSyncError: (error: string | null) => void;

  // Card progress management (synchronous)
  initializeCards: (cards: CardProgress[]) => void;
  recordAttempt: (positionId: string, wasCorrect: boolean) => void;
  resetCardProgress: (positionId: string) => void;
  setCardProgress: (positionId: string, progress: CardProgress) => void;

  // Batch operations (synchronous)
  batchUpdateProgress: (updates: {
    userStats?: Partial<UserStats>;
    sessionProgress?: Partial<SessionProgress>;
    cardProgress?: Record<string, CardProgress>;
  }) => void;

  // Async Firebase operations
  loadUserProgress: (userId: string) => Promise<void>;
  saveUserStats: (userId: string, updates: Partial<UserStats>) => Promise<void>;
  saveCardProgress: (
    userId: string,
    positionId: string,
    progress: CardProgress,
  ) => Promise<void>;
  saveSessionComplete: (
    userId: string,
    sessionStats: Partial<UserStats>,
    cardUpdates: Array<{ positionId: string; progress: CardProgress }>,
  ) => Promise<void>;
  getDueCards: (userId: string) => Promise<CardProgress[]>;
  syncAllProgress: (userId: string) => Promise<void>;

  // Reset
  resetProgress: () => void;
}

/**
 * Progress data types
 */
export interface UserStats {
  userId: string;
  totalPositionsCompleted: number;
  overallSuccessRate: number;
  totalTimeSpent: number;
  totalHintsUsed: number;
  lastActive: number;
}

export interface SessionProgress {
  positionsCompleted: number;
  positionsCorrect: number; // For deriving success rate
  positionsAttempted: number; // For deriving success rate
  timeSpent: number;
  hintsUsed: number;
  mistakesMade: number;
}

/**
 * Individual card progress for spaced repetition
 * Field names aligned with supermemo library for compatibility
 */
export interface CardProgress {
  id: string; // Unique identifier for the card progress record
  nextReviewAt: number; // Timestamp of the next scheduled review
  lastReviewedAt: number; // Timestamp of the last review

  // SuperMemo algorithm fields (aligned with supermemo library)
  interval: number; // Number of days until next review (output from supermemo)
  repetition: number; // Number of consecutive correct responses (input/output for supermemo)
  efactor: number; // Ease factor (input/output for supermemo, typically 1.3-2.5)

  // Application-specific tracking
  lapses: number; // Number of times the card was answered incorrectly
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
}

/**
 * Combined slice types
 */
// UserSlice removed - was over-engineered and unused in UI
export type GameSlice = GameState & GameActions;
export type TablebaseSlice = TablebaseState & TablebaseActions;
export type TrainingSlice = TrainingState & TrainingActions;
export type ProgressSlice = ProgressState & ProgressActions;
export type UISlice = UIState & UIActions;
// SettingsSlice removed - was over-engineered and unused in UI

/**
 * Base state with nested structure
 */
type BaseState = {
  game: GameSlice;
  training: TrainingSlice;
  tablebase: TablebaseSlice;
  progress: ProgressSlice;
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
