import { supabase, Match } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';

export interface CreateMatchData {
  club_id: string;
  player1_id: string;
  player2_id?: string | null;
  opponent2_name?: string;
  player3_id?: string | null;
  partner3_name?: string;
  player4_id?: string | null;
  partner4_name?: string;
  scores: string;
  match_type: 'singles' | 'doubles';
  date: string;
  notes?: string;
}

export interface UpdateMatchData {
  club_id?: string;
  player1_id?: string;
  player2_id?: string | null;
  opponent2_name?: string;
  player3_id?: string | null;
  partner3_name?: string;
  player4_id?: string | null;
  partner4_name?: string;
  scores?: string;
  match_type?: 'singles' | 'doubles';
  date?: string;
  notes?: string;
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

/**
 * MatchService - Direct Supabase integration without local SQLite
 */
export class MatchService {

  async createMatch(matchData: CreateMatchData): Promise<Match> {
    console.log('🎾 Creating match directly in Supabase...');
    
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
      const { data: match, error } = await supabase
        .from('matches')
        .insert(newMatch)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create match:', error);
        throw new Error(`Failed to create match: ${error.message}`);
      }

      console.log('✅ Match created successfully');
      return match;

    } catch (error) {
      console.error('❌ Match creation failed:', error);
      throw error;
    }
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
export const getClubLeaderboard = async (clubId: string) => {
  // TODO: Implement direct Supabase ranking calculation
  // For now, return empty array to avoid SQLite errors
  console.log('⚠️ Club rankings not yet implemented for direct Supabase');
  return [];
};
export const recordMatch = (matchData: CreateMatchData) => matchService.createMatch(matchData);

export default matchService;