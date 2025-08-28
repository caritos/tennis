import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TennisScoreDisplay } from '@/components/TennisScoreDisplay';
import { DoublesMatchParticipants } from '@/components/DoublesMatchParticipants';
import { Match } from '@/lib/supabase';

interface ClubMatch extends Match {
  player1_name: string;
  player2_name?: string;
  partner4_name?: string;
  player1_id: string;
  player2_id?: string;
  player3_id?: string;
  player4_id?: string;
  scores: string;
  winner: number | null;
  match_type: 'singles' | 'doubles';
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  status?: string;
  isInvitation?: boolean;
  isChallenge?: boolean;
  responses?: {
    id: string;
    invitation_id?: string;
    user_id?: string;
    user_name?: string;
    status: 'interested' | 'confirmed' | 'declined';
    created_at?: string;
  }[];
}

interface ClubMatchesProps {
  matches: ClubMatch[];
  club: { id: string; name: string } | null;
  colors: any;
  filterType: 'all' | 'singles' | 'doubles';
  filterDate: 'all' | 'upcoming';
  filterInvolvement: 'all' | 'my' | 'incomplete';
  onFilterTypeChange: (type: 'all' | 'singles' | 'doubles') => void;
  onFilterDateChange: (date: 'all' | 'upcoming') => void;
  onFilterInvolvementChange: (involvement: 'all' | 'my' | 'incomplete') => void;
  onClaimMatch?: (matchId: string, playerPosition: "player2" | "player3" | "player4") => void;
  onRecordMatch?: () => void;
  onJoinInvitation?: (invitationId: string) => void;
  joiningInvitations?: Set<string>;
  currentUserId?: string;
  highlightMatchId?: string | null;
  onHighlightCleared?: () => void;
}

