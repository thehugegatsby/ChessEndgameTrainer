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
import { 
  updateCardProgress, 
  mapBinaryToQuality,
  createNewCard,
  resetCardProgress as resetCard
} from '@shared/services/SpacedRepetitionService';
import { ProgressService } from '@shared/services/ProgressService';

// Lazy initialization to avoid Firebase issues in test environment
let progressService: ProgressService | null = null;

const getProgressService = (): ProgressService => {
  if (!progressService) {
    // Dynamic import to avoid Firebase initialization in tests
    const { db } = require('../../../firebase/firebase');
    progressService = new ProgressService(db);
  }
  return progressService;
};

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
export const createProgressSlice: ImmerStateCreator<ProgressSlice> = (set, get) => ({
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
    let card = state.progress.cardProgress[trimmedId];
    
    if (!card) {
      // Create new card using SpacedRepetitionService
      logger.debug('Creating new card progress', { positionId: trimmedId, wasCorrect });
      card = createNewCard(trimmedId, Date.now());
      state.progress.cardProgress[trimmedId] = card;
    }
    
    // Update card using SpacedRepetitionService with proper SuperMemo-2 algorithm
    try {
      const quality = mapBinaryToQuality(wasCorrect);
      const updatedCard = updateCardProgress(card, quality, Date.now());
      state.progress.cardProgress[trimmedId] = updatedCard;
      
      logger.debug('Updated card progress with SM-2', { 
        positionId: trimmedId, 
        wasCorrect,
        quality,
        oldInterval: card.interval,
        newInterval: updatedCard.interval,
        oldEfactor: card.efactor,
        newEfactor: updatedCard.efactor,
        nextReviewAt: new Date(updatedCard.nextReviewAt).toISOString()
      });
    } catch (error) {
      logger.error('Failed to update card progress', { positionId: trimmedId, error });
      // Fallback: keep the card unchanged rather than corrupting state
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
      // Use SpacedRepetitionService to create a fresh card instead of deleting
      state.progress.cardProgress[trimmedId] = resetCard({ id: trimmedId });
      logger.debug('Reset card progress using SM-2 defaults', { positionId: trimmedId });
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

  // ===== ASYNC FIREBASE OPERATIONS =====

  /**
   * Loads user progress from Firebase
   * 
   * @param userId - User identifier
   */
  loadUserProgress: async (userId) => {
    const logger = getLogger().setContext('ProgressSlice');
    
    set((state) => {
      state.progress.loading = true;
      state.progress.syncStatus = 'syncing';
      state.progress.syncError = null;
    });

    try {
      logger.debug('Loading user progress from Firebase', { userId });
      
      // Load user stats and all card progresses in parallel
      const service = getProgressService();
      const [userStats, cardProgresses] = await Promise.all([
        service.getUserStats(userId),
        service.getAllCardProgresses(userId)
      ]);

      set((state) => {
        // Update user stats
        if (userStats) {
          state.progress.userStats = userStats;
        }
        
        // Update card progresses
        const cardMap: Record<string, CardProgress> = {};
        for (const card of cardProgresses) {
          cardMap[card.id] = card;
        }
        state.progress.cardProgress = cardMap;
        
        // Update sync status
        state.progress.loading = false;
        state.progress.syncStatus = 'idle';
        state.progress.lastSync = Date.now();
        state.progress.syncError = null;
      });
      
      logger.info('User progress loaded successfully', { 
        userId, 
        hasStats: !!userStats,
        cardCount: cardProgresses.length 
      });

    } catch (error) {
      logger.error('Failed to load user progress', error as Error, { userId });
      
      set((state) => {
        state.progress.loading = false;
        state.progress.syncStatus = 'error';
        state.progress.syncError = (error as Error).message;
      });
      
      throw error; // Re-throw for caller to handle
    }
  },

  /**
   * Saves user stats to Firebase
   * 
   * @param userId - User identifier
   * @param updates - Partial user stats to update
   */
  saveUserStats: async (userId, updates) => {
    const logger = getLogger().setContext('ProgressSlice');
    
    try {
      logger.debug('Saving user stats to Firebase', { userId, updates });
      
      await getProgressService().updateUserStats(userId, updates);
      
      set((state) => {
        // Optimistically update local state
        if (state.progress.userStats) {
          Object.assign(state.progress.userStats, updates);
        } else {
          state.progress.userStats = { userId, ...updates } as UserStats;
        }
        state.progress.lastSync = Date.now();
        state.progress.syncError = null;
      });
      
      logger.debug('User stats saved successfully', { userId });

    } catch (error) {
      logger.error('Failed to save user stats', error as Error, { userId });
      
      set((state) => {
        state.progress.syncStatus = 'error';
        state.progress.syncError = (error as Error).message;
      });
      
      throw error;
    }
  },

  /**
   * Saves card progress to Firebase
   * 
   * @param userId - User identifier
   * @param positionId - Position identifier
   * @param progress - Complete card progress object
   */
  saveCardProgress: async (userId, positionId, progress) => {
    const logger = getLogger().setContext('ProgressSlice');
    
    try {
      logger.debug('Saving card progress to Firebase', { userId, positionId });
      
      await getProgressService().upsertCardProgress(userId, positionId, progress);
      
      set((state) => {
        // Optimistically update local state
        state.progress.cardProgress[positionId] = progress;
        state.progress.lastSync = Date.now();
        state.progress.syncError = null;
      });
      
      logger.debug('Card progress saved successfully', { userId, positionId });

    } catch (error) {
      logger.error('Failed to save card progress', error as Error, { userId, positionId });
      
      set((state) => {
        state.progress.syncStatus = 'error';
        state.progress.syncError = (error as Error).message;
      });
      
      throw error;
    }
  },

  /**
   * Saves session completion data (user stats + multiple card updates) atomically
   * 
   * @param userId - User identifier
   * @param sessionStats - Partial user stats updates
   * @param cardUpdates - Array of card progress updates
   */
  saveSessionComplete: async (userId, sessionStats, cardUpdates) => {
    const logger = getLogger().setContext('ProgressSlice');
    
    set((state) => {
      state.progress.loading = true;
      state.progress.syncStatus = 'syncing';
    });

    try {
      logger.debug('Saving session completion to Firebase', { 
        userId, 
        sessionStats, 
        cardCount: cardUpdates.length 
      });
      
      await getProgressService().updateProgressTransaction(
        userId,
        sessionStats,
        cardUpdates
      );
      
      set((state) => {
        // Optimistically update local state
        if (state.progress.userStats) {
          Object.assign(state.progress.userStats, sessionStats);
        } else {
          state.progress.userStats = { userId, ...sessionStats } as UserStats;
        }
        
        // Update card progresses
        for (const { positionId, progress } of cardUpdates) {
          state.progress.cardProgress[positionId] = progress;
        }
        
        state.progress.loading = false;
        state.progress.syncStatus = 'idle';
        state.progress.lastSync = Date.now();
        state.progress.syncError = null;
      });
      
      logger.info('Session completion saved successfully', { 
        userId, 
        cardCount: cardUpdates.length 
      });

    } catch (error) {
      logger.error('Failed to save session completion', error as Error, { userId });
      
      set((state) => {
        state.progress.loading = false;
        state.progress.syncStatus = 'error';
        state.progress.syncError = (error as Error).message;
      });
      
      throw error;
    }
  },

  /**
   * Gets cards due for review from Firebase
   * 
   * @param userId - User identifier
   * @returns Promise resolving to array of due cards
   */
  getDueCards: async (userId) => {
    const logger = getLogger().setContext('ProgressSlice');
    
    try {
      logger.debug('Getting due cards from Firebase', { userId });
      
      const dueCards = await getProgressService().getDueCardProgresses(userId);
      
      logger.debug('Due cards retrieved successfully', { 
        userId, 
        dueCount: dueCards.length 
      });
      
      return dueCards;

    } catch (error) {
      logger.error('Failed to get due cards', error as Error, { userId });
      
      set((state) => {
        state.progress.syncStatus = 'error';
        state.progress.syncError = (error as Error).message;
      });
      
      throw error;
    }
  },

  /**
   * Syncs all progress data to Firebase (full upload)
   * 
   * @param userId - User identifier
   */
  syncAllProgress: async (userId) => {
    const logger = getLogger().setContext('ProgressSlice');
    
    set((state) => {
      state.progress.loading = true;
      state.progress.syncStatus = 'syncing';
    });

    try {
      logger.debug('Syncing all progress to Firebase', { userId });
      
      // Get current state
      const currentState = get().progress;
      
      // Prepare batch updates
      const cardUpdates = Object.entries(currentState.cardProgress).map(
        ([positionId, progress]) => ({ positionId, progress: progress as CardProgress })
      );
      
      // Use transaction to update everything atomically
      await getProgressService().updateProgressTransaction(
        userId,
        currentState.userStats || { userId },
        cardUpdates
      );
      
      set((state) => {
        state.progress.loading = false;
        state.progress.syncStatus = 'idle';
        state.progress.lastSync = Date.now();
        state.progress.syncError = null;
      });
      
      logger.info('All progress synced successfully', { 
        userId, 
        cardCount: cardUpdates.length 
      });

    } catch (error) {
      logger.error('Failed to sync all progress', error as Error, { userId });
      
      set((state) => {
        state.progress.loading = false;
        state.progress.syncStatus = 'error';
        state.progress.syncError = (error as Error).message;
      });
      
      throw error;
    }
  },
});