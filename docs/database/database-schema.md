# Database Schema Documentation

This document provides comprehensive documentation for the Play Serve tennis community app database schema.

## Overview

Play Serve uses **Supabase PostgreSQL** as its primary and only database. The schema is designed around tennis communities (clubs) where players can record matches, track rankings, and connect with other players.

> **Architecture**: Supabase-only (no local SQLite database)  
> **Authentication**: Supabase Auth with Row Level Security (RLS)  
> **Real-time**: Supabase real-time subscriptions for live updates

## Schema Files

- **Production Schema**: `/database/production-setup-complete.sql` - Complete database setup
- **Documentation**: This file - Human-readable schema explanation

## Core Tables

### 1. Users (`users`)
**Primary user profiles and tennis statistics**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  elo_rating NUMERIC(8,2) DEFAULT 1200.00,
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- **ELO Rating System**: 1200 starting rating, dynamic based on match results
- **Match Statistics**: Total matches and wins tracked automatically
- **Role-based Access**: Players vs admins
- **Phone Privacy**: Only shared during active matches

### 2. Clubs (`clubs`)
**Tennis communities/facilities**

```sql
CREATE TABLE clubs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  lat NUMERIC(10,8) NOT NULL,
  lng NUMERIC(11,8) NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- **Geographic Search**: Lat/lng for location-based club discovery
- **Creator Tracking**: Club ownership and administration
- **Open Membership**: Any user can join any club

### 3. Club Members (`club_members`)
**Many-to-many relationship between users and clubs**

```sql
CREATE TABLE club_members (
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);
```

**Key Features:**
- **Multi-club Membership**: Users can join unlimited clubs
- **Automatic Cleanup**: Cascade deletes when clubs/users are removed

### 4. Match Invitations (`match_invitations`)
**"Looking to Play" feature for finding tennis partners**

```sql
CREATE TABLE match_invitations (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- **Match Discovery**: Public invitations visible to all club members
- **Flexible Scheduling**: Date/time/location coordination
- **Auto-expiration**: 7-day default expiration
- **Status Tracking**: Active → Matched → Completed flow

### 5. Invitation Responses (`invitation_responses`)
**Player responses to match invitations**

```sql
CREATE TABLE invitation_responses (
  id UUID PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES match_invitations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invitation_id, user_id)
);
```

**Key Features:**
- **One Response Per User**: Unique constraint prevents duplicate responses
- **Contact Sharing**: Phone numbers shared automatically when confirmed
- **Progressive Disclosure**: Interested → Confirmed flow

### 6. Matches (`matches`)
**Completed tennis match records**

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  opponent2_name TEXT, -- For unregistered opponents
  player3_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Doubles
  partner3_name TEXT, -- For unregistered doubles partners
  player4_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Doubles
  partner4_name TEXT, -- For unregistered doubles partners
  scores TEXT NOT NULL, -- Tennis score format: "6-4,6-3"
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  date DATE NOT NULL,
  notes TEXT,
  invitation_id UUID REFERENCES match_invitations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- **Mixed Player Types**: Registered users + unregistered opponents
- **Doubles Support**: 4-player matches with partner tracking
- **Tennis Scoring**: Validates proper tennis score format
- **ELO Impact**: Triggers automatic rating updates
- **Match Origin**: Links back to originating invitation

## Secondary Tables

### 7. Challenges (`challenges`)
**Direct player-to-player challenge system**

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  proposed_date DATE,
  proposed_time TIME,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. Notifications (`notifications`)
**In-app notification system**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('challenge', 'match_invitation', 'match_result', 'ranking_update', 'club_activity')),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  action_type TEXT CHECK (action_type IN ('accept_challenge', 'decline_challenge', 'view_match', 'view_ranking', 'join_club')),
  action_data JSONB,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);
