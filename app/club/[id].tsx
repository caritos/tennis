import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Club } from '@/lib/supabase';
import { initializeDatabase } from '@/database/database';
import { useAuth } from '@/contexts/AuthContext';
import { TennisScoreDisplay } from '@/components/TennisScoreDisplay';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [club, setClub] = useState<Club | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [rankings, setRankings] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    loadClubDetails();
  }, [id]);

  const loadClubDetails = async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid club ID');
      setIsLoading(false);
      return;
    }

    try {
      const db = await initializeDatabase();
      
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
      if (user?.id && clubData.creator_id === user.id) {
        setIsCreator(true);
      }
      
      // Get member count and rankings
      const countResult = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM club_members WHERE club_id = ?',
        [id]
      );
      
      setMemberCount(countResult?.count || 0);
      
      // Get top 5 rankings (placeholder for now)
      // TODO: Implement actual ranking calculation based on matches
      const members = await db.getAllAsync(
        `SELECT u.id, u.full_name, cm.joined_at 
         FROM club_members cm 
         JOIN users u ON cm.user_id = u.id 
         WHERE cm.club_id = ? 
         LIMIT 5`,
        [id]
      );
      
      // Mock rankings for now
      const mockRankings = members?.map((member, index) => ({
        rank: index + 1,
        id: member.id,
        name: member.full_name,
        points: 2450 - (index * 200),
        wins: 15 - index,
        losses: 2 + index,
        winRate: Math.round((15 - index) / (17) * 100)
      })) || [];
      
      setRankings(mockRankings);
      
      // Get recent matches for this club
      const matches = await db.getAllAsync(
        `SELECT m.*, 
                p1.full_name as player1_name, 
                p2.full_name as player2_name
         FROM matches m
         LEFT JOIN users p1 ON m.player1_id = p1.id
         LEFT JOIN users p2 ON m.player2_id = p2.id
         WHERE m.club_id = ?
         ORDER BY m.date DESC, m.created_at DESC
         LIMIT 5`,
        [id]
      );
      
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
        
        return {
          ...match,
          player1_name: match.player1_name || 'Unknown Player',
          player2_name: match.player2_name || match.opponent2_name || 'Unknown Opponent',
          winner,
          processed: true
        };
      }) || [];
      
      setRecentMatches(processedMatches);
      
    } catch (err) {
      console.error('Failed to load club details:', err);
      setError('Failed to load club details');
    } finally {
      setIsLoading(false);
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
        {/* Record Match Button */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Record Match</ThemedText>
          <TouchableOpacity 
            style={[styles.recordMatchButton, { backgroundColor: colors.tint }]}
            onPress={handleRecordMatch}
          >
            <Ionicons name="add" size={20} color="white" />
            <ThemedText style={styles.recordMatchButtonText}>Record Match</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Challenges Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Challenges</ThemedText>
          <View style={[styles.placeholder, { borderColor: colors.tabIconDefault }]}>
            <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
              No active challenges
            </ThemedText>
          </View>
        </ThemedView>

        {/* Looking to Play Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Looking to Play</ThemedText>
          <View style={[styles.placeholder, { borderColor: colors.tabIconDefault }]}>
            <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
              No one is looking to play right now
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.lookingToPlayButton, { borderColor: colors.tint }]}
            onPress={() => console.log('Looking to play')}
          >
            <Ionicons name="add" size={20} color={colors.tint} />
            <ThemedText style={[styles.lookingToPlayButtonText, { color: colors.tint }]}>
              Looking to Play
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Club Rankings */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionLabel}>
              Club Rankings ({memberCount} members)
            </ThemedText>
            <TouchableOpacity>
              <ThemedText style={[styles.viewAllLink, { color: colors.tint }]}>
                View All →
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          {rankings.length > 0 ? (
            <View style={styles.rankingsList}>
              {rankings.map((player, index) => (
                <View key={player.id} style={styles.rankingItem}>
                  <View style={styles.rankingLeft}>
                    <ThemedText style={styles.rankNumber}>{player.rank}.</ThemedText>
                    <Ionicons name="person-circle-outline" size={20} color={colors.tabIconDefault} />
                    <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                  </View>
                  <View style={styles.rankingRight}>
                    {index === 0 && <ThemedText style={styles.trophy}>🏆</ThemedText>}
                    {index === 1 && <ThemedText style={styles.trophy}>🥈</ThemedText>}
                    {index === 2 && <ThemedText style={styles.trophy}>🥉</ThemedText>}
                    <ThemedText style={styles.points}>{player.points} pts</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.placeholder, { borderColor: colors.tabIconDefault }]}>
              <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
                Rankings will appear here once matches are recorded
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Recent Matches */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionLabel}>Recent Matches</ThemedText>
            {recentMatches.length > 0 && (
              <TouchableOpacity>
                <ThemedText style={[styles.viewAllLink, { color: colors.tint }]}>
                  View All →
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
          
          {recentMatches.length > 0 ? (
            <View style={styles.matchesList}>
              {recentMatches.map((match, index) => (
                <View key={match.id} style={styles.matchItem}>
                  <TennisScoreDisplay
                    player1Name={match.player1_name}
                    player2Name={match.player2_name}
                    scores={match.scores}
                    matchType={match.match_type}
                    winner={match.winner}
                    isCompleted={true}
                  />
                  <View style={styles.matchMeta}>
                    <ThemedText style={[styles.matchDate, { color: colors.tabIconDefault }]}>
                      {new Date(match.date).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.placeholder, { borderColor: colors.tabIconDefault }]}>
              <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
                No matches recorded yet
              </ThemedText>
              <ThemedText style={[styles.placeholderSubtext, { color: colors.tabIconDefault }]}>
                Be the first to record a match!
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
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  recordMatchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lookingToPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  lookingToPlayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
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
  rankingsList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    width: 20,
  },
  playerName: {
    fontSize: 16,
    marginLeft: 8,
  },
  trophy: {
    fontSize: 20,
    marginRight: 8,
  },
  points: {
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