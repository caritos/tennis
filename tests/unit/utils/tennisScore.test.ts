// Tennis score validation tests for recreational play
import { validateSetScore, isValidTennisScore, parseScoreString, calculateMatchWinner } from '../../../utils/tennisScore';

describe('Tennis Score Validation - Recreational Play', () => {
  
  describe('validateSetScore - Individual Set Validation', () => {
    
    describe('✅ VALID Set Scores', () => {
      test('Standard wins (6-0 to 6-4)', () => {
        expect(validateSetScore(6, 0)).toBe(true);
        expect(validateSetScore(6, 1)).toBe(true);
        expect(validateSetScore(6, 2)).toBe(true);
        expect(validateSetScore(6, 3)).toBe(true);
        expect(validateSetScore(6, 4)).toBe(true);
        expect(validateSetScore(0, 6)).toBe(true);
        expect(validateSetScore(4, 6)).toBe(true);
      });

      test('Win by 2 games after 6-6', () => {
        expect(validateSetScore(7, 5)).toBe(true);
        expect(validateSetScore(5, 7)).toBe(true);
        expect(validateSetScore(8, 6)).toBe(true);
        expect(validateSetScore(6, 8)).toBe(true);
        expect(validateSetScore(9, 7)).toBe(true);
        expect(validateSetScore(10, 8)).toBe(true);
        expect(validateSetScore(12, 10)).toBe(true);
      });

      test('Tiebreak sets (7-6)', () => {
        expect(validateSetScore(7, 6)).toBe(true);
        expect(validateSetScore(6, 7)).toBe(true);
      });
    });

    describe('✅ MORE VALID Set Scores (Recreational Rules)', () => {
      test('Tied scores (valid in recreational)', () => {
        expect(validateSetScore(0, 0)).toBe(true);
        expect(validateSetScore(6, 6)).toBe(true);
        expect(validateSetScore(7, 7)).toBe(true);
        expect(validateSetScore(10, 10)).toBe(true);
      });

      test('Single game wins (valid in recreational)', () => {
        expect(validateSetScore(6, 5)).toBe(true);
        expect(validateSetScore(5, 6)).toBe(true);
        expect(validateSetScore(7, 6)).toBe(true);
        expect(validateSetScore(8, 7)).toBe(true);
        expect(validateSetScore(9, 8)).toBe(true);
      });

    });
    
    describe('❌ INVALID Set Scores', () => {
      test('Negative scores', () => {
        expect(validateSetScore(-1, 6)).toBe(false);
        expect(validateSetScore(6, -1)).toBe(false);
        expect(validateSetScore(-1, -1)).toBe(false);
      });

      test('Unreasonably high scores', () => {
        expect(validateSetScore(20, 18)).toBe(false);
        expect(validateSetScore(16, 14)).toBe(false);
        expect(validateSetScore(100, 98)).toBe(false);
      });
    });
  });

  describe('isValidTennisScore - Complete Match Validation', () => {
    
    describe('✅ VALID Match Scores', () => {
      test('Single set matches (recreational)', () => {
        expect(isValidTennisScore('6-0')).toBe(true);
        expect(isValidTennisScore('6-1')).toBe(true);
        expect(isValidTennisScore('6-4')).toBe(true);
        expect(isValidTennisScore('7-5')).toBe(true);
        expect(isValidTennisScore('8-6')).toBe(true);
        expect(isValidTennisScore('10-8')).toBe(true);
        expect(isValidTennisScore('7-6')).toBe(true);
      });

      test('Two set matches', () => {
        expect(isValidTennisScore('6-4,6-3')).toBe(true);
        expect(isValidTennisScore('6-0,6-1')).toBe(true);
        expect(isValidTennisScore('7-6,6-4')).toBe(true);
        expect(isValidTennisScore('8-6,7-5')).toBe(true);
      });

      test('Three set matches', () => {
        expect(isValidTennisScore('6-4,4-6,6-3')).toBe(true);
        expect(isValidTennisScore('7-6,6-7,6-4')).toBe(true);
        expect(isValidTennisScore('6-0,0-6,6-2')).toBe(true);
      });

      test('Tiebreak matches with scores', () => {
        expect(isValidTennisScore('7-6(7-4),6-3')).toBe(true);
        expect(isValidTennisScore('6-7(5-7),7-6(7-2),6-4')).toBe(true);
        expect(isValidTennisScore('7-6(10-8)')).toBe(true);
      });
    });

    describe('✅ MORE VALID Match Scores (Recreational Rules)', () => {
      test('Empty or malformed scores', () => {
        expect(isValidTennisScore('')).toBe(false);
        expect(isValidTennisScore('invalid')).toBe(false);
        expect(isValidTennisScore('6')).toBe(false);
        expect(isValidTennisScore('6-')).toBe(false);
        expect(isValidTennisScore('-6')).toBe(false);
      });

      test('Tied sets (valid in recreational)', () => {
        expect(isValidTennisScore('6-6')).toBe(true);
        expect(isValidTennisScore('7-7')).toBe(true);
        expect(isValidTennisScore('0-0')).toBe(true);
      });

      test('Single game wins (valid in recreational)', () => {
        expect(isValidTennisScore('6-5')).toBe(true); // Single game wins allowed
        expect(isValidTennisScore('8-7')).toBe(true); // Single game wins allowed
        expect(isValidTennisScore('6-4,6-5')).toBe(true); // Both sets valid
      });

      test('Incomplete multi-set matches (valid in recreational)', () => {
        expect(isValidTennisScore('6-4,4-6')).toBe(true); // Tied matches allowed
        expect(isValidTennisScore('6-7,7-6')).toBe(true); // Tied matches allowed
      });
    });
    
    describe('❌ INVALID Match Scores', () => {
      test('Unreasonably high scores', () => {
        expect(isValidTennisScore('20-18')).toBe(false); // Too high
        expect(isValidTennisScore('16-14')).toBe(false); // Above limit
        expect(isValidTennisScore('100-98')).toBe(false); // Impossible
      });
    });
  });

  describe('calculateMatchWinner', () => {
    test('Single set winners', () => {
      const singleSetWin = parseScoreString('6-0');
      expect(calculateMatchWinner(singleSetWin)).toBe('player1');
      
      const singleSetLoss = parseScoreString('0-6');
      expect(calculateMatchWinner(singleSetLoss)).toBe('player2');
    });

    test('Multi-set winners', () => {
      const twoSetWin = parseScoreString('6-4,6-3');
      expect(calculateMatchWinner(twoSetWin)).toBe('player1');
      
      const threeSetWin = parseScoreString('6-4,4-6,6-3');
      expect(calculateMatchWinner(threeSetWin)).toBe('player1');
      
      const threeSetLoss = parseScoreString('4-6,6-4,3-6');
      expect(calculateMatchWinner(threeSetLoss)).toBe('player2');
    });
  });

  describe('Real World Recreational Examples', () => {
    test('Quick practice set', () => {
      expect(isValidTennisScore('6-2')).toBe(true);
    });

    test('Competitive single set', () => {
      expect(isValidTennisScore('7-5')).toBe(true);
    });

    test('Long recreational set', () => {
      expect(isValidTennisScore('10-8')).toBe(true);
    });

    test('Marathon recreational set', () => {
      expect(isValidTennisScore('12-10')).toBe(true);
    });

    test('Tiebreak single set', () => {
      expect(isValidTennisScore('7-6(7-3)')).toBe(true);
    });

    test('Club match format', () => {
      expect(isValidTennisScore('6-4,6-3')).toBe(true);
    });
  });
});

describe('Invalid Score Examples for Reference', () => {
  test('These scores should be REJECTED', () => {
    const invalidScores = [
      // Malformed scores
      '',
      'invalid',
      '6',
      '6-',
      '-6',
      'abc-def',
      
      // Impossible scores (too high or negative)
      '20-18',
      '100-98',
      '-1-6',
      '6--1',
      '-1,6',
      '6,-1',
      '16-14', // Above reasonable limit
    ];

    invalidScores.forEach(score => {
      expect(isValidTennisScore(score)).toBe(false);
    });
  });
});