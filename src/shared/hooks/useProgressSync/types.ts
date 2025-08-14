/**
 * @file types.ts - Shared TypeScript types for progress sync functionality
 * @description Common types used across the progress sync hooks
 */

import type { UserStats, CardProgress } from '@shared/store/slices/types';
import type { WithFieldValue } from 'firebase/firestore';

/**
 * Configuration for sync behavior
 */
export interface ProgressSyncConfig {
  /** Debounce delay in milliseconds (default: 2000ms) */
  debounceMs?: number;
  /** Maximum retry attempts for failed syncs (default: 3) */
  maxRetries?: number;
  /** Base retry delay in milliseconds (default: 1000ms) */
  retryDelayMs?: number;
  /** Maximum batch size for sync operations (default: 50) */
  maxBatchSize?: number;
  /** Enable optimistic updates (default: true) */
  enableOptimistic?: boolean;
}

/**
 * Sync operation types for queuing
 */
export type SyncOperation = 
  | { type: 'userStats'; userId: string; updates: Partial<WithFieldValue<UserStats>> }
  | { type: 'cardProgress'; userId: string; positionId: string; progress: CardProgress }
  | { type: 'batch'; userId: string; statsUpdate: Partial<WithFieldValue<UserStats>>; cardUpdates: Array<{ positionId: string; progress: CardProgress }> };

/**
 * Sync status information
 */
export interface SyncStatus {
  /** Current sync state */
  status: 'idle' | 'syncing' | 'error' | 'offline';
  /** Last successful sync timestamp */
  lastSync: number | null;
  /** Current error message if any */
  error: string | null;
  /** Number of pending operations in queue */
  pendingCount: number;
  /** Whether sync is currently debounced */
  isDebounced: boolean;
}

/**
 * Queue item for managing sync operations
 */
export interface QueueItem {
  id: string;
  operation: SyncOperation;
  timestamp: number;
  retries: number;
  lastAttempt: number | null;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<ProgressSyncConfig> = {
  debounceMs: 2000,
  maxRetries: 3,
  retryDelayMs: 1000,
  maxBatchSize: 50,
  enableOptimistic: true,
};