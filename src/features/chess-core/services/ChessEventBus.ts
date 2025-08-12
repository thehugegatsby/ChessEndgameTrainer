/**
 * ChessEventBus - Event management for chess operations
 * 
 * This class handles event subscription and emission for chess-related events,
 * providing a decoupled communication mechanism between components.
 * Part of the Clean Architecture refactoring.
 */

import type { IChessEventBus, ChessEventHandler, ChessEventPayload } from "../types/interfaces";

export default class ChessEventBus implements IChessEventBus {
  private listeners: Set<ChessEventHandler> = new Set();
  private eventHistory: ChessEventPayload[] = [];
  private static readonly MAX_HISTORY_SIZE = 100;
  private isEnabled: boolean = true;

  /**
   * Subscribe to chess events
   */
  public subscribe(handler: ChessEventHandler): () => void {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }

    this.listeners.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(handler);
    };
  }

  /**
   * Emit an event to all subscribers
   */
  public emit(event: ChessEventPayload): void {
    if (!this.isEnabled) {
      return;
    }

    // Add to history for debugging
    this.addToHistory(event);

    // Notify all listeners
    this.listeners.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        // Prevent one handler's error from affecting others
        console.error('Error in event handler:', error);
      }
    });
  }

  /**
   * Clear all event listeners
   */
  public clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }

  /**
   * Get the count of active listeners
   */
  public getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Get event history for debugging
   */
  public getHistory(): ChessEventPayload[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Enable or disable event emission
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if event bus is enabled
   */
  public isEventBusEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Add event to history with size limit
   */
  private addToHistory(event: ChessEventPayload): void {
    this.eventHistory.push(event);
    
    // Maintain max history size
    if (this.eventHistory.length > ChessEventBus.MAX_HISTORY_SIZE) {
      this.eventHistory = this.eventHistory.slice(-ChessEventBus.MAX_HISTORY_SIZE);
    }
  }

  /**
   * Get the last emitted event
   */
  public getLastEvent(): ChessEventPayload | undefined {
    return this.eventHistory[this.eventHistory.length - 1];
  }

  /**
   * Filter history by event type
   */
  public getEventsByType(type: ChessEventPayload['type']): ChessEventPayload[] {
    return this.eventHistory.filter(event => event.type === type);
  }

  /**
   * Remove a specific listener
   */
  public removeListener(handler: ChessEventHandler): boolean {
    return this.listeners.delete(handler);
  }

  /**
   * Check if a handler is subscribed
   */
  public hasListener(handler: ChessEventHandler): boolean {
    return this.listeners.has(handler);
  }
}