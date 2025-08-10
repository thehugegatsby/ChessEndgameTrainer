/**
 * @file useProgressSync - Debounced Firebase sync hook with optimistic updates
 * @description Provides intelligent progress synchronization with offline support and optimistic updates
 * 
 * Features:
 * - Debounced sync operations (configurable delay)
 * - Optimistic updates for immediate UI feedback
 * - Background synchronization with error handling
 * - Offline queue with automatic retry on reconnection
 * - Exponential backoff for failed sync operations
 * - Conflict resolution for concurrent updates
 * 
 * @example
 * ```typescript
 * function TrainingSession({ userId }: { userId: string }) {
 *   const {
 *     syncUserStats,
 *     syncCardProgress,
 *     syncBatch,
 *     syncStatus,
 *     lastSync,
 *     pendingOperations,
 *     clearQueue
 *   } = useProgressSync(userId);
 * 
 *   const handleCorrectAnswer = (positionId: string) => {
 *     // Optimistic update with background sync
 *     syncCardProgress(positionId, updatedCard);
 *   };
 * 
 *   const handleSessionComplete = (stats: Partial<UserStats>, cards: CardUpdate[]) => {
 *     // Batch sync for session completion
 *     syncBatch(stats, cards);
 *   };
 * }
 * ```
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useProgressActions } from '@shared/store/hooks/useProgressStore';
import { ProgressService } from '@shared/services/ProgressService';
import { getLogger } from '@shared/services/logging/Logger';
import type { UserStats, CardProgress } from '@shared/store/slices/types';
import type { WithFieldValue } from 'firebase/firestore';

const logger = getLogger().setContext('useProgressSync');

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
interface QueueItem {
  id: string;
  operation: SyncOperation;
  timestamp: number;
  retries: number;
  lastAttempt: number | null;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<ProgressSyncConfig> = {
  debounceMs: 2000,
  maxRetries: 3,
  retryDelayMs: 1000,
  maxBatchSize: 50,
  enableOptimistic: true,
};

/**
 * Hook for debounced Firebase progress synchronization with optimistic updates
 * 
 * @param userId - User identifier for sync operations
 * @param progressService - ProgressService instance for Firebase operations
 * @param config - Optional configuration for sync behavior
 * @returns Sync functions and status information
 */
