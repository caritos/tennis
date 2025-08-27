# Challenge Match Flow - Wireframes (Code-Based)

## Overview
The Challenge Match flow allows tennis players to challenge other club members for matches. It consists of a modal-based challenge creation form followed by a match recording screen. Based on actual ChallengeFlowModal.tsx and RecordChallengeMatchScreen components.

## User Flow Diagram

```
┌─────────────────┐
│   Club Screen   │
│   (Rankings     │
│   or Members)   │
└────────┬────────┘
         │ Tap "Challenge" button on player
         ▼
┌─────────────────┐
│ Challenge Flow  │
│   Modal (1/4)   │
│   Match Type    │
└────────┬────────┘
         │ Select Singles/Doubles
         ▼
┌─────────────────┐
│ Challenge Flow  │
│   Modal (2/4)   │
│ Player Selection│
│  (Doubles only) │
└────────┬────────┘
         │ Select additional players
         ▼
┌─────────────────┐
│ Challenge Flow  │
│   Modal (3/4)   │
│ Timing Options  │
└────────┬────────┘
         │ Choose when to play
         ▼
┌─────────────────┐
│ Challenge Flow  │
│   Modal (4/4)   │
│ Message & Send  │
└────────┬────────┘
         │ Send Challenge(s)
         ▼
┌─────────────────┐
│ Success         │
│ Notification    │
│ "Challenge      │
│ Sent!"          │
└────────┬────────┘
         │ Wait for acceptance
         ▼
┌─────────────────┐
│ Record Challenge│
│ Match Results   │
│ (/record-       │
│ challenge-match)│
└─────────────────┘
```

---

## Screen 1: Challenge Flow Modal - Match Type Selection

```
┌─────────────────────────────────────┐
│ Status Bar                     9:41 │
├─────────────────────────────────────┤
│  ←         Challenge Match           │
├─────────────────────────────────────┤
│                                     │
│  Match Type                         │
│                                     │
│  ┌─────────────────┐ ┌─────────────┐│
│  │ ○ Singles       │ │ ● Doubles   ││
│  └─────────────────┘ └─────────────┘│
│                                     │
│  When would you like to play?       │
│                                     │
│  ┌─────────┐ ┌─────────┐            │
│  │ ● Today │ │ ○ Tomorrow│            │
│  └─────────┘ └─────────┘            │
│  ┌─────────┐ ┌─────────┐            │
│  │○Weekend │ │○Next Week│            │
│  └─────────┘ └─────────┘            │
│  ┌─────────┐                        │
│  │○Flexible│                        │
│  └─────────┘                        │
│                                     │
│  Message (Optional)                 │
│  ┌─────────────────────────────┐   │
│  │ Hey! Want to play a match?  │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│      ┌─────────────────┐           │
│      │ Send Challenge  │           │
│      └─────────────────┘           │
└─────────────────────────────────────┘
```

### Components:
- **Header**: Back chevron (←) + consistent title ("Challenge Match")
- **Match Type Selection**: Radio buttons for Singles/Doubles
- **Timing Options**: 5 options (Today, Tomorrow, Weekend, Next Week, Flexible)
- **Message Input**: Optional text area with contextual placeholder
- **Form Actions**: Single full-width Send Challenge button with iOS styling

---

## Screen 2: Challenge Flow Modal - Doubles Player Selection

```
┌─────────────────────────────────────┐
│ Status Bar                     9:41 │
├─────────────────────────────────────┤
│  ←         Challenge Match           │
├─────────────────────────────────────┤
│                                     │
│  Match Type                         │
│  ┌─────────────────┐ ┌─────────────┐│
│  │ ○ Singles       │ │ ● Doubles   ││
│  └─────────────────┘ └─────────────┘│
│                                     │
│  Select 1-3 players to invite for   │
│  doubles (2 selected)               │
│                                     │
│  Selected players:                  │
│  ┌──────────────┐ ┌──────────────┐ │
│  │ John D.   🔒 │ │ Sarah M.  ✕ │ │
│  └──────────────┘ └──────────────┘ │
│                                     │
│  🔍 Search players by name...       │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Mike Johnson            ⊕   │   │
│  │ Emma Davis              ⊕   │   │
│  │ Alex Chen               ⊕   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Teams will be decided when you     │
│  meet up.                           │
│                                     │
├─────────────────────────────────────┤
│      ┌─────────────────┐           │
│      │ Send Challenge  │           │
│      └─────────────────┘           │
└─────────────────────────────────────┘
```