export default function ClubMatches({
  matches,
  club,
  colors,
  filterType,
  filterDate,
  filterInvolvement,
  onFilterTypeChange,
  onFilterDateChange,
  onFilterInvolvementChange,
  onClaimMatch,
  onRecordMatch,
  onJoinInvitation,
  joiningInvitations,
  currentUserId,
  highlightMatchId,
  onHighlightCleared,
}: ClubMatchesProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const matchHeightsRef = useRef<Map<string, number>>(new Map());
  const filtersHeightRef = useRef<number>(280); // Default filter section height
  
  // Helper function for readable match IDs
  const getReadableMatchId = (matchId: string): string => {
    const cleanId = matchId.replace(/-/g, '').toUpperCase().slice(0, 6);
    return `M-${cleanId}`;
  };

  // Filter and sort matches based on type, involvement, and date
  const filteredMatches = matches.filter(match => {
    // Business logic exception: always show the target match when deep linking
    const isTargetMatch = highlightMatchId && highlightMatchId === match.id;
    if (isTargetMatch) {
      console.log('🎯 ClubMatches: Including target match despite filtering rules:', match.id);
      return true;
    }

    // Filter by match type
    if (filterType !== 'all' && match.match_type !== filterType) {
      return false;
    }
    
    // Filter by user involvement
    if (filterInvolvement === 'my' && currentUserId) {
      const isUserInvolved = 
        match.player1_id === currentUserId ||
        match.player2_id === currentUserId ||
        match.player3_id === currentUserId ||
        match.player4_id === currentUserId;
      if (!isUserInvolved) return false;
    } else if (filterInvolvement === 'incomplete') {
      // Show matches that need more players (have empty slots)
      let isIncomplete = false;
      
      if (match.isInvitation) {
        // For invitation matches, count responses + creator to determine if incomplete
        const confirmedResponses = match.responses?.filter(r => r.status === 'confirmed') || [];
        const totalConfirmedPlayers = confirmedResponses.length + 1; // +1 for creator
        
        const requiredPlayers = match.match_type === 'singles' ? 2 : 4;
        isIncomplete = totalConfirmedPlayers < requiredPlayers;
      } else {
        // For regular matches, check player ID/name slots
        if (match.match_type === 'singles') {
          // For singles: incomplete if player2 slot is completely empty (no ID and no name)
          isIncomplete = !match.player2_id && !match.opponent2_name;
        } else {
          // For doubles: incomplete if ANY position is completely empty (no ID and no name)
          const player2Missing = !match.player2_id && !match.opponent2_name;
          const player3Missing = !match.player3_id && !match.partner3_name;
          const player4Missing = !match.player4_id && !match.partner4_name;
          
          isIncomplete = player2Missing || player3Missing || player4Missing;
        }
      }
      
      if (!isIncomplete) return false;
    }
    
    // Filter by date
    if (filterDate !== 'all') {
      const matchDate = new Date(match.date);
      const now = new Date();
      
      if (filterDate === 'upcoming') {
        // Show only future matches
        if (matchDate <= now) return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Sort matches by date - most recent first
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (filterDate === 'upcoming') {
      // For upcoming matches, sort earliest first
      return dateA.getTime() - dateB.getTime();
    } else {
      // For all other filters, sort most recent first
      return dateB.getTime() - dateA.getTime();
    }
  });

  // Store match heights as they render
  const handleMatchLayout = (matchId: string, height: number) => {
    matchHeightsRef.current.set(matchId, height);
    console.log(`📏 Match ${getReadableMatchId(matchId)} measured height:`, height);
  };

  // Store filters height
  const handleFiltersLayout = (height: number) => {
    filtersHeightRef.current = height;
    console.log('📏 Filters section measured height:', height);
  };

  // Scroll to highlighted match when it changes
  useEffect(() => {
    if (highlightMatchId && filteredMatches.length > 0) {
      console.log('🔍 DEEP LINK DEBUG: Looking for match:', highlightMatchId);
      console.log('🔍 DEEP LINK DEBUG: Readable ID we want:', getReadableMatchId(highlightMatchId));
      console.log('🔍 DEEP LINK DEBUG: Total filtered matches:', filteredMatches.length);
      
      // Find the index of the highlighted match in the filtered matches
      const targetIndex = filteredMatches.findIndex(match => match.id === highlightMatchId);
      
      if (targetIndex >= 0) {
        console.log('🎯 ClubMatches: Found target match at filtered index:', targetIndex);
        console.log('🎯 ClubMatches: Target match details:', {
          id: getReadableMatchId(filteredMatches[targetIndex].id),
          fullId: filteredMatches[targetIndex].id,
          type: filteredMatches[targetIndex].match_type,
          isInvitation: filteredMatches[targetIndex].isInvitation,
          isChallenge: filteredMatches[targetIndex].isChallenge
        });
        
        // Calculate scroll position using actual measured heights
        let totalHeight = filtersHeightRef.current; // Start with filters height
        
        // Add up actual heights of matches before our target
        for (let i = 0; i < targetIndex; i++) {
          const match = filteredMatches[i];
          const measuredHeight = matchHeightsRef.current.get(match.id);
          if (measuredHeight) {
            totalHeight += measuredHeight;
            console.log(`  - Match ${i} (${getReadableMatchId(match.id)}): ${measuredHeight}px (measured)`);
          } else {
            // Use more accurate estimates based on match type
            let estimatedHeight = 120;
            if (match.isInvitation) {
              estimatedHeight = 160; // Invitations tend to be taller due to participant grids
            } else if (match.isChallenge) {
              estimatedHeight = 140; // Challenges are medium height
            }
            totalHeight += estimatedHeight;
            console.log(`  - Match ${i} (${getReadableMatchId(match.id)}): ${estimatedHeight}px (estimated)`);
          }
        }
        
        // Add half of target match height to center it
        const targetMatchHeight = matchHeightsRef.current.get(filteredMatches[targetIndex].id) || 140;
        const targetScrollPosition = Math.max(0, totalHeight - (targetMatchHeight / 2));
        
        console.log('🎯 ClubMatches: Scroll calculation details:');
        console.log('  - Filters height:', filtersHeightRef.current);
        console.log('  - Matches before target:', targetIndex);
        console.log('  - Total height to target:', totalHeight);
        console.log('  - Target match height:', targetMatchHeight);
        console.log('  - Final scroll position:', targetScrollPosition);
        
        // Use multiple scroll strategies for maximum reliability
        setTimeout(() => {
          if (scrollViewRef.current) {
            console.log('🎯 ClubMatches: Attempting enhanced scroll to position:', targetScrollPosition);
            
            // Strategy 1: Multiple scroll attempts with different timing
            const scrollAttempts = [
              { delay: 0, animated: true },
              { delay: 300, animated: false },
              { delay: 600, animated: true },
            ];
            
            scrollAttempts.forEach(({ delay, animated }, attemptIndex) => {
              setTimeout(() => {
                if (scrollViewRef.current) {
                  console.log(`🎯 ClubMatches: Scroll attempt ${attemptIndex + 1} to position:`, targetScrollPosition, `(animated: ${animated})`);
                  scrollViewRef.current.scrollTo({
                    y: targetScrollPosition,
                    animated: animated
                  });
                }
              }, delay);
            });
          }
        }, 1200); // Increased delay to ensure all layouts are measured
      } else {
        console.warn('🎯 ClubMatches: Target match not found in filtered list!');
        console.warn('🎯 ClubMatches: Looking for ID:', highlightMatchId);
        console.warn('🎯 ClubMatches: Available IDs:', filteredMatches.map(m => m.id));
      }
    }
  }, [highlightMatchId, filteredMatches]);

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

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Filter Controls */}
      <ThemedView 
        style={[styles.filtersCard, { backgroundColor: colors.card }]}
        onLayout={(event) => handleFiltersLayout(event.nativeEvent.layout.height)}
      >
        <View style={styles.filterSection}>
          <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>
            MATCH TYPE
          </ThemedText>
          <View style={styles.filterButtons}>
            {(['all', 'singles', 'doubles'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  filterType === type && { backgroundColor: colors.tint },
                  filterType !== type && { borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => onFilterTypeChange(type)}
              >
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    { color: filterType === type ? '#fff' : colors.text }
                  ]}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>
            INVOLVEMENT
          </ThemedText>
          <View style={styles.filterButtons}>
            {(['all', 'my', 'incomplete'] as const).map((involvement) => (
              <TouchableOpacity
                key={involvement}
                style={[
                  styles.filterButton,
                  filterInvolvement === involvement && { backgroundColor: colors.tint },
                  filterInvolvement !== involvement && { borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => onFilterInvolvementChange(involvement)}
              >
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    { color: filterInvolvement === involvement ? '#fff' : colors.text }
                  ]}
                >
                  {involvement === 'all' ? 'All Matches' : involvement === 'my' ? 'My Matches' : 'Need Players'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>
            TIME PERIOD
          </ThemedText>
          <View style={styles.filterButtons}>
            {([
              { key: 'all', label: 'All Time' },
              { key: 'upcoming', label: 'Upcoming' }
            ] as const).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterButton,
                  filterDate === key && { backgroundColor: colors.tint },
                  filterDate !== key && { borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => onFilterDateChange(key)}
              >
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    { color: filterDate === key ? '#fff' : colors.text }
                  ]}
                >
                  {label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ThemedView>

      {/* Matches List */}
      <ThemedView style={[styles.matchesCard, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Matches ({filteredMatches.length})
          </ThemedText>
        </View>

        {filteredMatches.length > 0 ? (
          <View style={styles.matchesList}>
            {filteredMatches.map((match, index) => (
              <View
                key={match.id}
                onLayout={(event) => handleMatchLayout(match.id, event.nativeEvent.layout.height)}
                style={[
                  styles.matchItem,
                  index !== filteredMatches.length - 1 && styles.matchItemBorder,
                  { borderColor: colors.border },
                  highlightMatchId === match.id && {
                    borderColor: colors.tint,
                    borderWidth: 3,
                    backgroundColor: `${colors.tint}15`,
                    shadowColor: colors.tint,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }
                ]}
              >
                {match.isChallenge ? (
                  // Display challenge match
                  <View style={[styles.challengeDisplay, { borderColor: '#FF6B35', borderWidth: 1, borderRadius: 8 }]}>
                    <View style={styles.challengeHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 16, marginRight: 6 }}>⚔️</ThemedText>
                        <ThemedText style={[styles.challengeStatus, { color: '#FF6B35' }]}>
                          Challenge Match
                        </ThemedText>
                        <View style={[styles.matchIdBadge, { backgroundColor: '#FF6B35', borderColor: '#FF6B35' }]}>
                          <ThemedText style={[styles.matchIdText, { color: 'white' }]}>
                            {getReadableMatchId(match.id)}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={[styles.challengeType, { color: colors.textSecondary }]}>
                        Ready to Play
                      </ThemedText>
                    </View>
                    
                    <ThemedText style={[styles.challengePlayers, { color: colors.text }]}>
                      {match.player1_name} vs {match.player2_name}
                    </ThemedText>
                    
                    <ThemedText style={[styles.challengeMatchType, { color: colors.textSecondary }]}>
                      {match.match_type.charAt(0).toUpperCase() + match.match_type.slice(1)}
                    </ThemedText>
                    
                    {match.time && (
                      <ThemedText style={[styles.challengeTime, { color: colors.textSecondary }]}>
                        {match.time}
                      </ThemedText>
                    )}
                    
                    {match.notes && (
                      <ThemedText style={[styles.challengeNotes, { color: colors.textSecondary }]}>
                        &quot;{match.notes}&quot;
                      </ThemedText>
                    )}
                    
                    {/* Contact Information for Challenge Participants */}
                    {currentUserId && (match.player1_id === currentUserId || match.player2_id === currentUserId) && (
                      <View style={[styles.contactInfo, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.contactHeader}>
                          <Ionicons name="call" size={16} color={colors.tint} />
                          <ThemedText style={[styles.contactTitle, { color: colors.text }]}>
                            Contact Information
                          </ThemedText>
                        </View>
                        <View style={styles.contactList}>
                          {match.player1_phone && (
                            <ThemedText style={[styles.contactItem, { color: colors.textSecondary }]}>
                              {match.player1_name}: {match.player1_phone}
                            </ThemedText>
                          )}
                          {match.player2_phone && (
                            <ThemedText style={[styles.contactItem, { color: colors.textSecondary }]}>
                              {match.player2_name}: {match.player2_phone}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={[styles.challengeRecordButton, { backgroundColor: '#FF6B35' }]}
                      onPress={() => {
                        // Navigate to record challenge match screen
                        router.push(`/record-challenge-match/${match.id}`);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="trophy" size={16} color="white" style={{ marginRight: 6 }} />
                        <ThemedText style={styles.challengeRecordText}>
                          Record Match Results
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : match.isInvitation ? (
                  // Display invitation with grid-style participant slots - Enhanced styling
                  <View style={[styles.invitationDisplay, { borderColor: '#4A90E2', borderWidth: 1, borderRadius: 8 }]}>
                    <View style={styles.invitationHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 16, marginRight: 6 }}>🎾</ThemedText>
                        <ThemedText style={[styles.invitationStatus, { color: '#4A90E2' }]}>
                          Looking to Play {match.match_type.charAt(0).toUpperCase() + match.match_type.slice(1)} {formatDate(match.date)}
                        </ThemedText>
                        <View style={[styles.matchIdBadge, { backgroundColor: '#4A90E2', borderColor: '#4A90E2' }]}>
                          <ThemedText style={[styles.matchIdText, { color: 'white' }]}>
                            {getReadableMatchId(match.id)}
                          </ThemedText>
                        </View>
                      </View>
                      {match.time && (
                        <ThemedText style={[styles.invitationTime, { color: colors.textSecondary }]}>
                          {match.time}
                        </ThemedText>
                      )}
                    </View>
                    
                    {match.notes && (
                      <ThemedText style={[styles.invitationNotes, { color: colors.textSecondary }]}>
                        &quot;{match.notes}&quot;
                      </ThemedText>
                    )}

                    {/* Grid-style participant display */}
                    <DoublesMatchParticipants
                      creatorName={match.player1_name}
                      responses={(match.responses || []).map(r => ({
                        id: r.id,
                        invitation_id: r.invitation_id || match.id,
                        user_id: r.user_id || r.id,
                        user_name: r.user_name,
                        message: '',
                        status: r.status,
                        created_at: r.created_at || new Date().toISOString()
                      }))}
                      matchType={match.match_type}
                      isMatched={false}
                      onJoinMatch={onJoinInvitation ? () => onJoinInvitation(match.id) : undefined}
                      isJoining={joiningInvitations?.has(match.id) || false}
                      currentUserId={currentUserId}
                      creatorId={match.player1_id}
                    />

                    {/* Contact Information for Match Invitation Participants */}
                    {(() => {
                      const requiredPlayers = match.match_type === 'singles' ? 2 : 4;
                      const totalPlayers = 1 + (match.responses || []).length; // creator + responses
                      const isMatchConfirmed = totalPlayers >= requiredPlayers;
                      const isUserParticipant = currentUserId && (match.player1_id === currentUserId || (match.responses || []).some((r: any) => r.user_id === currentUserId));
                      
                      return isMatchConfirmed && isUserParticipant;
                    })() && (
                      <View style={[styles.contactInfo, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.contactHeader}>
                          <Ionicons name="call" size={16} color={colors.tint} />
                          <ThemedText style={[styles.contactTitle, { color: colors.text }]}>
                            Contact Information
                          </ThemedText>
                        </View>
                        <View style={styles.contactList}>
                          {match.player1_phone && (
                            <ThemedText style={[styles.contactItem, { color: colors.textSecondary }]}>
                              {match.player1_name}: {match.player1_phone}
                            </ThemedText>
                          )}
                          {(match.responses || [])
                            .filter((r: any) => r.user_phone)
                            .map((r: any, index: number) => (
                              <ThemedText key={index} style={[styles.contactItem, { color: colors.textSecondary }]}>
                                {r.user_name}: {r.user_phone}
                              </ThemedText>
                            ))}
                        </View>
                      </View>
                    )}

                    {/* Record Match Result Button - Show when enough players have joined */}
                    {(() => {
                      const requiredPlayers = match.match_type === 'singles' ? 2 : 4;
                      const totalPlayers = 1 + (match.responses || []).length; // creator + responses
                      const canRecordMatch = totalPlayers >= requiredPlayers;
                      
                      return canRecordMatch && currentUserId && (match.player1_id === currentUserId || (match.responses || []).some((r: any) => r.user_id === currentUserId)) && (
                        <TouchableOpacity
                          style={[styles.invitationRecordButton, { backgroundColor: '#4A90E2' }]}
                          onPress={() => {
                            // Navigate to record match screen for invitation
                            router.push(`/record-invitation-match/${match.id}`);
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="trophy" size={16} color="white" style={{ marginRight: 6 }} />
                            <ThemedText style={styles.invitationRecordText}>
                              Record Match Results
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                ) : (
                  // Display completed match with scores
                  <TennisScoreDisplay
                    player1Name={
                      match.match_type === 'doubles' 
                        ? `${match.player1_name} & ${match.partner3_name || 'Unknown Partner'}`
                        : match.player1_name
                    }
                    player2Name={
                      match.match_type === 'doubles'
                        ? `${match.player2_name || match.opponent2_name || 'Unknown'} & ${match.partner4_name || 'Unknown Partner'}`
                        : match.player2_name || match.opponent2_name || 'Unknown'
                    }
                    scores={match.scores}
                    winner={match.winner as 1 | 2}
                    matchId={match.id}
                    player1Id={match.player1_id}
                    player2Id={match.player2_id}
                    player3Id={match.player3_id}
                    player4Id={match.player4_id}
                    matchType={match.match_type}
                    clubName={club?.name}
                    matchDate={match.date}
                    notes={match.notes}
                    isPlayer2Unregistered={!match.player2_id && !!match.opponent2_name}
                    isPlayer3Unregistered={!match.player3_id && !!match.partner3_name}
                    isPlayer4Unregistered={!match.player4_id && !!match.partner4_name}
                    unregisteredPlayer2Name={match.opponent2_name}
                    unregisteredPlayer3Name={match.partner3_name}
                    unregisteredPlayer4Name={match.partner4_name}
                    onClaimMatch={onClaimMatch}
                  />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.placeholder, { borderColor: colors.border }]}>
            <ThemedText style={styles.placeholderEmoji}>
              🎾
            </ThemedText>
            <ThemedText style={[styles.placeholderText, { color: colors.text }]}>
              {filterInvolvement === 'my'
                ? 'No matches found for you'
                : filterInvolvement === 'incomplete'
                ? 'No matches need additional players'
                : filterType === 'all' && filterDate === 'all' && filterInvolvement === 'all'
                ? 'No matches yet • Be the first to play!'
                : 'No matches found for your filters'
              }
            </ThemedText>
            <ThemedText style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
              {filterInvolvement === 'my'
                ? 'Record a match or join a game to start playing'
                : filterInvolvement === 'incomplete'
                ? 'All matches have full rosters • Check back later'
                : filterType === 'all' && filterDate === 'all' && filterInvolvement === 'all'
                ? 'Record your match to start building history'
                : 'Try adjusting your filters to see more matches'
              }
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Bottom padding */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  filtersCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  matchesCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  matchesList: {
    gap: 0,
  },
  matchItem: {
    paddingVertical: 16,
  },
  matchItemBorder: {
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    minHeight: 140, // Ensure enough space for emoji and text
  },
  placeholderEmoji: {
    fontSize: 32,
    marginBottom: 8,
    lineHeight: 40, // Ensure proper line height for emoji
    textAlign: 'center',
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
  // Challenge display styles
  challengeDisplay: {
    padding: 12,
    marginVertical: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengeType: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  challengePlayers: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  challengeMatchType: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  challengeTime: {
    fontSize: 13,
    marginBottom: 4,
  },
  challengeNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  challengeRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  challengeRecordText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Invitation display styles
  invitationDisplay: {
    padding: 8,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invitationStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  invitationTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  invitationNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  // Contact Information styles
  contactInfo: {
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactList: {
    gap: 4,
  },
  contactItem: {
    fontSize: 13,
    fontFamily: 'monospace', // Makes phone numbers easier to read
  },
  // Invitation Record Button styles
  invitationRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  invitationRecordText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  matchIdBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  matchIdText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});