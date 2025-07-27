// Integration tests for the complete offline queue system
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { OfflineQueueManager } from '../../../services/offlineQueue/OfflineQueueManager';
import { NetworkManager } from '../../../services/offlineQueue/NetworkManager';
import { SyncService } from '../../../services/sync';
import { supabase } from '../../../lib/supabase';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../../../lib/supabase');

describe('Offline Queue Integration', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  let queueManager: OfflineQueueManager;
  let networkManager: NetworkManager;
  let syncService: SyncService;
  let networkListener: (state: any) => void;

  const onlineState = {
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: {},
  };

  const offlineState = {
    type: 'none',
    isConnected: false,
    isInternetReachable: false,
    details: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset singletons
    (OfflineQueueManager as any).instance = null;
    (NetworkManager as any).instance = null;
    (SyncService as any).instance = null;

    // Setup AsyncStorage mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();

    // Setup NetInfo mocks
    mockNetInfo.fetch.mockResolvedValue(onlineState);
    mockNetInfo.addEventListener.mockImplementation((listener) => {
      networkListener = listener;
      return () => {};
    });

    // Setup Supabase mocks
    const mockQuery = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    mockSupabase.from.mockReturnValue(mockQuery as any);

    // Initialize services
    queueManager = OfflineQueueManager.getInstance();
    networkManager = NetworkManager.getInstance();
    syncService = SyncService.getInstance();

    await syncService.initialize();
    
    // Allow initialization to complete
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe('End-to-End Offline Workflow', () => {
    it('should queue operations when offline and sync when online', async () => {
      // Start offline
      networkListener(offlineState);

      // Queue a match creation while offline
      const matchData = {
        club_id: 'club123',
        player1_id: 'player1',
        player2_id: 'player2',
        scores: '6-4,6-3',
        match_type: 'singles' as const,
        date: '2025-01-01'
      };

      const operationId = await syncService.queueMatchCreation(matchData);
      expect(operationId).toBeDefined();

      // Verify operation is queued but not processed
      const pendingOps = syncService.getPendingOperations();
      expect(pendingOps).toHaveLength(1);
      expect(pendingOps[0].entity).toBe('match');
      expect(pendingOps[0].operation).toBe('create_match');

      // Setup successful Supabase response
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'supabase_match_123', ...matchData },
          error: null
        }),
      };
      mockSupabase.from.mockReturnValue(mockChain as any);

      // Go online - should trigger auto-sync
      networkListener(onlineState);
      
      // Allow auto-sync to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify operation was processed successfully
      const remainingPending = syncService.getPendingOperations();
      expect(remainingPending).toHaveLength(0);

      // Verify Supabase was called
      expect(mockSupabase.from).toHaveBeenCalledWith('matches');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining(matchData)
      );
    });

    it('should handle multiple operations of different types', async () => {
      // Start offline
      networkListener(offlineState);

      // Queue multiple different operations
      await syncService.queueMatchCreation({
        club_id: 'club123',
        player1_id: 'player1',
        scores: '6-4',
        match_type: 'singles',
        date: '2025-01-01'
      });

      await syncService.queueClubJoin('club123', 'user123');
      await syncService.queueProfileUpdate('user123', { name: 'New Name' });

      // Verify all operations are queued
      const pendingOps = syncService.getPendingOperations();
      expect(pendingOps).toHaveLength(3);

      const operationTypes = pendingOps.map(op => `${op.entity}:${op.operation}`);
      expect(operationTypes).toContain('match:create_match');
      expect(operationTypes).toContain('club:join_club');
      expect(operationTypes).toContain('user:update_profile');

      // Setup successful responses for all operations
      const successResponse = { data: { id: 'test123' }, error: null };
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(successResponse),
        eq: jest.fn().mockReturnThis(),
      };
      mockSupabase.from.mockReturnValue(mockChain as any);

      // Go online
      networkListener(onlineState);
      await new Promise(resolve => setTimeout(resolve, 100));

      // All operations should be processed
      expect(syncService.getPendingOperations()).toHaveLength(0);
      expect(mockSupabase.from).toHaveBeenCalledWith('matches');
      expect(mockSupabase.from).toHaveBeenCalledWith('club_members');
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed operations', async () => {
      // Queue an operation
      await syncService.queueMatchCreation({
        club_id: 'club123',
        player1_id: 'player1',
        scores: '6-4',
        match_type: 'singles',
        date: '2025-01-01'
      });

      // Setup initial failure then success
      let callCount = 0;
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: null, error: { message: 'Network error' } });
          }
          return Promise.resolve({ data: { id: 'success123' }, error: null });
        }),
      };
      mockSupabase.from.mockReturnValue(mockChain as any);

      // Process queue - should fail first time
      await queueManager.processQueue();

      let pendingOps = syncService.getPendingOperations();
      expect(pendingOps).toHaveLength(1);
      expect(pendingOps[0].retryCount).toBe(1);

      // Process again - should succeed
      await queueManager.processQueue();

      pendingOps = syncService.getPendingOperations();
      expect(pendingOps).toHaveLength(0);
      expect(callCount).toBe(2);
    });

    it('should move operations to dead letter queue after max retries', async () => {
      // Create queue manager with low retry limit for testing
      (OfflineQueueManager as any).instance = null;
      const testQueueManager = OfflineQueueManager.getInstance({ 
        maxRetries: 2,
        deadLetterQueueEnabled: true 
      });

      // Register strategies manually since we're using a new instance
      const strategies = [
        {
          entity: 'match',
          operation: 'create_match',
          execute: jest.fn().mockRejectedValue(new Error('Persistent failure')),
        }
      ];
      strategies.forEach(strategy => testQueueManager.registerStrategy(strategy));

      // Queue an operation
      await testQueueManager.addOperation('match', 'create_match', {
        club_id: 'club123',
        scores: '6-4',
        match_type: 'singles'
      });

      // Process queue multiple times to exceed retry limit
      await testQueueManager.processQueue(); // Attempt 1
      await testQueueManager.processQueue(); // Attempt 2

      const deadLetterOps = testQueueManager.getOperations('DEAD_LETTER');
      expect(deadLetterOps).toHaveLength(1);
      expect(deadLetterOps[0].retryCount).toBe(2);
    });
  });

  describe('Network State Transitions', () => {
    it('should not auto-sync when going offline', async () => {
      const processQueueSpy = jest.spyOn(queueManager, 'processQueue');

      // Start online
      networkListener(onlineState);
      processQueueSpy.mockClear();

      // Go offline
      networkListener(offlineState);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(processQueueSpy).not.toHaveBeenCalled();
    });

    it('should respect sync cooldown', async () => {
      const processQueueSpy = jest.spyOn(queueManager, 'processQueue');
      
      // Set short cooldown
      networkManager.setSyncCooldown(100);

      // Trigger multiple online transitions quickly
      networkListener(offlineState);
      networkListener(onlineState);
      networkListener(offlineState);
      networkListener(onlineState);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should only sync once due to cooldown
      expect(processQueueSpy).toHaveBeenCalledTimes(1);
    });

    it('should allow manual sync to bypass cooldown', async () => {
      const processQueueSpy = jest.spyOn(queueManager, 'processQueue');
      
      // Set long cooldown
      networkManager.setSyncCooldown(10000);

      // Trigger auto-sync
      networkListener(offlineState);
      networkListener(onlineState);
      await new Promise(resolve => setTimeout(resolve, 10));

      const autoSyncCount = processQueueSpy.mock.calls.length;

      // Trigger manual sync
      await syncService.sync();

      expect(processQueueSpy).toHaveBeenCalledTimes(autoSyncCount + 1);
    });
  });

  describe('Persistence Across App Restarts', () => {
    it('should load queued operations from storage on initialization', async () => {
      const savedQueue = JSON.stringify([
        {
          id: 'saved_op_123',
          entity: 'match',
          operation: 'create_match',
          payload: { club_id: 'club123', scores: '6-4' },
          status: 'PENDING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          type: 'CREATE',
        }
      ]);

      mockAsyncStorage.getItem.mockResolvedValueOnce(savedQueue);

      // Create new instance to test loading
      (OfflineQueueManager as any).instance = null;
      const newQueueManager = OfflineQueueManager.getInstance();

      // Allow initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const operations = newQueueManager.getOperations();
      expect(operations).toHaveLength(1);
      expect(operations[0].id).toBe('saved_op_123');
      expect(operations[0].entity).toBe('match');
    });

    it('should save operations to storage when they are added', async () => {
      await syncService.queueMatchCreation({
        club_id: 'club123',
        player1_id: 'player1',
        scores: '6-4',
        match_type: 'singles',
        date: '2025-01-01'
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@tennis_app_offline_queue',
        expect.any(String)
      );

      // Verify the saved data structure
      const savedData = mockAsyncStorage.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0]).toHaveProperty('id');
      expect(parsedData[0]).toHaveProperty('entity', 'match');
      expect(parsedData[0]).toHaveProperty('operation', 'create_match');
    });
  });

  describe('Sync Status Monitoring', () => {
    it('should provide accurate sync status', async () => {
      // Start with empty queue
      let status = syncService.getSyncStatus();
      expect(status.pendingCount).toBe(0);
      expect(status.failedCount).toBe(0);
      expect(status.isProcessing).toBe(false);

      // Add some operations
      await syncService.queueMatchCreation({
        club_id: 'club123',
        player1_id: 'player1',
        scores: '6-4',
        match_type: 'singles',
        date: '2025-01-01'
      });

      await syncService.queueClubJoin('club123', 'user123');

      status = syncService.getSyncStatus();
      expect(status.pendingCount).toBe(2);
      expect(status.failedCount).toBe(0);

      // Simulate one success and one failure
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: { id: 'success' }, error: null })
          .mockResolvedValueOnce({ data: null, error: { message: 'Failed' } }),
      };
      mockSupabase.from.mockReturnValue(mockChain as any);

      await queueManager.processQueue();

      status = syncService.getSyncStatus();
      expect(status.pendingCount).toBe(1); // One failed, pending retry
      expect(status.failedCount).toBe(0); // Not counted as failed until max retries
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));

      // Should not throw
      await expect(
        syncService.queueMatchCreation({
          club_id: 'club123',
          player1_id: 'player1',
          scores: '6-4',
          match_type: 'singles',
          date: '2025-01-01'
        })
      ).resolves.toBeDefined();
    });

    it('should handle NetInfo errors gracefully', () => {
      mockNetInfo.fetch.mockRejectedValue(new Error('NetInfo error'));

      // Should not throw
      expect(() => {
        (NetworkManager as any).instance = null;
        NetworkManager.getInstance();
      }).not.toThrow();
    });

    it('should handle Supabase connection errors', async () => {
      await syncService.queueMatchCreation({
        club_id: 'club123',
        player1_id: 'player1',
        scores: '6-4',
        match_type: 'singles',
        date: '2025-01-01'
      });

      // Simulate network/connection error
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      // Should not crash the app
      await expect(queueManager.processQueue()).resolves.toBeUndefined();

      // Operation should still be pending for retry
      const pendingOps = syncService.getPendingOperations();
      expect(pendingOps).toHaveLength(1);
    });
  });
});