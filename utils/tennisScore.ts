// Tennis scoring system for the app

export interface TennisSet {
  player1: number;
  player2: number;
  tiebreak?: {
    player1: number;
    player2: number;
  };
}

export interface TennisMatch {
  id: string;
  club_id: string;
  player1_id: string;
  player2_id?: string | null;
  opponent2_name?: string | null;
  scores: string;
  match_type: 'singles' | 'doubles';
  date: string;
  notes?: string;
  created_at: string;
}

export interface SetsWon {
  player1: number;
  player2: number;
}

/**
 * Validates a tennis set score for recreational/club play
 * Very flexible rules to accommodate all types of friendly matches
 */
export function validateSetScore(player1: number, player2: number): boolean {
  // Both scores must be non-negative and reasonable
  if (player1 < 0 || player2 < 0 || player1 > 15 || player2 > 15) {
    return false;
  }

  // In recreational tennis, any reasonable score is valid:
  // - Tied scores are allowed (6-6, 7-7, etc.)
  // - Single game wins are allowed (6-5, 7-6, 8-7, etc.)
  // - Extended sets are allowed (10-8, 12-10, etc.)
  // - Standard wins (6-0, 6-1, 6-2, 6-3, 6-4)
  // - Tiebreak scores (7-6)
  
  return true; // Any non-negative, reasonable score is valid
}

/**
 * Parses a score string like "6-4,6-3" or "7-6(7-4),6-3" into TennisSet objects
 */
export function parseScoreString(scoreString: string): TennisSet[] {
  if (!scoreString || scoreString.trim() === '') {
    throw new Error('Invalid score format: empty string');
  }

  const setStrings = scoreString.split(',').map(s => s.trim());
  const sets: TennisSet[] = [];

  for (const setString of setStrings) {
    // Check for tiebreak notation like "7-6(7-4)"
    const tiebreakMatch = setString.match(/^(\d+)-(\d+)\((\d+)-(\d+)\)$/);
    
    if (tiebreakMatch) {
      const [, p1, p2, tb1, tb2] = tiebreakMatch;
      const player1 = parseInt(p1, 10);
      const player2 = parseInt(p2, 10);
      
      if (!validateSetScore(player1, player2)) {
        throw new Error(`Invalid set score: ${player1}-${player2}`);
      }

      sets.push({
        player1,
        player2,
        tiebreak: {
          player1: parseInt(tb1, 10),
          player2: parseInt(tb2, 10),
        },
      });
    } else {
      // Regular set score like "6-4"
      const scoreMatch = setString.match(/^(\d+)-(\d+)$/);
      
      if (!scoreMatch) {
        throw new Error(`Invalid score format: ${setString}`);
      }

      const [, p1, p2] = scoreMatch;
      const player1 = parseInt(p1, 10);
      const player2 = parseInt(p2, 10);


      if (!validateSetScore(player1, player2)) {
        throw new Error(`Invalid set score: ${player1}-${player2}`);
      }

      sets.push({ player1, player2 });
    }
  }

  return sets;
}

/**
 * Formats tennis sets for display like "6-4, 7-6 (7-4)"
 */
export function formatScoreDisplay(sets: TennisSet[]): string {
  if (sets.length === 0) return '';

  return sets.map(set => {
    const baseScore = `${set.player1}-${set.player2}`;
    if (set.tiebreak) {
      return `${baseScore} (${set.tiebreak.player1}-${set.tiebreak.player2})`;
    }
    return baseScore;
  }).join(', ');
}

/**
 * Calculates the winner of a tennis match based on sets won
 * Returns 'player1', 'player2', or null if match is tied or incomplete
 * Supports recreational rules with flexible match formats
 */
export function calculateMatchWinner(sets: TennisSet[]): 'player1' | 'player2' | null {
  if (sets.length === 0) return null;

  let player1Sets = 0;
  let player2Sets = 0;
  let tiedSets = 0;

  for (const set of sets) {
    if (set.player1 > set.player2) {
      player1Sets++;
    } else if (set.player2 > set.player1) {
      player2Sets++;
    } else {
      tiedSets++; // Tied sets are valid in recreational play
    }
  }

  // Single set match
  if (sets.length === 1) {
    if (player1Sets > player2Sets) return 'player1';
    if (player2Sets > player1Sets) return 'player2';
    return null; // Single tied set = no winner
  }

  // Multi-set match: whoever has more sets wins
  // In recreational play, incomplete matches are valid
  if (player1Sets > player2Sets) return 'player1';
  if (player2Sets > player1Sets) return 'player2';
  
  return null; // Tied or no clear winner
}

/**
 * Validates that a score string represents a valid tennis match
 * Very permissive for recreational play - allows tied scores, incomplete matches
 */
export function isValidTennisScore(scoreString: string): boolean {
  try {
    const sets = parseScoreString(scoreString);
    
    // Must have at least one valid set
    if (sets.length === 0) return false;
    
    // In recreational tennis, any valid parsed score is acceptable:
    // - Single sets (including tied sets like 6-6)
    // - Multi-set matches (including incomplete like 6-4,4-6) 
    // - Any score that passes basic validation is valid
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Tennis Score class for easier manipulation and validation
 */
export class TennisScore {
  public readonly sets: TennisSet[];
  public readonly winner: 'player1' | 'player2' | null;
  public readonly setsWon: SetsWon;
  public readonly isComplete: boolean;
  public readonly display: string;

  constructor(scoreString: string) {
    this.sets = parseScoreString(scoreString);
    this.winner = calculateMatchWinner(this.sets);
    this.isComplete = this.winner !== null;
    this.display = formatScoreDisplay(this.sets);

    // Calculate sets won
    let player1Sets = 0;
    let player2Sets = 0;

    for (const set of this.sets) {
      if (set.player1 > set.player2) {
        player1Sets++;
      } else {
        player2Sets++;
      }
    }

    this.setsWon = {
      player1: player1Sets,
      player2: player2Sets,
    };

    // Validate that this is a complete match
    if (!this.isComplete) {
      throw new Error('Tennis score must represent a complete match');
    }
  }

  /**
   * Returns the opponent name for display purposes
   */
  getOpponentName(match: TennisMatch): string {
    return match.opponent2_name || 'Player 2';
  }

  /**
   * Returns whether player1 won the match
   */
  didPlayer1Win(): boolean {
    return this.winner === 'player1';
  }

  /**
   * Returns match statistics
   */
  getMatchStats() {
    let totalGamesPlayer1 = 0;
    let totalGamesPlayer2 = 0;

    for (const set of this.sets) {
      totalGamesPlayer1 += set.player1;
      totalGamesPlayer2 += set.player2;
    }

    return {
      setsWon: this.setsWon,
      totalGames: {
        player1: totalGamesPlayer1,
        player2: totalGamesPlayer2,
      },
      matchWinner: this.winner,
    };
  }
}