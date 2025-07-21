import { RankingService, calculatePlayerPoints, calculateClubRankings } from '../services/rankingService';
import { initializeDatabase } from '../database/database';

// Mock dependencies
jest.mock('../database/database');

describe('Ranking Service', () => {
  let mockDb: any;
  let rankingService: RankingService;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };

    (initializeDatabase as jest.Mock).mockResolvedValue(mockDb);
    
    rankingService = new RankingService();
    jest.clearAllMocks();
  });

  describe('calculatePlayerPoints', () => {
    it('should calculate points for singles wins correctly', () => {
      // Standard singles win: 100 points base + 10 close match bonus
      expect(calculatePlayerPoints('6-4,6-3', 'singles', true)).toBe(110);
      
      // Straight sets win gets bonus
      expect(calculatePlayerPoints('6-0,6-0', 'singles', true)).toBe(120); // +20 bonus
      
      // Close match (7-6, 7-5) gets bonus
      expect(calculatePlayerPoints('7-6(7-4),7-5', 'singles', true)).toBe(110); // +10 bonus
      
      // Three set match gets bonus
      expect(calculatePlayerPoints('6-4,3-6,6-2', 'singles', true)).toBe(115); // +10 close + 5 three-set
    });

    it('should calculate points for singles losses correctly', () => {
      // Standard singles loss: 25 points + 10 close match bonus
      expect(calculatePlayerPoints('4-6,3-6', 'singles', false)).toBe(35);
      
      // Close loss gets more points
      expect(calculatePlayerPoints('6-7(4-7),5-7', 'singles', false)).toBe(35); // +10 bonus
      
      // Three set loss gets bonus
      expect(calculatePlayerPoints('6-4,3-6,2-6', 'singles', false)).toBe(40); // +10 close + 5 three-set
    });

    it('should calculate points for doubles matches correctly', () => {
      // Doubles has different point values
      expect(calculatePlayerPoints('6-4,6-3', 'doubles', true)).toBe(85); // 75 + 10 close
      expect(calculatePlayerPoints('4-6,3-6', 'doubles', false)).toBe(30); // 20 + 10 close
    });

    it('should handle invalid scores gracefully', () => {
      expect(calculatePlayerPoints('invalid', 'singles', true)).toBe(0);
      expect(calculatePlayerPoints('', 'singles', true)).toBe(0);
    });

    it('should give maximum points for perfect wins', () => {
      // Perfect singles win (6-0, 6-0)
      expect(calculatePlayerPoints('6-0,6-0', 'singles', true)).toBe(120);
      
      // Perfect doubles win
      expect(calculatePlayerPoints('6-0,6-0', 'doubles', true)).toBe(95); // 75 + 20 dominant
    });

    it('should handle tiebreak scenarios', () => {
      // Tiebreak win should get close match bonus
      expect(calculatePlayerPoints('7-6(10-8),6-4', 'singles', true)).toBe(110);
      
      // Tiebreak loss should get close match bonus
      expect(calculatePlayerPoints('6-7(8-10),4-6', 'singles', false)).toBe(35);
    });
  });

  describe('calculateClubRankings', () => {
    it('should calculate unified rankings for all players in club', async () => {
      const clubId = 'club-123';
      
      const mockMatches = [
        {
          id: 'match-1',
          player1_id: 'player-1',
          player2_id: 'player-2',
          scores: '6-4,6-3',
          match_type: 'singles',
          date: '2024-01-15',
        },
        {
          id: 'match-2',
          player1_id: 'player-2',
          player2_id: 'player-3',
          scores: '7-6(7-4),6-2',
          match_type: 'singles',
          date: '2024-01-14',
        },
        {
          id: 'match-3',
          player1_id: 'player-1',
          player2_id: 'player-3',
          scores: '6-4,3-6,6-2',
          match_type: 'doubles',
          date: '2024-01-13',
        },
      ];

      const mockUsers = [
        { id: 'player-1', full_name: 'Alice Johnson' },
        { id: 'player-2', full_name: 'Bob Smith' },
        { id: 'player-3', full_name: 'Charlie Brown' },
      ];

      mockDb.getAllAsync
        .mockResolvedValueOnce(mockMatches) // matches query
        .mockResolvedValueOnce(mockUsers); // users query

      const rankings = await rankingService.calculateClubRankings(clubId);

      expect(rankings).toHaveLength(3);
      
      // Player 1: Win vs player-2 (110 pts) + Win vs player-3 (90 pts doubles) = 200 pts
      // Player 2: Loss vs player-1 (35 pts) + Win vs player-3 (110 pts, close match) = 145 pts  
      // Player 3: Loss vs player-2 (35 pts, close match) + Loss vs player-1 (35 pts doubles) = 70 pts

      expect(rankings[0].playerId).toBe('player-1');
      expect(rankings[0].totalPoints).toBe(200);
      expect(rankings[0].ranking).toBe(1);

      expect(rankings[1].playerId).toBe('player-2');
      expect(rankings[1].totalPoints).toBe(145);
      expect(rankings[1].ranking).toBe(2);

      expect(rankings[2].playerId).toBe('player-3');
      expect(rankings[2].totalPoints).toBe(70);
      expect(rankings[2].ranking).toBe(3);
    });

    it('should handle players with no matches', async () => {
      const clubId = 'club-123';
      
      mockDb.getAllAsync
        .mockResolvedValueOnce([]) // no matches
        .mockResolvedValueOnce([]); // no users

      const rankings = await rankingService.calculateClubRankings(clubId);

      expect(rankings).toEqual([]);
    });

    it('should include provisional badge for players with < 5 matches', async () => {
      const clubId = 'club-123';
      
      const mockMatches = [
        {
          id: 'match-1',
          player1_id: 'player-1',
          player2_id: 'player-2',
          scores: '6-4,6-3',
          match_type: 'singles',
          date: '2024-01-15',
        },
      ];

      const mockUsers = [
        { id: 'player-1', full_name: 'Alice Johnson' },
        { id: 'player-2', full_name: 'Bob Smith' },
      ];

      mockDb.getAllAsync
        .mockResolvedValueOnce(mockMatches)
        .mockResolvedValueOnce(mockUsers);

      const rankings = await rankingService.calculateClubRankings(clubId);

      // Both players have < 5 matches, so should be provisional
      expect(rankings[0].isProvisional).toBe(true);
      expect(rankings[1].isProvisional).toBe(true);
    });

    it('should sort by total points descending', async () => {
      const clubId = 'club-123';
      
      const mockMatches = [
        {
          id: 'match-1',
          player1_id: 'player-1',
          player2_id: 'player-2',
          scores: '4-6,3-6', // player-1 loses (25 pts)
          match_type: 'singles',
          date: '2024-01-15',
        },
        {
          id: 'match-2',
          player1_id: 'player-2',
          player2_id: 'player-1',
          scores: '6-0,6-0', // player-2 wins big (120 pts)
          match_type: 'singles',
          date: '2024-01-14',
        },
      ];

      const mockUsers = [
        { id: 'player-1', full_name: 'Alice Johnson' },
        { id: 'player-2', full_name: 'Bob Smith' },
      ];

      mockDb.getAllAsync
        .mockResolvedValueOnce(mockMatches)
        .mockResolvedValueOnce(mockUsers);

      const rankings = await rankingService.calculateClubRankings(clubId);

      // Player 2 should be ranked higher due to perfect win
      expect(rankings[0].playerId).toBe('player-2');
      expect(rankings[0].totalPoints).toBe(230); // Both matches counted: 35 (loss in match 1) + 75 (win in match 1) + 120 (big win in match 2) + 30 (big loss in match 2) 
      expect(rankings[1].playerId).toBe('player-1');
      expect(rankings[1].totalPoints).toBe(60); // 35 (loss) + 25 (big loss with close)
    });
  });

  describe('getPlayerRanking', () => {
    it('should get specific player ranking within club', async () => {
      const clubId = 'club-123';
      const playerId = 'player-1';

      const mockMatches = [
        {
          id: 'match-1',
          player1_id: 'player-1',
          player2_id: 'player-2',
          scores: '6-4,6-3',
          match_type: 'singles',
        },
      ];

      const mockUser = { id: 'player-1', full_name: 'Alice Johnson' };

      mockDb.getAllAsync.mockResolvedValue(mockMatches);
      mockDb.getFirstAsync.mockResolvedValue(mockUser);

      const ranking = await rankingService.getPlayerRanking(clubId, playerId);

      expect(ranking).toEqual(expect.objectContaining({
        playerId: 'player-1',
        playerName: 'Alice Johnson',
        totalPoints: 110, // 100 base + 10 close match bonus
        totalMatches: 1,
        wins: 1,
        losses: 0,
        winPercentage: 100,
        isProvisional: true,
      }));
    });

    it('should return null for player not in club', async () => {
      const clubId = 'club-123';
      const playerId = 'player-1';

      mockDb.getAllAsync.mockResolvedValue([]);
      mockDb.getFirstAsync.mockResolvedValue(null);

      const ranking = await rankingService.getPlayerRanking(clubId, playerId);

      expect(ranking).toBeNull();
    });
  });

  describe('getTopPlayers', () => {
    it('should return top 3 players with trophy indicators', async () => {
      const clubId = 'club-123';

      // Mock ranking service method
      const mockRankings = [
        {
          playerId: 'player-1',
          playerName: 'Alice Johnson',
          totalPoints: 500,
          ranking: 1,
          wins: 5,
          losses: 0,
        },
        {
          playerId: 'player-2',
          playerName: 'Bob Smith',
          totalPoints: 450,
          ranking: 2,
          wins: 4,
          losses: 1,
        },
        {
          playerId: 'player-3',
          playerName: 'Charlie Brown',
          totalPoints: 400,
          ranking: 3,
          wins: 3,
          losses: 2,
        },
        {
          playerId: 'player-4',
          playerName: 'David Wilson',
          totalPoints: 350,
          ranking: 4,
          wins: 2,
          losses: 3,
        },
      ];

      // Mock the calculateClubRankings method
      jest.spyOn(rankingService, 'calculateClubRankings').mockResolvedValue(mockRankings);

      const topPlayers = await rankingService.getTopPlayers(clubId);

      expect(topPlayers).toHaveLength(3);
      expect(topPlayers[0].trophy).toBe('🏆');
      expect(topPlayers[1].trophy).toBe('🥈');
      expect(topPlayers[2].trophy).toBe('🥉');
    });

    it('should handle clubs with fewer than 3 players', async () => {
      const clubId = 'club-123';

      const mockRankings = [
        {
          playerId: 'player-1',
          playerName: 'Alice Johnson',
          totalPoints: 500,
          ranking: 1,
          wins: 5,
          losses: 0,
        },
      ];

      jest.spyOn(rankingService, 'calculateClubRankings').mockResolvedValue(mockRankings);

      const topPlayers = await rankingService.getTopPlayers(clubId);

      expect(topPlayers).toHaveLength(1);
      expect(topPlayers[0].trophy).toBe('🏆');
    });
  });

  describe('updatePlayerRankings', () => {
    it('should recalculate and update all rankings after match', async () => {
      const clubId = 'club-123';
      const matchId = 'match-456';

      // Mock empty matches to avoid calculation errors
      mockDb.getAllAsync.mockResolvedValue([]);

      // Should trigger recalculation
      await rankingService.updatePlayerRankings(clubId, matchId);

      // Should call the database to get updated matches
      expect(mockDb.getAllAsync).toHaveBeenCalled();
    });
  });
});