// Sync strategies for different app operations
import { SyncStrategy, SyncResult, QueueOperation } from './types';
import { supabase } from '../../lib/supabase';
import { CreateMatchData } from '../matchService';
// Note: Match database operations are handled by the MatchService

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
        
        // Insert to Supabase
        const { data, error } = await supabase
          .from('matches')
          .insert(matchData)
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        // Note: Local SQLite update would be handled here if needed
        // The local match already exists with localId from the queue metadata

        return {
          success: true,
          data: data,
        };
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

        return {
          success: true,
          data: data,
        };
      } catch (error) {
        console.error('Failed to sync match update:', error);
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
    operation: 'delete_match',
    validate: (payload: any) => {
      return !!(payload.id);
    },
    execute: async (operation: QueueOperation): Promise<SyncResult> => {
      try {
        const { id } = operation.payload;
        
        const { error } = await supabase
          .from('matches')
          .delete()
          .eq('id', id);

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        // Note: Local SQLite deletion would be handled separately if needed

        return {
          success: true,
        };
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
        
        // Update invitation status to matched
        const { error: invitationError } = await supabase
          .from('match_invitations')
          .update({
            status: 'matched',
            updated_at: new Date().toISOString(),
          })
          .eq('id', invitation_id);

        if (invitationError) {
          throw new Error(`Supabase error: ${invitationError.message}`);
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
          throw new Error(`Supabase error: ${responseError.message}`);
        }

        return {
          success: true,
        };
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
 * Get all sync strategies
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