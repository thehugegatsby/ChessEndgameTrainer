/**
 * @file Slice type definitions for the refactored store architecture
 * @description Defines the structure and interfaces for each store slice
 */

import { StateCreator } from "zustand";
import {
  UserState,
  ProgressState,
  UIState,
  SettingsState,
  UserPreferences,
  Toast,
  ModalType,
  LoadingState,
  AnalysisPanelState,
  PositionProgress,
  DailyStats,
  ExperimentalFeatures,
  AnalysisStatus,
} from "../types";
import { ValidatedMove, ChessInstance } from "@shared/types/chess";
import { PositionAnalysis } from "@shared/types/evaluation";
import { EndgamePosition } from "@shared/types/endgame";
import { Move as ChessJsMove } from "chess.js";
import type { TrainingPosition } from "./trainingSlice";

/**
 * User slice actions
 */
export interface UserActions {
  setUser: (user: Partial<UserState>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addCompletedPosition: (positionId: number) => void;
  updateLastActive: () => void;
  clearUser: () => void;
}

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
  setEvaluation: (evaluation: PositionAnalysis | undefined) => void; // Alias for backward compatibility
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
  moveErrorDialog: {
    isOpen: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    bestMove?: string;
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
  completeTraining: (success: boolean) => void;
  useHint: () => void;
  incrementMistake: () => void;
  setMoveErrorDialog: (dialog: TrainingState["moveErrorDialog"] | null) => void;
  addTrainingMove: (move: any) => void;
  resetTraining: () => void;
  resetPosition: () => void;
}

/**
 * Progress slice actions
 */
export interface ProgressActions {
  updatePositionProgress: (
    positionId: number,
    update: Partial<PositionProgress>,
  ) => void;
  addDailyStats: (stats: Partial<DailyStats>) => void;
  unlockAchievement: (achievementId: string) => void;
  toggleFavorite: (positionId: number) => void;
  calculateNextReview: (positionId: number, success: boolean) => void;
  initializeAchievements: (achievements: any[]) => void;
  updateWeeklyGoals: (completed: number, target?: number) => void;
  updateMonthlyStats: (stats: any) => void;
  updateStreak: (newStreak: number, lastActivity?: number) => void;
  resetProgress: () => void;
}

/**
 * UI slice actions
 */
export interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
  showToast: (message: string, type: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  updateAnalysisPanel: (update: Partial<AnalysisPanelState>) => void;
}

/**
 * Settings slice actions
 */
export interface SettingsActions {
  updateSettings: (settings: Partial<SettingsState>) => void;
  toggleExperimentalFeature: (feature: keyof ExperimentalFeatures) => void;
  startSync: () => void;
  completeSync: (success: boolean, error?: string) => void;
  resetSettings: () => void;
  updateTheme: (themeUpdate: Partial<SettingsState["theme"]>) => void;
  updateNotifications: (
    notificationUpdate: Partial<SettingsState["notifications"]>,
  ) => void;
  updateDifficulty: (
    difficultyUpdate: Partial<SettingsState["difficulty"]>,
  ) => void;
  updatePrivacy: (privacyUpdate: Partial<SettingsState["privacy"]>) => void;
  clearRestartRequired: () => void;
}

/**
 * Combined slice types
 */
export type UserSlice = UserState & UserActions;
export type GameSlice = GameState & GameActions;
export type TablebaseSlice = TablebaseState & TablebaseActions;
export type TrainingSlice = TrainingState & TrainingActions;
export type ProgressSlice = ProgressState & ProgressActions;
export type UISlice = UIState & UIActions;
export type SettingsSlice = SettingsState & SettingsActions;

/**
 * Base state combining all slices
 */
type BaseState = UserSlice &
  GameSlice &
  TablebaseSlice &
  TrainingSlice &
  ProgressSlice &
  UISlice &
  SettingsSlice;

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
export type Actions = UserActions &
  GameActions &
  TablebaseActions &
  TrainingActions &
  ProgressActions &
  UIActions &
  SettingsActions &
  AsyncActions & {
    reset: () => void;
    hydrate: (state: Partial<RootState>) => void;
  };
