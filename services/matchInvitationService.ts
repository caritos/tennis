import { initializeDatabase } from '@/database/database';
import { syncService } from './sync';
import { NotificationService } from './NotificationService';

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
    const db = await initializeDatabase();
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const invitation: MatchInvitation = {
      id: invitationId,
      ...invitationData,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    try {
      // Store locally first
      await db.runAsync(
        `INSERT INTO match_invitations (
          id, club_id, creator_id, match_type, date, time, location, notes, status, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invitation.id,
          invitation.club_id,
          invitation.creator_id,
          invitation.match_type,
          invitation.date,
          invitation.time || null,
          invitation.location || null,
          invitation.notes || null,
          invitation.status,
          invitation.created_at,
          invitation.expires_at || null,
        ]
      );

      // Queue for sync
      await syncService.queueInvitationCreation(
        invitation.club_id,
        invitation.creator_id,
        invitation.match_type,
        invitation.date,
        invitation.time,
        invitation.notes,
        invitation.expires_at
      );

      console.log('✅ Match invitation created:', invitation.id);
      return invitation;
    } catch (error) {
      console.error('❌ Failed to create invitation:', error);
      throw new Error('Failed to create match invitation');
    }
  }

  /**
   * Get active invitations for a club
   */
  public async getClubInvitations(clubId: string): Promise<MatchInvitation[]> {
    const db = await initializeDatabase();
    
    try {
      const invitations = await db.getAllAsync(
        `SELECT mi.*, u.full_name as creator_name
         FROM match_invitations mi
         LEFT JOIN users u ON mi.creator_id = u.id
         WHERE mi.club_id = ? AND mi.status = 'active'
         ORDER BY mi.created_at DESC`,
        [clubId]
      );

      return invitations as MatchInvitation[];
    } catch (error) {
      console.error('❌ Failed to get club invitations:', error);
      return [];
    }
  }

  /**
   * Get responses for an invitation
   */
  public async getInvitationResponses(invitationId: string): Promise<InvitationResponse[]> {
    const db = await initializeDatabase();
    
    try {
      const responses = await db.getAllAsync(
        `SELECT ir.*, u.full_name as user_name
         FROM invitation_responses ir
         LEFT JOIN users u ON ir.user_id = u.id
         WHERE ir.invitation_id = ?
         ORDER BY ir.created_at ASC`,
        [invitationId]
      );

      return responses as InvitationResponse[];
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
    const db = await initializeDatabase();
    const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
      const existingResponse = await db.getFirstAsync(
        'SELECT id FROM invitation_responses WHERE invitation_id = ? AND user_id = ?',
        [invitationId, userId]
      );

      if (existingResponse) {
        throw new Error('You have already responded to this invitation');
      }

      // Store locally first
      await db.runAsync(
        `INSERT INTO invitation_responses (
          id, invitation_id, user_id, message, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          response.id,
          response.invitation_id,
          response.user_id,
          response.message || null,
          response.status,
          response.created_at,
        ]
      );

      // Create notification for invitation creator
      const invitationDetails = await db.getFirstAsync(
        `SELECT mi.creator_id, mi.match_type, mi.date, u.full_name as responder_name
         FROM match_invitations mi
         JOIN users u ON u.id = ?
         WHERE mi.id = ?`,
        [userId, invitationId]
      ) as any;

      if (invitationDetails) {
        const notificationService = new NotificationService(db);
        await notificationService.createMatchInvitationNotification(
          invitationDetails.creator_id,
          invitationDetails.responder_name,
          invitationId,
          invitationDetails.match_type,
          invitationDetails.date
        );
      }

      // Queue for sync
      await syncService.queueInvitationResponse(invitationId, userId, message);

      // Check if we should auto-match
      await this.checkAutoMatch(invitationId);

      console.log('✅ Invitation response created:', response.id);
      return response;
    } catch (error) {
      console.error('❌ Failed to respond to invitation:', error);
      throw error;
    }
  }

  /**
   * Cancel an invitation
   */
  public async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    const db = await initializeDatabase();
    
    try {
      // Verify the user owns this invitation
      const invitation = await db.getFirstAsync(
        'SELECT creator_id FROM match_invitations WHERE id = ?',
        [invitationId]
      );

      if (!invitation || invitation.creator_id !== userId) {
        throw new Error('You can only cancel your own invitations');
      }

      // Update locally
      await db.runAsync(
        'UPDATE match_invitations SET status = ?, updated_at = ? WHERE id = ?',
        ['cancelled', new Date().toISOString(), invitationId]
      );

      // Queue for sync
      await syncService.queueInvitationCancellation(invitationId);

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
    const db = await initializeDatabase();
    
    try {
      // Get invitation details
      const invitation = await db.getFirstAsync(
        'SELECT * FROM match_invitations WHERE id = ? AND status = "active"',
        [invitationId]
      ) as MatchInvitation | null;

      if (!invitation) return;

      // Get interested responses
      const responses = await db.getAllAsync(
        'SELECT * FROM invitation_responses WHERE invitation_id = ? AND status = "interested"',
        [invitationId]
      );

      const requiredPlayers = invitation.match_type === 'singles' ? 2 : 4;
      const totalPlayers = responses.length + 1; // +1 for creator

      if (totalPlayers >= requiredPlayers) {
        // Auto-match: confirm the match
        const confirmedPlayerIds = [
          invitation.creator_id,
          ...responses.slice(0, requiredPlayers - 1).map((r: any) => r.user_id)
        ];

        // Update invitation status
        await db.runAsync(
          'UPDATE match_invitations SET status = ?, updated_at = ? WHERE id = ?',
          ['matched', new Date().toISOString(), invitationId]
        );

        // Update response statuses
        await db.runAsync(
          `UPDATE invitation_responses 
           SET status = ?, updated_at = ? 
           WHERE invitation_id = ? AND user_id IN (${confirmedPlayerIds.slice(1).map(() => '?').join(',')})`,
          ['confirmed', new Date().toISOString(), invitationId, ...confirmedPlayerIds.slice(1)]
        );

        // Queue match confirmation for sync
        await syncService.queueMatchConfirmation(invitationId, confirmedPlayerIds);

        console.log('🎾 Auto-matched invitation:', invitationId, 'with players:', confirmedPlayerIds);
      }
    } catch (error) {
      console.error('❌ Failed to check auto-match:', error);
    }
  }

  /**
   * Get user's invitations (created by user)
   */
  public async getUserInvitations(userId: string): Promise<MatchInvitation[]> {
    const db = await initializeDatabase();
    
    try {
      const invitations = await db.getAllAsync(
        `SELECT mi.*, c.name as club_name
         FROM match_invitations mi
         LEFT JOIN clubs c ON mi.club_id = c.id
         WHERE mi.creator_id = ?
         ORDER BY mi.created_at DESC`,
        [userId]
      );

      return invitations as MatchInvitation[];
    } catch (error) {
      console.error('❌ Failed to get user invitations:', error);
      return [];
    }
  }

  /**
   * Get user's responses (invitations user responded to)
   */
  public async getUserResponses(userId: string): Promise<InvitationResponse[]> {
    const db = await initializeDatabase();
    
    try {
      const responses = await db.getAllAsync(
        `SELECT ir.*, mi.match_type, mi.date, mi.time, mi.notes, u.full_name as creator_name, c.name as club_name
         FROM invitation_responses ir
         LEFT JOIN match_invitations mi ON ir.invitation_id = mi.id
         LEFT JOIN users u ON mi.creator_id = u.id
         LEFT JOIN clubs c ON mi.club_id = c.id
         WHERE ir.user_id = ?
         ORDER BY ir.created_at DESC`,
        [userId]
      );

      return responses as InvitationResponse[];
    } catch (error) {
      console.error('❌ Failed to get user responses:', error);
      return [];
    }
  }
}

// Export singleton instance
export const matchInvitationService = MatchInvitationService.getInstance();