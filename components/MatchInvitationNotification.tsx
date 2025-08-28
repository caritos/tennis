import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to create readable match IDs for easy identification
const getReadableMatchId = (matchId: string): string => {
  // Take first 6 characters after any dashes and format as "M-ABC123"
  const cleanId = matchId.replace(/-/g, '').toUpperCase().slice(0, 6);
  return `M-${cleanId}`;
};

interface ActiveInvitation {
  id: string;
  match_type: 'singles' | 'doubles';
  date: string;
  time?: string;
  location?: string;
  creator_name?: string;
  created_at: string;
  responses_count: number;
}

interface MatchInvitationNotificationProps {
  clubId: string;
  onViewDetails?: (matchId?: string) => void;
}

export function MatchInvitationNotification({ 
  clubId,
  onViewDetails
}: MatchInvitationNotificationProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [activeInvitations, setActiveInvitations] = useState<ActiveInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Key for storing dismissed notifications in AsyncStorage
  const DISMISSED_NOTIFICATIONS_KEY = 'dismissedInvitations';

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
      loadInvitationNotifications();
    }
  }, [clubId]);

  const loadInvitationNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Load dismissed notifications from storage
      const dismissedNotifications = await loadDismissedNotifications();
      
      // Get active match invitations for this club directly from match_invitations table
      const { data: invitations, error } = await supabase
        .from('match_invitations')
        .select(`
          *,
          creator:users!creator_id(full_name),
          responses:invitation_responses(id)
        `)
        .eq('club_id', clubId)
        .eq('status', 'active')
        .gte('date', new Date().toISOString().split('T')[0]) // Only future or today's invitations
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Failed to load active invitations:', error);
        return;
      }

      if (invitations && invitations.length > 0) {
        // Filter out dismissed invitations and format the data
        const activeInvites = invitations
          .filter(inv => !dismissedNotifications.has(inv.id))
          .map(inv => ({
            id: inv.id,
            match_type: inv.match_type,
            date: inv.date,
            time: inv.time,
            location: inv.location,
            creator_name: inv.creator?.full_name || 'A club member',
            created_at: inv.created_at,
            responses_count: inv.responses?.length || 0
          }));
        
        setActiveInvitations(activeInvites);
      } else {
        setActiveInvitations([]);
      }
    } catch (error) {
      console.error('Error loading invitation notifications:', error);
      setActiveInvitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async (invitationId: string) => {
    try {
      // Mark invitation as dismissed in local storage
      await saveDismissedNotification(invitationId);
      
      // Remove the invitation from the current list
      setActiveInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      console.log('✅ Invitation notification dismissed:', invitationId);
    } catch (error) {
      console.error('Failed to dismiss invitation notification:', error);
    }
  };

  const handleViewDetails = () => {
    onViewDetails?.();
    // Don't auto-dismiss notifications when viewing details
    // User should manually dismiss notifications they want to clear
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (isLoading || activeInvitations.length === 0) {
    return null;
  }

  return (
    <>
      {activeInvitations.map((invitation) => {
        const timeSince = new Date(invitation.created_at);
        const timeAgo = getTimeAgo(timeSince);
        const dateStr = formatDate(invitation.date);

        return (
          <ThemedView 
            key={invitation.id} 
            style={[styles.container, { backgroundColor: colors.card }]}
          >
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
                    New {invitation.match_type} invitation
                  </ThemedText>
                  <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
                    {invitation.creator_name} is looking for {invitation.match_type === 'singles' ? 'a singles partner' : 'players for a doubles match'} on {dateStr} ({getReadableMatchId(invitation.id)})
                  </ThemedText>
                  <ThemedText style={[styles.timeAgo, { color: colors.tabIconDefault }]}>
                    {timeAgo}
                  </ThemedText>
                </View>
                
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => handleDismiss(invitation.id)}
                  accessibilityLabel="Dismiss notification"
                >
                  <Ionicons name="close" size={16} color={colors.tabIconDefault} />
                </TouchableOpacity>
              </View>
              
              {onViewDetails && (
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.tint }]}
                  onPress={() => {
                    console.log('🎯 MatchInvitationNotification: View Detail button pressed for invitation:', invitation.id);
                    onViewDetails?.(invitation.id);
                  }}
                >
                  <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>
                    View Match {getReadableMatchId(invitation.id)}
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={14} color={colors.tint} />
                </TouchableOpacity>
              )}
            </View>
          </ThemedView>
        );
      })}
    </>
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