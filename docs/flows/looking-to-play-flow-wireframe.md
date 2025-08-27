# Looking to Play Flow - Complete Wireframes (Code-Based)

## Overview
The Looking to Play flow enables tennis players to create match invitations and find playing partners within their club. This comprehensive wireframe covers the complete end-to-end flow including all screens, notifications, and user interactions. Based on actual React Native components: MatchInvitationForm.tsx, MatchInvitationNotification.tsx, ClubMatches.tsx, and DoublesMatchParticipants.tsx.

## Complete User Flow Diagram

```
┌─────────────────┐
│   Club Screen   │ ────┐
│   (Overview)    │     │ 1. User taps "Looking to Play" 
│                 │     │    button in Quick Actions
└─────────────────┘ ◄───┘
         │
         ▼
┌─────────────────┐
│ Match Invitation│ ◄─── SCREEN 1: Looking to Play Form
│ Form Modal      │      • Match Type Selection (Singles/Doubles)
│ (Timing +       │      • Timing Options (Today/Tomorrow/Weekend/etc)
│  Notes)         │      • Notes (Optional)
└────────┬────────┘
         │ 2. Post Invitation (Modal closes)
         ▼
┌─────────────────┐      ┌─────────────────┐
│ CREATOR         │      │ CLUB MEMBERS    │
│ Waits for       │────▶ │ Receive         │ ◄─── SCREEN 2: Invitation Notification
│ Responses       │      │ Notification    │      • Shows invitation details  
└─────────────────┘      └────────┬────────┘      • "View Match Detail" button
         │                         │ 3. Tap "View Match Detail"
         │                         ▼
         │               ┌─────────────────┐
         │               │ Matches Tab     │ ◄─── SCREEN 3: Matches Tab (Invitation Display)
         │               │ (Looking to     │      • Grid-style participant slots
         │               │  Play Card)     │      • "Join Match" buttons
         │               └────────┬────────┘      • Contact info when matched
         │                        │ 4. Join Match
         │                        ▼
         │               ┌─────────────────┐
         │               │ Auto-Match      │ ◄─── SCREEN 4: Auto-Match Logic
         │◄──────────────│ Check & Contact │      • Singles: 2 players = match
         │               │ Info Sharing    │      • Doubles: 4 players = match
         │               └─────────────────┘      • Contact sharing automatic
         │ 5. Match ready (enough players)
         ▼
┌─────────────────┐
│ All players     │      ┌─────────────────┐
│ can now record  │────▶ │ Record Match    │ ◄─── SCREEN 5: Match Recording
│ match results   │      │ Results Screen  │      • Winner selection
└─────────────────┘      └────────┬────────┘      • Scoring entry
                                  │ 6. Save match
                                  │    Success: Navigate back
                                  │    Error: Stay on screen
                                  ▼
                         ┌─────────────────┐
                         │ Back to         │ ◄─── Success: Returns to previous screen
                         │ Club Screen     │      • Match appears in matches list
                         │ (Match in list) │      • No success notification needed
                         └─────────────────┘
```

---

## Screen 1: Looking to Play Form Modal

```
┌─────────────────────────────────────┐
│ Status Bar                     9:41 │
├─────────────────────────────────────┤
│  ←         Looking to Play           │
├─────────────────────────────────────┤
│                                     │
│  Match Type                         │
│                                     │
│  ┌─────────────────┐ ┌─────────────┐│
│  │ ● Singles       │ │ ○ Doubles   ││
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
│  Notes                              │
│  ┌─────────────────────────────────┐│
│  │ Looking for competitive singles │ │
│  │ match. Intermediate level       │ │
│  │ preferred.                      │ │
│  └─────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│    ┌────────┐    ┌────────────────┐ │
│    │ Cancel │    │      Post      │ │
│    └────────┘    └────────────────┘ │
└─────────────────────────────────────┘
```

### Components:
- **Header**: Back chevron (←) + "Looking to Play" title
- **Match Type Selection**: Radio buttons for Singles/Doubles
- **Timing Options**: 5 timing options (Today, Tomorrow, Weekend, Next Week, Flexible)
- **Notes Input**: Multiline TextInput with contextual placeholder
- **Form Actions**: Cancel and Post buttons with iOS styling

---

## Screen 2: Invitation Notification (to Club Members)

When an invitation is posted, club members receive this notification in their club overview:

### Singles Invitation Notification
```
┌─────────────────────────────────────┐
│ Club Overview                  9:41 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 New singles invitation       │ │
│ │                                 │ │
│ │ John Smith is looking for a     │ │
│ │ singles partner on Tomorrow     │ │
│ │                                 │ │
│ │ 2h ago                          │ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │    View Match Detail    →   │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                            ✕    │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Doubles Invitation Notification
```
┌─────────────────────────────────────┐
│ Club Overview                  9:41 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 New doubles invitation       │ │
│ │                                 │ │
│ │ Sarah Johnson is looking for    │ │
│ │ players for a doubles match on  │ │
│ │ Saturday                        │ │
│ │                                 │ │
│ │ 45m ago                         │ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │    View Match Detail    →   │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                            ✕    │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Notification Card**: Rounded card with tennis ball icon
- **Dynamic Content**: Shows match type, creator name, and date
- **Time Stamp**: Shows time since creation ("2h ago", "45m ago")
- **Single Action**: "View Match Detail" button navigates to Matches tab
- **Dismiss**: X button to dismiss notification locally
- **Auto-Dismiss**: Can be configured to auto-hide after time

---

## Screen 3: Matches Tab - Looking to Play Display

When users tap "View Match Detail", they navigate to the Matches tab where invitations are displayed:

### Singles Invitation in Matches Tab
```
┌─────────────────────────────────────┐
│ 🎾 Matches                     [•]  │
├─────────────────────────────────────┤
│                                     │
│ Looking to Play                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 Looking to Play Singles      │ │
│ │    Tomorrow                     │ │
│ │                                 │ │
│ │ "Looking for competitive        │ │
│ │ singles match. Intermediate     │ │
│ │ level preferred."               │ │
│ │                                 │ │
│ │ ┌─────────────┐ ── VS ── ┌─────┐│ │
│ │ │ John Smith  │          │  +  ││ │
│ │ │ (Organizer) │          │Join ││ │
│ │ │ 1520 • Gold │          │Match││ │
│ │ └─────────────┘          └─────┘│ │
│ │                          └─────┘│ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Singles Invitation - After Match Confirmed (2 Players)
```
┌─────────────────────────────────────┐
│ 🎾 Matches                     [•]  │
├─────────────────────────────────────┤
│                                     │
│ Looking to Play                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 Looking to Play Singles      │ │
│ │    Tomorrow ✓ Ready to Play     │ │
│ │                                 │ │
│ │ "Looking for competitive        │ │
│ │ singles match. Intermediate     │ │
│ │ level preferred."               │ │
│ │                                 │ │
│ │ ┌─────────────┐ ── VS ── ┌─────┐│ │
│ │ │ John Smith  │          │Lisa ││ │
│ │ │ (Organizer) │          │Davis││ │
│ │ │ 1520 • Gold │          │1485•││ │
│ │ │             │          │Gold ││ │
│ │ └─────────────┘          └─────┘│ │
│ │                                 │ │
│ │ 📞 Contact Information          │ │
│ │ John Smith: (555) 123-4567      │ │
│ │ Lisa Davis: (555) 987-6543      │ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 🏆 Record Match Results     │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Doubles Invitation - Waiting for Players (2 of 4)
```
┌─────────────────────────────────────┐
│ 🎾 Matches                     [•]  │
├─────────────────────────────────────┤
│                                     │
│ Looking to Play                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 Looking to Play Doubles      │ │
│ │    Saturday                     │ │
│ │                                 │ │
│ │ "Need 2 more players for        │ │
│ │ doubles match!"                 │ │
│ │                                 │ │
│ │ ┌─────────┐ ┌─────────┐         │ │
│ │ │ Sarah J.│ │ Mike C. │         │ │
│ │ │Organizer│ │         │         │ │
│ │ │1650•Gold│ │1420•Sil.│         │ │
│ │ └─────────┘ └─────────┘         │ │
│ │ ┌─────────┐ ┌─────────┐         │ │
│ │ │    +    │ │    +    │         │ │
│ │ │   Join  │ │   Join  │         │ │
│ │ │  Match  │ │  Match  │         │ │
│ │ └─────────┘ └─────────┘         │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```


