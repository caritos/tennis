import { supabase, Match } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';
import { calculateEloRatings, calculateDoublesEloRatings } from '../utils/eloRating';

export interface CreateMatchData {
  club_id: string;
  player1_id: string;
  player2_id?: string | null;
  opponent2_name?: string | null;
  player3_id?: string | null;
  partner3_name?: string | null;
  player4_id?: string | null;
  partner4_name?: string | null;
  scores: string;
  match_type: 'singles' | 'doubles';
  date: string;
  notes?: string | null;
  invitation_id?: string; // Link to match invitation if created from invitation
}

export interface UpdateMatchData {
  club_id?: string;
  player1_id?: string;
  player2_id?: string | null;
  opponent2_name?: string | null;
  player3_id?: string | null;
  partner3_name?: string | null;
  player4_id?: string | null;
  partner4_name?: string | null;
  scores?: string;
  match_type?: 'singles' | 'doubles';
  date?: string;
  notes?: string | null;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  singlesRecord: { wins: number; losses: number; winPercentage: number };
  doublesRecord: { wins: number; losses: number; winPercentage: number };
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

export interface RankedPlayer {
  id: string;
  name: string;
  ranking: number;
  rating: number;
  points?: number;
  playerId?: string;
  playerName?: string;
  isProvisional?: boolean;
  stats: {
    wins: number;
    losses: number;
    totalMatches: number;
    winRate: number;
    winPercentage: number;
  };
}

/**
 * MatchService - Direct Supabase integration without local SQLite
 */
/**
 * Helper function to determine match winner from scores
 * @param scores Match scores like "6-4,7-5" 
 * @returns 1 if player1/team1 won, 2 if player2/team2 won
 */
function determineMatchWinner(scores: string): number {
  const sets = scores.split(',');
  let player1Sets = 0;
  let player2Sets = 0;
  
  sets.forEach(set => {
    const cleanSet = set.replace(/\([^)]*\)/g, '').trim(); // Remove tiebreak notation
    const [p1Score, p2Score] = cleanSet.split('-').map(s => parseInt(s));
    if (p1Score > p2Score) {
      player1Sets++;
    } else if (p2Score > p1Score) {
      player2Sets++;
    }
  });
  
  return player1Sets > player2Sets ? 1 : 2;
}

/**
 * Update player ELO ratings after a match using secure database function
 * This bypasses RLS policies that prevent updating other users' ratings
 */
