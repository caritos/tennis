const { execSync } = require('child_process');
const path = require('path');

// This script forces a database migration by resetting the version to 0
// This will trigger all migrations to run again

console.log('🔄 Forcing database migration...');

// Create a temporary React Native script that resets the database version
const script = `
import * as SQLite from 'expo-sqlite';

async function forceMigration() {
  try {
    console.log('📱 Opening database...');
    const db = await SQLite.openDatabaseAsync('tennis.db');
    
    // Check current version
    const currentVersion = await db.getFirstAsync('PRAGMA user_version;');
    console.log('📋 Current version:', currentVersion);
    
    // Reset version to force migration
    await db.execAsync('PRAGMA user_version = 0;');
    console.log('🔄 Reset database version to 0');
    
    // Now initialize database which will trigger migrations
    const { initializeDatabase } = require('../database/database');
    await initializeDatabase();
    
    // Check final version
    const finalVersion = await db.getFirstAsync('PRAGMA user_version;');
    console.log('✅ Final version:', finalVersion);
    
    // Check if location column exists
    const tableInfo = await db.getAllAsync('PRAGMA table_info(match_invitations);');
    const hasLocation = tableInfo.some(col => col.name === 'location');
    console.log('📍 Location column exists:', hasLocation);
    
    if (hasLocation) {
      console.log('✅ Migration successful!');
    } else {
      console.log('❌ Migration failed - location column not found');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

forceMigration();
`;

console.log('📝 Created migration script');
console.log('⚠️  You need to run this in your React Native app environment');
console.log('💡 Add this to a temporary component and run it once');