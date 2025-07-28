# Challenge System Documentation

## Overview
The Challenge System enables direct player-to-player match invitations within tennis clubs. It provides a structured way for players to challenge specific opponents, negotiate match details, and automatically share contact information upon acceptance.

## Features

### Core Functionality
- **Direct Player Challenges**: Challenge specific players from club rankings
- **Match Negotiation**: Recipients can accept, decline, or counter with modified details
- **Automatic Contact Sharing**: Phone numbers shared after challenge acceptance
- **WhatsApp Integration**: Direct WhatsApp messaging for confirmed matches
- **Offline Support**: Works offline with automatic sync when connected
- **Real-Time Updates**: Live status updates for all challenge activities

### Challenge Flow
1. **Challenge Creation**: Select player → Set match details → Send invitation
2. **Response Options**: Accept, decline, or counter-challenge with modifications
3. **Contact Sharing**: Automatic phone number exchange after acceptance
4. **Match Coordination**: Direct communication via phone/WhatsApp

## User Interface

### Challenge Creation Flow
**Step 1: Player Selection**
- Access via "Challenge" button on player ranking cards
- Pre-selected opponent from ranking system
- Club membership validation

**Step 2: Match Details**
- **Match Type**: Singles or Doubles radio selection
- **Date**: Smart date picker (Today/Tomorrow/Custom)
- **Time**: Optional time field with format validation
- **Location**: Optional court/location specification
- **Notes**: Additional match preferences or requirements

**Step 3: Confirmation**
- Review all challenge details
- Send or cancel options
- Loading state during submission

### Challenge Management
**Incoming Challenges Section**
- Dedicated section in club details or profile
- Challenge cards showing:
  - Challenger name and match details
  - Proposed date, time, location
  - Accept/Decline/Counter buttons
  - Time remaining (challenges expire in 7 days)

**Outgoing Challenges Tracking**
- View sent challenges and their status
- Cancel pending challenges
- See response history

### Contact Sharing Interface
**Post-Acceptance View**
- Automatic contact information display
- WhatsApp quick action button
- Phone number with direct call option
- Contact preference respect (WhatsApp vs Phone vs Text)

## Code Architecture

### Database Schema

```sql
-- Main challenges table
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  challenger_id TEXT NOT NULL,
  challenged_id TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK(match_type IN ('singles', 'doubles')),
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (challenger_id) REFERENCES users(id),
  FOREIGN KEY (challenged_id) REFERENCES users(id)
);

-- Challenge responses for counter-challenges
CREATE TABLE challenge_responses (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL,
  responder_id TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK(response_type IN ('accept', 'decline', 'counter')),
  modified_date TEXT,
  modified_time TEXT,
  modified_location TEXT,
  modified_notes TEXT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id),
  FOREIGN KEY (responder_id) REFERENCES users(id)
);

-- Updated users table with contact preferences
ALTER TABLE users ADD COLUMN contact_preference TEXT DEFAULT 'phone' 
  CHECK(contact_preference IN ('phone', 'whatsapp', 'text'));
```

### Service Layer

```typescript
// Challenge service
services/challengeService.ts

class ChallengeService {
  // Core challenge operations
  async createChallenge(data: CreateChallengeData): Promise<Challenge>
  async getUserChallenges(userId: string, type: 'incoming' | 'outgoing'): Promise<Challenge[]>
  async respondToChallenge(challengeId: string, response: ChallengeResponse): Promise<void>
  async cancelChallenge(challengeId: string, userId: string): Promise<void>
  
  // Contact sharing
  async getContactInformation(userId: string): Promise<ContactInfo>
  async shareContact(challengeId: string): Promise<ContactInfo>
}

// Type definitions
interface CreateChallengeData {
  clubId: string;
  challengedId: string;
  matchType: 'singles' | 'doubles';
  date: string;
  time?: string;
  location?: string;
  notes?: string;
}

interface ChallengeResponse {
  type: 'accept' | 'decline' | 'counter';
  modifiedDate?: string;
  modifiedTime?: string;
  modifiedLocation?: string;
  modifiedNotes?: string;
  message?: string;
}
```

### UI Components

```typescript
// Challenge creation modal
components/ChallengeModal.tsx
- 3-step challenge creation flow
- Form validation and error handling
- Integration with player selection
- Match details input with smart defaults

// Challenge notification management
components/ChallengeNotificationSection.tsx
- Display incoming challenges
- Accept/decline/counter actions
- Real-time status updates
- Challenge expiration handling

// Contact sharing interface
components/ContactSharingView.tsx
- Post-acceptance contact display
- WhatsApp/phone integration
- Contact preference handling
- Privacy-compliant information sharing
```

