// import { initializeDatabase } from '../database/database'; // Disabled - use ELO system instead
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
  constructor() {
    console.warn('RankingService is disabled - use ELO rating system in match service instead');
  }

  async calculateClubRankings(clubId: string): Promise<PlayerRanking[]> {
    console.warn('calculateClubRankings is disabled - use ELO rating system in match service instead');
    return [];
  }

  async calculatePlayerRankingPoints(playerId: string, opponentRating: number, matchResult: 'win' | 'loss', scores: TennisScore[]): Promise<RankingPoints> {
    console.warn('calculatePlayerRankingPoints is disabled - use ELO rating system in match service instead');
    return {
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0,
      reason: 'Disabled'
    };
  }

  async updatePlayerRankings(clubId: string): Promise<void> {
    console.warn('updatePlayerRankings is disabled - use ELO rating system in match service instead');
  }
}

export default RankingService;