### Doubles Invitation - After Match Confirmed (4 Players)
```
┌─────────────────────────────────────┐
│ 🎾 Matches                     [•]  │
├─────────────────────────────────────┤
│                                     │
│ Looking to Play                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 Looking to Play Doubles      │ │
│ │    Saturday ✓ Ready to Play     │ │
│ │                                 │ │
│ │ "Need 2 more players for        │ │
│ │ doubles match!"                 │ │
│ │                                 │ │
│ │ ┌─────────┐ ┌─────────┐         │ │
│ │ │ Sarah J.│ │ Mike C. │         │ │
│ │ │Organizer│ │         │         │ │
│ │ │1650•Gold│ │1420•Sil.│         │ │
│ │ └─────────┘ └─────────┘         │ │
│ │ ┌─────────┐ ┌─────────┐         │ │
│ │ │  Lisa   │ │  Tom    │         │ │
│ │ │ Davis   │ │ Wilson  │         │ │
│ │ │1495•Gold│ │1380•Sil.│         │ │
│ │ └─────────┘ └─────────┘         │ │
│ │                                 │ │
│ │ 📞 Contact Information          │ │
│ │ Sarah Johnson: (555) 111-2222   │ │
│ │ Mike Chen: (555) 333-4444       │ │
│ │ Lisa Davis: (555) 777-8888      │ │
│ │ Tom Wilson: (555) 999-0000      │ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 🏆 Record Match Results     │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Invitation Header**: Tennis ball icon + "Looking to Play" + match type and date/time
- **Notes Display**: Shows user's notes in quotes
- **Participant Grid**: 
  - Singles: Simple side-by-side layout with VS
  - Doubles: 2x2 grid layout for 4 players
- **Join Buttons**: Clickable "+ Join Match" buttons for empty slots (first-come-first-serve)
- **Organizer Badge**: Shows which player created the invitation
- **ELO Rating Display**: Shows each player's ELO rating and tier (e.g., "1520 • Gold")
  - New players show "1200 • New Player (New)"
  - Provisional players show "(Provisional)" suffix if <5 games played
  - Color-coded by tier: Gold, Silver, Bronze, etc.
- **Contact Information**: Only visible when match is confirmed (enough players) AND only to participants
- **Ready to Play Status**: Shows "✓ Ready to Play" when match has enough players
- **Record Match Button**: Only appears when match is confirmed
- **Loading State**: Shows "⏳ Joining..." when user taps join

---

## Screen 4: Auto-Match Logic & Contact Sharing

### Singles Auto-Match (2 Players Reached)
When a second player joins a singles invitation:

```
Auto-Match Trigger:
Creator (1) + Responder (1) = 2 Total Players ✓

Immediate Actions:
1. Mark invitation as "matched"
2. Share contact information automatically
3. Update UI to show "Ready to Play" status
4. Enable "Record Match Results" button
```

### Doubles Auto-Match (4 Players Reached)
When the fourth player joins a doubles invitation:

```
Auto-Match Trigger:
Creator (1) + Responders (3) = 4 Total Players ✓

