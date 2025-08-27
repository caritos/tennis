# Challenge Match Flow - Complete Wireframes (Code-Based)

## Overview
The Challenge Match flow enables tennis players to challenge other club members for singles or doubles matches. This comprehensive wireframe covers the complete end-to-end flow including all screens, notifications, and user interactions. Based on actual React Native components: ChallengeFlowModal.tsx, RecordChallengeMatchScreen.tsx, ChallengeNotifications.tsx, and NotificationContext.tsx.

## Complete User Flow Diagram

```
┌─────────────────┐
│   Club Screen   │ ────┐
│   (Rankings/    │     │ 1. User taps "Challenge" 
│    Members)     │     │    button on player
└─────────────────┘ ◄───┘
         │
         ▼
┌─────────────────┐
│ Challenge Modal │ ◄─── SCREEN 1: Challenge Creation Form
│ (Match Type +   │      • Match Type Selection
│  Player Select  │      • Player Search (Doubles)
│  + Timing +     │      • Timing Options  
│  Message)       │      • Optional Message
└────────┬────────┘
         │ 2. Send Challenge (Modal closes)
         ▼
┌─────────────────┐      ┌─────────────────┐
│ CHALLENGER      │      │ CHALLENGED      │
│ Waits for       │────▶ │ Receives        │ ◄─── SCREEN 2: Challenge Notification
│ Response        │      │ Notification    │      • Shows challenge details
└─────────────────┘      └────────┬────────┘      • Single "View" button
         │                         │ 3. Tap "View"
         │                         ▼
         │               ┌─────────────────┐
         │               │ Matches Tab     │ ◄─── SCREEN 3: Matches Tab (Challenge Details)
         │               │ (Challenge      │      • Full challenge details
         │               │  Details)       │      • Accept/Decline buttons
         │               └────────┬────────┘      • Contact info after accept
         │                        │ 4. Accept/Decline
         │                        ▼
         │               ┌─────────────────┐
         │               │ Status Update   │ ◄─── SCREEN 4: Status Notifications
         │◄──────────────│ Notification    │      • Acceptance/Declination
         │               │ (to Challenger) │      • Contact sharing
         │               └─────────────────┘      • Group coordination
         │ 5. Challenge accepted
         ▼
┌─────────────────┐
│ Both players    │      ┌─────────────────┐
│ can now record  │────▶ │ Record Match    │ ◄─── SCREEN 5: Match Recording  
│ match results   │      │ Results Screen  │      • Score entry
└─────────────────┘      └────────┬────────┘      • Reporting system
                                  │ 6. Save match
                                  │    Success: Navigate back
                                  │    Error: Stay on screen
                                  ▼
                         ┌─────────────────┐
                         │ Back to         │ ◄─── Success: Returns to previous screen
                         │ Previous Screen │      • Match appears in matches list
                         │ (Match in list) │      • No success notification needed
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

## Screen 1 (Alternative): Challenge Flow Modal - Doubles Complete Form

When doubles is selected, the form expands to show all sections:

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
│  Select 2 more players for the      │
│  doubles match (2 selected already) │
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
│  │ Want to play doubles? We'll │   │
│  │ figure out teams when we    │   │
│  │ get there!                  │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│      ┌─────────────────┐           │
│      │ Send Challenge  │           │
│      └─────────────────┘           │
└─────────────────────────────────────┘
```

### Components:
- **Match Type Selection**: Radio buttons that control form sections
- **Player Selection**: Shows selected players as chips (doubles only)
- **Target Player Lock**: Pre-selected player cannot be removed (🔒 icon)
- **Search Input**: Real-time search with clear button (doubles only)
- **Available Players List**: Scrollable list with add buttons (doubles only)
- **Timing Options**: Same 5 options for both singles and doubles
- **Message Input**: Optional text area with contextual placeholder
- **Single Action Button**: Full-width "Send Challenge" button

---

