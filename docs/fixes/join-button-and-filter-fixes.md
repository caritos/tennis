# Join Button and Filter Fixes

## Date: August 29, 2025

## Issues Fixed

### 1. Join Button Not Appearing on Match Invitations
**Problem**: Users couldn't join match invitations even when they should be able to. The "Waiting for opponent..." text appeared instead of a clickable "Join Match" button.

**Root Cause**: The SQL function `get_club_match_invitations` was missing the `status` field when fetching invitation responses. This caused all responses to have `status: undefined` in the app, making the system think users had already responded when they hadn't properly.

**Solution**: 
- Updated the SQL function to include the `status` field in response data
- Modified the `hasUserResponded` logic to check for ANY response (not just confirmed/interested)

### 2. "Need Players" Filter Showing Non-Joinable Matches
**Problem**: The "Need Players" filter was showing matches that the current user created, which they cannot join themselves.

**Root Cause**: The filter only checked if matches were incomplete, not whether the current user could actually join them.

**Solution**: Added logic to check both:
- If the match needs more players (incomplete)
- AND if the current user can join (not the creator and hasn't already responded)

## Technical Changes

### Files Modified

1. **`/components/DoublesMatchParticipants.tsx`**
   - Changed `hasUserResponded` to check for any response from the user
   - Removed responses with undefined status from being considered as valid responses

2. **`/components/club/ClubMatches.tsx`**
   - Updated "Need Players" filter (`incomplete`) to exclude matches where:
     - User is the creator
     - User has already responded
   - Added `canCurrentUserJoin` logic for both invitation and regular matches

3. **`/database/functions/02_get_club_match_invitations.sql`**
   - Added `'status', mir.status` to the json_build_object function
   - Ensures response status is included in the data returned from the database

### SQL Migration Required

To fix the database function, run this SQL in Supabase dashboard:

```sql
DROP FUNCTION IF EXISTS get_club_match_invitations(uuid, uuid);

CREATE OR REPLACE FUNCTION get_club_match_invitations(
  p_club_id uuid,
  p_user_id uuid DEFAULT NULL
)
-- ... function definition with status field included ...
```

(Full SQL available in `/database/migrations/20250829_fix_response_status.sql`)

## Testing

After applying these fixes:
1. Join buttons should appear on match invitations where the user can join
2. Join buttons should NOT appear if:
   - User created the invitation
   - User has already responded (even with undefined status)
3. "Need Players" filter should only show matches the user can actually join

## Related Issues
- GitHub Issue #133 (Match highlighting - previously fixed)
- GitHub Issue #132 (Already resolved)
- GitHub Issue #121, #131 (Previously fixed)

## Notes
- The undefined status responses were likely from an earlier version of the app
- These fixes prevent the backend error: "You have already responded to this invitation"
- The fixes maintain backward compatibility with existing data