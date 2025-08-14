/**
 * @file useSyncQueue.ts - Queue management for sync operations
 * @description Manages the queue of pending sync operations with overflow protection
 */

import { useRef, useState, useCallback } from 'react';
import { getLogger } from '@shared/services/logging/Logger';
import type { SyncOperation, QueueItem } from './types';

const logger = getLogger().setContext('useSyncQueue');

// Queue size limit to prevent memory bloat
const MAX_QUEUE_SIZE = 100;

interface UseSyncQueueReturn {
  enqueue: (operation: SyncOperation) => string;
  dequeue: (id: string) => void;
  getNextItem: () => QueueItem | undefined;
  clearQueue: () => void;
  queueSize: number;
  getPendingOperations: () => Array<{ id: string; type: string; timestamp: number; retries: number }>;
}

/**
 * Hook for managing the sync operation queue
 */
export function useSyncQueue(): UseSyncQueueReturn {
  const queueRef = useRef<QueueItem[]>([]);
  const [queueSize, setQueueSize] = useState(0);
  const syncIdCounterRef = useRef(0);

  /**
   * Generate unique ID for sync operations
   */
  const generateSyncId = useCallback(() => {
    return `sync_${Date.now()}_${++syncIdCounterRef.current}`;
  }, []);

  /**
   * Add operation to sync queue with overflow protection
   */
  const enqueue = useCallback((operation: SyncOperation): string => {
    // Check queue size limit
    if (queueRef.current.length >= MAX_QUEUE_SIZE) {
      logger.warn('Queue size limit exceeded, dropping oldest operations', {
        currentSize: queueRef.current.length,
        maxSize: MAX_QUEUE_SIZE,
      });
      // Remove oldest operations (FIFO)
      const keepBuffer = 10;
      queueRef.current = queueRef.current.slice(-MAX_QUEUE_SIZE + keepBuffer);
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
    setQueueSize(queueRef.current.length);
    
    logger.debug('Queued sync operation', { 
      id, 
      type: operation.type, 
      queueLength: queueRef.current.length 
    });
    
    return id;
  }, [generateSyncId]);

  /**
   * Remove operation from queue
   */
  const dequeue = useCallback((id: string) => {
    const initialLength = queueRef.current.length;
    queueRef.current = queueRef.current.filter(item => item.id !== id);
    
    if (queueRef.current.length !== initialLength) {
      setQueueSize(queueRef.current.length);
      logger.debug('Dequeued sync operation', { id, queueLength: queueRef.current.length });
    }
  }, []);

  /**
   * Get the next item to process without removing it
   */
  const getNextItem = useCallback((): QueueItem | undefined => {
    return queueRef.current[0];
  }, []);

  /**
   * Clear all pending operations
   */
  const clearQueue = useCallback(() => {
    const count = queueRef.current.length;
    queueRef.current = [];
    setQueueSize(0);
    
    if (count > 0) {
      logger.info('Cleared sync queue', { clearedCount: count });
    }
  }, []);

  /**
   * Get list of pending operations for display
   */
  const getPendingOperations = useCallback((): Array<{ id: string; type: string; timestamp: number; retries: number }> => {
    return queueRef.current.map(item => ({
      id: item.id,
      type: item.operation.type,
      timestamp: item.timestamp,
      retries: item.retries,
    }));
  }, []);

  return {
    enqueue,
    dequeue,
    getNextItem,
    clearQueue,
    queueSize,
    getPendingOperations,
  };
}