Immediate Actions:
1. Mark invitation as "matched"  
2. Share all contact information automatically
3. Update UI to show "Ready to Play" status
4. Enable "Record Match Results" button
```

### Contact Information Display Rules
**Contact information is only visible when BOTH conditions are met:**
1. **Match is confirmed** (enough players have joined)
2. **User is a participant** (creator OR has joined the match)

**Before match is confirmed:**
- No contact information visible to anyone
- Users see "Join Match" buttons for empty slots

**After match is confirmed:**
- Contact information visible only to participants
- Non-participants cannot see any phone numbers
- "Record Match Results" button becomes available

### Components:
- **Automatic Matching**: No user intervention required when player quota met
- **Contact Sharing**: Phone numbers automatically visible to all participants
- **Status Badge**: "✓ Ready to Play" badge appears when matched
- **Record Button**: "Record Match Results" button becomes available
- **Real-time Updates**: UI updates immediately when match status changes

---

## Screen 5: Match Recording (Looking to Play Results)

After players meet and play, they can record results:

### Singles Match Recording
```
┌─────────────────────────────────────┐
│ ←     Record Match Results          │
├─────────────────────────────────────┤
│                                     │
│ 🎾 Looking to Play Match            │
│ Singles match                       │
│ Tomorrow                            │
│                                     │
│ Players:                            │
│ • John Smith (Organizer)            │
│ • Lisa Davis (Joined)               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Match Winner                    │ │
│ │                                 │ │
│ │ ☐ John Smith                    │ │
│ │ ☑ Lisa Davis                    │ │
│ │                                 │ │
│ │ Score: Match Winner [6] - [4] Loser │ │
│ │                                 │ │
│ │ Notes (Optional)                │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Great competitive match!    │ │ │
│ │ │ Close games throughout.     │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                 │ │
│ │ Report Issues (Optional)        │ │
│ │                                 │ │
│ │ Select player(s) to report:     │ │
│ │ ☐ John Smith                    │ │
│ │ ☐ Lisa Davis                    │ │
│ │                                 │ │
│ │ Reason for report:              │ │
│ │ ☐ No-show    ☐ Unsportsmanlike │ │
│ │ ☐ Other      ☐ Inappropriate   │ │
│ └─────────────────────────────────┘ │
│                                     │
│           [ Save Match ]            │
│                                     │
└─────────────────────────────────────┘
```

### Doubles Match Recording  
```
┌─────────────────────────────────────┐
│ ←     Record Match Results          │
├─────────────────────────────────────┤
│                                     │
│ 🎾 Looking to Play Match            │
│ Doubles match                       │
│ Saturday                            │
│                                     │
│ Players:                            │
│ • Sarah Johnson (Organizer)         │
│ • Mike Chen (Joined)                │
│ • Lisa Davis (Joined)               │
│ • Tom Wilson (Joined)               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Match Winner (Select 2)         │ │
│ │                                 │ │
│ │ ☑ Sarah Johnson                 │ │
│ │ ☐ Mike Chen                     │ │
│ │ ☑ Lisa Davis                    │ │
│ │ ☐ Tom Wilson                    │ │
│ │                                 │ │
│ │ Score: Match Winners [6] - [3] Losers │ │
│ │                                 │ │
│ │ Notes (Optional)                │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Sarah & Lisa played well    │ │ │
│ │ │ together as a team.         │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                 │ │
│ │ Report Issues (Optional)        │ │
│ │                                 │ │
│ │ Select player(s) to report:     │ │
│ │ ☐ Sarah Johnson                 │ │
│ │ ☐ Mike Chen                     │ │
│ │ ☐ Lisa Davis                    │ │
│ │ ☐ Tom Wilson                    │ │
│ │                                 │ │
│ │ Reason for report:              │ │
│ │ ☐ No-show    ☐ Unsportsmanlike │ │
│ │ ☐ Other      ☐ Inappropriate   │ │
│ └─────────────────────────────────┘ │
│                                     │
│           [ Save Match ]            │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Match Context**: Shows original invitation details at top
- **Winner Selection**: Checkbox selection of match winners (1 for singles, 2 for doubles)
- **Simplified Scoring**: Basic winner/loser with score entry
- **Optional Notes**: Free-form text for match details  
- **Reporting System**: Integrated player reporting with issue types and descriptions
- **Single Save Action**: One button to save match and submit any reports

---

## Screen 5 (Continued): Error Handling During Match Recording

If there's an error saving the match, users stay on the recording screen with error feedback:

### Error State - Stay on Recording Screen
```
┌─────────────────────────────────────┐
│ ←     Record Match Results          │
├─────────────────────────────────────┤
│                                     │
│ 🎾 Looking to Play Match            │
│ Singles match                       │
│ Tomorrow                            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ❌ Error saving match           │ │
│ │ Failed to save match. Please   │ │
│ │ check your connection and try   │ │ 
│ │ again.                          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Match Winner Selection          │ │
│ │ ☑ Lisa Davis                    │ │
│ │ Score: Match Winner [6] - [4] Loser │ │
│ │ Notes: Great competitive match! │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [ Try Again ]               │
│                                     │
└─────────────────────────────────────┘
```

### Success Flow - No Notification Needed
```
User completes form → Taps "Save Match" → Brief loading → 
Success: Navigate back to previous screen → Match appears in matches list
```

### Components:
- **Error Feedback**: Clear error message with actionable guidance
- **Form Preservation**: User's data remains filled when error occurs  
- **Retry Action**: Simple "Try Again" button to reattempt save
- **Stay on Screen**: User doesn't lose context or have to re-enter data
- **No Success Notification**: Match appearing in list IS the confirmation

---

# Complete Looking to Play Workflow Summary

## 🎯 All Screens & Notifications Covered

### **Creation Phase**
1. **Screen 1**: Looking to Play Form Modal (Match Type + Date/Time + Location + Notes)
   - Modal closes on successful post (with success notification)

### **Notification Phase**  
2. **Screen 2**: Invitation Notification (Club Members)
3. **Screen 3**: Matches Tab (Invitation Display with Participant Grid)
4. **Screen 4**: Auto-Match Logic & Contact Sharing (Automatic when quota reached)

### **Match Recording Phase**
5. **Screen 5**: Record Match Results (Winner Selection + Scoring + Reporting)
   - Success: Navigate back (match appears in list)
   - Error: Stay on screen with retry option

