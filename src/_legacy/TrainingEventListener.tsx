/**
 * Example React component showing direct event subscription
 *
 * @description
 * This replaces the complex Event-Bridge with direct subscriptions
 * in components that need to react to training events.
 */

import { useEffect } from 'react';
import { trainingEvents } from '@domains/training/events/EventEmitter';
import type { TrainingEvents } from '@domains/training/events/EventEmitter';
import { useStoreApi } from '@shared/store/StoreContext';
// Event-driven is now standard - no feature flag needed
import { produce } from 'immer';
import type { WritableDraft } from 'immer';
import type { RootState } from '@shared/store/slices/types';

/**
 * Component that listens to training events and updates the store
 * This is a simpler alternative to the Event-Bridge pattern
 */
export function TrainingEventListener(): null {
  const store = useStoreApi();

  useEffect(() => {
    // Event-driven is now standard - always subscribe

    // Subscribe to move feedback events
    const unsubscribeFeedback = trainingEvents.on('move:feedback', data => {
      if (data.type === 'error') {
        // Show error dialog
        store.setState(
          produce((draft: WritableDraft<RootState>) => {
            draft.training.moveErrorDialog = {
              isOpen: true,
              ...(data.wdlBefore !== undefined && { wdlBefore: data.wdlBefore }),
              ...(data.wdlAfter !== undefined && { wdlAfter: data.wdlAfter }),
              ...(data.bestMove !== undefined && { bestMove: data.bestMove }),
            };
          })
        );
      } else if (data.type === 'success') {
        // Show success toast
        store.setState(
          produce((draft: WritableDraft<RootState>) => {
            draft.ui.toasts.push({
              id: Date.now().toString(),
              message: 'Guter Zug!',
              type: 'success',
            });
          })
        );
      }
    });

    // Subscribe to game complete events
    const unsubscribeComplete = trainingEvents.on('game:complete', data => {
      store.setState(
        produce((draft: WritableDraft<RootState>) => {
          draft.training.isSuccess = data.result === 'win';
          draft.training.mistakeCount = data.moveCount;
        })
      );
    });

    // Subscribe to opponent thinking events
    const unsubscribeThinking = trainingEvents.on('opponent:thinking', data => {
      store.setState(
        produce((draft: WritableDraft<RootState>) => {
          draft.training.isPlayerTurn = !data.isThinking;
        })
      );
    });

    // Subscribe to tablebase evaluation events
    const unsubscribeTablebaseEval = trainingEvents.on('tablebase:evaluation', data => {
      store.setState(
        produce((draft: WritableDraft<RootState>) => {
          // Store tablebase evaluation in UI state for other components
          draft.ui.tablebaseData = {
            fen: data.fen,
            evaluation: {
              outcome: data.outcome,
              ...(data.dtm !== undefined && { dtm: data.dtm }),
              ...(data.dtz !== undefined && { dtz: data.dtz }),
            },
            isLoading: data.isLoading,
            lastUpdated: Date.now(),
          };
        })
      );
    });

    // Subscribe to tablebase moves events
    const unsubscribeTablebaseMoves = trainingEvents.on('tablebase:moves', data => {
      store.setState(
        produce((state: WritableDraft<RootState>) => {
          // Update tablebase data with moves
          if (state.ui.tablebaseData && state.ui.tablebaseData.fen === data.fen) {
            state.ui.tablebaseData.moves = data.moves;
            state.ui.tablebaseData.isLoading = data.isLoading;
            state.ui.tablebaseData.lastUpdated = Date.now();
          }
        })
      );
    });

    // Cleanup on unmount
    return () => {
      unsubscribeFeedback();
      unsubscribeComplete();
      unsubscribeThinking();
      unsubscribeTablebaseEval();
      unsubscribeTablebaseMoves();
    };
  }, [store]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook for components that need to subscribe to a single event
 * Simpler than the complex Event-Bridge
 */
export function useTrainingEvent<K extends keyof TrainingEvents>(
  event: K,
  handler: (data: TrainingEvents[K]) => void,
  _deps: React.DependencyList = []
): void {
  useEffect(() => {
    // Event-driven is now standard - always subscribe
    const unsubscribe = trainingEvents.on(event, handler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}
