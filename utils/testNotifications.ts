import { pushNotificationService } from '@/services/pushNotificationService';

/**
 * Test utility for push notifications
 * Use this in development to test notification functionality
 */
export async function testNotifications() {
  console.log('🧪 Testing push notifications...');

  // Test challenge notification
  await pushNotificationService.sendLocalNotification({
    type: 'challenge',
    title: 'Test Challenge',
    body: 'John Doe challenged you to a singles match',
    data: {
      challengeId: 'test-challenge-123',
      challengerId: 'user-1',
      challengedId: 'user-2',
      clubId: 'club-1',
      matchType: 'singles',
    },
  });

  console.log('✅ Challenge notification sent');

  // Test match invitation notification  
  setTimeout(async () => {
    await pushNotificationService.sendLocalNotification({
      type: 'match_invitation',
      title: 'Looking to Play!',
      body: 'Sarah Wilson is looking for a doubles partner',
      data: {
        invitationId: 'test-invitation-456',
        clubId: 'club-1',
        matchType: 'doubles',
        date: '2025-07-30',
        userId: 'user-2',
      },
    });
    console.log('✅ Match invitation notification sent');
  }, 2000);

  // Test match result notification
  setTimeout(async () => {
    await pushNotificationService.sendLocalNotification({
      type: 'match_result',
      title: 'Match Recorded!',
      body: 'Your match with Mike Chen has been recorded',
      data: {
        matchId: 'test-match-789',
        clubId: 'club-1',
        date: '2025-07-29',
      },
    });
    console.log('✅ Match result notification sent');
  }, 4000);

  // Test ranking update notification
  setTimeout(async () => {
    await pushNotificationService.sendLocalNotification({
      type: 'ranking_update',
      title: 'Ranking Update!',
      body: 'You moved up to #3 in Downtown Tennis Club',
      data: {
        clubId: 'club-1',
        newRank: 3,
        oldRank: 5,
      },
    });
    console.log('✅ Ranking update notification sent');
  }, 6000);
}

/**
 * Test notification permissions
 */
export async function testNotificationPermissions() {
  console.log('🧪 Testing notification permissions...');
  
  const token = await pushNotificationService.registerForPushNotifications();
  
  if (token) {
    console.log('✅ Push notifications are enabled');
    console.log('📱 Push token:', token);
  } else {
    console.log('❌ Push notifications are not enabled');
  }
  
  return !!token;
}

/**
 * Test notification categories and actions
 */
export async function testNotificationCategories() {
  console.log('🧪 Testing notification categories...');
  
  // Test challenge with actions
  await pushNotificationService.sendLocalNotification({
    type: 'challenge',
    title: 'Test Challenge with Actions',
    body: 'Tap Accept or Decline to test action buttons',
    data: {
      challengeId: 'test-challenge-actions',
      challengerId: 'user-1',
      challengedId: 'user-2',
      clubId: 'club-1',
      matchType: 'singles',
    },
  });

  console.log('✅ Challenge notification with actions sent');
  console.log('ℹ️ Try swiping or force-touching the notification to see actions');
}