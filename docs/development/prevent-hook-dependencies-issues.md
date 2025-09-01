# Preventing React Hook Dependency Issues

This guide ensures we never introduce circular dependencies, stale closures, or polling patterns again.

## 🚫 Common Anti-Patterns to Avoid

### 1. Circular Dependencies

❌ **DON'T DO THIS:**
```typescript
const loadData = useCallback(async () => {
  // some operation
}, [loadData, id]); // ❌ loadData depends on itself!
```

✅ **DO THIS INSTEAD:**
```typescript
const loadData = useCallback(async () => {
  // some operation
}, [id]); // ✅ Only depends on primitive values
```

### 2. Stale Closures

❌ **DON'T DO THIS:**
```typescript
useEffect(() => {
  loadData();
}, [id, loadData]); // ❌ Function in dependency array

const loadData = useCallback(() => {
  console.log(id); // May capture stale id
}, [id]);
```

✅ **DO THIS INSTEAD:**
```typescript
useEffect(() => {
  const fetchData = async () => {
    // Access fresh values directly
    console.log(id);
  };
  fetchData();
}, [id]); // ✅ Function defined inline, uses fresh values
```

### 3. Active Polling

❌ **DON'T DO THIS:**
```typescript
useEffect(() => {
  const interval = setInterval(fetchNotifications, 30000); // ❌ Polling
  return () => clearInterval(interval);
}, []);
```

✅ **DO THIS INSTEAD:**
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, () => {
      // Realtime updates! ✅
      loadNotifications();
    })
    .subscribe();
    
  return () => subscription.unsubscribe();
}, [userId]);
```

## 🛡️ Prevention Tools

### 1. Automated Checks

Run these commands to catch issues:

```bash
# Check for dependency issues
npm run check:deps

# Run dependency validation tests
npm run test tests/unit/hooks/dependencyValidation.test.ts

# Full pre-commit checks
npm run checks:pre-commit
```

### 2. IDE Setup

Add these VS Code settings to catch issues early:

```json
{
  "eslint.validate": ["typescript", "typescriptreact"],
  "eslint.rules.customizations": [
    {
      "rule": "react-hooks/exhaustive-deps",
      "severity": "error"
    }
  ]
}
```

### 3. Git Hooks

Pre-commit hooks automatically run dependency checks:

```bash
# Installs automatically via package.json
npm install
```

## ✅ Correct Patterns

### Realtime Subscription Pattern

```typescript
useEffect(() => {
  // Define function inside effect for fresh closure
  const loadData = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('club_id', clubId);
    setMatches(data);
  };

  // Set up realtime subscription
  const subscription = supabase
    .channel(`matches_${clubId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'matches',
      filter: `club_id=eq.${clubId}`
    }, (payload) => {
      console.log('Match change detected:', payload.eventType);
      loadData(); // Always calls fresh version
    })
    .subscribe();

  // Initial load
  loadData();

  // Cleanup
  return () => subscription.unsubscribe();
}, [clubId]); // ✅ Only primitive dependencies
```

### Callback Pattern

```typescript
// ✅ Correct: Callback with proper dependencies
const handleSubmit = useCallback(async (formData: FormData) => {
  await submitMatch(formData, clubId, userId);
}, [clubId, userId]); // Dependencies are primitives

// ✅ Correct: Pass callback to child without dependency issues  
<MatchForm onSubmit={handleSubmit} />
```

## 🔍 Testing Strategy

### Unit Tests

Test files automatically validate dependency patterns:

```typescript
describe('Component Dependencies', () => {
  it('should not have circular dependencies', () => {
    const analyzer = new DependencyAnalyzer();
    analyzer.analyzeFile('path/to/component.tsx');
    
    const circularIssues = analyzer.issues.filter(i => 
      i.type === 'CIRCULAR_DEPENDENCY'
    );
    expect(circularIssues).toHaveLength(0);
  });
});
```

### Integration Tests

Verify realtime subscriptions work properly:

```typescript
describe('Realtime Integration', () => {
  it('should update UI when database changes', async () => {
    // Setup component with realtime subscription
    const { getByText } = render(<MatchList clubId="test" />);
    
    // Insert match in database
    await supabase.from('matches').insert({ /* match data */ });
    
    // Verify UI updates without polling
    await waitFor(() => {
      expect(getByText('New Match')).toBeInTheDocument();
    });
  });
});
```

## 📈 Monitoring

### CI/CD Checks

GitHub Actions automatically run on every PR:

- ✅ Dependency safety checks
- ✅ ESLint with React Hooks rules  
- ✅ TypeScript compilation
- ✅ Unit test validation

### Local Development

Commands available during development:

```bash
# Quick check before committing
npm run checks:pre-commit

# Deep analysis of codebase
npm run check:deps

# Test realtime functionality  
npm run diagnose:prod
```

## 🚨 Red Flags

Watch out for these patterns in code reviews:

1. **Function names in dependency arrays**
   - `[id, loadData]` ❌
   - `[id]` ✅

2. **setInterval/setTimeout with numbers** 
   - `setInterval(fn, 30000)` ❌
   - `subscription.on(...)` ✅

3. **Missing subscription cleanup**
   - No `return () => sub.unsubscribe()` ❌
   - Proper cleanup ✅

4. **Manual refresh patterns**
   - `onRefresh={reload}` ❌ 
   - Realtime subscriptions ✅

## 📚 Additional Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
- [ESLint React Hooks Plugin](https://www.npmjs.com/package/eslint-plugin-react-hooks)

## 🎯 Summary

By following these patterns and using the automated tools, we ensure:

- ✅ **No circular dependencies** - Functions never depend on themselves
- ✅ **No stale closures** - Always access fresh values  
- ✅ **No active polling** - Use realtime subscriptions instead
- ✅ **Proper cleanup** - All subscriptions are cleaned up
- ✅ **Real-time updates** - UI updates instantly with database changes

The automated tools catch issues before they reach production!