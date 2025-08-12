/**
 * Example React component showing direct event subscription
 * 
 * @description
 * This replaces the complex Event-Bridge with direct subscriptions
 * in components that need to react to training events.
 */

import { useEffect } from 'react';
import { trainingEvents } from '../events/EventEmitter';
import type { TrainingEvents } from '../events/EventEmitter';
import { useStore } from '@shared/store/rootStore';
import { useEventDrivenTraining } from '../hooks/useEventDrivenTraining';
import type { WritableDraft } from 'immer';
import type { RootState } from '@shared/store/slices/types';

/**
 * Component that listens to training events and updates the store
 * This is a simpler alternative to the Event-Bridge pattern
 */
export function TrainingEventListener(): null {
  const isEventDriven = useEventDrivenTraining();
  
  useEffect(() => {
    // Only subscribe if event-driven mode is enabled
    if (!isEventDriven) {
      return;
    }
    
    // Subscribe to move feedback events
    const unsubscribeFeedback = trainingEvents.on('move:feedback', (data) => {
      if (data.type === 'error') {
        // Show error dialog
        useStore.setState((draft: WritableDraft<RootState>) => {
          draft.training.moveErrorDialog = {
            isOpen: true,
            ...(data.wdlBefore !== undefined && { wdlBefore: data.wdlBefore }),
            ...(data.wdlAfter !== undefined && { wdlAfter: data.wdlAfter }),
            ...(data.bestMove !== undefined && { bestMove: data.bestMove }),
          };
        });
      } else if (data.type === 'success') {
        // Show success toast
        useStore.setState((draft: WritableDraft<RootState>) => {
          draft.ui.toasts.push({
            id: Date.now().toString(),
            message: 'Guter Zug!',
            type: 'success'
          });
        });
      }
    });
    
    // Subscribe to game complete events
    const unsubscribeComplete = trainingEvents.on('game:complete', (data) => {
      useStore.setState((draft: WritableDraft<RootState>) => {
        draft.training.isSuccess = data.result === 'win';
        draft.training.mistakeCount = data.moveCount;
      });
    });
    
    // Subscribe to opponent thinking events
    const unsubscribeThinking = trainingEvents.on('opponent:thinking', (data) => {
      useStore.setState((draft: WritableDraft<RootState>) => {
        draft.training.isPlayerTurn = !data.isThinking;
      });
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribeFeedback();
      unsubscribeComplete();
      unsubscribeThinking();
    };
  }, [isEventDriven]);
  
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
  const isEventDriven = useEventDrivenTraining();
  
  useEffect(() => {
    if (!isEventDriven) {
      return;
    }
    
    const unsubscribe = trainingEvents.on(event, handler);
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isEventDriven]);
}