## Screen 2: Challenge Notification (to Recipients)

When a challenge is sent, challenged players receive this notification:

### Singles Challenge Notification
```
┌─────────────────────────────────────┐
│ 🔔                             9:41 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 New Challenge!               │ │
│ │                                 │ │
│ │ John Smith has challenged you   │ │
│ │ to a singles match at           │ │
│ │ Westwood Club.                  │ │
│ │                                 │ │
│ │ Proposed Date: Tomorrow         │ │
│ │ Message: "Hey! Want to play     │ │
│ │ a match?"                       │ │
│ │                                 │ │
│ │         [ View ]                │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Doubles Challenge Notification (Each Player)
```
┌─────────────────────────────────────┐
│ 🔔                             9:41 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 New Challenge!               │ │
│ │                                 │ │
│ │ Sarah Johnson has challenged    │ │
│ │ you and 2 others to doubles     │ │
│ │ at Westwood Club.               │ │
│ │                                 │ │
│ │ Proposed Date: This Weekend     │ │
│ │ Players: Sarah, Mike, You, Lisa │ │
│ │                                 │ │
│ │ Message: "Want to play doubles? │ │
│ │ We'll figure out teams when     │ │
│ │ we get there!"                  │ │
│ │                                 │ │
│ │         [ View ]                │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Notification Banner**: Appears at top of screen with slide-in animation
- **Challenge Details**: Shows challenger, club, date, message
- **Single Action**: Only "View" button - navigates to Matches tab
- **Auto-Dismiss**: Notification can be dismissed or auto-hides after time
- **Persistent**: Challenge remains available in Matches tab until responded to

---

## Screen 3: Matches Tab - Challenge Details & Actions

When user taps "View" on notification, they're taken to the Matches tab:

### Singles Challenge in Matches Tab
```
┌─────────────────────────────────────┐
│ 🎾 Matches                     [•]  │
├─────────────────────────────────────┤
│                                     │
│ Pending Challenges                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 Singles Challenge            │ │
│ │ from John Smith                 │ │
│ │                                 │ │
│ │ Tomorrow • Westwood Club        │ │
│ │ "Hey! Want to play a match?"    │ │
│ │                                 │ │
│ │ Challenger: John Smith          │ │
│ │ Rating: 4.2 ⭐                  │ │
│ │ Phone: Available after accept   │ │
│ │                                 │ │
│ │ Expires: 6 days remaining       │ │
│ │                                 │ │
│ │ [ Accept ] [ Decline ]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Upcoming Matches                    │
│ ┌─────────────────────────────────┐ │
│ │ No upcoming matches             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Recent Matches                      │
│ ┌─────────────────────────────────┐ │
│ │ vs Mike Wilson • 6-4, 6-2       │ │
│ │ Yesterday • Victory Club         │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Doubles Challenge in Matches Tab  
```
┌─────────────────────────────────────┐
│ 🎾 Matches                     [•]  │
├─────────────────────────────────────┤
│                                     │
│ Pending Challenges                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 Doubles Challenge            │ │
│ │ from Sarah Johnson              │ │
│ │                                 │ │
│ │ This Weekend • Westwood Club    │ │
│ │ "Want to play doubles? We'll    │ │
│ │ figure out teams when we get    │ │
│ │ there!"                         │ │
│ │                                 │ │
│ │ Players:                        │ │
│ │ • Sarah Johnson 4.5⭐ (Challenger) │ │
│ │ • Mike Wilson 3.8⭐             │ │
│ │ • You 4.1⭐                     │ │
│ │ • Lisa Davis 4.2⭐              │ │
│ │                                 │ │
│ │ Team Formation: TBD at court    │ │
│ │ Status: Waiting for all         │ │
│ │ players to respond              │ │
│ │ Phone: Available after accept   │ │
│ │                                 │ │
│ │ Expires: 5 days remaining       │ │
│ │                                 │ │
│ │ [ Accept ] [ Decline ]          │ │
│ └─────────────────────────────────┘ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Full Context**: Complete challenge details with challenger info
- **Player Information**: Ratings, recent matches, contact status
- **Expiration**: Clear countdown until challenge expires
- **Organized Layout**: Challenges separated from upcoming/recent matches
- **Primary Actions**: Accept/Decline buttons with clear visual hierarchy
- **Status Tracking**: For doubles, shows which players have responded

