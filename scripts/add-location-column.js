// Simple script to manually add the location column to match_invitations table
console.log('This script needs to be run in your app environment to add the location column.');
console.log('');
console.log('Add this code to a temporary component in your app and run it once:');
console.log('');
console.log(`
import * as SQLite from 'expo-sqlite';

const addLocationColumn = async () => {
  try {
    const db = await SQLite.openDatabaseAsync('tennis.db');
    
    // Check if column exists
    const tableInfo = await db.getAllAsync('PRAGMA table_info(match_invitations);');
    const hasLocation = tableInfo.some(col => col.name === 'location');
    
    if (!hasLocation) {
      await db.execAsync('ALTER TABLE match_invitations ADD COLUMN location TEXT;');
      console.log('✅ Added location column to match_invitations table');
    } else {
      console.log('ℹ️ Location column already exists');
    }
    
    // Verify
    const newTableInfo = await db.getAllAsync('PRAGMA table_info(match_invitations);');
    console.log('📋 Table columns:', newTableInfo.map(col => col.name));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Call the function
addLocationColumn();
`);
console.log('');
console.log('Or delete the database file and let it recreate with the new schema:');
console.log('- Close the app completely');
console.log('- Delete the app from simulator/device');  
console.log('- Reinstall and run the app');