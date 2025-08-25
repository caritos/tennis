#!/bin/bash

# Remove duplicate/outdated test versions
echo "Removing outdated test file versions..."
rm -f tests/unit/components/ClubCard.enhanced.test.tsx
rm -f tests/unit/components/ClubCard.updated.test.tsx
rm -f tests/unit/components/CreateClubButton.updated.test.tsx
rm -f tests/unit/services/clubService.updated.test.ts

# Remove tests for deprecated database module
echo "Removing tests for deprecated SQLite database..."
rm -f tests/unit/database.test.ts
rm -f tests/unit/utils/seedData.test.ts

# Remove tests that reference non-existent modules
echo "Removing tests for non-existent components..."
rm -f tests/unit/ClubTab.test.tsx
rm -f tests/unit/ProfileTab.test.tsx
rm -f tests/unit/components/ClubTab.test.tsx

# Count remaining test files
echo ""
echo "Test cleanup complete!"
echo "Remaining test files:"
find tests -name "*.test.*" -type f | wc -l
