/**
 * @file Progress store hooks
 * @module store/hooks/useProgressStore
 * 
 * @description
 * Performance-optimized hooks for accessing progress state and actions.
 * Implements the three-hook pattern for optimal re-render prevention.
 * 
 * @example
 * ```typescript
 * // Use only state (component re-renders when state changes)
 * const { userStats, syncStatus } = useProgressState();
 * 
 * // Use only actions (component NEVER re-renders)
 * const actions = useProgressActions();
 * actions.updateSessionProgress({ positionsCompleted: 1 });
 * 
 * // Use both state and actions
 * const [state, actions] = useProgressStore();
 * ```
 */

import { useStore } from '../rootStore';
import { useShallow } from 'zustand/react/shallow';
import type { ProgressState, ProgressActions } from '../slices/types';
import { getDueCardsFromMap } from '@shared/services/SpacedRepetitionService';
import { useMemo } from 'react';
import { dueCardsCacheService, createInputHash } from '@shared/services/DueCardsCacheService';
import { filterDueCards, calculateDueCardsStats } from '@shared/types/progress';
import { getLogger } from '@shared/services/logging/Logger';
import { PERCENT } from '@/constants/number.constants';
import { TIME_BUCKETS_MS } from '@/constants/time.constants';
import type { CardProgress } from '@shared/store/slices/types';

/**
 * Hook for accessing progress state with shallow equality checks
 * Components using this hook will re-render when selected state changes
 * 
 * @returns {ProgressState} Current progress state
 * 
 * @example
 * ```typescript
 * function ProgressPanel() {
 *   const { userStats, dueCardCount, syncStatus } = useProgressState();
 *   
 *   return (
 *     <div>
 *       <p>Due cards: {dueCardCount}</p>
 *       <p>Sync status: {syncStatus}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useProgressState = (): ProgressState => {
  return useStore(
    useShallow((state) => ({
      userStats: state.progress.userStats,
      sessionProgress: state.progress.sessionProgress,
      cardProgress: state.progress.cardProgress,
      loading: state.progress.loading,
      syncStatus: state.progress.syncStatus,
      lastSync: state.progress.lastSync,
      syncError: state.progress.syncError,
    }))
  );
};

/**
 * Hook for accessing progress actions without causing re-renders
 * Components using this hook will NEVER re-render
 * 
 * @returns {ProgressActions} Progress action functions
 * 
 * @example
 * ```typescript
 * function SaveButton() {
 *   const actions = useProgressActions();
 *   
 *   const handleSave = () => {
 *     actions.setSyncStatus('syncing');
 *     // ... perform save
 *     actions.setSyncStatus('idle');
 *   };
 *   
 *   return <button onClick={handleSave}>Save Progress</button>;
 * }
 * ```
 */
export const useProgressActions = (): ProgressActions => {
  return useStore(
    useShallow((state) => ({
      // Synchronous actions
      setUserStats: state.progress.setUserStats,
      updateSessionProgress: state.progress.updateSessionProgress,
      setLoading: state.progress.setLoading,
      setSyncStatus: state.progress.setSyncStatus,
      setLastSync: state.progress.setLastSync,
      setSyncError: state.progress.setSyncError,
      initializeCards: state.progress.initializeCards,
      recordAttempt: state.progress.recordAttempt,
      resetCardProgress: state.progress.resetCardProgress,
      setCardProgress: state.progress.setCardProgress,
      batchUpdateProgress: state.progress.batchUpdateProgress,
      resetProgress: state.progress.resetProgress,
      
      // Async Firebase actions
      loadUserProgress: state.progress.loadUserProgress,
      saveUserStats: state.progress.saveUserStats,
      saveCardProgress: state.progress.saveCardProgress,
      saveSessionComplete: state.progress.saveSessionComplete,
      getDueCards: state.progress.getDueCards,
      syncAllProgress: state.progress.syncAllProgress,
    }))
  );
};

/**
 * Combined hook for accessing both progress state and actions
 * Convenient for components that need both
 * 
 * @returns {[ProgressState, ProgressActions]} Tuple of state and actions
 * 
 * @example
 * ```typescript
 * function ProgressManager() {
 *   const [state, actions] = useProgressStore();
 *   
 *   useEffect(() => {
 *     if (state.syncStatus === 'error') {
 *       actions.setSyncStatus('idle');
 *       // Retry logic...
 *     }
 *   }, [state.syncStatus]);
 *   
 *   return (
 *     <div>
 *       <p>Total positions: {state.userStats?.totalPositions ?? 0}</p>
 *       <button onClick={() => actions.resetProgress()}>
 *         Reset Progress
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useProgressStore = (): [ProgressState, ProgressActions] => {
  const state = useProgressState();
  const actions = useProgressActions();
  return [state, actions];
};

/**
 * Enhanced hook for accessing derived progress values with cache-first strategy
 * 
 * Features:
 * - Cache-first due cards calculation with localStorage persistence
 * - 24h TTL with UTC midnight invalidation
 * - Performance optimization for large card collections (>500 cards)
 * - Graceful fallback to direct computation on cache miss
 * - Cache statistics for monitoring
 * 
 * @param userId - User identifier for cache isolation (required)
 * @returns Derived progress values with cache information
 * 
 * @example
 * ```typescript
 * function DueCardsPanel({ userId }: { userId: string }) {
 *   const { 
 *     dueCardCount, 
 *     dueCards, 
 *     successRate, 
 *     cacheStats,
 *     isFromCache 
 *   } = useDerivedProgress(userId);
 *   
 *   return (
 *     <div>
 *       <h2>Due for review: {dueCardCount}</h2>
 *       <p>Success rate: {successRate.toFixed(1)}%</p>
 *       {isFromCache && <small>📋 Cached result</small>}
 *     </div>
 *   );
 * }
 * ```
 */
