import { initializeDatabase } from '../database/database';
import { supabase, Match } from '../lib/supabase';
import { TennisScore, isValidTennisScore } from '../utils/tennisScore';
import { syncService } from './sync';

export interface CreateMatchData {
  club_id: string;
  player1_id: string;
  player2_id?: string | null;
  opponent2_name?: string | null;
  scores: string;
  match_type: 'singles' | 'doubles';
  date: string;
  notes?: string;
}

export interface MatchRecord {
  wins: number;
  losses: number;
  winPercentage: number;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  singlesRecord: MatchRecord;
  doublesRecord: MatchRecord;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

export class MatchService {
  private db: any = null;

  private async getDatabase() {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }

  async recordMatch(matchData: CreateMatchData): Promise<Match> {
    console.log('📊 recordMatch: Starting with data:', matchData);
    
    // Validate tennis score
    if (!isValidTennisScore(matchData.scores)) {
      throw new Error('Invalid tennis score: must be a complete, valid tennis match');
    }

    // Validate opponent data
    if (!matchData.player2_id && !matchData.opponent2_name) {
      throw new Error('Must specify either player2_id or opponent2_name');
    }

    const db = await this.getDatabase();
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Debug: Check if references exist
      console.log('📊 recordMatch: Checking foreign key references...');
      
      // Check club exists
      const clubExists = await db.getFirstAsync('SELECT id FROM clubs WHERE id = ?', [matchData.club_id]);
      console.log('📊 recordMatch: Club exists:', clubExists ? 'YES' : 'NO', matchData.club_id);
      
      // Check player1 exists
      const player1Exists = await db.getFirstAsync('SELECT id FROM users WHERE id = ?', [matchData.player1_id]);
      console.log('📊 recordMatch: Player1 exists:', player1Exists ? 'YES' : 'NO', matchData.player1_id);
      
      // Check player2 exists (if provided)
      if (matchData.player2_id) {
        const player2Exists = await db.getFirstAsync('SELECT id FROM users WHERE id = ?', [matchData.player2_id]);
        console.log('📊 recordMatch: Player2 exists:', player2Exists ? 'YES' : 'NO', matchData.player2_id);
      }
      
      console.log('📊 recordMatch: Inserting match with values:', [
        matchId,
        matchData.club_id,
        matchData.player1_id,
        matchData.player2_id || null,
        matchData.opponent2_name || null,
        matchData.scores,
        matchData.match_type,
        matchData.date,
        matchData.notes || null,
      ]);

      // Insert into local SQLite database first (offline-first)
      await db.runAsync(
        `INSERT INTO matches (
          id, club_id, player1_id, player2_id, opponent2_name, 
          scores, match_type, date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          matchId,
          matchData.club_id,
          matchData.player1_id,
          matchData.player2_id || null,
          matchData.opponent2_name || null,
          matchData.scores,
          matchData.match_type,
          matchData.date,
          matchData.notes || null,
        ]
      );

      // Get the created match
      const match = await db.getFirstAsync(
        `SELECT * FROM matches WHERE id = ?`,
        [matchId]
      );

      // Queue match for sync using the universal offline queue
      try {
        await syncService.queueMatchCreation({
          club_id: matchData.club_id,
          player1_id: matchData.player1_id,
          player2_id: matchData.player2_id,
          opponent2_name: matchData.opponent2_name,
          scores: matchData.scores,
          match_type: matchData.match_type,
          date: matchData.date,
          notes: matchData.notes,
        }, matchId);
        console.log('✅ Match queued for sync:', matchId);
      } catch (error) {
        console.warn('Failed to queue match for sync:', error);
      }

      return match;
    } catch (error) {
      console.error('Failed to record match:', error);
      throw error;
    }
  }

  async getMatchHistory(playerId: string, clubId?: string): Promise<Match[]> {
    const db = await this.getDatabase();

    try {
      let query = `
        SELECT * FROM matches 
        WHERE (player1_id = ? OR player2_id = ?)
      `;
      const params = [playerId, playerId];

      if (clubId) {
        query += ` AND club_id = ?`;
        params.push(clubId);
      }

      query += ` ORDER BY date DESC, created_at DESC`;

      const matches = await db.getAllAsync(query, params);
      return matches;
    } catch (error) {
      console.error('Failed to get match history:', error);
      throw error;
    }
  }

  async getMatchStats(playerId: string, clubId?: string): Promise<PlayerStats> {
    try {
      const matches = await this.getMatchHistory(playerId, clubId);

      let totalWins = 0;
      let totalLosses = 0;
      let singlesWins = 0;
      let singlesLosses = 0;
      let doublesWins = 0;
      let doublesLosses = 0;
      let totalSetsWon = 0;
      let totalSetsLost = 0;
      let totalGamesWon = 0;
      let totalGamesLost = 0;

      for (const match of matches) {
        try {
          const score = new TennisScore(match.scores);
          const isPlayer1 = match.player1_id === playerId;
          const didWin = (isPlayer1 && score.winner === 'player1') || 
                         (!isPlayer1 && score.winner === 'player2');

          // Win/Loss tracking
          if (didWin) {
            totalWins++;
            if (match.match_type === 'singles') {
              singlesWins++;
            } else {
              doublesWins++;
            }
          } else {
            totalLosses++;
            if (match.match_type === 'singles') {
              singlesLosses++;
            } else {
              doublesLosses++;
            }
          }

          // Sets and games tracking
          const playerSetsWon = isPlayer1 ? score.setsWon.player1 : score.setsWon.player2;
          const playerSetsLost = isPlayer1 ? score.setsWon.player2 : score.setsWon.player1;
          
          totalSetsWon += playerSetsWon;
          totalSetsLost += playerSetsLost;

          // Calculate games won/lost
          for (const set of score.sets) {
            const playerGames = isPlayer1 ? set.player1 : set.player2;
            const opponentGames = isPlayer1 ? set.player2 : set.player1;
            
            totalGamesWon += playerGames;
            totalGamesLost += opponentGames;
          }
        } catch (error) {
          console.warn(`Invalid score for match ${match.id}:`, match.scores);
        }
      }

      const totalMatches = totalWins + totalLosses;
      const winPercentage = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 10000) / 100 : 0;

      const singlesTotal = singlesWins + singlesLosses;
      const singlesWinPercentage = singlesTotal > 0 ? Math.round((singlesWins / singlesTotal) * 10000) / 100 : 0;

      const doublesTotal = doublesWins + doublesLosses;
      const doublesWinPercentage = doublesTotal > 0 ? Math.round((doublesWins / doublesTotal) * 10000) / 100 : 0;

      return {
        totalMatches,
        wins: totalWins,
        losses: totalLosses,
        winPercentage,
        singlesRecord: {
          wins: singlesWins,
          losses: singlesLosses,
          winPercentage: singlesWinPercentage,
        },
        doublesRecord: {
          wins: doublesWins,
          losses: doublesLosses,
          winPercentage: doublesWinPercentage,
        },
        setsWon: totalSetsWon,
        setsLost: totalSetsLost,
        gamesWon: totalGamesWon,
        gamesLost: totalGamesLost,
      };
    } catch (error) {
      console.error('Failed to calculate match stats:', error);
      throw error;
    }
  }

  async getClubLeaderboard(clubId: string): Promise<Array<{
    playerId: string;
    playerName: string;
    stats: PlayerStats;
    ranking: number;
  }>> {
    try {
      const db = await this.getDatabase();
      
      // Get all players who have played matches in this club
      const playersWithMatches = await db.getAllAsync(`
        SELECT DISTINCT 
          CASE 
            WHEN player1_id IS NOT NULL THEN player1_id
            ELSE player2_id
          END as player_id
        FROM matches 
        WHERE club_id = ? AND (player1_id IS NOT NULL OR player2_id IS NOT NULL)
      `, [clubId]);

      const leaderboard = [];

      for (const player of playersWithMatches) {
        if (player.player_id) {
          const stats = await this.getMatchStats(player.player_id, clubId);
          
          // Only include players with at least 1 match
          if (stats.totalMatches > 0) {
            leaderboard.push({
              playerId: player.player_id,
              playerName: 'Player Name', // Will be populated from user service
              stats,
              ranking: 0, // Will be calculated after sorting
            });
          }
        }
      }

      // Sort by win percentage (descending), then by total matches (descending)
      leaderboard.sort((a, b) => {
        if (a.stats.winPercentage !== b.stats.winPercentage) {
          return b.stats.winPercentage - a.stats.winPercentage;
        }
        return b.stats.totalMatches - a.stats.totalMatches;
      });

      // Assign rankings
      leaderboard.forEach((player, index) => {
        player.ranking = index + 1;
      });

      return leaderboard;
    } catch (error) {
      console.error('Failed to get club leaderboard:', error);
      throw error;
    }
  }

  private async syncMatchToSupabase(match: Match): Promise<void> {
    try {
      const { error } = await supabase.from('matches').insert({
        id: match.id,
        club_id: match.club_id,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        opponent2_name: match.opponent2_name,
        scores: match.scores,
        match_type: match.match_type,
        date: match.date,
        notes: match.notes,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase match sync failed:', error);
      throw error;
    }
  }
}

// Export singleton instance and individual functions for backward compatibility
const matchService = new MatchService();

export const recordMatch = (matchData: CreateMatchData) => matchService.recordMatch(matchData);
export const getMatchHistory = (playerId: string, clubId?: string) => 
  matchService.getMatchHistory(playerId, clubId);
export const getMatchStats = (playerId: string, clubId?: string) => 
  matchService.getMatchStats(playerId, clubId);
export const getClubLeaderboard = (clubId: string) => 
  matchService.getClubLeaderboard(clubId);

export default matchService;