---

## Screen 4: Challenge Status Notifications

After players respond to challenges, various status notifications are sent:

### Acceptance Notification (to Challenger)
```
┌─────────────────────────────────────┐
│ 🔔                             9:41 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Challenge Accepted!           │ │
│ │                                 │ │
│ │ Lisa Davis has accepted your    │ │
│ │ singles challenge for tomorrow  │ │
│ │ at Westwood Club.               │ │
│ │                                 │ │
│ │ [ Record Match ] [ Message Lisa ] │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Doubles Group Ready Notification
```
┌─────────────────────────────────────┐
│ 🔔                             9:41 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎾 Match Ready!                 │ │
│ │                                 │ │
│ │ All players have accepted your  │ │
│ │ doubles challenge for this      │ │
│ │ weekend at Westwood Club.       │ │
│ │                                 │ │
│ │ Players: Sarah, Mike, You, Lisa │ │
│ │                                 │ │
│ │         [ View Details ]        │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Declination Notification
```
┌─────────────────────────────────────┐
│ 🔔                             9:41 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ❌ Challenge Declined            │ │
│ │                                 │ │
│ │ Mike Wilson declined your       │ │
│ │ doubles challenge for this      │ │
│ │ weekend.                        │ │
│ │                                 │ │
│ │ The challenge has been closed.  │ │
│ │ You can create a new challenge  │ │
│ │ with different players.         │ │
│ │                                 │ │
│ │ [ Create New Challenge ]        │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Status Icons**: ✅ for acceptance, ❌ for declination, 🎾 for group ready
- **Contextual Actions**: Different buttons based on notification type
- **Group Coordination**: Special handling for doubles match coordination
- **Automatic Contact Sharing**: Phone numbers shared upon acceptance
- **Persistent in Matches Tab**: Users can always return to see match details

---

## Screen 5: Match Recording (Challenge Results)

After a challenge is accepted, both players can record the match results:

### Singles Match Recording
```
┌─────────────────────────────────────┐
│ ←     Record Challenge Results       │
├─────────────────────────────────────┤
│                                     │
│ ⚔️ Challenge Match                   │
│ Singles challenge                   │
│ Tomorrow at Westwood Club           │
│                                     │
│ Players:                            │
│ • John Smith (Challenger)           │
│ • Lisa Davis (Challenged)           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Match Winner Selection          │ │
│ │                                 │ │
│ │ ☐ John Smith                    │ │
│ │ ☑ Lisa Davis                    │ │
│ │                                 │ │
│ │ Score: Match Winner [6] - [4] Loser │ │
│ │                                 │ │
│ │ Notes (Optional)                │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Great match! Close sets.    │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                 │ │
│ │ Report Issues (Optional)        │ │
│ │                                 │ │
│ │ Select player(s) to report:     │ │
│ │ ☐ John Smith                    │ │
│ │ ☑ Lisa Davis                    │ │
│ │                                 │ │
│ │ Reason for report:              │ │
│ │ ☐ No-show    ☐ Unsportsmanlike │ │
│ │ ☑ Other      ☐ Inappropriate   │ │
│ │                                 │ │
│ │ Description:                    │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Player didn't show up       │ │ │
│ │ │ on time.                    │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│           [ Save Match ]            │
│                                     │
└─────────────────────────────────────┘
```

### Doubles Match Recording  
```
┌─────────────────────────────────────┐
│ ←     Record Challenge Results       │
├─────────────────────────────────────┤
│                                     │
│ ⚔️ Challenge Match                   │
│ Doubles challenge                   │
│ This Weekend at Westwood Club       │
│                                     │
│ Players:                            │
│ • Sarah Johnson (Challenger)        │
│ • Mike Wilson (Challenger)          │
│ • You (Challenged)                  │
│ • Lisa Davis (Challenged)           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Match Winners (Select 2)        │ │
│ │                                 │ │
│ │ ☑ Sarah Johnson                 │ │
│ │ ☐ Mike Wilson                   │ │
│ │ ☐ You                           │ │
│ │ ☑ Lisa Davis                    │ │
│ │                                 │ │
│ │ Score: Match Winners [6] - [3] Losers │ │
│ │                                 │ │
│ │ Notes (Optional)                │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Teams mixed up - Sarah &    │ │ │
│ │ │ Lisa vs Mike & me.          │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                 │ │
│ │ Report Issues (Optional)        │ │
│ │                                 │ │
│ │ Select player(s) to report:     │ │
│ │ ☐ Sarah Johnson                 │ │
│ │ ☑ Mike Wilson                   │ │
│ │ ☐ Lisa Davis                    │ │
│ │                                 │ │
│ │ Reason for report:              │ │
│ │ ☐ No-show    ☑ Unsportsmanlike │ │
│ │ ☐ Other      ☐ Inappropriate   │ │
│ │                                 │ │
│ │ Description:                    │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Argued calls throughout     │ │ │
│ │ │ the match.                  │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│           [ Save Match ]            │
│                                     │
└─────────────────────────────────────┘
```

### Components:
- **Challenge Context**: Shows original challenge details at top
- **Winner Selection**: Checkbox selection of match winners (1 for singles, 2 for doubles)
- **Simplified Scoring**: Just winner/loser with basic score entry
- **Optional Notes**: Free-form text for match details
- **Reporting System**: Integrated player reporting with issue types and descriptions
- **Single Save Action**: One button to save match and submit any reports

---

## Screen 5 (Continued): Error Handling During Match Recording

If there's an error saving the match, users stay on the recording screen with error feedback:

### Error State - Stay on Recording Screen
```
┌─────────────────────────────────────┐
│ ←     Record Challenge Results       │
├─────────────────────────────────────┤
│                                     │
│ ⚔️ Challenge Match                   │
│ Singles challenge                   │ 
│ Tomorrow at Westwood Club           │
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
│ │ Score: Winner [6] - [4] Loser   │ │
│ │ Notes: Great match!             │ │
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

