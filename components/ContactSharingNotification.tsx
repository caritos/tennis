import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ContactSharingNotificationProps {
  onViewAll?: () => void;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  is_read: boolean;
  action_type?: string;
  action_data?: any;
  related_id?: string;
  created_at: string;
  expires_at?: string;
}

export function ContactSharingNotification({ onViewAll }: ContactSharingNotificationProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  console.log('📝 ContactSharingNotification: Component rendered, user:', user?.id);

  useEffect(() => {
    if (user?.id) {
      loadContactSharingNotifications();
    }
  }, [user?.id]);

  const loadContactSharingNotifications = async () => {
    if (!user?.id) {
      console.log('📝 ContactSharingNotification: No user ID, skipping load');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`📝 ContactSharingNotification: Loading notifications for user ${user.id}`);
      
      // Get contact sharing notifications from Supabase
      const { data: allNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .eq('type', 'challenge')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ ContactSharingNotification: Failed to load notifications:', error);
        return;
      }
      
      console.log(`📝 ContactSharingNotification: Found ${allNotifications?.length || 0} challenge notifications:`, allNotifications);
      
      // Filter for contact sharing notifications (titles contain specific text)
      const contactNotifications = (allNotifications || []).filter(n => 
        n.title.includes('Contact Info Shared') || n.title.includes('All 4 Players Ready')
      );
      
      console.log(`📝 ContactSharingNotification: Filtered to ${contactNotifications.length} contact sharing notifications:`, contactNotifications);
      
      setNotifications(contactNotifications);
    } catch (error) {
      console.error('❌ ContactSharingNotification: Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Mark notification as read in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
        
      if (error) {
        console.error('Failed to mark notification as read:', error);
        return;
      }
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (isLoading) {
    console.log('📝 ContactSharingNotification: Still loading...');
    return null;
  }

  if (notifications.length === 0) {
    console.log('📝 ContactSharingNotification: No notifications to display');
    return null;
  }

  console.log('📝 ContactSharingNotification: Rendering notification banner with', notifications.length, 'notifications');

  const latestNotification = notifications[0];

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={20} color={colors.tint} />
        </View>
        <View style={styles.content}>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            {latestNotification.title}
          </ThemedText>
          {latestNotification.message && (
            <ThemedText style={[styles.message, { color: colors.textSecondary }]} numberOfLines={3}>
              {latestNotification.message}
            </ThemedText>
          )}
          {notifications.length > 1 && (
            <ThemedText style={[styles.count, { color: colors.tint }]}>
              +{notifications.length - 1} more contact sharing notification{notifications.length > 2 ? 's' : ''}
            </ThemedText>
          )}
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => handleMarkAsRead(latestNotification.id)}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {onViewAll && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <ThemedText style={[styles.viewAllText, { color: colors.tint }]}>
            View Contact Details
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  count: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
});