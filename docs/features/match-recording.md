# Match Recording System Documentation

## Overview
The match recording system allows users to record tennis matches with comprehensive score tracking, offline support, and automatic synchronization to the cloud.

## Features

### Core Functionality
- **Singles & Doubles Support**: Record both match types with appropriate player/partner selection
- **Professional Score Display**: Tournament-style score formatting with tiebreak superscripts
- **Offline-First Architecture**: All matches saved locally first, then synced to Supabase
- **Search-First Player Selection**: Type to search existing players or add new ones
- **Honor System**: Match recorder has full authority over scores (no confirmation needed)

### Technical Features
- **Automatic Retry**: Failed syncs retry with exponential backoff
- **Queue Persistence**: Pending syncs survive app restarts
- **Network-Aware**: Auto-syncs when connectivity returns
- **Error Recovery**: Graceful handling of all failure scenarios

## User Interface

### Recording a Match
1. **Access Points**:
   - "Record Match" button in main Clubs tab header
   - "Record Match" button in club detail screen

2. **Match Form Fields**:
   - **Match Type**: Radio buttons for Singles/Doubles
   - **Opponent Selection**: Search field with auto-suggestions
   - **Partner Selection** (Doubles only): Search field for your partner
   - **Opponent's Partner** (Doubles only): Search field
   - **Score Entry**: Add sets with score validation
   - **Tiebreak Scores**: Automatic fields for 7-6 sets
   - **Match Date**: Visual calendar picker
   - **Notes**: Optional match notes

3. **Validation**:
   - Tennis score rules (must have a winner)
   - Required opponent selection
   - Valid set scores (e.g., 6-4, 7-5, 7-6)
   - Tiebreak validation when applicable

### Match History View
- **Location**: Profile tab → Match History section
- **Features**:
  - Professional score display with winner highlighting
  - Match date and type indicators
  - Pull-to-refresh functionality
  - Empty state for new users

### Error Handling
- **UI Notifications**: Toast-style messages (no alerts)
- **Offline Mode**: Clear messaging when offline
- **Sync Status**: Visual indicators for pending operations

## Code Architecture

### Key Components
```typescript
// Main form component
components/MatchRecordingForm.tsx
- Handles all form logic and validation
- Search-first player selection
- Tennis score validation

// History display
components/MatchHistoryView.tsx
- Shows user's match history
- Pull-to-refresh support
- Empty state handling

// Score display
components/TennisScoreDisplay.tsx
- Professional tournament-style formatting
- Tiebreak superscript notation
- Winner highlighting
```

### Service Layer
```typescript
// Match service with offline queue
services/matchService.ts
- recordMatch(): Saves locally then queues for sync
- getMatchHistory(): Retrieves user's matches
- getMatchStats(): Calculates statistics

// Sync service
services/sync/index.ts
- queueMatchCreation(): Adds match to sync queue
- Automatic retry with exponential backoff
```

### Database Schema
```sql
-- Local SQLite schema
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  player1_id TEXT,
  player2_id TEXT,
  opponent2_name TEXT,
  player3_id TEXT,      -- Doubles partner
  partner3_name TEXT,   -- Unregistered partner
  player4_id TEXT,      -- Opponent's partner
  partner4_name TEXT,   -- Unregistered opponent partner
  scores TEXT NOT NULL,
  match_type TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id)
);
```

## Offline Queue Integration

### How It Works
1. User records match → Saved to SQLite immediately
2. Match queued for sync with unique operation ID
3. Background sync attempts when online
4. Exponential backoff for failed syncs
5. Dead letter queue for permanently failed operations

### Queue Operations
```typescript
// Queue a match for sync
await syncService.queueMatchCreation(matchData, localMatchId);

// Monitor sync status
const { isOnline, pendingCount, failedCount } = useSync();
```

## Testing

### Manual Testing Checklist
- [ ] Record singles match with registered opponent
- [ ] Record singles match with unregistered opponent
- [ ] Record doubles match with all players
- [ ] Test tiebreak score entry (7-6)
- [ ] Test offline mode (airplane mode)
- [ ] Test sync when coming back online
- [ ] Test form validation errors
- [ ] Test match history refresh
- [ ] Test empty states

### Edge Cases
- Network failure during sync
- Invalid tennis scores
- Missing opponent selection
- Duplicate match prevention
- Large score entries

## Future Enhancements
1. **Match Editing**: Allow recorder to edit their matches
2. **Match Deletion**: Add delete with confirmation
3. **Statistics Dashboard**: Visual charts and trends
4. **Match Confirmation**: Optional confirmation from opponent
5. **Time Validation**: Reasonable match duration checks