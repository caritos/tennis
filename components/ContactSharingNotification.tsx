import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Notification } from '@/lib/supabase';
import { challengeService } from '@/services/challengeService';

interface ContactSharingNotificationProps {
  onViewAll?: () => void;
}

export function ContactSharingNotification({ onViewAll }: ContactSharingNotificationProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  console.log('📝 ContactSharingNotification: Component rendered, user:', user?.id);

  const loadContactSharingNotifications = React.useCallback(async () => {
    if (!user?.id) {
      console.log('📝 ContactSharingNotification: No user ID, skipping load');
      return;
    }

    try {
      console.log('📝 ContactSharingNotification: Loading contact sharing notifications for user:', user.id);
      
      // Get contact sharing notifications from Supabase
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'contact_sharing')
        .eq('is_read', false) // Only get unread notifications
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ ContactSharingNotification: Error loading notifications:', error);
        throw error;
      }

      console.log('📝 ContactSharingNotification: Loaded', notifications?.length || 0, 'notifications');
      
      console.log('📝 ContactSharingNotification: Filtering for contact sharing and match invitation notifications');
      const contactNotifications = (notifications || []).filter(n => {
        const isContactSharing = n.title.includes('Contact Info Shared') || n.title.includes('All 4 Players Ready');
        const isMatchInvitation = n.title.includes('Match Available') || n.title.includes('New ') && (n.title.includes('Singles') || n.title.includes('Doubles'));
        const shouldShow = isContactSharing || isMatchInvitation;
        console.log(`📝 ContactSharingNotification: Checking notification "${n.title}" - isContactSharing: ${isContactSharing}, isMatchInvitation: ${isMatchInvitation}, shouldShow: ${shouldShow}`);
        return shouldShow;
      });
      
      console.log(`📝 ContactSharingNotification: Filtered to ${contactNotifications.length} contact sharing notifications:`, contactNotifications?.map(n => ({ id: n.id, type: n.type, title: n.title })));
      
      console.log(`📝 ContactSharingNotification: Setting ${contactNotifications.length} notifications in state`);
      setNotifications(contactNotifications);
      
    } catch (error) {
      console.error('❌ ContactSharingNotification: Failed to load notifications:', error);
      setNotifications([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      console.log('📝 ContactSharingNotification: Setting up subscription for user:', user.id);
      loadContactSharingNotifications();

      // Set up real-time subscription for notification changes
      const subscription = supabase
        .channel(`contact_notifications_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 Contact notification change detected - Full payload:', JSON.stringify(payload, null, 2));
            console.log('🔔 Payload event type:', payload.eventType);
            console.log('🔔 Payload table:', payload.table);
            console.log('🔔 New record:', payload.new);
            console.log('🔔 Old record:', payload.old);
            
            // Reload notifications when they change
            console.log('🔄 Reloading contact sharing notifications due to real-time change');
            loadContactSharingNotifications();
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Contact notification subscription status:', status);
          if (err) {
            console.error('❌ Contact notification subscription error:', err);
          }
        });

      console.log('📡 Contact notification subscription created:', subscription);

      // Cleanup subscription on unmount
      return () => {
        console.log('🧹 Cleaning up contact notification subscription');
        subscription.unsubscribe();
      };
    } else {
      console.log('📝 ContactSharingNotification: No user ID, skipping subscription setup');
    }
  }, [user?.id, loadContactSharingNotifications]);


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

  const handleNotificationPress = async (notification: Notification) => {
    console.log('🔘 ContactSharingNotification: Tapped notification:', notification.id);
    
    // Mark as read
    handleMarkAsRead(notification.id);
    
    // Navigate to club matches tab where challenges appear alongside invitations
    if (notification.action_type === 'join_match' && notification.action_data) {
      // Handle match invitation notifications
      if (notification.type === 'match_invitation') {
        try {
          console.log('🔍 ContactSharingNotification: Handling match invitation notification:', notification.action_data);
          const actionData = typeof notification.action_data === 'string' ? 
            JSON.parse(notification.action_data) : notification.action_data;
          
          if (actionData?.clubId) {
            console.log('🔗 ContactSharingNotification: Navigating to club page matches tab:', actionData.clubId);
            router.push(`/club/${actionData.clubId}?tab=matches`);
          } else {
            console.log('⚠️ ContactSharingNotification: No clubId in action_data, navigating to clubs tab');
            router.push('/(tabs)');
          }
        } catch (error) {
          console.error('❌ ContactSharingNotification: Failed to parse match invitation action_data:', error);
          router.push('/(tabs)');
        }
      } else if (notification.type === 'challenge') {
        try {
          console.log('🔍 ContactSharingNotification: Getting challenge data for ID:', notification.related_id);
          const challengeData = await challengeService.getChallengeById(notification.related_id);
          console.log('🔍 ContactSharingNotification: Challenge data retrieved:', challengeData);
          
          if (challengeData?.club_id) {
            console.log('🔗 ContactSharingNotification: Navigating to club page matches tab:', challengeData.club_id);
            // Navigate to the club page with matches tab selected
            router.push(`/club/${challengeData.club_id}?tab=matches`);
          } else {
            console.log('⚠️ ContactSharingNotification: No club_id found, navigating to clubs tab');
            router.push('/(tabs)');
          }
        } catch (error) {
          console.error('❌ ContactSharingNotification: Failed to get challenge club ID:', error);
          router.push('/(tabs)');
        }
      }
    } else if (notification.action_type === 'view_match' && notification.related_id) {
      // Handle legacy challenge notifications with view_match action type
      if (notification.type === 'challenge') {
        try {
          console.log('🔍 ContactSharingNotification: Getting challenge data for ID:', notification.related_id);
          const challengeData = await challengeService.getChallengeById(notification.related_id);
          console.log('🔍 ContactSharingNotification: Challenge data retrieved:', challengeData);
          
          if (challengeData?.club_id) {
            console.log('🔗 ContactSharingNotification: Navigating to club page matches tab:', challengeData.club_id);
            router.push(`/club/${challengeData.club_id}?tab=matches`);
          } else {
            console.log('⚠️ ContactSharingNotification: No club_id found, navigating to clubs tab');
            router.push('/(tabs)');
          }
        } catch (error) {
          console.error('❌ ContactSharingNotification: Failed to get challenge club ID:', error);
          router.push('/(tabs)');
        }
      } else {
        // For other match types, navigate to clubs tab
        router.push('/(tabs)');
      }
    } else {
      console.log('⚠️ ContactSharingNotification: No action_type or related_id, navigating to clubs tab');
      router.push('/(tabs)');
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
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={() => handleNotificationPress(latestNotification)}
        >
          <Ionicons name="tennisball" size={16} color="white" style={styles.buttonIcon} />
          <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>
            View Match Details
          </ThemedText>
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  buttonIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});