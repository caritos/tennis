# Profile & Stats System Documentation

## Overview
The Profile & Stats System provides comprehensive tennis performance analytics for players, displaying detailed statistics derived from their match history. It serves as the central hub for tracking tennis progress and achievements within the app.

## Features

### Core Statistics
- **Overall Performance**: Total matches, win percentage, win-loss record
- **Match Type Breakdown**: Separate statistics for singles and doubles
- **Detailed Analytics**: Sets won/lost, games won/lost with percentages
- **Real-Time Updates**: Statistics automatically refresh when new matches are recorded
- **Club Context**: Can filter statistics by specific club membership

### User Experience
- **Tennis-First Priority**: Statistics displayed prominently at top of profile
- **Professional Layout**: Modern card-based design with clear visual hierarchy
- **Responsive Design**: Optimized for all screen sizes and orientations
- **Theme Integration**: Automatic light/dark mode support
- **Accessibility**: Proper labels and structure for screen readers

## User Interface

### Statistics Display Layout
**Overall Performance Card**
- Total matches played prominently displayed
- Win percentage highlighted in theme color
- Win-loss record in clear W-L format

**Match Type Breakdown**
- Singles record with win percentage
- Doubles record with win percentage
- Side-by-side comparison of performance

**Detailed Performance Metrics**
- Sets won/lost with percentage calculation
- Games won/lost with percentage calculation
- Comprehensive performance analysis

### Empty States
**New User Experience**
- Encouraging message: "No matches played yet"
- Call-to-action: "Record your first match!"
- Tennis ball icon for visual appeal

**Error States**
- Clear error messaging
- Retry functionality
- Graceful degradation

## Code Architecture

### Component Structure

```typescript
// Main statistics display component
components/PlayerStatsDisplay.tsx

interface PlayerStatsDisplayProps {
  userId: string;
  clubId?: string; // Optional club filtering
}

// Displays comprehensive tennis statistics
export function PlayerStatsDisplay({ userId, clubId }: PlayerStatsDisplayProps)
```

### Custom Hook

```typescript
// Statistics management hook
hooks/usePlayerStats.ts

interface UsePlayerStatsReturn {
  stats: PlayerStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Manages statistics loading and state
export function usePlayerStats(userId: string, clubId?: string): UsePlayerStatsReturn
```

### Data Types

```typescript
// Statistics interface from match service
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

interface MatchRecord {
  wins: number;
  losses: number;
  winPercentage: number;
}
```

### Service Integration

```typescript
// Uses existing match service
services/matchService.ts

// Retrieves comprehensive player statistics
async getMatchStats(playerId: string, clubId?: string): Promise<PlayerStats>

// Statistics calculation includes:
// - Win/loss ratios across all match types
// - Separate singles and doubles tracking
// - Set and game level performance metrics
// - Percentage calculations with proper rounding
```

## Real-Time Updates

### Update Triggers
1. **Focus-Based Refresh**: Statistics refresh when profile tab comes into focus
2. **Match Recording**: Automatic updates when new matches are added
3. **Manual Refresh**: User-initiated refresh via pull-to-refresh
4. **Background Sync**: Updates when offline queue syncs completed matches

### Update Mechanism
```typescript
// Focus effect for automatic refresh
useFocusEffect(
  React.useCallback(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id, refresh])
);
```

## Performance Optimization

### Efficient Data Loading
- **Cached Results**: Statistics cached until match data changes
- **Minimal Re-renders**: Optimized React rendering with proper dependencies
- **Lazy Calculation**: Percentages calculated on-demand
- **Background Processing**: Heavy calculations performed asynchronously

### Memory Management
- **Component Cleanup**: Proper cleanup of async operations
- **State Management**: Efficient state updates and memory usage
- **Error Boundaries**: Graceful handling of calculation errors

## Statistics Calculations

### Win Percentage Calculation
```typescript
const winPercentage = totalMatches > 0 
  ? Math.round((wins / totalMatches) * 10000) / 100 
  : 0;
```

### Set/Game Percentages
```typescript
const setWinPercentage = (setsWon + setsLost) > 0
  ? Math.round((setsWon / (setsWon + setsLost)) * 10000) / 100
  : 0;
```

### Singles vs Doubles Breakdown
- Separate tracking of match outcomes by type
- Independent win percentage calculations
- Comprehensive performance comparison

## Error Handling

### Error States
- **Network Errors**: Handled gracefully with retry options
- **Data Corruption**: Validation of statistics calculations
- **Missing Data**: Proper handling of incomplete match records
- **Calculation Errors**: Safe math operations with zero-division protection

### User Feedback
- **Loading Indicators**: Clear feedback during data fetching
- **Error Messages**: User-friendly error descriptions
- **Retry Actions**: Allow users to retry failed operations
- **Graceful Degradation**: Partial data display when possible

## Integration Points

### Profile Screen Integration
```typescript
// app/(tabs)/profile.tsx

// Tennis stats displayed prominently at top
<ThemedView style={styles.section}>
  <ThemedText type="subtitle" style={styles.sectionTitle}>
    Tennis Stats
  </ThemedText>
  {user?.id ? (
    <PlayerStatsDisplay userId={user.id} />
  ) : (
    <PlaceholderView />
  )}
</ThemedView>
```

### Match Service Integration
- Uses existing `getMatchStats` function from match service
- Leverages same calculation logic as club rankings
- Consistent data source across app features

### Club System Integration
- Optional club filtering for club-specific statistics
- Integration with club membership display
- Consistent with club ranking calculations

## Testing

### Unit Test Coverage

**PlayerStatsDisplay Component Tests**
- Rendering with valid statistics data
- Loading states and error handling
- Empty state display for new users
- Percentage calculations and formatting
- Theme integration and styling

**usePlayerStats Hook Tests**
- Statistics loading and state management
- Error handling and retry functionality
- Focus-based refresh behavior
- Club filtering functionality

### Manual Testing Checklist
- [ ] View profile with no matches (empty state)
- [ ] View profile with match history (statistics display)
- [ ] Test singles-only player statistics
- [ ] Test doubles-only player statistics
- [ ] Test mixed match type statistics
- [ ] Verify percentage calculations accuracy
- [ ] Test loading states during data fetch
- [ ] Test error states with network issues
- [ ] Verify real-time updates after recording match
- [ ] Test focus-based refresh functionality
- [ ] Test club-specific filtering (if implemented)
- [ ] Verify theme consistency (light/dark mode)

## Accessibility Features

### Screen Reader Support
- Proper semantic structure with headings
- Descriptive labels for all statistics
- Accessible color contrast ratios
- Keyboard navigation support

### Inclusive Design
- Clear visual hierarchy for easy scanning
- High contrast for important numbers
- Consistent spacing and layout
- Readable font sizes across devices

## Future Enhancements

### Advanced Analytics
1. **Performance Trends**: Win rate over time graphs
2. **Opponent Analysis**: Performance against specific players
3. **Court Surface Tracking**: Performance by court type
4. **Time-Based Analysis**: Performance by time of day/season
5. **Streak Tracking**: Current win/loss streaks

### Visual Enhancements
1. **Charts and Graphs**: Visual representation of statistics
2. **Achievement Badges**: Milestone recognition system
3. **Performance Insights**: AI-powered performance analysis
4. **Comparison Tools**: Compare stats with other players
5. **Export Functionality**: Download statistics as PDF/CSV

### Social Features
1. **Stat Sharing**: Share achievements on social media
2. **Club Comparisons**: Compare performance across clubs
3. **Challenge Integration**: Stats-based challenge suggestions
4. **Leaderboard Integration**: Personal ranking within clubs