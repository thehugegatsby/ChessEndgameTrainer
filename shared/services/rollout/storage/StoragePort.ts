/**
 * Storage port interface for rollout state persistence
 * Allows swapping between different storage implementations
 */

import { RolloutState } from '../types';

export interface StoragePort {
  /**
   * Read the current rollout state
   */
  read(): Promise<RolloutState | null>;
  
  /**
   * Write the rollout state atomically
   */
  write(state: RolloutState): Promise<void>;
  
  /**
   * Atomically update the state using an update function
   * The update function receives the current state and returns the new state
   * If the update function returns null, no update is performed
   */
  update(updateFn: (current: RolloutState | null) => RolloutState | null): Promise<boolean>;
  
  /**
   * Clear the stored state
   */
  clear(): Promise<void>;
}

export interface StorageConfig {
  type: 'file' | 'redis' | 'memory';
  filePath?: string;
  redisUrl?: string;
  keyPrefix?: string;
}