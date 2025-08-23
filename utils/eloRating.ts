/**
 * ELO Rating System for Tennis Clubs
 * 
 * This system rewards players for beating stronger opponents and penalizes
 * losses to weaker opponents. It creates a self-balancing competitive environment.
 * 
 * SCORE DIFFERENTIAL EXAMPLES:
 * - Win 6-0, 6-0: Get 150% of normal points (dominant victory)
 * - Win 6-2, 6-3: Get 125% of normal points (strong victory)  
 * - Win 6-4, 6-4: Get 110% of normal points (solid victory)
 * - Win 7-6, 7-6: Get 75% of normal points (close match)
 * 
 * This encourages not just winning, but winning convincingly!
 */

export interface EloRating {
  playerId: string;
  rating: number;
  gamesPlayed: number;
  lastUpdated: string;
}

export interface MatchResult {
  winnerId: string;
  loserId: string;
  winnerRating: number;
  loserRating: number;
}

export interface RatingChange {
  winnerId: string;
  loserId: string;
  winnerNewRating: number;
  loserNewRating: number;
  winnerRatingChange: number;
  loserRatingChange: number;
}

// Configuration constants
const DEFAULT_RATING = 1200; // Starting rating for new players
const K_FACTOR_NEW = 40;     // K-factor for players with < 10 games (more volatile)
const K_FACTOR_MID = 30;      // K-factor for players with 10-30 games
const K_FACTOR_ESTABLISHED = 20; // K-factor for established players (30+ games)

/**
 * Calculate the expected score for a player based on ratings
 * Expected score is the probability of winning (0 to 1)
 */
function getExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Get the appropriate K-factor based on games played
 * New players have higher K-factor for faster rating adjustments
 */
function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < 10) return K_FACTOR_NEW;
  if (gamesPlayed < 30) return K_FACTOR_MID;
  return K_FACTOR_ESTABLISHED;
}

/**
 * Calculate score differential multiplier based on match scores
 * This rewards dominant victories and reduces points for close matches
 * @param scores - Match scores in format "6-4,7-5" or "6-0,6-1"
 * @returns Multiplier between 0.5 and 1.5
 */
export function getScoreDifferentialMultiplier(scores: string): number {
  try {
    const sets = scores.split(',').map(s => s.trim());
    let totalWinnerGames = 0;
    let totalLoserGames = 0;
    let tiebreaks = 0;
    
    sets.forEach(set => {
      // Remove tiebreak notation to get base scores
      const hasTiebreak = set.includes('(');
      if (hasTiebreak) {
        tiebreaks++;
        set = set.replace(/\([^)]*\)/g, ''); // Remove (7-5) type notation
      }
      
      const [winnerGames, loserGames] = set.split('-').map(s => parseInt(s));
      totalWinnerGames += winnerGames;
      totalLoserGames += loserGames;
    });
    
    // Calculate game differential
    const totalGames = totalWinnerGames + totalLoserGames;
    const gameDifferential = totalWinnerGames - totalLoserGames;
    const differentialRatio = gameDifferential / totalGames;
    
    // Calculate multiplier based on dominance
    let multiplier = 1.0;
    
    // Dominant victories (6-0, 6-1 type scores)
    if (differentialRatio > 0.6) {
      multiplier = 1.5; // 50% bonus for dominant wins
    }
    // Strong victories (6-2, 6-3 type scores)
    else if (differentialRatio > 0.4) {
      multiplier = 1.25; // 25% bonus
    }
    // Normal victories (6-4, 6-4 type scores)
    else if (differentialRatio > 0.2) {
      multiplier = 1.1; // 10% bonus
    }
    // Close victories (7-6, 6-4 or matches with tiebreaks)
    else if (tiebreaks > 0 || differentialRatio < 0.15) {
      multiplier = 0.75; // Reduced points for very close matches
    }
    
    return multiplier;
  } catch (error) {
    // If score parsing fails, return neutral multiplier
    return 1.0;
  }
}

/**
 * Calculate new ratings after a match with score consideration
 * @param winner - Winner's current rating info
 * @param loser - Loser's current rating info
 * @param matchScores - Match scores in format "6-4,7-5"
 * @returns New ratings and changes for both players
 */
