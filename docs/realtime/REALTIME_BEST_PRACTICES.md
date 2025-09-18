# Supabase Realtime Best Practices

Based on official Supabase documentation and patterns.

## ✅ Correct Patterns

### 1. **Use `await` with subscribe()**
```typescript
// ✅ CORRECT - Using await
const { status, error } = await channel.subscribe();
if (status === 'SUBSCRIBED') {
  console.log('Connected!');
}

// ❌ INCORRECT - Callback pattern (old)
channel.subscribe((status) => {
  // This is the old pattern
});
```

### 2. **Use `removeChannel()` for cleanup**
```typescript
// ✅ CORRECT - Using removeChannel
supabase.removeChannel(channel);

// ❌ INCORRECT - Using unsubscribe
channel.unsubscribe();
```

### 3. **Set auth before subscribing to private channels**
```typescript
// ✅ CORRECT - Auth before subscribe
await supabase.realtime.setAuth();
await channel.subscribe();

// ❌ INCORRECT - Subscribe without auth
await channel.subscribe(); // Will fail for private channels
```

### 4. **Channel naming conventions**
```typescript
// ✅ CORRECT - Specific, scoped channels
const channel = supabase.channel(`room:${roomId}:messages`);
const channel = supabase.channel(`club:${clubId}:members`);

// ❌ INCORRECT - Too broad
const channel = supabase.channel('global:notifications');
```

## 🚀 Migration: postgres_changes → broadcast

Supabase recommends migrating from `postgres_changes` to `broadcast` for better performance:

### Old Pattern (postgres_changes)
```typescript
const channel = supabase.channel('changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages',
    filter: `room_id=eq.${roomId}`
  }, callback)
  .subscribe();
```

### New Pattern (broadcast with database trigger)
```typescript
// Client
const channel = supabase.channel(`room:${roomId}:messages`, {
  config: { private: true }
})
  .on('broadcast', { event: 'INSERT' }, handleInsert)
  .on('broadcast', { event: 'UPDATE' }, handleUpdate)
  .on('broadcast', { event: 'DELETE' }, handleDelete)
  .subscribe();
```

```sql
-- Database trigger
CREATE OR REPLACE FUNCTION notify_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'room:' || COALESCE(NEW.room_id, OLD.room_id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_table_changes();
```

## 🎯 Implementation Checklist

- [ ] Replace `.subscribe(callback)` with `await .subscribe()`
- [ ] Replace `.unsubscribe()` with `supabase.removeChannel()`
- [ ] Add `await supabase.realtime.setAuth()` before private channels
- [ ] Check for `status === 'SUBSCRIBED'` explicitly
- [ ] Use specific channel names, not global ones
- [ ] Consider migrating to broadcast pattern for high-frequency updates
- [ ] Add proper error handling for subscription failures
- [ ] Clean up channels in useEffect cleanup functions

## 📊 Performance Considerations

### Use broadcast for:
- High-frequency updates
- Messages that don't need RLS checks
- Public data that all users can see

### Use postgres_changes for:
- Low-frequency updates
- Data that requires RLS checks
- Initial prototyping (easier setup)

## 🔐 Authorization

### Private Channels
```typescript
// Require authentication
const channel = supabase.channel('private:data', {
  config: { private: true }
});

await supabase.realtime.setAuth(); // Required!
await channel.subscribe();
```

### RLS for broadcast
```sql
-- Allow authenticated users to receive broadcasts
CREATE POLICY "users_can_receive_broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
```

## 🚨 Common Mistakes

1. **Not awaiting subscribe()** - Leads to race conditions
2. **Using unsubscribe() instead of removeChannel()** - Memory leaks
3. **Forgetting setAuth() for private channels** - Authorization errors
4. **Too broad channel names** - All users get all messages
5. **Not checking subscription status** - Silent failures
6. **Creating subscriptions in render functions** - Multiple subscriptions
7. **Not cleaning up channels** - Memory leaks

## 📚 References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [Broadcast and Presence Authorization](https://supabase.com/docs/guides/realtime/authorization)