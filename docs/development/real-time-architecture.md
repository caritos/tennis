# Real-Time Architecture with Supabase Subscriptions

## Overview

Play Serve uses **Supabase real-time subscriptions** for automatic UI updates instead of manual refresh patterns (props, callbacks, focus events). This provides a more responsive and scalable user experience.

## Architecture Decision

**Previous Approach** (Deprecated):
```typescript
// ❌ Manual refresh patterns
interface ComponentProps {
  onRefresh?: () => void;
  refreshTrigger?: number;
}

// ❌ Manual calls after actions  
onSuccess={() => {
  setShowModal(false);
  loadClubDetails(); // Manual refresh
}}

// ❌ Focus-based refresh
useFocusEffect(() => {
  loadData();
});
```

**Current Approach** (Recommended):
```typescript
// ✅ Real-time subscriptions
useEffect(() => {
  loadData();

  const subscription = supabase
    .channel(`component_${id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public', 
      table: 'target_table',
      filter: `club_id=eq.${id}`
    }, (payload) => {
      console.log('🔔 Data change detected:', payload);
      loadData(); // Auto-refresh on data changes
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [id]);
```

## Implementation Pattern

### 1. **Component Setup**
Every component that displays live data should:

1. **Load data initially** in `useEffect`
2. **Create subscriptions** for relevant tables
3. **Filter subscriptions** to specific records (performance)
4. **Clean up subscriptions** on unmount

### 2. **Subscription Filters**
Use precise filters to avoid unnecessary updates:

```typescript
// ✅ Good: Specific club filter
filter: `club_id=eq.${clubId}`

// ✅ Good: User-specific filter  
filter: `user_id=eq.${userId}`

// ❌ Avoid: No filter (all table changes)
// This causes performance issues
```

### 3. **Multiple Table Subscriptions**
For components that depend on multiple tables:

```typescript
useEffect(() => {
  loadData();

  const subscriptions = [
    // Club details
    supabase.channel(`clubs_${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'clubs',
        filter: `id=eq.${id}` 
      }, loadData)
      .subscribe(),

    // Club members
    supabase.channel(`club_members_${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'club_members',
        filter: `club_id=eq.${id}` 
      }, loadData)
      .subscribe(),
      
    // Matches
    supabase.channel(`matches_${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'matches',
        filter: `club_id=eq.${id}` 
      }, loadData)
      .subscribe()
  ];

  return () => {
    subscriptions.forEach(sub => sub.unsubscribe());
  };
}, [id]);
```

## Components Using Real-Time Updates

### ✅ **Implemented Components**

| Component | Tables Watched | Purpose |
|-----------|----------------|---------|
| `MatchInvitationNotification` | `match_invitations` | Live invitation alerts |
| `ChallengeNotifications` | `challenges` | Real-time challenge updates |
| `UpcomingMatchesNotification` | `match_invitations`, `invitation_responses` | Match status changes |
| `ContactSharingNotification` | `notifications` | Contact sharing alerts |
| `Club Details Page` | `clubs`, `club_members`, `matches` | Live club data |

### 🔄 **Migration Candidates**

Components that could benefit from real-time updates:

- `ClubList` - Live club updates, member counts
- `NotificationList` - Real-time notification updates  
- `MatchHistoryView` - Live match results
- `PlayerProfile` - Rating and stats updates

## Benefits

### 1. **User Experience**
- **Instant Updates**: Changes appear immediately without manual refresh
- **Multi-Device Sync**: Updates propagate across all connected devices
- **No Stale Data**: UI always reflects current database state

### 2. **Developer Experience**  
- **Cleaner Code**: No complex callback chains or refresh props
- **Less Debugging**: No "why didn't it update?" issues
- **Automatic Scaling**: Works with any number of connected clients

### 3. **Performance**
- **Efficient**: Only updates when data actually changes
- **Filtered**: Subscriptions target specific records only
- **Built-in Reconnection**: Handles network issues automatically

## Development Guidelines

### ✅ **Do**
- Use real-time subscriptions for live data
- Filter subscriptions to specific records
- Clean up subscriptions in `useEffect` cleanup
- Log subscription events for debugging
- Use unique channel names per component instance

### ❌ **Don't**
- Create unfiltered subscriptions (performance impact)
- Use manual refresh callbacks for live data  
- Forget to unsubscribe on component unmount
- Create too many subscriptions per component
- Use subscriptions for one-time data fetches

## Testing Considerations

### **Mock Configuration**
Real-time subscriptions require proper mocking in tests:

```typescript
// __mocks__/lib/supabase.js
export const supabase = {
  // ... other methods
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    unsubscribe: jest.fn(),
  })),
};
```

### **Test Patterns**
```typescript
// Test subscription setup
it('should create subscription on mount', () => {
  render(<Component />);
  expect(supabase.channel).toHaveBeenCalledWith('component_id');
});

// Test cleanup  
it('should unsubscribe on unmount', () => {
  const mockUnsubscribe = jest.fn();
  supabase.channel.mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(() => ({ unsubscribe: mockUnsubscribe })),
  });
  
  const { unmount } = render(<Component />);
  unmount();
  
  expect(mockUnsubscribe).toHaveBeenCalled();
});
```

## Performance Monitoring

### **Subscription Health**
Monitor subscription performance:

```typescript
// Log subscription events
.on('postgres_changes', config, (payload) => {
  console.log(`🔔 ${tableName} change:`, {
    event: payload.eventType,
    table: payload.table, 
    timestamp: new Date().toISOString()
  });
  handleDataChange();
})
```

### **Connection Management**
- Supabase automatically handles reconnections
- Multiple subscriptions share the same WebSocket connection
- No manual connection management required

## Migration Guide

### **From Manual Refresh Patterns**

1. **Remove refresh props**:
   ```typescript
   // Before
   interface Props {
     onRefresh?: () => void;
     refreshTrigger?: number;
   }
   
   // After  
   interface Props {
     // No refresh props needed
   }
   ```

2. **Replace callback patterns**:
   ```typescript
   // Before
   onSuccess={() => {
     setShowModal(false);
     refreshParentData();
   }}
   
   // After
   onSuccess={() => {
     setShowModal(false);
     // Real-time subscription handles refresh
   }}
   ```

3. **Update useEffect dependencies**:
   ```typescript
   // Before
   useEffect(() => {
     loadData();
   }, [id, refreshTrigger]);
   
   // After
   useEffect(() => {
     loadData();
     
     const subscription = /* ... */;
     return () => subscription.unsubscribe();
   }, [id]); // Remove refreshTrigger
   ```

## Troubleshooting

### **Common Issues**

1. **Subscription not triggering**:
   - Check filter syntax: `club_id=eq.${id}` not `club_id=${id}`
   - Verify table name matches database exactly
   - Ensure RLS policies allow subscription access

2. **Too many updates**:
   - Add more specific filters
   - Debounce the reload function
   - Check for infinite update loops

3. **Memory leaks**:
   - Always unsubscribe in cleanup
   - Use dependency array correctly in useEffect
   - Don't create subscriptions inside render functions

### **Debugging**
```typescript
// Enable subscription debugging
.on('postgres_changes', config, (payload) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔔 Real-time Update: ${tableName}`);
    console.log('Event:', payload.eventType);
    console.log('Record:', payload.new || payload.old);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
  handleUpdate();
})
```

---

## Related Documentation

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [Production Stability Requirements](./production-stability-requirements.md)
- [Development Guidelines](./README.md)

*Last Updated: December 2024*