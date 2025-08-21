#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Get current build number
const currentBuildNumber = appJson.expo.ios.buildNumber;
console.log('📱 Current build number:', currentBuildNumber);

// Generate new build number using format: YYYYMMDDNNN
const now = new Date();
const datePrefix = now.getFullYear().toString() + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');

// Extract current increment number or start at 001
let increment = 1;
if (currentBuildNumber.startsWith(datePrefix)) {
  const currentIncrement = parseInt(currentBuildNumber.slice(-3));
  increment = currentIncrement + 1;
}

// Generate new build number
const newBuildNumber = datePrefix + increment.toString().padStart(3, '0');

// Update app.json
appJson.expo.ios.buildNumber = newBuildNumber;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log('✅ Updated build number:', newBuildNumber);
console.log('📝 Updated app.json');

// Also log the version for reference
console.log('🔢 App version:', appJson.expo.version);