# Complete Challenge Match Workflow Summary

## 🎯 All Screens & Notifications Covered

### **Creation Phase**
1. **Screen 1**: Challenge Modal (Match Type + Player Selection + Timing + Message)
   - Modal closes on successful send (no success toast)

### **Notification Phase**  
2. **Screen 2**: Challenge Notification (Recipients)
3. **Screen 3**: Matches Tab (Challenge Details & Accept/Decline)
4. **Screen 4**: Status Notifications (Acceptance/Declination/Group Ready)

### **Match Recording Phase**
5. **Screen 5**: Record Match Results (Winner Selection + Scoring + Reporting)
   - Success: Navigate back (match appears in list)
   - Error: Stay on screen with retry option

## 🔄 Notification Types Summary

### **Challenge Recipients Get:**
- Initial challenge notification with "View" button
- Persistent challenge details in Matches tab until responded to

### **Challenge Creator Gets:**
- Immediate "Challenge Sent!" confirmation
- Status updates when players accept/decline
- Group coordination notifications for doubles
- Contact information sharing when accepted

### **All Players Get:**
- Clean success flow (match just appears in list)
- Error handling that preserves form data and allows retry
- No unnecessary success notifications or modal pop-ups

This comprehensive wireframe now covers every screen, notification, and user interaction in the complete challenge match workflow from creation through recording results with a focus on clean, uninterrupted user experience.

---