### Components:
- **Player Selection**: Shows selected players as chips
- **Target Player Lock**: Pre-selected player cannot be removed (🔒 icon)
- **Search Input**: Real-time search with clear button
- **Available Players List**: Scrollable list with add buttons (⊕)
- **Team Note**: Clarification about team formation
- **Single Action Button**: Full-width "Send Challenge" button with iOS styling (same for singles/doubles)

---

## Screen 3: Success Notification Messages

### Singles Challenge Success
```
┌─────────────────────────────────────┐
│                                     │
│           ✅ Challenge Sent!        │
│                                     │
│   Your singles challenge has been   │
│   sent to Sarah M.                  │
│                                     │
│              [ OK ]                 │
│                                     │
└─────────────────────────────────────┘
```

### Doubles Challenge Success  
```
┌─────────────────────────────────────┐
│                                     │
│           ✅ Challenge Sent!        │
│                                     │
│   Your doubles challenge has been   │
│   sent to: Sarah M., Mike J.,       │
│   Emma D.                           │
│                                     │
│              [ OK ]                 │
│                                     │
└─────────────────────────────────────┘
```

### Error Notification
```
┌─────────────────────────────────────┐
│                                     │
│      ❌ Failed to Send Challenge    │
│                                     │
│   Something went wrong. Please try  │
│   again.                            │
│                                     │
│              [ OK ]                 │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Success Icon**: Green checkmark (✅) for successful submissions
- **Error Icon**: Red X (❌) for failed submissions
- **Dynamic Content**: Player names inserted based on selection
- **Consistent Messaging**: "Challenge Sent!" for both singles and doubles
- **User Feedback**: Clear success/error states with actionable messages

---

## Screen 4: Record Challenge Match Results

```
┌─────────────────────────────────────┐
│ Status Bar                     9:41 │
├─────────────────────────────────────┤
│  ←        Record Challenge Results  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚔️ Challenge Match          │   │
│  │ Singles challenge           │   │
│  │ 8/27/2025 at Tennis Club    │   │
│  │                             │   │
│  │ Players:                    │   │
│  │ • John D. (Challenger)      │   │
│  │ • Sarah M. (Challenged)     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Match Winner                       │
│  ┌─────────────────┐ ┌─────────────┐│
│  │ ● John D.       │ │ ○ Sarah M.  ││
│  └─────────────────┘ └─────────────┘│
│                                     │
│  Score (Optional)                   │
│  Set 1: Match Winner [ 6 ] - [ 4 ] Loser │
│  Set 2: Match Winner [ 6 ] - [ 3 ] Loser │
│  Set 3: Match Winner [   ] - [   ] Loser │
│                                     │
│  When did you play this match?      │
│  (Proposed: Tomorrow)               │
│  ┌─────────────────────────────┐   │
│  │ August 27, 2025             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Notes (Optional)                   │
│  ┌─────────────────────────────┐   │
│  │ Great match! Very close.    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Report Issues (Optional)           │
│  Which player would you like to     │
│  report?                            │
│  ☑ Sarah M.                         │
│  □ No show    □ Unsportsmanlike     │
│                                     │
│  Additional Details                 │
│  ┌─────────────────────────────┐   │
│  │ Player arrived 30 minutes   │   │
│  │ late without notice...      │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│      ┌─────────────────┐           │
│      │   Save Match    │           │
│      └─────────────────┘           │
└─────────────────────────────────────┘
```

### Components:
- **Challenge Info Card**: Shows challenge context with sword emoji
- **Winner Selection**: Radio buttons for each player
- **Score Entry**: Optional tennis score input
- **Date Selection**: "When did you play this match?" with proposed timing context
- **Notes**: Free-form text input
- **Reporting Options**: Player selection, issue types, and detailed description field
- **Save Button**: Single action to record match

---

## Screen 5: Record Doubles Challenge Match Results

```
┌─────────────────────────────────────┐
│ Status Bar                     9:41 │
├─────────────────────────────────────┤
│  ←        Record Challenge Results  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚔️ Challenge Match          │   │
│  │ Doubles challenge           │   │
│  │ 8/27/2025 at Tennis Club    │   │
│  │                             │   │
│  │ Players:                    │   │
│  │ • John D. (Challenger)      │   │
│  │ • Sarah M. (Challenger)     │   │
│  │ • Mike J. (Challenged)      │   │
│  │ • Emma D. (Challenged)      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Match Winners                      │
│  Select exactly 2 players who won   │
│  the match                          │
│                                     │
│  ☑ John D. (You)                   │
│  ☑ Sarah M.                        │
│  ☐ Mike J.                         │
│  ☐ Emma D.                         │
│                                     │
│  Score (Optional)                   │
│  Set 1: Match Winner [ 6 ] - [ 4 ] Loser │
│  Set 2: Match Winner [ 6 ] - [ 3 ] Loser │
│  Set 3: Match Winner [   ] - [   ] Loser │
│                                     │
│  When did you play this match?      │
│  (Proposed: This Weekend)           │
│  ┌─────────────────────────────┐   │
│  │ August 27, 2025             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Notes (Optional)                   │
│  ┌─────────────────────────────┐   │
│  │ Great doubles match! Close  │   │
│  │ games throughout.           │   │
│  └─────────────────────────────┘   │
│                                     │
│  Report Issues (Optional)           │
│  Which player(s) would you like to  │
│  report?                            │
│  ☑ Sarah M.  ☐ Mike J.  ☐ Emma D.   │
│  □ No show    □ Unsportsmanlike     │
│                                     │
│  Additional Details                 │
│  ┌─────────────────────────────┐   │
│  │ Player was consistently     │   │
│  │ arguing with the referee... │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│      ┌─────────────────┐           │
│      │   Save Match    │           │
│      └─────────────────┘           │
└─────────────────────────────────────┘
```

### Components:
- **Challenge Info Card**: Shows all 4 players in the doubles challenge (2 challengers + 2 challenged)
- **Winner Selection**: Checkboxes to select exactly 2 players who won the match
- **Score Entry**: Optional tennis score input (Set 1, Set 2, Set 3)
- **Date Selection**: "When did you play this match?" with proposed timing context
- **Notes**: Free-form text input for match details
- **Reporting Options**: Multi-select players to report, issue types, and detailed description field
- **Save Button**: Single action to record doubles match

### Key Changes for Doubles Challenges:
- **2-to-2 Challenge System**: Shows all 4 players involved in the doubles match
- **Winner Selection**: Select exactly 2 winners from the 4 players (checkboxes)
- **Team Formation**: Teams are formed during challenge creation (challenger team vs challenged team)
- **Flexible Reporting**: Can report any of the other 3 players

---

## Post-Save Notifications

After successfully recording match results, users receive subtle confirmation feedback through the notification system in the overview tab, rather than intrusive modal dialogs.

### Success Notification (Match Only) - Overview Tab
```
┌─────────────────────────────────────┐
│ 🎾 Overview                    [•]  │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Match Recorded!              │ │
│ │ Challenge match has been saved  │ │
│ │ successfully.                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Your recent matches...              │
│                                     │
└─────────────────────────────────────┘
```

### Success Notification (Match + Reports) - Overview Tab
```
┌─────────────────────────────────────┐
│ 🎾 Overview                    [•]  │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Match Recorded!              │ │
│ │ Challenge match has been saved  │ │
│ │ successfully and reports        │ │
│ │ submitted.                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Your recent matches...              │
│                                     │
└─────────────────────────────────────┘
```

### Error Notification - Overview Tab
```
┌─────────────────────────────────────┐
│ 🎾 Overview                    [•]  │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ❌ Error                        │ │
│ │ Failed to save match. Please    │ │
│ │ try again.                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Your recent matches...              │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Success Icon**: Green checkmark (✅) for successful match recording
- **Error Icon**: Red X (❌) for failed saves
- **Dynamic Content**: Message varies based on whether reports were also submitted
- **Navigation**: Automatic dismissal after 3 seconds (success) or 5 seconds (error)
- **User Feedback**: Subtle, non-intrusive notifications that appear at the top of the overview tab
- **Integration**: Uses existing NotificationContext system for consistent user experience

