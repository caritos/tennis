import { Database } from '@/database/database';
import QueryOptimizer from '@/database/queryOptimizer';
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
  private queryOptimizer: QueryOptimizer;

  constructor(private db: Database) {
    this.queryOptimizer = new QueryOptimizer(db);
    // Initialize performance indexes
    this.queryOptimizer.createPerformanceIndexes().catch(error => 
      console.warn('Failed to create performance indexes:', error)
    );
  }

  async createNotification(params: CreateNotificationParams): Promise<string> {
    const id = generateUUID();
    
    try {
      await this.db.runAsync(
        `INSERT INTO notifications (
          id, user_id, type, title, message, is_read, 
          action_type, action_data, related_id, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          params.user_id,
          params.type,
          params.title,
          params.message || null,
          0, // is_read = false
          params.action_type || null,
          params.action_data ? JSON.stringify(params.action_data) : null,
          params.related_id || null,
          params.expires_at || null,
        ]
      );

      console.log('✅ Notification created:', { id, title: params.title, user_id: params.user_id });
      return id;
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
      throw error;
    }
  }

  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const notifications = await this.queryOptimizer.cachedQuery<Notification>(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limit],
        30 // Cache for 30 seconds
      );

      return notifications.map(notification => ({
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
      const result = await this.queryOptimizer.cachedQuery<{ count: number }>(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId],
        60 // Cache unread count for 1 minute
      );

      return result[0]?.count || 0;
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE notifications SET is_read = 1 WHERE id = ?',
        [notificationId]
      );

      // Clear cache to ensure fresh data on next read
      this.queryOptimizer.clearCache();
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      // Clear cache to ensure fresh data on next read
      this.queryOptimizer.clearCache();
      
      console.log('✅ All notifications marked as read for user:', userId);
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'DELETE FROM notifications WHERE id = ?',
        [notificationId]
      );

      // Clear cache to ensure fresh data on next read
      this.queryOptimizer.clearCache();
      
      console.log('✅ Notification deleted:', notificationId);
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      throw error;
    }
  }

  async deleteExpiredNotifications(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await this.db.runAsync(
        'DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < ?',
        [now]
      );

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