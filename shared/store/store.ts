/**
 * Global state management with Zustand
 * Provides centralized state management for the entire application
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  RootState,
  Actions,
  UserState,
  TrainingState,
  ProgressState,
  UIState,
  SettingsState,
  Toast,
  ModalType,
  LoadingState,
  EngineStatus,
  PositionProgress
} from './types';
import { TRAINING, TIME } from '../constants';
import { getLogger } from '../services/logging';
import { fromLibraryMove, ChessAdapterError } from '../infrastructure/chess-adapter';
import { Move as ChessJsMove } from 'chess.js';

const logger = getLogger().setContext('Store');

// Initial states
const initialUserState: UserState = {
  rating: 1200,
  completedPositions: [],
  currentStreak: 0,
  totalTrainingTime: 0,
  lastActiveDate: new Date().toISOString(),
  preferences: {
    theme: 'dark',
    soundEnabled: true,
    notificationsEnabled: true,
    boardOrientation: 'white',
    pieceTheme: 'standard',
    autoPromoteToQueen: true,
    showCoordinates: true,
    showLegalMoves: true,
    animationSpeed: 'normal'
  }
};

const initialTrainingState: TrainingState = {
  moveHistory: [],
  evaluations: [],
  isPlayerTurn: true,
  isGameFinished: false,
  isSuccess: false,
  hintsUsed: 0,
  mistakeCount: 0,
  isAnalyzing: false,
  engineStatus: 'idle'
};

const initialProgressState: ProgressState = {
  positionProgress: {},
  dailyStats: {
    date: new Date().toISOString().split('T')[0],
    positionsSolved: 0,
    timeSpent: 0,
    accuracy: 0,
    mistakesMade: 0,
    hintsUsed: 0
  },
  achievements: [],
  totalSolvedPositions: 0,
  averageAccuracy: 0,
  favoritePositions: []
};

const initialUIState: UIState = {
  sidebarOpen: false,
  modalOpen: null,
  toasts: [],
  loading: {
    global: false,
    engine: false,
    position: false,
    analysis: false
  },
  analysisPanel: {
    isOpen: false,
    activeTab: 'moves',
    showEngine: true,
    showTablebase: true
  }
};

const initialSettingsState: SettingsState = {
  appVersion: '1.0.0',
  lastUpdated: new Date().toISOString(),
  dataSync: {
    enabled: false,
    syncInProgress: false
  },
  experimentalFeatures: {
    advancedAnalysis: false,
    voiceCommands: false,
    multipleVariations: false,
    puzzleRush: false
  }
};

// Create the store
export const useStore = create<RootState & Actions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        user: initialUserState,
        training: initialTrainingState,
        progress: initialProgressState,
        ui: initialUIState,
        settings: initialSettingsState,

        // User Actions
        setUser: (user) => set((state) => {
          Object.assign(state.user, user);
          logger.info('User updated', { user });
        }),

        updatePreferences: (preferences) => set((state) => {
          Object.assign(state.user.preferences, preferences);
          logger.info('Preferences updated', { preferences });
        }),

        incrementStreak: () => set((state) => {
          state.user.currentStreak += 1;
          logger.info('Streak incremented', { newStreak: state.user.currentStreak });
        }),

        resetStreak: () => set((state) => {
          state.user.currentStreak = 0;
          logger.info('Streak reset');
        }),

        addCompletedPosition: (positionId) => set((state) => {
          if (!state.user.completedPositions.includes(positionId)) {
            state.user.completedPositions.push(positionId);
            logger.info('Position completed', { positionId });
          }
        }),

        // Training Actions
        setPosition: (position) => set((state) => {
          state.training.currentPosition = position;
          state.training.isGameFinished = false;
          state.training.isSuccess = false;
          state.training.startTime = Date.now();
          state.training.hintsUsed = 0;
          state.training.mistakeCount = 0;
          
          // Initialize FEN and PGN for the position
          if (state.training.game) {
            state.training.currentFen = state.training.game.fen();
            state.training.currentPgn = state.training.game.pgn();
          }
          
          logger.info('Position set', { positionId: position.id });
        }),

        setGame: (game) => set((state) => {
          state.training.game = game;
          state.training.currentFen = game.fen();
          state.training.currentPgn = game.pgn();
          logger.debug('Game instance set');
        }),

        makeMove: (move: ChessJsMove) => set((state) => {
          try {
            // Convert library move to validated domain move
            const validatedMove = fromLibraryMove(move);
            state.training.moveHistory.push(validatedMove);
            state.training.isPlayerTurn = !state.training.isPlayerTurn;
            
            // Update currentFen and currentPgn for Lichess URL generation
            if (state.training.game) {
              state.training.currentFen = state.training.game.fen();
              state.training.currentPgn = state.training.game.pgn();
            }
            
            logger.debug('Move made', { 
              from: validatedMove.from, 
              to: validatedMove.to, 
              san: validatedMove.san 
            });
          } catch (error) {
            if (error instanceof ChessAdapterError) {
              logger.error('Invalid move rejected', { 
                error: error.message, 
                context: error.context 
              });
              // Don't update state for invalid moves
              return;
            }
            // Re-throw unexpected errors
            throw error;
          }
        }),

        undoMove: () => set((state) => {
          if (state.training.moveHistory.length > 0) {
            state.training.moveHistory.pop();
            state.training.isPlayerTurn = !state.training.isPlayerTurn;
            logger.debug('Move undone');
          }
        }),

        resetPosition: () => set((state) => {
          state.training.moveHistory = [];
          state.training.evaluations = [];
          state.training.isPlayerTurn = true;
          state.training.isGameFinished = false;
          state.training.isSuccess = false;
          state.training.hintsUsed = 0;
          state.training.mistakeCount = 0;
          state.training.startTime = Date.now();
          
          // Reset PGN and FEN to initial position
          if (state.training.game) {
            state.training.currentFen = state.training.game.fen();
            state.training.currentPgn = state.training.game.pgn();
          }
          
          logger.info('Position reset');
        }),

        setEvaluation: (evaluation) => set((state) => {
          state.training.currentEvaluation = evaluation;
          logger.debug('Evaluation updated', { evaluation });
        }),

        setEvaluations: (evaluations) => set((state) => {
          state.training.evaluations = evaluations;
          logger.debug('Evaluations array updated', { count: evaluations.length });
        }),

        setEngineStatus: (status) => set((state) => {
          state.training.engineStatus = status;
          logger.debug('Engine status changed', { status });
        }),

        completeTraining: (success) => set((state) => {
          state.training.isGameFinished = true;
          state.training.isSuccess = success;
          state.training.endTime = Date.now();
          
          if (state.training.currentPosition) {
            const positionId = state.training.currentPosition.id;
            const timeSpent = (state.training.endTime - (state.training.startTime || 0)) / 1000;
            
            // Update progress
            get().updatePositionProgress(positionId, {
              attempts: (state.progress.positionProgress[positionId]?.attempts || 0) + 1,
              successes: (state.progress.positionProgress[positionId]?.successes || 0) + (success ? 1 : 0)
            });
            
            // Update daily stats
            get().addDailyStats({
              positionsSolved: success ? 1 : 0,
              timeSpent,
              mistakesMade: state.training.mistakeCount,
              hintsUsed: state.training.hintsUsed
            });
            
            logger.info('Training completed', { positionId, success, timeSpent });
          }
        }),

        useHint: () => set((state) => {
          state.training.hintsUsed += 1;
          logger.debug('Hint used', { total: state.training.hintsUsed });
        }),

        incrementMistake: () => set((state) => {
          state.training.mistakeCount += 1;
          logger.debug('Mistake made', { total: state.training.mistakeCount });
        }),

        // Progress Actions
        updatePositionProgress: (positionId, update) => set((state) => {
          if (!state.progress.positionProgress[positionId]) {
            state.progress.positionProgress[positionId] = {
              positionId,
              attempts: 0,
              successes: 0,
              lastAttemptDate: new Date().toISOString(),
              averageTime: 0,
              difficulty: 1
            };
          }
          Object.assign(state.progress.positionProgress[positionId], update);
          logger.debug('Position progress updated', { positionId, update });
        }),

        addDailyStats: (stats) => set((state) => {
          const today = new Date().toISOString().split('T')[0];
          if (state.progress.dailyStats.date !== today) {
            state.progress.dailyStats = {
              date: today,
              positionsSolved: 0,
              timeSpent: 0,
              accuracy: 0,
              mistakesMade: 0,
              hintsUsed: 0
            };
          }
          
          const dailyStats = state.progress.dailyStats;
          dailyStats.positionsSolved += stats.positionsSolved || 0;
          dailyStats.timeSpent += stats.timeSpent || 0;
          dailyStats.mistakesMade += stats.mistakesMade || 0;
          dailyStats.hintsUsed += stats.hintsUsed || 0;
          
          // Recalculate accuracy
          const totalAttempts = Object.values(state.progress.positionProgress)
            .reduce((sum, p) => sum + p.attempts, 0);
          const totalSuccesses = Object.values(state.progress.positionProgress)
            .reduce((sum, p) => sum + p.successes, 0);
          dailyStats.accuracy = totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0;
        }),

        unlockAchievement: (achievementId) => set((state) => {
          const achievement = state.progress.achievements.find(a => a.id === achievementId);
          if (achievement && !achievement.unlockedDate) {
            achievement.unlockedDate = new Date().toISOString();
            logger.info('Achievement unlocked', { achievementId });
            get().showToast(`Achievement unlocked: ${achievement.name}`, 'success');
          }
        }),

        toggleFavorite: (positionId) => set((state) => {
          const index = state.progress.favoritePositions.indexOf(positionId);
          if (index === -1) {
            state.progress.favoritePositions.push(positionId);
          } else {
            state.progress.favoritePositions.splice(index, 1);
          }
          logger.debug('Favorite toggled', { positionId });
        }),

        calculateNextReview: (positionId, success) => set((state) => {
          const progress = state.progress.positionProgress[positionId];
          if (!progress) return;
          
          const successRate = progress.attempts > 0 ? progress.successes / progress.attempts : 0;
          const intervalIndex = Math.min(
            Math.floor(successRate * TRAINING.REPETITION_INTERVALS.length),
            TRAINING.REPETITION_INTERVALS.length - 1
          );
          const daysUntilReview = TRAINING.REPETITION_INTERVALS[intervalIndex];
          
          progress.nextReviewDate = new Date(
            Date.now() + daysUntilReview * TIME.DAY
          ).toISOString();
          
          logger.debug('Next review calculated', { positionId, daysUntilReview });
        }),

        // UI Actions
        toggleSidebar: () => set((state) => {
          state.ui.sidebarOpen = !state.ui.sidebarOpen;
        }),

        openModal: (type) => set((state) => {
          state.ui.modalOpen = type;
        }),

        closeModal: () => set((state) => {
          state.ui.modalOpen = null;
        }),

        showToast: (message, type, duration = 3000) => set((state) => {
          const toast: Toast = {
            id: Date.now().toString(),
            message,
            type,
            duration
          };
          state.ui.toasts.push(toast);
          
          // Auto-remove toast after duration
          setTimeout(() => {
            get().removeToast(toast.id);
          }, duration);
        }),

        removeToast: (id) => set((state) => {
          state.ui.toasts = state.ui.toasts.filter(t => t.id !== id);
        }),

        setLoading: (key, value) => set((state) => {
          state.ui.loading[key] = value;
        }),

        updateAnalysisPanel: (update) => set((state) => {
          Object.assign(state.ui.analysisPanel, update);
        }),

        // Settings Actions
        updateSettings: (settings) => set((state) => {
          Object.assign(state.settings, settings);
          state.settings.lastUpdated = new Date().toISOString();
        }),

        toggleExperimentalFeature: (feature) => set((state) => {
          state.settings.experimentalFeatures[feature] = !state.settings.experimentalFeatures[feature];
          logger.info('Experimental feature toggled', { 
            feature, 
            enabled: state.settings.experimentalFeatures[feature] 
          });
        }),

        startSync: () => set((state) => {
          state.settings.dataSync.syncInProgress = true;
          state.settings.dataSync.syncError = undefined;
        }),

        completeSync: (success, error) => set((state) => {
          state.settings.dataSync.syncInProgress = false;
          if (success) {
            state.settings.dataSync.lastSyncDate = new Date().toISOString();
          } else {
            state.settings.dataSync.syncError = error;
          }
        }),

        // Global Actions
        reset: () => set(() => ({
          user: initialUserState,
          training: initialTrainingState,
          progress: initialProgressState,
          ui: initialUIState,
          settings: initialSettingsState
        })),

        hydrate: (state) => set((draft) => {
          Object.assign(draft, state);
          logger.info('State hydrated');
        })
      })),
      {
        name: 'chess-trainer-storage',
        partialize: (state) => ({
          user: state.user,
          progress: state.progress,
          settings: state.settings
        })
      }
    ),
    {
      name: 'ChessTrainerStore'
    }
  )
);

// Selectors for common use cases
export const useUser = () => useStore((state) => state.user);
export const useTraining = () => useStore((state) => state.training);
export const useProgress = () => useStore((state) => state.progress);
export const useUI = () => useStore((state) => state.ui);
export const useSettings = () => useStore((state) => state.settings);

// Action selectors
export const useUserActions = () => useStore((state) => ({
  setUser: state.setUser,
  updatePreferences: state.updatePreferences,
  incrementStreak: state.incrementStreak,
  resetStreak: state.resetStreak,
  addCompletedPosition: state.addCompletedPosition
}));

export const useTrainingActions = () => useStore((state) => ({
  setPosition: state.setPosition,
  setGame: state.setGame,
  makeMove: state.makeMove,
  undoMove: state.undoMove,
  resetPosition: state.resetPosition,
  setEvaluation: state.setEvaluation,
  setEvaluations: state.setEvaluations,
  setEngineStatus: state.setEngineStatus,
  completeTraining: state.completeTraining,
  useHint: state.useHint,
  incrementMistake: state.incrementMistake
}));

export const useUIActions = () => useStore((state) => ({
  toggleSidebar: state.toggleSidebar,
  openModal: state.openModal,
  closeModal: state.closeModal,
  showToast: state.showToast,
  removeToast: state.removeToast,
  setLoading: state.setLoading,
  updateAnalysisPanel: state.updateAnalysisPanel
}));