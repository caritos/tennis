// Network connectivity manager for the offline queue system
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { NetworkState } from './types';
import { OfflineQueueManager } from './OfflineQueueManager';

export class NetworkManager {
  private static instance: NetworkManager | null = null;
  private queueManager: OfflineQueueManager;
  private networkState: NetworkState = {
    isConnected: false,
    type: null,
    isInternetReachable: null,
  };
  private listeners: ((state: NetworkState) => void)[] = [];
  private autoSyncEnabled = true;
  private syncCooldownMs = 1000; // 1 second between auto-syncs (more aggressive)
  private lastSyncTime = 0;

  private constructor() {
    this.queueManager = OfflineQueueManager.getInstance();
    this.initialize();
  }

  /**
   * Singleton instance getter
   */
  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  /**
   * Initialize network monitoring
   */
  private async initialize(): Promise<void> {
    try {
      // Get initial network state
      const initialState = await NetInfo.fetch();
      this.updateNetworkState(initialState);

      // Start listening for network changes
      NetInfo.addEventListener(this.handleNetworkChange.bind(this));

      console.log('NetworkManager initialized, initial state:', this.networkState);
    } catch (error) {
      console.error('Failed to initialize NetworkManager:', error);
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange(state: NetInfoState): void {
    const wasConnected = this.networkState.isConnected;
    this.updateNetworkState(state);

    // Notify listeners
    this.listeners.forEach(listener => listener(this.networkState));

    // Trigger auto-sync if we just came online
    if (!wasConnected && this.networkState.isConnected && this.autoSyncEnabled) {
      this.triggerAutoSync();
    }

    console.log('Network state changed:', this.networkState);
  }

  /**
   * Update internal network state
   */
  private updateNetworkState(state: NetInfoState): void {
    this.networkState = {
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    };
  }

  /**
   * Trigger automatic sync with cooldown protection
   */
  private async triggerAutoSync(): Promise<void> {
    const now = Date.now();
    if (now - this.lastSyncTime < this.syncCooldownMs) {
      console.log('Auto-sync skipped due to cooldown');
      return;
    }

    this.lastSyncTime = now;
    console.log('Auto-sync triggered due to network connectivity');

    try {
      await this.queueManager.processQueue();
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }

  /**
   * Get current network state
   */
  public getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Check if we're currently online
   */
  public isOnline(): boolean {
    return this.networkState.isConnected && this.networkState.isInternetReachable !== false;
  }

  /**
   * Check if we have a good connection (WiFi or strong cellular)
   */
  public hasGoodConnection(): boolean {
    if (!this.isOnline()) return false;

    // Consider WiFi as always good
    if (this.networkState.type === 'wifi') return true;

    // For cellular, we assume it's good unless we have specific info saying otherwise
    // In a real app, you might want to check signal strength or connection speed
    return this.networkState.type === 'cellular';
  }

  /**
   * Add a listener for network state changes
   */
  public addNetworkListener(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Manually trigger sync (regardless of cooldown)
   */
  public async triggerManualSync(): Promise<void> {
    if (!this.isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    console.log('Manual sync triggered');
    this.lastSyncTime = Date.now();

    try {
      await this.queueManager.processQueue();
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  }

  /**
   * Enable or disable automatic syncing
   */
  public setAutoSyncEnabled(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
    console.log('Auto-sync', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Set the cooldown period between auto-syncs
   */
  public setSyncCooldown(milliseconds: number): void {
    this.syncCooldownMs = Math.max(1000, milliseconds); // Minimum 1 second
    console.log('Sync cooldown set to', this.syncCooldownMs, 'ms');
  }

  /**
   * Wait for network connection
   * Useful for testing or when you need to ensure connectivity
   */
  public async waitForConnection(timeoutMs = 30000): Promise<boolean> {
    if (this.isOnline()) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.addNetworkListener((state) => {
        if (state.isConnected && state.isInternetReachable !== false) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Get network quality indicator
   */
  public getNetworkQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!this.isOnline()) return 'offline';

    // Simple heuristic based on connection type
    switch (this.networkState.type) {
      case 'wifi':
        return 'excellent';
      case 'cellular':
        return 'good';
      case 'ethernet':
        return 'excellent';
      default:
        return 'poor';
    }
  }

  /**
   * Get human-readable connection status
   */
  public getConnectionStatus(): string {
    if (!this.networkState.isConnected) return 'Offline';
    if (this.networkState.isInternetReachable === false) return 'Connected but no internet';
    
    const type = this.networkState.type;
    switch (type) {
      case 'wifi':
        return 'Connected via WiFi';
      case 'cellular':
        return 'Connected via Cellular';
      case 'ethernet':
        return 'Connected via Ethernet';
      default:
        return 'Connected';
    }
  }
}