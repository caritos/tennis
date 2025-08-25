import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Club, supabase } from '@/lib/supabase';
import { matchInvitationService, MatchInvitation } from '@/services/matchInvitationService';
import { getClubMatches } from '@/services/matchService';
import { TennisScoreDisplay } from '@/components/TennisScoreDisplay';

export default function ClubMatchesScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [club, setClub] = useState<Club | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<MatchInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClubMatches();
  }, [id]);

  const loadClubMatches = async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid club ID');
      setIsLoading(false);
      return;
    }

    try {
      // Get club details from Supabase
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clubError || !clubData) {
        setError('Club not found');
        setIsLoading(false);
        return;
      }
      
      setClub(clubData as Club);
      
      // Load completed matches
      console.log('ClubMatches: Loading completed matches for club:', id);
      const completedMatches = await getClubMatches(id);
      
      // Process matches to determine winners and format for display
      const processedMatches = completedMatches?.map((match: any) => {
        if (!match.scores) {
          return {
            ...match,
            player1_name: match.player1_name || 'Unknown Player',
            player2_name: match.player2_name || match.opponent2_name || 'Unknown Opponent',
            winner: null,
            processed: true,
            type: 'completed'
          };
        }

        // Simple winner determination based on sets won
        const sets = match.scores.split(',');
        let player1Sets = 0;
        let player2Sets = 0;
        
        sets.forEach((set: string) => {
          const scores = set.replace(/\([^)]*\)/g, '').split('-'); // Remove tiebreak notation
          const p1Score = parseInt(scores[0]);
          const p2Score = parseInt(scores[1]);
          
          if (p1Score > p2Score) {
            player1Sets++;
          } else {
            player2Sets++;
          }
        });
        
        const winner = player1Sets > player2Sets ? 1 : 2;
        
        // Format player names for doubles
        let player1DisplayName = match.player1_name || 'Unknown Player';
        let player2DisplayName = match.player2_name || match.opponent2_name || 'Unknown Opponent';
        
        if (match.match_type === 'doubles') {
          // For doubles, combine player names
          if (match.player3_name || match.partner3_name) {
            player1DisplayName = `${player1DisplayName} & ${match.player3_name || match.partner3_name}`;
          }
          if (match.player4_name || match.partner4_name) {
            player2DisplayName = `${player2DisplayName} & ${match.player4_name || match.partner4_name}`;
          }
        }
        
        return {
          ...match,
          player1_name: player1DisplayName,
          player2_name: player2DisplayName,
          winner,
          processed: true,
          type: 'completed'
        };
      }) || [];
      
      // Load pending invitations
      console.log('ClubMatches: Loading pending invitations for club:', id);
      const pendingInvitations = await matchInvitationService.getClubInvitations(id);
      console.log('ClubMatches: Found pending invitations:', pendingInvitations.length, pendingInvitations);
      
      // Process invitations for display
      const processedInvitations = pendingInvitations.map((invitation: MatchInvitation) => ({
        id: invitation.id,
        date: invitation.date,
        time: invitation.time,
        location: invitation.location,
        notes: invitation.notes,
        match_type: invitation.match_type,
        creator_name: invitation.creator_name,
        status: invitation.status,
        created_at: invitation.created_at,
        type: 'invitation',
        processed: true
      }));
      
      // Combine and sort by date (newest first)
      const allItems = [...processedMatches, ...processedInvitations].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('ClubMatches: Setting all items:', allItems.length, allItems);
      setMatches(allItems);
      setInvitations(pendingInvitations);
      
    } catch (err) {
      console.error('Failed to load club matches:', err);
      setError('Failed to load club matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading matches...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !club) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error || 'Club not found'}</ThemedText>
          <TouchableOpacity onPress={handleBack} style={[styles.button, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>All Matches</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionLabel}>
              Matches & Invitations
            </ThemedText>
            <ThemedText style={[styles.matchCount, { color: colors.tabIconDefault }]}>
              {matches.length} {matches.length === 1 ? 'item' : 'items'}
            </ThemedText>
          </View>
          
          {matches.length > 0 ? (
            <View style={styles.matchesList}>
              {matches.map((item, index) => (
                <View key={item.id} style={styles.matchItem}>
                  {item.type === 'invitation' ? (
                    <View style={[styles.invitationCard, { backgroundColor: colors.card, borderColor: colors.tint }]}>
                      <View style={styles.invitationHeader}>
                        <View style={styles.invitationTypeContainer}>
                          <Ionicons 
                            name="tennisball" 
                            size={16} 
                            color={colors.tint} 
                            style={styles.invitationIcon}
                          />
                          <ThemedText style={[styles.invitationType, { color: colors.tint }]}>
                            Looking for {item.match_type} partner
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.invitationStatus, { color: colors.tabIconDefault }]}>
                          {item.status === 'active' ? 'Open' : item.status}
                        </ThemedText>
                      </View>
                      
                      <View style={styles.invitationDetails}>
                        <ThemedText style={styles.invitationCreator}>
                          {item.creator_name || 'Unknown Player'}
                        </ThemedText>
                        
                        <View style={styles.invitationMeta}>
                          <View style={styles.invitationMetaItem}>
                            <Ionicons name="calendar-outline" size={14} color={colors.tabIconDefault} />
                            <ThemedText style={[styles.invitationMetaText, { color: colors.tabIconDefault }]}>
                              {new Date(item.date).toLocaleDateString()}
                            </ThemedText>
                          </View>
                          
                          {item.time && (
                            <View style={styles.invitationMetaItem}>
                              <Ionicons name="time-outline" size={14} color={colors.tabIconDefault} />
                              <ThemedText style={[styles.invitationMetaText, { color: colors.tabIconDefault }]}>
                                {item.time}
                              </ThemedText>
                            </View>
                          )}
                          
                          {item.location && (
                            <View style={styles.invitationMetaItem}>
                              <Ionicons name="location-outline" size={14} color={colors.tabIconDefault} />
                              <ThemedText style={[styles.invitationMetaText, { color: colors.tabIconDefault }]}>
                                {item.location}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                        
                        {item.notes && (
                          <ThemedText style={[styles.invitationNotes, { color: colors.tabIconDefault }]}>
                            &quot;{item.notes}&quot;
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  ) : (
                    <TennisScoreDisplay
                      player1Name={item.player1_name}
                      player2Name={item.player2_name}
                      scores={item.scores}
                      matchType={item.match_type}
                      winner={item.winner}
                      isCompleted={true}
                      clubName={club.name}
                      matchDate={item.date}
                      notes={item.notes}
                      matchId={item.id}
                      player1Id={item.player1_id}
                      player2Id={item.player2_id}
                      player3Id={item.player3_id}
                      player4Id={item.player4_id}
                    />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.placeholder, { borderColor: colors.tabIconDefault }]}>
              <Ionicons name="tennisball" size={48} color={colors.tabIconDefault} />
              <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
                No matches recorded yet
              </ThemedText>
              <ThemedText style={[styles.placeholderSubtext, { color: colors.tabIconDefault }]}>
                Be the first to record a match at this club!
              </ThemedText>
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60, // Same width as back button for centering
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  matchCount: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 0,
    minWidth: 80,
    textAlign: 'right',
  },
  matchesList: {
    gap: 16,
  },
  matchItem: {
    marginBottom: 8,
  },
  placeholder: {
    padding: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  invitationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invitationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invitationIcon: {
    marginRight: 6,
  },
  invitationType: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  invitationStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invitationDetails: {
    gap: 8,
  },
  invitationCreator: {
    fontSize: 16,
    fontWeight: '700',
  },
  invitationMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  invitationMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invitationMetaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  invitationNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});