export const useDerivedProgress = (userId: string | null = null): { dueCardCount: number; dueCards: CardProgress[]; successRate: number } => {
  const logger = useMemo(() => getLogger().setContext('useDerivedProgress'), []);

  // Get stable state values
  const cardProgress = useStore(useShallow((state) => state.progress.cardProgress));
  const sessionProgress = useStore(useShallow((state) => state.progress.sessionProgress));

  return useMemo(() => {
    const now = Date.now();
    const allCards = Object.values(cardProgress);
    
    // Calculate session success rate (always computed fresh)
    const { positionsCorrect, positionsAttempted } = sessionProgress;
    const successRate = positionsAttempted > 0 
      ? (positionsCorrect / positionsAttempted) * PERCENT 
      : 0;

    // If no userId provided, fall back to direct computation
    if (!userId) {
      logger.debug('No userId provided, using direct computation');
      const dueCards = getDueCardsFromMap(cardProgress, now);
      
      return {
        dueCardCount: dueCards.length,
        dueCards,
        successRate,
        totalCards: allCards.length,
        isFromCache: false,
        cacheStats: { available: false, totalEntries: 0, estimatedSize: 0, lastCleanup: null }
      };
    }

    // Create input hash for cache validation
    const inputHash = createInputHash({
      userId,
      cardCount: allCards.length,
      cardIds: allCards.map(c => c.id).sort(), // Sorted for consistency
      timestamp: Math.floor(now / (5 * 60 * 1000)) * (5 * 60 * 1000) // 5-minute buckets
    });

    // Try to get cached result
    const cachedResult = dueCardsCacheService.getDueCards(userId, inputHash);
    
    if (cachedResult) {
      logger.debug('Cache hit for due cards calculation', { 
        userId, 
        dueCount: cachedResult.dueCards.length,
        cacheAge: now - cachedResult.calculatedAt
      });

      return {
        dueCardCount: cachedResult.dueCards.length,
        dueCards: cachedResult.dueCards,
        successRate,
        totalCards: allCards.length,
        isFromCache: true,
        cacheStats: dueCardsCacheService.getCacheStats(),
        stats: cachedResult.stats
      };
    }

    // Cache miss: compute fresh and cache result
    logger.debug('Cache miss, computing fresh due cards', { userId, cardCount: allCards.length });
    
    const dueCards = filterDueCards(allCards, now);
    const stats = calculateDueCardsStats(allCards, dueCards, now);
    
    // Cache the result for future use
    try {
      dueCardsCacheService.setDueCards(userId, dueCards, stats, inputHash);
      logger.debug('Cached due cards calculation result', { 
        userId, 
        dueCount: dueCards.length 
      });
    } catch (error) {
      logger.warn('Failed to cache due cards result', { 
        userId, 
        error: (error as Error).message 
      });
    }

    return {
      dueCardCount: dueCards.length,
      dueCards,
      successRate,
      totalCards: allCards.length,
      isFromCache: false,
      cacheStats: dueCardsCacheService.getCacheStats(),
      stats
    };
  }, [cardProgress, sessionProgress, userId, logger]);
};

/**
 * Cache management hook for due cards cache
 * Provides cache control functions for advanced usage
 * 
 * @returns Cache management functions
 * 
 * @example
 * ```typescript
 * function CacheManager() {
 *   const { clearUserCache, clearAllCache, getCacheStats, forceCleanup } = useDueCardsCache();
 *   const stats = getCacheStats();
 *   
 *   return (
 *     <div>
 *       <p>Cache entries: {stats.totalEntries}</p>
 *       <button onClick={() => clearAllCache()}>Clear All Cache</button>
 *       <button onClick={() => forceCleanup()}>Force Cleanup</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useDueCardsCache = (): { clearUserCache: (userId: string) => void; clearAllCache: () => void; getCacheStats: () => unknown; forceCleanup: () => void } => {
  return useMemo(() => ({
    clearUserCache: (userId: string) => dueCardsCacheService.clearUserCache(userId),
    clearAllCache: () => dueCardsCacheService.clearAllCache(),
    getCacheStats: () => dueCardsCacheService.getCacheStats(),
    forceCleanup: () => dueCardsCacheService.forceCleanup(),
  }), []);
};