### Offline Queue Integration

```typescript
// Challenge sync strategies
services/offlineQueue/SyncStrategies.ts

Supported operations:
- create_challenge: Queue new challenge invitations
- respond_challenge: Queue acceptance/decline/counter responses
- cancel_challenge: Queue challenge cancellations
- share_contact: Queue contact information sharing
```

## Challenge States and Workflow

### Challenge Lifecycle
1. **Created**: Initial challenge sent
2. **Pending**: Awaiting response from challenged player
3. **Accepted**: Challenge accepted, contact info shared
4. **Declined**: Challenge declined by recipient
5. **Countered**: Recipient proposed modifications
6. **Cancelled**: Cancelled by challenger
7. **Expired**: Challenge expired (7 days)

### Counter-Challenge Flow
1. **Initial Challenge**: Player A challenges Player B
2. **Counter Proposal**: Player B modifies details (date/time/location)
3. **Re-evaluation**: Player A reviews modified proposal
4. **Final Decision**: Accept modified terms or decline

### Contact Sharing Process
1. **Challenge Acceptance**: Player accepts challenge
2. **Contact Exchange**: Automatic phone number sharing
3. **Platform Selection**: WhatsApp vs Phone based on preferences
4. **Direct Communication**: Players coordinate via preferred method

## Business Rules

### Challenge Rules
- **Expiration**: Challenges expire after 7 days if not responded to
- **Self-Challenge**: Players cannot challenge themselves
- **Duplicate Prevention**: One active challenge per player pair
- **Club Membership**: Both players must be club members
- **Response Uniqueness**: One response per challenge per user

### Contact Sharing Rules
- **Automatic Sharing**: Phone numbers shared immediately upon acceptance
- **Preference Respect**: Contact method based on user preferences
- **Privacy Protection**: Only phone numbers shared, no other personal data
- **Bidirectional**: Both challenger and challenged receive contact info

## Notification System

### Challenge Notifications
- **New Challenge**: Notification when challenged
- **Challenge Response**: Notification when challenge is answered
- **Counter-Challenge**: Notification when modifications are proposed
- **Contact Shared**: Notification when contact info is available
- **Challenge Expiry**: Warning notifications before expiration

### Notification Types
- **In-App**: UI banners with action buttons
- **Badge Counts**: Unread challenge indicators
- **Status Updates**: Real-time challenge status changes

## Integration Points

### Club Rankings Integration
- **Challenge Buttons**: Direct challenge from player ranking cards
- **Player Selection**: Pre-populated opponent information
- **Club Context**: Challenges scoped to specific clubs

### Profile Integration
- **Contact Preferences**: User-configurable contact methods
- **Challenge History**: Track sent and received challenges
- **Settings**: Privacy and notification preferences

### Match Recording Integration
- **Accepted Challenges**: Can be recorded as completed matches
- **Player Information**: Pre-populated match participant data
- **Match Details**: Date/time/location from challenge details

## Testing

### Manual Testing Checklist
- [ ] Create challenge from ranking
- [ ] Accept challenge
- [ ] Decline challenge
- [ ] Counter-challenge with modifications
- [ ] Cancel own challenge
- [ ] Test contact sharing
- [ ] Test WhatsApp integration
- [ ] Test challenge expiration
- [ ] Test offline mode
- [ ] Test duplicate challenge prevention

### Edge Cases
- Challenge response while offline
- Challenge expiration during response
- Contact sharing failure
- Invalid phone number handling
- Simultaneous challenge creation

## Security Considerations

### Data Privacy
- **Contact Information**: Only shared after explicit acceptance
- **Challenge Details**: Visible only to involved parties
- **Club Scoping**: Challenges limited to club members

### Validation
- **Input Sanitization**: All user inputs validated and sanitized
- **Date Validation**: Future dates only, reasonable time ranges
- **Permissions**: Users can only respond to their own challenges

## Future Enhancements

1. **Group Challenges**: Challenge multiple players for doubles
2. **Recurring Challenges**: Weekly/monthly challenge templates
3. **Challenge Analytics**: Track challenge success rates and response times
4. **Advanced Notifications**: Push notifications for time-sensitive challenges
5. **Calendar Integration**: Add accepted challenges to device calendar
6. **Skill-Based Matching**: Suggest appropriate challenge opponents
7. **Challenge Leaderboard**: Most active challengers and challenge acceptance rates