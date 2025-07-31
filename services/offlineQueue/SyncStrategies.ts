// Sync strategies for different app operations
import { SyncStrategy, SyncResult, QueueOperation } from './types';
import { supabase } from '../../lib/supabase';
import { CreateMatchData } from '../matchService';
import { initializeDatabase } from '../../database/database';
// Note: Match database operations are handled by the MatchService

// Sync protection utilities
class SyncProtection {
  /**
   * Execute sync operation with data protection
   */
  static async executeWithProtection<T>(
    operation: () => Promise<T>,
    rollback?: (() => Promise<void>) | null,
    context: string = 'sync operation'
  ): Promise<T> {
    const startTime = Date.now();
    console.log(`🔒 Starting protected ${context}...`);
    
    try {
      const result = await operation();
      console.log(`✅ Protected ${context} completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      console.error(`❌ Protected ${context} failed:`, error);
      
      if (rollback) {
        try {
          console.log(`🔄 Executing rollback for ${context}...`);
          await rollback();
          console.log(`✅ Rollback completed for ${context}`);
        } catch (rollbackError) {
          console.error(`💥 Rollback failed for ${context}:`, rollbackError);
          throw new Error(`Sync failed and rollback failed: ${error.message} | Rollback: ${rollbackError.message}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Check for conflicts before performing sync
   */
  static async checkForConflicts<T extends Record<string, any>>(
    tableName: string,
    id: string,
    localData: T,
    remoteTimestampField: string = 'updated_at'
  ): Promise<{ hasConflict: boolean; remoteData?: T; conflictType?: string }> {
    try {
      const { data: remoteData, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (!remoteData) {
        return { hasConflict: false };
      }

      // Check timestamp-based conflicts
      const localTimestamp = localData[remoteTimestampField];
      const remoteTimestamp = remoteData[remoteTimestampField];
      
      if (localTimestamp && remoteTimestamp) {
        const localTime = new Date(localTimestamp).getTime();
        const remoteTime = new Date(remoteTimestamp).getTime();
        
        if (remoteTime > localTime) {
          return {
            hasConflict: true,
            remoteData,
            conflictType: 'timestamp_newer'
          };
        }
      }

      return { hasConflict: false, remoteData };
    } catch (error) {
      console.warn(`Could not check conflicts for ${tableName}:${id}:`, error);
      return { hasConflict: false };
    }
  }

  /**
   * Sync with local database after successful remote operation
   */
  static async syncWithLocal(
    tableName: string,
    data: Record<string, any>,
    operation: 'insert' | 'update' | 'delete'
  ): Promise<void> {
    try {
      const db = await initializeDatabase();
      
      switch (operation) {
        case 'insert':
          const insertColumns = Object.keys(data).join(', ');
          const insertPlaceholders = Object.keys(data).map(() => '?').join(', ');
          const insertValues = Object.values(data);
          
          await db.execAsync(
            `INSERT OR REPLACE INTO ${tableName} (${insertColumns}) VALUES (${insertPlaceholders});`,
            insertValues
          );
          break;
          
        case 'update':
          const { id, ...updateFields } = data;
          const updateColumns = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
          const updateValues = [...Object.values(updateFields), id];
          
          await db.execAsync(
            `UPDATE ${tableName} SET ${updateColumns} WHERE id = ?;`,
            updateValues
          );
          break;
          
        case 'delete':
          await db.execAsync(
            `DELETE FROM ${tableName} WHERE id = ?;`,
            [data.id]
          );
          break;
      }
      
      console.log(`✅ Local ${tableName} ${operation} synced`);
    } catch (error) {
      console.error(`❌ Failed to sync local ${tableName}:`, error);
      throw new Error(`Local sync failed: ${error.message}`);
    }
  }
}

/**
 * Match recording sync strategies
 */
export const matchSyncStrategies: SyncStrategy[] = [
  {
    entity: 'match',
    operation: 'create_match',
    validate: (payload: CreateMatchData) => {
      return !!(payload.club_id && payload.scores && payload.match_type);
    },
    transform: (payload: CreateMatchData) => {
      // Ensure all required fields are present
      return {
        ...payload,
        created_at: payload.created_at || new Date().toISOString(),
      };
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const matchData = operation.payload as CreateMatchData;
        
        return await SyncProtection.executeWithProtection(
          async () => {
            // Insert to Supabase
            const { data, error } = await supabase
              .from('matches')
              .insert(matchData)
              .select()
              .single();

            if (error) {
              throw new Error(`Supabase error: ${error.message}`);
            }

            // Sync with local database
            await SyncProtection.syncWithLocal('matches', data, 'insert');

            return {
              success: true,
              data: data,
            };
          },
          // Rollback: delete from Supabase if local sync fails
          async () => {
            if (matchData.id) {
              await supabase.from('matches').delete().eq('id', matchData.id);
            }
          },
          'match creation'
        );
      } catch (error) {
        console.error('Failed to sync match creation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },

  {
    entity: 'match',
    operation: 'update_match',
    validate: (payload: any) => {
      return !!(payload.id && (payload.scores || payload.notes || payload.match_type));
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const { id, ...updateData } = operation.payload;
        let originalData: any = null;
        
        return await SyncProtection.executeWithProtection(
          async () => {
            // Check for conflicts before updating
            const conflictCheck = await SyncProtection.checkForConflicts(
              'matches',
              id,
              { ...updateData, updated_at: new Date().toISOString() }
            );

            if (conflictCheck.hasConflict) {
              throw new Error(
                `Conflict detected: Remote data is newer. Conflict type: ${conflictCheck.conflictType}`
              );
            }

            // Store original data for potential rollback
            originalData = conflictCheck.remoteData;

            // Update in Supabase
            const { data, error } = await supabase
              .from('matches')
              .update({
                ...updateData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id)
              .select()
              .single();

            if (error) {
              throw new Error(`Supabase error: ${error.message}`);
            }

            // Sync with local database
            await SyncProtection.syncWithLocal('matches', data, 'update');

            return {
              success: true,
              data: data,
            };
          },
          // Rollback: restore original data in Supabase if local sync fails
          originalData ? async () => {
            await supabase
              .from('matches')
              .update(originalData)
              .eq('id', id);
          } : undefined,
          'match update'
        );
      } catch (error) {
        console.error('Failed to sync match update:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: error.message?.includes('Conflict detected') ? false : true,
        };
      }
    },
  },

  {
    entity: 'match',
    operation: 'delete_match',
    validate: (payload: any) => {
      return !!(payload.id);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const { id } = operation.payload;
        let backupData: any = null;
        
        return await SyncProtection.executeWithProtection(
          async () => {
            // Backup the record before deletion
            const { data: existingData, error: fetchError } = await supabase
              .from('matches')
              .select('*')
              .eq('id', id)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
              throw new Error(`Failed to fetch match for deletion: ${fetchError.message}`);
            }

            backupData = existingData;

            // Delete from Supabase
            const { error } = await supabase
              .from('matches')
              .delete()
              .eq('id', id);

            if (error) {
              throw new Error(`Supabase error: ${error.message}`);
            }

            // Delete from local database
            await SyncProtection.syncWithLocal('matches', { id }, 'delete');

            return {
              success: true,
            };
          },
          // Rollback: restore the deleted record
          backupData ? async () => {
            await supabase.from('matches').insert(backupData);
          } : undefined,
          'match deletion'
        );
      } catch (error) {
        console.error('Failed to sync match deletion:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },
];

/**
 * Club membership sync strategies
 */
export const clubSyncStrategies: SyncStrategy[] = [
  {
    entity: 'club',
    operation: 'join_club',
    validate: (payload: any) => {
      return !!(payload.club_id && payload.user_id);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const { club_id, user_id } = operation.payload;
        
        const { data, error } = await supabase
          .from('club_members')
          .insert({
            club_id,
            user_id,
            joined_at: new Date().toISOString(),
            role: 'member',
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return {
          success: true,
          data: data,
        };
      } catch (error) {
        console.error('Failed to sync club join:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },

  {
    entity: 'club',
    operation: 'leave_club',
    validate: (payload: any) => {
      return !!(payload.club_id && payload.user_id);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const { club_id, user_id } = operation.payload;
        
        const { error } = await supabase
          .from('club_members')
          .delete()
          .eq('club_id', club_id)
          .eq('user_id', user_id);

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return {
          success: true,
        };
      } catch (error) {
        console.error('Failed to sync club leave:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },
];

/**
 * User profile sync strategies
 */
export const userSyncStrategies: SyncStrategy[] = [
  {
    entity: 'user',
    operation: 'update_profile',
    validate: (payload: any) => {
      return !!(payload.id);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const { id, ...updateData } = operation.payload;
        
        const { data, error } = await supabase
          .from('users')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return {
          success: true,
          data: data,
        };
      } catch (error) {
        console.error('Failed to sync profile update:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },
];

/**
 * Challenge system sync strategies
 */
export const challengeSyncStrategies: SyncStrategy[] = [
  {
    entity: 'challenge',
    operation: 'create_challenge',
    validate: (payload: any) => {
      return !!(payload.challenger_id && payload.challenged_id && payload.club_id);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const challengeData = operation.payload;
        
        const { data, error } = await supabase
          .from('challenges')
          .insert({
            ...challengeData,
            created_at: new Date().toISOString(),
            status: 'pending',
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return {
          success: true,
          data: data,
        };
      } catch (error) {
        console.error('Failed to sync challenge creation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },

  {
    entity: 'challenge',
    operation: 'respond_challenge',
    validate: (payload: any) => {
      return !!(payload.challenge_id && payload.response);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const { challenge_id, response, responded_at } = operation.payload;
        
        const { data, error } = await supabase
          .from('challenges')
          .update({
            status: response,
            responded_at: responded_at || new Date().toISOString(),
          })
          .eq('id', challenge_id)
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return {
          success: true,
          data: data,
        };
      } catch (error) {
        console.error('Failed to sync challenge response:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },
];

/**
 * Match invitation sync strategies
 */
export const invitationSyncStrategies: SyncStrategy[] = [
  {
    entity: 'invitation',
    operation: 'create_invitation',
    validate: (payload: any) => {
      return !!(payload.club_id && payload.creator_id && payload.match_type && payload.date);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const invitationData = operation.payload;
        
        const { data, error } = await supabase
          .from('match_invitations')
          .insert({
            ...invitationData,
            created_at: new Date().toISOString(),
            status: 'active',
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return {
          success: true,
          data: data,
        };
      } catch (error) {
        console.error('Failed to sync invitation creation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },

  {
    entity: 'invitation',
    operation: 'respond_invitation',
    validate: (payload: any) => {
      return !!(payload.invitation_id && payload.user_id);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const responseData = operation.payload;
        
        const { data, error } = await supabase
          .from('invitation_responses')
          .insert({
            ...responseData,
            created_at: new Date().toISOString(),
            status: 'interested',
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return {
          success: true,
          data: data,
        };
      } catch (error) {
        console.error('Failed to sync invitation response:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },

  {
    entity: 'invitation',
    operation: 'cancel_invitation',
    validate: (payload: any) => {
      return !!(payload.invitation_id);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const { invitation_id } = operation.payload;
        
        const { data, error } = await supabase
          .from('match_invitations')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', invitation_id)
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        return {
          success: true,
          data: data,
        };
      } catch (error) {
        console.error('Failed to sync invitation cancellation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },

  {
    entity: 'invitation',
    operation: 'confirm_match',
    validate: (payload: any) => {
      return !!(payload.invitation_id && payload.confirmed_players);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const { invitation_id, confirmed_players } = operation.payload;
        let originalInvitation: any = null;
        let originalResponses: any[] = [];
        
        return await SyncProtection.executeWithProtection(
          async () => {
            // Backup original data for rollback
            const { data: invitationData, error: invitationFetchError } = await supabase
              .from('match_invitations')
              .select('*')
              .eq('id', invitation_id)
              .single();

            if (invitationFetchError) {
              throw new Error(`Failed to fetch invitation: ${invitationFetchError.message}`);
            }

            const { data: responsesData, error: responsesFetchError } = await supabase
              .from('invitation_responses')
              .select('*')
              .eq('invitation_id', invitation_id)
              .in('user_id', confirmed_players);

            if (responsesFetchError) {
              throw new Error(`Failed to fetch responses: ${responsesFetchError.message}`);
            }

            originalInvitation = invitationData;
            originalResponses = responsesData || [];

            // Use Supabase transaction for atomic multi-table updates
            const { error: transactionError } = await supabase.rpc('confirm_match_atomic', {
              p_invitation_id: invitation_id,
              p_confirmed_players: confirmed_players,
              p_timestamp: new Date().toISOString()
            });

            if (transactionError) {
              // Fallback to manual transaction if RPC doesn't exist
              console.warn('RPC not available, using manual transaction');
              
              // Update invitation status to matched
              const { error: invitationError } = await supabase
                .from('match_invitations')
                .update({
                  status: 'matched',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', invitation_id);

              if (invitationError) {
                throw new Error(`Supabase invitation update error: ${invitationError.message}`);
              }

              // Update confirmed players' responses
              const { error: responseError } = await supabase
                .from('invitation_responses')
                .update({
                  status: 'confirmed',
                  updated_at: new Date().toISOString(),
                })
                .eq('invitation_id', invitation_id)
                .in('user_id', confirmed_players);

              if (responseError) {
                throw new Error(`Supabase response update error: ${responseError.message}`);
              }
            }

            // Sync with local databases
            await SyncProtection.syncWithLocal('match_invitations', {
              ...originalInvitation,
              status: 'matched',
              updated_at: new Date().toISOString()
            }, 'update');

            for (const response of originalResponses) {
              await SyncProtection.syncWithLocal('invitation_responses', {
                ...response,
                status: 'confirmed',
                updated_at: new Date().toISOString()
              }, 'update');
            }

            return {
              success: true,
            };
          },
          // Rollback: restore original statuses
          async () => {
            if (originalInvitation) {
              await supabase
                .from('match_invitations')
                .update({
                  status: originalInvitation.status,
                  updated_at: originalInvitation.updated_at
                })
                .eq('id', invitation_id);
            }

            for (const response of originalResponses) {
              await supabase
                .from('invitation_responses')
                .update({
                  status: response.status,
                  updated_at: response.updated_at
                })
                .eq('id', response.id);
            }
          },
          'match confirmation'
        );
      } catch (error) {
        console.error('Failed to sync match confirmation:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      }
    },
  },
];

/**
 * Conflict resolution strategies for different scenarios
 */
export const ConflictResolution = {
  /**
   * Handle timestamp-based conflicts
   */
  resolveTimestampConflict: async <T extends Record<string, any>>(
    tableName: string,
    id: string,
    localData: T,
    remoteData: T,
    strategy: 'local_wins' | 'remote_wins' | 'merge' | 'prompt_user' = 'remote_wins'
  ): Promise<T> => {
    console.log(`⚡ Resolving conflict for ${tableName}:${id} using strategy: ${strategy}`);
    
    switch (strategy) {
      case 'local_wins':
        // Update remote with local data
        const { data: localWinsData, error: localWinsError } = await supabase
          .from(tableName)
          .update(localData)
          .eq('id', id)
          .select()
          .single();
          
        if (localWinsError) {
          throw new Error(`Failed to resolve conflict with local wins: ${localWinsError.message}`);
        }
        
        return localWinsData;
        
      case 'remote_wins':
        // Use remote data (default behavior)
        await SyncProtection.syncWithLocal(tableName, remoteData, 'update');
        return remoteData;
        
      case 'merge':
        // Merge strategy: prefer non-null values from local, but keep remote timestamps
        const mergedData = {
          ...remoteData,
          ...Object.fromEntries(
            Object.entries(localData).filter(([key, value]) => 
              value !== null && value !== undefined && key !== 'updated_at' && key !== 'created_at'
            )
          ),
          // Always use remote timestamps to maintain consistency
          updated_at: remoteData.updated_at,
          created_at: remoteData.created_at
        };
        
        const { data: mergedResult, error: mergeError } = await supabase
          .from(tableName)
          .update(mergedData)
          .eq('id', id)
          .select()
          .single();
          
        if (mergeError) {
          throw new Error(`Failed to merge conflict resolution: ${mergeError.message}`);
        }
        
        await SyncProtection.syncWithLocal(tableName, mergedResult, 'update');
        return mergedResult;
        
      case 'prompt_user':
        // This would require UI interaction - for now, default to remote wins
        console.log('⚠️ User prompt conflict resolution not implemented, defaulting to remote wins');
        await SyncProtection.syncWithLocal(tableName, remoteData, 'update');
        return remoteData;
        
      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }
  },

  /**
   * Handle concurrent modification conflicts
   */
  handleConcurrentModification: async (
    tableName: string,
    id: string,
    operation: 'update' | 'delete',
    retryCount: number = 3
  ): Promise<boolean> => {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        // Add small random delay to reduce race conditions
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 * attempt));
        
        // Check if record still exists and get latest version
        const { data: currentData, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();
          
        if (error && error.code === 'PGRST116') {
          // Record was deleted by another operation
          console.log(`📝 Record ${tableName}:${id} was deleted by concurrent operation`);
          return false;
        }
        
        if (error) {
          throw error;
        }
        
        return true; // Record exists and is available for operation
      } catch (error) {
        console.warn(`Attempt ${attempt}/${retryCount} failed for concurrent modification check:`, error);
        
        if (attempt === retryCount) {
          throw new Error(`Failed to handle concurrent modification after ${retryCount} attempts: ${error.message}`);
        }
      }
    }
    
    return false;
  }
};

/**
 * Enhanced sync monitoring and analytics
 */
export const SyncMonitoring = {
  /**
   * Track sync performance metrics
   */
  trackSyncOperation: (
    entity: string,
    operation: string,
    duration: number,
    success: boolean,
    error?: string
  ) => {
    const metrics = {
      entity,
      operation,
      duration,
      success,
      error,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
    
    // Store metrics locally for analysis
    try {
      const existingMetrics = JSON.parse(localStorage.getItem('sync_metrics') || '[]');
      existingMetrics.push(metrics);
      
      // Keep only last 100 metrics
      if (existingMetrics.length > 100) {
        existingMetrics.splice(0, existingMetrics.length - 100);
      }
      
      localStorage.setItem('sync_metrics', JSON.stringify(existingMetrics));
    } catch (error) {
      console.warn('Failed to store sync metrics:', error);
    }
  },

  /**
   * Get sync performance report
   */
  getSyncReport: () => {
    try {
      const metrics = JSON.parse(localStorage.getItem('sync_metrics') || '[]');
      
      const report = {
        total_operations: metrics.length,
        success_rate: metrics.length > 0 ? metrics.filter(m => m.success).length / metrics.length * 100 : 0,
        average_duration: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length : 0,
        most_common_errors: {} as Record<string, number>,
        operations_by_entity: {} as Record<string, number>
      };
      
      metrics.forEach(m => {
        if (!m.success && m.error) {
          report.most_common_errors[m.error] = (report.most_common_errors[m.error] || 0) + 1;
        }
        
        const key = `${m.entity}_${m.operation}`;
        report.operations_by_entity[key] = (report.operations_by_entity[key] || 0) + 1;
      });
      
      return report;
    } catch (error) {
      console.warn('Failed to generate sync report:', error);
      return null;
    }
  }
};

/**
 * Get all sync strategies with enhanced protection
 */
export function getAllSyncStrategies(): SyncStrategy[] {
  return [
    ...matchSyncStrategies,
    ...clubSyncStrategies,
    ...userSyncStrategies,
    ...challengeSyncStrategies,
    ...invitationSyncStrategies,
  ];
}