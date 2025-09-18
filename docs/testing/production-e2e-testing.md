# 🎾 Production E2E Testing Guide

## Overview

Production E2E testing allows you to validate your unregistered player feature against the real production database and environment. This ensures your features work correctly with actual user data and production configurations.

## ⚠️ IMPORTANT WARNINGS

### Production Data Impact
- **REAL DATA**: Tests create actual records in production database
- **REAL USERS**: May affect real user ELO ratings and match histories  
- **REAL NOTIFICATIONS**: May trigger real push notifications
- **PERSISTENCE**: All test data remains in production after testing

### When to Use Production Testing
✅ **Good for**:
- Pre-release validation
- Critical feature verification
- Production environment debugging
- Real data integration testing

❌ **Avoid for**:
- Regular development testing
- Experimental features
- Destructive operations
- High-frequency testing

## 🚀 Production Testing Setup

### Prerequisites
1. **Maestro CLI installed**: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. **iOS Simulator running**: iPhone 16 Pro or similar
3. **Expo Go installed**: In the simulator
4. **Production access**: Ensure you have access to production Supabase

### Quick Start
```bash
# Run production E2E tests with guided setup
./run-e2e-production.sh
```

This script will:
1. ✅ Check prerequisites
2. ⚠️  Confirm production testing intent
3. 🚀 Start production development server
4. 📱 Guide you through Expo Go setup
5. 🧪 Run comprehensive production tests
6. 📸 Capture production screenshots
7. 🧹 Clean up processes

## 📊 Production Test Coverage

### Test File: `15-record-match-unregistered-prod.yaml`

**Scenarios Tested**:
- **Realistic User Data**: Tests with common names like "Jennifer Smith"
- **Production Database**: Creates real match records
- **Real Club Data**: Tests with actual production clubs
- **ELO System**: Verifies production rating calculations
- **UI Flows**: Validates production app behavior
- **Data Persistence**: Confirms records save correctly

**Expected Flow**:
```
Launch App → Connect to Production → Navigate to Club → 
Record Match → Add "Jennifer Smith" (unregistered) → 
Enter Score (6-1, 7-5) → Save → Verify in Recent Matches
```

### Production Validation Points
1. **App Loading**: Production app loads in Expo Go
2. **Club Access**: User can access their production clubs
3. **Match Recording**: Form works with production data
4. **Unregistered Player**: Add guest player functionality works
5. **Score Entry**: Tennis scoring validation works
6. **Database Save**: Match persists in production database
7. **ELO Update**: Production rating system processes match
8. **UI Display**: Match appears in Recent Matches and Match History

## 🎯 What Gets Created in Production

### Database Records
```sql
-- Real match record created
INSERT INTO matches (
  player1_id,           -- Your production user ID
  opponent2_name,       -- 'Jennifer Smith' 
  scores,               -- '6-1,7-5'
  match_type,           -- 'singles'
  club_id,              -- Real production club ID
  date,                 -- Test execution date
  created_at            -- Timestamp
);

-- ELO rating updates
UPDATE users SET elo_rating = new_rating WHERE id = your_user_id;
```

### User Experience Impact
- **Match History**: Test match appears in your production match history
- **ELO Rating**: Your production ELO rating may change based on test scores
- **Club Stats**: Club statistics include the test match
- **Recent Matches**: Test match shows in club's recent matches

## 📸 Production Screenshots

The test automatically captures:
- `production-app-loaded`: Initial production app state
- `production-clubs-state`: Available clubs in production
- `production-match-form`: Match recording form
- `production-unregistered-added`: After adding guest player
- `production-scores-entered`: After entering scores
- `production-match-saved`: Successful save confirmation
- `production-match-history`: Match in history
- `production-elo-updated`: Updated ELO rating
- `production-test-complete`: Final state

## 🔧 Manual Production Testing Steps

If you prefer manual control:

### 1. Start Production Server
```bash
npm run start:prod
```

### 2. Connect Expo Go
1. Open Expo Go in simulator
2. Connect to localhost:8081
3. Wait for production app to load

### 3. Run Production Test
```bash
export PATH="$PATH":"$HOME/.maestro/bin"
maestro test tests/e2e/flows/15-record-match-unregistered-prod.yaml --debug-output=prod-test
```

### 4. View Results
```bash
open tests/e2e/screenshots/production/
```

## 🐛 Troubleshooting Production Testing

### "Production server won't start"
```bash
# Check if development server is already running
pkill -f "expo start"

# Try starting manually
npm run start:prod

# Check for port conflicts
lsof -i :8081
```

### "Expo Go can't connect"
- Ensure production server shows "Waiting on http://localhost:8081"
- Try connecting to `exp://localhost:19000` manually in Expo Go
- Check firewall settings

### "App loads development data instead of production"
- Verify you're running `npm run start:prod` not `npm start`
- Check environment variables in terminal output
- Look for production Supabase URL in logs

### "Test creates wrong data"
- Check that you're connected to production database
- Verify club selection in test
- Confirm user authentication state

## 🎯 Production Test Results Analysis

### Successful Test Indicators
- ✅ Production app loads with real clubs
- ✅ "Add Jennifer Smith as unregistered player" appears  
- ✅ Match saves without errors
- ✅ Match appears in Recent Matches with correct data
- ✅ ELO rating updates appropriately
- ✅ All screenshots captured successfully

### Common Issues
- **No clubs available**: User may not be member of any production clubs
- **Slow performance**: Production database may have different performance characteristics
- **Different UI state**: Production may have different feature flags or configurations

## 📊 Production vs Development Comparison

| Aspect | Development Testing | Production Testing |
|--------|-------------------|-------------------|
| **Database** | Test/fake data | Real user data |
| **Performance** | Local/fast | Network/realistic |
| **User State** | Clean/predictable | Real/varied |
| **Risk** | No impact | Real data changes |
| **Validation** | Feature accuracy | Production readiness |
| **Frequency** | High/continuous | Low/selective |

## 🛡️ Safety Measures

### Built-in Protections
- **Confirmation prompt**: Script asks for explicit confirmation
- **Clear warnings**: Multiple warnings about production impact
- **Realistic test data**: Uses common names that won't confuse real users
- **Documentation**: All created data is documented in screenshots

### Manual Safety Steps
1. **Use test accounts**: Consider using dedicated test user accounts
2. **Clean up after**: Manually remove test records if needed
3. **Monitor impact**: Check production metrics after testing
4. **Communicate**: Inform team when running production tests

## 🎉 Production Testing Benefits

### Confidence in Releases
- **Real environment validation**: Tests actual production conditions
- **Integration verification**: Confirms all systems work together  
- **Data accuracy**: Validates with real user and club data
- **Performance reality**: Tests real network and database performance

### Issue Detection
- **Environment differences**: Catches prod-specific issues
- **Configuration problems**: Identifies production config issues
- **Performance issues**: Reveals real-world performance problems
- **Data edge cases**: Tests with actual production data variations

---

**Remember**: Production testing is powerful but impactful. Use it strategically for critical validations, not routine development testing.

**Happy production testing!** 🚀