async function updatePlayerRatings(
  winnerId: string,
  loserId: string,
  winnerRatingChange: number,
  loserRatingChange: number,
  winnerNewRating: number,
  loserNewRating: number,
  winnerGamesPlayed: number = 0,
  loserGamesPlayed: number = 0
): Promise<void> {
  console.log('🔧 Updating player ratings using secure database function...');
  console.log(`Winner ${winnerId}: ${winnerNewRating} (${winnerRatingChange > 0 ? '+' : ''}${winnerRatingChange})`);
  console.log(`Loser ${loserId}: ${loserNewRating} (${loserRatingChange})`);
  
  console.log('🔧 RPC parameters:', {
    p_winner_id: winnerId,
    p_loser_id: loserId,
    p_winner_new_rating: winnerNewRating,
    p_loser_new_rating: loserNewRating,
    p_winner_games_played: winnerGamesPlayed,
    p_loser_games_played: loserGamesPlayed
  });

  try {
    // Use the secure database function to update ratings
    console.log('🔧 Calling supabase.rpc("update_player_ratings", ...)');
    const { data, error } = await supabase.rpc('update_player_ratings', {
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_winner_new_rating: winnerNewRating,
      p_loser_new_rating: loserNewRating,
      p_winner_games_played: winnerGamesPlayed,
      p_loser_games_played: loserGamesPlayed
    });

    console.log('🔧 RPC response - data:', data, 'error:', error);

    if (error) {
      console.error('❌ Failed to update ratings via database function:', error);
      console.error('❌ RPC error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to update player ratings: ${error.message}`);
    }

    console.log(`✅ Updated ratings via secure function: Winner ${winnerId} (${winnerRatingChange > 0 ? '+' : ''}${winnerRatingChange}), Loser ${loserId} (${loserRatingChange})`);
  } catch (error) {
    console.error('❌ Rating update failed:', error);
    console.error('❌ Catch block error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

export class MatchService {

  async createMatch(matchData: CreateMatchData): Promise<Match> {
    console.log('🎾 Creating match with ELO rating updates...');
    console.log('🎾 Match data:', JSON.stringify(matchData, null, 2));
    
    const matchId = generateUUID();
    
    const newMatch = {
      id: matchId,
      club_id: matchData.club_id,
      player1_id: matchData.player1_id,
      player2_id: matchData.player2_id || null,
      opponent2_name: matchData.opponent2_name || null,
      player3_id: matchData.player3_id || null,
      partner3_name: matchData.partner3_name || null,
      player4_id: matchData.player4_id || null,
      partner4_name: matchData.partner4_name || null,
      scores: matchData.scores,
      match_type: matchData.match_type,
      date: matchData.date,
      notes: matchData.notes || null,
      created_at: new Date().toISOString()
    };

    try {
      // First, create the match
      const { data: match, error } = await supabase
        .from('matches')
        .insert(newMatch)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create match:', error);
        throw new Error(`Failed to create match: ${error.message}`);
      }

      console.log('✅ Match created successfully:', match);
      console.log('🎾 Now checking if we should update ELO ratings...');
      
      console.log('🎾 Rating update conditions:');
      console.log('  - Has scores:', !!matchData.scores);
      console.log('  - Has player2_id:', !!matchData.player2_id);
      console.log('  - Has opponent2_name:', !!matchData.opponent2_name);
      console.log('  - Match type:', matchData.match_type);

      // Update ELO ratings for registered players only
      if (matchData.scores && (matchData.player2_id || matchData.opponent2_name)) {
        console.log('✅ Conditions met - proceeding with rating updates...');
        await this.updateMatchRatings(match);
      } else {
        console.log('⚠️ Skipping rating update: incomplete match data or missing opponent');
        console.log('  - Scores present:', !!matchData.scores);
        console.log('  - Opponent present:', !!(matchData.player2_id || matchData.opponent2_name));
      }

      return match;

    } catch (error) {
      console.error('❌ Match creation failed:', error);
      throw error;
    }
  }

  /**
   * Update ELO ratings for players in a match
   */
  private async updateMatchRatings(match: Match): Promise<void> {
    console.log('🎾 Starting updateMatchRatings for match:', match.id);
    console.log('🎾 Match details:', {
      match_type: match.match_type,
      scores: match.scores,
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      opponent2_name: match.opponent2_name,
      player3_id: match.player3_id,
      player4_id: match.player4_id
    });
    
    try {
      const winner = determineMatchWinner(match.scores);
      console.log('🎾 Match winner determined:', winner === 1 ? 'Player 1/Team 1' : 'Player 2/Team 2');
      
      if (match.match_type === 'singles') {
        console.log('🎾 Processing singles match ratings...');
        await this.updateSinglesRatings(match, winner);
      } else {
        console.log('🎾 Processing doubles match ratings...');
        await this.updateDoublesRatings(match, winner);
      }
      
      console.log('✅ Match ratings update completed successfully');
    } catch (error) {
      console.error('❌ Failed to update match ratings:', error);
      console.error('❌ Error details:', error);
      // Don't throw here - match is already created, rating update failure shouldn't block
      console.warn('⚠️ Match created but rating update failed. Ratings may be out of sync.');
    }
  }

  /**
   * Update ratings for singles match
   */
  private async updateSinglesRatings(match: Match, winner: number): Promise<void> {
    console.log('🎾 updateSinglesRatings called with winner:', winner);
    console.log('🎾 Player1 ID (recorder):', match.player1_id);
    console.log('🎾 Player2 ID (opponent):', match.player2_id);
    console.log('🎾 Opponent2 name:', match.opponent2_name);
    
    // Only update ratings if player1 (the person recording) is a registered user
    if (!match.player1_id) {
      console.log('⚠️ Cannot update ratings: player1 (recorder) is not registered');
      return;
    }

    // If opponent is unregistered, we'll use a default rating for calculation but only update player1
    if (!match.player2_id) {
      console.log('⚠️ Player2 is unregistered, updating only player1 rating against default opponent');
      console.log('🎾 Calling updateSinglePlayerRating for player:', match.player1_id, 'won:', winner === 1);
      await this.updateSinglePlayerRating(match.player1_id, winner === 1, match.scores);
      return;
    }

    // Get current ratings for both players
    const { data: players, error } = await supabase
      .from('users')
      .select('id, elo_rating, games_played')
      .in('id', [match.player1_id, match.player2_id]);

    if (error || !players || players.length !== 2) {
      console.error('❌ Failed to get player ratings:', error);
      return;
    }

    const player1 = players.find(p => p.id === match.player1_id)!;
    const player2 = players.find(p => p.id === match.player2_id)!;

    // Determine winner and loser
    const winnerData = winner === 1 ? player1 : player2;
    const loserData = winner === 1 ? player2 : player1;

    // Calculate new ratings
    const ratingChanges = calculateEloRatings(
      {
        rating: winnerData.elo_rating || 1200,
        gamesPlayed: winnerData.games_played || 0
      },
      {
        rating: loserData.elo_rating || 1200,
        gamesPlayed: loserData.games_played || 0
      },
      match.scores
    );

    // Update player ratings
    await updatePlayerRatings(
      winnerData.id,
      loserData.id,
      ratingChanges.winnerRatingChange,
      ratingChanges.loserRatingChange,
      ratingChanges.winnerNewRating,
      ratingChanges.loserNewRating,
      winnerData.games_played || 0,
      loserData.games_played || 0
    );

    console.log(`✅ Singles ratings updated: ${winnerData.id} (+${ratingChanges.winnerRatingChange}), ${loserData.id} (${ratingChanges.loserRatingChange})`);
  }

  /**
   * Update ratings for doubles match
   */
  private async updateDoublesRatings(match: Match, winner: number): Promise<void> {
    // Get all registered player IDs
    const playerIds = [match.player1_id, match.player2_id, match.player3_id, match.player4_id]
      .filter(id => id !== null) as string[];

    if (playerIds.length < 2) {
      console.log('⚠️ Cannot update ratings: need at least 2 registered players for doubles');
      return;
    }

    // Get current ratings for all registered players
    const { data: players, error } = await supabase
      .from('users')
      .select('id, elo_rating, games_played')
      .in('id', playerIds);

    if (error || !players) {
      console.error('❌ Failed to get player ratings:', error);
      return;
    }

    // Organize players by teams
    const team1Players = [];
    const team2Players = [];

    // Team 1: player1 and player3
    if (match.player1_id) {
      const p1 = players.find(p => p.id === match.player1_id);
      if (p1) team1Players.push({ 
        id: p1.id,
        rating: p1.elo_rating || 1200, 
        gamesPlayed: p1.games_played || 0 
      });
    }
    if (match.player3_id) {
      const p3 = players.find(p => p.id === match.player3_id);
      if (p3) team1Players.push({ 
        id: p3.id,
        rating: p3.elo_rating || 1200, 
        gamesPlayed: p3.games_played || 0 
      });
    }

    // Team 2: player2 and player4  
    if (match.player2_id) {
      const p2 = players.find(p => p.id === match.player2_id);
      if (p2) team2Players.push({ 
        id: p2.id,
        rating: p2.elo_rating || 1200, 
        gamesPlayed: p2.games_played || 0 
      });
    }
    if (match.player4_id) {
      const p4 = players.find(p => p.id === match.player4_id);
      if (p4) team2Players.push({ 
        id: p4.id,
        rating: p4.elo_rating || 1200, 
        gamesPlayed: p4.games_played || 0 
      });
    }

    if (team1Players.length === 0 || team2Players.length === 0) {
      console.log('⚠️ Cannot update ratings: need at least one registered player on each team');
      return;
    }

    // Calculate doubles rating changes
    const team1Won = winner === 1;
    const allPlayers = [...team1Players, ...team2Players];
    const ratingResults = calculateDoublesEloRatings(team1Players, team2Players, team1Won);

    // Update each registered player's rating
    const updatePromises = allPlayers.map(async (player, index) => {
      const result = ratingResults[index];
      if (result) {
        await supabase
          .from('users')
          .update({
            elo_rating: result.newRating,
            games_played: player.gamesPlayed + 1
          })
          .eq('id', player.id);

        console.log(`✅ Doubles rating updated: ${player.id} (${result.ratingChange > 0 ? '+' : ''}${result.ratingChange})`);
      }
    });

    await Promise.all(updatePromises);
    console.log(`✅ Doubles ratings updated for ${allPlayers.length} players`);
  }

  async updateMatch(matchId: string, updateData: UpdateMatchData): Promise<Match> {
    console.log('📝 Updating match:', matchId);

    try {
      const { data: match, error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update match:', error);
        throw new Error(`Failed to update match: ${error.message}`);
      }

      console.log('✅ Match updated successfully');
      return match;

    } catch (error) {
      console.error('❌ Match update failed:', error);
      throw error;
    }
  }

  async getMatch(matchId: string): Promise<Match | null> {
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        console.error('❌ Failed to get match:', error);
        throw new Error(`Failed to get match: ${error.message}`);
      }

      return match;

    } catch (error) {
      console.error('❌ Get match failed:', error);
      throw error;
    }
  }

  async getClubMatches(clubId: string): Promise<Match[]> {
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .eq('club_id', clubId)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Failed to get club matches:', error);
        throw new Error(`Failed to get matches: ${error.message}`);
      }

      return matches || [];

    } catch (error) {
      console.error('❌ Get club matches failed:', error);
      throw error;
    }
  }

  async getUserMatches(userId: string, clubId?: string): Promise<Match[]> {
    try {
      let query = supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId},player3_id.eq.${userId},player4_id.eq.${userId}`)
        .order('date', { ascending: false });

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data: matches, error } = await query;

      if (error) {
        console.error('❌ Failed to get user matches:', error);
        throw new Error(`Failed to get matches: ${error.message}`);
      }

      return matches || [];

    } catch (error) {
      console.error('❌ Get user matches failed:', error);
      throw error;
    }
  }

  async deleteMatch(matchId: string): Promise<void> {
    console.log('🗑️ Deleting match:', matchId);

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) {
        console.error('❌ Failed to delete match:', error);
        throw new Error(`Failed to delete match: ${error.message}`);
      }

      console.log('✅ Match deleted successfully');

    } catch (error) {
      console.error('❌ Match deletion failed:', error);
      throw error;
    }
  }

  async getMatchStats(playerId: string, clubId?: string): Promise<PlayerStats> {
    try {
      const matches = await this.getUserMatches(playerId, clubId);
      
      let wins = 0;
      let losses = 0;

      matches.forEach(match => {
        const isPlayer1 = match.player1_id === playerId;
        const isPlayer3 = match.player3_id === playerId;
        
        // Simple win/loss logic based on first set score
        // This would need to be enhanced for proper tennis scoring
        const scores = match.scores.split(',')[0]; // First set
        const [score1, score2] = scores.split('-').map(Number);
        
        if (isPlayer1 || isPlayer3) {
          if (score1 > score2) wins++;
          else losses++;
        } else {
          if (score2 > score1) wins++;
          else losses++;
        }
      });

      // Calculate detailed stats
      let singlesWins = 0, singlesLosses = 0;
      let doublesWins = 0, doublesLosses = 0;
      let setsWon = 0, setsLost = 0;
      let gamesWon = 0, gamesLost = 0;

      matches.forEach(match => {
        const isPlayer1 = match.player1_id === playerId;
        const isPlayer3 = match.player3_id === playerId;
        
        const sets = match.scores?.split(',') || [];
        sets.forEach(set => {
          const scores = set.replace(/\([^)]*\)/g, '').split('-');
          const score1 = parseInt(scores[0]) || 0;
          const score2 = parseInt(scores[1]) || 0;
          
          if (isPlayer1 || isPlayer3) {
            setsWon += score1 > score2 ? 1 : 0;
            setsLost += score2 > score1 ? 1 : 0;
            gamesWon += score1;
            gamesLost += score2;
          } else {
            setsWon += score2 > score1 ? 1 : 0;
            setsLost += score1 > score2 ? 1 : 0;
            gamesWon += score2;
            gamesLost += score1;
          }
        });

        // Track singles vs doubles wins/losses
        const won = (isPlayer1 || isPlayer3) ? 
          (sets.reduce((acc, set) => {
            const scores = set.replace(/\([^)]*\)/g, '').split('-');
            return acc + (parseInt(scores[0]) > parseInt(scores[1]) ? 1 : 0);
          }, 0) > sets.length / 2) :
          (sets.reduce((acc, set) => {
            const scores = set.replace(/\([^)]*\)/g, '').split('-');
            return acc + (parseInt(scores[1]) > parseInt(scores[0]) ? 1 : 0);
          }, 0) > sets.length / 2);

        if (match.match_type === 'singles') {
          if (won) singlesWins++; else singlesLosses++;
        } else {
          if (won) doublesWins++; else doublesLosses++;
        }
      });

      const totalMatches = matches.length;
      const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
      const singlesTotal = singlesWins + singlesLosses;
      const doublesTotal = doublesWins + doublesLosses;

      return {
        totalMatches,
        wins,
        losses,
        winPercentage,
        singlesRecord: {
          wins: singlesWins,
          losses: singlesLosses,
          winPercentage: singlesTotal > 0 ? (singlesWins / singlesTotal) * 100 : 0
        },
        doublesRecord: {
          wins: doublesWins,
          losses: doublesLosses,
          winPercentage: doublesTotal > 0 ? (doublesWins / doublesTotal) * 100 : 0
        },
        setsWon,
        setsLost,
        gamesWon,
        gamesLost
      };

    } catch (error) {
      console.error('❌ Get match stats failed:', error);
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winPercentage: 0,
        singlesRecord: { wins: 0, losses: 0, winPercentage: 0 },
        doublesRecord: { wins: 0, losses: 0, winPercentage: 0 },
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0
      };
    }
  }

  /**
   * Update rating for a single player (when playing against unregistered opponent)
   */
  private async updateSinglePlayerRating(playerId: string, playerWon: boolean, scores: string): Promise<void> {
    console.log('🎾 updateSinglePlayerRating called:');
    console.log('  - Player ID:', playerId);
    console.log('  - Player won:', playerWon);
    console.log('  - Scores:', scores);
    
    try {
      // Get current rating for the player
      console.log('🎾 Fetching current player data from database...');
      const { data: player, error } = await supabase
        .from('users')
        .select('id, elo_rating, games_played')
        .eq('id', playerId)
        .single();

      if (error || !player) {
        console.error('❌ Failed to get player rating:', error);
        return;
      }

      console.log('🎾 Current player data:', player);

      // Use default rating (1200) for unregistered opponent
      const DEFAULT_OPPONENT_RATING = 1200;
      const playerRating = player.elo_rating || 1200;
      const playerGamesPlayed = player.games_played || 0;

      console.log('🎾 Rating calculation inputs:');
      console.log('  - Player rating:', playerRating);
      console.log('  - Player games played:', playerGamesPlayed);
      console.log('  - Opponent rating (default):', DEFAULT_OPPONENT_RATING);

      // Calculate new rating using ELO system
      const ratingChanges = playerWon ?
        calculateEloRatings(
          { rating: playerRating, gamesPlayed: playerGamesPlayed }, // Winner (player)
          { rating: DEFAULT_OPPONENT_RATING, gamesPlayed: 10 }, // Loser (guest)
          scores
        ) :
        calculateEloRatings(
          { rating: DEFAULT_OPPONENT_RATING, gamesPlayed: 10 }, // Winner (guest)
          { rating: playerRating, gamesPlayed: playerGamesPlayed }, // Loser (player)
          scores
        );

      console.log('🎾 ELO calculation results:', ratingChanges);

      const newRating = playerWon ? 
        ratingChanges.winnerNewRating : 
        ratingChanges.loserNewRating;
        
      console.log('🎾 New rating calculated:', newRating, '(change:', Math.round(newRating - playerRating), ')');

      // Update player's rating - user can update their own profile via RLS
      const change = Math.round(newRating - playerRating);
      console.log('🎾 Attempting database update:');
      console.log('  - Player ID:', playerId);
      console.log('  - New ELO rating:', Math.round(newRating));
      console.log('  - New games played:', playerGamesPlayed + 1);
      console.log('  - Rating change:', change);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          elo_rating: Math.round(newRating),
          games_played: playerGamesPlayed + 1
        })
        .eq('id', playerId);

      if (updateError) {
        console.error('❌ Failed to update player rating:', updateError);
        console.error('❌ Update error details:', JSON.stringify(updateError, null, 2));
        console.error('❌ This suggests an RLS policy issue or authentication problem');
      } else {
        console.log(`✅ Single player rating updated successfully: ${playerId} (${change > 0 ? '+' : ''}${change})`);
        console.log('🎾 Database update completed - rating should now be:', Math.round(newRating));
      }

    } catch (error) {
      console.error('❌ Failed to update single player rating:', error);
    }
  }
}

// Create singleton instance
const matchService = new MatchService();

// Export service functions
export const createMatch = (matchData: CreateMatchData) => matchService.createMatch(matchData);
export const updateMatch = (matchId: string, updateData: UpdateMatchData) => matchService.updateMatch(matchId, updateData);
export const getMatch = (matchId: string) => matchService.getMatch(matchId);
export const getClubMatches = (clubId: string) => matchService.getClubMatches(clubId);
export const getUserMatches = (userId: string, clubId?: string) => matchService.getUserMatches(userId, clubId);
export const deleteMatch = (matchId: string) => matchService.deleteMatch(matchId);
export const getMatchStats = (playerId: string, clubId?: string) => matchService.getMatchStats(playerId, clubId);

// Alias exports for backward compatibility
export const getMatchHistory = (playerId: string, clubId?: string) => matchService.getUserMatches(playerId, clubId);
export const getClubLeaderboard = async (clubId: string): Promise<RankedPlayer[]> => {
  try {
    // Get all matches for the club
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:users!player1_id(id, full_name),
        player2:users!player2_id(id, full_name),
        player3:users!player3_id(id, full_name),
        player4:users!player4_id(id, full_name)
      `)
      .eq('club_id', clubId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to fetch matches for leaderboard:', error);
      return [];
    }

    if (!matches || matches.length === 0) {
      return [];
    }

    // Get all club members with their ELO ratings
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select(`
        users (id, full_name, elo_rating, games_played)
      `)
      .eq('club_id', clubId);

    if (membersError) {
      console.error('Failed to fetch members for leaderboard:', membersError);
      return [];
    }

    // Create a map to track player statistics
    const playerStats = new Map<string, {
      id: string;
      name: string;
      wins: number;
      losses: number;
      totalMatches: number;
      winRate: number;
      eloRating: number;
      gamesPlayed: number;
    }>();

    // Initialize all members in the stats map
    (members || []).forEach((member: any) => {
      if (member.users) {
        playerStats.set(member.users.id, {
          id: member.users.id,
          name: member.users.full_name,
          wins: 0,
          losses: 0,
          totalMatches: 0,
          winRate: 0,
          eloRating: member.users.elo_rating || 1200,
          gamesPlayed: member.users.games_played || 0,
        });
      }
    });

    // Process each match to calculate wins and losses
    matches.forEach((match: any) => {
      // Determine winner based on scores
      const scores = match.scores.split(',');
      let player1Sets = 0;
      let player2Sets = 0;
      
      scores.forEach((set: string) => {
        const cleanSet = set.replace(/\([^)]*\)/g, '').trim();
        const [p1Score, p2Score] = cleanSet.split('-').map(s => parseInt(s));
        if (p1Score > p2Score) {
          player1Sets++;
        } else if (p2Score > p1Score) {
          player2Sets++;
        }
      });
      
      const player1Won = player1Sets > player2Sets;

      // Update stats for singles matches
      if (match.match_type === 'singles') {
        // Player 1 - always count if they're a registered user
        if (match.player1_id && playerStats.has(match.player1_id)) {
          const stats = playerStats.get(match.player1_id)!;
          stats.totalMatches++;
          if (player1Won) {
            stats.wins++;
          } else {
            stats.losses++;
          }
          stats.winRate = stats.wins / stats.totalMatches;
        }

        // Player 2 - only count if they're a registered user (not a guest)
        if (match.player2_id && playerStats.has(match.player2_id)) {
          const stats = playerStats.get(match.player2_id)!;
          stats.totalMatches++;
          if (!player1Won) {
            stats.wins++;
          } else {
            stats.losses++;
          }
          stats.winRate = stats.wins / stats.totalMatches;
        }
        // Note: Matches against guests (where player2_id is null but opponent2_name exists) 
        // are now properly counted for player1 above
      } else if (match.match_type === 'doubles') {
        // Update stats for all 4 players in doubles
        const winningPlayers = player1Won 
          ? [match.player1_id, match.player3_id]
          : [match.player2_id, match.player4_id];
        const losingPlayers = player1Won
          ? [match.player2_id, match.player4_id]
          : [match.player1_id, match.player3_id];

        winningPlayers.forEach(playerId => {
          if (playerId && playerStats.has(playerId)) {
            const stats = playerStats.get(playerId)!;
            stats.totalMatches++;
            stats.wins++;
            stats.winRate = stats.wins / stats.totalMatches;
          }
        });

        losingPlayers.forEach(playerId => {
          if (playerId && playerStats.has(playerId)) {
            const stats = playerStats.get(playerId)!;
            stats.totalMatches++;
            stats.losses++;
            stats.winRate = stats.wins / stats.totalMatches;
          }
        });
      }
    });

    // Convert to array and sort by ELO rating (highest first)
    const rankedPlayers: RankedPlayer[] = Array.from(playerStats.values())
      .filter(player => player.totalMatches > 0) // Only include players who have played
      .sort((a, b) => {
        // Sort by ELO rating (highest first)
        return b.eloRating - a.eloRating;
      })
      .map((player, index) => ({
        id: player.id,
        name: player.name,
        ranking: index + 1,
        rating: player.eloRating,
        points: player.eloRating, // Use ELO rating as points for now
        playerId: player.id,
        playerName: player.name,
        isProvisional: player.gamesPlayed < 5, // Players with less than 5 games are provisional
        stats: {
          wins: player.wins,
          losses: player.losses,
          totalMatches: player.totalMatches,
          winRate: Math.round(player.winRate * 100),
          winPercentage: Math.round(player.winRate * 100),
        },
      }));

    console.log(`✅ Generated leaderboard for club ${clubId} with ${rankedPlayers.length} ranked players`);
    return rankedPlayers;
  } catch (error) {
    console.error('Failed to generate club leaderboard:', error);
    return [];
  }
};
export const recordMatch = (matchData: CreateMatchData) => {
  console.log('🎾 recordMatch called with data:', JSON.stringify(matchData, null, 2));
  console.log('🎾 Calling matchService.createMatch...');
  return matchService.createMatch(matchData);
};

export default matchService;