# Looking to Play System Documentation

## Overview
The Looking to Play system enables tennis club members to create match invitations and find playing partners. It supports both singles and doubles matches with automatic player matching and real-time notifications.

## Features

### Core Functionality
- **Match Invitations**: Create invitations for singles (2 players) or doubles (4 players)
- **One-Tap Interest**: Express interest with a single button press
- **Auto-Matching**: Automatically confirms matches when enough players respond
- **Real-Time Updates**: Live progress indicators showing player count
- **Offline Support**: Works offline with automatic sync when connected

### User Experience
- **Smart Date Selection**: Today/Tomorrow shortcuts with calendar fallback
- **Progress Tracking**: Visual indicators (e.g., "2/4 players needed")
- **Instant Feedback**: Immediate UI responses to all actions
- **Cancel Control**: Creators can cancel their own invitations
- **Notification System**: In-app notifications for all match activities

## User Interface

### Creating an Invitation
1. **Access**: Tap "Looking to Play" button in club details
2. **Match Type**: Select Singles or Doubles via radio buttons
3. **Date Selection**: 
   - Quick options: Today, Tomorrow
   - Custom date via calendar picker
4. **Time** (Optional): Specify preferred match time
5. **Notes** (Optional): Add match preferences or details
6. **Submit**: Creates invitation and notifies club members

### Viewing Invitations
- **Location**: Club details → Looking to Play section
- **Display Elements**:
  - Creator name and match type
  - Date and time (if specified)
  - Progress indicator (current/needed players)
  - "I'm Interested" button
  - Match notes (if provided)

### Response Flow
1. **Express Interest**: Tap "I'm Interested" button
2. **Immediate Feedback**: Button updates to show response
3. **Auto-Match Check**: System checks if enough players responded
4. **Match Confirmation**: Automatic match creation when quota met
5. **Notifications**: All participants receive confirmation

## Code Architecture

### Database Schema

```sql
-- Match invitations
CREATE TABLE match_invitations (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK(match_type IN ('singles', 'doubles')),
  date TEXT NOT NULL,
  time TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  max_players INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Player responses
CREATE TABLE invitation_responses (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invitation_id) REFERENCES match_invitations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(invitation_id, user_id)
);
```

### Service Layer

```typescript
// Match invitation service
services/matchInvitationService.ts

class MatchInvitationService {
  async createInvitation(data: CreateInvitationData): Promise<MatchInvitation>
  async getClubInvitations(clubId: string): Promise<InvitationWithCreator[]>
  async respondToInvitation(invitationId: string, userId: string): Promise<void>
  async cancelInvitation(invitationId: string, userId: string): Promise<void>
  async getUserResponses(userId: string): Promise<InvitationResponse[]>
}
```

### UI Components

```typescript
// Main invitation form
components/MatchInvitationForm.tsx
- Modal form for creating invitations
- Match type selection (singles/doubles)
- Date/time picker with smart defaults
- Validation and error handling

// Looking to play section
components/LookingToPlaySection.tsx
- Displays active invitations
- Interest response handling
- Real-time progress updates
- Auto-refresh functionality

// Notification system
components/NotificationBanner.tsx
- Animated slide-in notifications
- Multiple types: success, error, warning, info
- Auto-dismiss with configurable duration
```

### Offline Queue Integration

```typescript
// Sync strategies for invitations
services/offlineQueue/SyncStrategies.ts

Operations supported:
- create_invitation: Queue new invitations
- respond_invitation: Queue interest responses
- cancel_invitation: Queue cancellations
- confirm_match: Queue auto-match confirmations
```

## Auto-Matching Logic

### Singles Matches
- **Required Players**: 2 (creator + 1 respondent)
- **Trigger**: When first player expresses interest
- **Result**: Automatic match creation with both players

### Doubles Matches
- **Required Players**: 4 (creator + 3 respondents)
- **Trigger**: When third player expresses interest
- **Result**: Automatic match creation with all four players

### Match Creation Process
1. **Check Quota**: Verify enough players have responded
2. **Create Match**: Generate match record with all participants
3. **Update Status**: Mark invitation as 'confirmed'
4. **Send Notifications**: Notify all participants of match confirmation
5. **Queue Sync**: Add match to offline queue for cloud sync

## Notification System

### Types of Notifications
- **Success**: Invitation created, interest recorded, match confirmed
- **Error**: Invalid data, duplicate responses, permission errors
- **Warning**: Invitation expiring, cancellation notices
- **Info**: General status updates and information

### Notification Behavior
- **Animation**: Slide-in from top with smooth transitions
- **Duration**: Auto-dismiss after 3-5 seconds (configurable)
- **Actions**: Optional action buttons for interactive responses
- **Persistence**: Notifications survive navigation within app

## Business Rules

### Invitation Rules
- **Expiration**: Invitations expire after 7 days
- **Duplicates**: Users cannot respond to same invitation twice
- **Cancellation**: Only creators can cancel their invitations
- **Status Updates**: Real-time progress indicators

### Auto-Match Rules
- **Singles**: 2 players total (creator + 1 respondent)
- **Doubles**: 4 players total (creator + 3 respondents)
- **Timing**: Immediate when quota reached
- **Fairness**: First-come, first-served response handling

## Testing

### Manual Testing Checklist
- [ ] Create singles invitation
- [ ] Create doubles invitation
- [ ] Respond to invitation (own/others)
- [ ] Test auto-matching (singles/doubles)
- [ ] Cancel own invitation
- [ ] Test expired invitations
- [ ] Test offline mode
- [ ] Test notification system
- [ ] Test duplicate response prevention

### Edge Cases
- Invitation expiration during response
- Network failure during creation
- Multiple simultaneous responses
- Creator response to own invitation
- Invalid date/time selections

## Future Enhancements

1. **Location Integration**: Specify court/location preferences
2. **Skill Level Matching**: Match players by similar skill levels
3. **Recurring Invitations**: Weekly/monthly repeating matches
4. **Group Messaging**: Chat between matched players
5. **Calendar Integration**: Add matches to device calendar
6. **Push Notifications**: Real-time alerts outside app
7. **Advanced Filters**: Filter by time, skill level, match type