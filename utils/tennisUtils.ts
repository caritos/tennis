// Utility functions for tennis scoring and match parsing
import { TennisSet, TennisMatch, ParsedTennisMatch, MatchWinner } from '@/types/tennis';

/**
 * Parses a score string like "6-4,6-3" or "7-6(7-4),6-3" into TennisSet objects
 */
export function parseScoreString(scoreString: string): TennisSet[] {
  if (!scoreString || scoreString.trim() === '') {
    return [];
  }

  const setStrings = scoreString.split(',').map(s => s.trim());
  const sets: TennisSet[] = [];

  for (const setString of setStrings) {
    // Check for tiebreak notation like "7-6(7-4)"
    const tiebreakMatch = setString.match(/^(\d+)-(\d+)\((\d+)-(\d+)\)$/);
    
    if (tiebreakMatch) {
      const [, p1, p2, tb1, tb2] = tiebreakMatch;
      sets.push({
        playerScore: parseInt(p1, 10),
        opponentScore: parseInt(p2, 10),
        tiebreak: {
          playerScore: parseInt(tb1, 10),
          opponentScore: parseInt(tb2, 10),
        },
      });
    } else {
      // Regular set score like "6-4"
      const scoreMatch = setString.match(/^(\d+)-(\d+)$/);
      
      if (scoreMatch) {
        const [, p1, p2] = scoreMatch;
        sets.push({
          playerScore: parseInt(p1, 10),
          opponentScore: parseInt(p2, 10),
        });
      }
    }
  }

  return sets;
}

/**
 * Formats tennis sets back to a score string like "6-4,7-6(7-4),6-3"
 */
export function formatScoreString(sets: TennisSet[]): string {
  return sets.map(set => {
    let setScore = `${set.playerScore}-${set.opponentScore}`;
    if (set.tiebreak) {
      setScore += `(${set.tiebreak.playerScore}-${set.tiebreak.opponentScore})`;
    }
    return setScore;
  }).join(',');
}

/**
 * Calculates the winner of a tennis match based on sets won
 * Supports single-set matches for recreational play
 */
export function calculateMatchWinner(sets: TennisSet[]): MatchWinner {
  if (sets.length === 0) return null;

  let player1Sets = 0;
  let player2Sets = 0;

  for (const set of sets) {
    if (set.playerScore > set.opponentScore) {
      player1Sets++;
    } else {
      player2Sets++;
    }
  }

  // Best of 3: need 2 sets to win (standard tennis format)
  if (player1Sets >= 2) return 'player1';
  if (player2Sets >= 2) return 'player2';

  return null; // Match incomplete
}

/**
 * Checks if a match is complete (has a winner)
 */
export function isMatchComplete(sets: TennisSet[]): boolean {
  return calculateMatchWinner(sets) !== null;
}

/**
 * Parses a raw TennisMatch from the database into a more usable format
 */
export function parseTennisMatch(match: TennisMatch, player1Name?: string, player2Name?: string): ParsedTennisMatch {
  const sets = parseScoreString(match.scores);
  const winner = calculateMatchWinner(sets);
  
  return {
    id: match.id,
    clubId: match.club_id,
    player1: {
      id: match.player1_id,
      name: player1Name || 'Player 1'
    },
    player2: match.player2_id 
      ? { id: match.player2_id, name: player2Name || 'Player 2' }
      : { id: null, name: match.opponent2_name || 'Unknown Player' },
    sets,
    matchType: match.match_type,
    date: match.date,
    notes: match.notes,
    createdAt: match.created_at,
    winner,
    isComplete: winner !== null
  };
}

/**
 * Gets display-friendly player names from a parsed match
 */
export function getPlayerNames(match: ParsedTennisMatch): { player1Name: string; player2Name: string } {
  return {
    player1Name: match.player1.name,
    player2Name: match.player2.name
  };
}

/**
 * Formats a match result for display (e.g., "John def. Jane 6-4, 6-3")
 */
export function formatMatchResult(match: ParsedTennisMatch): string {
  const { player1Name, player2Name } = getPlayerNames(match);
  const scoreString = formatScoreString(match.sets);
  
  if (!match.isComplete) {
    return `${player1Name} vs ${player2Name} - In Progress`;
  }
  
  const winner = match.winner === 'player1' ? player1Name : player2Name;
  const loser = match.winner === 'player1' ? player2Name : player1Name;
  
  return `${winner} def. ${loser} ${scoreString}`;
}

/**
 * Gets match statistics
 */
export function getMatchStats(sets: TennisSet[]) {
  let player1Games = 0;
  let player2Games = 0;
  let player1Sets = 0;
  let player2Sets = 0;

  for (const set of sets) {
    player1Games += set.playerScore;
    player2Games += set.opponentScore;
    
    if (set.playerScore > set.opponentScore) {
      player1Sets++;
    } else {
      player2Sets++;
    }
  }

  return {
    sets: { player1: player1Sets, player2: player2Sets },
    games: { player1: player1Games, player2: player2Games },
    winner: calculateMatchWinner(sets),
    isComplete: isMatchComplete(sets)
  };
}