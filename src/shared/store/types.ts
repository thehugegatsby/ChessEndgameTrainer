/**
 * Global state management types
 * Defines the shape of the application state and actions
 */

import { type ValidatedMove, type ChessInstance } from '../types';
import { type Move as ChessJsMove } from 'chess.js';

import { type PositionAnalysis } from '../types/evaluation';

import { type EndgamePosition } from '../types/endgame';
import { type MoveSuccessDialog } from '@shared/store/orchestrators/handlePlayerMove/move.types';

// User state
/**
 *
 */
export interface UserState {
  id?: string;
  username?: string;
  email?: string;
  rating: number;
  completedPositions: number[];
  currentStreak: number;
  totalTrainingTime: number;
  lastActiveDate: string;
  preferences: UserPreferences;
}

/**
 *
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  boardOrientation: 'white' | 'black';
  pieceTheme: string;
  autoPromoteToQueen: boolean;
  showCoordinates: boolean;
  showLegalMoves: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'none';
}

// Endgame session state
/**
 * State for endgame training sessions
 * @interface EndgameSessionState
 */
export interface EndgameSessionState {
  currentPosition?: EndgamePosition;
  nextPosition?: EndgamePosition | null;
  previousPosition?: EndgamePosition | null;
  isLoadingNavigation?: boolean;
  navigationError?: string | null;
  chapterProgress?: {
    completed: number;
    total: number;
  } | null;
  game?: ChessInstance;
  moveHistory: ValidatedMove[];
  tablebaseMove?: string | null | undefined;
  evaluations: PositionAnalysis[];
  isPlayerTurn: boolean;
  isGameFinished: boolean;
  isSuccess: boolean;
  startTime?: number;
  endTime?: number;
  hintsUsed: number;
  mistakeCount: number;
  currentEvaluation?: PositionAnalysis | undefined;
  analysisStatus: AnalysisStatus;
  currentFen?: string;
  currentPgn?: string;
  currentMoveIndex?: number;
  moveErrorDialog?: {
    isOpen: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    bestMove?: string;
  } | null;
}

// Complete endgame session state combining all aspects
export interface CompleteEndgameSessionState {
  gameState: GameState;
  tablebaseAnalysisState: TablebaseAnalysisState;
}

// TrainingState removed - use EndgameSessionState instead

/**
 * Pure chess game state (domain-agnostic)
 * @interface GameState
 */
export interface GameState {
  game?: ChessInstance;
  currentFen: string;
  currentPgn: string;
  moveHistory: ValidatedMove[];
  currentMoveIndex: number;
  isGameFinished: boolean;
}

/**
 * Tablebase analysis state
 * @interface TablebaseAnalysisState
 */
export interface TablebaseAnalysisState {
  tablebaseMove?: string | null | undefined;
  analysisStatus: AnalysisStatus;
  evaluations: PositionAnalysis[];
  currentEvaluation?: PositionAnalysis | undefined;
}

// EndgameTrainingState removed - replaced by TrainingState in slices/types.ts

/**
 *
 */
export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

// Progress state
/**
 *
 */
export interface ProgressState {
  positionProgress: Record<number, PositionProgress>;
  dailyStats: DailyStats[];
  achievements: Achievement[];
  totalSolvedPositions: number;
  averageAccuracy: number;
  favoritePositions: number[];
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: number;
  totalPoints: number;
  weeklyGoals: {
    target: number;
    completed: number;
    weekStart: number;
  };
  monthlyStats: {
    positionsCompleted: number;
    totalTime: number;
    averageAccuracy: number;
    hintsUsed: number;
    mistakesMade: number;
    monthStart: number;
  };
}

/**
 *
 */
export interface PositionProgress {
  positionId: number;
  attempts: number;
  completed: boolean;
  accuracy: number;
  bestTime?: number;
  lastAttempt?: number;
  nextReview?: number;
  lastReview?: number;
  difficulty: number;
  reviewInterval?: number;
  hintsUsed?: number;
  mistakesMade?: number;
  success?: boolean;
}

/**
 *
 */
export interface DailyStats {
  date: number;
  positionsCompleted: number;
  totalTime: number;
  averageAccuracy: number;
  mistakesMade: number;
  hintsUsed: number;
}

/**
 *
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedDate?: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  points: number;
  category: 'streak' | 'completion' | 'performance' | 'discovery' | 'mastery';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
}

// UI state
/**
 *
 */
