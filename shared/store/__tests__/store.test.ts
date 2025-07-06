/**
 * @fileoverview Tests for Zustand Store
 * @description Tests global state management functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useStore, useUser, useTraining, useUserActions, useTrainingActions } from '../store';
import { LogLevel } from '../../services/logging/types';
import type { UserState, RootState } from '../types';

// Mock dependencies
jest.mock('../../services/logging', () => ({
  getLogger: () => ({
    setContext: () => ({
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  })
}));

jest.mock('zustand/middleware', () => ({
  devtools: (fn: any) => fn,
  persist: (fn: any) => fn,
  immer: (fn: any) => fn
}));

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('User State', () => {
    it('should have initial user state', () => {
      const { result } = renderHook(() => useUser());
      
      expect(result.current.rating).toBe(1200);
      expect(result.current.completedPositions).toEqual([]);
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.preferences.theme).toBe('dark');
    });

    it('should update user data', () => {
      const { result: userResult } = renderHook(() => useUser());
      const { result: actionsResult } = renderHook(() => useUserActions());

      act(() => {
        actionsResult.current.setUser({
          username: 'testuser',
          rating: 1500
        } as Partial<UserState>);
      });

      expect(userResult.current.username).toBe('testuser');
      expect(userResult.current.rating).toBe(1500);
    });

    it('should update preferences', () => {
      const { result: userResult } = renderHook(() => useUser());
      const { result: actionsResult } = renderHook(() => useUserActions());

      act(() => {
        actionsResult.current.updatePreferences({
          theme: 'light',
          soundEnabled: false
        });
      });

      expect(userResult.current.preferences.theme).toBe('light');
      expect(userResult.current.preferences.soundEnabled).toBe(false);
    });

    it('should increment streak', () => {
      const { result: userResult } = renderHook(() => useUser());
      const { result: actionsResult } = renderHook(() => useUserActions());

      act(() => {
        actionsResult.current.incrementStreak();
        actionsResult.current.incrementStreak();
      });

      expect(userResult.current.currentStreak).toBe(2);
    });

    it('should reset streak', () => {
      const { result: userResult } = renderHook(() => useUser());
      const { result: actionsResult } = renderHook(() => useUserActions());

      act(() => {
        actionsResult.current.incrementStreak();
        actionsResult.current.resetStreak();
      });

      expect(userResult.current.currentStreak).toBe(0);
    });

    it('should add completed positions', () => {
      const { result: userResult } = renderHook(() => useUser());
      const { result: actionsResult } = renderHook(() => useUserActions());

      act(() => {
        actionsResult.current.addCompletedPosition(1);
        actionsResult.current.addCompletedPosition(2);
        actionsResult.current.addCompletedPosition(1); // Should not duplicate
      });

      expect(userResult.current.completedPositions).toEqual([1, 2]);
    });
  });

  describe('Training State', () => {
    const mockPosition = {
      id: 1,
      title: 'Test Position',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      description: 'Test description',
      difficulty: 'beginner' as const,
      category: 'pawn' as const,
      goal: 'win' as const,
      sideToMove: 'white' as const,
      material: {
        white: 'K+P',
        black: 'K'
      },
      tags: ['basic', 'pawn-endgame']
    };

    it('should have initial training state', () => {
      const { result } = renderHook(() => useTraining());
      
      expect(result.current.moveHistory).toEqual([]);
      expect(result.current.isPlayerTurn).toBe(true);
      expect(result.current.isGameFinished).toBe(false);
      expect(result.current.hintsUsed).toBe(0);
      expect(result.current.mistakeCount).toBe(0);
    });

    it('should set position', () => {
      const { result: trainingResult } = renderHook(() => useTraining());
      const { result: actionsResult } = renderHook(() => useTrainingActions());

      act(() => {
        actionsResult.current.setPosition(mockPosition);
      });

      expect(trainingResult.current.currentPosition).toEqual(mockPosition);
      expect(trainingResult.current.isGameFinished).toBe(false);
      expect(trainingResult.current.startTime).toBeDefined();
    });

    it('should make moves', () => {
      const { result: trainingResult } = renderHook(() => useTraining());
      const { result: actionsResult } = renderHook(() => useTrainingActions());

      const move = { from: 'e2', to: 'e4' };

      act(() => {
        actionsResult.current.makeMove(move);
      });

      expect(trainingResult.current.moveHistory).toHaveLength(1);
      expect(trainingResult.current.moveHistory[0]).toEqual(move);
      expect(trainingResult.current.isPlayerTurn).toBe(false);
    });

    it('should undo moves', () => {
      const { result: trainingResult } = renderHook(() => useTraining());
      const { result: actionsResult } = renderHook(() => useTrainingActions());

      const move1 = { from: 'e2', to: 'e4' };
      const move2 = { from: 'd2', to: 'd4' };

      act(() => {
        actionsResult.current.makeMove(move1);
        actionsResult.current.makeMove(move2);
        actionsResult.current.undoMove();
      });

      expect(trainingResult.current.moveHistory).toHaveLength(1);
      expect(trainingResult.current.moveHistory[0]).toEqual(move1);
    });

    it('should reset position', () => {
      const { result: trainingResult } = renderHook(() => useTraining());
      const { result: actionsResult } = renderHook(() => useTrainingActions());

      act(() => {
        actionsResult.current.makeMove({ from: 'e2', to: 'e4' });
        actionsResult.current.useHint();
        actionsResult.current.incrementMistake();
        actionsResult.current.resetPosition();
      });

      expect(trainingResult.current.moveHistory).toEqual([]);
      expect(trainingResult.current.isPlayerTurn).toBe(true);
      expect(trainingResult.current.hintsUsed).toBe(0);
      expect(trainingResult.current.mistakeCount).toBe(0);
    });

    it('should track hints and mistakes', () => {
      const { result: trainingResult } = renderHook(() => useTraining());
      const { result: actionsResult } = renderHook(() => useTrainingActions());

      act(() => {
        actionsResult.current.useHint();
        actionsResult.current.useHint();
        actionsResult.current.incrementMistake();
      });

      expect(trainingResult.current.hintsUsed).toBe(2);
      expect(trainingResult.current.mistakeCount).toBe(1);
    });

    it('should complete training successfully', () => {
      const { result: trainingResult } = renderHook(() => useTraining());
      const { result: actionsResult } = renderHook(() => useTrainingActions());

      act(() => {
        actionsResult.current.setPosition(mockPosition);
        actionsResult.current.completeTraining(true);
      });

      expect(trainingResult.current.isGameFinished).toBe(true);
      expect(trainingResult.current.isSuccess).toBe(true);
      expect(trainingResult.current.endTime).toBeDefined();
    });

    it('should set evaluation', () => {
      const { result: trainingResult } = renderHook(() => useTraining());
      const { result: actionsResult } = renderHook(() => useTrainingActions());

      const evaluation = {
        engine: {
          score: 50,
          mate: null,
          evaluation: '+0.50'
        }
      };

      act(() => {
        actionsResult.current.setEvaluation(evaluation);
      });

      expect(trainingResult.current.currentEvaluation).toEqual(evaluation);
    });

    it('should set engine status', () => {
      const { result: trainingResult } = renderHook(() => useTraining());
      const { result: actionsResult } = renderHook(() => useTrainingActions());

      act(() => {
        actionsResult.current.setEngineStatus('analyzing');
      });

      expect(trainingResult.current.engineStatus).toBe('analyzing');
    });
  });

  describe('Progress State', () => {
    it('should update position progress', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updatePositionProgress(1, {
          attempts: 5,
          successes: 3
        });
      });

      const positionProgress = result.current.progress.positionProgress[1];
      expect(positionProgress.attempts).toBe(5);
      expect(positionProgress.successes).toBe(3);
      expect(positionProgress.positionId).toBe(1);
    });

    it('should add daily stats', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDailyStats({
          positionsSolved: 2,
          timeSpent: 300,
          mistakesMade: 1
        });
      });

      const dailyStats = result.current.progress.dailyStats;
      expect(dailyStats.positionsSolved).toBe(2);
      expect(dailyStats.timeSpent).toBe(300);
      expect(dailyStats.mistakesMade).toBe(1);
    });

    it('should toggle favorites', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.toggleFavorite(1);
        result.current.toggleFavorite(2);
        result.current.toggleFavorite(1); // Should remove
      });

      expect(result.current.progress.favoritePositions).toEqual([2]);
    });

    it('should unlock achievements', () => {
      const { result } = renderHook(() => useStore());

      // First add an achievement to unlock using the store method
      act(() => {
        // Directly mutate the state to add the achievement for testing
        const newAchievement = {
          id: 'first_win',
          name: 'First Win',
          description: 'Win your first game',
          progress: 1,
          maxProgress: 1
        };
        
        // Use store's hydrate method to add the achievement
        result.current.hydrate({
          progress: {
            ...result.current.progress,
            achievements: [newAchievement]
          }
        });
      });

      act(() => {
        result.current.unlockAchievement('first_win');
      });

      const achievement = result.current.progress.achievements.find(a => a.id === 'first_win');
      expect(achievement?.unlockedDate).toBeDefined();
    });
  });

  describe('UI State', () => {
    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useStore());

      expect(result.current.ui.sidebarOpen).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.ui.sidebarOpen).toBe(true);
    });

    it('should manage modals', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.openModal('settings');
      });

      expect(result.current.ui.modalOpen).toBe('settings');

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.ui.modalOpen).toBeNull();
    });

    it('should manage toasts', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.showToast('Test message', 'success', 1000);
      });

      expect(result.current.ui.toasts).toHaveLength(1);
      expect(result.current.ui.toasts[0].message).toBe('Test message');
      expect(result.current.ui.toasts[0].type).toBe('success');

      const toastId = result.current.ui.toasts[0].id;

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.ui.toasts).toHaveLength(0);
    });

    it('should manage loading states', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setLoading('engine', true);
      });

      expect(result.current.ui.loading.engine).toBe(true);

      act(() => {
        result.current.setLoading('engine', false);
      });

      expect(result.current.ui.loading.engine).toBe(false);
    });

    it('should update analysis panel', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateAnalysisPanel({
          isOpen: true,
          activeTab: 'evaluation'
        });
      });

      expect(result.current.ui.analysisPanel.isOpen).toBe(true);
      expect(result.current.ui.analysisPanel.activeTab).toBe('evaluation');
    });
  });

  describe('Global Actions', () => {
    it('should reset entire state', () => {
      const { result } = renderHook(() => useStore());

      // Make some changes
      act(() => {
        result.current.setUser({ username: 'test' });
        result.current.toggleSidebar();
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.user.username).toBeUndefined();
      expect(result.current.ui.sidebarOpen).toBe(false);
    });

    it('should hydrate state', () => {
      const { result } = renderHook(() => useStore());

      const partialState: Partial<RootState> = {
        user: {
          username: 'hydrated_user',
          rating: 1800,
          completedPositions: [],
          currentStreak: 0,
          totalTrainingTime: 0,
          lastActiveDate: new Date().toISOString(),
          preferences: {
            theme: 'light',
            soundEnabled: true,
            notificationsEnabled: true,
            boardOrientation: 'white',
            pieceTheme: 'standard',
            autoPromoteToQueen: true,
            showCoordinates: true,
            showLegalMoves: true,
            animationSpeed: 'normal'
          }
        }
      };

      act(() => {
        result.current.hydrate(partialState);
      });

      expect(result.current.user.username).toBe('hydrated_user');
      expect(result.current.user.rating).toBe(1800);
    });
  });
});