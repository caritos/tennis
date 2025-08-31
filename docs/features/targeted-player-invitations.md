# Targeted Player Invitations

## Overview
This feature enhances the match invitation system to display specific player names when creating targeted invitations, providing clearer communication about who is being invited to play.

## GitHub Issue
- **Issue #138**: Better message for "looking to play" matches with specific players
- **Request**: Show "Waiting for [playerName] to respond" instead of generic "Looking for 1 player"

## Feature Description

### Before
- All match invitations showed generic messages like "Looking for 1 player" or "Looking for 3 players"
- No distinction between open invitations and targeted invitations in the UI
- Users couldn't tell who specifically was invited

### After
- Targeted invitations show "Waiting for [playerName] to respond"
- Multiple targeted players show as "Waiting for Alice, Bob, Charlie to respond"
- Open invitations still show "Looking for X players"
- Dynamically updates as players respond

## Implementation Details

### Database Schema

#### Added Columns to `match_invitations` table:
```sql
targeted_players UUID[]        -- Array of user IDs for targeted invitations
targeted_player_names TEXT[]   -- Array of player names for display
```

### Database Functions

#### Updated `create_match_invitation` function:
- Accepts `p_targeted_players` parameter
- Automatically fetches and stores player names in `targeted_player_names`
- Creates appropriate notifications based on invitation type

#### Updated `get_club_match_invitations` function:
- Returns both `targeted_players` and `targeted_player_names` fields
- Ensures data flows through to the UI layer

### Application Components

#### `DoublesMatchParticipants.tsx`
- Already had conditional logic for displaying targeted player names
- Shows "Waiting for [name] to respond" when `targetedPlayerNames` prop is provided
- Falls back to "Looking for X players" for open invitations
- Filters out players who have already responded from the waiting list

#### `MatchInvitationForm.tsx`
- Sends `targeted_players` for specific player invitations
- Sends `targeted_players` for quick match with suggested players (based on ELO rating)
- Differentiates between "open", "quick match", and "specific players" invite types
- Uses skill-based matching algorithm for quick match suggestions

#### Data Flow
1. User selects specific players in invitation form
2. Form sends `targeted_players` array to service
3. Database function fetches player names and stores both arrays
4. Query returns both fields through all layers
5. UI component displays appropriate message based on data

## User Experience

### Singles Matches
- **Open Invitation**: "Looking for 1 player"
- **Targeted Invitation**: "Waiting for Sarah Johnson to respond"
- **With Pending Response**: "Waiting for 1 player"

### Doubles Matches
- **Open Invitation**: "Looking for 3 players"
- **Targeted Invitation**: "Waiting for Alice, Bob, Charlie to respond"
- **Partial Response**: "Waiting for Bob, Charlie to respond" (if Alice already joined)
- **Mixed (2 joined, need 1 more)**: "Looking for 1 player"

### Quick Match System  
- Uses ELO rating to suggest skill-matched opponents
- Shows suggested player names: "Waiting for Mike Wilson to respond"
- Targets top 3 suggested players for singles matches
- Falls back to generic message if no skill data available

## Testing

### Unit Tests
Located in `/tests/unit/features/targetedPlayerDisplay.test.tsx`

Test coverage includes:
- Singles and doubles targeted invitations
- Open vs targeted invitation display
- Partial responses in doubles
- Quick challenge display
- Edge cases (empty arrays, null values, mismatched data)
- User experience (join button visibility)

### Manual Testing Checklist
1. ✅ Create open singles invitation → Shows "Looking for 1 player"
2. ✅ Create targeted singles invitation → Shows "Waiting for [name] to respond"
3. ✅ Create open doubles invitation → Shows "Looking for 3 players"
4. ✅ Create targeted doubles invitation → Shows all targeted names
5. ✅ Have one targeted player respond → Updates to show remaining names
6. ✅ Create quick challenge → Shows challenged player's name
7. ✅ Non-targeted users can still join open slots
8. ✅ Creator cannot join their own match

## SQL Migrations

### Required migrations to apply:
```bash
# 1. Add columns to match_invitations table
psql -d your_database -f database/add-targeted-players-columns.sql

# 2. Update create_match_invitation function
psql -d your_database -f database/update-create-match-invitation-with-names-fixed.sql

# 3. Update get_club_match_invitations function
psql -d your_database -f database/update-get-club-match-invitations.sql
```

## Benefits

### For Match Creators
- Clear visibility of who has been invited
- Can track which specific players haven't responded
- Better for organizing targeted matches with friends

### For Invited Players
- Know they were specifically invited (not just a general call)
- Feel more personally engaged to respond
- Clear indication this is a targeted invitation

### For Other Club Members
- Can still join if there are open slots
- Understand when a match is looking for specific players
- Better context about match organization

## Future Enhancements

### Potential Improvements
1. **Notification differentiation**: Different notification text for targeted vs open invitations
2. **Response prioritization**: Give targeted players priority/exclusive response window
3. **Invitation expiry**: Auto-convert targeted to open after X hours without response
4. **Player availability**: Show online/active status of targeted players
5. **Bulk invitations**: Template system for recurring targeted invitations

## Technical Notes

### Performance Considerations
- Player name fetching happens at invitation creation time (not runtime)
- Names stored denormalized for fast display
- No additional queries needed during rendering

### Data Integrity
- Player names captured at invitation time (won't change if user updates profile)
- Handles deleted users gracefully (null checks in place)
- Arrays stay synchronized through database function

### Compatibility
- Backward compatible with existing invitations (null targeted fields)
- Works with both singles and doubles matches
- Integrates with existing challenge system

## Conclusion

This feature successfully addresses the user request to show specific player names in targeted invitations, improving clarity and user experience in the match invitation system. The implementation maintains backward compatibility while adding valuable context to the invitation process.