---

## Technical Implementation Details

### Challenge Creation Flow

1. **Modal Presentation**:
   - Uses `Modal` with `presentationStyle="pageSheet"`
   - Safe area handling with `SafeAreaView`
   - Dynamic header title based on context

2. **Form State Management**:
   ```typescript
   interface FormState {
     matchType: 'singles' | 'doubles'
     selectedPlayers: Player[]
     selectedTime: TimeOption
     message: string
   }
   ```

3. **Player Loading**:
   - Fetches club members from `club_memberships` table
   - Excludes current user from available players
   - Auto-selects target player when provided

4. **Challenge Submission**:
   - Singles: Single challenge record
   - Doubles: Multiple challenges (one per selected player)
   - 7-day expiration automatically set
   - Success notification with consistent messaging

5. **Notification System**:
   ```typescript
   // Success notifications to challenger
   showSuccess('Challenge Sent!', message);
   
   // Singles message
   `Your singles challenge has been sent to ${playerName}.`
   
   // Doubles message  
   `Your doubles challenge has been sent to: ${playerNames}.`
   
   // Error handling
   showError('Failed to Send Challenge', 'Something went wrong. Please try again.');
   ```

## Challenge Notifications to Recipients

When a challenge is sent, the challenged players receive notifications through the system:

### Singles Challenge Notification
```
┌─────────────────────────────────────┐
│ 🎾 New Challenge!                   │
├─────────────────────────────────────┤
│ John Smith has challenged you to a  │
│ singles match at Westwood Club.     │
│                                     │
│ Proposed Date: Tomorrow             │
│ Message: "Hey! Want to play a       │
│ match?"                             │
│                                     │
│ [ View ]                            │
└─────────────────────────────────────┘
```

