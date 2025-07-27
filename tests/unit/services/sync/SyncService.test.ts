// Unit tests for SyncService
import { SyncService, syncService } from '../../../../services/sync';
import { OfflineQueueManager } from '../../../../services/offlineQueue/OfflineQueueManager';
import { NetworkManager } from '../../../../services/offlineQueue/NetworkManager';
import { getAllSyncStrategies } from '../../../../services/offlineQueue/SyncStrategies';

// Mock dependencies
jest.mock('../../../../services/offlineQueue/OfflineQueueManager');
jest.mock('../../../../services/offlineQueue/NetworkManager');
jest.mock('../../../../services/offlineQueue/SyncStrategies');

describe('SyncService', () => {
  let service: SyncService;
  const mockQueueManager = {
    registerStrategy: jest.fn(),
    setHooks: jest.fn(),
    addOperation: jest.fn(),
    processQueue: jest.fn(),
    getSyncStatus: jest.fn(),
    getOperations: jest.fn(),
    retryFailedOperations: jest.fn(),
    clearCompletedOperations: jest.fn(),
  };

  const mockNetworkManager = {
    isOnline: jest.fn(),
    getConnectionStatus: jest.fn(),
    triggerManualSync: jest.fn(),
    setAutoSyncEnabled: jest.fn(),
    addNetworkListener: jest.fn(),
    waitForConnection: jest.fn(),
    getNetworkQuality: jest.fn(),
  };

  const mockStrategies = [
    { entity: 'match', operation: 'create_match', execute: jest.fn() },
    { entity: 'club', operation: 'join_club', execute: jest.fn() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    (OfflineQueueManager.getInstance as jest.Mock).mockReturnValue(mockQueueManager);
    (NetworkManager.getInstance as jest.Mock).mockReturnValue(mockNetworkManager);
    (getAllSyncStrategies as jest.Mock).mockReturnValue(mockStrategies);
    
    // Reset singleton
    (SyncService as any).instance = null;
    service = SyncService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = SyncService.getInstance();
      const instance2 = SyncService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should be accessible via exported singleton', () => {
      expect(syncService).toBeInstanceOf(SyncService);
    });
  });

  describe('Initialization', () => {
    it('should register all sync strategies on initialization', async () => {
      await service.initialize();

      expect(getAllSyncStrategies).toHaveBeenCalled();
      expect(mockQueueManager.registerStrategy).toHaveBeenCalledTimes(mockStrategies.length);
      
      mockStrategies.forEach(strategy => {
        expect(mockQueueManager.registerStrategy).toHaveBeenCalledWith(strategy);
      });
    });

    it('should set up queue hooks on initialization', async () => {
      await service.initialize();

      expect(mockQueueManager.setHooks).toHaveBeenCalledWith(
        expect.objectContaining({
          onOperationAdded: expect.any(Function),
          onOperationSuccess: expect.any(Function),
          onOperationFailed: expect.any(Function),
          onQueueProcessingStarted: expect.any(Function),
          onQueueProcessingCompleted: expect.any(Function),
        })
      );
    });

    it('should process existing queue if online after initialization', async () => {
      mockNetworkManager.isOnline.mockReturnValue(true);

      await service.initialize();

      expect(mockQueueManager.processQueue).toHaveBeenCalled();
    });

    it('should not process queue if offline after initialization', async () => {
      mockNetworkManager.isOnline.mockReturnValue(false);

      await service.initialize();

      expect(mockQueueManager.processQueue).not.toHaveBeenCalled();
    });

    it('should not reinitialize if already initialized', async () => {
      await service.initialize();
      mockQueueManager.registerStrategy.mockClear();
      
      await service.initialize();
      
      expect(mockQueueManager.registerStrategy).not.toHaveBeenCalled();
    });
  });

  describe('Match Operations', () => {
    beforeEach(async () => {
      await service.initialize();
      mockQueueManager.addOperation.mockResolvedValue('operation123');
    });

    it('should queue match creation', async () => {
      const matchData = {
        club_id: 'club123',
        player1_id: 'player1',
        player2_id: 'player2',
        scores: '6-4,6-3',
        match_type: 'singles' as const,
        date: '2025-01-01'
      };

      const operationId = await service.queueMatchCreation(matchData, 'localMatch123');

      expect(mockQueueManager.addOperation).toHaveBeenCalledWith(
        'match',
        'create_match',
        matchData,
        { localId: 'localMatch123' }
      );
      expect(operationId).toBe('operation123');
    });

    it('should queue match update', async () => {
      const updateData = {
        scores: '6-2,6-1',
        notes: 'Updated scores'
      };

      const operationId = await service.queueMatchUpdate('match123', updateData);

      expect(mockQueueManager.addOperation).toHaveBeenCalledWith(
        'match',
        'update_match',
        { id: 'match123', ...updateData }
      );
      expect(operationId).toBe('operation123');
    });

    it('should queue match deletion', async () => {
      const operationId = await service.queueMatchDeletion('match123');

      expect(mockQueueManager.addOperation).toHaveBeenCalledWith(
        'match',
        'delete_match',
        { id: 'match123' }
      );
      expect(operationId).toBe('operation123');
    });
  });

  describe('Club Operations', () => {
    beforeEach(async () => {
      await service.initialize();
      mockQueueManager.addOperation.mockResolvedValue('operation123');
    });

    it('should queue club join', async () => {
      const operationId = await service.queueClubJoin('club123', 'user123');

      expect(mockQueueManager.addOperation).toHaveBeenCalledWith(
        'club',
        'join_club',
        { club_id: 'club123', user_id: 'user123' }
      );
      expect(operationId).toBe('operation123');
    });

    it('should queue club leave', async () => {
      const operationId = await service.queueClubLeave('club123', 'user123');

      expect(mockQueueManager.addOperation).toHaveBeenCalledWith(
        'club',
        'leave_club',
        { club_id: 'club123', user_id: 'user123' }
      );
      expect(operationId).toBe('operation123');
    });
  });

  describe('User Operations', () => {
    beforeEach(async () => {
      await service.initialize();
      mockQueueManager.addOperation.mockResolvedValue('operation123');
    });

    it('should queue profile update', async () => {
      const updateData = {
        name: 'New Name',
        email: 'newemail@example.com'
      };

      const operationId = await service.queueProfileUpdate('user123', updateData);

      expect(mockQueueManager.addOperation).toHaveBeenCalledWith(
        'user',
        'update_profile',
        { id: 'user123', ...updateData }
      );
      expect(operationId).toBe('operation123');
    });
  });

  describe('Challenge Operations', () => {
    beforeEach(async () => {
      await service.initialize();
      mockQueueManager.addOperation.mockResolvedValue('operation123');
    });

    it('should queue challenge creation', async () => {
      const additionalData = { message: 'Let\'s play!' };

      const operationId = await service.queueChallengeCreation(
        'challenger123',
        'challenged123',
        'club123',
        additionalData
      );

      expect(mockQueueManager.addOperation).toHaveBeenCalledWith(
        'challenge',
        'create_challenge',
        {
          challenger_id: 'challenger123',
          challenged_id: 'challenged123',
          club_id: 'club123',
          message: 'Let\'s play!'
        }
      );
      expect(operationId).toBe('operation123');
    });

    it('should queue challenge response', async () => {
      const operationId = await service.queueChallengeResponse('challenge123', 'accepted');

      expect(mockQueueManager.addOperation).toHaveBeenCalledWith(
        'challenge',
        'respond_challenge',
        {
          challenge_id: 'challenge123',
          response: 'accepted',
          responded_at: expect.any(String)
        }
      );
      expect(operationId).toBe('operation123');
    });
  });

  describe('Sync Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should trigger manual sync when online', async () => {
      mockNetworkManager.isOnline.mockReturnValue(true);

      await service.sync();

      expect(mockNetworkManager.triggerManualSync).toHaveBeenCalled();
    });

    it('should throw error when trying to sync offline', async () => {
      mockNetworkManager.isOnline.mockReturnValue(false);
      mockNetworkManager.triggerManualSync.mockRejectedValue(new Error('Cannot sync while offline'));

      await expect(service.sync()).rejects.toThrow('Cannot sync while offline');
    });

    it('should get sync status including network status', () => {
      const mockStatus = {
        isOnline: false,
        isProcessing: true,
        pendingCount: 5,
        failedCount: 2,
        lastSyncAt: Date.now()
      };

      mockQueueManager.getSyncStatus.mockReturnValue(mockStatus);
      mockNetworkManager.isOnline.mockReturnValue(true);
      mockNetworkManager.getConnectionStatus.mockReturnValue('Connected via WiFi');

      const status = service.getSyncStatus();

      expect(status).toEqual({
        ...mockStatus,
        isOnline: true,
        connectionStatus: 'Connected via WiFi'
      });
    });

    it('should get pending operations', () => {
      const mockOperations = [
        { id: 'op1', status: 'PENDING' },
        { id: 'op2', status: 'PENDING' }
      ];

      mockQueueManager.getOperations.mockReturnValue(mockOperations);

      const operations = service.getPendingOperations();

      expect(mockQueueManager.getOperations).toHaveBeenCalledWith('PENDING');
      expect(operations).toEqual(mockOperations);
    });

    it('should get failed operations', () => {
      const failedOps = [{ id: 'op1', status: 'FAILED' }];
      const deadLetterOps = [{ id: 'op2', status: 'DEAD_LETTER' }];

      mockQueueManager.getOperations
        .mockReturnValueOnce(failedOps)
        .mockReturnValueOnce(deadLetterOps);

      const operations = service.getFailedOperations();

      expect(mockQueueManager.getOperations).toHaveBeenCalledWith('FAILED');
      expect(mockQueueManager.getOperations).toHaveBeenCalledWith('DEAD_LETTER');
      expect(operations).toEqual([...failedOps, ...deadLetterOps]);
    });

    it('should retry failed operations', async () => {
      await service.retryFailedOperations();

      expect(mockQueueManager.retryFailedOperations).toHaveBeenCalled();
    });

    it('should clear completed operations', async () => {
      await service.clearCompletedOperations();

      expect(mockQueueManager.clearCompletedOperations).toHaveBeenCalled();
    });
  });

  describe('Network Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should set auto-sync enabled/disabled', () => {
      service.setAutoSyncEnabled(false);

      expect(mockNetworkManager.setAutoSyncEnabled).toHaveBeenCalledWith(false);
    });

    it('should add network listener', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      
      mockNetworkManager.addNetworkListener.mockReturnValue(unsubscribe);

      const result = service.addNetworkListener(callback);

      expect(mockNetworkManager.addNetworkListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(result).toBe(unsubscribe);

      // Test that the wrapper calls our callback correctly
      const networkListener = mockNetworkManager.addNetworkListener.mock.calls[0][0];
      networkListener({ isConnected: true, type: 'wifi', isInternetReachable: true });

      expect(callback).toHaveBeenCalledWith(true, expect.any(String));
    });

    it('should wait for network connection', async () => {
      mockNetworkManager.waitForConnection.mockResolvedValue(true);

      const result = await service.waitForConnection(5000);

      expect(mockNetworkManager.waitForConnection).toHaveBeenCalledWith(5000);
      expect(result).toBe(true);
    });

    it('should check if online', () => {
      mockNetworkManager.isOnline.mockReturnValue(true);

      const result = service.isOnline();

      expect(mockNetworkManager.isOnline).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should get network quality', () => {
      mockNetworkManager.getNetworkQuality.mockReturnValue('excellent');

      const result = service.getNetworkQuality();

      expect(mockNetworkManager.getNetworkQuality).toHaveBeenCalled();
      expect(result).toBe('excellent');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      mockQueueManager.registerStrategy.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      // Should not throw
      await expect(service.initialize()).resolves.toBeUndefined();
    });

    it('should handle queue operation errors', async () => {
      await service.initialize();
      mockQueueManager.addOperation.mockRejectedValue(new Error('Queue failed'));

      await expect(service.queueMatchCreation({
        club_id: 'club123',
        player1_id: 'player1',
        scores: '6-4',
        match_type: 'singles',
        date: '2025-01-01'
      })).rejects.toThrow('Queue failed');
    });

    it('should handle sync errors', async () => {
      await service.initialize();
      mockNetworkManager.triggerManualSync.mockRejectedValue(new Error('Sync failed'));

      await expect(service.sync()).rejects.toThrow('Sync failed');
    });
  });

  describe('Hook Integration', () => {
    it('should log operations through hooks', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.initialize();

      // Get the hooks that were set
      const hooksCall = mockQueueManager.setHooks.mock.calls[0][0];

      // Test operation added hook
      hooksCall.onOperationAdded({ entity: 'match', operation: 'create_match' });
      expect(consoleSpy).toHaveBeenCalledWith('📝 Operation queued:', 'match', 'create_match');

      // Test operation success hook
      hooksCall.onOperationSuccess({ entity: 'match', operation: 'create_match' }, 'result');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Operation synced:', 'match', 'create_match');

      // Test operation failed hook
      hooksCall.onOperationFailed({ entity: 'match', operation: 'create_match' }, 'error');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Operation failed:', 'match', 'create_match', 'error');

      // Test queue processing hooks
      hooksCall.onQueueProcessingStarted();
      expect(consoleSpy).toHaveBeenCalledWith('🔄 Starting sync...');

      hooksCall.onQueueProcessingCompleted({ success: 5, failed: 1 });
      expect(consoleSpy).toHaveBeenCalledWith('✨ Sync completed:', { success: 5, failed: 1 });

      consoleSpy.mockRestore();
    });
  });
});