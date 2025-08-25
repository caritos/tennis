import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { VirtualizedList } from '@/components/VirtualizedList';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNotification } from '@/contexts/NotificationContext';
import { NotificationService, Notification } from '@/services/NotificationService';
import { challengeService } from '@/services/challengeService';
// import { initializeDatabase } from '@/database/database'; // Removed - using NotificationService from Supabase
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedState } from '@/hooks/useOptimizedState';

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
  onChallengeAction: (challengeId: string, action: 'accept' | 'decline') => void;
  colorScheme: 'light' | 'dark';
}

const NotificationItem = React.memo<NotificationItemProps>(function NotificationItem({
  notification,
  onPress,
  onMarkAsRead,
  onChallengeAction,
  colorScheme,
}) {
  const colors = Colors[colorScheme ?? 'light'];

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'challenge':
        return '🎾';
      case 'match_invitation':
        return '📢';
      case 'match_result':
        return '🏆';
      case 'ranking_update':
        return '📊';
      case 'club_activity':
        return '👥';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  const handleActionPress = (actionType: string) => {
    if (actionType === 'accept_challenge' && notification.related_id) {
      onChallengeAction(notification.related_id, 'accept');
    } else if (actionType === 'decline_challenge' && notification.related_id) {
      onChallengeAction(notification.related_id, 'decline');
    }
    onMarkAsRead(notification.id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: colors.background,
          borderColor: colors.tabIconDefault,
          opacity: notification.is_read ? 0.7 : 1,
        }
      ]}
      onPress={() => onPress(notification)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(notification.type)}
          </Text>
          <View style={styles.notificationContent}>
            <ThemedText style={styles.notificationTitle}>
              {notification.title}
            </ThemedText>
            {notification.message && (
              <ThemedText style={styles.notificationMessage}>
                {notification.message}
              </ThemedText>
            )}
            <Text style={[styles.notificationTime, { color: colors.tabIconDefault }]}>
              {formatTimeAgo(notification.created_at)}
            </Text>
          </View>
        </View>
        {!notification.is_read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />
        )}
      </View>

      {/* Action buttons for challenges */}
      {notification.type === 'challenge' && notification.action_type && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleActionPress('decline_challenge')}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.tint }]}
            onPress={() => handleActionPress('accept_challenge')}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action button for other types */}
      {notification.action_type && notification.type !== 'challenge' && (
        <View style={styles.singleActionContainer}>
          <TouchableOpacity
            style={[styles.singleActionButton, { borderColor: colors.tint }]}
            onPress={() => onPress(notification)}
          >
            <Text style={[styles.singleActionText, { color: colors.tint }]}>
              {notification.action_type === 'view_match' ? 'View' : 
               notification.action_type === 'view_ranking' ? 'View' : 'Open'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

export const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useOptimizedState<Notification[]>([], {
    debounceMs: 100,
    batchUpdates: true,
  });
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const [notificationService, setNotificationService] = useState<NotificationService | null>(null);

  useEffect(() => {
    initService();
  }, []);

  const initService = async () => {
    try {
      setNotificationService(new NotificationService());
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  };

  useEffect(() => {
    if (notificationService && user) {
      loadNotifications();
    }
  }, [notificationService, user]);

  const loadNotifications = async () => {
    if (!notificationService || !user) return;

    try {
      const userNotifications = await notificationService.getNotifications(user.id);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.action_type === 'view_match' && notification.related_id) {
      // Navigate to match details (would need to implement this route)
      console.log('Navigate to match:', notification.related_id);
    } else if (notification.action_type === 'view_ranking') {
      // Navigate to clubs tab to view rankings
      router.push('/(tabs)');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!notificationService) return;

    try {
      await notificationService.markAsRead(notificationId);
      const updatedNotifications = notifications.map((n: Notification) => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!notificationService || !user) return;

    try {
      await notificationService.markAllAsRead(user.id);
      const updatedNotifications = notifications.map((n: Notification) => ({ ...n, is_read: true }));
      setNotifications(updatedNotifications);
      showSuccess('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleChallengeAction = async (challengeId: string, action: 'accept' | 'decline') => {
    if (!user) return;

    try {
      if (action === 'accept') {
        await challengeService.acceptChallenge(challengeId, user.id);
        showSuccess('Challenge accepted! Contact info will be shared.');
      } else {
        await challengeService.declineChallenge(challengeId, user.id);
        showSuccess('Challenge declined.');
      }
      
      // Refresh notifications to show updated status
      await loadNotifications();
    } catch (error) {
      console.error(`Failed to ${action} challenge:`, error);
      showError(`Failed to ${action} challenge`, 'Please try again.');
    }
  };

  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      let groupKey: string;

      if (notificationDate.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (notificationDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = notificationDate.toLocaleDateString();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);
  const hasUnreadNotifications = notifications.some(n => !n.is_read);

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please sign in to view notifications</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>🔔 Notifications</ThemedText>
        {hasUnreadNotifications && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={[styles.markAllReadButton, { color: colors.tint }]}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔔</Text>
          <ThemedText style={styles.emptyStateText}>No notifications yet</ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>
            You&apos;ll see challenges, match results, and ranking updates here
          </ThemedText>
        </View>
      ) : (
        <VirtualizedList
          data={Object.entries(groupedNotifications)}
          keyExtractor={([date]) => date}
          itemHeight={120} // Approximate height for optimization
          optimizeForIPad={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
            />
          }
          renderItem={({ item: [date, groupNotifications] }) => (
            <View>
              <Text style={[styles.dateHeader, { color: colors.tabIconDefault }]}>
                {date}
              </Text>
              {groupNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onPress={handleNotificationPress}
                  onMarkAsRead={handleMarkAsRead}
                  onChallengeAction={handleChallengeAction}
                  colorScheme={colorScheme ?? 'light'}
                />
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllReadButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  notificationItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.8,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
  },
  declineButton: {
    backgroundColor: '#f0f0f0',
  },
  acceptButton: {
    // backgroundColor set dynamically
  },
  declineButtonText: {
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  singleActionContainer: {
    marginTop: 12,
  },
  singleActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  singleActionText: {
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
});