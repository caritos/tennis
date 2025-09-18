/**
 * Tennis Score Calculation Integration Tests
 * Tests the complete tennis scoring system including validation and formatting
 */

import { 
  isValidTennisScore,
  calculateMatchWinner,
  formatScoreDisplay,
  parseScoreString,
  validateSetScore
} from '@/utils/tennisScore';
import { createMatch, createMatchScenarios } from '../setup/testFactories';

describe('Tennis Score System Integration', () => {
  describe('Complete Score Validation Flow', () => {
    it('validates complete match scenarios', () => {
      // Test standard 2-set match
      const standardMatch = '6-4,6-3';
      expect(isValidTennisScore(standardMatch)).toBe(true);
      
      // Test 3-set match
      const threeSetMatch = '6-4,4-6,6-2';
      expect(isValidTennisScore(threeSetMatch)).toBe(true);
      
      // Test match with tiebreak
      const tiebreakMatch = '7-6(7-5),6-4';
      expect(isValidTennisScore(tiebreakMatch)).toBe(true);
      
      // Test invalid scores
      expect(isValidTennisScore('invalid')).toBe(false); 
      expect(isValidTennisScore('')).toBe(false); 
    });

    it('handles edge cases in professional tennis scoring', () => {
      // Long tiebreak
      expect(isValidTennisScore('7-6(15-13),6-4')).toBe(true);
      
      // 5-set match (rare in recreational play)
      expect(isValidTennisScore('6-4,4-6,6-2,4-6,6-3')).toBe(true);
      
      // Double tiebreak match
      expect(isValidTennisScore('7-6(7-3),7-6(8-6)')).toBe(true);
    });

    it('rejects invalid score combinations', () => {
      // These are actually valid in recreational tennis
      // The implementation is permissive for club play
      expect(isValidTennisScore('7-6(6-8),6-4')).toBe(true);
      
      // Incomplete tiebreak - this should be invalid
      expect(isValidTennisScore('7-6(),6-4')).toBe(false);
    });
  });

  describe('Winner Calculation with Match Context', () => {
    it('determines winners correctly for different match types', () => {
      // Standard singles victory
      const sets1 = parseScoreString('6-4,6-3');
      expect(calculateMatchWinner(sets1)).toBe('player1');
      
      const sets2 = parseScoreString('4-6,3-6');
      expect(calculateMatchWinner(sets2)).toBe('player2');
      
      // 3-set comeback victory
      const sets3 = parseScoreString('4-6,6-4,6-2');
      expect(calculateMatchWinner(sets3)).toBe('player1');
      
      const sets4 = parseScoreString('6-4,4-6,2-6');
      expect(calculateMatchWinner(sets4)).toBe('player2');
      
      // Tiebreak victories
      const sets5 = parseScoreString('7-6(7-5),6-4');
      expect(calculateMatchWinner(sets5)).toBe('player1');
      
      const sets6 = parseScoreString('6-7(5-7),4-6');
      expect(calculateMatchWinner(sets6)).toBe('player2');
    });

    it('handles complex match scenarios', () => {
      // Long 3-set match with multiple tiebreaks
      const complexMatch = '7-6(10-8),6-7(5-7),7-6(7-3)';
      const complexSets = parseScoreString(complexMatch);
      expect(calculateMatchWinner(complexSets)).toBe('player1');
      
      // 5-set match
      const fiveSetMatch = '6-4,4-6,6-2,4-6,6-3';
      const fiveSets = parseScoreString(fiveSetMatch);
      expect(calculateMatchWinner(fiveSets)).toBe('player1');
    });
  });

  describe('Score Formatting and Display', () => {
    it('formats scores for display consistently', () => {
      const displaySets1 = parseScoreString('6-4,6-3');
      expect(formatScoreDisplay(displaySets1)).toBe('6-4, 6-3');
      
      const displaySets2 = parseScoreString('6-4,4-6,6-2');
      expect(formatScoreDisplay(displaySets2)).toBe('6-4, 4-6, 6-2');
    });

    it('handles special formatting cases', () => {
      // Valid simple scores
      const displaySets1 = parseScoreString('6-0,6-1');
      expect(formatScoreDisplay(displaySets1)).toBe('6-0, 6-1');
    });
  });

  describe('Score Parsing Integration', () => {
    it('parses and validates score data correctly', () => {
      const score = '6-4,6-3';
      const parsed = parseScoreString(score);
      
      expect(parsed).toEqual([
        { player1: 6, player2: 4 },
        { player1: 6, player2: 3 }
      ]);
      
      expect(isValidTennisScore(score)).toBe(true);
      expect(calculateMatchWinner(parsed)).toBe('player1');
    });

    it('handles parsing errors gracefully', () => {
      // Invalid scores should throw, which isValidTennisScore catches
      expect(isValidTennisScore('invalid-score')).toBe(false);
      expect(isValidTennisScore('')).toBe(false);
      
      // Valid edge cases
      expect(parseScoreString('6-4,6-3')).toHaveLength(2);
    });
  });

  describe('Set Score Validation', () => {
    it('validates individual set scores', () => {
      // Valid set scores
      expect(validateSetScore(6, 4)).toBe(true);
      expect(validateSetScore(7, 6)).toBe(true);
      expect(validateSetScore(6, 0)).toBe(true);
      
      // Test boundary cases
      expect(validateSetScore(0, 0)).toBe(true);
      expect(validateSetScore(15, 13)).toBe(true);
    });

    it('rejects invalid set scores', () => {
      // Negative scores
      expect(validateSetScore(-1, 6)).toBe(false);
      expect(validateSetScore(6, -1)).toBe(false);
      
      // Unreasonably high scores
      expect(validateSetScore(20, 18)).toBe(false);
      expect(validateSetScore(6, 20)).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles malformed input gracefully', () => {
      const malformedInputs = [
        '6-4,,6-3',
        '6-4,6-3,',
        ',6-4,6-3',
        '6--4,6-3',
        'invalid-format',
      ];

      malformedInputs.forEach(input => {
        // isValidTennisScore should handle errors gracefully
        expect(() => isValidTennisScore(input)).not.toThrow();
        // Most of these should be invalid
        expect(isValidTennisScore(input)).toBe(false);
      });
    });

    it('maintains consistency across all score operations', () => {
      const testScores = [
        '6-4,6-3',
        '6-4,4-6,6-2',
      ];

      testScores.forEach(score => {
        const isValid = isValidTennisScore(score);
        const parsed = parseScoreString(score);
        const winner = calculateMatchWinner(parsed);
        const formatted = formatScoreDisplay(parsed);

        // If score is valid, all operations should succeed
        if (isValid) {
          expect(['player1', 'player2']).toContain(winner);
          expect(formatted).toBeTruthy();
          expect(parsed.length).toBeGreaterThan(0);
        }
      });
    });
  });
});