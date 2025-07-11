/**
 * @fileoverview Engine State Manager
 * @description Integrates Redux-like state management into the Engine
 * Provides dispatch method and state subscriptions
 */

import type { EngineState, EngineAction } from './state';
import { createInitialEngineState } from './state';
import { engineReducer } from './reducer';
import type { EngineConfig } from './types';

/**
 * State change listener type
 */
export type StateListener = (state: EngineState, action: EngineAction) => void;

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;

/**
 * Engine State Manager
 * Manages state updates and subscriptions for the Chess Engine
 */
export class EngineStateManager {
  private state: EngineState;
  private listeners: Set<StateListener> = new Set();
  private actionHistory: EngineAction[] = [];
  private maxHistorySize = 100;
  private isLoggingEnabled = false;

  constructor(initialConfig?: Partial<EngineConfig>) {
    this.state = createInitialEngineState(initialConfig);
  }

  /**
   * Dispatches an action to update state
   * @param action The action to dispatch
   */
  dispatch(action: EngineAction): void {
    const previousState = this.state;
    this.state = engineReducer(this.state, action);
    
    // Add to history
    this.actionHistory.push(action);
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }

    // Log if enabled
    if (this.isLoggingEnabled) {
      console.group(`Engine Action: ${action.type}`);
      console.log('Previous State:', previousState);
      console.log('Action:', action);
      console.log('Next State:', this.state);
      console.groupEnd();
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.state, action);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }

  /**
   * Gets the current state
   * @returns Current engine state (read-only)
   */
  getState(): Readonly<EngineState> {
    return this.state;
  }

  /**
   * Subscribes to state changes
   * @param listener Function to call on state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: StateListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Gets action history for debugging
   * @param limit Maximum number of actions to return
   * @returns Recent actions
   */
  getActionHistory(limit?: number): EngineAction[] {
    if (limit === undefined) {
      return [...this.actionHistory];
    }
    return this.actionHistory.slice(-limit);
  }

  /**
   * Clears action history
   */
  clearHistory(): void {
    this.actionHistory = [];
  }

  /**
   * Enables or disables state logging
   * @param enabled Whether to enable logging
   */
  setLogging(enabled: boolean): void {
    this.isLoggingEnabled = enabled;
  }

  /**
   * Sets maximum history size
   * @param size Maximum number of actions to keep in history
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(0, size);
    // Trim history if needed
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory = this.actionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Creates a snapshot of current state for debugging
   * @returns State snapshot with metadata
   */
  createSnapshot(): {
    state: EngineState;
    timestamp: number;
    historyLength: number;
  } {
    return {
      state: JSON.parse(JSON.stringify(this.state)), // Deep clone
      timestamp: Date.now(),
      historyLength: this.actionHistory.length,
    };
  }

  /**
   * Gets state metrics for monitoring
   * @returns Metrics object
   */
  getMetrics(): {
    queueLength: number;
    isProcessing: boolean;
    successRate: number;
    averageResponseTime: number;
    totalRequests: number;
    uptime: number | null;
  } {
    const metrics = this.state.metrics;
    const successRate = metrics.totalRequests > 0
      ? (metrics.successfulRequests / metrics.totalRequests) * 100
      : 0;

    return {
      queueLength: this.state.requests.queue.length,
      isProcessing: this.state.requests.isProcessing,
      successRate,
      averageResponseTime: metrics.averageResponseTime,
      totalRequests: metrics.totalRequests,
      uptime: metrics.initializationTime 
        ? Date.now() - metrics.initializationTime 
        : null,
    };
  }
}