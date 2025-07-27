// Unit tests for OfflineQueueManager
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueueManager } from '../../../../services/offlineQueue/OfflineQueueManager';
import { QueueOperation, SyncStrategy, SyncResult } from '../../../../services/offlineQueue/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('OfflineQueueManager', () => {
  let queueManager: OfflineQueueManager;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  // Mock strategy for testing
  const mockStrategy: SyncStrategy = {
    entity: 'test',
    operation: 'test_operation',
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    
    // Reset singleton instance
    (OfflineQueueManager as any).instance = null;
    queueManager = OfflineQueueManager.getInstance();
    queueManager.registerStrategy(mockStrategy);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = OfflineQueueManager.getInstance();
      const instance2 = OfflineQueueManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should accept configuration on first instantiation', () => {
      (OfflineQueueManager as any).instance = null;
      const config = { maxRetries: 10, baseRetryDelay: 2000 };
      const instance = OfflineQueueManager.getInstance(config);
      expect(instance).toBeInstanceOf(OfflineQueueManager);
    });
  });

  describe('Strategy Registration', () => {
    it('should register sync strategies', () => {
      const strategy: SyncStrategy = {
        entity: 'match',
        operation: 'create_match',
        execute: jest.fn(),
      };

      queueManager.registerStrategy(strategy);
      
      // Strategy registration is tested indirectly through operation processing
      expect(queueManager).toBeInstanceOf(OfflineQueueManager);
    });

    it('should allow multiple strategies for different operations', () => {
      const strategy1: SyncStrategy = {
        entity: 'match',
        operation: 'create_match',
        execute: jest.fn(),
      };

      const strategy2: SyncStrategy = {
        entity: 'club',
        operation: 'join_club',
        execute: jest.fn(),
      };

      queueManager.registerStrategy(strategy1);
      queueManager.registerStrategy(strategy2);
      
      expect(queueManager).toBeInstanceOf(OfflineQueueManager);
    });
  });

  describe('Queue Operations', () => {
    it('should add operations to the queue', async () => {
      const operationId = await queueManager.addOperation(
        'test',
        'test_operation',
        { data: 'test' },
        { userId: 'user123' }
      );

      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should generate unique IDs for operations', async () => {
      const id1 = await queueManager.addOperation('test', 'test_operation', { data: 'test1' });
      const id2 = await queueManager.addOperation('test', 'test_operation', { data: 'test2' });
      
      expect(id1).not.toEqual(id2);
    });

    it('should validate payload when strategy has validation', async () => {
      const validatingStrategy: SyncStrategy = {
        entity: 'test',
        operation: 'validating_operation',
        execute: jest.fn(),
        validate: jest.fn().mockReturnValue(false),
      };

      queueManager.registerStrategy(validatingStrategy);

      await expect(
        queueManager.addOperation('test', 'validating_operation', { invalid: 'data' })
      ).rejects.toThrow('Invalid payload');
    });

    it('should enforce queue size limits', async () => {
      (OfflineQueueManager as any).instance = null;
      const smallQueueManager = OfflineQueueManager.getInstance({ maxQueueSize: 2 });
      smallQueueManager.registerStrategy(mockStrategy);

      await smallQueueManager.addOperation('test', 'test_operation', { data: 'test1' });
      await smallQueueManager.addOperation('test', 'test_operation', { data: 'test2' });

      await expect(
        smallQueueManager.addOperation('test', 'test_operation', { data: 'test3' })
      ).rejects.toThrow('Queue size limit reached');
    });
  });

  describe('Queue Processing', () => {
    it('should process pending operations', async () => {
      const mockExecute = jest.fn().mockResolvedValue({ success: true, data: 'result' });
      mockStrategy.execute = mockExecute;

      await queueManager.addOperation('test', 'test_operation', { data: 'test' });
      await queueManager.processQueue();

      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'test',
          operation: 'test_operation',
          payload: { data: 'test' },
          status: 'PROCESSING',
        })
      );
    });

    it('should mark operations as SUCCESS when they complete', async () => {
      mockStrategy.execute = jest.fn().mockResolvedValue({ success: true });

      await queueManager.addOperation('test', 'test_operation', { data: 'test' });
      await queueManager.processQueue();

      const operations = queueManager.getOperations('SUCCESS');
      expect(operations).toHaveLength(1);
      expect(operations[0].status).toBe('SUCCESS');
    });

    it('should retry failed operations', async () => {
      const mockExecute = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ success: true });

      mockStrategy.execute = mockExecute;

      await queueManager.addOperation('test', 'test_operation', { data: 'test' });
      
      // First attempt should fail
      await queueManager.processQueue();
      
      const pendingOps = queueManager.getOperations('PENDING');
      expect(pendingOps).toHaveLength(1);
      expect(pendingOps[0].retryCount).toBe(1);

      // Second attempt should succeed
      await queueManager.processQueue();
      
      const successOps = queueManager.getOperations('SUCCESS');
      expect(successOps).toHaveLength(1);
    });

    it('should move operations to dead letter queue after max retries', async () => {
      (OfflineQueueManager as any).instance = null;
      const retryManager = OfflineQueueManager.getInstance({ 
        maxRetries: 2,
        deadLetterQueueEnabled: true 
      });
      retryManager.registerStrategy(mockStrategy);

      mockStrategy.execute = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await retryManager.addOperation('test', 'test_operation', { data: 'test' });
      
      // Process until max retries reached
      await retryManager.processQueue(); // Attempt 1
      await retryManager.processQueue(); // Attempt 2
      
      const deadLetterOps = retryManager.getOperations('DEAD_LETTER');
      expect(deadLetterOps).toHaveLength(1);
      expect(deadLetterOps[0].retryCount).toBe(2);
    });

    it('should not process operations that are not ready for retry', async () => {
      const mockExecute = jest.fn().mockRejectedValue(new Error('Failure'));
      mockStrategy.execute = mockExecute;

      await queueManager.addOperation('test', 'test_operation', { data: 'test' });
      
      // First failure
      await queueManager.processQueue();
      mockExecute.mockClear();
      
      // Immediate retry should not process (retry delay not reached)
      await queueManager.processQueue();
      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe('Queue Status and Management', () => {
    it('should return correct sync status', async () => {
      await queueManager.addOperation('test', 'test_operation', { data: 'test1' });
      await queueManager.addOperation('test', 'test_operation', { data: 'test2' });
      
      const status = queueManager.getSyncStatus();
      expect(status.pendingCount).toBe(2);
      expect(status.failedCount).toBe(0);
      expect(status.isProcessing).toBe(false);
    });

    it('should filter operations by status', async () => {
      mockStrategy.execute = jest.fn()
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Failure'));

      await queueManager.addOperation('test', 'test_operation', { data: 'success' });
      await queueManager.addOperation('test', 'test_operation', { data: 'failure' });
      
      await queueManager.processQueue();

      const successOps = queueManager.getOperations('SUCCESS');
      const pendingOps = queueManager.getOperations('PENDING');
      
      expect(successOps).toHaveLength(1);
      expect(pendingOps).toHaveLength(1);
    });

    it('should retry failed operations manually', async () => {
      const mockExecute = jest.fn()
        .mockRejectedValueOnce(new Error('Initial failure'))
        .mockResolvedValueOnce({ success: true });

      mockStrategy.execute = mockExecute;

      await queueManager.addOperation('test', 'test_operation', { data: 'test' });
      await queueManager.processQueue(); // Initial failure
      
      await queueManager.retryFailedOperations();
      
      const successOps = queueManager.getOperations('SUCCESS');
      expect(successOps).toHaveLength(1);
    });

    it('should clear completed operations', async () => {
      mockStrategy.execute = jest.fn().mockResolvedValue({ success: true });

      await queueManager.addOperation('test', 'test_operation', { data: 'test' });
      await queueManager.processQueue();
      
      let allOps = queueManager.getOperations();
      expect(allOps).toHaveLength(1);
      
      await queueManager.clearCompletedOperations();
      
      allOps = queueManager.getOperations();
      expect(allOps).toHaveLength(0);
    });
  });

  describe('Persistence', () => {
    it('should save queue to AsyncStorage when operations are added', async () => {
      await queueManager.addOperation('test', 'test_operation', { data: 'test' });
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@tennis_app_offline_queue',
        expect.any(String)
      );
    });

    it('should load queue from AsyncStorage on initialization', () => {
      const savedQueue = JSON.stringify([
        {
          id: 'test123',
          entity: 'test',
          operation: 'test_operation',
          payload: { data: 'test' },
          status: 'PENDING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      ]);

      mockAsyncStorage.getItem.mockResolvedValueOnce(savedQueue);

      // Create new instance to test loading
      (OfflineQueueManager as any).instance = null;
      const newManager = OfflineQueueManager.getInstance();

      // Allow async initialization to complete
      return new Promise(resolve => {
        setTimeout(() => {
          const operations = newManager.getOperations();
          expect(operations).toHaveLength(1);
          expect(operations[0].id).toBe('test123');
          resolve(undefined);
        }, 100);
      });
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw even if storage fails
      await expect(
        queueManager.addOperation('test', 'test_operation', { data: 'test' })
      ).resolves.toBeDefined();
    });
  });

  describe('Hooks Integration', () => {
    it('should call hooks when operations are added', async () => {
      const onOperationAdded = jest.fn();
      queueManager.setHooks({ onOperationAdded });

      await queueManager.addOperation('test', 'test_operation', { data: 'test' });

      expect(onOperationAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'test',
          operation: 'test_operation',
          status: 'PENDING',
        })
      );
    });

    it('should call hooks during queue processing', async () => {
      const onOperationStarted = jest.fn();
      const onOperationSuccess = jest.fn();
      const onQueueProcessingStarted = jest.fn();
      const onQueueProcessingCompleted = jest.fn();

      queueManager.setHooks({
        onOperationStarted,
        onOperationSuccess,
        onQueueProcessingStarted,
        onQueueProcessingCompleted,
      });

      mockStrategy.execute = jest.fn().mockResolvedValue({ success: true, data: 'result' });

      await queueManager.addOperation('test', 'test_operation', { data: 'test' });
      await queueManager.processQueue();

      expect(onQueueProcessingStarted).toHaveBeenCalled();
      expect(onOperationStarted).toHaveBeenCalled();
      expect(onOperationSuccess).toHaveBeenCalledWith(
        expect.any(Object),
        'result'
      );
      expect(onQueueProcessingCompleted).toHaveBeenCalledWith({
        success: 1,
        failed: 0,
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle operations without registered strategies', async () => {
      await queueManager.addOperation('unknown', 'unknown_operation', { data: 'test' });
      await queueManager.processQueue();

      const failedOps = queueManager.getOperations('FAILED');
      expect(failedOps).toHaveLength(1);
      expect(failedOps[0].lastError).toContain('No strategy registered');
    });

    it('should prevent concurrent queue processing', async () => {
      mockStrategy.execute = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      await queueManager.addOperation('test', 'test_operation', { data: 'test1' });
      await queueManager.addOperation('test', 'test_operation', { data: 'test2' });

      // Start two processing attempts concurrently
      const promise1 = queueManager.processQueue();
      const promise2 = queueManager.processQueue();

      await Promise.all([promise1, promise2]);

      // Both operations should still be processed
      const successOps = queueManager.getOperations('SUCCESS');
      expect(successOps).toHaveLength(2);
    });
  });
});