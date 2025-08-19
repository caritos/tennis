import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
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
import ChallengeFlowModal from '@/components/ChallengeFlowModal';
import ClubChallenges from '@/components/ClubChallenges';
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
          <>
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

        {/* Playing Opportunities Section */}
        {user && (
          <ThemedView style={[styles.sectionCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
            <View style={styles.sectionHeaderWithIcon}>
              <ThemedText style={styles.sectionIcon}>🎾</ThemedText>
              <View style={styles.sectionTitleContainer}>
                <ThemedText style={styles.sectionTitle}>Playing Opportunities</ThemedText>
                <ThemedText style={[styles.sectionHelper, { color: colors.tabIconDefault }]}>
                  Challenges you&apos;ve received and sent
                </ThemedText>
              </View>
            </View>
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

            {/* Club Stats Section - Moved to bottom */}
            <ThemedView style={[styles.sectionCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
              <View style={styles.statsTextContainer}>
                <ThemedText style={[styles.statSentence, { color: colors.text }]}>
                  The club has {memberCount} total members.
                </ThemedText>
                
                <ThemedText style={[styles.statSentence, { color: colors.text }]}>
                  {rankings.length > 0 
                    ? `${rankings[0].playerName.split(' ')[0]} is the top player of the club.`
                    : 'No rankings available yet.'
                  }
                </ThemedText>
                
                {recentMatches.length > 0 ? (
                  <ThemedText style={[styles.statSentence, { color: colors.text }]}>
                    {(() => {
                      const match = recentMatches[0];
                      const winner = match.winner === 1 ? match.player1_name : match.player2_name;
                      const loser = match.winner === 1 ? match.player2_name : match.player1_name;
                      const matchDate = new Date(match.date).toLocaleDateString();
                      
                      // Format scores properly
                      let formattedScores = match.scores;
                      // Check if scores are in JSON format
                      if (formattedScores.includes('{') && formattedScores.includes('}')) {
                        try {
                          const scoresArray = JSON.parse(formattedScores);
                          formattedScores = scoresArray.map((set: any) => `${set.player}-${set.opponent}`).join(', ');
                        } catch (e) {
                          // If parsing fails, use the original scores
                        }
                      }
                      
                      return `${winner} beat ${loser} ${formattedScores} on ${matchDate}.`;
                    })()}
                  </ThemedText>
                ) : (
                  <ThemedText style={[styles.statSentence, { color: colors.tabIconDefault }]}>
                    No recent matches to display.
                  </ThemedText>
                )}
              </View>
            </ThemedView>
        </>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <>
            <ThemedView style={[styles.sectionCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
              {/* Filtering and Sorting Controls */}
              <View style={styles.controlsContainer}>
                <View style={styles.controlGroup}>
                  <ThemedText style={[styles.controlLabel, { color: colors.tabIconDefault }]}>Sort by:</ThemedText>
                  <View style={styles.segmentedControl}>
                    {[
                      { key: 'name', label: 'Name' },
                      { key: 'ranking', label: 'Rank' },
                      { key: 'wins', label: 'Wins' },
                      { key: 'matches', label: 'Games' },
                      { key: 'joined', label: 'Joined' }
                    ].map((option, index) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.segmentButton,
                          memberSortBy === option.key && { backgroundColor: colors.tint },
                          index === 4 && { borderRightWidth: 0 }
                        ]}
                        onPress={() => setMemberSortBy(option.key as any)}
                      >
                        <ThemedText style={[
                          styles.segmentButtonText,
                          { color: memberSortBy === option.key ? 'white' : colors.text }
                        ]}>
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.controlGroup}>
                  <ThemedText style={[styles.controlLabel, { color: colors.tabIconDefault }]}>Filter:</ThemedText>
                  <View style={styles.segmentedControl}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'active', label: 'Active' },
                      { key: 'new', label: 'New' }
                    ].map((option, index) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.segmentButton,
                          memberFilterBy === option.key && { backgroundColor: colors.tint },
                          index === 2 && { borderRightWidth: 0 }
                        ]}
                        onPress={() => setMemberFilterBy(option.key as any)}
                      >
                        <ThemedText style={[
                          styles.segmentButtonText,
                          { color: memberFilterBy === option.key ? 'white' : colors.text }
                        ]}>
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              {clubMembers.length > 0 ? (
                <View>
                  {(() => {
                    // Filter members
                    let filteredMembers = clubMembers.filter(member => {
                      if (memberFilterBy === 'active') {
                        return member.match_count > 3;
                      } else if (memberFilterBy === 'new') {
                        const joinedDate = new Date(member.joined_at);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return joinedDate > thirtyDaysAgo;
                      }
                      return true;
                    });
                    
                    // Sort members
                    filteredMembers.sort((a, b) => {
                      switch (memberSortBy) {
                        case 'ranking':
                          // Find each member's ranking position
                          const rankingA = rankings.findIndex(r => r.playerId === a.id);
                          const rankingB = rankings.findIndex(r => r.playerId === b.id);
                          // Handle cases where member is not in rankings (put at end)
                          if (rankingA === -1 && rankingB === -1) return 0;
                          if (rankingA === -1) return 1;
                          if (rankingB === -1) return -1;
                          return rankingA - rankingB; // Lower index = higher rank
                        case 'wins':
                          return (b.wins || 0) - (a.wins || 0);
                        case 'matches':
                          return (b.match_count || 0) - (a.match_count || 0);
                        case 'joined':
                          return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
                        default: // name
                          return (a.full_name || '').localeCompare(b.full_name || '');
                      }
                    });
                    
                    return filteredMembers.map((member, index) => {
                      const winRate = member.match_count > 0 ? (member.wins / member.match_count) * 100 : 0;
                      const isActive = member.match_count > 3;
                      const isNew = (() => {
                        const joinedDate = new Date(member.joined_at);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return joinedDate > thirtyDaysAgo;
                      })();
                      
                      return (
                        <View 
                          key={member.id} 
                          style={[
                            styles.enhancedMemberItem,
                            index !== filteredMembers.length - 1 && styles.memberItemBorder,
                            { borderColor: colors.tabIconDefault }
                          ]}
                        >
                          <View style={styles.memberHeader}>
                            <View style={styles.memberNameContainer}>
                              <View style={styles.memberNameRow}>
                                <View style={styles.nameWithBadge}>
                                  <ThemedText style={styles.enhancedMemberName}>{member.full_name || 'Unknown Member'}</ThemedText>
                                  {isNew && (
                                    <View style={[styles.memberBadge, { backgroundColor: '#4CAF50' }]}>
                                      <ThemedText style={styles.badgeText}>NEW</ThemedText>
                                    </View>
                                  )}
                                  {isActive && (
                                    <View style={[styles.memberBadge, { backgroundColor: colors.tint }]}>
                                      <ThemedText style={styles.badgeText}>ACTIVE</ThemedText>
                                    </View>
                                  )}
                                </View>
                                <ThemedText style={[styles.memberJoinedDateInline, { color: colors.tabIconDefault }]}>
                                  Joined {new Date(member.joined_at).toLocaleDateString()}
                                </ThemedText>
                              </View>
                            </View>
                            {user && user.id !== member.id && (
                              <TouchableOpacity
                                style={[
                                  styles.enhancedChallengeButton,
                                  { 
                                    backgroundColor: pendingChallenges.has(member.id) ? colors.tabIconDefault : colors.tint,
                                    opacity: pendingChallenges.has(member.id) ? 0.6 : 1
                                  }
                                ]}
                                onPress={() => handleChallengePlayer(member.id, member.full_name)}
                                disabled={pendingChallenges.has(member.id)}
                              >
                                <Ionicons 
                                  name={pendingChallenges.has(member.id) ? "hourglass-outline" : "tennisball"} 
                                  size={14} 
                                  color="white" 
                                />
                                <ThemedText style={styles.enhancedChallengeButtonText}>
                                  {pendingChallenges.has(member.id) ? 'Pending' : 'Challenge'}
                                </ThemedText>
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          <View style={styles.memberStatsContainer}>
                            <View style={styles.statGroup}>
                              <View style={styles.statItem}>
                                <ThemedText style={styles.statValue}>{member.match_count}</ThemedText>
                                <ThemedText style={[styles.statLabelSmall, { color: colors.tabIconDefault }]}>Matches</ThemedText>
                              </View>
                              <View style={styles.statItem}>
                                <ThemedText style={styles.statValue}>{member.wins}</ThemedText>
                                <ThemedText style={[styles.statLabelSmall, { color: colors.tabIconDefault }]}>Wins</ThemedText>
                              </View>
                              <View style={styles.statItem}>
                                <ThemedText style={styles.statValue}>{Math.round(winRate)}%</ThemedText>
                                <ThemedText style={[styles.statLabelSmall, { color: colors.tabIconDefault }]}>Win Rate</ThemedText>
                              </View>
                            </View>
                            
                            {member.match_count > 0 && (
                              <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { backgroundColor: colors.tabIconDefault + '20' }]}>
                                  <View 
                                    style={[
                                      styles.progressFill,
                                      { 
                                        backgroundColor: winRate >= 60 ? '#4CAF50' : winRate >= 40 ? '#FF9800' : '#FF5722',
                                        width: `${winRate}%`
                                      }
                                    ]}
                                  />
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    });
                  })()}
                </View>
              ) : (
                <View style={[styles.placeholder, { borderColor: colors.tabIconDefault }]}>
                  <ThemedText style={styles.placeholderEmoji}>👥</ThemedText>
                  <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
                    No members yet
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          </>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <>
            <ThemedView style={[styles.sectionCard, { backgroundColor: colors.background, shadowColor: colors.text }]}>
              
              {/* Match Filtering Controls */}
              <View style={styles.controlsContainer}>
                <View style={styles.controlGroup}>
                  <ThemedText style={[styles.controlLabel, { color: colors.tabIconDefault }]}>Type:</ThemedText>
                  <View style={styles.segmentedControl}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'singles', label: 'Singles' },
                      { key: 'doubles', label: 'Doubles' }
                    ].map((option, index) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.segmentButton,
                          matchFilterType === option.key && { backgroundColor: colors.tint },
                          index === 2 && { borderRightWidth: 0 }
                        ]}
                        onPress={() => setMatchFilterType(option.key as any)}
                      >
                        <ThemedText style={[
                          styles.segmentButtonText,
                          { color: matchFilterType === option.key ? 'white' : colors.text }
                        ]}>
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.controlGroup}>
                  <ThemedText style={[styles.controlLabel, { color: colors.tabIconDefault }]}>Date:</ThemedText>
                  <View style={styles.segmentedControl}>
                    {[
                      { key: 'all', label: 'All Time' },
                      { key: 'week', label: 'Last Week' },
                      { key: 'month', label: 'Last Month' }
                    ].map((option, index) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.segmentButton,
                          matchFilterDate === option.key && { backgroundColor: colors.tint },
                          index === 2 && { borderRightWidth: 0 }
                        ]}
                        onPress={() => setMatchFilterDate(option.key as any)}
                      >
                        <ThemedText style={[
                          styles.segmentButtonText,
                          { color: matchFilterDate === option.key ? 'white' : colors.text }
                        ]}>
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              {allMatches.length > 0 ? (
                <View>
                  {(() => {
                    // Filter matches based on current filter settings
                    let filteredMatches = allMatches.filter((match: any) => {
                      // Type filter
                      if (matchFilterType !== 'all') {
                        if (matchFilterType === 'singles' && match.match_type !== 'singles') return false;
                        if (matchFilterType === 'doubles' && match.match_type !== 'doubles') return false;
                      }
                      
                      // Date filter
                      if (matchFilterDate !== 'all') {
                        const matchDate = new Date(match.date);
                        const now = new Date();
                        
                        if (matchFilterDate === 'week') {
                          const weekAgo = new Date(now);
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          if (matchDate < weekAgo) return false;
                        } else if (matchFilterDate === 'month') {
                          const monthAgo = new Date(now);
                          monthAgo.setMonth(monthAgo.getMonth() - 1);
                          if (matchDate < monthAgo) return false;
                        }
                      }
                      
                      return true;
                    });
                    
                    const formatDate = (dateString: string) => {
                      const date = new Date(dateString);
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      
                      if (date.toDateString() === today.toDateString()) {
                        return 'Today';
                      } else if (date.toDateString() === yesterday.toDateString()) {
                        return 'Yesterday';
                      } else {
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }
                    };
                    
                    return filteredMatches.map((match: any, index) => {
                      return (
                        <View 
                          key={match.id} 
                          style={[
                            styles.matchItem,
                            index !== allMatches.length - 1 && styles.matchItemBorder,
                            { borderColor: colors.tabIconDefault }
                          ]}
                        >
                          <TennisScoreDisplay
                            player1Name={match.player1_name}
                            player2Name={match.player2_name || match.opponent2_name}
                            scores={match.scores}
                            winner={match.winner}
                            matchId={match.id}
                            player1Id={match.player1_id}
                            player2Id={match.player2_id}
                            player3Id={match.player3_id}
                            player4Id={match.player4_id}
                            matchType={match.match_type}
                            clubName={club?.name}
                            matchDate={match.date}
                            isPlayer1Unregistered={false} // Player 1 is always registered
                            isPlayer2Unregistered={!match.player2_id && !!match.opponent2_name}
                            isPlayer3Unregistered={!match.player3_id && !!match.partner3_name}
                            isPlayer4Unregistered={!match.player4_id && !!match.partner4_name}
                            unregisteredPlayer2Name={match.opponent2_name}
                            unregisteredPlayer3Name={match.partner3_name}
                            unregisteredPlayer4Name={match.partner4_name}
                            onClaimMatch={handleClaimMatch}
                          />
                        </View>
                      );
                    });
                  })()}
                </View>
              ) : (
                <View style={[styles.placeholder, { borderColor: colors.tabIconDefault }]}>
                  <ThemedText style={styles.placeholderEmoji}>🎾</ThemedText>
                  <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
                    No matches yet • Be the first to play!
                  </ThemedText>
                  <ThemedText style={[styles.placeholderSubtext, { color: colors.tabIconDefault }]}>
                    Record your match to start building history
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          </>
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