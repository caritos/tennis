// Unit tests for useSync hook
import { renderHook, act } from '@testing-library/react-native';
import { useSync, useNetworkStatus } from '../../../hooks/useSync';
import { syncService } from '../../../services/sync';

// Mock the sync service
jest.mock('../../../services/sync', () => ({
  syncService: {
    initialize: jest.fn(),
    getSyncStatus: jest.fn(),
    getPendingOperations: jest.fn(),
    getFailedOperations: jest.fn(),
    getNetworkQuality: jest.fn(),
    sync: jest.fn(),
    retryFailedOperations: jest.fn(),
    clearCompletedOperations: jest.fn(),
    setAutoSyncEnabled: jest.fn(),
    addNetworkListener: jest.fn(),
    isOnline: jest.fn(),
  },
}));

describe('useSync', () => {
  const mockSyncService = syncService as jest.Mocked<typeof syncService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup default mock returns
    mockSyncService.initialize.mockResolvedValue();
    mockSyncService.getSyncStatus.mockReturnValue({
      isOnline: true,
      isProcessing: false,
      pendingCount: 0,
      failedCount: 0,
      connectionStatus: 'Connected via WiFi',
    });
    mockSyncService.getPendingOperations.mockReturnValue([]);
    mockSyncService.getFailedOperations.mockReturnValue([]);
    mockSyncService.getNetworkQuality.mockReturnValue('excellent');
    mockSyncService.addNetworkListener.mockReturnValue(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize sync service on mount', async () => {
      renderHook(() => useSync());

      expect(mockSyncService.initialize).toHaveBeenCalled();
    });

    it('should return initial sync status', () => {
      const { result } = renderHook(() => useSync());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.failedCount).toBe(0);
      expect(result.current.connectionStatus).toBe('Connected via WiFi');
      expect(result.current.networkQuality).toBe('excellent');
    });

    it('should return operations arrays', () => {
      const mockPendingOps = [
        { id: 'op1', status: 'PENDING' as const, entity: 'match', operation: 'create_match' }
      ];
      const mockFailedOps = [
        { id: 'op2', status: 'FAILED' as const, entity: 'club', operation: 'join_club' }
      ];

      mockSyncService.getPendingOperations.mockReturnValue(mockPendingOps as any);
      mockSyncService.getFailedOperations.mockReturnValue(mockFailedOps as any);

      const { result } = renderHook(() => useSync());

      expect(result.current.pendingOperations).toEqual(mockPendingOps);
      expect(result.current.failedOperations).toEqual(mockFailedOps);
    });
  });

  describe('Sync Actions', () => {
    it('should trigger manual sync', async () => {
      mockSyncService.sync.mockResolvedValue();

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.sync();
      });

      expect(mockSyncService.sync).toHaveBeenCalled();
      expect(result.current.syncError).toBeUndefined();
    });

    it('should handle sync errors', async () => {
      const error = new Error('Sync failed');
      mockSyncService.sync.mockRejectedValue(error);

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.sync();
      });

      expect(result.current.syncError).toBe('Sync failed');
    });

    it('should retry failed operations', async () => {
      mockSyncService.retryFailedOperations.mockResolvedValue();

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.retryFailed();
      });

      expect(mockSyncService.retryFailedOperations).toHaveBeenCalled();
      expect(result.current.syncError).toBeUndefined();
    });

    it('should handle retry errors', async () => {
      const error = new Error('Retry failed');
      mockSyncService.retryFailedOperations.mockRejectedValue(error);

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.retryFailed();
      });

      expect(result.current.syncError).toBe('Retry failed');
    });

    it('should clear completed operations', async () => {
      mockSyncService.clearCompletedOperations.mockResolvedValue();

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.clearCompleted();
      });

      expect(mockSyncService.clearCompletedOperations).toHaveBeenCalled();
    });

    it('should set auto-sync enabled/disabled', () => {
      const { result } = renderHook(() => useSync());

      act(() => {
        result.current.setAutoSync(false);
      });

      expect(mockSyncService.setAutoSyncEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Network Listener Integration', () => {
    it('should add network listener on mount', () => {
      renderHook(() => useSync());

      expect(mockSyncService.addNetworkListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should update status when network changes', () => {
      let networkListener: (isOnline: boolean, connectionStatus: string) => void;
      
      mockSyncService.addNetworkListener.mockImplementation((callback) => {
        networkListener = callback;
        return () => {};
      });

      const { result } = renderHook(() => useSync());

      // Simulate network change
      act(() => {
        networkListener!(false, 'Offline');
      });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.connectionStatus).toBe('Offline');
    });

    it('should clean up network listener on unmount', () => {
      const unsubscribe = jest.fn();
      mockSyncService.addNetworkListener.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useSync());

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Status Updates', () => {
    it('should update status periodically', () => {
      renderHook(() => useSync());

      // Fast-forward time to trigger the interval
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should call getSyncStatus multiple times due to the interval
      expect(mockSyncService.getSyncStatus).toHaveBeenCalledTimes(2); // Initial + interval
    });

    it('should update status after actions', async () => {
      mockSyncService.sync.mockResolvedValue();

      const { result } = renderHook(() => useSync());

      const initialCallCount = mockSyncService.getSyncStatus.mock.calls.length;

      await act(async () => {
        await result.current.sync();
      });

      expect(mockSyncService.getSyncStatus).toHaveBeenCalledTimes(initialCallCount + 1);
    });

    it('should clean up interval on unmount', () => {
      const { unmount } = renderHook(() => useSync());

      unmount();

      const initialCallCount = mockSyncService.getSyncStatus.mock.calls.length;

      // Advance time after unmount
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should not call getSyncStatus after unmount
      expect(mockSyncService.getSyncStatus).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle sync service initialization errors', async () => {
      mockSyncService.initialize.mockRejectedValue(new Error('Init failed'));

      // Should not throw
      expect(() => renderHook(() => useSync())).not.toThrow();
    });

    it('should handle status update errors', () => {
      mockSyncService.getSyncStatus.mockImplementation(() => {
        throw new Error('Status error');
      });

      // Should not throw
      expect(() => renderHook(() => useSync())).not.toThrow();
    });

    it('should clear sync error on successful operations', async () => {
      // First, set an error
      mockSyncService.sync.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.sync();
      });

      expect(result.current.syncError).toBe('First error');

      // Then succeed
      mockSyncService.sync.mockResolvedValueOnce();

      await act(async () => {
        await result.current.sync();
      });

      expect(result.current.syncError).toBeUndefined();
    });
  });
});

