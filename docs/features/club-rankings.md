# Club Rankings System Documentation

## Overview
The club rankings system provides competitive leaderboards for each tennis club, using a comprehensive points-based algorithm that rewards wins, consistency, and activity.

## Features

### Visual Elements
- **Trophy Icons**: 🏆 (1st), 🥈 (2nd), 🥉 (3rd) for top players
- **Provisional Badge**: "P" indicator for players with <5 matches
- **Win-Loss Records**: Clear display of match statistics
- **Win Percentage**: Calculated and displayed for each player

### Ranking Algorithm

#### Points Calculation
```typescript
Total Points = Base Points + Bonuses - Penalties

Where:
- Base Points: 100 × wins
- Win Streak Bonus: (totalWins / totalMatches) × 200
- Consistency Bonus: 100 (if win% ≥ 60%)
- Activity Bonus: min(150, totalMatches × 10)
- Loss Penalty: 20 × losses
```

#### Sorting Logic
1. Primary: Total points (descending)
2. Secondary: Win percentage (descending)
3. Tertiary: Total matches played (descending)

### Provisional Status
- Players with fewer than 5 matches are marked provisional
- Indicated by "P" badge next to ranking number
- Encourages minimum participation for official ranking

## User Interface

### Club Detail Screen Integration
- **Location**: Club details → Rankings section
- **Display**: Top 5 players with compact view
- **Navigation**: "View All →" link to full rankings

### Full Rankings Screen
- **Route**: `/club/[id]/rankings`
- **Features**:
  - Complete member rankings
  - Ranking explanation
  - All player statistics
  - Responsive layout

### Component Structure
```typescript
// Main rankings component
components/ClubRankings.tsx
- Compact and full view modes
- Trophy icon logic
- Provisional badge display
- Interactive player rows

// Full rankings screen
app/club/[id]/rankings.tsx
- Displays all club members
- Shows ranking calculation info
- Navigation handling
```

## Code Architecture

### Service Layer
```typescript
// Match service rankings
services/matchService.ts

getClubLeaderboard(clubId: string): Promise<Array<{
  playerId: string;
  playerName: string;
  stats: PlayerStats;
  ranking: number;
  points: number;
  isProvisional: boolean;
}>>
```

### Database Queries
```sql
-- Get all players with matches in a club
SELECT DISTINCT 
  CASE 
    WHEN player1_id IS NOT NULL THEN player1_id
    ELSE player2_id
  END as player_id,
  users.full_name as player_name
FROM matches 
LEFT JOIN users ON users.id = player_id
WHERE club_id = ? 
  AND (player1_id IS NOT NULL OR player2_id IS NOT NULL)
```

### Type Definitions
```typescript
interface RankedPlayer {
  playerId: string;
  playerName: string;
  stats: PlayerStats;
  ranking: number;
  points: number;
  isProvisional: boolean;
}

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  singlesRecord: MatchRecord;
  doublesRecord: MatchRecord;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}
```

## Testing

### Unit Tests
Located in `__tests__/matchService.test.ts`:
- Points calculation accuracy
- Ranking order validation
- Provisional status detection
- Edge cases (0 matches, all wins, all losses)

### Manual Testing Checklist
- [ ] View rankings in club with 0 members
- [ ] View rankings with 1-3 members (trophy icons)
- [ ] View rankings with 4+ members
- [ ] Check provisional badge for <5 matches
- [ ] Verify "View All" navigation
- [ ] Test ranking calculations
- [ ] Verify player name display
- [ ] Check responsive layout

## Design Decisions

### Unified Rankings
- Singles and doubles combined into one leaderboard
- Simplifies user experience
- Encourages all types of play

### Points-Based System
- More nuanced than simple win percentage
- Rewards active participation
- Balances wins, consistency, and activity

### Provisional Period
- 5 matches required for official ranking
- Prevents single-match rankings
- Encourages sustained participation

## Future Enhancements
1. **Time-Based Rankings**: Monthly/yearly leaderboards
2. **Head-to-Head Records**: Player comparison view
3. **Ranking History**: Track ranking changes over time
4. **Achievement Badges**: Special recognition for milestones
5. **Ranking Notifications**: Alert when ranking changes