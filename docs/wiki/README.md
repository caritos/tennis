# GitHub Wiki Content

This directory contains the content for the Play Serve GitHub Wiki at https://github.com/caritos/tennis/wiki

## Wiki Pages

### Required Pages
1. **Home** - Main support page (`Home.md`)
2. **FAQ** - Frequently asked questions (`FAQ.md`)
3. **Privacy-Policy** - Privacy policy page (`Privacy-Policy.md`)
4. **Terms-of-Service** - Terms of service page (`Terms-of-Service.md`)

## Setup Instructions

### 1. Enable Wiki
1. Go to https://github.com/caritos/tennis/settings
2. Scroll to "Features" section
3. Check "Wikis" to enable the wiki feature

### 2. Create Wiki Pages
1. Go to https://github.com/caritos/tennis/wiki
2. Click "Create the first page"
3. Create these pages by copying content from this directory:

#### Home Page
- **Page Name**: `Home` (this becomes the wiki homepage)
- **Content**: Copy from `Home.md`

#### FAQ Page
- **Page Name**: `FAQ`
- **Content**: Copy from `FAQ.md`

#### Privacy Policy Page
- **Page Name**: `Privacy-Policy`
- **Content**: Copy from `Privacy-Policy.md`

#### Terms of Service Page
- **Page Name**: `Terms-of-Service`
- **Content**: Copy from `Terms-of-Service.md`

### 3. Wiki Navigation
The Home page contains navigation links to:
- FAQ → `FAQ` wiki page
- Privacy Policy → `Privacy-Policy` wiki page
- Terms of Service → `Terms-of-Service` wiki page

### 4. App Store URLs
Use these URLs in App Store Connect:
- **Support URL**: `https://github.com/caritos/tennis/wiki`
- **Privacy Policy URL**: `https://github.com/caritos/tennis/wiki/Privacy-Policy`
- **Terms of Service URL**: `https://github.com/caritos/tennis/wiki/Terms-of-Service`

## Content Management

### Source of Truth
- **All wiki content source**: Files in this `docs/wiki/` directory
- **Terms of Service source**: `docs/terms-of-service.md` (synced to wiki)

### Updating Content
1. **Wiki-only content** (Home, FAQ, Privacy Policy): Update files in `docs/wiki/`
2. **Terms of Service**: Update `docs/terms-of-service.md` (automatically copied to wiki)
3. Run automation to sync to GitHub wiki
4. Commit changes to keep the repository in sync

### Content Sync
- **Automated sync**: Wiki updates automatically when `docs/wiki/` files change
- **Terms of Service sync**: Updates to `docs/terms-of-service.md` trigger wiki update
- **Manual sync**: Run `npm run wiki:update` anytime

## Benefits

### User Experience
- **Consistent navigation** - All support content in wiki interface
- **Professional presentation** - Unified GitHub wiki styling
- **Easy maintenance** - Content managed in repository
- **Apple compliance** - Direct links to user-friendly support pages

### Developer Experience
- **Version controlled** - All content tracked in repository
- **Easy updates** - Edit files, then copy to wiki
- **Centralized management** - All documentation in docs directory

---

*This wiki content supports the Play Serve tennis community application.*