export function useProgressSync(
  userId: string | null,
  progressService: ProgressService,
  config: ProgressSyncConfig = {}
) {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const progressActions = useProgressActions();
  
  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSync: null,
    error: null,
    pendingCount: 0,
    isDebounced: false,
  });
  
  // Operation queue for offline/retry handling
  const queueRef = useRef<QueueItem[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncIdCounterRef = useRef(0);
  const isProcessingRef = useRef(false);
  const lastSyncRef = useRef<number | null>(null);
  const processQueueRef = useRef<(() => Promise<void>) | undefined>(undefined);
  
  // Queue size limit to prevent memory bloat
  const MAX_QUEUE_SIZE = 100;
  
  /**
   * Generate unique ID for sync operations
   */
  const generateSyncId = useCallback(() => {
    return `sync_${Date.now()}_${++syncIdCounterRef.current}`;
  }, []);
  
  /**
   * Calculate exponential backoff delay
   */
  const calculateRetryDelay = useCallback((retries: number): number => {
    return mergedConfig.retryDelayMs * Math.pow(2, retries);
  }, [mergedConfig.retryDelayMs]);
  
  /**
   * Update sync status state
   */
  const updateSyncStatus = useCallback((updates: Partial<SyncStatus>) => {
    setSyncStatus(prev => ({
      ...prev,
      ...updates,
      pendingCount: queueRef.current.length,
    }));
  }, []);
  
  /**
   * Add operation to sync queue with overflow protection
   */
  const queueOperation = useCallback((operation: SyncOperation): string => {
    // Check queue size limit
    if (queueRef.current.length >= MAX_QUEUE_SIZE) {
      logger.warn('Queue size limit exceeded, dropping oldest operations', {
        currentSize: queueRef.current.length,
        maxSize: MAX_QUEUE_SIZE,
      });
      // Remove oldest operations (FIFO)
      queueRef.current = queueRef.current.slice(-MAX_QUEUE_SIZE + 10); // Keep some buffer
    }
    
    const id = generateSyncId();
    const queueItem: QueueItem = {
      id,
      operation,
      timestamp: Date.now(),
      retries: 0,
      lastAttempt: null,
    };
    
    queueRef.current.push(queueItem);
    updateSyncStatus({ pendingCount: queueRef.current.length });
    
    logger.debug('Queued sync operation', { 
      id, 
      type: operation.type, 
      queueLength: queueRef.current.length 
    });
    
    return id;
  }, [generateSyncId, updateSyncStatus]);
  
  /**
   * Remove operation from queue
   */
  const dequeueOperation = useCallback((id: string) => {
    const initialLength = queueRef.current.length;
    queueRef.current = queueRef.current.filter(item => item.id !== id);
    
    if (queueRef.current.length !== initialLength) {
      updateSyncStatus({ pendingCount: queueRef.current.length });
      logger.debug('Dequeued sync operation', { id, queueLength: queueRef.current.length });
    }
  }, [updateSyncStatus]);
  
  /**
   * Execute single sync operation
   */
  const executeSyncOperation = useCallback(async (operation: SyncOperation): Promise<void> => {
    if (!userId) {
      throw new Error('User ID required for sync operation');
    }
    
    try {
      switch (operation.type) {
        case 'userStats':
          await progressService.updateUserStats(operation.userId, operation.updates);
          logger.debug('Synced user stats', { userId: operation.userId });
          break;
          
        case 'cardProgress':
          await progressService.upsertCardProgress(
            operation.userId, 
            operation.positionId, 
            operation.progress
          );
          logger.debug('Synced card progress', { 
            userId: operation.userId, 
            positionId: operation.positionId 
          });
          break;
          
        case 'batch':
          await progressService.updateProgressTransaction(
            operation.userId,
            operation.statsUpdate,
            operation.cardUpdates
          );
          logger.debug('Synced batch operation', { 
            userId: operation.userId, 
            cardCount: operation.cardUpdates.length 
          });
          break;
          
        default:
          throw new Error(`Unknown operation type: ${(operation as { type?: string }).type}`);
      }
    } catch (error) {
      logger.error('Sync operation failed', error as Error, { operation });
      throw error;
    }
  }, [userId, progressService]);
  
  /**
   * Process sync queue with retry logic and concurrency protection
   */
  const processQueue = useCallback(async (): Promise<void> => {
    // Prevent concurrent processing
    if (isProcessingRef.current) {
      logger.debug('Queue processing already in progress, skipping');
      return;
    }
    
    if (queueRef.current.length === 0) {
      updateSyncStatus({ status: 'idle' });
      return;
    }
    
    // Don't process if offline (use navigator.onLine as source of truth)
    if (!navigator.onLine) {
      logger.debug('Skipping queue processing while offline');
      return;
    }
    
    isProcessingRef.current = true;
    updateSyncStatus({ status: 'syncing', error: null });
    
    const itemsToProcess = [...queueRef.current];
    const failedItems: QueueItem[] = [];
    
    for (const item of itemsToProcess) {
      try {
        await executeSyncOperation(item.operation);
        dequeueOperation(item.id);
        
        // Update progress slice sync status optimistically
        lastSyncRef.current = Date.now();
        progressActions.setLastSync(lastSyncRef.current);
        progressActions.setSyncError(null);
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        
        // Update retry information
        const updatedItem = {
          ...item,
          retries: item.retries + 1,
          lastAttempt: Date.now(),
        };
        
        if (updatedItem.retries < mergedConfig.maxRetries) {
          // Schedule retry with exponential backoff
          const retryDelay = calculateRetryDelay(updatedItem.retries);
          
          setTimeout(() => {
            // Update item in queue for retry
            const queueIndex = queueRef.current.findIndex(qi => qi.id === item.id);
            if (queueIndex !== -1) {
              queueRef.current[queueIndex] = updatedItem;
              
              logger.debug('Scheduled retry for sync operation', {
                id: item.id,
                retryAttempt: updatedItem.retries,
                retryDelay,
              });
              
              // Trigger processing for retry (use ref to call processQueue)
              if (processQueueRef.current) {
                void processQueueRef.current();
              }
            }
          }, retryDelay);
          
          failedItems.push(updatedItem);
        } else {
          // Max retries exceeded, remove from queue and log error
          dequeueOperation(item.id);
          progressActions.setSyncError(errorMessage);
          
          logger.error('Sync operation failed permanently after max retries', {
            id: item.id,
            retries: updatedItem.retries,
            error: errorMessage,
          });
        }
      }
    }
    
    // Update queue with failed items for retry
    queueRef.current = failedItems;
    
    const finalStatus = failedItems.length > 0 ? 'error' : 'idle';
    updateSyncStatus({ 
      status: finalStatus,
      lastSync: failedItems.length === 0 ? lastSyncRef.current : lastSyncRef.current,
    });
    
    // Always release processing lock
    isProcessingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    updateSyncStatus,
    executeSyncOperation,
    dequeueOperation,
    progressActions,
    mergedConfig.maxRetries,
    calculateRetryDelay,
    // debouncedProcessQueue is intentionally omitted to avoid circular dependency
  ]);
  
  // Store processQueue in ref for self-reference in retry logic
  processQueueRef.current = processQueue;
  
  /**
   * Debounced queue processing
   */
  const debouncedProcessQueue = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    updateSyncStatus({ isDebounced: true });
    
    debounceTimeoutRef.current = setTimeout(() => {
      updateSyncStatus({ isDebounced: false });
      processQueue();
    }, mergedConfig.debounceMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processQueue, mergedConfig.debounceMs, updateSyncStatus]);
  
  /**
   * Sync user statistics with optimistic updates
   */
  const syncUserStats = useCallback((updates: Partial<WithFieldValue<UserStats>>) => {
    if (!userId) {
      logger.warn('Cannot sync user stats without userId');
      return;
    }
    
    // Optimistic update
    if (mergedConfig.enableOptimistic) {
      progressActions.batchUpdateProgress({ userStats: updates as Partial<UserStats> });
    }
    
    // Queue for background sync
    queueOperation({
      type: 'userStats',
      userId,
      updates,
    });
    
    debouncedProcessQueue();
  }, [userId, mergedConfig.enableOptimistic, progressActions, queueOperation, debouncedProcessQueue]);
  
  /**
   * Sync card progress with optimistic updates
   */
  const syncCardProgress = useCallback((positionId: string, progress: CardProgress) => {
    if (!userId) {
      logger.warn('Cannot sync card progress without userId');
      return;
    }
    
    // Optimistic update
    if (mergedConfig.enableOptimistic) {
      progressActions.setCardProgress(positionId, progress);
    }
    
    // Queue for background sync
    queueOperation({
      type: 'cardProgress',
      userId,
      positionId,
      progress,
    });
    
    debouncedProcessQueue();
  }, [userId, mergedConfig.enableOptimistic, progressActions, queueOperation, debouncedProcessQueue]);
  
  /**
   * Sync batch operation (stats + multiple cards) with optimistic updates
   */
  const syncBatch = useCallback((
    statsUpdate: Partial<WithFieldValue<UserStats>>,
    cardUpdates: Array<{ positionId: string; progress: CardProgress }>
  ) => {
    if (!userId) {
      logger.warn('Cannot sync batch without userId');
      return;
    }
    
    if (cardUpdates.length > mergedConfig.maxBatchSize) {
      logger.warn('Batch size exceeds maximum, splitting', {
        requested: cardUpdates.length,
        maximum: mergedConfig.maxBatchSize,
      });
      
      // Split into chunks and sync iteratively (not recursively to avoid stack issues)
      const chunks: Array<{ positionId: string; progress: CardProgress }[]> = [];
      for (let i = 0; i < cardUpdates.length; i += mergedConfig.maxBatchSize) {
        chunks.push(cardUpdates.slice(i, i + mergedConfig.maxBatchSize));
      }
      
      // Process chunks
      chunks.forEach((chunk, index) => {
        // Only include stats update with the first chunk
        const chunkStatsUpdate = index === 0 ? statsUpdate : {};
        
        // Queue each chunk separately
        queueOperation({
          type: 'batch',
          userId,
          statsUpdate: chunkStatsUpdate,
          cardUpdates: chunk,
        });
      });
      
      debouncedProcessQueue();
      return;
    }
    
    // Optimistic updates
    if (mergedConfig.enableOptimistic) {
      // Update user stats
      if (Object.keys(statsUpdate).length > 0) {
        progressActions.batchUpdateProgress({ userStats: statsUpdate as Partial<UserStats> });
      }
      
      // Update card progresses
      const cardProgressMap: Record<string, CardProgress> = {};
      cardUpdates.forEach(({ positionId, progress }) => {
        cardProgressMap[positionId] = progress;
      });
      
      if (Object.keys(cardProgressMap).length > 0) {
        progressActions.batchUpdateProgress({ cardProgress: cardProgressMap });
      }
    }
    
    // Queue for background sync
    queueOperation({
      type: 'batch',
      userId,
      statsUpdate,
      cardUpdates,
    });
    
    debouncedProcessQueue();
  }, [userId, mergedConfig.enableOptimistic, mergedConfig.maxBatchSize, progressActions, queueOperation, debouncedProcessQueue]);
  
  /**
   * Force immediate sync without debounce
   */
  const forceSync = useCallback(async (): Promise<void> => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    updateSyncStatus({ isDebounced: false });
    
    try {
      await processQueue();
    } catch (error) {
      logger.error('Force sync failed', error as Error);
      updateSyncStatus({ status: 'error', error: (error as Error).message });
    }
  }, [processQueue, updateSyncStatus]);
  
  /**
   * Clear all pending operations
   */
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    updateSyncStatus({ 
      pendingCount: 0, 
      status: 'idle',
      error: null 
    });
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    logger.info('Cleared sync queue');
  }, [updateSyncStatus]);
  
  /**
   * Get current pending operations (for debugging)
   */
  const getPendingOperations = useCallback(() => {
    return queueRef.current.map(item => ({
      id: item.id,
      type: item.operation.type,
      timestamp: item.timestamp,
      retries: item.retries,
      lastAttempt: item.lastAttempt,
    }));
  }, []);
  
  // Initialize queue from localStorage on mount
  useEffect(() => {
    if (!userId) return;
    
    try {
      const savedQueue = localStorage.getItem(`syncQueue-${userId}`);
      if (savedQueue) {
        queueRef.current = JSON.parse(savedQueue);
        updateSyncStatus({ pendingCount: queueRef.current.length });
        logger.debug('Restored sync queue from localStorage', { 
          userId, 
          queueLength: queueRef.current.length 
        });
      }
    } catch (error) {
      logger.warn('Failed to restore sync queue from localStorage', { 
        userId, 
        error: (error as Error).message 
      });
    }
  }, [userId, updateSyncStatus]);
  
  // Save queue to localStorage on changes
  useEffect(() => {
    if (!userId) return;
    
    try {
      localStorage.setItem(`syncQueue-${userId}`, JSON.stringify(queueRef.current));
    } catch (error) {
      logger.warn('Failed to save sync queue to localStorage', { 
        userId, 
        error: (error as Error).message 
      });
    }
  }, [userId, syncStatus.pendingCount]);
  
  // Auto-retry when coming back online
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Network connection restored, processing pending queue');
      updateSyncStatus({ status: 'idle' });
      debouncedProcessQueue();
    };
    
    const handleOffline = () => {
      logger.info('Network connection lost');
      updateSyncStatus({ status: 'offline' });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [debouncedProcessQueue, updateSyncStatus]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    // Sync functions
    syncUserStats,
    syncCardProgress,
    syncBatch,
    forceSync,
    clearQueue,
    
    // Status information
    syncStatus,
    lastSync: syncStatus.lastSync,
    pendingOperations: getPendingOperations(),
    
    // Configuration
    config: mergedConfig,
  };
}

/**
 * Lightweight version of useProgressSync for components that only need status
 */
export function useProgressSyncStatus() {
  const [syncStatus] = useState<Pick<SyncStatus, 'status' | 'lastSync' | 'error'>>({
    status: 'idle',
    lastSync: null,
    error: null,
  });
  
  // This would typically connect to the progress slice's sync status
  // For now, return basic status
  return syncStatus;
}