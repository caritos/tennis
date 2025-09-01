# 🎾 E2E Testing with Expo Go - Setup Guide

## The Issue You Encountered

The error you saw:
```
Exception: SimctlError - No such file or directory
com.caritos.tennis not found on device
```

This happens because:
- The test tried to launch `com.caritos.tennis` (development build app ID)
- But we don't have a development build installed on the simulator
- We need to use Expo Go instead

## ✅ Quick Solution - Two Options

### Option A: Use Expo Go (Quick & Easy)

#### 1. Setup Expo Go
```bash
# Start your development server
npm start

# In the simulator:
# - Open App Store 
# - Search and install "Expo Go"
# - Open Expo Go
# - Connect to your development server at localhost:8081
```

#### 2. Run the Expo-compatible test
```bash
./run-e2e-simple.sh 15-record-match-unregistered-expo
```

### Option B: Use Original Tests (Requires Development Build)

#### 1. Build and install the development app
```bash
# This takes 5-10 minutes but gives you the real app
npx expo run:ios --device "iPhone 16 Pro"
```

#### 2. Run the original tests
```bash
./run-e2e-simple.sh 15-record-match-unregistered-quick
```

## 🚀 Step-by-Step: Expo Go Method

### Step 1: Start Development Server
```bash
npm start
```
Wait for: "Waiting on http://localhost:8081"

### Step 2: Install Expo Go in Simulator
1. Open iOS Simulator
2. Open Safari in simulator
3. Go to: `apps.apple.com/app/expo-go/id982107779`
4. Install Expo Go

### Step 3: Connect Expo Go to Your Project
1. Open Expo Go in simulator
2. Look for your project in "Recently opened" 
3. OR tap "Enter URL manually" and enter: `exp://localhost:19000`
4. Wait for your Tennis app to load

### Step 4: Run the Test
```bash
export PATH="$PATH":"$HOME/.maestro/bin"
maestro test tests/integration/flows/15-record-match-unregistered-expo.yaml
```

## 📊 What Each Test Does

| Test File | App Target | Purpose |
|-----------|------------|---------|
| `15-record-match-unregistered-quick.yaml` | `com.caritos.tennis` | Development build (most reliable) |
| `15-record-match-unregistered-expo.yaml` | `host.exp.exponent` | Expo Go (quick setup) |
| `15-record-match-unregistered-player.yaml` | `com.caritos.tennis` | Full comprehensive test |

## 🔧 Troubleshooting

### "App not found" Error
- **Problem**: Test can't find the app
- **Solution**: Make sure app ID matches what's installed
- **Check**: Is it Expo Go (`host.exp.exponent`) or development build (`com.caritos.tennis`)?

### Expo Go Can't Connect  
- **Problem**: "Unable to connect to development server"
- **Solution**: 
  ```bash
  # Check server is running
  npm start
  
  # Try different URL in Expo Go:
  exp://localhost:19000
  # OR
  exp://127.0.0.1:19000
  ```

### Test Gets Stuck at App Loading
- **Problem**: App takes too long to load in Expo Go
- **Solution**: Increase timeout or wait manually
- **Alternative**: Use development build for more reliable testing

## 💡 Best Practices

### For Development/Quick Testing
- Use Expo Go method
- Run `15-record-match-unregistered-expo.yaml`
- Faster setup, good for iterative testing

### For Production/Comprehensive Testing  
- Build development app once: `npx expo run:ios`
- Run `15-record-match-unregistered-quick.yaml` 
- More reliable, exactly matches production behavior

### For CI/CD Pipeline
- Build development app in CI
- Run all comprehensive tests
- Most accurate representation of user experience

## 🎯 Your Next Steps

**To test your unregistered player feature right now:**

```bash
# 1. Start server (if not running)
npm start

# 2. Make sure Expo Go is installed and connected in simulator

# 3. Run the test
./run-e2e-simple.sh 15-record-match-unregistered-expo

# 4. View screenshots
open tests/integration/screenshots/
```

**The test will validate:**
✅ Navigation to match recording  
✅ Adding "Alex Rodriguez" as unregistered player  
✅ Entering tennis scores (6-2, 6-4)  
✅ Saving the match successfully  
✅ Verifying match appears in Recent Matches  

**Total test time: 2-3 minutes vs manual phone testing!** 🚀