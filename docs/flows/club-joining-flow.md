# Club Joining Flow

## Overview
Complete flow for discovering and joining tennis clubs, from search to first match.

## Flow: Discover and Join a Club

### Step 1: Club Discovery
```
Entry Points:
1. Club Tab → Discover Clubs section
2. Onboarding → Find clubs near you
3. Search → Manual club search
```

### Step 2A: Location-Based Discovery
```
Discover Clubs Near You (0.5 - 5.0 miles)

┌─────────────────────────────────────────────────────┐
│ 🎾 Riverside Tennis Club            0.3 mi         │
│ 12 members                                         │
│ "Friendly community club for all levels"           │
│ Active: 5 matches this week                  [Join]│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🎾 Downtown Tennis Center           1.2 mi         │
│ 24 members                                         │
│ "Competitive players welcome"                       │
│ Active: 12 matches this week                 [Join]│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🎾 Elite Tennis Academy            2.1 mi          │
│ 8 members                                          │
│ "Advanced players only - USTA 4.0+"                │
│ Active: 8 matches this week                  [Join]│
└─────────────────────────────────────────────────────┘

[Show More]    [+ Create Club]
```

### Step 2B: Search-Based Discovery
```
Find Tennis Clubs

Search: [Riverside tennis                          🔍]

Results:
┌─────────────────────────────────────────────────────┐
│ 🎾 Riverside Tennis Club            0.3 mi         │
│ 12 members                                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🎾 Riverside Country Club          2.8 mi          │
│ 45 members                                         │
└─────────────────────────────────────────────────────┘

No exact match? [+ Create "Riverside Tennis" club]
```

### Step 3: View Club Details
```
🎾 Riverside Tennis Club                     [Join]

📍 0.3 miles away
123 Tennis Way, Riverside, CA 92507

👥 12 Members

About
"A friendly community club for players of all levels. 
We focus on fun, improvement, and great tennis matches!"

Top Players
1. Sarah Wilson 🏆 85% (15-2)
2. John Smith 🥈 67% (10-5)
3. Mike Chen 🥉 75% (12-4)

                        [Back]    [Join Club]
```

### Step 4: Instant Join (All Clubs)
```
🎉 Joined Riverside Tennis Club!

Welcome to the club! You can now:

✅ View all member rankings
✅ Post "Looking to Play" invitations  
✅ Challenge other members directly
✅ Record matches and build your ranking

Ready to play your first match?

        [Explore Club]    [Looking to Play]    [Challenge Someone]
```

## Flow: Multiple Club Management

### Step 1: View All Your Clubs
```
My Clubs (2)

┌─────────────────────────────────────────────────────┐
│ 🎾 Riverside Tennis Club        0.3 mi             │
│ 12 members • Rank: #3 • 🔴 2 new invitations       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🎾 Downtown Tennis Center       1.2 mi             │
│ 24 members • Rank: #8 • 1 looking to play          │
└─────────────────────────────────────────────────────┘

                        [Join Another Club]
```

### Step 2: Club-Specific Engagement
```
🎾 Riverside Tennis Club

Club Activity:
🔴 2 new match invitations
• Sarah wants to play singles tomorrow
• Tom posted doubles for this weekend

Club Rankings (You: #3)
1. Sarah Wilson 🏆 85% (15-2)
2. John Smith 🥈 75% (12-4)  
3. You 🥉 67% (10-5)

                [View Invitations]    [Looking to Play]
```

## Key Features

**Smart Discovery:**
- Location-based recommendations
- Distance and activity indicators
- Club type and privacy level clear

**Informed Decisions:**
- Club stats and member activity
- Recent match activity
- Top player rankings visible

**Instant Joining:**
- Auto-join for all clubs
- No approval process needed
- Community automatically removes problematic members via reporting system

**Community Self-Policing:**
- Automatic member removal via reporting system
- 2 reports = warning notification
- 3 reports = temporary removal (7 days)  
- 4 reports = permanent ban from all clubs
- Reports only available after scheduled matches

**Multi-Club Support:**
- Separate rankings per club
- Club-specific notifications
- Easy switching between clubs

**Onboarding Integration:**
- Seamless from account creation
- Progressive club discovery
- Multiple pathways to first match