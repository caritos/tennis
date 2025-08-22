// Simplified loadClubDetails function using direct Supabase
const loadClubDetails = async () => {
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
    
    setClub(clubData);
    
    // Check if current user is the creator
    if (user?.id && clubData.creator_id === user.id) {
      setIsCreator(true);
    }
    
    // Get member count
    const { count: memberCount } = await supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', id);
    
    setMemberCount(memberCount || 0);
    
    // Get club rankings using the match service
    try {
      const leaderboard = await getClubLeaderboard(id);
      setRankings(leaderboard);
    } catch (error) {
      console.error('Failed to load rankings:', error);
      setRankings([]);
    }
    
    // Get recent matches with player names
    const { data: recentMatchesData } = await supabase
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

    // Process recent matches
    const processedRecentMatches = (recentMatchesData || []).map((match: any) => {
      const sets = match.scores?.split(',') || [];
      let player1Sets = 0;
      let player2Sets = 0;
      
      sets.forEach((set: string) => {
        const scores = set.replace(/\([^)]*\)/g, '').split('-');
        const p1Score = parseInt(scores[0]) || 0;
        const p2Score = parseInt(scores[1]) || 0;
        
        if (p1Score > p2Score) {
          player1Sets++;
        } else {
          player2Sets++;
        }
      });
      
      const winner = player1Sets > player2Sets ? 1 : 2;
      
      // Format player names
      let player1DisplayName = match.player1?.full_name || 'Unknown Player';
      let player2DisplayName = match.player2?.full_name || match.opponent2_name || 'Unknown Opponent';
      
      if (match.match_type === 'doubles') {
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
    });
    
    setRecentMatches(processedRecentMatches);
    
    // Get all matches for matches tab
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

    // Process all matches (same logic as recent matches)
    const processedAllMatches = (allMatchesData || []).map((match: any) => {
      // ... same processing logic as above
      const sets = match.scores?.split(',') || [];
      let player1Sets = 0;
      let player2Sets = 0;
      
      sets.forEach((set: string) => {
        const scores = set.replace(/\([^)]*\)/g, '').split('-');
        const p1Score = parseInt(scores[0]) || 0;
        const p2Score = parseInt(scores[1]) || 0;
        
        if (p1Score > p2Score) {
          player1Sets++;
        } else {
          player2Sets++;
        }
      });
      
      const winner = player1Sets > player2Sets ? 1 : 2;
      
      let player1DisplayName = match.player1?.full_name || 'Unknown Player';
      let player2DisplayName = match.player2?.full_name || match.opponent2_name || 'Unknown Opponent';
      
      if (match.match_type === 'doubles') {
        if (match.player3?.full_name || match.partner3_name) {
          player1DisplayName = `${player1DisplayName} & ${match.player3?.full_name || match.partner3_name}`;
        }
        if (match.player4?.full_name || match.partner4_name) {
          player2DisplayName = `${player2DisplayName} & ${match.player4?.full_name || match.partner4_name}`;
        }
      }
      
      return {
        ...match,
        player1_name: player1DisplayName,
        player2_name: player2DisplayName,
        winner,
        processed: true
      };
    });
    
    setAllMatches(processedAllMatches);
    
    // Get club members with match counts
    const { data: membersData } = await supabase
      .from('club_members')
      .select(`
        joined_at,
        users (*)
      `)
      .eq('club_id', id);

    const processedMembers = (membersData || []).map((member: any) => ({
      ...member.users,
      joined_at: member.joined_at,
      match_count: 0, // TODO: Calculate match count
      wins: 0 // TODO: Calculate wins
    }));
    
    setMembers(processedMembers);
    setIsLoading(false);
    
  } catch (error) {
    console.error('Failed to load club details:', error);
    setError('Failed to load club details');
    setIsLoading(false);
  }
};