import * as SQLite from 'expo-sqlite';

export interface Database extends SQLite.SQLiteDatabase {}

export async function initializeDatabase(): Promise<Database> {
  try {
    const db = await SQLite.openDatabaseAsync('tennis.db');
    
    // Enable foreign key constraints
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Check if we need to migrate for doubles support
    await migrateDatabase(db);
    
    // Create tables
    await createTables(db);
    
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function createTables(db: Database): Promise<void> {
  try {
    // Users table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'player',
        contact_preference TEXT DEFAULT 'whatsapp' CHECK (contact_preference IN ('whatsapp', 'phone', 'text')),
        skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
        playing_style TEXT CHECK (playing_style IN ('aggressive', 'defensive', 'all_court', 'serve_volley')),
        availability TEXT, -- JSON string for availability preferences
        profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'clubs_only', 'private')),
        match_history_visibility TEXT DEFAULT 'public' CHECK (match_history_visibility IN ('public', 'clubs_only', 'private')),
        allow_challenges TEXT DEFAULT 'everyone' CHECK (allow_challenges IN ('everyone', 'club_members', 'none')),
        notification_preferences TEXT, -- JSON string for notification settings
        profile_photo_uri TEXT, -- Local file URI for profile photo
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clubs table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS clubs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        lat REAL,
        lng REAL,
        creator_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id)
      );
    `);

    // Matches table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        club_id TEXT NOT NULL,
        player1_id TEXT NOT NULL,
        player2_id TEXT,
        opponent2_name TEXT,
        player3_id TEXT,
        partner3_name TEXT,
        player4_id TEXT,
        partner4_name TEXT,
        scores TEXT NOT NULL,
        match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_edited_by TEXT,
        edit_count INTEGER DEFAULT 0,
        FOREIGN KEY (club_id) REFERENCES clubs (id),
        FOREIGN KEY (player1_id) REFERENCES users (id),
        FOREIGN KEY (player2_id) REFERENCES users (id),
        FOREIGN KEY (player3_id) REFERENCES users (id),
        FOREIGN KEY (player4_id) REFERENCES users (id),
        FOREIGN KEY (last_edited_by) REFERENCES users (id)
      );
    `);

    // Club members table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS club_members (
        club_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (club_id, user_id),
        FOREIGN KEY (club_id) REFERENCES clubs (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);

    // Match invitations table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS match_invitations (
        id TEXT PRIMARY KEY,
        club_id TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
        date TEXT NOT NULL,
        time TEXT,
        notes TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT,
        FOREIGN KEY (club_id) REFERENCES clubs (id),
        FOREIGN KEY (creator_id) REFERENCES users (id)
      );
    `);

    // Invitation responses table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS invitation_responses (
        id TEXT PRIMARY KEY,
        invitation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'declined')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invitation_id) REFERENCES match_invitations (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(invitation_id, user_id)
      );
    `);

    // Challenges table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        club_id TEXT NOT NULL,
        challenger_id TEXT NOT NULL,
        challenged_id TEXT NOT NULL,
        match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
        proposed_date TEXT,
        proposed_time TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'expired')),
        expires_at TEXT,
        contacts_shared BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs (id),
        FOREIGN KEY (challenger_id) REFERENCES users (id),
        FOREIGN KEY (challenged_id) REFERENCES users (id)
      );
    `);

    // Challenge counter-offers table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS challenge_counters (
        id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        counter_by TEXT NOT NULL,
        match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
        proposed_date TEXT,
        proposed_time TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (challenge_id) REFERENCES challenges (id) ON DELETE CASCADE,
        FOREIGN KEY (counter_by) REFERENCES users (id)
      );
    `);

    // Notifications table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('challenge', 'match_invitation', 'match_result', 'ranking_update', 'club_activity')),
        title TEXT NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT 0,
        action_type TEXT CHECK (action_type IN ('accept_challenge', 'decline_challenge', 'view_match', 'view_ranking', 'join_club')),
        action_data TEXT, -- JSON string for action parameters
        related_id TEXT, -- ID of related entity (challenge_id, match_id, etc.)
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Failed to create tables:', error);
    throw error;
  }
}

export async function migrateDatabase(db: Database): Promise<void> {
  try {
    // Check current schema version
    let currentVersion = 0;
    try {
      const versionResult = await db.getFirstAsync('PRAGMA user_version;') as { user_version: number };
      currentVersion = versionResult.user_version;
    } catch (error) {
      console.log('No version info found, treating as new database');
    }

    console.log('📋 Current database schema version:', currentVersion);
    const targetVersion = 3; // Current target version

    if (currentVersion < targetVersion) {
      console.log(`🔄 Migrating database from version ${currentVersion} to ${targetVersion}...`);
      
      // Apply migrations incrementally without data loss
      if (currentVersion < 1) {
        await migrateToVersion1(db);
      }
      if (currentVersion < 2) {
        await migrateToVersion2(db);
      }
      if (currentVersion < 3) {
        await migrateToVersion3(db);
      }

      // Update schema version
      await db.execAsync(`PRAGMA user_version = ${targetVersion};`);
      console.log('✅ Database migration completed');
    }
  } catch (error) {
    console.log('📋 Error during migration, creating fresh database schema:', error);
    // Only on critical errors should we recreate
  }
}

