/**
 * In-memory storage implementation for rollout state
 * Useful for testing and environments without filesystem access
 */

import { StoragePort } from './StoragePort';
import { RolloutState } from '../types';

export class MemoryStorage implements StoragePort {
  private state: RolloutState | null = null;
  
  async read(): Promise<RolloutState | null> {
    return this.state;
  }
  
  async write(state: RolloutState): Promise<void> {
    this.state = state;
  }
  
  async update(updateFn: (current: RolloutState | null) => RolloutState | null): Promise<boolean> {
    const newState = updateFn(this.state);
    
    if (newState === null || newState === this.state) {
      return false;
    }
    
    this.state = newState;
    return true;
  }
  
  async clear(): Promise<void> {
    this.state = null;
  }
}