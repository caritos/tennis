import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService, Notification } from '@/services/NotificationService';
// import { initializeDatabase } from '@/database/database'; // Removed - using NotificationService from Supabase

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps & {
  onQuickAction: (notification: Notification, action: string) => void;
}> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  onQuickAction,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'challenge':
        return 'trophy-outline';
      case 'match_invitation':
        return 'people-outline';
      case 'match_result':
        return 'checkmark-circle-outline';
      case 'ranking_update':
        return 'trending-up-outline';
      case 'club_activity':
        return 'home-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'challenge':
        return '#FF6B35';
      case 'match_invitation':
        return '#4ECDC4';
      case 'match_result':
        return '#45B7D1';
      case 'ranking_update':
        return '#96CEB4';
      case 'club_activity':
        return '#FFEAA7';
      default:
        return colors.tint;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: notification.is_read ? colors.background : colors.tint + '10',
          borderColor: colors.tabIconDefault + '30',
        },
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getTypeColor(notification.type) + '20' }]}>
            <Ionicons
              name={getNotificationIcon(notification.type) as any}
              size={24}
              color={getTypeColor(notification.type)}
            />
          </View>
          <View style={styles.notificationText}>
            <ThemedText style={[styles.notificationTitle, { fontWeight: notification.is_read ? '400' : '600' }]}>
              {notification.title}
            </ThemedText>
            {notification.message && (
              <ThemedText style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </ThemedText>
            )}
          </View>
          <View style={styles.notificationActions}>
            <ThemedText style={styles.timestamp}>
              {formatTimestamp(notification.created_at)}
            </ThemedText>
            {!notification.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />
            )}
          </View>
        </View>

        {/* Quick Actions */}
        {notification.action_type && !notification.is_read && (
          <View style={styles.quickActions}>
            {notification.action_type === 'accept_challenge' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => onQuickAction(notification, 'accept')}
                >
                  <ThemedText style={styles.actionButtonText}>Accept</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.declineButton]}
                  onPress={() => onQuickAction(notification, 'decline')}
                >
                  <ThemedText style={styles.actionButtonText}>Decline</ThemedText>
                </TouchableOpacity>
              </>
            )}
            {notification.type === 'match_invitation' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.joinButton]}
                onPress={() => onQuickAction(notification, 'join')}
              >
                <ThemedText style={styles.actionButtonText}>Join Match</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Swipe Actions */}
      <View style={styles.swipeActions}>
        {!notification.is_read && (
          <TouchableOpacity
            style={[styles.swipeAction, { backgroundColor: colors.tint }]}
            onPress={() => onMarkAsRead(notification.id)}
          >
            <Ionicons name="checkmark" size={20} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#FF6B6B' }]}
          onPress={() => onDelete(notification.id)}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};


export const NotificationScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const notificationService = new NotificationService();

      const [notificationList, count] = await Promise.all([
        notificationService.getNotifications(user.id, 50),
        notificationService.getUnreadCount(user.id),
      ]);

      setNotifications(notificationList);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read && user?.id) {
      try {
        const notificationService = new NotificationService();
        await notificationService.markAsRead(notification.id);
        
        // Update local state
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'challenge':
        router.push('/(tabs)'); // Navigate to clubs tab where challenges are visible
        break;
      case 'match_invitation':
        router.push('/(tabs)'); // Navigate to clubs tab for match invitations
        break;
      case 'match_result':
        router.push('/(tabs)/profile'); // Navigate to profile for match history
        break;
      case 'ranking_update':
        router.push('/(tabs)'); // Navigate to clubs tab for rankings
        break;
      default:
        router.push('/(tabs)');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const notificationService = new NotificationService();
      await notificationService.markAsRead(notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const notificationService = new NotificationService();
              await notificationService.deleteNotification(notificationId);

              setNotifications(prev => prev.filter(n => n.id !== notificationId));
              
              // Update unread count if deleted notification was unread
              const deletedNotification = notifications.find(n => n.id === notificationId);
              if (deletedNotification && !deletedNotification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            } catch (error) {
              console.error('Failed to delete notification:', error);
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;

    try {
      const notificationService = new NotificationService();
      await notificationService.markAllAsRead(user.id);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Quick action handler
  const handleQuickAction = async (notification: Notification, action: string) => {
    console.log('Quick action:', action, 'for notification:', notification.id);
    
    try {
      if (notification.type === 'challenge' && notification.action_data) {
        const { challengeService } = await import('@/services/challengeService');
        const actionData = typeof notification.action_data === 'string' 
          ? JSON.parse(notification.action_data) 
          : notification.action_data;
        const challengeId = actionData.challengeId;
        
        if (action === 'accept') {
          await challengeService.acceptChallenge(challengeId, notification.user_id);
          console.log('✅ Challenge accepted via quick action');
        } else if (action === 'decline') {
          await challengeService.declineChallenge(challengeId, notification.user_id);
          console.log('✅ Challenge declined via quick action');
        }
      } else if (notification.type === 'match_invitation' && notification.action_data) {
        const { matchInvitationService } = await import('@/services/matchInvitationService');
        const actionData = typeof notification.action_data === 'string' 
          ? JSON.parse(notification.action_data) 
          : notification.action_data;
        const invitationId = actionData.invitationId;
        
        if (action === 'join') {
          await matchInvitationService.respondToInvitation(
            invitationId,
            notification.user_id,
            'Interested via quick action'
          );
          console.log('✅ Match invitation response sent via quick action');
        }
      }
      
      // Mark notification as read after action
      const notificationService = new NotificationService();
      await notificationService.markAsRead(notification.id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('❌ Failed to handle quick action:', error);
      Alert.alert('Error', 'Failed to process action. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading notifications...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Notifications
        </ThemedText>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { borderColor: colors.tint }]}
            onPress={handleMarkAllAsRead}
          >
            <ThemedText style={[styles.markAllText, { color: colors.tint }]}>
              Mark all read
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={colors.tabIconDefault} />
          <ThemedText style={styles.emptyTitle}>No notifications</ThemedText>
          <ThemedText style={styles.emptyMessage}>
            You&apos;ll see notifications about challenges, matches, and rankings here
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.tint} />
          }
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={handleNotificationPress}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onQuickAction={handleQuickAction}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  notificationItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
  },
  notificationContent: {
    flex: 1,
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  notificationActions: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4ECDC4',
  },
  declineButton: {
    backgroundColor: '#FF6B6B',
  },
  joinButton: {
    backgroundColor: '#45B7D1',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  swipeActions: {
    flexDirection: 'row',
  },
  swipeAction: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationScreen;