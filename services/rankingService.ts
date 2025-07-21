import { initializeDatabase } from '../database/database';
import { TennisScore } from '../utils/tennisScore';

export interface PlayerRanking {
  playerId: string;
  playerName: string;
  ranking: number;
  totalPoints: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  singlesWins: number;
  singlesLosses: number;
  doublesWins: number;
  doublesLosses: number;
  isProvisional: boolean; // < 5 matches
  lastMatchDate?: string;
  trophy?: string; // For top 3 players
}

export interface RankingPoints {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  reason: string;
}

export class RankingService {
  private db: any = null;

  private async getDatabase() {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }

  async calculateClubRankings(clubId: string): Promise<PlayerRanking[]> {
    try {
      const db = await this.getDatabase();

      // Get all matches in the club
      const matches = await db.getAllAsync(
        `SELECT * FROM matches WHERE club_id = ? ORDER BY date DESC`,
        [clubId]
      );

      if (matches.length === 0) {
        return [];
      }

      // Get all unique players in the club
      const playerIds = new Set<string>();
      matches.forEach((match: any) => {
        if (match.player1_id) playerIds.add(match.player1_id);
        if (match.player2_id) playerIds.add(match.player2_id);
      });

      if (playerIds.size === 0) {
        return [];
      }

      // Get player information
      const playerIdsArray = Array.from(playerIds);
      const placeholders = playerIdsArray.map(() => '?').join(',');
      const users = await db.getAllAsync(
        `SELECT id, full_name FROM users WHERE id IN (${placeholders})`,
        playerIdsArray
      );

      // Calculate rankings for each player
      const rankings: PlayerRanking[] = [];

      for (const user of users) {
        const playerStats = this.calculatePlayerStats(matches, user.id);
        
        rankings.push({
          playerId: user.id,
          playerName: user.full_name,
          ranking: 0, // Will be set after sorting
          totalPoints: playerStats.totalPoints,
          totalMatches: playerStats.totalMatches,
          wins: playerStats.wins,
          losses: playerStats.losses,
          winPercentage: playerStats.winPercentage,
          singlesWins: playerStats.singlesWins,
          singlesLosses: playerStats.singlesLosses,
          doublesWins: playerStats.doublesWins,
          doublesLosses: playerStats.doublesLosses,
          isProvisional: playerStats.totalMatches < 5,
          lastMatchDate: playerStats.lastMatchDate,
        });
      }

      // Sort by total points descending, then by win percentage, then by total matches
      rankings.sort((a, b) => {
        if (a.totalPoints !== b.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        if (a.winPercentage !== b.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }
        return b.totalMatches - a.totalMatches;
      });

      // Assign rankings
      rankings.forEach((player, index) => {
        player.ranking = index + 1;
      });

      return rankings;
    } catch (error) {
      console.error('Failed to calculate club rankings:', error);
      throw error;
    }
  }

  async getPlayerRanking(clubId: string, playerId: string): Promise<PlayerRanking | null> {
    try {
      const db = await this.getDatabase();

      // Get player matches in this club
      const matches = await db.getAllAsync(
        `SELECT * FROM matches 
         WHERE club_id = ? AND (player1_id = ? OR player2_id = ?)
         ORDER BY date DESC`,
        [clubId, playerId, playerId]
      );

      if (matches.length === 0) {
        return null;
      }

      // Get player information
      const user = await db.getFirstAsync(
        `SELECT * FROM users WHERE id = ?`,
        [playerId]
      );

      if (!user) {
        return null;
      }

      const playerStats = this.calculatePlayerStats(matches, playerId);

      return {
        playerId: user.id,
        playerName: user.full_name,
        ranking: 0, // Would need full club rankings to determine
        totalPoints: playerStats.totalPoints,
        totalMatches: playerStats.totalMatches,
        wins: playerStats.wins,
        losses: playerStats.losses,
        winPercentage: playerStats.winPercentage,
        singlesWins: playerStats.singlesWins,
        singlesLosses: playerStats.singlesLosses,
        doublesWins: playerStats.doublesWins,
        doublesLosses: playerStats.doublesLosses,
        isProvisional: playerStats.totalMatches < 5,
        lastMatchDate: playerStats.lastMatchDate,
      };
    } catch (error) {
      console.error('Failed to get player ranking:', error);
      return null;
    }
  }

  async getTopPlayers(clubId: string, limit: number = 3): Promise<PlayerRanking[]> {
    try {
      const rankings = await this.calculateClubRankings(clubId);
      const topPlayers = rankings.slice(0, limit);

      // Add trophy indicators
      topPlayers.forEach((player, index) => {
        switch (index) {
          case 0:
            player.trophy = '🏆';
            break;
          case 1:
            player.trophy = '🥈';
            break;
          case 2:
            player.trophy = '🥉';
            break;
        }
      });

      return topPlayers;
    } catch (error) {
      console.error('Failed to get top players:', error);
      return [];
    }
  }

  async updatePlayerRankings(clubId: string, matchId?: string): Promise<void> {
    try {
      // This method would be called after a new match is recorded
      // to trigger recalculation of rankings
      
      // For now, we just ensure rankings are recalculated on demand
      // In a real implementation, we might cache rankings in the database
      console.log(`Triggering ranking update for club ${clubId} after match ${matchId}`);
      
      // Could implement caching here if needed for performance
      await this.calculateClubRankings(clubId);
    } catch (error) {
      console.error('Failed to update player rankings:', error);
      throw error;
    }
  }

  private calculatePlayerStats(matches: any[], playerId: string) {
    let totalPoints = 0;
    let wins = 0;
    let losses = 0;
    let singlesWins = 0;
    let singlesLosses = 0;
    let doublesWins = 0;
    let doublesLosses = 0;
    let lastMatchDate: string | undefined;

    const playerMatches = matches.filter(match => 
      match.player1_id === playerId || match.player2_id === playerId
    );

    for (const match of playerMatches) {
      try {
        const isPlayer1 = match.player1_id === playerId;
        const score = new TennisScore(match.scores);
        const didWin = (isPlayer1 && score.winner === 'player1') || 
                       (!isPlayer1 && score.winner === 'player2');

        // Calculate points for this match
        const points = calculatePlayerPoints(match.scores, match.match_type, didWin);
        totalPoints += points;

        // Track wins/losses
        if (didWin) {
          wins++;
          if (match.match_type === 'singles') {
            singlesWins++;
          } else {
            doublesWins++;
          }
        } else {
          losses++;
          if (match.match_type === 'singles') {
            singlesLosses++;
          } else {
            doublesLosses++;
          }
        }

        // Track last match date
        if (!lastMatchDate || match.date > lastMatchDate) {
          lastMatchDate = match.date;
        }
      } catch (error) {
        console.warn(`Invalid score for match ${match.id}:`, match.scores);
      }
    }

    const totalMatches = wins + losses;
    const winPercentage = totalMatches > 0 ? Math.round((wins / totalMatches) * 10000) / 100 : 0;

    return {
      totalPoints,
      totalMatches,
      wins,
      losses,
      winPercentage,
      singlesWins,
      singlesLosses,
      doublesWins,
      doublesLosses,
      lastMatchDate,
    };
  }
}

/**
 * Calculate points awarded for a tennis match
 * Based on result, score closeness, and match type
 */
export function calculatePlayerPoints(
  scores: string, 
  matchType: 'singles' | 'doubles', 
  didWin: boolean
): number {
  try {
    const score = new TennisScore(scores);
    
    let basePoints = 0;
    let bonusPoints = 0;

    if (didWin) {
      // Base points for winning
      basePoints = matchType === 'singles' ? 100 : 75; // Doubles worth 75% of singles
      
      // Bonus for dominant wins (straight sets with big margins like 6-0, 6-0)
      if (score.sets.length === 2) {
        const isPlayer1Winner = score.winner === 'player1';
        const isDominantWin = score.sets.every(set => {
          const winnerGames = isPlayer1Winner ? set.player1 : set.player2;
          const loserGames = isPlayer1Winner ? set.player2 : set.player1;
          return winnerGames >= 6 && loserGames <= 1;
        });
        
        if (isDominantWin) {
          bonusPoints += 20; // Dominant win bonus
        }
      }
      
      // Bonus for close matches (shows competitive spirit)
      const hasCloseSet = score.sets.some(set => 
        Math.abs(set.player1 - set.player2) <= 2 || 
        set.tiebreak !== undefined
      );
      if (hasCloseSet) {
        bonusPoints += 10; // Close match bonus
      }
      
      // Bonus for three-set wins (endurance)
      if (score.sets.length === 3) {
        bonusPoints += 5; // Three-set bonus
      }
    } else {
      // Base points for losing (participation)
      basePoints = matchType === 'singles' ? 25 : 20; // Doubles worth 80% of singles
      
      // More points for close losses
      const hasCloseSet = score.sets.some(set => 
        Math.abs(set.player1 - set.player2) <= 2 || 
        set.tiebreak !== undefined
      );
      if (hasCloseSet) {
        bonusPoints += 10; // Close loss bonus
      }
      
      // Bonus for three-set losses (fought hard)
      if (score.sets.length === 3) {
        bonusPoints += 5; // Three-set bonus
      }
    }

    return basePoints + bonusPoints;
  } catch (error) {
    // Invalid score, return 0 points
    return 0;
  }
}

// Export singleton instance and individual functions for backward compatibility
const rankingService = new RankingService();

export const calculateClubRankings = (clubId: string) => 
  rankingService.calculateClubRankings(clubId);
export const getPlayerRanking = (clubId: string, playerId: string) => 
  rankingService.getPlayerRanking(clubId, playerId);
export const getTopPlayers = (clubId: string, limit?: number) => 
  rankingService.getTopPlayers(clubId, limit);
export const updatePlayerRankings = (clubId: string, matchId?: string) => 
  rankingService.updatePlayerRankings(clubId, matchId);

export default rankingService;