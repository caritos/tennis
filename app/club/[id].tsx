import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IOSTypography, IOSSpacing, IOSColors, IOSStyles } from '@/constants/IOSDesign';
import { Club , supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RankedPlayer } from '@/components/ClubRankings';
import ClubOverview from '@/components/club/ClubOverview';
import ClubMembers from '@/components/club/ClubMembers';
import ClubMatches from '@/components/club/ClubMatches';
import MatchInvitationForm from '@/components/MatchInvitationForm';
import { getClubLeaderboard } from '@/services/matchService';
import { challengeService } from '@/services/challengeService';
import { matchInvitationService } from '@/services/matchInvitationService';
import { getClubMatchInvitations, debugMatchInvitations } from '@/services/matchInvitationFunctions';
import { useClubRealtimeSubscriptions } from '@/hooks/useClubRealtimeSubscriptions';

type TabType = 'overview' | 'members' | 'matches';

export default function ClubDetailScreen() {
  const { id, tab, matchId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  // Debug URL parameters
  useEffect(() => {
    console.log('🎯 URL Parameters changed:', { id, tab, matchId });
  }, [id, tab, matchId]);
  
  const [club, setClub] = useState<Club | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [_rankings, _setRankings] = useState<RankedPlayer[]>([]);
  const [_recentMatches, _setRecentMatches] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_isCreator, _setIsCreator] = useState(false);
  const [joiningInvitations, setJoiningInvitations] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Debug tab changes
  useEffect(() => {
    console.log('🎯 Active tab changed to:', activeTab);
  }, [activeTab]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [unreadChallengeCount, setUnreadChallengeCount] = useState(0);
  const [targetMatchId, setTargetMatchId] = useState<string | null>(null);

  // Set active tab from query parameter (only on initial load)
  const [hasInitializedFromURL, setHasInitializedFromURL] = useState(false);
  const [isManualNavigation, setIsManualNavigation] = useState(false);
  
  useEffect(() => {
    console.log('🔧 URL Parameter effect triggered:', { 
      tab, 
      hasInitializedFromURL, 
      isManualNavigation, 
      shouldRun: !hasInitializedFromURL && !isManualNavigation 
    });
    
    if (!hasInitializedFromURL && !isManualNavigation) {
      console.log('🔧 URL Parameter effect running - setting tab based on URL');
      if (tab === 'matches') {
        console.log('🔧 Setting tab to matches from URL');
        setActiveTab('matches');
      } else if (tab === 'members') {
        console.log('🔧 Setting tab to members from URL');
        setActiveTab('members');
      } else if (tab === 'overview') {
        console.log('🔧 Setting tab to overview from URL');
        setActiveTab('overview');
      } else {
        console.log('🔧 No URL tab specified, defaulting to overview');
        setActiveTab('overview');
      }
      setHasInitializedFromURL(true);
      console.log('🔧 URL Parameter effect completed, hasInitializedFromURL set to true');
    } else {
      console.log('🔧 URL Parameter effect skipped');
    }
  }, [tab, hasInitializedFromURL, isManualNavigation]);

  // Handle deep linking to specific match
  useEffect(() => {
    console.log('🔍 Deep linking effect triggered:', {
      matchId,
      matchIdType: typeof matchId,
      allMatchesCount: allMatches.length,
      isManualNavigation,
      activeTab
    });
    
    if (matchId && typeof matchId === 'string' && allMatches.length > 0 && !isManualNavigation) {
      console.log('🎯 Deep linking to match:', matchId);
      console.log('🎯 Available matches IDs:', allMatches.map(m => ({ 
        id: m.id, 
        type: m.isInvitation ? 'invitation' : m.isChallenge ? 'challenge' : 'match',
        matchType: m.match_type 
      })));
      
      // Check if the target match exists in the loaded matches
      const targetMatch = allMatches.find(match => match.id === matchId);
      if (!targetMatch) {
        console.warn('❌ Target match not found in loaded matches:', matchId);
        console.warn('❌ Looking for ID:', matchId);
        console.warn('❌ In these IDs:', allMatches.map(m => m.id));
        return;
      }
      
      console.log('✅ Found target match:', {
        id: targetMatch.id,
        type: targetMatch.match_type,
        isInvitation: targetMatch.isInvitation,
        date: targetMatch.date
      });
      
      // Switch to matches tab if not already there (only when not manually navigating)
      if (activeTab !== 'matches') {
        console.log('🎯 Switching to matches tab for deep link...');
        setActiveTab('matches');
      }
      
      // Set target match for scrolling (no visual highlighting)
      console.log('🎯 Setting targetMatchId for scrolling:', matchId);
      setTargetMatchId(matchId);
    } else {
      console.log('🔍 Deep linking conditions not met');
    }
  }, [matchId, activeTab, allMatches, isManualNavigation]);
  const [memberSortBy, setMemberSortBy] = useState<'name' | 'wins' | 'matches' | 'joined' | 'ranking'>('name');
  const [memberFilterBy, setMemberFilterBy] = useState<'all' | 'active' | 'new'>('all');
  const [matchFilterType, setMatchFilterType] = useState<'all' | 'singles' | 'doubles'>('all');
  const [matchFilterDate, setMatchFilterDate] = useState<'all' | 'upcoming'>('all');
  const [matchFilterInvolvement, setMatchFilterInvolvement] = useState<'all' | 'my' | 'incomplete'>('all');

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
      
      // Removed: setPendingChallenges(pending);
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

  const loadClubDetails = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid club ID');
      setIsLoading(false);
      return;
    }

    try {
      // Load pending challenges for the current user
      if (user?.id) {
        await loadPendingChallenges();
        await loadChallengeCount();
      }
      
      // Get club details from Supabase
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clubError || !clubData) {
        console.error('Club not found:', clubError);
        setError('Club not found');
        setIsLoading(false);
        return;
      }
      
      setClub(clubData as Club);
      
      // Check if current user is the creator
      if (user?.id && (clubData as any).creator_id === user.id) {
        _setIsCreator(true);
      }
      
      // Get member count
      const { count: memberCount } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', id);
      
      setMemberCount(memberCount || 0);
      
      // Get club rankings using the match service
      let leaderboard: RankedPlayer[] = [];
      try {
        leaderboard = await getClubLeaderboard(id);
        console.log('🎾 ClubDetails: Fresh rankings loaded:', leaderboard.length, leaderboard.map(r => ({ id: r.id, rating: r.rating })));
        _setRankings(leaderboard);
      } catch (error) {
        console.error('Failed to load rankings:', error);
        _setRankings([]);
      }
      
      // Get recent matches for this club
      console.log('ClubDetails: Loading recent matches for club:', id);
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          *,
          player1:users!matches_player1_id_fkey(full_name),
          player2:users!matches_player2_id_fkey(full_name),
          player3:users!matches_player3_id_fkey(full_name),
          player4:users!matches_player4_id_fkey(full_name)
        `)
        .eq('club_id', id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      console.log('ClubDetails: Found matches:', matches?.length || 0, matches);
      console.log('ClubDetails: Processing matches...', matches?.map((m: any) => ({ id: m.id, scores: m.scores, player1_name: m.player1?.full_name || 'Unknown', player2_name: m.player2?.full_name || 'Unknown' })));
      
      // Process matches to determine winners and format for display
      const processedMatches = (matches || [])?.map((match: any) => {
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
        let player1DisplayName = match.player1?.full_name || 'Unknown Player';
        let player2DisplayName = match.player2?.full_name || match.opponent2_name || 'Unknown Opponent';
        
        if (match.match_type === 'doubles') {
          // For doubles, combine player names
          if (match.player3?.full_name || match.partner3_name) {
            player1DisplayName = `${player1DisplayName} & ${match.player3?.full_name || match.partner3_name || 'Unknown Partner'}`;
          }
          if (match.player4?.full_name || match.partner4_name) {
            player2DisplayName = `${player2DisplayName} & ${match.player4?.full_name || match.partner4_name || 'Unknown Partner'}`;
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
      _setRecentMatches(processedMatches);
      
      // Load all matches for the matches tab
      const { data: allMatchesData } = await supabase
        .from('matches')
        .select(`
          *,
          player1:users!matches_player1_id_fkey(full_name),
          player2:users!matches_player2_id_fkey(full_name),
          player3:users!matches_player3_id_fkey(full_name),
          player4:users!matches_player4_id_fkey(full_name)
        `)
        .eq('club_id', id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Also load active match invitations (looking to play) with responses
      // First run debug function to understand any issues
      const { data: debugInfo, error: debugError } = await debugMatchInvitations(id, user?.id);
      if (debugInfo && !debugError) {
        console.log('🔍 Match invitations debug info:', debugInfo);
      }
      
      // Use the new function to get match invitations reliably
      const { data: functionInvitations, error: invitationError } = await getClubMatchInvitations(id, user?.id);
      if (invitationError) {
        console.error('❌ Error getting match invitations:', invitationError);
      }
      
      // Convert function response to expected format and fetch creator ELO ratings
      const matchInvitations = await Promise.all((functionInvitations || []).map(async (inv) => {
        // Fetch creator's current ELO rating (since function doesn't include it)
        let creator_elo_rating = undefined;
        let creator_games_played = undefined;
        
        try {
          const { data: creatorData, error: creatorError } = await supabase
            .from('users')
            .select('elo_rating, games_played')
            .eq('id', inv.creator_id)
            .single();
            
          if (!creatorError && creatorData) {
            creator_elo_rating = creatorData.elo_rating;
            creator_games_played = creatorData.games_played;
            console.log('✅ Fetched ELO for creator:', inv.creator_full_name, '→', creatorData.elo_rating);
          } else {
            console.warn('⚠️ Could not fetch ELO for creator:', inv.creator_id, creatorError);
          }
        } catch (error) {
          console.warn('⚠️ Error fetching creator ELO:', error);
        }
        
        return {
          ...inv,
          creator: {
            full_name: inv.creator_full_name,
            phone: inv.creator_phone
          },
          // Parse responses from JSON
          responses: inv.responses || [],
          // Preserve targeted fields
          targeted_players: inv.targeted_players,
          targeted_player_names: inv.targeted_player_names,
          // Include fetched ELO rating
          creator_elo_rating,
          creator_games_played
        };
      }));

      // Filter out past invitations (dates before today)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      const activeInvitations = [];
      const pastInvitations = [];
      
      (matchInvitations || []).forEach((invitation: any) => {
        const invitationDate = new Date(invitation.date + 'T00:00:00'); // Parse date in local timezone
        
        // Check if invitation has passed the date
        if (invitationDate < today) {
          pastInvitations.push(invitation);
          return;
        }
        
        // Check if invitation has enough players to convene
        // const requiredPlayers = invitation.match_type === 'singles' ? 2 : 4;
        // const currentPlayers = 1; // Creator is always counted as 1 player
        // Note: We'll count actual responses after they're loaded
        
        activeInvitations.push(invitation);
      });

      console.log(`🔍 ClubDetails: Filtered invitations - Total: ${matchInvitations?.length || 0}, Active (not past): ${activeInvitations.length}, Past: ${pastInvitations.length}`);

      // Log past invitations (status update removed due to constraint issues)
      if (pastInvitations.length > 0) {
        const pastInvitationIds = pastInvitations.map(inv => inv.id);
        console.log(`🕰️ ClubDetails: Found ${pastInvitations.length} past invitations (auto-filtered):`, pastInvitationIds);
      }

      // No need to fetch responses separately - they're already included from our function
      const invitationsWithResponses = activeInvitations;

      // Filter out invitations that are for today/past and don't have enough players to convene
      const viableInvitations = [];
      const failedInvitations = [];
      
      invitationsWithResponses.forEach((invitation: any) => {
        const requiredPlayers = invitation.match_type === 'singles' ? 2 : 4;
        const currentPlayers = 1 + invitation.response_count; // Creator + response count from function
        const invitationDate = new Date(invitation.date + 'T00:00:00');
        const isToday = invitationDate.toDateString() === today.toDateString();
        const isTargetMatch = matchId && matchId === invitation.id;
        
        // If it's a future date, always show it (players can still join)
        // If it's today and has enough players, show it (match can happen)  
        // If it's today and doesn't have enough players, hide it (match can't happen)
        // EXCEPTION: Always show if it's the target match for deep linking
        if (invitationDate > today || (isToday && currentPlayers >= requiredPlayers) || isTargetMatch) {
          viableInvitations.push(invitation);
          if (isTargetMatch) {
            console.log('🎯 Including target match in viable invitations despite filtering rules');
          }
        } else if (isToday && currentPlayers < requiredPlayers) {
          failedInvitations.push(invitation);
        } else {
          viableInvitations.push(invitation); // fallback - keep showing
        }
      });

      console.log(`🔍 ClubDetails: Player count filtering - Viable: ${viableInvitations.length}, Failed to convene: ${failedInvitations.length}`);

      // Log failed invitations (status update removed due to constraint issues)
      if (failedInvitations.length > 0) {
        const failedIds = failedInvitations.map(inv => inv.id);
        console.log(`👥 ClubDetails: Found ${failedInvitations.length} failed invitations (auto-filtered):`, failedIds);
      }
      
      // Process completed matches
      const processedCompletedMatches = allMatchesData?.map((match: any) => {
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
        let player1DisplayName = match.player1?.full_name || 'Unknown Player';
        let player2DisplayName = match.player2?.full_name || match.opponent2_name || 'Unknown Opponent';
        
        if (match.match_type === 'doubles') {
          // For doubles, combine player names
          if (match.player3?.full_name || match.partner3_name) {
            player1DisplayName = `${player1DisplayName} & ${match.player3?.full_name || match.partner3_name || 'Unknown Partner'}`;
          }
          if (match.player4?.full_name || match.partner4_name) {
            player2DisplayName = `${player2DisplayName} & ${match.player4?.full_name || match.partner4_name || 'Unknown Partner'}`;
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

      // Process match invitations (looking to play) as upcoming matches - only viable ones
      console.log('🎯 Processing invitations for display:', viableInvitations.map(inv => ({
        id: inv.id,
        creator_name: inv.creator?.full_name,
        match_type: inv.match_type,
        date: inv.date,
        targeted_players: inv.targeted_players,
        targeted_player_names: inv.targeted_player_names
      })));
      const processedInvitations = viableInvitations.map((invitation: any) => ({
        id: invitation.id,
        player1_name: invitation.creator?.full_name || 'Unknown Player',
        player1_phone: invitation.creator?.phone,
        player2_name: 'Looking for opponent',
        opponent2_name: null,
        partner3_name: null,
        partner4_name: null,
        player1_id: invitation.creator_id,
        player2_id: null,
        player3_id: null,
        player4_id: null,
        scores: '',
        winner: null,
        match_type: invitation.match_type,
        date: invitation.date,
        time: invitation.time,
        location: invitation.location,
        notes: invitation.notes,
        status: invitation.status,
        created_at: invitation.created_at,
        responses: invitation.responses, // Include responses for grid display
        targeted_players: invitation.targeted_players, // Include targeted player IDs
        targeted_player_names: invitation.targeted_player_names, // Include targeted player names
        isInvitation: true, // Flag to distinguish from completed matches
        processed: true
      }));

      // Load accepted challenges for display
      console.log('🔍 ClubDetails: Loading challenges for club:', id);
      const acceptedChallenges = await challengeService.getClubChallenges(String(id));
      console.log('🔍 ClubDetails: All challenges loaded:', acceptedChallenges.length, acceptedChallenges.map(c => ({ id: c.id, status: c.status })));
      const acceptedOnly = acceptedChallenges.filter(challenge => challenge.status === 'accepted');
      console.log('🔍 ClubDetails: Accepted challenges found:', acceptedOnly.length, acceptedOnly.map(c => ({ id: c.id, status: c.status })));
      
      // Process challenges for display
      const processedChallenges = acceptedOnly.map((challenge: any) => ({
        id: challenge.id,
        player1_name: challenge.challenger_name || challenge.challenger?.full_name || 'Unknown',
        player2_name: challenge.challenged_name || challenge.challenged?.full_name || 'Unknown',
        player1_id: challenge.challenger_id,
        player2_id: challenge.challenged_id,
        player1_phone: challenge.challenger_phone,
        player2_phone: challenge.challenged_phone,
        scores: '', // No scores yet for challenges
        winner: null,
        match_type: challenge.match_type,
        date: challenge.proposed_date || challenge.created_at,
        time: challenge.proposed_time,
        location: club?.name || 'Tennis Club',
        notes: challenge.message,
        status: 'challenge',
        isChallenge: true, // Flag to identify challenges
      }));

      // Combine completed matches, invitations, and challenges
      console.log('🔍 ClubDetails: Processed challenges for display:', processedChallenges.length, processedChallenges.map(c => ({ id: c.id, isChallenge: c.isChallenge })));
      const allMatchesAndInvitations = [...processedCompletedMatches, ...processedInvitations, ...processedChallenges];
      console.log('🔍 ClubDetails: Combined all data - matches:', processedCompletedMatches.length, 'invitations:', processedInvitations.length, 'challenges:', processedChallenges.length, 'total:', allMatchesAndInvitations.length);
      
      setAllMatches(allMatchesAndInvitations);
      
      // Load club members
      const { data: membersData } = await supabase
        .from('club_members')
        .select(`
          joined_at,
          user:users (*)
        `)
        .eq('club_id', id)
        .order('joined_at', { ascending: false });

      // Process members data and add ranking information
      // Use the fresh leaderboard data instead of relying on state
      const processedMembers = (membersData || [])
        .filter((member: any) => member.user != null) // Filter out members with deleted user accounts
        .map((member: any) => {
          // Find ranking for this member - only players in the leaderboard array have played matches
          const rankedPlayer = leaderboard.find(rankedPlayer => rankedPlayer.id === member.user.id);
          console.log(`🎾 ClubDetails: Processing member ${member.user?.full_name || 'Unknown User'}, found ranking:`, rankedPlayer?.rating || 'unranked');
          
          return {
            ...member.user,
            joined_at: member.joined_at,
            match_count: rankedPlayer?.stats.totalMatches || 0,
            wins: rankedPlayer?.stats.wins || 0,
            ranking: rankedPlayer?.ranking || undefined, // Use the ranking from the rankedPlayer object if it exists
            eloRating: rankedPlayer?.rating || undefined, // Add ELO rating as the ranking score
          };
        });
      
      setClubMembers(processedMembers);
      
    } catch (err) {
      console.error('Failed to load club details:', err);
      setError('Failed to load club details');
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.id]);  // Simplified dependencies - removed matchId and club?.name

  // Set up realtime subscriptions using the new hook
  console.log('🔧 ClubDetail: About to call useClubRealtimeSubscriptions with clubId:', id, 'userId:', user?.id);
  const _realtimeSubscriptions = useClubRealtimeSubscriptions({
    clubId: id as string,
    userId: user?.id,
    onClubUpdate: loadClubDetails,
    onMembersUpdate: loadClubDetails,
    onMatchesUpdate: loadClubDetails,
    onEloUpdate: loadClubDetails,
  });

  useEffect(() => {
    loadClubDetails();
  }, [id, user?.id]);

  // Minimal focus refresh - real-time subscriptions handle most updates
  useFocusEffect(
    useCallback(() => {
      console.log('🎾 ClubDetails: Screen focused - real-time subscriptions active');
      // Most updates now handled by real-time subscriptions
      // Only refresh if data seems stale or on first focus
    }, [])
  );

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



  const handleEditClub = () => {
    // Navigate to edit club screen
    router.push(`/edit-club/${id}`);
  };

  const handleClaimMatch = async (matchId: string, playerPosition: 'player2' | 'player3' | 'player4') => {
    if (!user?.id) return;
    
    try {
      // Update the match to replace the unregistered player name with the current user's ID
      const updateColumn = playerPosition + '_id';
      const nameColumn = playerPosition === 'player2' ? 'opponent2_name' : 
                         playerPosition === 'player3' ? 'partner3_name' : 'partner4_name';
      
      const updateData: any = {
        [updateColumn]: user.id,
        [nameColumn]: null
      };
      
      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId);
      
      if (error) {
        console.error('Failed to claim match:', error);
        return;
      }
      
      // Reload matches to reflect the change
      loadClubDetails();
      
      // Show success message (you might want to add a toast/alert here)
      console.log('Match claimed successfully');
    } catch (error) {
      console.error('Failed to claim match:', error);
    }
  };

  const handleJoinInvitation = async (invitationId: string) => {
    if (!user?.id) return;
    
    // Prevent multiple concurrent join attempts
    if (joiningInvitations.has(invitationId)) {
      console.log('⏳ Already joining invitation:', invitationId);
      return;
    }
    
    try {
      setJoiningInvitations(prev => new Set(prev).add(invitationId));
      console.log('🎾 Joining invitation:', invitationId);
      
      // Create the response
      const response = await matchInvitationService.respondToInvitation(invitationId, user.id);
      console.log('✅ Response created:', response);
      
      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload matches to reflect the change
      await loadClubDetails();
      
      console.log('✅ Successfully joined match invitation');
    } catch (error) {
      console.error('❌ Failed to join match invitation:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to join match. Please try again.';
      if (error instanceof Error && error.message.includes('already responded')) {
        errorMessage = 'You have already responded to this invitation.';
      }
      
      // You might want to show a toast/alert here
      console.log('Error message for user:', errorMessage);
    } finally {
      setJoiningInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
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
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.tabIconDefault + '30' }]}>
        <TouchableOpacity
          testID="tab-overview"
          style={[
            styles.tab,
            activeTab === 'overview' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }
          ]}
          onPress={() => {
            console.log('🎯 Overview tab pressed, switching from', activeTab, 'to overview');
            setActiveTab('overview');
            // Prevent URL parameter effect from overriding manual navigation
            setIsManualNavigation(true);
            setHasInitializedFromURL(true);
          }}
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
          testID="tab-members"
          style={[
            styles.tab,
            activeTab === 'members' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }
          ]}
          onPress={() => {
            console.log('🎯 Members tab pressed, switching from', activeTab, 'to members');
            console.log('🎯 Before state changes:', { hasInitializedFromURL, isManualNavigation });
            setActiveTab('members');
            console.log('🎯 Active tab changed to members');
            // Prevent URL parameter effect from overriding manual navigation
            setIsManualNavigation(true);
            setHasInitializedFromURL(true);
            console.log('🎯 Manual navigation flags set - no router replace needed');
          }}
        >
          <ThemedText style={[styles.tabText, activeTab === 'members' && { color: colors.tint }]}>
            Members ({memberCount})
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          testID="tab-matches"
          style={[
            styles.tab,
            activeTab === 'matches' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }
          ]}
          onPress={() => {
            console.log('🎯 Matches tab pressed, switching from', activeTab, 'to matches');
            setActiveTab('matches');
            // Prevent URL parameter effect from overriding manual navigation
            setIsManualNavigation(true);
            setHasInitializedFromURL(true);
            // TEMP FIX: Manually refresh data when switching to matches tab
            console.log('🔄 ClubDetail: Manually refreshing data for matches tab');
            loadClubDetails();
          }}
        >
          <ThemedText style={[styles.tabText, activeTab === 'matches' && { color: colors.tint }]}>
            Matches
          </ThemedText>
        </TouchableOpacity>
      </View>

      <>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <ClubOverview
            club={club!}
            memberCount={memberCount}
            colors={colors}
            user={user}
            onViewAllMembers={() => setActiveTab('members')}
            onRecordMatch={handleRecordMatch}
            onInvitePlayers={() => {
              console.log('🎾 ClubDetailScreen: onInvitePlayers called - opening invite form modal');
              setShowInviteForm(true);
            }}
            onViewAllMatches={(matchId?: string) => {
              console.log('🎯 onViewAllMatches called with matchId:', matchId);
              if (matchId) {
                // Switch to matches tab and set target match for scrolling
                console.log('🎯 Switching to matches tab with target match:', matchId);
                setActiveTab('matches');
                setTargetMatchId(matchId);
                setIsManualNavigation(true);
                setHasInitializedFromURL(true);
              } else {
                // Just switch to matches tab without specific match
                console.log('🎯 Switching to matches tab without specific match');
                setActiveTab('matches');
                setIsManualNavigation(true);
                setHasInitializedFromURL(true);
              }
            }}
            onEditClub={handleEditClub}
          />
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <ClubMembers
            members={clubMembers}
            colors={colors}
            sortBy={memberSortBy}
            filterBy={memberFilterBy}
            onSortChange={setMemberSortBy}
            onFilterChange={setMemberFilterBy}
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
            filterInvolvement={matchFilterInvolvement}
            onFilterTypeChange={setMatchFilterType}
            onFilterDateChange={setMatchFilterDate}
            onFilterInvolvementChange={setMatchFilterInvolvement}
            onClaimMatch={handleClaimMatch}
            onRecordMatch={handleRecordMatch}
            onJoinInvitation={handleJoinInvitation}
            joiningInvitations={joiningInvitations}
            currentUserId={user?.id}
            targetMatchId={(() => {
              console.log('🎯 ClubDetailScreen: Passing targetMatchId to ClubMatches:', {
                targetMatchId,
                type: typeof targetMatchId,
                length: targetMatchId?.length,
                allMatchesLength: allMatches?.length
              });
              return targetMatchId;
            })()}
          />
        )}

        {/* Match Invitation Modal */}
        {user && (
          <Modal
            visible={showInviteForm}
            animationType="slide"
            presentationStyle="pageSheet"
            onShow={() => console.log('🎾 ClubDetailScreen: Modal is now visible, showing MatchInvitationForm')}
          >
            <MatchInvitationForm
              clubId={id as string}
              creatorId={user.id}
              onClose={() => {
                console.log('🔄 ClubDetailScreen: Closing invite form modal');
                setShowInviteForm(false);
              }}
              onSuccess={async (invitationId: string) => {
                console.log('🔄 ClubDetailScreen: Invitation created successfully, navigating to matches tab with ID:', invitationId);
                console.log('🔄 ClubDetailScreen: Invitation ID type:', typeof invitationId);
                console.log('🔄 ClubDetailScreen: Invitation ID length:', invitationId?.length);
                setShowInviteForm(false);
                
                // Reload matches data to include the new invitation before navigating
                console.log('🔄 ClubDetailScreen: Refreshing matches data before navigation...');
                await loadClubDetails();
                
                console.log('🔄 ClubDetailScreen: After loadClubDetails, allMatches length:', allMatches?.length);
                console.log('🔄 ClubDetailScreen: Looking for invitation with ID:', invitationId);
                
                // Check if the new invitation is in the loaded data
                const foundInvitation = allMatches?.find(match => match.id === invitationId);
                if (foundInvitation) {
                  console.log('✅ ClubDetailScreen: Found newly created invitation in allMatches:', {
                    id: foundInvitation.id,
                    match_type: foundInvitation.match_type,
                    isInvitation: foundInvitation.isInvitation,
                    date: foundInvitation.date
                  });
                } else {
                  console.warn('⚠️ ClubDetailScreen: Newly created invitation NOT found in allMatches!');
                  console.warn('⚠️ ClubDetailScreen: Available match IDs:', allMatches?.slice(0, 5).map(m => ({
                    id: m.id, 
                    type: m.match_type, 
                    isInvitation: m.isInvitation
                  })));
                }
                
                // Navigate to matches tab and highlight the new invitation
                console.log('🔄 ClubDetailScreen: Setting active tab to matches and navigating...');
                setActiveTab('matches');
                // Update URL to reflect the new tab and match
                router.replace(`/club/${id}?tab=matches&matchId=${invitationId}`);
                console.log('🔄 ClubDetailScreen: Navigation completed with matchId:', invitationId);
              }}
            />
          </Modal>
        )}
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
    paddingHorizontal: IOSSpacing.contentMargin,
    paddingVertical: IOSSpacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: IOSColors.systemGray5,
  },
  backButton: {
    ...IOSStyles.backButton,
  },
  headerTitle: {
    ...IOSStyles.headerTitle,
    flex: 1,
    marginHorizontal: IOSSpacing.standard,
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
    ...IOSStyles.loadingText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...IOSStyles.contentContainer,
  },
  errorText: {
    ...IOSTypography.body,
    marginBottom: IOSSpacing.comfortable,
    textAlign: 'center',
  },
  button: {
    ...IOSStyles.primaryButton,
  },
  buttonText: {
    color: 'white',
    ...IOSTypography.body,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: IOSColors.systemGray5,
  },
  tab: {
    flex: 1,
    ...IOSStyles.listItem,
    alignItems: 'center',
  },
  tabText: {
    ...IOSTypography.subheadline,
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