// TypeScript definitions for the Universal Offline Queue System

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';

export type OperationStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'DEAD_LETTER';

export interface QueueOperation {
  id: string;
  type: OperationType;
  entity: string; // 'match', 'club', 'user', 'challenge', etc.
  operation: string; // 'create_match', 'join_club', 'update_profile', etc.
  payload: any; // The data to sync
  metadata?: {
    userId?: string;
    clubId?: string;
    timestamp: number;
    localId?: string; // For linking local records
  };
  status: OperationStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QueueConfig {
  maxRetries: number;
  baseRetryDelay: number; // milliseconds
  maxRetryDelay: number; // milliseconds
  retryMultiplier: number; // for exponential backoff
  deadLetterQueueEnabled: boolean;
  maxQueueSize: number;
}

export interface SyncResult {
  success: boolean;
  data?: any;
  error?: string;
  shouldRetry?: boolean;
}

export interface NetworkState {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
}

export interface SyncStatus {
  isOnline: boolean;
  isProcessing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncAt?: number;
  currentOperation?: string;
}

// Strategy interface for different sync operations
export interface SyncStrategy {
  entity: string;
  operation: string;
  execute: (operation: QueueOperation) => Promise<SyncResult>;
  validate?: (payload: any) => boolean;
  transform?: (payload: any) => any;
}

// Hooks for monitoring queue operations
export interface QueueHooks {
  onOperationAdded?: (operation: QueueOperation) => void;
  onOperationStarted?: (operation: QueueOperation) => void;
  onOperationSuccess?: (operation: QueueOperation, result: any) => void;
  onOperationFailed?: (operation: QueueOperation, error: string) => void;
  onOperationDeadLetter?: (operation: QueueOperation) => void;
  onQueueProcessingStarted?: () => void;
  onQueueProcessingCompleted?: (results: { success: number; failed: number }) => void;
}