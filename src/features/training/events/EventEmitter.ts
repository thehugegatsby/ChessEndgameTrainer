/**
 * Type-safe EventEmitter for training system
 *
 * @description
 * Lightweight event system for UI communication without full EventBus complexity.
 * Uses TypeScript generics for compile-time type safety.
 */

/** Training system event types */
export interface TrainingEvents {
  'move:attempted': {
    from: string;
    to: string;
    promotion?: string;
  };
  'move:validated': {
    isValid: boolean;
    errorMessage?: string;
  };
  'move:applied': {
    fen: string;
    san: string;
    moveNumber: number;
  };
  'move:feedback': {
    type: 'success' | 'error' | 'warning';
    wasOptimal: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    bestMove?: string;
    playedMove?: string;
  };
  'game:complete': {
    result: 'win' | 'draw' | 'loss';
    reason: 'checkmate' | 'stalemate' | 'insufficient' | 'resignation';
    moveCount: number;
  };
  'opponent:thinking': {
    isThinking: boolean;
  };
  'opponent:moved': {
    move: string;
    fen: string;
  };
  'promotion:required': {
    from: string;
    to: string;
    color: 'w' | 'b';
  };
  'tablebase:evaluation': {
    fen: string;
    outcome: 'win' | 'draw' | 'loss';
    dtm?: number;
    dtz?: number;
    isLoading: boolean;
  };
  'tablebase:moves': {
    fen: string;
    moves: Array<{
      uci: string;
      san: string;
      outcome: 'win' | 'draw' | 'loss';
      dtm?: number;
    }>;
    isLoading: boolean;
  };
}

/** Event handler function type */
type EventHandler<T> = (data: T) => void;

/** Type-safe event emitter for training events */
export class TrainingEventEmitter {
  private handlers: Map<keyof TrainingEvents, Set<EventHandler<unknown>>> = new Map();
  private debug = false;

  constructor(debug = false) {
    this.debug = debug;
  }

  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  on<K extends keyof TrainingEvents>(
    event: K,
    handler: EventHandler<TrainingEvents[K]>
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    const eventHandlers = this.handlers.get(event) as Set<EventHandler<TrainingEvents[K]>>;
    eventHandlers.add(handler);

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(
        `[EventEmitter] Subscribed to ${String(event)}, total handlers: ${eventHandlers.size}`
      );
    }

    // Return unsubscribe function
    return () => {
      eventHandlers.delete(handler);
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.log(
          `[EventEmitter] Unsubscribed from ${String(event)}, remaining: ${eventHandlers.size}`
        );
      }
    };
  }

  /**
   * Subscribe to an event (one-time only)
   */
  once<K extends keyof TrainingEvents>(
    event: K,
    handler: EventHandler<TrainingEvents[K]>
  ): () => void {
    const wrappedHandler = (data: TrainingEvents[K]): void => {
      handler(data);
      this.off(event, wrappedHandler);
    };
    return this.on(event, wrappedHandler);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof TrainingEvents>(event: K, handler: EventHandler<TrainingEvents[K]>): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler as EventHandler<unknown>);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<K extends keyof TrainingEvents>(event: K, data: TrainingEvents[K]): void {
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(`[EventEmitter] Emitting ${String(event)}:`, data);
    }

    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers || eventHandlers.size === 0) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.log(`[EventEmitter] No handlers for ${String(event)}`);
      }
      return;
    }

    // Execute handlers
    eventHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[EventEmitter] Error in handler for ${String(event)}:`, error);
      }
    });
  }

  /**
   * Clear all event handlers
   */
  clear(): void {
    this.handlers.clear();
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log('[EventEmitter] All handlers cleared');
    }
  }

  /**
   * Clear handlers for specific event
   */
  clearEvent<K extends keyof TrainingEvents>(event: K): void {
    this.handlers.delete(event);
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(`[EventEmitter] Cleared handlers for ${String(event)}`);
    }
  }

  /**
   * Get handler count for debugging
   */
  getHandlerCount(event?: keyof TrainingEvents): number {
    if (event) {
      return this.handlers.get(event)?.size ?? 0;
    }

    let total = 0;
    this.handlers.forEach(handlers => {
      total += handlers.size;
    });
    return total;
  }
}

// Singleton instance for the app
export const trainingEvents = new TrainingEventEmitter(process.env.NODE_ENV === 'development');
