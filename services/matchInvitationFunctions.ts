import { supabase } from '@/lib/supabase';

// Types for the Postgres function responses
export interface ClubMatchInvitation {
  id: string;
  club_id: string;
  creator_id: string;
  date: string;
  time: string | null;
  location: string | null;
  match_type: 'singles' | 'doubles';
  notes: string | null;
  status: string;
  targeted_players: string[] | null;
  targeted_player_names: string[] | null;
  created_at: string;
  creator_full_name: string;
  creator_phone: string | null;
  response_count: number;
  responses: Array<{
    id: string;
    user_id: string;
    full_name: string;
    phone?: string;
    created_at: string;
  }>;
}

export interface DebugMatchInvitationsResult {
  timestamp: string;
  inputs: {
    club_id: string;
    user_id: string | null;
    current_user_id: string | null;
  };
  club_info: {
    exists: boolean;
    name: string | null;
  };
  raw_invitations: Array<{
    id: string;
    club_id: string;
    creator_id: string;
    date: string;
    status: string;
    created_at: string;
    creator_name: string;
  }> | null;
  user_membership: {
    is_member: boolean;
  };
  rls_context: {
    auth_uid: string | null;
    is_authenticated: boolean;
  };
}

/**
 * Get match invitations for a club using the Postgres function
 * This bypasses potential RLS issues and returns complete data
 */
export async function getClubMatchInvitations(
  clubId: string,
  userId?: string
): Promise<{ data: ClubMatchInvitation[] | null; error: Error | null }> {
  try {
    console.log('📋 Calling get_club_match_invitations function:', { clubId, userId });
    
    const { data, error } = await supabase
      .rpc('get_club_match_invitations', {
        p_club_id: clubId,
        p_user_id: userId || undefined
      });

    if (error) {
      console.error('❌ Error calling get_club_match_invitations:', error);
      return { data: null, error };
    }

    console.log(`✅ Got ${data?.length || 0} match invitations from function`);
    return { data: data as ClubMatchInvitation[], error: null };
  } catch (err) {
    console.error('❌ Unexpected error in getClubMatchInvitations:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Debug match invitations issue for a club
 * Returns detailed information about why invitations might not be showing
 */
export async function debugMatchInvitations(
  clubId: string,
  userId?: string
): Promise<{ data: DebugMatchInvitationsResult | null; error: Error | null }> {
  try {
    console.log('🔍 Calling debug_match_invitations function:', { clubId, userId });
    
    const { data, error } = await supabase
      .rpc('debug_match_invitations', {
        p_club_id: clubId,
        p_user_id: userId || undefined
      });

    if (error) {
      console.error('❌ Error calling debug_match_invitations:', error);
      return { data: null, error };
    }

    console.log('🔍 Debug result:', data);
    return { data: data as DebugMatchInvitationsResult, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in debugMatchInvitations:', err);
    return { data: null, error: err as Error };
  }
}