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
 * Hook for accessing derived progress values
 * Computes values from state rather than storing them
 * 
 * @returns Derived progress values
 * 
 * @remarks
 * Performance note: This hook recomputes values on every render.
 * For apps with hundreds of cards, consider memoization.
 * Current implementation is efficient for typical use (< 200 cards).
 * 
 * @example
 * ```typescript
 * function DueCardsPanel() {
 *   const { dueCardCount, dueCards, successRate } = useDerivedProgress();
 *   
 *   return (
 *     <div>
 *       <h2>Due for review: {dueCardCount}</h2>
 *       <p>Session success rate: {successRate.toFixed(1)}%</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useDerivedProgress = () => {
  return useStore((state) => {
    // NOTE: This computation runs on every state change
    // For large card counts (> 500), consider using useMemo or reselect
    const now = Date.now();
    const allCards = Object.values(state.progress.cardProgress);
    const dueCards = allCards.filter(card => card.nextReviewAt <= now);
    
    // Calculate session success rate
    const { positionsCorrect, positionsAttempted } = state.progress.sessionProgress;
    const successRate = positionsAttempted > 0 
      ? (positionsCorrect / positionsAttempted) * 100 
      : 0;
    
    return {
      dueCardCount: dueCards.length,
      dueCards,
      successRate,
      totalCards: allCards.length,
    };
  });
};