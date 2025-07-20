# User Onboarding Flow

## Overview
Complete user journey from first app launch to playing their first match.

## Flow: First-Time User Experience

### Step 1: App Launch (New User)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    🎾 Tennis Club                   │
│                                                     │
│              Find players. Track matches.           │
│              Connect with tennis clubs.             │
│                                                     │
│              [Get Started]                          │
│                                                     │
│              Already have an account?               │
│              [Sign In]                              │
└─────────────────────────────────────────────────────┘
```

### Step 2: Choose Sign Up Method
```
🎾 Tennis Club
Join the tennis community!

┌─────────────────────────────────────────────────────┐
│ 📧 Sign up with Email                               │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ 🍎 Continue with Apple                              │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ 📱 Continue with Google                             │
└─────────────────────────────────────────────────────┘
```

### Step 3: Complete Profile (If Email)
```
Full Name: [John Smith]
Preferred Name: [Johnny] (Optional)
Email: [john@example.com]
Password: [••••••••••••]
Phone: [(555) 123-4567] (Optional)

                    [Create Account]
```

### Step 4: Profile Setup
```
Welcome to Tennis Club! 🎾

Contact Preferences:
(•) Share phone number: (555) 123-4567
( ) In-app messages only
( ) Don't share contact info

□ Allow players to see my tennis statistics
□ Show my match history to club members
□ Allow location access for club discovery

                [Skip for Now]    [Complete Setup]
```

### Step 5: Location Permission
```
🎾 Find Tennis Clubs Near You

Tennis Club uses your location to discover 
clubs in your area and show distances.

Location services help you:
• Find clubs within driving distance
• See how far courts are from you
• Connect with nearby tennis players

                [Not Now]    [Allow Location]
```

### Step 6A: With Location - Club Discovery
```
Great! Here are tennis clubs near you:

┌─────────────────────────────────────────────────────┐
│ 🎾 Riverside Tennis Club            0.3 mi         │
│ 12 members • 3 courts                        [Join]│
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ 🎾 Downtown Tennis Center           1.2 mi         │
│ 24 members • 6 courts                        [Join]│
└─────────────────────────────────────────────────────┘

[+ Create New Club]    [Skip for Now]
```

### Step 6B: Without Location - Manual Search
```
Find Tennis Clubs

Search by club name or location:
┌─────────────────────────────────────────────────────┐
│ Search clubs...                                🔍   │
└─────────────────────────────────────────────────────┘

Or create your own club:
[+ Create New Club]

                            [Skip for Now]
```

### Step 7: Join a Club
```
🎾 Riverside Tennis Club

12 members • 3 courts • 0.3 miles away
"A friendly community club for players of all levels"

Club Details:
• Members play at: 3 hard courts, 1 clay court  
• Mix of recreational and competitive players
• Weekly social events
• 12 active members looking for matches

                [Cancel]    [Request to Join]
```

### Step 8: Welcome to Club
```
🎉 Welcome to Riverside Tennis Club!

You're now a member! Here's what you can do:

✅ View member rankings and find opponents
✅ Record matches to track your progress  
✅ Post "Looking to Play" to find partners
✅ Challenge other members directly
✅ See club courts and availability

Ready to play your first match?

                [Explore Club]    [Record a Match]
```

### Step 9: First Match Guidance
```
🎾 Ready to Play Tennis?

Here are the best ways to find a match:

1. 📊 Check Rankings - Find players at your level
2. 📢 Post "Looking to Play" - Let others find you  
3. ⚡ Challenge Someone - Direct invitation to a player

Want to record a past match first to establish 
your skill level?

        [Browse Members]    [Looking to Play]    [Record Past Match]
```

## Key Onboarding Decisions

**Progressive Disclosure:**
- Core sign-up first
- Profile setup optional but encouraged
- Club joining can be skipped initially

**Location Handling:**
- Clear value proposition for location access
- Graceful fallback to manual search
- No blocking if location denied

**First Match Guidance:**
- Multiple pathways explained
- No pressure to play immediately
- Option to record past matches first

**Success Metrics:**
- Account created ✅
- Profile completed ✅  
- Club joined ✅
- First interaction (match/post/challenge) ✅