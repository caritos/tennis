import * as SQLite from 'expo-sqlite';

export interface Database extends SQLite.SQLiteDatabase {}

// Singleton to prevent concurrent database initialization
let databaseInstance: Database | null = null;
let initializationPromise: Promise<Database> | null = null;

export async function initializeDatabase(): Promise<Database> {
  // If we already have a database instance, return it
  if (databaseInstance) {
    return databaseInstance;
  }
  
  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    console.log('⏳ Database initialization already in progress, waiting...');
    return initializationPromise;
  }
  
  // Start initialization and store the promise
  initializationPromise = initializeDatabaseInternal();
  
  try {
    databaseInstance = await initializationPromise;
    return databaseInstance;
  } catch (error) {
    // Reset on error so we can try again
    initializationPromise = null;
    databaseInstance = null;
    throw error;
  }
}

async function initializeDatabaseInternal(): Promise<Database> {
  try {
    const db = await SQLite.openDatabaseAsync('tennis.db');
    
    // Temporarily disable foreign key constraints during initialization
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    
    // NOTE: Database reset functionality removed - now using Supabase directly
    // Legacy SQLite reset logic removed since migration is complete
    
    // Create tables with latest schema
    await createTables(db);
    
    // Only seed if database is empty
    const userCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM users');
    if (!userCount || userCount.count === 0) {
      await seedDatabase(db);
    } else {
      console.log(`ℹ️ Database already contains ${userCount.count} users, skipping seed data`);
    }
    
    // Re-enable foreign key constraints after initialization is complete
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    console.log('✅ Database initialized with latest schema and seed data');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  } finally {
    // Clear the initialization promise when done (success or failure)
    initializationPromise = null;
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
        location TEXT,
        notes TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
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
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
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

export async function seedDatabase(db: Database): Promise<void> {
  try {
    console.log('🌱 Production database ready - no sample data added');
    console.log('✅ Database is clean and ready for real users to create clubs and matches');
  } catch (error) {
    console.error('Failed to initialize clean database:', error);
    throw error;
  }
}

// Migration system disabled for development - we drop and recreate tables
// This will be needed for production when we need to preserve user data