### Doubles Challenge Notification (Each Player)
```
┌─────────────────────────────────────┐
│ 🎾 New Challenge!                   │
├─────────────────────────────────────┤
│ Sarah Johnson has challenged you    │
│ and 2 others to doubles at          │
│ Westwood Club.                      │
│                                     │
│ Proposed Date: This Weekend         │
│ Players: Sarah, Mike, You, Lisa     │
│                                     │
│ Message: "Want to play doubles?     │
│ We'll figure out teams when we get  │
│ there!"                             │
│                                     │
│ [ View ]                            │
└─────────────────────────────────────┘
```

### Challenge Status Updates

When players accept or decline challenges, status notifications are sent:

#### Acceptance Notification (to Challenger)
```
┌─────────────────────────────────────┐
│ ✅ Challenge Accepted!               │
├─────────────────────────────────────┤
│ Lisa Davis has accepted your        │
│ singles challenge for tomorrow      │
│ at Westwood Club.                   │
│                                     │
│ [ Record Match ] [ Message Lisa ]   │
└─────────────────────────────────────┘
```

#### Doubles Group Coordination
```
┌─────────────────────────────────────┐
│ 🎾 Match Ready!                     │
├─────────────────────────────────────┤
│ All players have accepted your      │
│ doubles challenge for this weekend  │
│ at Westwood Club.                   │
│                                     │
│ Players: Sarah, Mike, You, Lisa     │
│                                     │
│ [ View Details ]                    │
└─────────────────────────────────────┘
```

#### Declination Notification
```
┌─────────────────────────────────────┐
│ ❌ Challenge Declined                │
├─────────────────────────────────────┤
│ Mike Wilson declined your doubles   │
│ challenge for this weekend.         │
│                                     │
│ The challenge remains open for      │
│ other players.                      │
│                                     │
│ [ Find New Player ] [ Cancel ]      │
└─────────────────────────────────────┘
```