describe('useNetworkStatus', () => {
  const mockSyncService = syncService as jest.Mocked<typeof syncService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSyncService.initialize.mockResolvedValue();
    mockSyncService.isOnline.mockReturnValue(true);
    mockSyncService.getNetworkQuality.mockReturnValue('excellent');
    mockSyncService.addNetworkListener.mockReturnValue(() => {});
  });

  it('should return network status', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.connectionStatus).toBe('Checking...');
    expect(result.current.networkQuality).toBe('excellent');
  });

  it('should initialize sync service', () => {
    renderHook(() => useNetworkStatus());

    expect(mockSyncService.initialize).toHaveBeenCalled();
  });

  it('should add network listener', () => {
    renderHook(() => useNetworkStatus());

    expect(mockSyncService.addNetworkListener).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should update status on network changes', () => {
    let networkListener: (isOnline: boolean, status: string) => void;
    
    mockSyncService.addNetworkListener.mockImplementation((callback) => {
      networkListener = callback;
      return () => {};
    });

    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      networkListener!(false, 'Offline');
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.connectionStatus).toBe('Offline');
  });

  it('should clean up listener on unmount', () => {
    const unsubscribe = jest.fn();
    mockSyncService.addNetworkListener.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should handle initialization errors gracefully', () => {
    mockSyncService.initialize.mockRejectedValue(new Error('Init failed'));

    expect(() => renderHook(() => useNetworkStatus())).not.toThrow();
  });
});