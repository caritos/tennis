import { matchService, CreateMatchData } from '@/services/matchService';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/utils/uuid', () => ({
  generateUUID: () => 'test-match-id-123',
}));

describe('Issue #100: Match recording with challenge_id', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful database operations
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'matches') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{
                id: 'test-match-id-123',
                club_id: 'test-club-id',
                player1_id: 'test-player1-id',
                player2_id: 'test-player2-id',
                scores: '6-4,6-2',
                match_type: 'singles',
                date: '2025-08-25',
                challenge_id: null,
                created_at: '2025-08-25T19:30:00Z'
              }],
              error: null
            })
          })
        } as any;
      }
      
      if (table === 'users') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null
            })
          })
        } as any;
      }

      return {} as any;
    });
  });

  describe('Regular match recording (no challenge)', () => {
    it('should record match with challenge_id as null for regular matches', async () => {
      const matchData: CreateMatchData = {
        club_id: 'test-club-id',
        player1_id: 'test-player1-id',
        player2_id: 'test-player2-id',
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2025-08-25',
        notes: 'Great match!'
        // No challenge_id provided
      };

      const result = await matchService.createMatch(matchData);

      // Verify match was created successfully
      expect(result).toBeTruthy();
      expect(result.id).toBe('test-match-id-123');

      // Verify the database insert was called with challenge_id: null
      const insertCall = mockSupabase.from('matches').insert as jest.Mock;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          challenge_id: null, // Should be null for regular matches
          invitation_id: null,
          club_id: 'test-club-id',
          player1_id: 'test-player1-id',
          player2_id: 'test-player2-id',
          scores: '6-4,6-2',
        })
      );
    });
  });

  describe('Challenge match recording', () => {
    it('should record match with challenge_id for challenge matches', async () => {
      const matchData: CreateMatchData = {
        club_id: 'test-club-id',
        player1_id: 'test-player1-id',
        player2_id: 'test-player2-id',
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2025-08-25',
        challenge_id: 'test-challenge-id-456', // Challenge match
        notes: 'Challenge match completed!'
      };

      const result = await matchService.createMatch(matchData);

      // Verify match was created successfully
      expect(result).toBeTruthy();

      // Verify the database insert was called with the challenge_id
      const insertCall = mockSupabase.from('matches').insert as jest.Mock;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          challenge_id: 'test-challenge-id-456', // Should include challenge ID
          invitation_id: null,
          club_id: 'test-club-id',
          scores: '6-4,6-2',
        })
      );
    });

    it('should record match with both invitation_id and challenge_id as null when neither is provided', async () => {
      const matchData: CreateMatchData = {
        club_id: 'test-club-id',
        player1_id: 'test-player1-id',
        opponent2_name: 'Unregistered Player', // Match against unregistered player
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2025-08-25',
        // No invitation_id or challenge_id - regular match against unregistered player
      };

      const result = await matchService.createMatch(matchData);

      // Verify match was created successfully
      expect(result).toBeTruthy();

      // Verify both IDs are null
      const insertCall = mockSupabase.from('matches').insert as jest.Mock;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          challenge_id: null,
          invitation_id: null,
          player2_id: null, // No registered player 2
          opponent2_name: 'Unregistered Player',
        })
      );
    });
  });

  describe('Database error handling', () => {
    it('should handle missing challenge_id column error gracefully', async () => {
      // Mock the specific database error from the issue
      mockSupabase.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST204',
              message: "Could not find the 'challenge_id' column of 'matches' in the schema cache"
            }
          })
        })
      }) as any);

      const matchData: CreateMatchData = {
        club_id: 'test-club-id',
        player1_id: 'test-player1-id',
        player2_id: 'test-player2-id',
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2025-08-25',
      };

      await expect(matchService.createMatch(matchData)).rejects.toThrow(
        'Failed to create match: Could not find the \'challenge_id\' column of \'matches\' in the schema cache'
      );
    });
  });

  describe('Match data validation', () => {
    it('should handle undefined challenge_id correctly', async () => {
      const matchData: CreateMatchData = {
        club_id: 'test-club-id',
        player1_id: 'test-player1-id',
        player2_id: 'test-player2-id',
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2025-08-25',
        challenge_id: undefined, // Explicitly undefined
      };

      await matchService.createMatch(matchData);

      // Should convert undefined to null
      const insertCall = mockSupabase.from('matches').insert as jest.Mock;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          challenge_id: null, // undefined should become null
        })
      );
    });
  });
});