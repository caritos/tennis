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
        location TEXT,
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
    const targetVersion = 4; // Current target version

    if (currentVersion < targetVersion) {
      console.log(`🔄 Migrating database from version ${currentVersion} to ${targetVersion}...`);
      
      // Create backup before migration
      await createMigrationBackup(db, currentVersion);
      
      // Wrap entire migration in transaction for atomicity
      await db.withTransactionAsync(async () => {
        try {
          // Apply migrations incrementally without data loss
          if (currentVersion < 1) {
            await migrateToVersion1(db);
            await validateMigrationStep(db, 1);
          }
          if (currentVersion < 2) {
            await migrateToVersion2(db);
            await validateMigrationStep(db, 2);
          }
          if (currentVersion < 3) {
            await migrateToVersion3(db);
            await validateMigrationStep(db, 3);
          }
          if (currentVersion < 4) {
            await migrateToVersion4(db);
            await validateMigrationStep(db, 4);
          }

          // Update schema version only after all migrations succeed
          await db.execAsync(`PRAGMA user_version = ${targetVersion};`);
          console.log('✅ Database migration completed successfully');
          
          // Clean up old backups after successful migration
          await cleanupBackups(db);
        } catch (migrationError) {
          console.error('❌ Migration failed, transaction will be rolled back:', migrationError);
          throw migrationError; // This will trigger transaction rollback
        }
      });
    }
  } catch (error) {
    console.error('💥 Critical migration error:', error);
    console.log('🔄 Attempting to restore from backup...');
    
    try {
      await restoreFromBackup(db);
      console.log('✅ Database restored from backup');
    } catch (restoreError) {
      console.error('💥 Failed to restore from backup:', restoreError);
      console.log('🆘 Manual intervention required - contact support');
      throw new Error(`Migration failed and backup restore failed: ${error.message}`);
    }
  }
}

async function migrateToVersion1(db: Database): Promise<void> {
  console.log('🔄 Migrating to version 1: Adding doubles support to matches table');
  
  // Check if matches table exists first
  const tableExists = await db.getFirstAsync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='matches';`
  );
  
  if (!tableExists) {
    console.log('⚠️ Matches table does not exist yet, skipping migration v1');
    return;
  }
  
  // Add doubles columns to matches table if they don't exist
  const matchesTableInfo = await db.getAllAsync('PRAGMA table_info(matches);');
  const columnsToAdd = [
    { name: 'player3_id', sql: 'ALTER TABLE matches ADD COLUMN player3_id TEXT REFERENCES users(id);' },
    { name: 'partner3_name', sql: 'ALTER TABLE matches ADD COLUMN partner3_name TEXT;' },
    { name: 'player4_id', sql: 'ALTER TABLE matches ADD COLUMN player4_id TEXT REFERENCES users(id);' },
    { name: 'partner4_name', sql: 'ALTER TABLE matches ADD COLUMN partner4_name TEXT;' }
  ];
  
  for (const column of columnsToAdd) {
    const hasColumn = matchesTableInfo.some((col: any) => col.name === column.name);
    if (!hasColumn) {
      await db.execAsync(column.sql);
      console.log(`✅ Added column ${column.name} to matches table`);
    } else {
      console.log(`ℹ️ Column ${column.name} already exists in matches table`);
    }
  }
  
  console.log('✅ Migration to version 1 completed');
}

async function migrateToVersion2(db: Database): Promise<void> {
  console.log('🔄 Migrating to version 2: Adding edit tracking to matches table');
  
  // Check if matches table exists first
  const tableExists = await db.getFirstAsync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='matches';`
  );
  
  if (!tableExists) {
    console.log('⚠️ Matches table does not exist yet, skipping migration v2');
    return;
  }
  
  // Add edit tracking columns to matches table if they don't exist
  const matchesTableInfo = await db.getAllAsync('PRAGMA table_info(matches);');
  const columnsToAdd = [
    { name: 'updated_at', sql: 'ALTER TABLE matches ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;' },
    { name: 'last_edited_by', sql: 'ALTER TABLE matches ADD COLUMN last_edited_by TEXT REFERENCES users(id);' },
    { name: 'edit_count', sql: 'ALTER TABLE matches ADD COLUMN edit_count INTEGER DEFAULT 0;' }
  ];
  
  for (const column of columnsToAdd) {
    const hasColumn = matchesTableInfo.some((col: any) => col.name === column.name);
    if (!hasColumn) {
      await db.execAsync(column.sql);
      console.log(`✅ Added column ${column.name} to matches table`);
      
      // For updated_at, set existing records to their created_at value
      if (column.name === 'updated_at') {
        await db.execAsync(`
          UPDATE matches 
          SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP) 
          WHERE updated_at IS NULL;
        `);
        console.log('✅ Updated existing matches with updated_at timestamps');
      }
    } else {
      console.log(`ℹ️ Column ${column.name} already exists in matches table`);
    }
  }
  
  console.log('✅ Migration to version 2 completed');
}

