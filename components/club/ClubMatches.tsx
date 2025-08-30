import React, { useRef, useEffect, useState } from 'react';
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
  targeted_players?: string[]; // Array of user IDs for targeted invitations
  targeted_player_names?: string[]; // Array of player names for targeted invitations
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
  targetMatchId?: string | null; // For scrolling to specific match
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
  onRecordMatch: _onRecordMatch,
  onJoinInvitation,
  joiningInvitations,
  currentUserId,
  targetMatchId,
}: ClubMatchesProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const matchRefs = useRef<{ [key: string]: View | null }>({});
  const [isLayoutComplete, setIsLayoutComplete] = useState(false);
  
  // Helper function for readable match IDs
  const getReadableMatchId = (matchId: string): string => {
    const cleanId = matchId.replace(/-/g, '').toUpperCase().slice(0, 6);
    return `M-${cleanId}`;
  };

  // Filter and sort matches based on type, involvement, and date
  const filteredMatches = matches.filter(match => {

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
      // Show matches that need more players AND the current user can join (not creator)
      let isIncomplete = false;
      let canCurrentUserJoin = false;
      
      if (match.isInvitation) {
        // For invitation matches, count responses + creator to determine if incomplete
        const confirmedResponses = match.responses?.filter(r => r.status === 'confirmed') || [];
        const totalConfirmedPlayers = confirmedResponses.length + 1; // +1 for creator
        
        const requiredPlayers = match.match_type === 'singles' ? 2 : 4;
        isIncomplete = totalConfirmedPlayers < requiredPlayers;
        
        // Check if current user can join (not the creator and hasn't responded)
        const isCreator = currentUserId === match.player1_id;
        const hasUserResponded = currentUserId && match.responses?.some(r => r.user_id === currentUserId);
        canCurrentUserJoin = currentUserId && !isCreator && !hasUserResponded;
      } else {
        // For regular matches, check player ID/name slots
        if (match.match_type === 'singles') {
          // For singles: incomplete if player2 slot is completely empty (no ID and no name)
          isIncomplete = !match.player2_id && !match.opponent2_name;
          // Check if current user can join (not player1 and slot is empty)
          canCurrentUserJoin = currentUserId && currentUserId !== match.player1_id && isIncomplete;
        } else {
          // For doubles: incomplete if ANY position is completely empty (no ID and no name)
          const player2Missing = !match.player2_id && !match.opponent2_name;
          const player3Missing = !match.player3_id && !match.partner3_name;
          const player4Missing = !match.player4_id && !match.partner4_name;
          
          isIncomplete = player2Missing || player3Missing || player4Missing;
          // Check if current user can join (not already in the match and there's an empty slot)
          const isAlreadyInMatch = currentUserId === match.player1_id || currentUserId === match.player2_id || 
                                   currentUserId === match.player3_id || currentUserId === match.player4_id;
          canCurrentUserJoin = currentUserId && !isAlreadyInMatch && isIncomplete;
        }
      }
      
      // Only show if the match is incomplete AND the current user can join
      if (!isIncomplete || !canCurrentUserJoin) return false;
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

  // Removed height measurement functions (issue #133)

  // Simple scroll-to-match functionality (no highlighting)
  useEffect(() => {
    console.log('📜 ClubMatches scroll effect triggered:', {
      targetMatchId,
      targetMatchIdType: typeof targetMatchId,
      targetMatchIdLength: targetMatchId?.length,
      filteredMatchesCount: filteredMatches.length,
      allMatchesIDs: filteredMatches.map(m => ({
        id: m.id, 
        idType: typeof m.id,
        idLength: m.id?.length,
        type: m.match_type,
        isInvitation: m.isInvitation 
      }))
    });
    
    if (targetMatchId && filteredMatches.length > 0) {
      console.log('🔍 ClubMatches: Starting detailed match search...');
      console.log('🔍 ClubMatches: Looking for exact match ID:', `'${targetMatchId}'`);
      
      // Try different comparison methods to debug the issue
      const exactMatch = filteredMatches.find(match => match.id === targetMatchId);
      const trimmedMatch = filteredMatches.find(match => match.id.trim() === targetMatchId.trim());
      const indexMatch = filteredMatches.findIndex(match => match.id === targetMatchId);
      
      console.log('🔍 ClubMatches: Search results:', {
        exactMatch: exactMatch ? { id: exactMatch.id, type: exactMatch.match_type, isInvitation: exactMatch.isInvitation } : null,
        trimmedMatch: trimmedMatch ? { id: trimmedMatch.id, type: trimmedMatch.match_type, isInvitation: trimmedMatch.isInvitation } : null,
        indexMatch: indexMatch
      });
      
      const targetIndex = indexMatch;
      console.log('📜 ClubMatches: Final target index:', targetIndex);
      
      if (targetIndex >= 0) {
        const targetMatch = filteredMatches[targetIndex];
        let targetPosition = 0;
        console.log('✅ ClubMatches: Found target match to scroll to:', {
          id: targetMatch.id,
          index: targetIndex,
          type: targetMatch.match_type,
          isInvitation: targetMatch.isInvitation,
          date: targetMatch.date
        });
        
        // Get the actual position of the target match using refs
        const targetMatchRef = matchRefs.current[targetMatch.id];
        
        if (targetMatchRef && isLayoutComplete) {
          console.log('📍 ClubMatches: Using actual measured position for target match');
          
          // First get current scroll position for debugging
          setTimeout(() => {
            scrollViewRef.current?.measureLayout(
              scrollViewRef.current as any,
              (x, y, width, height) => {
                console.log('📊 ClubMatches: ScrollView current measurements:', { x, y, width, height });
              },
              () => {}
            );
          }, 50);
          
          targetMatchRef.measureLayout(
            scrollViewRef.current as any,
            (x, y, width, height) => {
              // Add a small offset to account for visual comfort and headers
              const SCROLL_OFFSET = 50; // Pixels to scroll above the target match
              const targetPosition = Math.max(0, y - SCROLL_OFFSET);
              
              console.log('📍 ClubMatches: Measured target match position:', {
                x, y, width, height,
                rawTargetPosition: y,
                targetPositionWithOffset: targetPosition,
                scrollOffset: SCROLL_OFFSET
              });
              
              // Get current scroll position for comparison
              setTimeout(() => {
                // Use a longer delay to ensure proper rendering
                scrollViewRef.current?.scrollTo({
                  y: targetPosition,
                  animated: true
                });
                console.log('✅ ClubMatches: Scroll command executed to measured position with offset:', targetPosition);
                
                // Add verification after scroll completes
                setTimeout(() => {
                  console.log('🔍 ClubMatches: Scroll should be complete now. Target was at index:', targetIndex);
                  console.log('🔍 ClubMatches: If you still need to scroll manually, the issue may be with ScrollView behavior or timing');
                }, 1000);
              }, 200); // Increased delay
            },
            (error) => {
              console.warn('❌ ClubMatches: Failed to measure target match position:', error);
              // Fallback to estimated position
              const fallbackPosition = 280 + (targetIndex * 250); // Rough estimate as fallback
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                  y: fallbackPosition,
                  animated: true
                });
                console.log('🔄 ClubMatches: Using fallback scroll position:', fallbackPosition);
              }, 200);
            }
          );
          return; // Exit early when using measured position
        } else {
          console.log('⏳ ClubMatches: Layout not complete or ref not available, using estimated position');
          // Fallback to improved estimation while layout completes
          const filtersHeight = 280;
          let accumulatedHeight = filtersHeight;
          
          for (let i = 0; i < targetIndex; i++) {
            const match = filteredMatches[i];
            let itemHeight;
            
            if (match.isInvitation) {
              itemHeight = 350;
            } else if (match.isChallenge) {
              itemHeight = 280;
            } else {
              itemHeight = 160;
            }
            
            accumulatedHeight += itemHeight;
          }
          
          targetPosition = accumulatedHeight;
        }
        
        console.log('📜 ClubMatches: Final calculated scroll position:', targetPosition, 'for target match at index:', targetIndex);
        console.log('📜 ClubMatches: Target match details:', {
          id: targetMatch.id,
          type: targetMatch.isInvitation ? 'invitation' : targetMatch.isChallenge ? 'challenge' : 'completed',
          match_type: targetMatch.match_type
        });
        
        // Add the same offset for estimated position
        const SCROLL_OFFSET = 50;
        const finalTargetPosition = Math.max(0, targetPosition - SCROLL_OFFSET);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: finalTargetPosition,
            animated: true
          });
          console.log('✅ ClubMatches: Scroll command executed to estimated position with offset:', finalTargetPosition);
          console.log('✅ ClubMatches: Original estimated position was:', targetPosition);
          
          // Add verification for estimated scroll too
          setTimeout(() => {
            console.log('🔍 ClubMatches: Estimated scroll should be complete now. Target was at index:', targetIndex);
          }, 1000);
        }, 500); // Keep original delay for estimation
      } else {
        console.warn('⚠️ ClubMatches: Target match not found in filtered matches!');
        console.warn('⚠️ ClubMatches: Target ID:', `'${targetMatchId}'`);
        console.warn('⚠️ ClubMatches: Available match details:');
        filteredMatches.forEach((match, idx) => {
          console.warn(`  [${idx}] ID: '${match.id}' | Type: ${match.match_type} | IsInvitation: ${match.isInvitation} | Date: ${match.date}`);
        });
      }
    } else if (targetMatchId) {
      console.log('⏳ ClubMatches: Waiting for matches to load, targetMatchId:', targetMatchId);
    } else {
      console.log('📜 ClubMatches: No targetMatchId provided');
    }
  }, [targetMatchId, filteredMatches, isLayoutComplete]);

  // Track when layout is complete
  useEffect(() => {
    if (filteredMatches.length > 0) {
      // Reset layout complete when matches change
      setIsLayoutComplete(false);
      
      // Longer delay to ensure all items are rendered and measured
      const timer = setTimeout(() => {
        setIsLayoutComplete(true);
        console.log('📏 ClubMatches: Layout marked as complete for', filteredMatches.length, 'matches');
        console.log('📏 ClubMatches: Available match refs:', Object.keys(matchRefs.current).length);
      }, 600); // Increased delay for better reliability
      
      return () => clearTimeout(timer);
    } else {
      setIsLayoutComplete(false);
    }
  }, [filteredMatches.length]);

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
                ref={(ref) => {
                  if (ref) {
                    matchRefs.current[match.id] = ref;
                  }
                }}
                style={[
                  styles.matchItem,
                  index !== filteredMatches.length - 1 && styles.matchItemBorder,
                  { borderColor: colors.border },
                  // Removed highlighting styles (issue #133)
                ]}
                onLayout={() => {
                  console.log(`📏 ClubMatches: Match ${match.id} layout complete`);
                }}
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
                      creatorPhone={match.player1_phone}
                      creatorEloRating={match.creator_elo_rating}
                      creatorGamesPlayed={match.creator_games_played}
                      responses={(match.responses || []).map(r => ({
                        id: r.id,
                        invitation_id: r.invitation_id || match.id,
                        user_id: r.user_id || r.id,
                        user_name: r.user_name,
                        full_name: r.full_name,
                        user_phone: r.user_phone,
                        user_elo_rating: r.user_elo_rating,
                        user_games_played: r.user_games_played,
                        message: '',
                        status: r.status,
                        created_at: r.created_at || new Date().toISOString()
                      }))}
                      matchType={match.match_type}
                      isMatched={(() => {
                        const requiredPlayers = match.match_type === 'singles' ? 2 : 4;
                        // Count creator + all confirmed/interested responses (not pending)
                        const confirmedResponses = (match.responses || []).filter((r: any) => r.status === 'confirmed' || r.status === 'interested');
                        const totalConfirmedPlayers = 1 + confirmedResponses.length;
                        return totalConfirmedPlayers >= requiredPlayers;
                      })()}
                      onJoinMatch={onJoinInvitation ? () => onJoinInvitation(match.id) : undefined}
                      isJoining={joiningInvitations?.has(match.id) || false}
                      currentUserId={currentUserId}
                      creatorId={match.player1_id}
                      targetedPlayers={match.targeted_players}
                      targetedPlayerNames={match.targeted_player_names}
                    />

                    {/* Contact Information for Match Invitation Participants */}
                    {(() => {
                      const requiredPlayers = match.match_type === 'singles' ? 2 : 4;
                      // Count creator + confirmed/interested responses for contact sharing
                      const confirmedResponses = (match.responses || []).filter((r: any) => r.status === 'confirmed' || r.status === 'interested');
                      const totalConfirmedPlayers = 1 + confirmedResponses.length;
                      const isMatchConfirmed = totalConfirmedPlayers >= requiredPlayers;
                      const isUserParticipant = currentUserId && (match.player1_id === currentUserId || confirmedResponses.some((r: any) => r.user_id === currentUserId));
                      
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
                      // Count creator + confirmed/interested responses for match recording
                      const confirmedResponses = (match.responses || []).filter((r: any) => r.status === 'confirmed' || r.status === 'interested');
                      const totalConfirmedPlayers = 1 + confirmedResponses.length;
                      const canRecordMatch = totalConfirmedPlayers >= requiredPlayers;
                      
                      return canRecordMatch && currentUserId && (match.player1_id === currentUserId || confirmedResponses.some((r: any) => r.user_id === currentUserId)) && (
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