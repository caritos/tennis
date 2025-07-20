# Match Recording Flow

## Overview
Complete flow for recording a tennis match result, from initiation to final confirmation.

## Flow: Record a Completed Match

### Step 1: Initiate Match Recording
```
Entry Points:
1. Club Details → [+ Record Match]
2. Profile → Quick Actions → [+ Record Match]  
3. Club Tab → Quick Actions → [+ Record Match]
4. Post-match from confirmed game
```

### Step 2: Match Recording Form
```
< Back                 Record Match               [Save]

Match Type
(•) Singles    ( ) Doubles

Players
Player 1: John Smith (You)                    [Fixed]

Player 2: [Select Player ▼] [or Add Unregistered ▼]
┌─────────────────────────────────────────────────────┐
│ Sarah Wilson                                        │
│ Mike Chen                                           │  
│ Tom Anderson                                        │
│ + Add Unregistered Opponent                         │
└─────────────────────────────────────────────────────┘

[If Doubles selected:]
Player 3: [Select Player ▼] [or Add Unregistered ▼]
Player 4: [Select Player ▼] [or Add Unregistered ▼]

Court (Optional)
[Select Court ▼] [Skip]
┌─────────────────────────────────────────────────────┐
│ Court 1 - Hard Court                               │
│ Court 2 - Hard Court                               │
│ Court 3 - Clay Court                               │
│ Other/External Court                                │
└─────────────────────────────────────────────────────┘

Date
Date: [📅 Today, Dec 15]

Score
Set 1:  [6] - [4]
Set 2:  [7] - [6]  (7-3)  ← Tiebreak notation
Set 3:  [_] - [_]
                                    [+ Add Set]

Notes (Optional)
┌─────────────────────────────────────────────────────┐
│ Great competitive match!                             │
└─────────────────────────────────────────────────────┘

                        [Cancel]    [Save]
```

### Step 3A: Registered Opponent - Confirmation Request
```
📧 Match Confirmation Requested

Your match result has been saved locally and 
will sync when online.

Sarah Wilson will be notified to confirm:
• Singles match on Dec 15
• Score: 6-4, 7-6 (7-3)
• Court 1 - Hard

Both players must confirm for the match to 
count toward rankings.

                        [OK]
```

### Step 3B: Unregistered Opponent - Immediate Save
```
✅ Match Recorded!

Your match has been recorded:
• Singles vs "Mike Johnson" 
• Score: 6-4, 7-6 (7-3)
• Dec 15 at Court 1 - Hard

This match counts toward your statistics.
If Mike joins later, he can claim this match.

Your new singles record: 11-5 (69%)

                        [OK]
```

### Step 4: Opponent Receives Confirmation (Registered)
```
🎾 Match Confirmation Request

John Smith recorded a match result:

Singles Match - Dec 15
Score: 6-4, 7-6 (7-3) (John won)
Court: Court 1 - Hard
Notes: "Great competitive match!"

Is this correct?

                [Dispute]    [Confirm]
```

### Step 5A: Opponent Confirms
```
✅ Match Confirmed!

Both players have confirmed the match result.

This match now counts toward:
• Club rankings
• Personal statistics  
• Match history

Updated Rankings:
John Smith: 69% (11-5) ↑
Sarah Wilson: 72% (13-5) ↓

                        [OK]
```

### Step 5B: Opponent Disputes
```
⚠️ Match Disputed

Sarah Wilson disputed the match result.

Common reasons:
• Incorrect score
• Wrong date or court
• Different match details

You can:
• Contact Sarah to resolve the difference
• Re-record with correct information
• Cancel this match entry

        [Contact Sarah]    [Edit Match]    [Cancel Match]
```

### Step 6: Match Appears in History
```
Recent Match History
• vs Sarah Wilson - Won 6-4, 7-6(7-3) ✅
  Riverside Tennis Club • Today
• vs Mike Chen - Lost 3-6, 6-4, 4-6
  Downtown Tennis Center • 1 week ago
• vs Lisa Park - Won 7-6(7-4), 6-3
  Riverside Tennis Club • 1 week ago
```

## Alternative Flow: Quick Record from Confirmed Match

### Post-Match Recording (From Confirmed Game)
```
🎾 Record Result

Your confirmed match with Sarah Wilson:
Singles - Today at Court 1 - Hard

Who won?
(•) I won    ( ) Sarah won

Score:
Set 1:  [6] - [4] 
Set 2:  [7] - [6]  (7-3)
                                    [+ Add Set]

Notes (Optional):
┌─────────────────────────────────────────────────────┐
│ Great match! Very competitive.                      │
└─────────────────────────────────────────────────────┘

                        [Cancel]    [Save Result]
```

## Key Features

**Flexible Opponent Selection:**
- Registered club members (requires confirmation)
- Unregistered opponents (immediate save, claimable later)
- Supports both singles and doubles

**Smart Validation:**
- Score validation (tennis rules)
- Prevents impossible scores
- Handles tiebreak notation correctly

**Honor System with Verification:**
- Immediate save for user's records
- Opponent confirmation for rankings
- Dispute resolution process

**Offline Support:**
- Save locally first
- Sync when connection available
- No data loss during poor connectivity

**Rankings Integration:**
- Automatic ranking updates after confirmation
- Separate singles/doubles tracking
- Club-specific rankings calculation