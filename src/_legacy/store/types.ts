/**
 * Global state management types
 * Defines the shape of the application state and actions
 */

// No imports needed - all interfaces moved to slices/types.ts or deprecated

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

// DEPRECATED: EndgameSessionState removed - replaced by TrainingSlice in slices/types.ts
// DEPRECATED: CompleteEndgameSessionState removed - replaced by slice-based architecture

// TrainingState removed - use EndgameSessionState instead

// DEPRECATED: GameState removed - replaced by GameState in slices/types.ts

// DEPRECATED: TablebaseAnalysisState removed - replaced by TablebaseState in slices/types.ts

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

// DEPRECATED: Old RootState removed - replaced by slice-based RootState in slices/types.ts

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

// DEPRECATED: TrainingActions removed - replaced by TrainingActions in slices/types.ts

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

// DEPRECATED: Old Actions interface removed - replaced by slice-based actions in slices/types.ts
