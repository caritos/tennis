import { MatchService, CreateMatchData, recordMatch, getMatchHistory } from '../services/matchService';
import { initializeDatabase } from '../database/database';
import { supabase } from '../lib/supabase';
import { TennisScore } from '../utils/tennisScore';

// Mock dependencies
jest.mock('../database/database');
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Match Service', () => {
  let mockDb: any;
  let matchService: MatchService;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };

    (initializeDatabase as jest.Mock).mockResolvedValue(mockDb);
    
    matchService = new MatchService();
    jest.clearAllMocks();
  });

  describe('recordMatch', () => {
    it('should record a singles match with valid score', async () => {
      const matchData: CreateMatchData = {
        club_id: 'club-123',
        player1_id: 'player-1',
        player2_id: 'player-2',
        scores: '6-4,6-3',
        match_type: 'singles',
        date: '2024-01-15',
        notes: 'Great match!',
      };

      const mockSupabaseInsert = jest.fn().mockResolvedValue({
        data: { id: 'match-456', ...matchData },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockSupabaseInsert,
      });

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({ id: 'match-456', ...matchData });

      const result = await matchService.recordMatch(matchData);

      // Should validate tennis score
      expect(() => new TennisScore(matchData.scores)).not.toThrow();

      // Should insert into local database
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO matches'),
        expect.arrayContaining([
          expect.any(String), // match id
          matchData.club_id,
          matchData.player1_id,
          matchData.player2_id,
          null, // opponent2_name
          matchData.scores,
          matchData.match_type,
          matchData.date,
          matchData.notes,
        ])
      );

      // Should sync to Supabase
      expect(supabase.from).toHaveBeenCalledWith('matches');
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining(matchData)
      );

      expect(result).toEqual(expect.objectContaining(matchData));
    });

    it('should record match against unregistered opponent', async () => {
      const matchData: CreateMatchData = {
        club_id: 'club-123',
        player1_id: 'player-1',
        player2_id: null,
        opponent2_name: 'John Doe',
        scores: '7-6(7-5),6-4',
        match_type: 'singles',
        date: '2024-01-15',
      };

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({ id: 'match-456', ...matchData });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      const result = await matchService.recordMatch(matchData);

      // Should handle unregistered opponent
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO matches'),
        expect.arrayContaining([
          expect.any(String),
          matchData.club_id,
          matchData.player1_id,
          null, // player2_id is null
          matchData.opponent2_name,
          matchData.scores,
          matchData.match_type,
          matchData.date,
          null, // notes
        ])
      );

      expect(result.opponent2_name).toBe('John Doe');
    });

    it('should record doubles match', async () => {
      const matchData: CreateMatchData = {
        club_id: 'club-123',
        player1_id: 'player-1',
        player2_id: 'player-2',
        scores: '6-4,3-6,6-2',
        match_type: 'doubles',
        date: '2024-01-15',
      };

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({ id: 'match-456', ...matchData });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      await matchService.recordMatch(matchData);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO matches'),
        expect.arrayContaining([
          expect.any(String),
          matchData.club_id,
          matchData.player1_id,
          matchData.player2_id,
          null,
          matchData.scores,
          'doubles',
          matchData.date,
          null,
        ])
      );
    });

    it('should reject invalid tennis scores', async () => {
      const matchData: CreateMatchData = {
        club_id: 'club-123',
        player1_id: 'player-1',
        player2_id: 'player-2',
        scores: '6-5', // Invalid tennis score
        match_type: 'singles',
        date: '2024-01-15',
      };

      await expect(matchService.recordMatch(matchData)).rejects.toThrow(
        'Invalid tennis score'
      );
    });

    it('should reject incomplete scores', async () => {
      const matchData: CreateMatchData = {
        club_id: 'club-123',
        player1_id: 'player-1',
        player2_id: 'player-2',
        scores: '6-4', // Incomplete match (only 1 set)
        match_type: 'singles',
        date: '2024-01-15',
      };

      await expect(matchService.recordMatch(matchData)).rejects.toThrow(
        'Invalid tennis score'
      );
    });

    it('should require either player2_id or opponent2_name', async () => {
      const matchData: CreateMatchData = {
        club_id: 'club-123',
        player1_id: 'player-1',
        player2_id: null,
        opponent2_name: null,
        scores: '6-4,6-3',
        match_type: 'singles',
        date: '2024-01-15',
      };

      await expect(matchService.recordMatch(matchData)).rejects.toThrow(
        'Must specify either player2_id or opponent2_name'
      );
    });

    it('should handle Supabase sync errors gracefully', async () => {
      const matchData: CreateMatchData = {
        club_id: 'club-123',
        player1_id: 'player-1',
        player2_id: 'player-2',
        scores: '6-4,6-3',
        match_type: 'singles',
        date: '2024-01-15',
      };

      const mockSupabaseInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockSupabaseInsert,
      });

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({ id: 'match-456', ...matchData });

      // Should still create locally even if Supabase fails
      const result = await matchService.recordMatch(matchData);
      expect(result).toEqual(expect.objectContaining(matchData));
      expect(mockDb.runAsync).toHaveBeenCalled();
    });
  });

  describe('getMatchHistory', () => {
    it('should get match history for a player', async () => {
      const playerId = 'player-123';
      const mockMatches = [
        {
          id: 'match-1',
          club_id: 'club-1',
          player1_id: 'player-123',
          player2_id: 'player-2',
          scores: '6-4,6-3',
          match_type: 'singles',
          date: '2024-01-15',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'match-2',
          club_id: 'club-1',
          player1_id: 'player-2',
          player2_id: 'player-123',
          scores: '7-6(7-4),6-2',
          match_type: 'singles',
          date: '2024-01-14',
          created_at: '2024-01-14T15:00:00Z',
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockMatches);

      const result = await matchService.getMatchHistory(playerId);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM matches'),
        [playerId, playerId]
      );

      expect(result).toEqual(mockMatches);
    });

    it('should get match history for a specific club', async () => {
      const playerId = 'player-123';
      const clubId = 'club-456';

      mockDb.getAllAsync.mockResolvedValue([]);

      await matchService.getMatchHistory(playerId, clubId);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND club_id = ?'),
        [playerId, playerId, clubId]
      );
    });

    it('should return empty array for player with no matches', async () => {
      const playerId = 'new-player';
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await matchService.getMatchHistory(playerId);

      expect(result).toEqual([]);
    });

    it('should sort matches by date descending', async () => {
      const playerId = 'player-123';
      mockDb.getAllAsync.mockResolvedValue([]);

      await matchService.getMatchHistory(playerId);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY date DESC'),
        [playerId, playerId]
      );
    });
  });

  describe('getMatchStats', () => {
    it('should calculate win/loss statistics for a player', async () => {
      const playerId = 'player-123';
      const mockMatches = [
        {
          id: 'match-1',
          player1_id: 'player-123',
          player2_id: 'player-2',
          scores: '6-4,6-3', // player-123 wins
          match_type: 'singles',
        },
        {
          id: 'match-2',
          player1_id: 'player-2',
          player2_id: 'player-123',
          scores: '6-4,6-3', // player-2 wins, player-123 loses
          match_type: 'singles',
        },
        {
          id: 'match-3',
          player1_id: 'player-123',
          player2_id: 'player-3',
          scores: '7-6(7-4),6-2', // player-123 wins
          match_type: 'doubles',
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockMatches);

      const stats = await matchService.getMatchStats(playerId);

      expect(stats.totalMatches).toBe(3);
      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(1);
      expect(stats.winPercentage).toBe(66.67);
      expect(stats.singlesRecord.wins).toBe(1);
      expect(stats.singlesRecord.losses).toBe(1);
      expect(stats.doublesRecord.wins).toBe(1);
      expect(stats.doublesRecord.losses).toBe(0);
    });

    it('should handle player with no matches', async () => {
      const playerId = 'new-player';
      mockDb.getAllAsync.mockResolvedValue([]);

      const stats = await matchService.getMatchStats(playerId);

      expect(stats.totalMatches).toBe(0);
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(0);
      expect(stats.winPercentage).toBe(0);
    });
  });
});