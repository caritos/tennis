// Universal Offline Queue Manager for all app sync operations
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  QueueOperation, 
  QueueConfig, 
  OperationStatus, 
  SyncStrategy, 
  SyncResult,
  QueueHooks,
  SyncStatus 
} from './types';

const QUEUE_STORAGE_KEY = '@tennis_app_offline_queue';
const DEFAULT_CONFIG: QueueConfig = {
  maxRetries: 5,
  baseRetryDelay: 1000, // 1 second
  maxRetryDelay: 30000, // 30 seconds
  retryMultiplier: 2,
  deadLetterQueueEnabled: true,
  maxQueueSize: 1000,
};

export class OfflineQueueManager {
  private static instance: OfflineQueueManager | null = null;
  private queue: QueueOperation[] = [];
  private strategies: Map<string, SyncStrategy> = new Map();
  private config: QueueConfig;
  private hooks: QueueHooks = {};
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;

  private constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  /**
   * Singleton instance getter
   */
  public static getInstance(config?: Partial<QueueConfig>): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager(config);
    }
    return OfflineQueueManager.instance;
  }

  /**
   * Initialize the queue manager
   */
  private async initialize(): Promise<void> {
    try {
      await this.loadQueueFromStorage();
      console.log('OfflineQueueManager initialized with', this.queue.length, 'operations');
    } catch (error) {
      console.error('Failed to initialize OfflineQueueManager:', error);
    }
  }

  /**
   * Register a sync strategy for specific operations
   */
  public registerStrategy(strategy: SyncStrategy): void {
    const key = `${strategy.entity}:${strategy.operation}`;
    this.strategies.set(key, strategy);
    console.log('Registered sync strategy:', key);
  }

  /**
   * Set hooks for monitoring queue operations
   */
  public setHooks(hooks: QueueHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Add an operation to the queue
   */
  public async addOperation(
    entity: string,
    operation: string,
    payload: any,
    metadata: QueueOperation['metadata'] = {}
  ): Promise<string> {
    const queueOperation: QueueOperation = {
      id: this.generateId(),
      type: this.getOperationType(operation),
      entity,
      operation,
      payload,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
      status: 'PENDING',
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error(`Queue size limit reached (${this.config.maxQueueSize})`);
    }

    // Validate payload if strategy has validation
    const strategyKey = `${entity}:${operation}`;
    const strategy = this.strategies.get(strategyKey);
    if (strategy?.validate && !strategy.validate(payload)) {
      throw new Error(`Invalid payload for operation ${strategyKey}`);
    }

    this.queue.push(queueOperation);
    await this.saveQueueToStorage();

    this.hooks.onOperationAdded?.(queueOperation);
    console.log('Added operation to queue:', strategyKey, queueOperation.id);

    return queueOperation.id;
  }

  /**
   * Process all pending operations in the queue
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) {
      // Return existing processing promise if already processing
      return this.processingPromise || Promise.resolve();
    }

    this.isProcessing = true;
    this.hooks.onQueueProcessingStarted?.();

    this.processingPromise = this.doProcessQueue();
    
    try {
      await this.processingPromise;
    } finally {
      this.isProcessing = false;
      this.processingPromise = null;
    }
  }

  /**
   * Internal queue processing logic
   */
  private async doProcessQueue(): Promise<void> {
    const pendingOperations = this.queue.filter(
      op => op.status === 'PENDING' && this.shouldRetryOperation(op)
    );

    console.log('Processing', pendingOperations.length, 'pending operations');

    let successCount = 0;
    let failedCount = 0;

    for (const operation of pendingOperations) {
      try {
        await this.processOperation(operation);
        if (operation.status === 'SUCCESS') {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error('Error processing operation:', operation.id, error);
        failedCount++;
      }
    }

    await this.saveQueueToStorage();
    this.hooks.onQueueProcessingCompleted?.({ success: successCount, failed: failedCount });

    console.log('Queue processing completed:', { success: successCount, failed: failedCount });
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: QueueOperation): Promise<void> {
    const strategyKey = `${operation.entity}:${operation.operation}`;
    const strategy = this.strategies.get(strategyKey);

    if (!strategy) {
      console.error('No strategy found for operation:', strategyKey);
      operation.status = 'FAILED';
      operation.lastError = `No strategy registered for ${strategyKey}`;
      operation.updatedAt = Date.now();
      return;
    }

    operation.status = 'PROCESSING';
    operation.updatedAt = Date.now();
    this.hooks.onOperationStarted?.(operation);

    try {
      // Transform payload if strategy has transformer
      const payload = strategy.transform ? strategy.transform(operation.payload) : operation.payload;
      
      const result: SyncResult = await strategy.execute({
        ...operation,
        payload,
      });

      if (result.success) {
        operation.status = 'SUCCESS';
        operation.updatedAt = Date.now();
        this.hooks.onOperationSuccess?.(operation, result.data);
        console.log('Operation succeeded:', operation.id);
      } else {
        throw new Error(result.error || 'Operation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      operation.retryCount++;
      operation.lastError = errorMessage;
      operation.updatedAt = Date.now();

      if (operation.retryCount >= operation.maxRetries) {
        operation.status = this.config.deadLetterQueueEnabled ? 'DEAD_LETTER' : 'FAILED';
        this.hooks.onOperationDeadLetter?.(operation);
        console.log('Operation moved to dead letter queue:', operation.id);
      } else {
        operation.status = 'PENDING';
        operation.nextRetryAt = this.calculateNextRetry(operation.retryCount);
        console.log('Operation will retry at:', new Date(operation.nextRetryAt), operation.id);
      }

      this.hooks.onOperationFailed?.(operation, errorMessage);
    }
  }

  /**
   * Check if an operation should be retried now
   */
  private shouldRetryOperation(operation: QueueOperation): boolean {
    if (operation.status !== 'PENDING') return false;
    if (!operation.nextRetryAt) return true;
    return Date.now() >= operation.nextRetryAt;
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(retryCount: number): number {
    const delay = Math.min(
      this.config.baseRetryDelay * Math.pow(this.config.retryMultiplier, retryCount - 1),
      this.config.maxRetryDelay
    );
    return Date.now() + delay;
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    const pendingCount = this.queue.filter(op => op.status === 'PENDING').length;
    const failedCount = this.queue.filter(op => op.status === 'FAILED' || op.status === 'DEAD_LETTER').length;
    
    return {
      isOnline: true, // Will be updated by NetworkManager
      isProcessing: this.isProcessing,
      pendingCount,
      failedCount,
      lastSyncAt: this.getLastSuccessfulSync(),
    };
  }

  /**
   * Get operations by status
   */
  public getOperations(status?: OperationStatus): QueueOperation[] {
    if (status) {
      return this.queue.filter(op => op.status === status);
    }
    return [...this.queue];
  }

  /**
   * Retry failed operations manually
   */
  public async retryFailedOperations(): Promise<void> {
    const failedOperations = this.queue.filter(
      op => op.status === 'FAILED' || op.status === 'DEAD_LETTER'
    );

    for (const operation of failedOperations) {
      operation.status = 'PENDING';
      operation.retryCount = 0;
      operation.nextRetryAt = undefined;
      operation.lastError = undefined;
      operation.updatedAt = Date.now();
    }

    await this.saveQueueToStorage();
    await this.processQueue();
  }

  /**
   * Clear completed operations from queue
   */
  public async clearCompletedOperations(): Promise<void> {
    const originalLength = this.queue.length;
    this.queue = this.queue.filter(op => op.status !== 'SUCCESS');
    
    if (this.queue.length !== originalLength) {
      await this.saveQueueToStorage();
      console.log('Cleared', originalLength - this.queue.length, 'completed operations');
    }
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  /**
   * Generate unique ID for operations
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine operation type from operation name
   */
  private getOperationType(operation: string): QueueOperation['type'] {
    if (operation.includes('create') || operation.includes('add') || operation.includes('join')) {
      return 'CREATE';
    }
    if (operation.includes('update') || operation.includes('edit') || operation.includes('modify')) {
      return 'UPDATE';
    }
    if (operation.includes('delete') || operation.includes('remove') || operation.includes('leave')) {
      return 'DELETE';
    }
    return 'UPDATE'; // Default fallback
  }

  /**
   * Get timestamp of last successful sync
   */
  private getLastSuccessfulSync(): number | undefined {
    const successfulOps = this.queue.filter(op => op.status === 'SUCCESS');
    if (successfulOps.length === 0) return undefined;
    
    return Math.max(...successfulOps.map(op => op.updatedAt));
  }
}