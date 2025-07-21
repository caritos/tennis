import * as SQLite from 'expo-sqlite';

export interface Database extends SQLite.SQLiteDatabase {}

export async function initializeDatabase(): Promise<Database> {
  try {
    const db = await SQLite.openDatabaseAsync('tennis.db');
    
    // Enable foreign key constraints
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
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
        scores TEXT NOT NULL,
        match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs (id),
        FOREIGN KEY (player1_id) REFERENCES users (id),
        FOREIGN KEY (player2_id) REFERENCES users (id)
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

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Failed to create tables:', error);
    throw error;
  }
}

export async function dropTables(db: Database): Promise<void> {
  try {
    // Drop tables in reverse dependency order
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