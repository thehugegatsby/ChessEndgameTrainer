/**
 * @file Progress slice for user progress tracking and statistics
 * @description Manages user progress data, session statistics, and sync status
 * 
 * @example
 * ```typescript
 * // Using state
 * const { userStats, syncStatus } = useProgressState();
 * 
 * // Using actions only (no re-renders)
 * const actions = useProgressActions();
 * actions.updateSessionProgress({ positionsCompleted: 1 });
 * 
 * // Using both
 * const [state, actions] = useProgressStore();
 * ```
 */

import type { ImmerStateCreator, ProgressSlice, ProgressState, UserStats, CardProgress } from './types';
import { getLogger } from '@shared/services/logging/Logger';

/**
 * Initial state for progress slice
 */
export const initialProgressState: ProgressState = {
  // Core progress data
  userStats: null,
  sessionProgress: {
    positionsCompleted: 0,
    positionsCorrect: 0,
    positionsAttempted: 0,
    timeSpent: 0,
    hintsUsed: 0,
    mistakesMade: 0,
  },
  cardProgress: {}, // Empty map initially
  
  // Sync status
  loading: false,
  syncStatus: 'idle',
  lastSync: null,
  syncError: null,
};

/**
 * Creates the progress slice with Immer middleware for immutable updates
 */
export const createProgressSlice: ImmerStateCreator<ProgressSlice> = (set) => ({
  ...initialProgressState,

  // State setters
  setUserStats: (stats) => set((state) => {
    state.progress.userStats = stats;
  }),

  updateSessionProgress: (progress) => set((state) => {
    state.progress.sessionProgress = {
      ...state.progress.sessionProgress,
      ...progress,
    };
  }),

  setLoading: (loading) => set((state) => {
    state.progress.loading = loading;
  }),

  setSyncStatus: (status) => set((state) => {
    state.progress.syncStatus = status;
  }),

  setLastSync: (timestamp) => set((state) => {
    state.progress.lastSync = timestamp;
  }),

  setSyncError: (error) => set((state) => {
    state.progress.syncError = error;
  }),

  // Card progress management
  initializeCards: (cards) => set((state) => {
    const cardMap: Record<string, CardProgress> = {};
    for (const card of cards) {
      cardMap[card.id] = card;
    }
    state.progress.cardProgress = cardMap;
  }),

  recordAttempt: (positionId, wasCorrect) => set((state) => {
    const logger = getLogger().setContext('ProgressSlice');
    
    // Validate positionId
    if (!positionId || typeof positionId !== 'string' || positionId.trim() === '') {
      logger.warn('Invalid positionId provided to recordAttempt', { positionId });
      return;
    }
    
    const trimmedId = positionId.trim();
    const card = state.progress.cardProgress[trimmedId];
    
    if (!card) {
      // Initialize new card if doesn't exist
      logger.debug('Creating new card progress', { positionId: trimmedId, wasCorrect });
      state.progress.cardProgress[trimmedId] = {
        id: trimmedId,
        nextReviewAt: Date.now() + 86400000, // 1 day from now
        interval: 1,
        easeFactor: 2.5,
        lapses: wasCorrect ? 0 : 1,
        repetitions: wasCorrect ? 1 : 0,
        lastReviewedAt: Date.now(),
      };
    } else {
      // Update existing card using SM-2 algorithm principles
      // TODO: Replace with rs-card-scheduler for proper SM-2 implementation
      const now = Date.now();
      
      if (wasCorrect) {
        card.repetitions++;
        // SM-2: New interval = old interval * ease factor
        card.interval = Math.round(card.interval * card.easeFactor);
        // SM-2: Increase ease factor slightly for correct answers
        card.easeFactor = Math.min(2.5, card.easeFactor + 0.1);
      } else {
        card.lapses++;
        // SM-2: Reset interval on failure
        card.interval = 1; // Reset to 1 day
        // SM-2: Decrease ease factor for incorrect answers
        card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
      }
      
      card.lastReviewedAt = now;
      card.nextReviewAt = now + (card.interval * 86400000); // Convert days to ms
      
      logger.debug('Updated card progress', { 
        positionId: trimmedId, 
        wasCorrect,
        newInterval: card.interval,
        nextReviewAt: new Date(card.nextReviewAt).toISOString()
      });
    }
  }),

  resetCardProgress: (positionId) => set((state) => {
    const logger = getLogger().setContext('ProgressSlice');
    
    if (!positionId || typeof positionId !== 'string' || positionId.trim() === '') {
      logger.warn('Invalid positionId provided to resetCardProgress', { positionId });
      return;
    }
    
    const trimmedId = positionId.trim();
    if (state.progress.cardProgress[trimmedId]) {
      delete state.progress.cardProgress[trimmedId];
      logger.debug('Reset card progress', { positionId: trimmedId });
    } else {
      logger.debug('Card not found for reset', { positionId: trimmedId });
    }
  }),

  setCardProgress: (positionId, progress) => set((state) => {
    const logger = getLogger().setContext('ProgressSlice');
    
    if (!positionId || typeof positionId !== 'string' || positionId.trim() === '') {
      logger.warn('Invalid positionId provided to setCardProgress', { positionId });
      return;
    }
    
    if (!progress || typeof progress !== 'object') {
      logger.warn('Invalid progress object provided to setCardProgress', { positionId, progress });
      return;
    }
    
    const trimmedId = positionId.trim();
    state.progress.cardProgress[trimmedId] = progress;
    logger.debug('Set card progress', { positionId: trimmedId });
  }),

  // Batch operations for performance
  batchUpdateProgress: (updates) => set((state) => {
    // Handle userStats - use Object.assign for Immer
    if (updates.userStats) {
      if (state.progress.userStats) {
        Object.assign(state.progress.userStats, updates.userStats);
      } else {
        // Create new if null
        state.progress.userStats = updates.userStats as UserStats;
      }
    }
    
    // Handle sessionProgress - use Object.assign for Immer
    if (updates.sessionProgress) {
      Object.assign(state.progress.sessionProgress, updates.sessionProgress);
    }
    
    // Handle cardProgress - merge entire map
    if (updates.cardProgress) {
      Object.assign(state.progress.cardProgress, updates.cardProgress);
    }
  }),

  // Reset progress state
  resetProgress: () => set((state) => {
    // Only reset the state properties, not the actions
    Object.assign(state.progress, initialProgressState);
  }),
});