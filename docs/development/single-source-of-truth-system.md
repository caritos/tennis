# Single Source of Truth Documentation System

## Overview

This document describes the comprehensive single source of truth system implemented to manage FAQ, privacy policy, and terms of service content across the Play Serve tennis app, GitHub Wiki, and App Store submission requirements.

## Problem Solved

**App Store Rejection Issue**: Apple rejected the app because the support URL (GitHub issues page) wasn't user-friendly. This led to implementing a comprehensive documentation and support system.

**Content Duplication**: Previously, legal documents and FAQ content existed in multiple places with potential for inconsistency between the mobile app, documentation, and public-facing support materials.

## Architecture

### Data Sources (Single Source of Truth)
- `data/faq.json` - FAQ content with categories and questions
- `data/privacy-policy.json` - Privacy policy structured data
- `data/terms-of-service.json` - Terms of service structured data

### Generation Scripts
- `scripts/generate-wiki-faq.js` - Converts FAQ JSON to markdown
- `scripts/generate-legal-docs.js` - Converts legal document JSON to markdown and HTML

### Output Locations
```
FAQ:
├── app/faq.tsx (mobile app)
└── docs/wiki/FAQ.md (GitHub Wiki)

Privacy Policy:
├── docs/wiki/Privacy-Policy.md (GitHub Wiki)
└── docs/privacy-policy.html (App Store submission)

Terms of Service:
├── docs/wiki/Terms-of-Service.md (GitHub Wiki)
└── docs/terms-of-service.md (root documentation)
```

## Automated Workflow

### Wiki Automation (`scripts/update-wiki.sh`)
1. **Generate Content**: Runs generation scripts to create markdown from JSON
2. **Clone Wiki**: Downloads GitHub Wiki repository 
3. **Update Files**: Copies generated content to wiki
4. **Commit & Push**: Automatically updates GitHub Wiki

### NPM Scripts (package.json)
- `npm run wiki:generate-faq` - Generate FAQ from JSON data
- `npm run wiki:generate-legal` - Generate legal documents from JSON data  
- `npm run wiki:update` - Complete wiki synchronization process

## Key Features

### Contact Information Consistency
- **Company**: "Eladio Caritos" 
- **Support Email**: "support@caritos.com"
- **Support URL**: https://github.com/caritos/tennis/wiki

All generated documents automatically include consistent contact information.

### Multi-Format Output
- **Markdown**: For GitHub Wiki and documentation
- **HTML**: Styled for App Store privacy policy requirements
- **TypeScript**: For mobile app integration

### GitHub Actions Integration
- `.github/workflows/update-wiki.yml` - Automated wiki updates on data changes
- Triggers on changes to `data/*.json` files

## Usage

### Updating FAQ Content
1. Edit `data/faq.json`
2. Run `npm run wiki:update`
3. Changes propagate to both mobile app and GitHub Wiki

### Updating Legal Documents  
1. Edit `data/privacy-policy.json` or `data/terms-of-service.json`
2. Run `npm run wiki:update` 
3. Changes propagate to wiki, HTML for App Store, and sync files

### Manual Generation
```bash
# Generate FAQ only
npm run wiki:generate-faq

# Generate legal documents only  
npm run wiki:generate-legal

# Full wiki update (recommended)
npm run wiki:update
```

## File Structure

```
data/
├── faq.json                    # FAQ single source of truth
├── privacy-policy.json         # Privacy policy data
└── terms-of-service.json       # Terms of service data

scripts/
├── generate-wiki-faq.js        # FAQ markdown generator
├── generate-legal-docs.js      # Legal documents generator
└── update-wiki.sh              # Complete wiki automation

docs/
├── wiki/                       # GitHub Wiki content
│   ├── Home.md
│   ├── FAQ.md                  # Generated from JSON
│   ├── Privacy-Policy.md       # Generated from JSON  
│   └── Terms-of-Service.md     # Generated from JSON
├── privacy-policy.html         # App Store submission
└── terms-of-service.md         # Documentation sync

app/
└── faq.tsx                     # Mobile app using shared data
```

## Benefits

1. **Consistency**: Single source prevents content drift across platforms
2. **Efficiency**: One edit updates all locations automatically
3. **App Store Compliance**: User-friendly GitHub Wiki resolves support URL rejection
4. **Maintainability**: Structured JSON data is easier to manage than scattered markdown
5. **Automation**: Reduces manual work and human error in documentation updates

## Implementation Notes

### App Integration
The mobile app's FAQ component was updated to import from shared data:
```typescript
import { getLegacyFAQData, type LegacyFAQItem } from '@/data/faq';
const faqData: LegacyFAQItem[] = getLegacyFAQData();
```

### GitHub Wiki Setup
- Wiki must be enabled in repository settings
- Uses separate Git repository at `https://github.com/caritos/tennis.wiki.git`
- Automated updates require repository access

### Contact Information Updates
Fixed hardcoded emails throughout the app:
- `app/(tabs)/profile.tsx` - Support contact
- `app/community-guidelines.tsx` - Safety and general support
- `package.json` - App metadata

## Testing

The complete system was tested successfully:
- FAQ generation: 6 categories, 25 questions, 7KB content
- Legal documents: Privacy Policy (14 sections, 5KB), Terms of Service (15 sections, 5KB)
- Wiki automation: Successful commit and push to GitHub Wiki
- Email consistency: All documents contain `support@caritos.com`

## Future Enhancements

- **Localization**: Extend JSON structure to support multiple languages
- **Version Control**: Add effective dates and version tracking to legal documents
- **Content Validation**: Implement JSON schema validation for data files
- **Analytics**: Track wiki page views and user engagement

---

*This system ensures Play Serve maintains consistent, up-to-date documentation across all platforms while meeting App Store requirements for user-friendly support resources.*