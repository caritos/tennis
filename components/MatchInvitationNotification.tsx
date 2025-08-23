import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ClubNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  created_at: string;
}

interface MatchInvitationNotificationProps {
  clubId: string;
  onViewDetails?: () => void;
}

export function MatchInvitationNotification({ 
  clubId,
  onViewDetails
}: MatchInvitationNotificationProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [latestNotification, setLatestNotification] = useState<ClubNotification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Key for storing dismissed notifications in AsyncStorage
  const DISMISSED_NOTIFICATIONS_KEY = 'dismissedNotifications';

  // Load dismissed notification IDs from storage
  const loadDismissedNotifications = async (): Promise<Set<string>> => {
    try {
      const dismissed = await AsyncStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
      return dismissed ? new Set(JSON.parse(dismissed)) : new Set();
    } catch (error) {
      console.error('Failed to load dismissed notifications:', error);
      return new Set();
    }
  };

  // Save dismissed notification IDs to storage
  const saveDismissedNotification = async (notificationId: string) => {
    try {
      const dismissed = await loadDismissedNotifications();
      dismissed.add(notificationId);
      await AsyncStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify([...dismissed]));
    } catch (error) {
      console.error('Failed to save dismissed notification:', error);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadLatestInvitationNotification();
    }
  }, [clubId]);

  const loadLatestInvitationNotification = async () => {
    try {
      setIsLoading(true);
      
      // Load dismissed notifications from storage
      const dismissedNotifications = await loadDismissedNotifications();
      
      // Get the latest invitation notification for this club
      const { data: notifications, error } = await supabase
        .from('club_notifications')
        .select('*')
        .eq('club_id', clubId)
        .eq('type', 'invitation_created')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Only show notifications from the last 24 hours
        .order('created_at', { ascending: false })
        .limit(5); // Get more notifications to filter out dismissed ones

      if (error) {
        console.error('Failed to load invitation notifications:', error);
        return;
      }

      if (notifications && notifications.length > 0) {
        // Find the first notification that hasn't been dismissed
        const undismissedNotification = notifications.find(n => !dismissedNotifications.has(n.id));
        
        if (undismissedNotification) {
          setLatestNotification({
            ...undismissedNotification,
            data: typeof undismissedNotification.data === 'string' 
              ? JSON.parse(undismissedNotification.data) 
              : undismissedNotification.data
          });
        } else {
          setLatestNotification(null);
        }
      } else {
        setLatestNotification(null);
      }
    } catch (error) {
      console.error('Error loading invitation notifications:', error);
      setLatestNotification(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!latestNotification) return;

    try {
      // Mark notification as dismissed in local storage
      await saveDismissedNotification(latestNotification.id);
      setLatestNotification(null);
      
      console.log('✅ Notification dismissed:', latestNotification.id);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleViewDetails = () => {
    onViewDetails?.();
    handleDismiss(); // Auto-dismiss when user views details
  };

  if (isLoading || !latestNotification) {
    return null;
  }

  const timeSince = new Date(latestNotification.created_at);
  const timeAgo = getTimeAgo(timeSince);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="tennisball" 
              size={16} 
              color={colors.tint}
              style={styles.icon}
            />
          </View>
          
          <View style={styles.textContainer}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {latestNotification.title}
            </ThemedText>
            <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
              {latestNotification.message}
            </ThemedText>
            <ThemedText style={[styles.timeAgo, { color: colors.tabIconDefault }]}>
              {timeAgo}
            </ThemedText>
          </View>
          
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            accessibilityLabel="Dismiss notification"
          >
            <Ionicons name="close" size={16} color={colors.tabIconDefault} />
          </TouchableOpacity>
        </View>
        
        {onViewDetails && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.tint }]}
            onPress={handleViewDetails}
          >
            <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>
              View Matches
            </ThemedText>
            <Ionicons name="arrow-forward" size={14} color={colors.tint} />
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    // Icon styling handled by container
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeAgo: {
    fontSize: 12,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
    marginTop: -4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});