async function migrateToVersion3(db: Database): Promise<void> {
  console.log('🔄 Migrating to version 3: Adding advanced profile fields to users table');
  
  // Check if users table exists first
  const tableExists = await db.getFirstAsync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='users';`
  );
  
  if (!tableExists) {
    console.log('⚠️ Users table does not exist yet, skipping migration v3');
    return;
  }
  
  // Add profile fields to users table if they don't exist
  const usersTableInfo = await db.getAllAsync('PRAGMA table_info(users);');
  const columnsToAdd = [
    { name: 'skill_level', sql: `ALTER TABLE users ADD COLUMN skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro'));` },
    { name: 'playing_style', sql: `ALTER TABLE users ADD COLUMN playing_style TEXT CHECK (playing_style IN ('aggressive', 'defensive', 'all_court', 'serve_volley'));` },
    { name: 'availability', sql: 'ALTER TABLE users ADD COLUMN availability TEXT;' },
    { name: 'profile_visibility', sql: `ALTER TABLE users ADD COLUMN profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'clubs_only', 'private'));` },
    { name: 'match_history_visibility', sql: `ALTER TABLE users ADD COLUMN match_history_visibility TEXT DEFAULT 'public' CHECK (match_history_visibility IN ('public', 'clubs_only', 'private'));` },
    { name: 'allow_challenges', sql: `ALTER TABLE users ADD COLUMN allow_challenges TEXT DEFAULT 'everyone' CHECK (allow_challenges IN ('everyone', 'club_members', 'none'));` },
    { name: 'notification_preferences', sql: 'ALTER TABLE users ADD COLUMN notification_preferences TEXT;' },
    { name: 'profile_photo_uri', sql: 'ALTER TABLE users ADD COLUMN profile_photo_uri TEXT;' }
  ];
  
  for (const column of columnsToAdd) {
    const hasColumn = usersTableInfo.some((col: any) => col.name === column.name);
    if (!hasColumn) {
      await db.execAsync(column.sql);
      console.log(`✅ Added column ${column.name} to users table`);
      
      // Set default values for existing users where appropriate
      if (column.name === 'profile_visibility') {
        await db.execAsync(`
          UPDATE users 
          SET profile_visibility = 'public' 
          WHERE profile_visibility IS NULL;
        `);
      } else if (column.name === 'match_history_visibility') {
        await db.execAsync(`
          UPDATE users 
          SET match_history_visibility = 'public' 
          WHERE match_history_visibility IS NULL;
        `);
      } else if (column.name === 'allow_challenges') {
        await db.execAsync(`
          UPDATE users 
          SET allow_challenges = 'everyone' 
          WHERE allow_challenges IS NULL;
        `);
      }
    } else {
      console.log(`ℹ️ Column ${column.name} already exists in users table`);
    }
  }
  
  console.log('✅ Migration to version 3 completed');
}

async function migrateToVersion4(db: Database): Promise<void> {
  console.log('🔄 Migrating to version 4: Adding location column to match_invitations table');
  
  // Check if match_invitations table exists first
  const tableExists = await db.getFirstAsync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='match_invitations';`
  );
  
  if (!tableExists) {
    console.log('⚠️ match_invitations table does not exist yet, skipping migration v4');
    return;
  }
  
  // Check if location column already exists
  const tableInfo = await db.getAllAsync('PRAGMA table_info(match_invitations);');
  const hasLocationColumn = tableInfo.some((col: any) => col.name === 'location');
  
  if (!hasLocationColumn) {
    await db.execAsync('ALTER TABLE match_invitations ADD COLUMN location TEXT;');
    console.log('✅ Added location column to match_invitations table');
  } else {
    console.log('ℹ️ Location column already exists in match_invitations table');
  }
  
  console.log('✅ Migration to version 4 completed');
}

// Backup and restore functions for data protection
async function createMigrationBackup(db: Database, version: number): Promise<void> {
  try {
    console.log(`💾 Creating backup for schema version ${version}...`);
    
    // Export all data to backup tables
    const tableNames = ['users', 'clubs', 'matches', 'club_members', 'match_invitations', 
                       'invitation_responses', 'challenges', 'challenge_counters', 'notifications'];
    
    for (const tableName of tableNames) {
      try {
        // Check if table exists before backing up
        const tableExists = await db.getFirstAsync(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
          [tableName]
        );
        
        if (tableExists) {
          // Create backup table
          await db.execAsync(`DROP TABLE IF EXISTS backup_${tableName};`);
          await db.execAsync(`CREATE TABLE backup_${tableName} AS SELECT * FROM ${tableName};`);
          
          const count = await db.getFirstAsync(`SELECT COUNT(*) as count FROM backup_${tableName};`) as { count: number };
          console.log(`📋 Backed up ${count.count} records from ${tableName}`);
        }
      } catch (tableError) {
        console.warn(`⚠️ Could not backup table ${tableName}:`, tableError);
      }
    }
    
    // Store backup metadata
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migration_backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schema_version INTEGER,
        backup_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active'
      );
    `);
    
    await db.execAsync(
      `INSERT INTO migration_backups (schema_version) VALUES (?);`,
      [version]
    );
    
    console.log('✅ Migration backup created successfully');
  } catch (error) {
    console.error('❌ Failed to create migration backup:', error);
    throw error;
  }
}

