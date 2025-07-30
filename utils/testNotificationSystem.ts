import { initializeDatabase } from '@/database/database';
import { NotificationService } from '@/services/NotificationService';

/**
 * Test utility to create sample notifications for development and testing
 */
export async function createTestNotifications(userId: string) {
  console.log('🧪 Creating test notifications for user:', userId);

  try {
    const db = await initializeDatabase();
    const notificationService = new NotificationService(db);

    // Test challenge notification
    await notificationService.createChallengeNotification(
      userId,
      'John Doe',
      'test-challenge-123',
      'singles',
      'Ready for a competitive match?'
    );

    // Test match invitation notification
    await notificationService.createMatchInvitationNotification(
      userId,
      'Sarah Wilson',
      'test-invitation-456',
      'doubles',
      '2025-07-30'
    );

    // Test match result notification
    await notificationService.createMatchResultNotification(
      userId,
      'Mike Chen',
      'test-match-789',
      'Won 6-4, 6-2'
    );

    // Test ranking update notification
    await notificationService.createRankingUpdateNotification(
      userId,
      5,
      3,
      'Downtown Tennis Club'
    );

    // Test club activity notification
    await notificationService.createNotification({
      user_id: userId,
      type: 'club_activity',
      title: 'New member joined!',
      message: 'Alice Smith joined Downtown Tennis Club',
      action_type: 'join_club',
      action_data: { clubId: 'test-club-1', newMemberName: 'Alice Smith' },
      related_id: 'test-club-1',
    });

    console.log('✅ Test notifications created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create test notifications:', error);
    return false;
  }
}

/**
 * Get notification stats for a user
 */
export async function getNotificationStats(userId: string) {
  try {
    const db = await initializeDatabase();
    const notificationService = new NotificationService(db);

    const [allNotifications, unreadCount] = await Promise.all([
      notificationService.getNotifications(userId, 100),
      notificationService.getUnreadCount(userId),
    ]);

    const stats = {
      total: allNotifications.length,
      unread: unreadCount,
      byType: {} as Record<string, number>,
    };

    // Count by type
    allNotifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    console.log('📊 Notification stats for user:', userId, stats);
    return stats;
  } catch (error) {
    console.error('❌ Failed to get notification stats:', error);
    return null;
  }
}

/**
 * Clean up old test notifications
 */
export async function cleanupTestNotifications(userId: string) {
  try {
    const db = await initializeDatabase();
    
    await db.runAsync(
      `DELETE FROM notifications 
       WHERE user_id = ? 
       AND (
         related_id LIKE 'test-%' 
         OR title LIKE '%test%' 
         OR message LIKE '%test%'
       )`,
      [userId]
    );

    console.log('🧹 Test notifications cleaned up for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Failed to cleanup test notifications:', error);
    return false;
  }
}