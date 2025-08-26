import { supabase } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';

export interface MatchInvitation {
  id: string;
  club_id: string;
  creator_id: string;
  match_type: 'singles' | 'doubles';
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  status: 'active' | 'matched' | 'cancelled';
  created_at: string;
  expires_at?: string;
  creator_name?: string; // Joined from users table
}

export interface InvitationResponse {
  id: string;
  invitation_id: string;
  user_id: string;
  message?: string;
  status: 'interested' | 'confirmed' | 'declined';
  created_at: string;
  user_name?: string; // Joined from users table
}

export interface CreateInvitationData {
  club_id: string;
  creator_id: string;
  match_type: 'singles' | 'doubles';
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  expires_at?: string;
}

/**
 * Service for managing match invitations and responses
 */
export class MatchInvitationService {
  private static instance: MatchInvitationService | null = null;

  private constructor() {}

  public static getInstance(): MatchInvitationService {
    if (!MatchInvitationService.instance) {
      MatchInvitationService.instance = new MatchInvitationService();
    }
    return MatchInvitationService.instance;
  }

  /**
   * Create a new match invitation
   */
  public async createInvitation(invitationData: CreateInvitationData): Promise<MatchInvitation> {
    const invitationId = generateUUID();
    
    const invitation: MatchInvitation = {
      id: invitationId,
      ...invitationData,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('match_invitations')
        .insert(invitation)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create invitation:', error);
        console.error('❌ Invitation data being sent:', invitation);
        throw new Error(`Failed to create match invitation: ${error.message || JSON.stringify(error)}`);
      }

      console.log('✅ Match invitation created:', invitation.id);
      return data as MatchInvitation;
    } catch (error) {
      console.error('❌ Failed to create invitation (catch block):', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to create match invitation: Unknown error');
      }
    }
  }

  /**
   * Get active invitations for a club
   */
  public async getClubInvitations(clubId: string): Promise<MatchInvitation[]> {
    try {
      // Clean up expired invitations before fetching
      await this.cleanupExpiredInvitations(clubId);
      
      const { data: invitations, error } = await supabase
        .from('match_invitations')
        .select(`
          *,
          users!creator_id(full_name)
        `)
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get club invitations:', error);
        return [];
      }

      // Map joined data to expected format
      return (invitations || []).map((invitation: any) => ({
        ...invitation,
        creator_name: invitation.users?.full_name
      }));
    } catch (error) {
      console.error('❌ Failed to get club invitations:', error);
      return [];
    }
  }

  /**
   * Get a specific invitation by ID (for notification navigation)
   */
  public async getInvitationById(invitationId: string): Promise<MatchInvitation | null> {
    try {
      const { data: invitation, error } = await supabase
        .from('match_invitations')
        .select(`
          *,
          users!creator_id(full_name)
        `)
        .eq('id', invitationId)
        .single();

      if (error) {
        console.error('❌ Failed to get invitation by ID:', error);
        return null;
      }

      return invitation as MatchInvitation;
    } catch (error) {
      console.error('❌ Failed to get invitation by ID:', error);
      return null;
    }
  }

  /**
   * Get responses for an invitation
   */
  public async getInvitationResponses(invitationId: string): Promise<InvitationResponse[]> {
    try {
      const { data: responses, error } = await supabase
        .from('invitation_responses')
        .select(`
          *,
          user:users!invitation_responses_user_id_fkey(full_name)
        `)
        .eq('invitation_id', invitationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Failed to get invitation responses:', error);
        return [];
      }

      // Map joined data to expected format
      return (responses || []).map((response: any) => ({
        ...response,
        user_name: response.user?.full_name
      }));
    } catch (error) {
      console.error('❌ Failed to get invitation responses:', error);
      return [];
    }
  }

  /**
   * Respond to an invitation
   */
  public async respondToInvitation(
    invitationId: string,
    userId: string,
    message?: string
  ): Promise<InvitationResponse> {
    const responseId = generateUUID();
    
    const response: InvitationResponse = {
      id: responseId,
      invitation_id: invitationId,
      user_id: userId,
      message,
      status: 'interested',
      created_at: new Date().toISOString(),
    };

    try {
      // Check if user already responded
      const { data: existingResponse } = await supabase
        .from('invitation_responses')
        .select('id')
        .eq('invitation_id', invitationId)
        .eq('user_id', userId)
        .single();

      if (existingResponse) {
        throw new Error('You have already responded to this invitation');
      }

      // Create the response
      const { data, error } = await supabase
        .from('invitation_responses')
        .insert(response)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to respond to invitation:', error);
        throw error;
      }

      // TODO: Create notification for invitation creator
      // This would require implementing a notification system with Supabase

      // Check if we should auto-match
      await this.checkAutoMatch(invitationId);

      console.log('✅ Invitation response created:', response.id);
      return data as InvitationResponse;
    } catch (error) {
      console.error('❌ Failed to respond to invitation:', error);
      throw error;
    }
  }

  /**
   * Cancel an invitation
   */
  public async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      // Verify the user owns this invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('match_invitations')
        .select('creator_id')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation || invitation.creator_id !== userId) {
        throw new Error('You can only cancel your own invitations');
      }

      // Update the invitation status
      const { error: updateError } = await supabase
        .from('match_invitations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) {
        console.error('❌ Failed to cancel invitation:', updateError);
        throw updateError;
      }

      console.log('✅ Invitation cancelled:', invitationId);
    } catch (error) {
      console.error('❌ Failed to cancel invitation:', error);
      throw error;
    }
  }

  /**
   * Check if invitation should be auto-matched
   */
  private async checkAutoMatch(invitationId: string): Promise<void> {
    try {
      // Get invitation details
      const { data: invitation, error: invitationError } = await supabase
        .from('match_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('status', 'active')
        .single();

      if (invitationError || !invitation) return;

      // Get interested responses
      const { data: responses, error: responsesError } = await supabase
        .from('invitation_responses')
        .select('*')
        .eq('invitation_id', invitationId)
        .eq('status', 'interested');

      if (responsesError) {
        console.error('❌ Failed to get responses for auto-match:', responsesError);
        return;
      }

      const requiredPlayers = invitation.match_type === 'singles' ? 2 : 4;
      const totalPlayers = (responses?.length || 0) + 1; // +1 for creator

      if (totalPlayers >= requiredPlayers) {
        // Auto-match: confirm the match
        const confirmedPlayerIds = [
          invitation.creator_id,
          ...(responses || []).slice(0, requiredPlayers - 1).map((r: any) => r.user_id)
        ];

        // Update invitation status
        const { error: updateInvitationError } = await supabase
          .from('match_invitations')
          .update({
            status: 'matched',
            updated_at: new Date().toISOString()
          })
          .eq('id', invitationId);

        if (updateInvitationError) {
          console.error('❌ Failed to update invitation status:', updateInvitationError);
          return;
        }

        // Update response statuses for confirmed players
        if (confirmedPlayerIds.length > 1) {
          const { error: updateResponsesError } = await supabase
            .from('invitation_responses')
            .update({
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('invitation_id', invitationId)
            .in('user_id', confirmedPlayerIds.slice(1));

          if (updateResponsesError) {
            console.error('❌ Failed to update response statuses:', updateResponsesError);
          }
        }

        console.log('🎾 Auto-matched invitation:', invitationId, 'with players:', confirmedPlayerIds);
        
        // Send contact sharing notifications after successful auto-match
        await this.sendContactSharingNotifications(invitationId, invitation, confirmedPlayerIds);
      }
    } catch (error) {
      console.error('❌ Failed to check auto-match:', error);
    }
  }

  /**
   * Send contact sharing notifications to all matched players
   */
  private async sendContactSharingNotifications(
    invitationId: string, 
    invitation: any, 
    confirmedPlayerIds: string[]
  ): Promise<void> {
    try {
      console.log('📝 sendContactSharingNotifications called for invitation:', invitationId);
      console.log('📝 Confirmed players:', confirmedPlayerIds);
      
      // Get user details for all confirmed players
      const { data: players, error: playersError } = await supabase
        .from('users')
        .select('id, full_name, phone')
        .in('id', confirmedPlayerIds);

      if (playersError || !players) {
        console.error('❌ Failed to get player details:', playersError);
        return;
      }

      console.log('📝 Player details:', players);

      if (invitation.match_type === 'singles') {
        await this.sendSinglesContactNotifications(invitationId, invitation, players);
      } else {
        await this.sendDoublesContactNotifications(invitationId, invitation, players);
      }

      console.log('✅ Contact sharing notifications sent for invitation:', invitationId);
    } catch (error) {
      console.error('❌ Failed to send contact sharing notifications:', error);
    }
  }

  /**
   * Send contact notifications for singles matches (2 players)
   */
  private async sendSinglesContactNotifications(
    invitationId: string, 
    invitation: any, 
    players: any[]
  ): Promise<void> {
    if (players.length !== 2) {
      console.error('❌ Singles match requires exactly 2 players, got:', players.length);
      return;
    }

    const creator = players.find(p => p.id === invitation.creator_id);
    const participant = players.find(p => p.id !== invitation.creator_id);

    if (!creator || !participant) {
      console.error('❌ Could not identify creator and participant');
      return;
    }

    const formatContactInfo = (name: string, phone?: string) => {
      if (!phone) return `${name} (no phone number provided)`;
      return `${name}: ${phone}`;
    };

    try {
      console.log('📝 Creating contact sharing notifications for singles match using PostgreSQL function');
      console.log(`📝 Creator: ${creator.full_name} (${creator.id}), Phone: ${creator.phone}`);
      console.log(`📝 Participant: ${participant.full_name} (${participant.id}), Phone: ${participant.phone}`);
      console.log('📝 Invitation ID:', invitationId);
      console.log('📝 Current user (participant):', participant.id);
      
      // Wait a moment for database consistency
      console.log('🔍 Waiting 100ms for database consistency...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use PostgreSQL function to create notifications (bypasses RLS)
      console.log('📝 Creating match invitation notifications using PostgreSQL function');
      const { data: result, error } = await supabase.rpc('create_match_invitation_notifications', {
        p_invitation_id: invitationId,
        p_notification_type: 'match_confirmed',
        p_initiator_user_id: participant.id
      });

      if (error) {
        console.error('❌ PostgreSQL function error:', error);
        throw error;
      }

      console.log('📝 PostgreSQL function result:', result);
      
      if (result?.success) {
        console.log('✅ Match invitation notifications created successfully:', result);
        console.log('✅ Created', result.notifications_created, 'notifications');
        console.log('✅ Creator notification ID:', result.creator_notification_id);
        console.log('✅ Participant notification ID:', result.participant_notification_id);
      } else {
        console.error('❌ Function returned error:', result?.error);
        throw new Error(result?.error || 'Unknown error from PostgreSQL function');
      }
    } catch (error) {
      console.error('❌ Failed to create singles contact notifications:', error);
    }
  }

  /**
   * Send contact notifications for doubles matches (4 players)
   */
  private async sendDoublesContactNotifications(
    invitationId: string, 
    invitation: any, 
    players: any[]
  ): Promise<void> {
    if (players.length !== 4) {
      console.error('❌ Doubles match requires exactly 4 players, got:', players.length);
      return;
    }

    const formatContactInfo = (name: string, phone?: string) => {
      if (!phone) return `${name} (no phone number provided)`;
      return `${name}: ${phone}`;
    };

    try {
      console.log('📝 Creating contact sharing notifications for doubles match');
      
      // Create a notification for each player with everyone else's contact info
      for (const player of players) {
        const otherPlayers = players.filter(p => p.id !== player.id);
        const contactList = otherPlayers.map(p => formatContactInfo(p.full_name, p.phone)).join(', ');
        
        const notificationId = generateUUID();
        const notification = {
          id: notificationId,
          user_id: player.id,
          type: 'match_invitation',
          title: '🎾 Doubles Match Confirmed - Contact Info Shared',
          message: `Your doubles match is confirmed! Other players: ${contactList}`,
          is_read: false,
          action_type: 'view_match',
          action_data: JSON.stringify({ invitationId }),
          related_id: invitationId,
          created_at: new Date().toISOString(),
        };
        
        console.log(`📝 Inserting notification for ${player.full_name}:`, JSON.stringify(notification, null, 2));
        const { error } = await supabase
          .from('notifications')
          .insert(notification);

        if (error) {
          console.error(`❌ Failed to insert notification for ${player.full_name}:`, error);
        } else {
          console.log(`✅ Notification inserted for ${player.full_name}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to create doubles contact notifications:', error);
    }
  }

  /**
   * Get user's invitations (created by user)
   */
  public async getUserInvitations(userId: string): Promise<MatchInvitation[]> {
    try {
      const { data: invitations, error } = await supabase
        .from('match_invitations')
        .select(`
          *,
          club:clubs!match_invitations_club_id_fkey(name)
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get user invitations:', error);
        return [];
      }

      // Map joined data to expected format
      return (invitations || []).map((invitation: any) => ({
        ...invitation,
        club_name: invitation.club?.name
      }));
    } catch (error) {
      console.error('❌ Failed to get user invitations:', error);
      return [];
    }
  }

  /**
   * Get user's responses (invitations user responded to)
   */
  public async getUserResponses(userId: string): Promise<InvitationResponse[]> {
    try {
      const { data: responses, error } = await supabase
        .from('invitation_responses')
        .select(`
          *,
          invitation:match_invitations!invitation_responses_invitation_id_fkey(
            match_type,
            date,
            time,
            notes,
            creator:users!match_invitations_creator_id_fkey(full_name),
            club:clubs!match_invitations_club_id_fkey(name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get user responses:', error);
        return [];
      }

      // Flatten joined data to expected format
      return (responses || []).map((response: any) => ({
        ...response,
        match_type: response.invitation?.match_type,
        date: response.invitation?.date,
        time: response.invitation?.time,
        notes: response.invitation?.notes,
        creator_name: response.invitation?.creator?.full_name,
        club_name: response.invitation?.club?.name
      }));
    } catch (error) {
      console.error('❌ Failed to get user responses:', error);
      return [];
    }
  }

  /**
   * Clean up expired invitations
   */
  private async cleanupExpiredInvitations(clubId?: string): Promise<void> {
    try {
      const now = new Date();
      const currentDateTime = now.toISOString();
      const currentDate = now.toISOString().split('T')[0];
      
      // Build the query for expired invitations
      let query = supabase
        .from('match_invitations')
        .select('id, date, time, expires_at')
        .eq('status', 'active');
      
      if (clubId) {
        query = query.eq('club_id', clubId);
      }
      
      const { data: allInvitations, error: fetchError } = await query;
      
      if (fetchError) {
        console.error('❌ Failed to fetch invitations for cleanup:', fetchError);
        return;
      }
      
      // Filter expired invitations in JavaScript since Supabase doesn't support complex date comparisons
      const expiredInvitations = (allInvitations || []).filter((invitation: any) => {
        // Check if expires_at is set and passed
        if (invitation.expires_at && invitation.expires_at < currentDateTime) {
          return true;
        }
        
        // Check if date/time combination has passed (fallback if no expires_at)
        if (!invitation.expires_at && invitation.date < currentDate) {
          // If no time specified, consider it expired if the date has passed
          if (!invitation.time) {
            return true;
          }
          
          // If time is specified, check if the datetime combination has passed
          const invitationDateTime = new Date(`${invitation.date}T${invitation.time}`);
          return invitationDateTime < now;
        }
        
        return false;
      });
      
      if (expiredInvitations.length > 0) {
        console.log(`🗑️ Found ${expiredInvitations.length} expired invitations, removing...`);
        
        // Delete expired invitations
        const expiredIds = expiredInvitations.map((inv: any) => inv.id);
        
        const { error: deleteError } = await supabase
          .from('match_invitations')
          .delete()
          .in('id', expiredIds);
        
        if (deleteError) {
          console.error('❌ Failed to delete expired invitations:', deleteError);
        } else {
          console.log(`✅ Removed ${expiredInvitations.length} expired invitations`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired invitations:', error);
    }
  }

  /**
   * Create a club notification for match invitation
   */
  public async createClubNotification(clubId: string, notificationData: {
    type: string;
    title: string;
    message: string;
    invitation_id: string;
    match_type: string;
    date: string;
    time?: string;
    location?: string;
    creator_name: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('club_notifications')
        .insert({
          id: generateUUID(),
          club_id: clubId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: JSON.stringify({
            invitation_id: notificationData.invitation_id,
            match_type: notificationData.match_type,
            date: notificationData.date,
            time: notificationData.time,
            location: notificationData.location,
            creator_name: notificationData.creator_name
          }),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to create club notification:', error);
        throw error;
      }

      console.log('✅ Club notification created for invitation');
    } catch (error) {
      console.error('❌ Failed to create club notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const matchInvitationService = MatchInvitationService.getInstance();