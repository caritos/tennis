import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { matchInvitationService, MatchInvitation } from '@/services/matchInvitationService';
import { supabase } from '@/lib/supabase';

interface UpcomingMatchesNotificationProps {
  clubId: string;
  userId?: string;
  onViewDetails?: (matchId?: string) => void;
}

interface ConfirmedPlayer {
  id: string;
  name: string;
  phone?: string;
  isOrganizer?: boolean;
}

interface UpcomingMatch {
  invitation: MatchInvitation;
  confirmedPlayers: ConfirmedPlayer[];
}

export const UpcomingMatchesNotification: React.FC<UpcomingMatchesNotificationProps> = ({
  clubId,
  userId,
  onViewDetails
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUpcomingMatches();
    }
  }, [clubId, userId]);

  const loadUpcomingMatches = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Get all matched invitations where user is the creator
      const { data: matchedInvitations, error } = await supabase
        .from('match_invitations')
        .select(`
          *,
          creator:users!match_invitations_creator_id_fkey(id, full_name, phone),
          responses:invitation_responses(
            *,
            user:users!invitation_responses_user_id_fkey(id, full_name, phone)
          )
        `)
        .eq('club_id', clubId)
        .eq('status', 'matched')
        .eq('creator_id', userId)
        .order('date', { ascending: true });

      // Also get invitations where user has responded
      const { data: respondedInvitations, error: respondedError } = await supabase
        .from('match_invitations')
        .select(`
          *,
          creator:users!match_invitations_creator_id_fkey(id, full_name, phone),
          responses:invitation_responses(
            *,
            user:users!invitation_responses_user_id_fkey(id, full_name, phone)
          )
        `)
        .eq('club_id', clubId)
        .eq('status', 'matched')
        .neq('creator_id', userId)
        .order('date', { ascending: true });

      if (error || respondedError) {
        console.error('❌ Failed to load upcoming matches:', error || respondedError);
        return;
      }

      // Filter responded invitations to only those where the user has confirmed
      const userRespondedInvitations = (respondedInvitations || []).filter((invitation: any) => {
        return invitation.responses && invitation.responses.some((response: any) => 
          response.user_id === userId && response.status === 'confirmed'
        );
      });

      // Combine both sets of invitations
      const allMatchedInvitations = [...(matchedInvitations || []), ...userRespondedInvitations];

      // Process the matched invitations to get confirmed players
      const matches: UpcomingMatch[] = allMatchedInvitations.map((invitation: any) => {
        const confirmedPlayers: ConfirmedPlayer[] = [];
        
        // Add creator
        if (invitation.creator) {
          confirmedPlayers.push({
            id: invitation.creator.id,
            name: invitation.creator.full_name,
            phone: invitation.creator.phone,
            isOrganizer: true
          });
        }
        
        // Add confirmed respondents
        if (invitation.responses) {
          invitation.responses
            .filter((r: any) => r.status === 'confirmed')
            .forEach((response: any) => {
              if (response.user) {
                confirmedPlayers.push({
                  id: response.user.id,
                  name: response.user.full_name,
                  phone: response.user.phone,
                  isOrganizer: false
                });
              }
            });
        }

        return {
          invitation,
          confirmedPlayers
        };
      });

      setUpcomingMatches(matches);
    } catch (error) {
      console.error('❌ Failed to load upcoming matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallPlayer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  if (isLoading || upcomingMatches.length === 0) {
    return null;
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={20} color={colors.tint} />
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Upcoming Matches
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.tint }]}>
          <ThemedText style={styles.badgeText}>
            {upcomingMatches.length}
          </ThemedText>
        </View>
      </View>

      {upcomingMatches.slice(0, 2).map((match, index) => (
        <View key={match.invitation.id} style={[styles.matchItem, { borderColor: colors.tabIconDefault }]}>
          <View style={styles.matchHeader}>
            <View>
              <ThemedText style={[styles.matchDate, { color: colors.text }]}>
                {formatMatchDate(match.invitation.date)}
                {match.invitation.time && ` • ${match.invitation.time}`}
              </ThemedText>
              <ThemedText style={[styles.matchType, { color: colors.textSecondary }]}>
                {match.invitation.match_type} • {match.confirmedPlayers.length} players
              </ThemedText>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <ThemedText style={[styles.contactLabel, { color: colors.textSecondary }]}>
              📱 Contact players to coordinate:
            </ThemedText>
            <View style={styles.playersList}>
              {match.confirmedPlayers.map((player) => (
                <View key={player.id} style={styles.playerContact}>
                  <View style={styles.playerInfo}>
                    <ThemedText style={[styles.playerName, { color: colors.text }]}>
                      {player.name}
                      {player.isOrganizer && (
                        <ThemedText style={[styles.organizerLabel, { color: colors.tint }]}>
                          {' '}(Organizer)
                        </ThemedText>
                      )}
                    </ThemedText>
                    {player.phone && (
                      <ThemedText style={[styles.playerPhone, { color: colors.textSecondary }]}>
                        {player.phone}
                      </ThemedText>
                    )}
                  </View>
                  {player.phone && player.id !== userId && (
                    <TouchableOpacity
                      style={[styles.callButton, { borderColor: colors.tint }]}
                      onPress={() => handleCallPlayer(player.phone!)}
                    >
                      <Ionicons name="call-outline" size={16} color={colors.tint} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}

      {upcomingMatches.length > 2 && (
        <ThemedText style={[styles.moreText, { color: colors.textSecondary }]}>
          +{upcomingMatches.length - 2} more upcoming matches
        </ThemedText>
      )}

      <TouchableOpacity
        style={[styles.viewDetailsButton, { borderColor: colors.tint }]}
        onPress={onViewDetails}
      >
        <ThemedText style={[styles.viewDetailsText, { color: colors.tint }]}>
          View All Match Details
        </ThemedText>
        <Ionicons name="chevron-forward" size={16} color={colors.tint} />
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  matchItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  matchHeader: {
    marginBottom: 12,
  },
  matchDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchType: {
    fontSize: 12,
    marginTop: 2,
  },
  contactSection: {
    marginTop: 8,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  playersList: {
    gap: 8,
  },
  playerContact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  organizerLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  playerPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  callButton: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 6,
    marginLeft: 8,
  },
  moreText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
});