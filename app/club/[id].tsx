import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Club } from '@/lib/supabase';
import { initializeDatabase } from '@/database/database';
import { useAuth } from '@/contexts/AuthContext';
import { TennisScoreDisplay } from '@/components/TennisScoreDisplay';
import { ClubRankings, RankedPlayer } from '@/components/ClubRankings';
import LookingToPlaySection from '@/components/LookingToPlaySection';
import ChallengeFlowModal from '@/components/ChallengeFlowModal';
import ClubChallenges from '@/components/ClubChallenges';
import { getClubLeaderboard } from '@/services/matchService';
import { challengeService } from '@/services/challengeService';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [club, setClub] = useState<Club | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; name: string } | null>(null);
  const [pendingChallenges, setPendingChallenges] = useState<Set<string>>(new Set());
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [hasOpenInvites, setHasOpenInvites] = useState(false);

  useEffect(() => {
    loadClubDetails();
  }, [id]);

  // Refresh data when screen comes into focus (e.g., returning from edit)
  useFocusEffect(
    useCallback(() => {
      console.log('Club details screen focused, refreshing data...');
      loadClubDetails();
    }, [id])
  );

  const loadClubDetails = async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid club ID');
      setIsLoading(false);
      return;
    }

    try {
      const db = await initializeDatabase();
      
      // Load pending challenges for the current user
      if (user?.id) {
        await loadPendingChallenges();
      }
      
      // Get club details
      const clubData = await db.getFirstAsync(
        'SELECT * FROM clubs WHERE id = ?',
        [id]
      );
      
      if (!clubData) {
        setError('Club not found');
        setIsLoading(false);
        return;
      }
      
      setClub(clubData as Club);
      
      // Check if current user is the creator
      if (user?.id && (clubData as any).creator_id === user.id) {
        setIsCreator(true);
      }
      
      // Get member count and rankings
      const countResult = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM club_members WHERE club_id = ?',
        [id]
      );
      
      setMemberCount((countResult as any)?.count || 0);
      
      // Get club rankings using the match service
      try {
        const leaderboard = await getClubLeaderboard(id);
        setRankings(leaderboard);
      } catch (error) {
        console.error('Failed to load rankings:', error);
        setRankings([]);
      }
      
      // Get recent matches for this club
      console.log('ClubDetails: Loading recent matches for club:', id);
      const matches = await db.getAllAsync(
        `SELECT m.*, 
                p1.full_name as player1_name, 
                p2.full_name as player2_name,
                p3.full_name as player3_name,
                p4.full_name as player4_name
         FROM matches m
         LEFT JOIN users p1 ON m.player1_id = p1.id
         LEFT JOIN users p2 ON m.player2_id = p2.id
         LEFT JOIN users p3 ON m.player3_id = p3.id
         LEFT JOIN users p4 ON m.player4_id = p4.id
         WHERE m.club_id = ?
         ORDER BY m.date DESC, m.created_at DESC
         LIMIT 5`,
        [id]
      );
      console.log('ClubDetails: Found matches:', matches.length, matches);
      console.log('ClubDetails: Processing matches...', matches.map((m: any) => ({ id: m.id, scores: m.scores, player1_name: m.player1_name, player2_name: m.player2_name })));
      
      // Process matches to determine winners and format for display
      const processedMatches = matches?.map((match: any) => {
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
          processed: true
        };
      }) || [];
      
      console.log('ClubDetails: Setting processed matches:', processedMatches.length, processedMatches);
      setRecentMatches(processedMatches);
      
    } catch (err) {
      console.error('Failed to load club details:', err);
      setError('Failed to load club details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingChallenges = async () => {
    if (!user?.id || !id) return;
    
    try {
      // Get all pending challenges sent by the current user in this club
      const sentChallenges = await challengeService.getUserSentChallenges(user.id);
      const pending = new Set<string>();
      
      sentChallenges.forEach(challenge => {
        if (challenge.status === 'pending' && challenge.club_id === id) {
          pending.add(challenge.challenged_id);
        }
      });
      
      setPendingChallenges(pending);
    } catch (error) {
      console.error('Failed to load pending challenges:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleRecordMatch = () => {
    // Navigate to record match with club pre-selected
    router.push({
      pathname: '/record-match',
      params: { clubId: id }
    });
  };

  const handleChallengePlayer = (playerId: string, playerName: string) => {
    setChallengeTarget({ id: playerId, name: playerName });
    setShowChallengeModal(true);
  };

  const handleChallengeSuccess = () => {
    // Refresh rankings and pending challenges
    loadClubDetails();
    loadPendingChallenges();
  };

  const handleViewAllMatches = () => {
    // Navigate to club matches page
    router.push({
      pathname: '/club/[id]/matches',
      params: { id: id as string }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading club details...</ThemedText>
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
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {club.name}
        </ThemedText>
        {isCreator ? (
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
            <ThemedText style={styles.editText}>Edit</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Action Buttons Section */}
        <ThemedView style={[styles.sectionCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={handleRecordMatch}
          >
            <Ionicons name="add" size={20} color="white" />
            <ThemedText style={styles.actionButtonText}>Record Match</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.tint, borderWidth: 1, backgroundColor: 'transparent', marginTop: 12 }]}
            onPress={() => setShowInviteForm(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.tint} />
            <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>Schedule a Match</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Active Challenges Section */}
        {user && (
          <ThemedView style={[styles.sectionCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
            <ClubChallenges 
              userId={user.id}
              clubId={id as string}
              onRefresh={() => {
                loadClubDetails();
                loadPendingChallenges();
              }}
            />
          </ThemedView>
        )}

        {/* Looking to Play Section - Only show if there are invites or form is open */}
        {(hasOpenInvites || showInviteForm) && (
          <ThemedView style={[styles.sectionCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Open Invites</ThemedText>
            </View>
            <LookingToPlaySection 
              clubId={id as string} 
              showInviteForm={showInviteForm}
              onCloseInviteForm={() => setShowInviteForm(false)}
              onInvitationsChange={setHasOpenInvites}
            />
          </ThemedView>
        )}

        {/* Club Rankings */}
        <ThemedView style={[styles.sectionCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Rankings • {memberCount} members
            </ThemedText>
            <TouchableOpacity onPress={() => {
              router.push({
                pathname: '/club/[id]/rankings',
                params: { id: id as string }
              });
            }}>
              <ThemedText style={[styles.viewAllLink, { color: colors.tint }]}>
                View All →
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ClubRankings
            rankings={rankings}
            memberCount={memberCount}
            currentUserId={user?.id}
            pendingChallenges={pendingChallenges}
            onViewAll={undefined}
            onPlayerPress={undefined}
            onChallengePress={handleChallengePlayer}
          />
        </ThemedView>

        {/* Recent Matches */}
        <ThemedView style={[styles.sectionCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
          {recentMatches.length > 0 && (
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Recent Matches</ThemedText>
              <TouchableOpacity onPress={handleViewAllMatches}>
                <ThemedText style={[styles.viewAllLink, { color: colors.tint }]}>
                  View All →
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
          
          
          {recentMatches.length > 0 ? (
            <View style={styles.matchesList}>
              {recentMatches.map((match, index) => {
                console.log('ClubDetails: Rendering match:', match.id, match.player1_name, 'vs', match.player2_name, match.scores);
                return (
                  <View key={match.id} style={styles.matchItem}>
                    <TennisScoreDisplay
                      player1Name={match.player1_name}
                      player2Name={match.player2_name}
                      scores={match.scores}
                      matchType={match.match_type}
                      winner={match.winner}
                      isCompleted={true}
                      clubName={club.name}
                      matchDate={match.date}
                      notes={match.notes}
                      matchId={match.id}
                      player1Id={match.player1_id}
                      player2Id={match.player2_id}
                      player3Id={match.player3_id}
                      player4Id={match.player4_id}
                    />
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.placeholder, { borderColor: colors.tabIconDefault }]}>
              <ThemedText style={styles.placeholderEmoji}>🎾</ThemedText>
              <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
                No matches yet • Be the first to play!
              </ThemedText>
              <ThemedText style={[styles.placeholderSubtext, { color: colors.tabIconDefault }]}>
                Record your match to start building rankings
              </ThemedText>
            </View>
          )}
        </ThemedView>
      </ScrollView>

      {/* Challenge Modal */}
      <ChallengeFlowModal
        clubId={id as string}
        targetPlayerId={challengeTarget?.id}
        targetPlayerName={challengeTarget?.name}
        isVisible={showChallengeModal}
        onClose={() => {
          setShowChallengeModal(false);
          setChallengeTarget(null);
        }}
        onSuccess={handleChallengeSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 60,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  editText: {
    fontSize: 14,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  matchesList: {
    gap: 16,
  },
  matchItem: {
    marginBottom: 8,
  },
  matchMeta: {
    paddingTop: 8,
    alignItems: 'center',
  },
  matchDate: {
    fontSize: 12,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
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
});