// Unified sync service for the entire tennis app
import { OfflineQueueManager } from '../offlineQueue/OfflineQueueManager';
import { NetworkManager } from '../offlineQueue/NetworkManager';
import { getAllSyncStrategies } from '../offlineQueue/SyncStrategies';
import { SyncStatus, QueueOperation } from '../offlineQueue/types';
import { CreateMatchData } from '../matchService';

/**
 * Universal sync service that provides a simple interface for all app operations
 */
export class SyncService {
  private static instance: SyncService | null = null;
  private queueManager: OfflineQueueManager;
  private networkManager: NetworkManager;
  private isInitialized = false;

  private constructor() {
    this.queueManager = OfflineQueueManager.getInstance();
    this.networkManager = NetworkManager.getInstance();
  }

  /**
   * Singleton instance getter
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Register all sync strategies
    const strategies = getAllSyncStrategies();
    strategies.forEach(strategy => {
      this.queueManager.registerStrategy(strategy);
    });

    // Set up queue hooks for logging and monitoring
    this.queueManager.setHooks({
      onOperationAdded: (operation) => {
        console.log('📝 Operation queued:', operation.entity, operation.operation);
      },
      onOperationSuccess: (operation, result) => {
        console.log('✅ Operation synced:', operation.entity, operation.operation);
      },
      onOperationFailed: (operation, error) => {
        console.log('❌ Operation failed:', operation.entity, operation.operation, error);
      },
      onQueueProcessingStarted: () => {
        console.log('🔄 Starting sync...');
      },
      onQueueProcessingCompleted: (results) => {
        console.log('✨ Sync completed:', results);
      },
    });

    this.isInitialized = true;
    console.log('🚀 SyncService initialized');

    // Process any existing queue items
    if (this.networkManager.isOnline()) {
      await this.processQueue();
    }
  }

  // ================================
  // MATCH OPERATIONS
  // ================================

  /**
   * Queue a match for creation
   */
  public async queueMatchCreation(
    matchData: CreateMatchData,
    localMatchId?: string
  ): Promise<string> {
    return this.queueManager.addOperation(
      'match',
      'create_match',
      matchData,
      { localId: localMatchId }
    );
  }

  /**
   * Queue a match for update
   */
  public async queueMatchUpdate(
    matchId: string,
    updateData: Partial<CreateMatchData>
  ): Promise<string> {
    return this.queueManager.addOperation(
      'match',
      'update_match',
      { id: matchId, ...updateData }
    );
  }

  /**
   * Queue a match for deletion
   */
  public async queueMatchDeletion(matchId: string): Promise<string> {
    return this.queueManager.addOperation(
      'match',
      'delete_match',
      { id: matchId }
    );
  }

  // ================================
  // CLUB OPERATIONS
  // ================================

  /**
   * Queue club join operation
   */
  public async queueClubJoin(clubId: string, userId: string): Promise<string> {
    return this.queueManager.addOperation(
      'club',
      'join_club',
      { club_id: clubId, user_id: userId }
    );
  }

  /**
   * Queue club leave operation
   */
  public async queueClubLeave(clubId: string, userId: string): Promise<string> {
    return this.queueManager.addOperation(
      'club',
      'leave_club',
      { club_id: clubId, user_id: userId }
    );
  }

  // ================================
  // USER OPERATIONS
  // ================================

  /**
   * Queue user profile update
   */
  public async queueProfileUpdate(
    userId: string,
    updateData: Record<string, any>
  ): Promise<string> {
    return this.queueManager.addOperation(
      'user',
      'update_profile',
      { id: userId, ...updateData }
    );
  }

  // ================================
  // CHALLENGE OPERATIONS
  // ================================

  /**
   * Queue challenge creation
   */
  public async queueChallengeCreation(
    challengerId: string,
    challengedId: string,
    clubId: string,
    additionalData: Record<string, any> = {}
  ): Promise<string> {
    return this.queueManager.addOperation(
      'challenge',
      'create_challenge',
      {
        challenger_id: challengerId,
        challenged_id: challengedId,
        club_id: clubId,
        ...additionalData,
      }
    );
  }

  /**
   * Queue challenge response
   */
  public async queueChallengeResponse(
    challengeId: string,
    response: 'accepted' | 'declined'
  ): Promise<string> {
    return this.queueManager.addOperation(
      'challenge',
      'respond_challenge',
      {
        challenge_id: challengeId,
        response,
        responded_at: new Date().toISOString(),
      }
    );
  }

  // ================================
  // SYNC MANAGEMENT
  // ================================

  /**
   * Manually trigger sync
   */
  public async sync(): Promise<void> {
    if (!this.networkManager.isOnline()) {
      throw new Error('Cannot sync while offline');
    }
    await this.networkManager.triggerManualSync();
  }

  /**
   * Process the queue (internal method)
   */
  private async processQueue(): Promise<void> {
    await this.queueManager.processQueue();
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus & { connectionStatus: string } {
    const status = this.queueManager.getSyncStatus();
    return {
      ...status,
      isOnline: this.networkManager.isOnline(),
      connectionStatus: this.networkManager.getConnectionStatus(),
    };
  }

  /**
   * Get pending operations
   */
  public getPendingOperations(): QueueOperation[] {
    return this.queueManager.getOperations('PENDING');
  }

  /**
   * Get failed operations
   */
  public getFailedOperations(): QueueOperation[] {
    return [
      ...this.queueManager.getOperations('FAILED'),
      ...this.queueManager.getOperations('DEAD_LETTER'),
    ];
  }

  /**
   * Retry failed operations
   */
  public async retryFailedOperations(): Promise<void> {
    await this.queueManager.retryFailedOperations();
  }

  /**
   * Clear completed operations
   */
  public async clearCompletedOperations(): Promise<void> {
    await this.queueManager.clearCompletedOperations();
  }

  /**
   * Enable/disable auto-sync
   */
  public setAutoSyncEnabled(enabled: boolean): void {
    this.networkManager.setAutoSyncEnabled(enabled);
  }

  /**
   * Add network state listener
   */
  public addNetworkListener(
    callback: (isOnline: boolean, connectionStatus: string) => void
  ): () => void {
    return this.networkManager.addNetworkListener((state) => {
      callback(
        state.isConnected && state.isInternetReachable !== false,
        this.networkManager.getConnectionStatus()
      );
    });
  }

  /**
   * Wait for network connection
   */
  public async waitForConnection(timeoutMs = 30000): Promise<boolean> {
    return this.networkManager.waitForConnection(timeoutMs);
  }

  /**
   * Check if we're currently online
   */
  public isOnline(): boolean {
    return this.networkManager.isOnline();
  }

  /**
   * Get network quality
   */
  public getNetworkQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    return this.networkManager.getNetworkQuality();
  }
}

// Export singleton instance for easy access
export const syncService = SyncService.getInstance();