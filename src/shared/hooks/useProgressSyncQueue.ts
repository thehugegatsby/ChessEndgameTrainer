import { useRef, useCallback } from 'react';

export interface QueueItem {
  id: string;
  type: 'save' | 'sync';
  data?: unknown;
  timestamp: number;
  retries: number;
}

const MAX_QUEUE_SIZE = 100;

/**
 * Hook for managing the sync operation queue
 */
export function useProgressSyncQueue(): {
  addToQueue: (item: Omit<QueueItem, 'id'>) => string;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  getQueueItems: () => QueueItem[];
  clearQueue: () => void;
  getQueueSize: () => number;
  generateSyncId: () => string;
} {
  const queueRef = useRef<QueueItem[]>([]);
  const syncIdCounterRef = useRef(0);

  const generateSyncId = useCallback(() => {
    return `sync_${Date.now()}_${++syncIdCounterRef.current}`;
  }, []);

  const addToQueue = useCallback((item: Omit<QueueItem, 'id'>) => {
    const newItem: QueueItem = {
      ...item,
      id: generateSyncId(),
    };

    queueRef.current = [...queueRef.current, newItem].slice(-MAX_QUEUE_SIZE);
    return newItem.id;
  }, [generateSyncId]);

  const removeFromQueue = useCallback((id: string) => {
    queueRef.current = queueRef.current.filter(item => item.id !== id);
  }, []);

  const updateQueueItem = useCallback((id: string, updates: Partial<QueueItem>) => {
    queueRef.current = queueRef.current.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
  }, []);

  const getQueueItems = useCallback(() => [...queueRef.current], []);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
  }, []);

  const getQueueSize = useCallback(() => queueRef.current.length, []);

  return {
    addToQueue,
    removeFromQueue,
    updateQueueItem,
    getQueueItems,
    clearQueue,
    getQueueSize,
    generateSyncId,
  };
}