## 🔄 Notification Types Summary

### **Club Members Get:**
- Invitation notifications in club overview with "View Match Detail" button
- Persistent invitation details in Matches tab until enough players join
- Dismissible notifications (stored locally)

### **Invitation Creator Gets:**
- Immediate "Looking to Play Posted!" success notification
- Real-time updates when players join their invitation
- Contact information sharing when invitation is matched
- Access to record match results when ready

### **All Players Get:**
- Automatic contact sharing when match reaches required player count
- Clean success flow (match just appears in list)
- Error handling that preserves form data and allows retry
- No unnecessary success notifications or modal pop-ups

## 🏗️ Key Technical Implementation Details

### **Auto-Matching Logic**
- **Singles**: 2 players total (creator + 1 responder) triggers automatic match
- **Doubles**: 4 players total (creator + 3 responders) triggers automatic match
- **Contact Sharing**: Phone numbers automatically shared when matched
- **Status Updates**: Real-time UI updates when match status changes

### **Participant Grid Display**
- **Singles**: Side-by-side layout with VS divider
- **Doubles**: 2x2 grid layout with join buttons in empty slots  
- **Responsive**: Empty slots show either "Join Match" buttons or "Waiting for player..." text
- **First-Come-First-Serve**: Only first responses are accepted, no overflow tracking

### **Data Management**
- **First-Come-First-Serve**: Only the first responses are accepted (1 for singles, 3 for doubles)
- **No Waitlist**: Additional responses beyond the required slots are not tracked or displayed
- **Invitation Filtering**: Past invitations automatically marked as expired
- **Failed Invitations**: Today's invitations without enough players marked as expired
- **Contact Information**: Only visible to confirmed participants
- **Real-time Updates**: Uses Supabase real-time subscriptions for live updates

## ✅ Shared Component Integration

### **Reused Components from Challenge Flow**
The Looking to Play workflow maximizes code reuse by leveraging shared components:

1. **MatchTypeSelection** (`challenge-flow/MatchTypeSelection.tsx`)
   - Singles/Doubles radio button selection
   - Identical styling and behavior across both flows
   - iOS HIG compliant touch targets and visual feedback

2. **TimingOptions** (`challenge-flow/TimingOptions.tsx`) 
   - 5-button timing selection: Today, Tomorrow, Weekend, Next Week, Flexible
   - Converts timing choices to actual dates automatically
   - Consistent spacing and interaction patterns

3. **MessageSection** (`challenge-flow/MessageSection.tsx`)
   - Notes input with contextual placeholders based on match type
   - Multiline text input with proper keyboard handling
   - Dynamic placeholder text for singles vs doubles

4. **FormActions** (`challenge-flow/FormActions.tsx`)
   - Flexible Cancel/Submit button layout with loading states  
   - Supports both full-width and split button layouts
   - Customizable button text and loading messages

5. **MatchRecordingForm** (`MatchRecordingForm.tsx`)
   - Complete match recording interface with winner selection
   - **Customizable title**: "Match Winner" for looking to play vs "Match Winners" for challenges
   - Integrated reporting system and score entry
   - Identical UI across all match recording scenarios

### **Benefits Achieved**

**Code Efficiency:**
- 5 shared components eliminate code duplication
- Single source of truth for form patterns and interactions
- Easier maintenance and consistent updates across flows

**User Experience:**
- Familiar interface patterns across different match creation methods
- Consistent visual design and interaction behavior
- Reduced learning curve for users switching between flows

**Technical Quality:**
- Better separation of concerns with focused, reusable components
- More testable code with isolated component responsibilities
- Consistent iOS HIG compliance across the entire app

### **Key Design Decisions**

**Form Simplification:**
- **Removed Location Field**: Court location features planned for future release
- **Removed Time Field**: Players coordinate specific timing themselves after matching
- **Streamlined Flow**: Focus on essential matching information only

**First-Come-First-Serve System:**
- **No Waitlist**: Additional responses beyond required slots are not tracked
- **Clear Expectations**: Users know they need to respond quickly to secure a spot
- **Simple Logic**: Reduces complexity in both code and user understanding

**Privacy-First Contact Sharing:**
- **Match Confirmation Required**: Contact info only visible when enough players joined
- **Participant-Only Access**: Non-participants cannot see any phone numbers
- **Automatic Sharing**: No manual steps required once match is confirmed

This comprehensive wireframe covers every screen, notification, and user interaction in the complete Looking to Play workflow, demonstrating maximum code reuse while maintaining clear user experience patterns.

---