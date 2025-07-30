#!/bin/bash

# App Store Metadata Update Script
# Updates app.json with optimized metadata for App Store submission

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📱 Updating App Store Metadata${NC}"
echo "====================================="

# Check if app.json exists
if [ ! -f "app.json" ]; then
    echo -e "${RED}❌ app.json not found${NC}"
    exit 1
fi

# Backup current app.json
cp app.json app.json.backup
echo -e "${YELLOW}📄 Created backup: app.json.backup${NC}"

# Load metadata from JSON file
METADATA_FILE="docs/app-store/app-store-copy.json"
if [ ! -f "$METADATA_FILE" ]; then
    echo -e "${RED}❌ Metadata file not found: $METADATA_FILE${NC}"
    exit 1
fi

# Extract optimized values
OPTIMIZED_TITLE=$(node -pe "JSON.parse(require('fs').readFileSync('$METADATA_FILE', 'utf8')).appTitle.optimized")
OPTIMIZED_DESCRIPTION=$(node -pe "JSON.parse(require('fs').readFileSync('$METADATA_FILE', 'utf8')).shortDescription")

echo -e "${BLUE}🎯 Applying Optimizations:${NC}"
echo "Title: $OPTIMIZED_TITLE"
echo "Description: $OPTIMIZED_DESCRIPTION"
echo ""

# Update app.json using Node.js for JSON manipulation
node -e "
const fs = require('fs');
const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const metadata = JSON.parse(fs.readFileSync('$METADATA_FILE', 'utf8'));

// Update app title - keep slug as is for consistency
appConfig.expo.name = metadata.appTitle.optimized;

// Update description with optimized short description
appConfig.expo.description = metadata.shortDescription;

// Write updated config
fs.writeFileSync('app.json', JSON.stringify(appConfig, null, 2) + '\n');

console.log('✅ Updated app.json with optimized metadata');
"

echo -e "${GREEN}✅ App metadata updated successfully${NC}"
echo ""

# Show what was changed
echo -e "${BLUE}📋 Changes Applied:${NC}"
echo "• App name optimized for discoverability"
echo "• Description optimized for App Store search"
echo "• Maintains existing configuration structure"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Review updated app.json"
echo "2. Test app builds with new metadata"
echo "3. Apply keywords and subtitle in App Store Connect"
echo "4. Upload optimized screenshots and app preview"
echo ""

echo -e "${BLUE}🔍 App Store Connect Manual Steps:${NC}"
echo "• Title: Play Serve: Tennis Community (28 chars)"
echo "• Subtitle: Find Players & Track Matches (29 chars)"
echo "• Keywords: tennis,club,courts,players,matches,scores,rankings,local,community,sports,finder,tracker"
echo "• Upload promotional text and localized content"
echo ""

echo -e "${GREEN}🎉 Metadata optimization complete!${NC}"