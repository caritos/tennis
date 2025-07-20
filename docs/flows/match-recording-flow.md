# Match Recording Flow

## Overview
Complete flow for recording a tennis match result with immediate save using honor system.

## Flow: Record a Completed Match

### Step 1: Initiate Match Recording
```
Entry Points:
1. Club Details → [+ Record Match]
2. Profile → Quick Actions → [+ Record Match]  
3. Club Tab → Quick Actions → [+ Record Match]
4. Post-match from completed game
```

### Step 2: Match Recording Form
```
< Back                 Record Match

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

### Step 3A: Registered Opponent - Immediate Save
```
✅ Match Recorded!

Your match has been recorded:
• Singles vs Sarah Wilson
• Score: 6-4, 7-6 (7-3)
• Dec 15

This match immediately counts toward rankings.
Sarah can edit the match details if needed.

Your new singles record: 11-5 (69%)
Club ranking: #3 → #2 (2,450 pts)

                        [OK]
```

### Step 3B: Unregistered Opponent - Immediate Save
```
✅ Match Recorded!

Your match has been recorded:
• Singles vs "Mike Johnson" 
• Score: 6-4, 7-6 (7-3)
• Dec 15

This match counts toward your statistics.
If Mike joins later, he can claim and edit this match.

Your new singles record: 11-5 (69%)

                        [OK]
```

### Step 4: Match Appears in All Participants' History
```
Match recorded by John Smith:

📊 All participants see in their match history:
• Singles - Dec 15
• Score: 6-4, 7-6 (7-3)
• Notes: "Great competitive match!"

✏️ Any participant can edit if corrections needed
   - Singles: Both players can edit
   - Doubles: All 4 players can edit
🏆 Rankings updated immediately for all participants
```

### Step 5: Editing Match Details (Any Participant)
```
Edit Match

Any match participant can update details:

Original: Singles vs Sarah Wilson - 6-4, 7-6
Recorded by: John Smith on Dec 15

Score:
Set 1: [6] - [4]
Set 2: [7] - [6] (7-3)

Notes:
┌─────────────────────────────────────────────────────┐
│ Updated: Actually was 6-4, 6-7, 6-3                │
└─────────────────────────────────────────────────────┘

                    [Cancel]    [Save Changes]

✅ Changes saved - rankings updated automatically

Note: For doubles, all 4 players can edit
```

### Step 6: Match History Shows All Matches
```
Recent Match History
• vs Sarah Wilson - Won 6-4, 7-6(7-3) [Edit]
  Riverside Tennis Club • Today • 2,450 pts (+150)
• vs Mike Chen - Lost 3-6, 6-4, 4-6 [Edit]
  Downtown Tennis Center • 1 week ago • 2,300 pts (-100)
• vs Lisa Park - Won 7-6(7-4), 6-3 [Edit]
  Riverside Tennis Club • 1 week ago • 2,400 pts (+120)

Note: All participants can edit match details
     Singles: 2 players • Doubles: 4 players
```

## Alternative Flow: Quick Record from Scheduled Match

### Post-Match Recording (From Scheduled Game)
```
🎾 Record Result

Your scheduled match with Sarah Wilson:
Singles - Today

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
- Registered club members (immediate save)
- Unregistered opponents (immediate save, claimable later)
- Supports both singles and doubles

**Smart Validation:**
- Score validation (tennis rules)
- Prevents impossible scores
- Handles tiebreak notation correctly

**Pure Honor System:**
- Immediate save and ranking updates
- Any participant can edit match details (all 4 in doubles)
- No confirmation or dispute process needed

**Offline Support:**
- Save locally first
- Sync when connection available
- No data loss during poor connectivity

**Rankings Integration:**
- Instant ranking updates upon save
- Points calculated immediately
- Separate singles/doubles tracking
- Club-specific rankings calculation