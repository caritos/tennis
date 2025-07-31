import { initializeDatabase } from '../database/database';
import { supabase, Match } from '../lib/supabase';
import { TennisScore, isValidTennisScore } from '../utils/tennisScore';
import { syncService } from './sync';
import { NotificationService } from './NotificationService';

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
  notes?: string;
}

export interface UpdateMatchData {
  scores?: string;
  notes?: string;
  date?: string;
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
          player3_id, partner3_name, player4_id, partner4_name,
          scores, match_type, date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          matchId,
          matchData.club_id,
          matchData.player1_id,
          matchData.player2_id || null,
          matchData.opponent2_name || null,
          matchData.player3_id || null,
          matchData.partner3_name || null,
          matchData.player4_id || null,
          matchData.partner4_name || null,
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

      // Create notifications for match participants and ranking updates
      try {
        const notificationService = new NotificationService(db);
        
        // Get recorder name for notifications
        const recorder = await db.getFirstAsync(
          'SELECT full_name FROM users WHERE id = ?',
          [matchData.player1_id]
        ) as { full_name: string } | null;

        // Get club name for ranking notifications
        const club = await db.getFirstAsync(
          'SELECT name FROM clubs WHERE id = ?',
          [matchData.club_id]
        ) as { name: string } | null;

        if (recorder && club) {
          const scoreObj = new TennisScore(matchData.scores);
          const isPlayer1Winner = scoreObj.winner === 'player1';
          
          // Format match result
          const resultForPlayer1 = isPlayer1Winner ? 'won' : 'lost';
          const resultForOpponent = isPlayer1Winner ? 'lost' : 'won';
          
          // Get current leaderboard to detect ranking changes
          const currentLeaderboard = await this.getClubLeaderboard(matchData.club_id);
          
          // Create notifications for all registered participants
          const participants = [
            { id: matchData.player1_id, result: resultForPlayer1 },
            { id: matchData.player2_id, result: resultForOpponent },
            { id: matchData.player3_id, result: resultForPlayer1 }, // Partner with player1
            { id: matchData.player4_id, result: resultForOpponent }, // Partner with player2
          ].filter(p => p.id && p.id !== matchData.player1_id); // Exclude recorder and null values

          for (const participant of participants) {
            // Create match result notification
            await notificationService.createMatchResultNotification(
              participant.id!,
              recorder.full_name,
              matchId,
              `${matchData.match_type} - You ${participant.result} ${matchData.scores}`
            );

            // Check for ranking changes and create ranking notifications
            const playerRanking = currentLeaderboard.find(p => p.playerId === participant.id);
            if (playerRanking) {
              // Get the new leaderboard after this match
              const newLeaderboard = await this.getClubLeaderboard(matchData.club_id);
              const newPlayerRanking = newLeaderboard.find(p => p.playerId === participant.id);
              
              if (newPlayerRanking && playerRanking.ranking !== newPlayerRanking.ranking) {
                await notificationService.createRankingUpdateNotification(
                  participant.id!,
                  playerRanking.ranking,
                  newPlayerRanking.ranking,
                  club.name
                );
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to create match notifications:', error);
      }

      // Queue match for sync using the universal offline queue
      try {
        await syncService.queueMatchCreation({
          club_id: matchData.club_id,
          player1_id: matchData.player1_id,
          player2_id: matchData.player2_id,
          opponent2_name: matchData.opponent2_name,
          player3_id: matchData.player3_id,
          partner3_name: matchData.partner3_name,
          player4_id: matchData.player4_id,
          partner4_name: matchData.partner4_name,
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

  async updateMatch(matchId: string, updateData: UpdateMatchData, editedByUserId: string): Promise<Match> {
    console.log('📊 updateMatch: Starting with data:', { matchId, updateData, editedByUserId });
    
    const db = await this.getDatabase();

    try {
      // First, get the existing match to validate permissions
      const existingMatch = await db.getFirstAsync(
        'SELECT * FROM matches WHERE id = ?',
        [matchId]
      ) as Match | null;

      if (!existingMatch) {
        throw new Error('Match not found');
      }

      // Check if the user is a participant in the match (honor system allows any participant to edit)
      const isParticipant = 
        existingMatch.player1_id === editedByUserId ||
        existingMatch.player2_id === editedByUserId ||
        existingMatch.player3_id === editedByUserId ||
        existingMatch.player4_id === editedByUserId;

      if (!isParticipant) {
        throw new Error('Only match participants can edit match results');
      }

      // Validate tennis score if it's being updated
      if (updateData.scores && !isValidTennisScore(updateData.scores)) {
        throw new Error('Invalid tennis score: must be a complete, valid tennis match');
      }

      // Build the update query dynamically
      const updateFields = [];
      const updateValues = [];

      if (updateData.scores) {
        updateFields.push('scores = ?');
        updateValues.push(updateData.scores);
      }

      if (updateData.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(updateData.notes);
      }

      if (updateData.date) {
        updateFields.push('date = ?');
        updateValues.push(updateData.date);
      }

      // Always update tracking fields
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateFields.push('edit_count = edit_count + 1');
      
      // Only set last_edited_by if we can verify the user exists to avoid FK constraint issues
      // For now, skip this field to avoid foreign key constraint failures
      // updateFields.push('last_edited_by = ?');
      // updateValues.push(editedByUserId);
      updateValues.push(matchId); // For WHERE clause

      if (updateFields.length === 2) { // Only tracking fields were added (updated_at and edit_count)
        throw new Error('No match data to update');
      }

      const updateQuery = `
        UPDATE matches 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      console.log('📊 updateMatch: Executing query:', updateQuery, 'with values:', updateValues);

      await db.runAsync(updateQuery, updateValues);

      // Get the updated match
      const updatedMatch = await db.getFirstAsync(
        'SELECT * FROM matches WHERE id = ?',
        [matchId]
      ) as Match;

      // Create notifications for other participants about the match edit
      try {
        const notificationService = new NotificationService(db);
        
        // Get editor name for notifications
        const editor = await db.getFirstAsync(
          'SELECT full_name FROM users WHERE id = ?',
          [editedByUserId]
        ) as { full_name: string } | null;

        if (editor) {
          // Notify all other participants about the edit
          const otherParticipants = [
            existingMatch.player1_id,
            existingMatch.player2_id,
            existingMatch.player3_id,
            existingMatch.player4_id,
          ].filter(id => id && id !== editedByUserId);

          for (const participantId of otherParticipants) {
            await notificationService.createMatchResultNotification(
              participantId,
              editor.full_name,
              matchId,
              `Match updated: ${updatedMatch.scores}`
            );
          }
        }
      } catch (error) {
        console.warn('Failed to create match edit notifications:', error);
      }

      // Queue match update for sync
      try {
        await syncService.queueMatchUpdate(matchId, {
          club_id: updatedMatch.club_id,
          player1_id: updatedMatch.player1_id,
          player2_id: updatedMatch.player2_id,
          opponent2_name: updatedMatch.opponent2_name,
          player3_id: updatedMatch.player3_id,
          partner3_name: updatedMatch.partner3_name,
          player4_id: updatedMatch.player4_id,
          partner4_name: updatedMatch.partner4_name,
          scores: updatedMatch.scores,
          match_type: updatedMatch.match_type,
          date: updatedMatch.date,
          notes: updatedMatch.notes,
        });
        console.log('✅ Match update queued for sync:', matchId);
      } catch (error) {
        console.warn('Failed to queue match update for sync:', error);
      }

      return updatedMatch;
    } catch (error) {
      console.error('Failed to update match:', error);
      throw error;
    }
  }

  async getMatchHistory(playerId: string, clubId?: string): Promise<Match[]> {
    const db = await this.getDatabase();

    try {
      let query = `
        SELECT m.*, c.name as club_name 
        FROM matches m
        LEFT JOIN clubs c ON m.club_id = c.id
        WHERE (m.player1_id = ? OR m.player2_id = ?)
      `;
      const params = [playerId, playerId];

      if (clubId) {
        query += ` AND m.club_id = ?`;
        params.push(clubId);
      }

      query += ` ORDER BY m.date DESC, m.created_at DESC`;

      console.log('📊 getMatchHistory: Query:', query);
      console.log('📊 getMatchHistory: Params:', params);
      
      const matches = await db.getAllAsync(query, params);
      console.log('📊 getMatchHistory: Found matches:', matches.length, matches);
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
    points: number;
    isProvisional: boolean;
  }>> {
    try {
      const db = await this.getDatabase();
      
      // Get all players who have played matches in this club
      // Need to check both player1_id and player2_id positions
      const playersWithMatches = await db.getAllAsync(`
        SELECT DISTINCT player_id FROM (
          SELECT player1_id as player_id FROM matches 
          WHERE club_id = ? AND player1_id IS NOT NULL
          UNION
          SELECT player2_id as player_id FROM matches 
          WHERE club_id = ? AND player2_id IS NOT NULL
        ) as all_players
      `, [clubId, clubId]);

      const leaderboard = [];

      for (const player of playersWithMatches) {
        if (player.player_id) {
          const stats = await this.getMatchStats(player.player_id, clubId);
          
          // Only include players with at least 1 match
          if (stats.totalMatches > 0) {
            // Get player name from database
            const userInfo = await db.getFirstAsync(
              'SELECT full_name FROM users WHERE id = ?',
              [player.player_id]
            );
            
            // Calculate points based on tennis ranking system
            // Base points for wins, bonus for win percentage, penalty for losses
            const basePointsPerWin = 100;
            const winStreakBonus = Math.min(stats.wins * 10, 200); // Max 200 bonus
            const consistencyBonus = stats.winPercentage >= 60 ? 100 : 0;
            const activityBonus = Math.min(stats.totalMatches * 5, 150); // Max 150 for activity
            
            const points = Math.round(
              (stats.wins * basePointsPerWin) + 
              winStreakBonus + 
              consistencyBonus + 
              activityBonus -
              (stats.losses * 20) // Small penalty for losses to encourage competitive play
            );
            
            leaderboard.push({
              playerId: player.player_id,
              playerName: userInfo?.full_name || 'Unknown Player',
              stats,
              ranking: 0, // Will be calculated after sorting
              points: Math.max(0, points), // Never negative
              isProvisional: stats.totalMatches < 5, // Provisional if less than 5 matches
            });
          }
        }
      }

      // Sort by points (descending), then by win percentage (descending), then by total matches (descending)
      leaderboard.sort((a, b) => {
        if (a.points !== b.points) {
          return b.points - a.points;
        }
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
export const updateMatch = (matchId: string, updateData: UpdateMatchData, editedByUserId: string) => 
  matchService.updateMatch(matchId, updateData, editedByUserId);
export const getMatchHistory = (playerId: string, clubId?: string) => 
  matchService.getMatchHistory(playerId, clubId);
export const getMatchStats = (playerId: string, clubId?: string) => 
  matchService.getMatchStats(playerId, clubId);
export const getClubLeaderboard = (clubId: string) => 
  matchService.getClubLeaderboard(clubId);

// Export types for component usage
export type RankedPlayer = Awaited<ReturnType<typeof getClubLeaderboard>>[number];

export default matchService;