```

### 9. Reports (`reports`)
**Player behavior reporting system**

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('no_show', 'poor_behavior', 'unsportsmanlike', 'other')),
  description TEXT NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  invitation_id UUID REFERENCES match_invitations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- **Match-based Reporting**: Reports tied to specific matches
- **Progressive Consequences**: 2 warnings → 7-day ban → permanent ban
- **Context Preservation**: Links to originating match/invitation

## Security Model (Row Level Security)

### Authentication Strategy
- **Supabase Auth**: Email/password + Apple Sign In
- **User Sync**: Automatic user creation in `users` table
- **Role-based Access**: Player vs admin permissions

### RLS Policies Summary

#### Users Table
- **View**: Users can view own profile + basic info of club members
- **Update**: Users can only update own profile (ELO protected by functions)

#### Clubs Table  
- **View**: Public (for club discovery)
- **Create**: Authenticated users only
- **Update/Delete**: Club creators only

#### Club Members Table
- **View**: Club members can see other club members
- **Join**: Any authenticated user can join any club
- **Leave**: Users can only leave clubs they've joined

#### Match Invitations Table
- **View**: Club members only
- **Create**: Club members only
- **Update/Delete**: Invitation creators only

#### Matches Table
- **View**: Club members can view club matches
- **Create**: Club members only (match participants)
- **Update/Delete**: Match participants only

#### Notifications Table
- **View/Update**: Users can only see/manage own notifications

## Business Logic

### ELO Rating System
- **Starting Rating**: 1200 points
- **Match Impact**: Based on opponent strength and score margin
- **Protected Updates**: Only via `update_player_ratings()` function
- **Doubles Scaling**: 50% impact compared to singles

### Contact Sharing
- **Privacy First**: Phone numbers only visible to confirmed match participants
- **Automatic**: Shared when match is confirmed via invitation responses
- **Temporary**: Limited to active match coordination

### Match Validation
- **Tennis Scoring**: Validates proper set scores (6-4, 7-6, etc.)
- **Required Data**: Scores, players, club membership
- **Winner Calculation**: Automatic from tennis scores

### Reporting System
- **Threshold-based**: 2 warnings → 7-day ban → permanent ban
- **Match Context**: All reports must be tied to specific matches
- **Appeal Process**: Manual review by admins

## Indexes and Performance

### Key Indexes
```sql
-- Geographic club discovery
CREATE INDEX idx_clubs_location ON clubs(lat, lng);

-- User match history
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_date ON matches(date);

-- Club activity
CREATE INDEX idx_match_invitations_club ON match_invitations(club_id);
CREATE INDEX idx_match_invitations_date ON match_invitations(date);

-- Real-time notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

## Data Flow Examples

### 1. Match Invitation Flow
```
User creates invitation → match_invitations
Other users respond → invitation_responses  
Contact sharing activated → Supabase notifications
Match played → matches (linked via invitation_id)
ELO ratings updated → users.elo_rating
```

### 2. Club Discovery Flow
```
User requests nearby clubs → clubs (lat/lng search)
User joins club → club_members
Club content becomes visible → All related tables via RLS
```

### 3. Reporting Flow
```
Match completed → matches
Issue occurs → reports (linked to match_id)
Threshold reached → User consequences via RLS/functions
```

## Migration Strategy

Since this is a Supabase-only architecture:
- **Schema Changes**: Applied via Supabase dashboard SQL editor
- **Data Migration**: Handled by Supabase's built-in migration system  
- **Rollbacks**: Manual via SQL (backup before major changes)
- **Environment Sync**: Manual promotion from dev → prod

## Development Guidelines

### Adding New Tables
1. Add to `production-setup-complete.sql`
2. Include RLS policies
3. Add appropriate indexes
4. Update this documentation
5. Test with sample data

### Modifying Existing Tables
1. Use `ALTER TABLE` statements
2. Consider existing data impact
3. Update RLS policies if needed
4. Update application TypeScript types
5. Test thoroughly in development

### Best Practices
- **Always enable RLS** on new tables
- **Use UUID primary keys** for all tables
- **Include timestamps** (`created_at`, `updated_at`)
- **Soft delete** when possible (status fields)
- **Validate constraints** at database level

---

*This schema supports the core tennis community features: club discovery, match coordination, ranking systems, and social interactions, all built on Supabase's real-time PostgreSQL platform.*