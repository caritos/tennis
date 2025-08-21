import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Club } from '@/lib/supabase';
import { initializeDatabase } from '@/database/database';
import { useAuth } from '@/contexts/AuthContext';
import { RankedPlayer } from '@/components/ClubRankings';
import ChallengeFlowModal from '@/components/ChallengeFlowModal';
import ClubOverview from '@/components/club/ClubOverview';
import ClubMembers from '@/components/club/ClubMembers';
import ClubMatches from '@/components/club/ClubMatches';
import LookingToPlaySection from '@/components/LookingToPlaySection';
import { getClubLeaderboard } from '@/services/matchService';
import { challengeService } from '@/services/challengeService';

type TabType = 'overview' | 'members' | 'matches';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [club, setClub] = useState<Club | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; name: string } | null>(null);
  const [pendingChallenges, setPendingChallenges] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [unreadChallengeCount, setUnreadChallengeCount] = useState(0);
  const [memberSortBy, setMemberSortBy] = useState<'name' | 'wins' | 'matches' | 'joined' | 'ranking'>('name');
  const [memberFilterBy, setMemberFilterBy] = useState<'all' | 'active' | 'new'>('all');
  const [matchFilterType, setMatchFilterType] = useState<'all' | 'singles' | 'doubles'>('all');
  const [matchFilterDate, setMatchFilterDate] = useState<'all' | 'week' | 'month'>('all');

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
        await loadChallengeCount();
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
                p4.full_name as player4_name,
                m.opponent2_name,
                m.partner3_name,
                m.partner4_name
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
            player1DisplayName = `${player1DisplayName} & ${match.player3_name || match.partner3_name || 'Unknown Partner'}`;
          }
          if (match.player4_name || match.partner4_name) {
            player2DisplayName = `${player2DisplayName} & ${match.player4_name || match.partner4_name || 'Unknown Partner'}`;
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
      
      // Load all matches for the matches tab
      const allMatchesData = await db.getAllAsync(
        `SELECT m.*, 
                p1.full_name as player1_name, 
                p2.full_name as player2_name,
                p3.full_name as player3_name,
                p4.full_name as player4_name,
                m.opponent2_name,
                m.partner3_name,
                m.partner4_name
         FROM matches m
         LEFT JOIN users p1 ON m.player1_id = p1.id
         LEFT JOIN users p2 ON m.player2_id = p2.id
         LEFT JOIN users p3 ON m.player3_id = p3.id
         LEFT JOIN users p4 ON m.player4_id = p4.id
         WHERE m.club_id = ?
         ORDER BY m.date DESC, m.created_at DESC`,
        [id]
      );
      
      // Process all matches using the same logic
      const processedAllMatches = allMatchesData?.map((match: any) => {
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
            player1DisplayName = `${player1DisplayName} & ${match.player3_name || match.partner3_name || 'Unknown Partner'}`;
          }
          if (match.player4_name || match.partner4_name) {
            player2DisplayName = `${player2DisplayName} & ${match.player4_name || match.partner4_name || 'Unknown Partner'}`;
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
      
      setAllMatches(processedAllMatches);
      
      // Load club members
      const members = await db.getAllAsync(
        `SELECT u.*, cm.joined_at,
                COALESCE(
                  (SELECT COUNT(*) FROM matches 
                   WHERE (player1_id = u.id OR player2_id = u.id OR player3_id = u.id OR player4_id = u.id) 
                   AND club_id = ?), 0
                ) as match_count,
                COALESCE(
                  (SELECT COUNT(*) FROM matches 
                   WHERE ((player1_id = u.id AND scores LIKE '%won%') OR (player2_id = u.id AND scores NOT LIKE '%won%'))
                   AND club_id = ?), 0
                ) as wins
         FROM users u
         INNER JOIN club_members cm ON u.id = cm.user_id
         WHERE cm.club_id = ?
         ORDER BY cm.joined_at DESC`,
        [id, id, id]
      );
      
      setClubMembers(members || []);
      
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

  const loadChallengeCount = async () => {
    if (!user?.id || !id) return;
    
    try {
      // Get received challenges count for badge
      const received = await challengeService.getUserReceivedChallenges(user.id);
      const unreadCount = received.filter(challenge => 
        challenge.status === 'pending' && challenge.club_id === id
      ).length;
      
      setUnreadChallengeCount(unreadCount);
    } catch (error) {
      console.error('Failed to load challenge count:', error);
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
    loadChallengeCount();
  };

  const handleViewAllMatches = () => {
    // Switch to matches tab
    setActiveTab('matches');
  };

  const handleClaimMatch = async (matchId: string, playerPosition: 'player2' | 'player3' | 'player4') => {
    if (!user?.id) return;
    
    try {
      const db = await initializeDatabase();
      
      // Update the match to replace the unregistered player name with the current user's ID
      const updateColumn = playerPosition + '_id';
      const nameColumn = playerPosition === 'player2' ? 'opponent2_name' : 
                         playerPosition === 'player3' ? 'partner3_name' : 'partner4_name';
      
      await db.runAsync(
        `UPDATE matches 
         SET ${updateColumn} = ?, ${nameColumn} = NULL 
         WHERE id = ?`,
        [user.id, matchId]
      );
      
      // Reload matches to reflect the change
      loadClubDetails();
      
      // Show success message (you might want to add a toast/alert here)
      console.log('Match claimed successfully');
    } catch (error) {
      console.error('Failed to claim match:', error);
    }
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

      {/* Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.tabIconDefault + '30' }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'overview' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <View style={styles.tabContent}>
            <ThemedText style={[styles.tabText, activeTab === 'overview' && { color: colors.tint }]}>
              Overview
            </ThemedText>
            {unreadChallengeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#FF6B6B' }]}>
                <ThemedText style={styles.badgeText}>{unreadChallengeCount}</ThemedText>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'members' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('members')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'members' && { color: colors.tint }]}>
            Members ({memberCount})
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'matches' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('matches')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'matches' && { color: colors.tint }]}>
            Matches
          </ThemedText>
        </TouchableOpacity>
      </View>

      <>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <ClubOverview
            club={club!}
            memberCount={memberCount}
            rankings={rankings}
            recentMatches={recentMatches}
            colors={colors}
            user={user}
            pendingChallenges={pendingChallenges}
            onChallengePress={(target) => handleChallengePlayer(target.id, target.name)}
            onViewAllMatches={() => setActiveTab('matches')}
            onViewAllMembers={() => setActiveTab('members')}
            onRecordMatch={handleRecordMatch}
            onInvitePlayers={() => setShowInviteForm(true)}
          />
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <ClubMembers
            members={clubMembers}
            colors={colors}
            user={user}
            pendingChallenges={pendingChallenges}
            sortBy={memberSortBy}
            filterBy={memberFilterBy}
            onSortChange={setMemberSortBy}
            onFilterChange={setMemberFilterBy}
            onChallengePress={(target) => handleChallengePlayer(target.id, target.name)}
          />
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <ClubMatches
            matches={allMatches}
            club={club}
            colors={colors}
            filterType={matchFilterType}
            filterDate={matchFilterDate}
            onFilterTypeChange={setMatchFilterType}
            onFilterDateChange={setMatchFilterDate}
            onClaimMatch={handleClaimMatch}
            onRecordMatch={handleRecordMatch}
          />
        )}
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

        {/* Match Invitation Modal */}
        <Modal
          visible={showInviteForm}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <LookingToPlaySection
            clubId={id as string}
            showInviteForm={showInviteForm}
            onCloseInviteForm={() => setShowInviteForm(false)}
          />
        </Modal>
      </>
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
    marginBottom: 6,
  },
  matchItemBorder: {
    borderBottomWidth: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchMeta: {
    paddingTop: 8,
    alignItems: 'center',
  },
  matchDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchType: {
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberItemBorder: {
    borderBottomWidth: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  memberStats: {
    fontSize: 13,
    marginBottom: 2,
  },
  memberJoined: {
    fontSize: 12,
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
    marginLeft: 12,
  },
  challengeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsTextContainer: {
    gap: 12,
    paddingVertical: 4,
  },
  statSentence: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'left',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionHelper: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  recentMatchNews: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    opacity: 0.9,
  },
  controlsContainer: {
    marginBottom: 16,
    gap: 12,
  },
  controlGroup: {
    gap: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    minHeight: 36,
  },
  segmentButtonText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  enhancedMemberItem: {
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  memberNameContainer: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  enhancedMemberName: {
    fontSize: 18,
    fontWeight: '600',
  },
  memberBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  enhancedChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  enhancedChallengeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  memberStatsContainer: {
    gap: 8,
  },
  statGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  statLabelSmall: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
  progressBarContainer: {
    marginHorizontal: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  memberJoinedDate: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  memberJoinedDateInline: {
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 8,
  },
});