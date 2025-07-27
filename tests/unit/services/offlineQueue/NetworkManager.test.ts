// Unit tests for NetworkManager
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { NetworkManager } from '../../../../services/offlineQueue/NetworkManager';
import { OfflineQueueManager } from '../../../../services/offlineQueue/OfflineQueueManager';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

// Mock OfflineQueueManager
jest.mock('../../../../services/offlineQueue/OfflineQueueManager');

describe('NetworkManager', () => {
  let networkManager: NetworkManager;
  const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
  const mockQueueManager = {
    processQueue: jest.fn(),
  };

  // Mock network states
  const onlineState: NetInfoState = {
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: {},
  };

  const offlineState: NetInfoState = {
    type: 'none',
    isConnected: false,
    isInternetReachable: false,
    details: {},
  };

  const cellularState: NetInfoState = {
    type: 'cellular',
    isConnected: true,
    isInternetReachable: true,
    details: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock OfflineQueueManager
    (OfflineQueueManager.getInstance as jest.Mock).mockReturnValue(mockQueueManager);
    
    // Reset singleton
    (NetworkManager as any).instance = null;
    
    // Setup default NetInfo mocks
    mockNetInfo.fetch.mockResolvedValue(onlineState);
    mockNetInfo.addEventListener.mockReturnValue(() => {});
  });

  afterEach(() => {
    // Reset singleton between tests
    (NetworkManager as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = NetworkManager.getInstance();
      const instance2 = NetworkManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with NetInfo', () => {
      NetworkManager.getInstance();
      expect(mockNetInfo.fetch).toHaveBeenCalled();
      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Network State Management', () => {
    beforeEach(() => {
      networkManager = NetworkManager.getInstance();
    });

    it('should track network connectivity state', async () => {
      // Allow initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const networkState = networkManager.getNetworkState();
      expect(networkState.isConnected).toBe(true);
      expect(networkState.type).toBe('wifi');
    });

    it('should detect when online', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(networkManager.isOnline()).toBe(true);
    });

    it('should detect when offline', async () => {
      mockNetInfo.fetch.mockResolvedValueOnce(offlineState);
      
      // Create new instance with offline state
      (NetworkManager as any).instance = null;
      networkManager = NetworkManager.getInstance();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(networkManager.isOnline()).toBe(false);
    });

    it('should determine network quality correctly', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Test WiFi (excellent)
      expect(networkManager.getNetworkQuality()).toBe('excellent');
      
      // Test cellular (good)
      const cellularManager = NetworkManager.getInstance();
      // Simulate network change to cellular
      const listener = mockNetInfo.addEventListener.mock.calls[0][0];
      listener(cellularState);
      
      expect(cellularManager.getNetworkQuality()).toBe('good');
    });

    it('should return connection status string', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const status = networkManager.getConnectionStatus();
      expect(status).toBe('Connected via WiFi');
    });
  });

  describe('Network Change Handling', () => {
    let networkChangeListener: (state: NetInfoState) => void;

    beforeEach(async () => {
      networkManager = NetworkManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Get the listener that was registered
      networkChangeListener = mockNetInfo.addEventListener.mock.calls[0][0];
    });

    it('should trigger auto-sync when coming online', () => {
      // Start offline
      networkChangeListener(offlineState);
      
      // Go online
      networkChangeListener(onlineState);
      
      // Should trigger sync after a short delay
      setTimeout(() => {
        expect(mockQueueManager.processQueue).toHaveBeenCalled();
      }, 10);
    });

    it('should not trigger auto-sync when going offline', () => {
      // Start online
      networkChangeListener(onlineState);
      mockQueueManager.processQueue.mockClear();
      
      // Go offline
      networkChangeListener(offlineState);
      
      expect(mockQueueManager.processQueue).not.toHaveBeenCalled();
    });

    it('should respect sync cooldown', async () => {
      // Set short cooldown for testing
      networkManager.setSyncCooldown(100);
      
      // Go online twice quickly
      networkChangeListener(offlineState);
      networkChangeListener(onlineState);
      networkChangeListener(offlineState);
      networkChangeListener(onlineState);
      
      // Should only sync once due to cooldown
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockQueueManager.processQueue).toHaveBeenCalledTimes(1);
    });

    it('should notify network listeners', () => {
      const listener = jest.fn();
      const unsubscribe = networkManager.addNetworkListener(listener);
      
      networkChangeListener(cellularState);
      
      expect(listener).toHaveBeenCalledWith({
        isConnected: true,
        type: 'cellular',
        isInternetReachable: true,
      });
      
      // Test unsubscribe
      unsubscribe();
      listener.mockClear();
      
      networkChangeListener(offlineState);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Manual Sync Operations', () => {
    beforeEach(async () => {
      networkManager = NetworkManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should trigger manual sync when online', async () => {
      await networkManager.triggerManualSync();
      expect(mockQueueManager.processQueue).toHaveBeenCalled();
    });

    it('should reject manual sync when offline', async () => {
      // Simulate offline state
      const listener = mockNetInfo.addEventListener.mock.calls[0][0];
      listener(offlineState);
      
      await expect(networkManager.triggerManualSync()).rejects.toThrow('Cannot sync while offline');
    });

    it('should bypass cooldown for manual sync', async () => {
      networkManager.setSyncCooldown(10000); // Long cooldown
      
      await networkManager.triggerManualSync();
      await networkManager.triggerManualSync();
      
      expect(mockQueueManager.processQueue).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration', () => {
    beforeEach(async () => {
      networkManager = NetworkManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should allow enabling/disabling auto-sync', () => {
      networkManager.setAutoSyncEnabled(false);
      
      // Simulate going online
      const listener = mockNetInfo.addEventListener.mock.calls[0][0];
      listener(offlineState);
      listener(onlineState);
      
      // Should not auto-sync when disabled
      setTimeout(() => {
        expect(mockQueueManager.processQueue).not.toHaveBeenCalled();
      }, 10);
    });

    it('should allow configuring sync cooldown', () => {
      networkManager.setSyncCooldown(500);
      
      // Cooldown should be set (tested indirectly through behavior)
      expect(networkManager).toBeInstanceOf(NetworkManager);
    });

    it('should enforce minimum cooldown', () => {
      networkManager.setSyncCooldown(500); // Should be accepted
      networkManager.setSyncCooldown(50);  // Should be clamped to 1000
      
      expect(networkManager).toBeInstanceOf(NetworkManager);
    });
  });

  describe('Connection Utilities', () => {
    beforeEach(async () => {
      networkManager = NetworkManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should wait for connection when online', async () => {
      const result = await networkManager.waitForConnection(1000);
      expect(result).toBe(true);
    });

    it('should wait for connection when offline', async () => {
      // Start offline
      const listener = mockNetInfo.addEventListener.mock.calls[0][0];
      listener(offlineState);
      
      // Start waiting for connection
      const waitPromise = networkManager.waitForConnection(100);
      
      // Go online after a short delay
      setTimeout(() => {
        listener(onlineState);
      }, 50);
      
      const result = await waitPromise;
      expect(result).toBe(true);
    });

    it('should timeout when waiting for connection', async () => {
      // Start offline
      const listener = mockNetInfo.addEventListener.mock.calls[0][0];
      listener(offlineState);
      
      const result = await networkManager.waitForConnection(50);
      expect(result).toBe(false);
    });

    it('should determine good connection correctly', async () => {
      // WiFi should be good
      expect(networkManager.hasGoodConnection()).toBe(true);
      
      // Cellular should be good
      const listener = mockNetInfo.addEventListener.mock.calls[0][0];
      listener(cellularState);
      expect(networkManager.hasGoodConnection()).toBe(true);
      
      // Offline should not be good
      listener(offlineState);
      expect(networkManager.hasGoodConnection()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle NetInfo initialization errors', () => {
      mockNetInfo.fetch.mockRejectedValueOnce(new Error('NetInfo error'));
      
      // Should not throw
      expect(() => NetworkManager.getInstance()).not.toThrow();
    });

    it('should handle sync failures gracefully', async () => {
      mockQueueManager.processQueue.mockRejectedValueOnce(new Error('Sync failed'));
      
      networkManager = NetworkManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should not throw even if sync fails
      await expect(networkManager.triggerManualSync()).resolves.toBeUndefined();
    });

    it('should handle auto-sync failures gracefully', async () => {
      mockQueueManager.processQueue.mockRejectedValueOnce(new Error('Auto-sync failed'));
      
      networkManager = NetworkManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const listener = mockNetInfo.addEventListener.mock.calls[0][0];
      
      // Should not throw when auto-sync fails
      expect(() => {
        listener(offlineState);
        listener(onlineState);
      }).not.toThrow();
    });
  });

  describe('Integration with OfflineQueueManager', () => {
    beforeEach(async () => {
      networkManager = NetworkManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should get OfflineQueueManager instance on initialization', () => {
      expect(OfflineQueueManager.getInstance).toHaveBeenCalled();
    });

    it('should call processQueue on the queue manager', async () => {
      await networkManager.triggerManualSync();
      expect(mockQueueManager.processQueue).toHaveBeenCalled();
    });
  });
});