export interface UIState {
  isSidebarOpen: boolean;
  currentModal: ModalType | null;
  toasts: Toast[];
  loading: LoadingState;
  analysisPanel: AnalysisPanelState;
  tablebaseData?: {
    fen: string;
    evaluation: {
      outcome: 'win' | 'draw' | 'loss';
      dtm?: number;
      dtz?: number;
    };
    moves?: Array<{
      uci: string;
      san: string;
      outcome: 'win' | 'draw' | 'loss';
      dtm?: number;
    }>;
    isLoading: boolean;
    lastUpdated: number;
  };
}

/**
 *
 */
export type ModalType = 'settings' | 'help' | 'achievements' | 'share' | 'confirm' | 'completion';

/**
 *
 */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

/**
 *
 */
export interface LoadingState {
  global: boolean;
  tablebase: boolean;
  position: boolean;
  analysis: boolean;
}

/**
 *
 */
export interface AnalysisPanelState {
  isOpen: boolean;
  activeTab: 'moves' | 'evaluation' | 'variations';
  showTablebase: boolean;
}

// Settings state
/**
 *
 */
export interface SettingsState {
  // Essential settings only
  restartRequired: boolean;
  lastSettingsUpdate?: number;
}

/**
 *
 */
export interface DataSyncState {
  enabled: boolean;
  lastSync?: number;
  syncInProgress: boolean;
  syncError?: string | null;
  autoSync: boolean;
  syncInterval: number;
}

/**
 *
 */
export interface ExperimentalFeatures {
  newTrainingMode: boolean;
  advancedAnalytics: boolean;
  voiceCommands: boolean;
  aiCoach: boolean;
  multiplePerspective: boolean;
}

// Root state
/**
 *
 */
export interface RootState {
  user: UserState;
  training: EndgameSessionState;
  progress: ProgressState;
  ui: UIState;
  settings: SettingsState;

  // Internal action references (used to prevent Immer stripping)
  _trainingActions?: TrainingActions;
  _tablebaseActions?: Record<string, (...args: unknown[]) => void>;
}

// Action types
/**
 *
 */
export interface UserActions {
  setUser: (user: Partial<UserState>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addCompletedPosition: (positionId: number) => void;
}

/**
 *
 */
export interface TrainingActions {
  setPosition: (position: EndgamePosition) => void;
  loadTrainingContext: (position: EndgamePosition) => Promise<void>;
  setGame: (game: ChessInstance) => void;
  makeUserMove: (
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string
  ) => Promise<boolean>;
  applyMove: (move: ChessJsMove | { from: string; to: string; promotion?: string }) => void;
  undoMove: () => void;
  resetPosition: () => void;
  setEvaluation: (evaluation: PositionAnalysis) => void;
  setEvaluations: (evaluations: PositionAnalysis[]) => void;
  setAnalysisStatus: (status: AnalysisStatus) => void;
  completeTraining: (success: boolean) => void;
  incrementHint: () => void;
  incrementMistake: () => void;
  setMoveErrorDialog: (
    dialogState: {
      isOpen: boolean;
      wdlBefore?: number;
      wdlAfter?: number;
      bestMove?: string;
    } | null
  ) => void;
  setMoveSuccessDialog: (dialog: MoveSuccessDialog | null) => void;
  // Navigation actions
  goToMove: (moveIndex: number) => void;
  goToFirst: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToLast: () => void;
}

/**
 *
 */
export interface ProgressActions {
  updatePositionProgress: (positionId: number, update: Partial<PositionProgress>) => void;
  addDailyStats: (stats: Partial<DailyStats>) => void;
  unlockAchievement: (achievementId: string) => void;
  toggleFavorite: (positionId: number) => void;
  calculateNextReview: (positionId: number, success: boolean) => void;
}

/**
 *
 */
export interface UIActions {
  toggleSidebar: () => void;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
  showToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  updateAnalysisPanel: (update: Partial<AnalysisPanelState>) => void;
}

/**
 *
 */
export interface SettingsActions {
  updateSettings: (settings: Partial<SettingsState>) => void;
  toggleExperimentalFeature: (feature: keyof ExperimentalFeatures) => void;
  startSync: () => void;
  completeSync: (success: boolean, error?: string) => void;
}

// Combined actions
/**
 *
 */
export interface Actions
  extends UserActions,
    TrainingActions,
    ProgressActions,
    UIActions,
    SettingsActions {
  reset: () => void;
  hydrate: (state: Partial<RootState>) => void;
}