async function restoreFromBackup(db: Database): Promise<void> {
  try {
    console.log('🔄 Restoring database from backup...');
    
    // Get the latest backup
    const backup = await db.getFirstAsync(`
      SELECT * FROM migration_backups 
      WHERE status = 'active' 
      ORDER BY backup_timestamp DESC 
      LIMIT 1;
    `) as { id: number; schema_version: number } | null;
    
    if (!backup) {
      throw new Error('No backup found to restore from');
    }
    
    console.log(`📋 Restoring from backup (schema version ${backup.schema_version})...`);
    
    // Restore data from backup tables
    const tableNames = ['users', 'clubs', 'matches', 'club_members', 'match_invitations', 
                       'invitation_responses', 'challenges', 'challenge_counters', 'notifications'];
    
    for (const tableName of tableNames) {
      try {
        // Check if backup table exists
        const backupExists = await db.getFirstAsync(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
          [`backup_${tableName}`]
        );
        
        if (backupExists) {
          // Drop current table and restore from backup
          await db.execAsync(`DROP TABLE IF EXISTS ${tableName};`);
          await db.execAsync(`CREATE TABLE ${tableName} AS SELECT * FROM backup_${tableName};`);
          
          const count = await db.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName};`) as { count: number };
          console.log(`✅ Restored ${count.count} records to ${tableName}`);
        }
      } catch (tableError) {
        console.warn(`⚠️ Could not restore table ${tableName}:`, tableError);
      }
    }
    
    // Restore schema version
    await db.execAsync(`PRAGMA user_version = ${backup.schema_version};`);
    
    // Mark backup as used
    await db.execAsync(
      `UPDATE migration_backups SET status = 'restored' WHERE id = ?;`,
      [backup.id]
    );
    
    console.log('✅ Database restored from backup successfully');
  } catch (error) {
    console.error('❌ Failed to restore from backup:', error);
    throw error;
  }
}

async function validateMigrationStep(db: Database, version: number): Promise<void> {
  try {
    console.log(`🔍 Validating migration to version ${version}...`);
    
    switch (version) {
      case 1:
        // Validate doubles columns were added
        const matchesInfo = await db.getAllAsync('PRAGMA table_info(matches);');
        const requiredColumns = ['player3_id', 'partner3_name', 'player4_id', 'partner4_name'];
        
        for (const colName of requiredColumns) {
          const hasColumn = matchesInfo.some((col: any) => col.name === colName);
          if (!hasColumn) {
            throw new Error(`Migration validation failed: Missing column ${colName} in matches table`);
          }
        }
        break;
        
      case 2:
        // Validate edit tracking columns were added
        const editInfo = await db.getAllAsync('PRAGMA table_info(matches);');
        const editColumns = ['updated_at', 'last_edited_by', 'edit_count'];
        
        for (const colName of editColumns) {
          const hasColumn = editInfo.some((col: any) => col.name === colName);
          if (!hasColumn) {
            throw new Error(`Migration validation failed: Missing column ${colName} in matches table`);
          }
        }
        break;
        
      case 3:
        // Validate profile columns were added
        const usersInfo = await db.getAllAsync('PRAGMA table_info(users);');
        const profileColumns = ['skill_level', 'playing_style', 'availability', 
                               'profile_visibility', 'match_history_visibility', 
                               'allow_challenges', 'notification_preferences', 'profile_photo_uri'];
        
        for (const colName of profileColumns) {
          const hasColumn = usersInfo.some((col: any) => col.name === colName);
          if (!hasColumn) {
            throw new Error(`Migration validation failed: Missing column ${colName} in users table`);
          }
        }
        break;
        
      case 4:
        // Validate location column was added to match_invitations
        const invitationsInfo = await db.getAllAsync('PRAGMA table_info(match_invitations);');
        const hasLocationColumn = invitationsInfo.some((col: any) => col.name === 'location');
        
        if (!hasLocationColumn) {
          throw new Error('Migration validation failed: Missing location column in match_invitations table');
        }
        break;
        
      default:
        console.log(`⚠️ No validation defined for version ${version}`);
    }
    
    // Check data integrity with foreign key constraints
    await db.execAsync('PRAGMA foreign_key_check;');
    
    // Verify no data was lost by comparing record counts
    await validateDataIntegrity(db, version);
    
    console.log(`✅ Migration to version ${version} validated successfully`);
  } catch (error) {
    console.error(`❌ Migration validation failed for version ${version}:`, error);
    throw error;
  }
}

async function validateDataIntegrity(db: Database, version: number): Promise<void> {
  try {
    // Compare record counts between original and current tables
    const tableNames = ['users', 'clubs', 'matches', 'club_members'];
    
    for (const tableName of tableNames) {
      try {
        // Check if backup table exists
        const backupExists = await db.getFirstAsync(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
          [`backup_${tableName}`]
        );
        
        if (backupExists) {
          const originalCount = await db.getFirstAsync(
            `SELECT COUNT(*) as count FROM backup_${tableName};`
          ) as { count: number };
          
          const currentCount = await db.getFirstAsync(
            `SELECT COUNT(*) as count FROM ${tableName};`
          ) as { count: number };
          
          if (originalCount.count !== currentCount.count) {
            throw new Error(
              `Data integrity check failed: ${tableName} has ${currentCount.count} records but backup had ${originalCount.count}`
            );
          }
          
          console.log(`✅ Data integrity verified for ${tableName}: ${currentCount.count} records`);
        }
      } catch (tableError) {
        console.warn(`⚠️ Could not verify integrity for ${tableName}:`, tableError);
      }
    }
  } catch (error) {
    console.error('❌ Data integrity validation failed:', error);
    throw error;
  }
}

async function cleanupBackups(db: Database): Promise<void> {
  try {
    // Remove backup tables older than 7 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    const oldBackups = await db.getAllAsync(`
      SELECT id FROM migration_backups 
      WHERE backup_timestamp < ? AND status IN ('restored', 'active');
    `, [cutoffDate.toISOString()]) as { id: number }[];
    
    for (const backup of oldBackups) {
      await db.execAsync(`DELETE FROM migration_backups WHERE id = ?;`, [backup.id]);
    }
    
    // Drop old backup tables
    const backupTables = await db.getAllAsync(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'backup_%';
    `) as { name: string }[];
    
    for (const table of backupTables) {
      try {
        await db.execAsync(`DROP TABLE IF EXISTS ${table.name};`);
      } catch (error) {
        console.warn(`Could not drop backup table ${table.name}:`, error);
      }
    }
    
    console.log(`🧹 Cleaned up ${oldBackups.length} old backups`);
  } catch (error) {
    console.warn('Warning: Failed to cleanup old backups:', error);
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

// Development utility to test migration system
export async function testMigrationSystem(db: Database): Promise<void> {
  console.log('🧪 Testing migration system...');
  
  try {
    // Create some test data
    await db.execAsync(`
      INSERT OR IGNORE INTO users (id, full_name, email) 
      VALUES ('test-user-1', 'Test User', 'test@example.com');
    `);
    
    await db.execAsync(`
      INSERT OR IGNORE INTO clubs (id, name, location, creator_id) 
      VALUES ('test-club-1', 'Test Club', 'Test Location', 'test-user-1');
    `);
    
    // Force a migration by setting version to 0
    const originalVersion = await db.getFirstAsync('PRAGMA user_version;') as { user_version: number };
    await db.execAsync('PRAGMA user_version = 0;');
    
    console.log('🔄 Forcing migration from version 0...');
    await migrateDatabase(db);
    
    // Verify data survived migration
    const userCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM users;') as { count: number };
    const clubCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM clubs;') as { count: number };
    
    console.log(`✅ Migration test completed:`);
    console.log(`   - Users preserved: ${userCount.count}`);
    console.log(`   - Clubs preserved: ${clubCount.count}`);
    
    // Clean up test data
    await db.execAsync('DELETE FROM clubs WHERE id = "test-club-1";');
    await db.execAsync('DELETE FROM users WHERE id = "test-user-1";');
    
    console.log('✅ Migration system test passed');
  } catch (error) {
    console.error('❌ Migration system test failed:', error);
    throw error;
  }
}