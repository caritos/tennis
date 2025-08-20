# App Store Screenshot Capture Plan

## Prerequisites
1. App must be running in iOS Simulator (iPhone 14 Plus recommended for 6.7" screenshots)
2. Test data should be populated with realistic club and player names
3. User should be logged in with a test account

## Screenshot Capture Process

### 1. 📍 Discover Local Tennis Clubs
**Navigation**: Home page → Club Discovery
**Setup**:
- Ensure location permissions are granted
- Populate with 4-5 nearby clubs with realistic names
- Show clubs at varying distances (0.5 - 5 miles)

**Capture**:
- Show map view with club pins
- List view with club cards showing:
  - Club names (e.g., "Sunset Tennis Club", "Metro Sports Complex")
  - Ratings (4.2-4.8 stars)
  - Distance indicators
  - "Join Club" buttons
- File: `01-discover-clubs.png`

### 2. 🎾 Connect with Players
**Navigation**: Club page → Looking to Play section
**Setup**:
- Join a test club with active players
- Create 3-4 match invitations with different time slots
- Mix of skill levels (3.0, 3.5, 4.0)

**Capture**:
- Active match invitations
- Player profiles with skill levels
- "I'm Interested" buttons
- Available time slots
- File: `02-connect-players.png`

### 3. 📊 Record Match Scores
**Navigation**: Plus button → Record Match
**Setup**:
- Pre-fill with two player names
- Show tennis scoring format

**Capture**:
- Score entry form
- Set-by-set score fields
- Player selection dropdowns
- Match type toggle (singles/doubles)
- Professional scoring interface
- File: `03-record-scores.png`

### 4. 🏆 Climb the Rankings
**Navigation**: Club page → Rankings tab
**Setup**:
- Join club with 10+ members
- Ensure test account has some matches recorded
- Position test account in top 5

**Capture**:
- Rankings leaderboard
- User's position highlighted
- Win/loss records
- Point totals
- Recent match results
- File: `04-climb-rankings.png`

### 5. 🔔 Active Community
**Navigation**: Home page (with notifications)
**Setup**:
- Generate test notifications:
  - Match invitation
  - Challenge request
  - Match result update
- Show badge on tab bar

**Capture**:
- Quick actions section expanded
- Multiple notification types
- Community activity
- Urgency indicators (colors)
- File: `05-active-community.png`

## Technical Requirements
- Resolution: 1290 x 2796 pixels (iPhone 6.7")
- Format: PNG
- No transparency
- Portrait orientation only

## Post-Capture Tasks
1. Save all screenshots to `docs/app-store/screenshots/iphone-6.7/`
2. Verify text readability at thumbnail size
3. Check for any test data or placeholder content
4. Ensure consistent visual theme across all screenshots

## Additional Device Sizes
After capturing iPhone 6.7" screenshots:
1. Resize for iPhone 6.5" (1242 x 2688)
2. Resize for iPhone 5.5" (1242 x 2208)
3. Save in respective directories

---
*Use this plan when the app is running in the iOS Simulator to capture professional App Store screenshots*