/**
 * @file Unit tests for ProgressSlice
 * @description Tests the progress tracking and spaced repetition functionality
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createProgressSlice } from '@shared/store/slices/progressSlice';
import type { ProgressSlice, CardProgress, UserStats } from '@shared/store/slices/types';

// Mock logger to avoid console noise in tests
jest.mock('@shared/services/logging/Logger', () => ({
  getLogger: () => ({
    setContext: jest.fn().mockReturnThis(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Test store with minimal RootState structure
interface TestRootState {
  progress: ProgressSlice;
  // Add minimal mocks for other slices to satisfy type requirements
  game: any;
  training: any;
  tablebase: any;
  ui: any;
  handlePlayerMove: any;
  loadTrainingContext: any;
  reset: any;
  hydrate: any;
  _trainingActions: any;
}

// Helper to create a test store with only the progress slice
const createTestStore = () => {
  return create<TestRootState>()(
    immer((set, get, api) => {
      // Create the progress slice
      const progressSlice = createProgressSlice(set as any, get as any, api as any);
      
      // Return minimal root state with progress slice
      return {
        progress: progressSlice,
        // Mock other required properties
        game: {} as any,
        training: {} as any,
        tablebase: {} as any,
        ui: {} as any,
        handlePlayerMove: jest.fn(),
        loadTrainingContext: jest.fn(),
        reset: jest.fn(),
        hydrate: jest.fn(),
        _trainingActions: {} as any,
      };
    })
  );
};

describe('ProgressSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().progress;
      expect(state.userStats).toBeNull();
      expect(state.sessionProgress).toEqual({
        positionsCompleted: 0,
        positionsCorrect: 0,
        positionsAttempted: 0,
        timeSpent: 0,
        hintsUsed: 0,
        mistakesMade: 0,
      });
      expect(state.cardProgress).toEqual({});
      expect(state.loading).toBe(false);
      expect(state.syncStatus).toBe('idle');
      expect(state.lastSync).toBeNull();
      expect(state.syncError).toBeNull();
    });
  });

  describe('Basic State Setters', () => {
    it('should set user stats', () => {
      const mockStats: UserStats = {
        userId: 'test-user',
        totalPositionsCompleted: 10,
        overallSuccessRate: 0.75,
        totalTimeSpent: 3600,
        totalHintsUsed: 5,
        lastActive: Date.now(),
      };

      store.getState().progress.setUserStats(mockStats);
      expect(store.getState().progress.userStats).toEqual(mockStats);
    });

    it('should update session progress', () => {
      store.getState().progress.updateSessionProgress({
        positionsCompleted: 5,
        positionsCorrect: 4,
      });

      const progress = store.getState().progress.sessionProgress;
      expect(progress.positionsCompleted).toBe(5);
      expect(progress.positionsCorrect).toBe(4);
      expect(progress.positionsAttempted).toBe(0); // Other fields unchanged
    });

    it('should set sync status', () => {
      store.getState().progress.setSyncStatus('syncing');
      expect(store.getState().progress.syncStatus).toBe('syncing');

      store.getState().progress.setSyncStatus('error');
      expect(store.getState().progress.syncStatus).toBe('error');
    });

    it('should set loading state', () => {
      store.getState().progress.setLoading(true);
      expect(store.getState().progress.loading).toBe(true);

      store.getState().progress.setLoading(false);
      expect(store.getState().progress.loading).toBe(false);
    });
  });

  describe('Card Progress Management', () => {
    it('should initialize cards from array', () => {
      const cards: CardProgress[] = [
        {
          id: 'pos1',
          nextReviewAt: Date.now() + 86400000,
          interval: 1,
          efactor: 2.5,
          lapses: 0,
          repetition: 1,
          lastReviewedAt: Date.now(),
        },
        {
          id: 'pos2',
          nextReviewAt: Date.now() + 172800000,
          interval: 2,
          efactor: 2.3,
          lapses: 1,
          repetition: 3,
          lastReviewedAt: Date.now(),
        },
      ];

      store.getState().progress.initializeCards(cards);
      const cardProgress = store.getState().progress.cardProgress;
      
      expect(Object.keys(cardProgress)).toHaveLength(2);
      expect(cardProgress['pos1']).toBeDefined();
      expect(cardProgress['pos2']).toBeDefined();
      expect(cardProgress['pos1'].interval).toBe(1);
      expect(cardProgress['pos2'].interval).toBe(2);
    });

    it('should create new card on first attempt', () => {
      const positionId = 'new-position';
      store.getState().progress.recordAttempt(positionId, true);

      const card = store.getState().progress.cardProgress[positionId];
      expect(card).toBeDefined();
      expect(card.id).toBe(positionId);
      expect(card.interval).toBe(1);
      expect(card.efactor).toBe(2.5);
      expect(card.repetition).toBe(1);
      expect(card.lapses).toBe(0);
    });

    it('should update existing card on correct attempt', () => {
      const positionId = 'test-position';
      
      // First attempt - creates card
      store.getState().progress.recordAttempt(positionId, true);
      
      // Second attempt - correct
      store.getState().progress.recordAttempt(positionId, true);
      
      const card = store.getState().progress.cardProgress[positionId];
      expect(card.repetition).toBe(2);
      expect(card.interval).toBeGreaterThan(1); // Should increase
      expect(card.efactor).toBe(2.5); // Capped at 2.5 (already at max)
      expect(card.lapses).toBe(0);
    });

    it('should reset interval on incorrect attempt', () => {
      const positionId = 'test-position';
      
      // Create card with some progress
      store.getState().progress.recordAttempt(positionId, true);
      store.getState().progress.recordAttempt(positionId, true);
      
      const intervalBefore = store.getState().progress.cardProgress[positionId].interval;
      expect(intervalBefore).toBeGreaterThan(1);
      
      // Incorrect attempt
      store.getState().progress.recordAttempt(positionId, false);
      
      const card = store.getState().progress.cardProgress[positionId];
      expect(card.interval).toBe(1); // Reset to 1
      expect(card.lapses).toBe(1);
      expect(card.efactor).toBeLessThan(2.5); // Should decrease
    });

    it('should validate positionId in recordAttempt', () => {
      // Invalid IDs should be ignored
      store.getState().progress.recordAttempt('', true);
      store.getState().progress.recordAttempt(null as any, true);
      store.getState().progress.recordAttempt('   ', true);
      
      expect(Object.keys(store.getState().progress.cardProgress)).toHaveLength(0);
      
      // Valid ID with whitespace should be trimmed
      store.getState().progress.recordAttempt('  valid-id  ', true);
      expect(store.getState().progress.cardProgress['valid-id']).toBeDefined();
    });

    it('should reset card progress to default values', () => {
      const positionId = 'test-position';
      
      // Create and update a card
      store.getState().progress.recordAttempt(positionId, true);
      store.getState().progress.recordAttempt(positionId, true); // Make progress
      
      const cardBeforeReset = store.getState().progress.cardProgress[positionId];
      expect(cardBeforeReset.repetition).toBeGreaterThan(0);
      
      // Reset the card
      store.getState().progress.resetCardProgress(positionId);
      
      const resetCard = store.getState().progress.cardProgress[positionId];
      expect(resetCard).toBeDefined();
      expect(resetCard.id).toBe(positionId);
      expect(resetCard.interval).toBe(0);
      expect(resetCard.repetition).toBe(0);
      expect(resetCard.efactor).toBe(2.5);
      expect(resetCard.lapses).toBe(0);
    });

    it('should validate positionId in resetCardProgress', () => {
      store.getState().progress.recordAttempt('test', true);
      
      // Invalid IDs should be ignored
      store.getState().progress.resetCardProgress('');
      store.getState().progress.resetCardProgress(null as any);
      
      expect(store.getState().progress.cardProgress['test']).toBeDefined();
    });
  });

  describe('Batch Operations', () => {
    it('should batch update multiple fields', () => {
      const updates = {
        userStats: {
          totalPositionsCompleted: 15,
        },
        sessionProgress: {
          positionsCompleted: 3,
          positionsCorrect: 2,
        },
      };

      store.getState().progress.batchUpdateProgress(updates);
      
      const state = store.getState().progress;
      // UserStats should be created from partial
      expect(state.userStats?.totalPositionsCompleted).toBe(15);
      // Session progress should be merged
      expect(state.sessionProgress.positionsCompleted).toBe(3);
      expect(state.sessionProgress.positionsCorrect).toBe(2);
    });

    it('should merge cardProgress in batch update', () => {
      // Set initial cards
      store.getState().progress.recordAttempt('pos1', true);
      store.getState().progress.recordAttempt('pos2', true);
      
      const newCard: CardProgress = {
        id: 'pos3',
        nextReviewAt: Date.now(),
        interval: 5,
        efactor: 2.1,
        lapses: 2,
        repetition: 10,
        lastReviewedAt: Date.now(),
      };
      
      store.getState().progress.batchUpdateProgress({
        cardProgress: { pos3: newCard },
      });
      
      const cardProgress = store.getState().progress.cardProgress;
      expect(Object.keys(cardProgress)).toHaveLength(3);
      expect(cardProgress['pos3'].interval).toBe(5);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all progress state', () => {
      // Set some state
      store.getState().progress.setUserStats({
        userId: 'test',
        totalPositionsCompleted: 10,
        overallSuccessRate: 0.8,
        totalTimeSpent: 1000,
        totalHintsUsed: 5,
        lastActive: Date.now(),
      });
      store.getState().progress.recordAttempt('pos1', true);
      store.getState().progress.setSyncStatus('syncing');
      
      // Reset
      store.getState().progress.resetProgress();
      
      const state = store.getState().progress;
      expect(state.userStats).toBeNull();
      expect(state.cardProgress).toEqual({});
      expect(state.syncStatus).toBe('idle');
      expect(state.sessionProgress.positionsCompleted).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle setting invalid card progress', () => {
      store.getState().progress.setCardProgress('', {} as CardProgress);
      store.getState().progress.setCardProgress('test', null as any);
      
      expect(Object.keys(store.getState().progress.cardProgress)).toHaveLength(0);
    });

    it('should handle ease factor bounds in SM-2', () => {
      const positionId = 'test';
      
      // Many correct attempts - ease factor should cap at 2.5
      for (let i = 0; i < 10; i++) {
        store.getState().progress.recordAttempt(positionId, true);
      }
      
      let card = store.getState().progress.cardProgress[positionId];
      expect(card.efactor).toBeLessThanOrEqual(2.5);
      
      // Many incorrect attempts - ease factor should floor at 1.3
      for (let i = 0; i < 10; i++) {
        store.getState().progress.recordAttempt(positionId, false);
      }
      
      card = store.getState().progress.cardProgress[positionId];
      expect(card.efactor).toBeGreaterThanOrEqual(1.3);
    });
  });
});
