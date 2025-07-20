# Challenge Button Flow

## Step 1: Tap [Challenge] Button
```
< Back                 Club Rankings                    [🔍]

┌─────────────────────────────────────────────────────┐
│ 4. [👤] Lisa Park           58% (7-5)    [Challenge] │ ← Tapped
└─────────────────────────────────────────────────────┘
```

## Step 2: Quick Challenge Modal
```
┌─────────────────────────────────────────────────────┐
│                Challenge Lisa Park                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Match Type                                          │
│ (•) Singles    ( ) Doubles                         │
│                                                     │
│ When would you like to play?                        │
│ ( ) Today      (•) Tomorrow    ( ) This Weekend     │
│ ( ) Next Week  ( ) Flexible                        │
│                                                     │
│ Preferred Court (Optional)                          │
│ [Court 1 - Hard ▼]                                │
│                                                     │
│ Message (Optional)                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Hey Lisa! Want to play a match?                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│           [Cancel]        [Send Challenge]          │
└─────────────────────────────────────────────────────┘
```

## Step 3: Confirmation
```
┌─────────────────────────────────────────────────────┐
│                    ✅ Challenge Sent!               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Your challenge has been sent to Lisa Park.         │
│ You'll be notified when they respond.              │
│                                                     │
│                      [OK]                           │
└─────────────────────────────────────────────────────┘
```

## Step 4: Lisa Receives Notification
```
🔴 New Challenge from John Smith

┌─────────────────────────────────────────────────────┐
│ John Smith wants to play singles tomorrow           │
│ "Hey Lisa! Want to play a match?"                  │
│ Preferred Court: Court 1 - Hard                    │
│                                                     │
│                   [Decline]    [Accept]             │
└─────────────────────────────────────────────────────┘
```

## Step 5A: If Lisa Accepts
```
✅ Match Confirmed!

Singles Match
📅 Tomorrow
👥 John Smith vs Lisa Park  
🎾 Court 1 - Hard (Riverside Tennis Club)

Contact: John Smith - (555) 123-4567

[Cancel Match]    [Record Result]
```

## Step 5B: If Lisa Declines
```
┌─────────────────────────────────────────────────────┐
│                Decline Challenge                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Optional: Let John know why                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Sorry, I'm traveling tomorrow. Maybe next week? │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│           [Cancel]        [Send Decline]            │
└─────────────────────────────────────────────────────┘
```

## Step 5C: John Receives Decline Notification
```
❌ Challenge Declined

Lisa Park declined your challenge.

"Sorry, I'm traveling tomorrow. Maybe next week?"

You can:
• Try challenging again later
• Post in "Looking to Play" instead
• Challenge a different player

                        [OK]
```

## Step 6: Match Cancellation Flow
```
Cancel Match with Lisa Park

Singles Match - Tomorrow 10:00 AM
Court 1 - Hard

Reason (Optional)
┌─────────────────────────────────────────────────┐
│ Something came up at work, sorry!               │
└─────────────────────────────────────────────────┘

Lisa will be notified immediately.

                        [Keep Match]    [Cancel Match]
```

## Key Features:

**Quick Setup**
- Pre-fills challenger's info
- Smart defaults (singles, tomorrow)
- Optional message field
- Shows target player's current stats for level assessment

**Simple Response Options**
- Accept or Decline only (no complex counter-offers)
- Clear contact sharing after confirmation
- Graceful handling of declined challenges

**Streamlined Flow**
- Bypasses the full "Looking to Play" posting system
- Direct player-to-player invitation
- Reduces friction for spontaneous matches
- Perfect for using rankings to find compatible opponents

**Cancellation**
- Graceful cancellation with optional reason
- Immediate notifications to affected players
- Maintains good etiquette in tennis community
- Simple binary choice: keep or cancel (no rescheduling complexity)

**Integration Points**
- Creates confirmed match in "Looking to Play" section once accepted
- Sends in-app notifications for all status changes
- Shares phone number automatically after acceptance
- Updates player activity feeds
- Links to match recording after completion