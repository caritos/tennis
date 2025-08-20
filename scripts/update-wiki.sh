#!/bin/bash
# Automated GitHub Wiki Update Script

set -e  # Exit on any error

REPO_URL="https://github.com/caritos/tennis.wiki.git"
WIKI_DIR="temp-wiki"
DOCS_WIKI_DIR="docs/wiki"

echo "🚀 Starting automated wiki update..."

# Check if we're in the right directory
if [ ! -d "docs/wiki" ]; then
    echo "❌ Error: Must run from repository root directory"
    echo "   Expected to find docs/wiki directory"
    exit 1
fi

# Clean up any existing temp directory
if [ -d "$WIKI_DIR" ]; then
    echo "🧹 Cleaning up existing temp directory..."
    rm -rf "$WIKI_DIR"
fi

# Clone the wiki repository
echo "📥 Cloning wiki repository..."
git clone "$REPO_URL" "$WIKI_DIR" || {
    echo "❌ Failed to clone wiki repository"
    echo "   Make sure the wiki is enabled at: https://github.com/caritos/tennis/settings"
    exit 1
}

cd "$WIKI_DIR"

# Configure git for the wiki repo
git config user.name "$(git -C .. config user.name)"
git config user.email "$(git -C .. config user.email)"

echo "📝 Generating and updating wiki pages..."

# Generate FAQ from shared data
echo "   → Generating FAQ from shared data"
cd ..
node scripts/generate-wiki-faq.js

# Generate legal documents from shared data
echo "   → Generating legal documents from shared data"
node scripts/generate-legal-docs.js
cd "$WIKI_DIR"

# Copy Home page
echo "   → Home page"
cp "../$DOCS_WIKI_DIR/Home.md" "Home.md"

# Copy Privacy Policy
echo "   → Privacy Policy"
cp "../$DOCS_WIKI_DIR/Privacy-Policy.md" "Privacy-Policy.md"

# Copy Terms of Service  
echo "   → Terms of Service"
cp "../$DOCS_WIKI_DIR/Terms-of-Service.md" "Terms-of-Service.md"

# Copy FAQ
echo "   → FAQ"
cp "../$DOCS_WIKI_DIR/FAQ.md" "FAQ.md"

# Check if there are any changes
if git diff --quiet && git diff --cached --quiet; then
    echo "✨ No changes detected - wiki is already up to date!"
    cd ..
    rm -rf "$WIKI_DIR"
    exit 0
fi

# Stage all changes
git add .

# Create commit message
COMMIT_MSG="docs: update wiki content from repository

Updated wiki pages with latest content from docs/wiki/:
- Home page (support information)
- Privacy Policy (generated from JSON data)
- Terms of Service (generated from JSON data)
- FAQ (generated from JSON data)

🤖 Generated with automated wiki update script

Co-Authored-By: Claude <noreply@anthropic.com>"

# Commit changes
echo "💾 Committing wiki changes..."
git commit -m "$COMMIT_MSG"

# Push changes
echo "⬆️  Pushing to GitHub wiki..."
git push origin master

echo "✅ Wiki update completed successfully!"
echo "📖 View updated wiki at: https://github.com/caritos/tennis/wiki"

# Clean up
cd ..
rm -rf "$WIKI_DIR"

echo "🧹 Cleanup completed"