import { supabase } from '@/lib/supabase';
import { generateUUID } from '../utils/uuid';

export interface Notification {
  id: string;
  user_id: string;
  type: 'challenge' | 'match_invitation' | 'match_result' | 'ranking_update' | 'club_activity';
  title: string;
  message?: string;
  is_read: boolean;
  action_type?: 'accept_challenge' | 'decline_challenge' | 'view_match' | 'view_ranking' | 'join_club';
  action_data?: string; // JSON string for action parameters
  related_id?: string; // ID of related entity (challenge_id, match_id, etc.)
  created_at: string;
  expires_at?: string;
}

export interface CreateNotificationParams {
  user_id: string;
  type: Notification['type'];
  title: string;
  message?: string;
  action_type?: Notification['action_type'];
  action_data?: any; // Will be JSON stringified
  related_id?: string;
  expires_at?: string;
}

export class NotificationService {
  constructor() {
    // Supabase-based implementation - no initialization needed
  }

  async createNotification(params: CreateNotificationParams): Promise<string> {
    const id = generateUUID();
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          id,
          user_id: params.user_id,
          type: params.type,
          title: params.title,
          message: params.message || null,
          is_read: false,
          action_type: params.action_type || null,
          action_data: params.action_data ? JSON.stringify(params.action_data) : null,
          related_id: params.related_id || null,
          expires_at: params.expires_at || null,
        });

      if (error) {
        console.error('❌ Supabase error creating notification:', error);
        throw error;
      }

      console.log('✅ Notification created:', { id, title: params.title, user_id: params.user_id });
      return id;
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
      throw error;
    }
  }

  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Supabase error getting notifications:', error);
        throw error;
      }

      return (data || []).map(notification => ({
        ...notification,
        is_read: Boolean(notification.is_read),
        action_data: notification.action_data ? JSON.parse(notification.action_data) : undefined,
      }));
    } catch (error) {
      console.error('❌ Failed to get notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Supabase error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Supabase error marking notification as read:', error);
        throw error;
      }
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Supabase error marking all notifications as read:', error);
        throw error;
      }
      
      console.log('✅ All notifications marked as read for user:', userId);
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Supabase error deleting notification:', error);
        throw error;
      }
      
      console.log('✅ Notification deleted:', notificationId);
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      throw error;
    }
  }

  async deleteExpiredNotifications(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .not('expires_at', 'is', null)
        .lt('expires_at', now);

      if (error) {
        console.error('❌ Supabase error deleting expired notifications:', error);
        throw error;
      }

      console.log('✅ Expired notifications cleaned up');
    } catch (error) {
      console.error('❌ Failed to delete expired notifications:', error);
      throw error;
    }
  }

  // Helper methods for specific notification types
  async createChallengeNotification(
    challengedUserId: string,
    challengerName: string,
    challengeId: string,
    matchType: 'singles' | 'doubles',
    message?: string
  ): Promise<string> {
    return this.createNotification({
      user_id: challengedUserId,
      type: 'challenge',
      title: `New ${matchType} challenge from ${challengerName}`,
      message: message || `${challengerName} wants to play ${matchType}`,
      action_type: 'accept_challenge',
      action_data: { challengeId, matchType },
      related_id: challengeId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
  }

  async createMatchInvitationNotification(
    userId: string,
    creatorName: string,
    invitationId: string,
    matchType: 'singles' | 'doubles',
    date: string
  ): Promise<string> {
    return this.createNotification({
      user_id: userId,
      type: 'match_invitation',
      title: `${creatorName} is looking to play`,
      message: `${matchType} on ${date}`,
      action_data: { invitationId, matchType, date },
      related_id: invitationId,
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    });
  }

  async createMatchResultNotification(
    userId: string,
    recorderName: string,
    matchId: string,
    result: string
  ): Promise<string> {
    return this.createNotification({
      user_id: userId,
      type: 'match_result',
      title: 'Match recorded',
      message: `${recorderName} recorded: ${result}`,
      action_type: 'view_match',
      action_data: { matchId },
      related_id: matchId,
    });
  }

  async createRankingUpdateNotification(
    userId: string,
    oldRank: number,
    newRank: number,
    clubName: string
  ): Promise<string> {
    const direction = newRank < oldRank ? 'up' : 'down';
    const emoji = direction === 'up' ? '📈' : '📉';
    
    return this.createNotification({
      user_id: userId,
      type: 'ranking_update',
      title: `${emoji} Ranking updated`,
      message: `${clubName}: #${oldRank} → #${newRank}`,
      action_type: 'view_ranking',
      action_data: { oldRank, newRank, clubName },
    });
  }
}

// Export singleton instance
export default new NotificationService();