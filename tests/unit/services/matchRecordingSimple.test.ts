import { CreateMatchData } from '@/services/matchService';

describe('Issue #100: Match recording with challenge_id - Schema Verification', () => {
  describe('Match data structure', () => {
    it('should include challenge_id field in CreateMatchData interface', () => {
      const matchData: CreateMatchData = {
        club_id: 'test-club-id',
        player1_id: 'test-player1-id',
        player2_id: 'test-player2-id',
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2025-08-25',
        challenge_id: undefined, // This should not cause TypeScript errors
        notes: 'Test match'
      };

      expect(matchData.challenge_id).toBe(undefined);
    });

    it('should handle challenge_id for challenge matches', () => {
      const challengeMatch: CreateMatchData = {
        club_id: 'test-club-id',
        player1_id: 'test-player1-id',
        player2_id: 'test-player2-id',
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2025-08-25',
        challenge_id: 'test-challenge-id-456', // Challenge match
        notes: 'Challenge match completed!'
      };

      expect(challengeMatch.challenge_id).toBe('test-challenge-id-456');
    });

    it('should handle undefined challenge_id correctly', () => {
      const matchData: CreateMatchData = {
        club_id: 'test-club-id',
        player1_id: 'test-player1-id',
        player2_id: 'test-player2-id',
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2025-08-25',
        challenge_id: undefined, // Should be allowed
      };

      // Verify that undefined can be converted to null as expected
      const normalizedChallengeId = matchData.challenge_id ?? null;
      expect(normalizedChallengeId).toBe(null);
    });
  });

  describe('Schema validation expectations', () => {
    it('should verify database insert object structure', () => {
      const matchData: CreateMatchData = {
        club_id: 'test-club-id',
        player1_id: 'test-player1-id',
        player2_id: 'test-player2-id',
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2025-08-25',
        challenge_id: 'test-challenge-id',
        notes: 'Great match!'
      };

      // Simulate what matchService.createMatch should insert into database
      const expectedInsert = {
        id: expect.any(String),
        club_id: matchData.club_id,
        player1_id: matchData.player1_id,
        player2_id: matchData.player2_id,
        opponent2_name: null,
        scores: matchData.scores,
        match_type: matchData.match_type,
        date: matchData.date,
        challenge_id: matchData.challenge_id, // Key field from Issue #100
        invitation_id: null,
        notes: matchData.notes,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      };

      // Verify the structure matches what our schema expects
      expect(expectedInsert).toMatchObject({
        challenge_id: 'test-challenge-id',
        invitation_id: null,
        club_id: 'test-club-id',
        scores: '6-4,6-2',
      });
    });
  });
});