### Notification Features:
- **Real-time Delivery**: Notifications sent immediately when challenges are created
- **Contact Sharing**: Phone numbers automatically shared and available in match details when challenges are accepted
- **Status Updates**: Live updates when players accept/decline
- **Expiration Reminders**: 24-hour reminders before challenges expire
- **Group Coordination**: For doubles, all 4 players receive contact information once everyone accepts

### Match Recording Flow

1. **Challenge Validation**:
   - Verifies challenge status is "accepted"
   - Loads challenge details with player info
   - Shows challenge context card

2. **Match Data Structure**:
   ```typescript
   interface MatchData {
     challenge_id: string
     winner_id: string
     scores?: string[]
     match_date: string // Actual date played, not proposed
     notes?: string
   }
   ```

3. **Smart Date Pre-filling**:
   ```typescript
   // Convert challenge timing to suggested actual date
   const getPrefilledDate = (proposedDate: TimeOption, challengeCreatedAt: string) => {
     const challengeDate = new Date(challengeCreatedAt);
     switch (proposedDate) {
       case 'today': return new Date();
       case 'tomorrow': return addDays(challengeDate, 1);
       case 'weekend': return getNextWeekend(challengeDate);
       case 'next_week': return addDays(challengeDate, 7);
       default: return new Date(); // For 'flexible'
     }
   };
   ```

4. **Challenge Completion**:
   - Records match with `challenge_id` link
   - Updates challenge status to "completed"
   - Links challenge to saved match

### iOS HIG Enhancements
- **Single Action Design**: Removed Cancel button, users can use back chevron
- **Full-width Buttons**: Single action button with iOS-native styling (12px radius, shadows)
- **Enhanced Accessibility**: Proper accessibility roles and state announcements
- **iOS Typography**: 17px button text for optimal readability
- **Touch Targets**: 50px minimum height for accessibility compliance

### Navigation Patterns
- Modal slides up from bottom
- Back chevron consistently positioned (only navigation control needed)
- Form progression feels natural
- Success flows return to origin

---

## Key UX Decisions

### Simplified Doubles Flow
- Send individual challenges rather than group coordination
- Teams decided in person to reduce complexity
- Target player locked to maintain context

### Flexible Timing
- 5 predefined options cover common scenarios
- "Flexible" option for open scheduling
- No complex calendar picker to reduce friction

### Integrated Reporting
- Safety reporting built into match recording
- Context-aware report submission
- Maintains player safety without separate flows

### Challenge-Match Linking
- Direct connection between challenge and match
- Preserves challenge context in match records
- Enables challenge completion tracking

### iOS HIG Compliance
- **Streamlined Actions**: Single primary button eliminates decision complexity
- **Consistent Navigation**: Back chevron provides familiar iOS navigation pattern
- **Native Styling**: Full-width buttons with proper shadows and typography
- **Accessibility First**: Enhanced VoiceOver support and proper touch targets

### Smart Date Handling
- **Contextual Pre-filling**: Converts vague challenge timing to suggested actual dates
- **Clear Purpose**: "When did you play this match?" clarifies we want actual date played
- **Reference Context**: Shows original proposed timing for user context
- **Flexibility**: Users can easily adjust if they played on a different date

---

## Error States and Edge Cases

### Challenge Creation
- No available players in club
- Network errors during submission
- Invalid player selections
- Message too long

### Match Recording
- Challenge not found or expired
- Challenge already completed
- Invalid score formats
- Network errors during save

### Data Validation
- Required field validation
- Score format validation
- Date selection constraints
- Player selection limits (doubles max 3)

---

## Future Enhancements

1. **Group Coordination**: Advanced doubles team formation
2. **Calendar Integration**: Native calendar event creation
3. **Push Notifications**: Real-time challenge updates
4. **Match Reminders**: Automated reminder system
5. **Challenge Templates**: Save common challenge formats