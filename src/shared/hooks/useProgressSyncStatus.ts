import { useState, useCallback } from 'react';

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'success';
  lastSync: number | null;
  error: string | null;
  pendingCount: number;
  isDebounced: boolean;
}

/**
 * Hook for managing sync status state
 */
export function useProgressSyncStatus(): {
  syncStatus: SyncStatus;
  updateSyncStatus: (updates: Partial<SyncStatus>) => void;
  setSyncing: () => void;
  setSuccess: (timestamp: number) => void;
  setError: (error: string) => void;
  setIdle: () => void;
  setPendingCount: (count: number) => void;
  setDebounced: (isDebounced: boolean) => void;
} {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSync: null,
    error: null,
    pendingCount: 0,
    isDebounced: false,
  });

  const updateSyncStatus = useCallback((updates: Partial<SyncStatus>) => {
    setSyncStatus(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const setSyncing = useCallback(() => {
    updateSyncStatus({
      status: 'syncing',
      error: null,
    });
  }, [updateSyncStatus]);

  const setSuccess = useCallback((timestamp: number) => {
    updateSyncStatus({
      status: 'success',
      lastSync: timestamp,
      error: null,
      pendingCount: 0,
    });
  }, [updateSyncStatus]);

  const setError = useCallback((error: string) => {
    updateSyncStatus({
      status: 'error',
      error,
    });
  }, [updateSyncStatus]);

  const setIdle = useCallback(() => {
    updateSyncStatus({
      status: 'idle',
      error: null,
    });
  }, [updateSyncStatus]);

  const setPendingCount = useCallback((count: number) => {
    updateSyncStatus({ pendingCount: count });
  }, [updateSyncStatus]);

  const setDebounced = useCallback((isDebounced: boolean) => {
    updateSyncStatus({ isDebounced });
  }, [updateSyncStatus]);

  return {
    syncStatus,
    updateSyncStatus,
    setSyncing,
    setSuccess,
    setError,
    setIdle,
    setPendingCount,
    setDebounced,
  };
}