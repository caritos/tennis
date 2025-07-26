import {
  TennisScore,
  validateSetScore,
  parseScoreString,
  formatScoreDisplay,
  calculateMatchWinner,
  isValidTennisScore,
  TennisSet,
  TennisMatch,
} from '../utils/tennisScore';

describe('Tennis Scoring System', () => {
  describe('validateSetScore', () => {
    it('should validate standard set scores', () => {
      expect(validateSetScore(6, 4)).toBe(true);
      expect(validateSetScore(6, 3)).toBe(true);
      expect(validateSetScore(6, 2)).toBe(true);
      expect(validateSetScore(6, 1)).toBe(true);
      expect(validateSetScore(6, 0)).toBe(true);
    });

    it('should validate reverse standard set scores', () => {
      expect(validateSetScore(4, 6)).toBe(true);
      expect(validateSetScore(3, 6)).toBe(true);
      expect(validateSetScore(2, 6)).toBe(true);
      expect(validateSetScore(1, 6)).toBe(true);
      expect(validateSetScore(0, 6)).toBe(true);
    });

    it('should validate 7-5 and 5-7 scores', () => {
      expect(validateSetScore(7, 5)).toBe(true);
      expect(validateSetScore(5, 7)).toBe(true);
    });

    it('should validate tiebreak scores 7-6 and 6-7', () => {
      expect(validateSetScore(7, 6)).toBe(true);
      expect(validateSetScore(6, 7)).toBe(true);
    });

    it('should reject invalid set scores', () => {
      expect(validateSetScore(6, 5)).toBe(false); // Must be 7-5 or tiebreak
      expect(validateSetScore(5, 6)).toBe(false); // Must be 5-7 or tiebreak
      expect(validateSetScore(8, 6)).toBe(false); // Too high
      expect(validateSetScore(6, 8)).toBe(false); // Too high
      expect(validateSetScore(7, 4)).toBe(false); // 7 games must be 7-5 or 7-6
      expect(validateSetScore(4, 7)).toBe(false); // 7 games must be 5-7 or 6-7
      expect(validateSetScore(5, 4)).toBe(false); // Neither player has 6+ games
    });

    it('should reject negative scores', () => {
      expect(validateSetScore(-1, 6)).toBe(false);
      expect(validateSetScore(6, -1)).toBe(false);
    });
  });

  describe('parseScoreString', () => {
    it('should parse valid score strings', () => {
      expect(parseScoreString('6-4,6-3')).toEqual([
        { player1: 6, player2: 4 },
        { player1: 6, player2: 3 },
      ]);

      expect(parseScoreString('7-6,3-6,6-4')).toEqual([
        { player1: 7, player2: 6 },
        { player1: 3, player2: 6 },
        { player1: 6, player2: 4 },
      ]);
    });

    it('should handle tiebreak scores with notation', () => {
      expect(parseScoreString('7-6(7-4),6-3')).toEqual([
        { player1: 7, player2: 6, tiebreak: { player1: 7, player2: 4 } },
        { player1: 6, player2: 3 },
      ]);
    });

    it('should handle single set scores', () => {
      expect(parseScoreString('6-4')).toEqual([
        { player1: 6, player2: 4 },
      ]);
    });

    it('should throw error for invalid format', () => {
      expect(() => parseScoreString('invalid')).toThrow('Invalid score format');
      expect(() => parseScoreString('6-4-3')).toThrow('Invalid score format');
      expect(() => parseScoreString('')).toThrow('Invalid score format');
    });

    it('should throw error for invalid set scores', () => {
      expect(() => parseScoreString('6-5')).toThrow('Invalid set score');
      expect(() => parseScoreString('6-4,8-6')).toThrow('Invalid set score');
    });
  });

  describe('formatScoreDisplay', () => {
    it('should format basic set scores', () => {
      const sets: TennisSet[] = [
        { player1: 6, player2: 4 },
        { player1: 6, player2: 3 },
      ];
      expect(formatScoreDisplay(sets)).toBe('6-4, 6-3');
    });

    it('should format tiebreak scores', () => {
      const sets: TennisSet[] = [
        { player1: 7, player2: 6, tiebreak: { player1: 7, player2: 4 } },
        { player1: 6, player2: 3 },
      ];
      expect(formatScoreDisplay(sets)).toBe('7-6 (7-4), 6-3');
    });

    it('should handle single set', () => {
      const sets: TennisSet[] = [
        { player1: 6, player2: 4 },
      ];
      expect(formatScoreDisplay(sets)).toBe('6-4');
    });

    it('should handle empty sets', () => {
      expect(formatScoreDisplay([])).toBe('');
    });
  });

  describe('calculateMatchWinner', () => {
    it('should determine winner of best-of-3 match', () => {
      const sets: TennisSet[] = [
        { player1: 6, player2: 4 },
        { player1: 6, player2: 3 },
      ];
      expect(calculateMatchWinner(sets)).toBe('player1');
    });

    it('should determine winner of 3-set match with player2 winning', () => {
      const sets: TennisSet[] = [
        { player1: 4, player2: 6 },
        { player1: 3, player2: 6 },
      ];
      expect(calculateMatchWinner(sets)).toBe('player2');
    });

    it('should determine winner of full 3-set match', () => {
      const sets: TennisSet[] = [
        { player1: 6, player2: 4 },
        { player1: 3, player2: 6 },
        { player1: 6, player2: 2 },
      ];
      expect(calculateMatchWinner(sets)).toBe('player1');
    });

    it('should return null for incomplete match', () => {
      const sets: TennisSet[] = [
        { player1: 6, player2: 4 },
      ];
      expect(calculateMatchWinner(sets)).toBeNull();
    });

    it('should return null for tied match (1-1)', () => {
      const sets: TennisSet[] = [
        { player1: 6, player2: 4 },
        { player1: 3, player2: 6 },
      ];
      expect(calculateMatchWinner(sets)).toBeNull();
    });
  });

  describe('isValidTennisScore', () => {
    it('should validate complete tennis matches', () => {
      expect(isValidTennisScore('6-4,6-3')).toBe(true);
      expect(isValidTennisScore('7-6(7-4),6-3')).toBe(true);
      expect(isValidTennisScore('6-4,3-6,6-2')).toBe(true);
    });

    it('should reject invalid tennis scores', () => {
      expect(isValidTennisScore('6-5')).toBe(false);
      expect(isValidTennisScore('6-4')).toBe(false); // Incomplete match
      expect(isValidTennisScore('invalid')).toBe(false);
      expect(isValidTennisScore('')).toBe(false);
    });

    it('should reject incomplete matches', () => {
      expect(isValidTennisScore('6-4')).toBe(false); // Only 1 set
      expect(isValidTennisScore('6-4,3-6')).toBe(false); // Tied 1-1
    });
  });

  describe('TennisScore class', () => {
    it('should create tennis score from valid string', () => {
      const score = new TennisScore('6-4,6-3');
      expect(score.sets).toHaveLength(2);
      expect(score.winner).toBe('player1');
      expect(score.isComplete).toBe(true);
    });

    it('should calculate winner correctly', () => {
      const score = new TennisScore('4-6,6-3,6-2');
      expect(score.winner).toBe('player1');
      expect(score.setsWon.player1).toBe(2);
      expect(score.setsWon.player2).toBe(1);
    });

    it('should format display correctly', () => {
      const score = new TennisScore('7-6(7-4),6-3');
      expect(score.display).toBe('7-6 (7-4), 6-3');
    });

    it('should handle tiebreak scores', () => {
      const score = new TennisScore('7-6(10-8),6-4');
      expect(score.sets[0].tiebreak).toEqual({ player1: 10, player2: 8 });
    });

    it('should throw error for invalid scores', () => {
      expect(() => new TennisScore('6-5')).toThrow();
      expect(() => new TennisScore('invalid')).toThrow();
    });
  });

  describe('Tennis Match Model', () => {
    it('should validate complete match data', () => {
      const match: TennisMatch = {
        id: 'match-1',
        club_id: 'club-1',
        player1_id: 'player-1',
        player2_id: 'player-2',
        scores: '6-4,6-3',
        match_type: 'singles',
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
      };

      const score = new TennisScore(match.scores);
      expect(score.isComplete).toBe(true);
      expect(score.winner).toBe('player1');
    });

    it('should handle doubles match', () => {
      const match: TennisMatch = {
        id: 'match-2',
        club_id: 'club-1',
        player1_id: 'player-1',
        player2_id: 'player-2',
        scores: '7-6(7-5),3-6,6-4',
        match_type: 'doubles',
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
      };

      const score = new TennisScore(match.scores);
      expect(score.isComplete).toBe(true);
      expect(score.sets).toHaveLength(3);
    });

    it('should handle match against unregistered opponent', () => {
      const match: TennisMatch = {
        id: 'match-3',
        club_id: 'club-1',
        player1_id: 'player-1',
        player2_id: null,
        opponent2_name: 'John Doe',
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
      };

      const score = new TennisScore(match.scores);
      expect(score.isComplete).toBe(true);
      expect(match.opponent2_name).toBe('John Doe');
    });
  });
});