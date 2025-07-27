// React hook for sync status and operations
import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/sync';
import { SyncStatus, QueueOperation } from '../services/offlineQueue/types';

interface UseSyncReturn {
  // Status
  isOnline: boolean;
  isProcessing: boolean;
  pendingCount: number;
  failedCount: number;
  connectionStatus: string;
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
  lastSyncAt?: number;

  // Operations
  pendingOperations: QueueOperation[];
  failedOperations: QueueOperation[];

  // Actions
  sync: () => Promise<void>;
  retryFailed: () => Promise<void>;
  clearCompleted: () => Promise<void>;
  setAutoSync: (enabled: boolean) => void;

  // State
  syncError?: string;
}

export function useSync(): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus & { connectionStatus: string }>({
    isOnline: false,
    isProcessing: false,
    pendingCount: 0,
    failedCount: 0,
    connectionStatus: 'Checking...',
  });

  const [pendingOperations, setPendingOperations] = useState<QueueOperation[]>([]);
  const [failedOperations, setFailedOperations] = useState<QueueOperation[]>([]);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');
  const [syncError, setSyncError] = useState<string>();

  // Update sync status
  const updateSyncStatus = useCallback(() => {
    const status = syncService.getSyncStatus();
    setSyncStatus(status);
    
    const pending = syncService.getPendingOperations();
    setPendingOperations(pending);
    
    const failed = syncService.getFailedOperations();
    setFailedOperations(failed);
    
    const quality = syncService.getNetworkQuality();
    setNetworkQuality(quality);
  }, []);

  // Manual sync
  const sync = useCallback(async () => {
    try {
      setSyncError(undefined);
      await syncService.sync();
      updateSyncStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncError(errorMessage);
      console.error('Manual sync failed:', error);
    }
  }, [updateSyncStatus]);

  // Retry failed operations
  const retryFailed = useCallback(async () => {
    try {
      setSyncError(undefined);
      await syncService.retryFailedOperations();
      updateSyncStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';
      setSyncError(errorMessage);
      console.error('Retry failed operations failed:', error);
    }
  }, [updateSyncStatus]);

  // Clear completed operations
  const clearCompleted = useCallback(async () => {
    try {
      await syncService.clearCompletedOperations();
      updateSyncStatus();
    } catch (error) {
      console.error('Clear completed operations failed:', error);
    }
  }, [updateSyncStatus]);

  // Set auto-sync enabled/disabled
  const setAutoSync = useCallback((enabled: boolean) => {
    syncService.setAutoSyncEnabled(enabled);
  }, []);

  // Set up listeners and update status
  useEffect(() => {
    // Initialize sync service
    syncService.initialize().then(() => {
      updateSyncStatus();
    });

    // Listen for network changes
    const unsubscribeNetwork = syncService.addNetworkListener((isOnline, connectionStatus) => {
      setSyncStatus(prev => ({
        ...prev,
        isOnline,
        connectionStatus,
      }));
      setNetworkQuality(syncService.getNetworkQuality());
    });

    // Set up interval to update sync status periodically
    const statusInterval = setInterval(updateSyncStatus, 5000); // Update every 5 seconds

    return () => {
      unsubscribeNetwork();
      clearInterval(statusInterval);
    };
  }, [updateSyncStatus]);

  return {
    // Status
    isOnline: syncStatus.isOnline,
    isProcessing: syncStatus.isProcessing,
    pendingCount: syncStatus.pendingCount,
    failedCount: syncStatus.failedCount,
    connectionStatus: syncStatus.connectionStatus,
    networkQuality,
    lastSyncAt: syncStatus.lastSyncAt,

    // Operations
    pendingOperations,
    failedOperations,

    // Actions
    sync,
    retryFailed,
    clearCompleted,
    setAutoSync,

    // State
    syncError,
  };
}

/**
 * Hook for network status only (lighter weight)
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');

  useEffect(() => {
    // Initialize and get current status
    syncService.initialize().then(() => {
      setIsOnline(syncService.isOnline());
      setNetworkQuality(syncService.getNetworkQuality());
    });

    // Listen for changes
    const unsubscribe = syncService.addNetworkListener((online, status) => {
      setIsOnline(online);
      setConnectionStatus(status);
      setNetworkQuality(syncService.getNetworkQuality());
    });

    return unsubscribe;
  }, []);

  return {
    isOnline,
    connectionStatus,
    networkQuality,
  };
}