export function calculateEloRatings(
  winner: { rating: number; gamesPlayed: number },
  loser: { rating: number; gamesPlayed: number },
  matchScores?: string
): RatingChange {
  // Calculate expected scores
  const winnerExpected = getExpectedScore(winner.rating, loser.rating);
  const loserExpected = getExpectedScore(loser.rating, winner.rating);
  
  // Get K-factors based on experience
  const winnerK = getKFactor(winner.gamesPlayed);
  const loserK = getKFactor(loser.gamesPlayed);
  
  // Get score differential multiplier if scores provided
  const scoreMultiplier = matchScores ? getScoreDifferentialMultiplier(matchScores) : 1.0;
  
  // Calculate rating changes with score multiplier
  // Winner gets: K * (1 - expectedScore) * scoreMultiplier
  // Loser gets: K * (0 - expectedScore) * scoreMultiplier
  const winnerChange = Math.round(winnerK * (1 - winnerExpected) * scoreMultiplier);
  const loserChange = Math.round(loserK * (0 - loserExpected) * scoreMultiplier);
  
  // Ensure minimum changes to prevent stagnation
  // But allow score multiplier to reduce minimum for close matches
  const minWinnerChange = matchScores && scoreMultiplier < 1 ? 3 : 5;
  const maxLoserChange = matchScores && scoreMultiplier < 1 ? -3 : -5;
  
  const adjustedWinnerChange = Math.max(minWinnerChange, winnerChange);
  const adjustedLoserChange = Math.min(maxLoserChange, loserChange);
  
  return {
    winnerId: '',
    loserId: '',
    winnerNewRating: winner.rating + adjustedWinnerChange,
    loserNewRating: loser.rating + adjustedLoserChange,
    winnerRatingChange: adjustedWinnerChange,
    loserRatingChange: adjustedLoserChange,
  };
}

/**
 * Calculate rating changes for doubles match
 * Each player gets half the rating change they would in singles
 */
export function calculateDoublesEloRatings(
  team1Players: Array<{ rating: number; gamesPlayed: number }>,
  team2Players: Array<{ rating: number; gamesPlayed: number }>,
  team1Won: boolean
): Array<{ newRating: number; ratingChange: number }> {
  // Calculate average ratings for each team
  const team1AvgRating = team1Players.reduce((sum, p) => sum + p.rating, 0) / team1Players.length;
  const team2AvgRating = team2Players.reduce((sum, p) => sum + p.rating, 0) / team2Players.length;
  
  // Calculate as if it was a singles match with average ratings
  const avgGamesPlayed = [...team1Players, ...team2Players]
    .reduce((sum, p) => sum + p.gamesPlayed, 0) / (team1Players.length + team2Players.length);
  
  const mockWinner = team1Won 
    ? { rating: team1AvgRating, gamesPlayed: avgGamesPlayed }
    : { rating: team2AvgRating, gamesPlayed: avgGamesPlayed };
  
  const mockLoser = team1Won
    ? { rating: team2AvgRating, gamesPlayed: avgGamesPlayed }
    : { rating: team1AvgRating, gamesPlayed: avgGamesPlayed };
  
  const ratingChanges = calculateEloRatings(mockWinner, mockLoser);
  
  // Apply half the change to each player (doubles impact is diluted)
  const results: Array<{ newRating: number; ratingChange: number }> = [];
  
  // Team 1 players
  team1Players.forEach(player => {
    const change = team1Won 
      ? Math.round(ratingChanges.winnerRatingChange * 0.5)
      : Math.round(ratingChanges.loserRatingChange * 0.5);
    results.push({
      newRating: player.rating + change,
      ratingChange: change,
    });
  });
  
  // Team 2 players
  team2Players.forEach(player => {
    const change = !team1Won
      ? Math.round(ratingChanges.winnerRatingChange * 0.5)
      : Math.round(ratingChanges.loserRatingChange * 0.5);
    results.push({
      newRating: player.rating + change,
      ratingChange: change,
    });
  });
  
  return results;
}

/**
 * Get rating tier/division based on ELO rating
 */
export function getRatingTier(rating: number): { tier: string; color: string } {
  if (rating >= 1600) return { tier: 'Elite', color: '#FFD700' };      // Gold
  if (rating >= 1400) return { tier: 'Advanced', color: '#C0C0C0' };   // Silver
  if (rating >= 1200) return { tier: 'Intermediate', color: '#CD7F32' }; // Bronze
  if (rating >= 1000) return { tier: 'Beginner', color: '#4CAF50' };   // Green
  return { tier: 'New Player', color: '#2196F3' };                     // Blue
}

/**
 * Format rating display with change indicator
 */
export function formatRatingDisplay(rating: number, change?: number): string {
  if (change === undefined) {
    return rating.toString();
  }
  
  const changeStr = change > 0 ? `+${change}` : change.toString();
  const arrow = change > 0 ? '↑' : '↓';
  return `${rating} ${arrow}${Math.abs(change)}`;
}

/**
 * Get initial rating for a new player
 */
export function getInitialRating(): number {
  return DEFAULT_RATING;
}

/**
 * Calculate rating difference message for pre-match display
 */
export function getRatingDifferenceMessage(player1Rating: number, player2Rating: number): string {
  const diff = Math.abs(player1Rating - player2Rating);
  
  if (diff < 50) return "Evenly matched!";
  if (diff < 150) return "Competitive match";
  if (diff < 300) return "Underdog opportunity!";
  return "David vs Goliath!";
}