/**
 * @fileoverview Instance Management for ScenarioEngine
 * Handles instance counting, validation, and memory management
 */

import { Chess } from 'chess.js';
import { Engine } from '../../engine';

const { MAX_INSTANCES } = require('../types').SCENARIO_CONFIG;

// Global instance counter shared across all ScenarioEngine instances
// This maintains backward compatibility with the original design
let globalInstanceCount = 0;

/**
 * Instance management and validation logic
 * Handles FEN validation, instance counting, and engine initialization
 */
export class InstanceManager {

  /**
   * Validates FEN string format
   */
  static validateFen(fen: string): void {
    if (!fen || typeof fen !== 'string' || fen.trim() === '') {
      const error = new Error('FEN must be a non-empty string');
      throw error;
    }
  }

  /**
   * Tracks instance count for memory management on mobile
   * AI_NOTE: Instance tracking is CRITICAL for mobile performance. Each instance holds
   * references to Chess.js, Engine Worker, and caches. Android devices crash with >5 instances.
   */
  static trackInstanceCount(): void {
    globalInstanceCount++;
    // Instance count tracking for mobile performance
  }

  /**
   * Decrements instance count during cleanup
   */
  static decrementInstanceCount(): void {
    globalInstanceCount--;
  }

  /**
   * Gets current instance count
   */
  static getInstanceCount(): number {
    return globalInstanceCount;
  }

  /**
   * Resets instance count - FOR TESTING ONLY
   * This should only be used in test environments to reset state
   */
  static resetInstanceCount(): void {
    globalInstanceCount = 0;
  }

  /**
   * Validates engine initialization
   */
  static validateEngineInitialization(engine: Engine): void {
    if (!engine) {
      throw new Error('[ScenarioEngine] Engine failed to initialize');
    }
  }

  /**
   * Creates and validates a Chess instance with FEN
   */
  static createChessInstance(fen: string): Chess {
    try {
      return new Chess(fen);
    } catch (error) {
      throw new Error(`[ScenarioEngine] Invalid FEN: ${fen}`);
    }
  }

  /**
   * Updates Chess instance position with validation
   */
  static updateChessPosition(chess: Chess, fen: string): void {
    InstanceManager.validateFen(fen);
    
    try {
      chess.load(fen);
    } catch (error) {
      throw new Error(`[ScenarioEngine] Invalid FEN: ${fen}`);
    }
  }

  /**
   * Resets Chess instance to initial position
   */
  static resetChessPosition(chess: Chess, initialFen: string): void {
    try {
      chess.load(initialFen);
    } catch (error) {
      throw new Error('[ScenarioEngine] Failed to reset to initial position');
    }
  }
}