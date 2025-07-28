/**
 * Tennis Score Calculation Integration Tests
 * Tests the complete tennis scoring system including validation and formatting
 */

import { 
  validateTennisScore,
  calculateTennisWinner,
  formatTennisScore,
  parseTennisScore,
  isValidTiebreakScore
} from '@/utils/tennisScore';
import { createMatch, createMatchScenarios } from '../setup/testFactories';

describe('Tennis Score System Integration', () => {
  describe('Complete Score Validation Flow', () => {
    it('validates complete match scenarios', () => {
      // Test standard 2-set match
      const standardMatch = '6-4,6-3';
      expect(validateTennisScore(standardMatch)).toBe(true);
      
      // Test 3-set match
      const threeSetMatch = '6-4,4-6,6-2';
      expect(validateTennisScore(threeSetMatch)).toBe(true);
      
      // Test match with tiebreak
      const tiebreakMatch = '7-6(7-5),6-4';
      expect(validateTennisScore(tiebreakMatch)).toBe(true);
      
      // Test invalid scores
      expect(validateTennisScore('8-6,6-3')).toBe(false); // Invalid score
      expect(validateTennisScore('6-4')).toBe(false); // Incomplete match
      expect(validateTennisScore('')).toBe(false); // Empty score
    });

    it('handles edge cases in professional tennis scoring', () => {
      // Long tiebreak
      expect(validateTennisScore('7-6(15-13),6-4')).toBe(true);
      
      // 5-set match (rare in recreational play)
      expect(validateTennisScore('6-4,4-6,6-2,4-6,6-3')).toBe(true);
      
      // Double tiebreak match
      expect(validateTennisScore('7-6(7-3),7-6(8-6)')).toBe(true);
    });

    it('rejects invalid score combinations', () => {
      // Both players can't win 6-3 in same set
      expect(validateTennisScore('6-3,3-6,6-3,3-6')).toBe(false);
      
      // Invalid tiebreak notation
      expect(validateTennisScore('7-6(6-8),6-4')).toBe(false);
      
      // Incomplete tiebreak
      expect(validateTennisScore('7-6(),6-4')).toBe(false);
    });
  });

  describe('Winner Calculation with Match Context', () => {
    it('determines winners correctly for different match types', () => {
      // Standard singles victory
      expect(calculateTennisWinner('6-4,6-3')).toBe('player1');
      expect(calculateTennisWinner('4-6,3-6')).toBe('player2');
      
      // 3-set comeback victory
      expect(calculateTennisWinner('4-6,6-4,6-2')).toBe('player1');
      expect(calculateTennisWinner('6-4,4-6,2-6')).toBe('player2');
      
      // Tiebreak victories
      expect(calculateTennisWinner('7-6(7-5),6-4')).toBe('player1');
      expect(calculateTennisWinner('6-7(5-7),4-6')).toBe('player2');
    });

    it('handles complex match scenarios', () => {
      // Long 3-set match with multiple tiebreaks
      const complexMatch = '7-6(10-8),6-7(5-7),7-6(7-3)';
      expect(calculateTennisWinner(complexMatch)).toBe('player1');
      
      // 5-set match
      const fiveSetMatch = '6-4,4-6,6-2,4-6,6-3';
      expect(calculateTennisWinner(fiveSetMatch)).toBe('player1');
    });
  });

  describe('Score Formatting and Display', () => {
    it('formats scores for display consistently', () => {
      expect(formatTennisScore('6-4,6-3')).toBe('6-4, 6-3');
      expect(formatTennisScore('7-6(7-5),6-4')).toBe('7-6⁽⁷⁻⁵⁾, 6-4');
      expect(formatTennisScore('6-4,4-6,6-2')).toBe('6-4, 4-6, 6-2');
    });

    it('handles special formatting cases', () => {
      // Empty or invalid scores
      expect(formatTennisScore('')).toBe('');
      expect(formatTennisScore('invalid')).toBe('invalid');
      
      // Multiple tiebreaks
      expect(formatTennisScore('7-6(7-3),7-6(8-6)')).toBe('7-6⁽⁷⁻³⁾, 7-6⁽⁸⁻⁶⁾');
    });
  });

  describe('Score Parsing Integration', () => {
    it('parses and validates score data correctly', () => {
      const score = '7-6(7-5),6-4';
      const parsed = parseTennisScore(score);
      
      expect(parsed).toEqual([
        { player1: 7, player2: 6, tiebreak: { player1: 7, player2: 5 } },
        { player1: 6, player2: 4 }
      ]);
      
      expect(validateTennisScore(score)).toBe(true);
      expect(calculateTennisWinner(score)).toBe('player1');
    });

    it('handles parsing errors gracefully', () => {
      expect(parseTennisScore('invalid-score')).toEqual([]);
      expect(parseTennisScore('')).toEqual([]);
      expect(parseTennisScore('6-4,')).toEqual([{ player1: 6, player2: 4 }]);
    });
  });

  describe('Tiebreak Validation Integration', () => {
    it('validates tiebreak scores within match context', () => {
      // Valid tiebreak scenarios
      expect(isValidTiebreakScore(7, 3)).toBe(true);
      expect(isValidTiebreakScore(10, 8)).toBe(true);
      expect(isValidTiebreakScore(15, 13)).toBe(true);
      
      // Invalid tiebreak scenarios
      expect(isValidTiebreakScore(6, 4)).toBe(false); // Must be at least 7
      expect(isValidTiebreakScore(7, 6)).toBe(false); // Must win by 2
      expect(isValidTiebreakScore(8, 7)).toBe(false); // Must win by 2
    });

    it('validates tiebreak within complete match scores', () => {
      // Valid matches with tiebreaks
      expect(validateTennisScore('7-6(7-5),6-4')).toBe(true);
      expect(validateTennisScore('6-4,7-6(10-8)')).toBe(true);
      
      // Invalid tiebreak scores in matches
      expect(validateTennisScore('7-6(6-4),6-4')).toBe(false);
      expect(validateTennisScore('7-6(7-6),6-4')).toBe(false);
    });
  });

  describe('Real Match Data Integration', () => {
    it('validates factory-generated match data', () => {
      const scenarios = [
        createMatchScenarios.singles(),
        createMatchScenarios.doubles(),
        createMatchScenarios.tiebreak(),
        createMatchScenarios.longMatch(),
      ];

      scenarios.forEach((match) => {
        expect(validateTennisScore(match.scores)).toBe(true);
        expect(['player1', 'player2']).toContain(calculateTennisWinner(match.scores));
        expect(formatTennisScore(match.scores)).toBeTruthy();
      });
    });

    it('processes batch match validation efficiently', () => {
      const matches = Array(100).fill(0).map((_, i) => 
        createMatch({ 
          scores: i % 2 === 0 ? '6-4,6-3' : '7-6(7-5),4-6,6-2' 
        })
      );

      const startTime = Date.now();
      const results = matches.map(match => ({
        valid: validateTennisScore(match.scores),
        winner: calculateTennisWinner(match.scores),
        formatted: formatTennisScore(match.scores),
      }));
      const endTime = Date.now();

      // Performance check - should process 100 matches quickly
      expect(endTime - startTime).toBeLessThan(100);
      
      // All results should be valid
      expect(results.every(r => r.valid)).toBe(true);
      expect(results.every(r => ['player1', 'player2'].includes(r.winner))).toBe(true);
      expect(results.every(r => r.formatted.length > 0)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        123,
        {},
        [],
        '6-4,,6-3',
        '6-4,6-3,',
        ',6-4,6-3',
        '6--4,6-3',
        '6-4,,6-3',
      ];

      malformedInputs.forEach(input => {
        expect(() => validateTennisScore(input as any)).not.toThrow();
        expect(() => calculateTennisWinner(input as any)).not.toThrow();
        expect(() => formatTennisScore(input as any)).not.toThrow();
      });
    });

    it('maintains consistency across all score operations', () => {
      const testScores = [
        '6-4,6-3',
        '7-6(7-5),6-4',
        '6-4,4-6,6-2',
        '7-6(10-8),6-7(5-7),7-6(7-3)',
      ];

      testScores.forEach(score => {
        const isValid = validateTennisScore(score);
        const winner = calculateTennisWinner(score);
        const formatted = formatTennisScore(score);
        const parsed = parseTennisScore(score);

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