// Integration tests for service offline queue integration
import { syncService } from '../../../services/sync';
import { ClubService } from '../../../services/clubService';
import { AuthService } from '../../../services/authService';
import { ChallengeService } from '../../../services/challengeService';
import { MatchInvitationService } from '../../../services/matchInvitationService';
import { MatchService } from '../../../services/matchService';

// Mock external dependencies but keep services real
jest.mock('../../../lib/supabase');
jest.mock('../../../database/database');
jest.mock('../../../services/offlineQueue/OfflineQueueManager');
jest.mock('../../../services/offlineQueue/NetworkManager');

describe('Service Offline Queue Integration', () => {
  const mockQueueManager = {
    addOperation: jest.fn(),
    registerStrategy: jest.fn(),
    setHooks: jest.fn(),
    processQueue: jest.fn(),
    getSyncStatus: jest.fn(),
    getOperations: jest.fn(),
    retryFailedOperations: jest.fn(),
    clearCompletedOperations: jest.fn(),
  };

  const mockNetworkManager = {
    isOnline: jest.fn().mockReturnValue(true),
    getConnectionStatus: jest.fn().mockReturnValue('Connected'),
    addNetworkListener: jest.fn(),
    triggerManualSync: jest.fn(),
    setAutoSyncEnabled: jest.fn(),
    waitForConnection: jest.fn(),
    getNetworkQuality: jest.fn(),
  };

  const mockDb = {
    runAsync: jest.fn().mockResolvedValue(undefined),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Reset singleton instances
    (syncService as any).isInitialized = false;
    
    // Mock dependencies
    const { OfflineQueueManager } = await import('../../../services/offlineQueue/OfflineQueueManager');
    const { NetworkManager } = await import('../../../services/offlineQueue/NetworkManager');
    const { initializeDatabase } = await import('../../../database/database');
    
    (OfflineQueueManager.getInstance as jest.Mock).mockReturnValue(mockQueueManager);
    (NetworkManager.getInstance as jest.Mock).mockReturnValue(mockNetworkManager);
    (initializeDatabase as jest.Mock).mockResolvedValue(mockDb);

    // Setup mock return values
    mockQueueManager.addOperation.mockResolvedValue('operation123');
    mockDb.getFirstAsync.mockResolvedValue({ id: 'user123' });

    // Initialize sync service
    await syncService.initialize();
  });

  describe('Cross-Service Queue Operations', () => {
    it('should queue operations from all services through the same sync service', async () => {
      const clubService = new (ClubService as any)();
      const authService = new (AuthService as any)();
      const challengeService = ChallengeService.getInstance();
      const invitationService = MatchInvitationService.getInstance();
      const matchService = new (MatchService as any)();

      // Perform operations from each service
      await clubService.joinClub('club123', 'user123');
      await authService.updateProfile('user123', { full_name: 'Updated Name' });
      await challengeService.createChallenge({
        club_id: 'club123',
        challenger_id: 'user123',
        challenged_id: 'user456',
        match_type: 'singles',
      });
      await invitationService.createInvitation({
        club_id: 'club123',
        creator_id: 'user123',
        match_type: 'singles',
        date: '2025-02-01',
      });
      await matchService.recordMatch({
        club_id: 'club123',
        player1_id: 'user123',
        player2_id: 'user456',
        scores: '6-4,6-3',
        match_type: 'singles',
        date: '2025-01-28',
      });

      // Verify all operations were queued through the same queue manager
      expect(mockQueueManager.addOperation).toHaveBeenCalledTimes(5);
      
      // Verify operation types
      const operations = mockQueueManager.addOperation.mock.calls;
      expect(operations).toEqual(expect.arrayContaining([
        ['club', 'join_club', expect.any(Object)],
        ['user', 'update_profile', expect.any(Object)],
        ['challenge', 'create_challenge', expect.any(Object)],
        ['invitation', 'create_invitation', expect.any(Object)],
        ['match', 'create_match', expect.any(Object), expect.any(Object)],
      ]));
    });

    it('should handle queue failures gracefully across all services', async () => {
      mockQueueManager.addOperation.mockRejectedValue(new Error('Queue is full'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const clubService = new (ClubService as any)();
      const authService = new (AuthService as any)();

      // Operations should complete despite queue failures
      await expect(clubService.joinClub('club123', 'user123')).resolves.toBeUndefined();
      await expect(authService.updateProfile('user123', { full_name: 'Test' })).resolves.toBeDefined();

      // Should log warnings
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to queue'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Service Operation Priority', () => {
    it('should maintain offline-first behavior across all services', async () => {
      const operationOrder: string[] = [];

      mockDb.runAsync.mockImplementation(async () => {
        operationOrder.push('database');
      });

      mockQueueManager.addOperation.mockImplementation(async () => {
        operationOrder.push('queue');
      });

      const clubService = new (ClubService as any)();
      await clubService.joinClub('club123', 'user123');

      // Database operations should always come before queue operations
      expect(operationOrder.indexOf('database')).toBeLessThan(operationOrder.indexOf('queue'));
    });

    it('should never block on sync operations', async () => {
      // Simulate slow sync operations
      mockQueueManager.addOperation.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const start = Date.now();
      
      const clubService = new (ClubService as any)();
      await clubService.joinClub('club123', 'user123');
      
      const duration = Date.now() - start;
      
      // Operation should complete quickly despite slow sync
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Sync Service State Management', () => {
    it('should maintain consistent state across service interactions', () => {
      const status1 = syncService.getSyncStatus();
      const status2 = syncService.getSyncStatus();

      // Should return consistent state
      expect(status1).toEqual(status2);
    });

    it('should provide unified access to pending and failed operations', () => {
      mockQueueManager.getOperations
        .mockReturnValueOnce([{ id: 'op1', status: 'PENDING' }])
        .mockReturnValueOnce([{ id: 'op2', status: 'FAILED' }])
        .mockReturnValueOnce([{ id: 'op3', status: 'DEAD_LETTER' }]);

      const pending = syncService.getPendingOperations();
      const failed = syncService.getFailedOperations();

      expect(pending).toHaveLength(1);
      expect(failed).toHaveLength(2); // FAILED + DEAD_LETTER
    });

    it('should support manual sync operations', async () => {
      await syncService.sync();

      expect(mockNetworkManager.triggerManualSync).toHaveBeenCalled();
    });

    it('should support retry operations', async () => {
      await syncService.retryFailedOperations();

      expect(mockQueueManager.retryFailedOperations).toHaveBeenCalled();
    });
  });

  describe('Network State Handling', () => {
    it('should provide network status to all services', () => {
      mockNetworkManager.isOnline.mockReturnValue(false);

      expect(syncService.isOnline()).toBe(false);
      expect(syncService.getSyncStatus().isOnline).toBe(false);
    });

    it('should support network listeners', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      
      mockNetworkManager.addNetworkListener.mockReturnValue(unsubscribe);

      const result = syncService.addNetworkListener(callback);

      expect(mockNetworkManager.addNetworkListener).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
    });

    it('should handle network quality assessment', () => {
      mockNetworkManager.getNetworkQuality.mockReturnValue('excellent');

      expect(syncService.getNetworkQuality()).toBe('excellent');
    });
  });

  describe('Error Recovery', () => {
    it('should handle sync service initialization errors', async () => {
      mockQueueManager.registerStrategy.mockImplementation(() => {
        throw new Error('Strategy registration failed');
      });

      // Should not throw error
      await expect((syncService as any).initialize()).resolves.toBeUndefined();
    });

    it('should maintain service functionality even with sync errors', async () => {
      mockQueueManager.addOperation.mockRejectedValue(new Error('Persistent sync failure'));

      const clubService = new (ClubService as any)();
      const authService = new (AuthService as any)();

      // Services should continue to work
      await expect(clubService.joinClub('club123', 'user123')).resolves.toBeUndefined();
      await expect(authService.updateProfile('user123', { full_name: 'Test' })).resolves.toBeDefined();

      // Local database operations should still complete
      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    });
  });
});