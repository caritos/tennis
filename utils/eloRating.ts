/**
 * ELO Rating System for Tennis Clubs
 * 
 * This system rewards players for beating stronger opponents and penalizes
 * losses to weaker opponents. It creates a self-balancing competitive environment.
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
 * Calculate new ratings after a match
 * @param winner - Winner's current rating info
 * @param loser - Loser's current rating info
 * @returns New ratings and changes for both players
 */
export function calculateEloRatings(
  winner: { rating: number; gamesPlayed: number },
  loser: { rating: number; gamesPlayed: number }
): RatingChange {
  // Calculate expected scores
  const winnerExpected = getExpectedScore(winner.rating, loser.rating);
  const loserExpected = getExpectedScore(loser.rating, winner.rating);
  
  // Get K-factors based on experience
  const winnerK = getKFactor(winner.gamesPlayed);
  const loserK = getKFactor(loser.gamesPlayed);
  
  // Calculate rating changes
  // Winner gets: K * (1 - expectedScore)
  // Loser gets: K * (0 - expectedScore)
  const winnerChange = Math.round(winnerK * (1 - winnerExpected));
  const loserChange = Math.round(loserK * (0 - loserExpected));
  
  // Ensure minimum changes to prevent stagnation
  const adjustedWinnerChange = Math.max(5, winnerChange);
  const adjustedLoserChange = Math.min(-5, loserChange);
  
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