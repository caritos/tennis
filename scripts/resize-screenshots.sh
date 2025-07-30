#!/bin/bash

# Resize App Store screenshots from iPhone 6.7" to other required sizes
# Usage: ./scripts/resize-screenshots.sh

set -e

echo "🖼️  App Store Screenshot Resizer"
echo "================================"

# Define directories
SOURCE_DIR="docs/app-store/screenshots/iphone-6.7"
DEST_65_DIR="docs/app-store/screenshots/iphone-6.5"
DEST_55_DIR="docs/app-store/screenshots/iphone-5.5"

# Create destination directories if they don't exist
mkdir -p "$DEST_65_DIR"
mkdir -p "$DEST_55_DIR"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    echo "Please capture iPhone 6.7\" screenshots first!"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed"
    echo "Install with: brew install imagemagick"
    exit 1
fi

# Define sizes
# iPhone 6.7" (source): 1290 x 2796
# iPhone 6.5" (target): 1242 x 2688
# iPhone 5.5" (target): 1242 x 2208

echo "📱 Resizing screenshots..."
echo ""

# Process each PNG file
for file in "$SOURCE_DIR"/*.png; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "Processing: $filename"
        
        # Resize for iPhone 6.5"
        echo "  → Resizing to iPhone 6.5\" (1242 x 2688)..."
        convert "$file" -resize 1242x2688! "$DEST_65_DIR/$filename"
        
        # Resize for iPhone 5.5"
        echo "  → Resizing to iPhone 5.5\" (1242 x 2208)..."
        convert "$file" -resize 1242x2208! "$DEST_55_DIR/$filename"
        
        echo "  ✅ Done"
        echo ""
    fi
done

# Verify results
echo "📊 Results:"
echo "----------"
echo "iPhone 6.7\" (source): $(ls -1 "$SOURCE_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ') screenshots"
echo "iPhone 6.5\" (resized): $(ls -1 "$DEST_65_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ') screenshots"
echo "iPhone 5.5\" (resized): $(ls -1 "$DEST_55_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ') screenshots"
echo ""

# Show file sizes for verification
echo "📏 Size Verification (first screenshot):"
if [ -f "$SOURCE_DIR/01-discover-clubs.png" ]; then
    echo "iPhone 6.7\": $(identify -format "%wx%h" "$SOURCE_DIR/01-discover-clubs.png" 2>/dev/null || echo "N/A")"
fi
if [ -f "$DEST_65_DIR/01-discover-clubs.png" ]; then
    echo "iPhone 6.5\": $(identify -format "%wx%h" "$DEST_65_DIR/01-discover-clubs.png" 2>/dev/null || echo "N/A")"
fi
if [ -f "$DEST_55_DIR/01-discover-clubs.png" ]; then
    echo "iPhone 5.5\": $(identify -format "%wx%h" "$DEST_55_DIR/01-discover-clubs.png" 2>/dev/null || echo "N/A")"
fi

echo ""
echo "✅ Screenshot resizing complete!"
echo ""
echo "Next steps:"
echo "1. Review resized screenshots in each directory"
echo "2. Verify quality and readability"
echo "3. Upload to App Store Connect"