async function migrateToVersion1(db: Database): Promise<void> {
  console.log('🔄 Migrating to version 1: Adding doubles support to matches table');
  
  try {
    // Add doubles columns to matches table if they don't exist
    const matchesTableInfo = await db.getAllAsync('PRAGMA table_info(matches);');
    const hasDoublesColumns = matchesTableInfo.some((col: any) => col.name === 'player3_id');
    
    if (!hasDoublesColumns) {
      await db.execAsync(`
        ALTER TABLE matches ADD COLUMN player3_id TEXT REFERENCES users(id);
      `);
      await db.execAsync(`
        ALTER TABLE matches ADD COLUMN partner3_name TEXT;
      `);
      await db.execAsync(`
        ALTER TABLE matches ADD COLUMN player4_id TEXT REFERENCES users(id);
      `);
      await db.execAsync(`
        ALTER TABLE matches ADD COLUMN partner4_name TEXT;
      `);
      console.log('✅ Added doubles support columns to matches table');
    }
  } catch (error) {
    console.warn('Migration to version 1 failed:', error);
  }
}

async function migrateToVersion2(db: Database): Promise<void> {
  console.log('🔄 Migrating to version 2: Adding edit tracking to matches table');
  
  try {
    // Add edit tracking columns to matches table if they don't exist
    const matchesTableInfo = await db.getAllAsync('PRAGMA table_info(matches);');
    const hasEditColumns = matchesTableInfo.some((col: any) => col.name === 'updated_at');
    
    if (!hasEditColumns) {
      await db.execAsync(`
        ALTER TABLE matches ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
      `);
      await db.execAsync(`
        ALTER TABLE matches ADD COLUMN last_edited_by TEXT REFERENCES users(id);
      `);
      await db.execAsync(`
        ALTER TABLE matches ADD COLUMN edit_count INTEGER DEFAULT 0;
      `);
      console.log('✅ Added edit tracking columns to matches table');
    }
  } catch (error) {
    console.warn('Migration to version 2 failed:', error);
  }
}

async function migrateToVersion3(db: Database): Promise<void> {
  console.log('🔄 Migrating to version 3: Adding advanced profile fields to users table');
  
  try {
    // Add profile fields to users table if they don't exist
    const usersTableInfo = await db.getAllAsync('PRAGMA table_info(users);');
    const hasProfilePhotoField = usersTableInfo.some((col: any) => col.name === 'profile_photo_uri');
    const hasSkillLevelField = usersTableInfo.some((col: any) => col.name === 'skill_level');
    
    if (!hasProfilePhotoField) {
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro'));
      `);
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN playing_style TEXT CHECK (playing_style IN ('aggressive', 'defensive', 'all_court', 'serve_volley'));
      `);
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN availability TEXT;
      `);
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'clubs_only', 'private'));
      `);
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN match_history_visibility TEXT DEFAULT 'public' CHECK (match_history_visibility IN ('public', 'clubs_only', 'private'));
      `);
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN allow_challenges TEXT DEFAULT 'everyone' CHECK (allow_challenges IN ('everyone', 'club_members', 'none'));
      `);
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN notification_preferences TEXT;
      `);
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN profile_photo_uri TEXT;
      `);
      console.log('✅ Added advanced profile fields to users table');
    }
  } catch (error) {
    console.warn('Migration to version 3 failed:', error);
  }
}

export async function dropTables(db: Database): Promise<void> {
  try {
    // Drop tables in reverse dependency order
    await db.execAsync('DROP TABLE IF EXISTS notifications;');
    await db.execAsync('DROP TABLE IF EXISTS challenge_counters;');
    await db.execAsync('DROP TABLE IF EXISTS challenges;');
    await db.execAsync('DROP TABLE IF EXISTS invitation_responses;');
    await db.execAsync('DROP TABLE IF EXISTS match_invitations;');
    await db.execAsync('DROP TABLE IF EXISTS club_members;');
    await db.execAsync('DROP TABLE IF EXISTS matches;');
    await db.execAsync('DROP TABLE IF EXISTS clubs;');
    await db.execAsync('DROP TABLE IF EXISTS users;');
    
    console.log('Database tables dropped successfully');
  } catch (error) {
    console.error('Failed to drop tables:', error);
    throw error;
  }
}