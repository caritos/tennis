// Debug script to investigate the "Unknown" player name issue
const { initializeDatabase } = require('../database/database.ts');

async function debugRankings() {
  try {
    console.log('🔍 Debugging rankings data...');
    const db = await initializeDatabase();

    // 1. Check all users in the database
    console.log('\n--- USERS TABLE ---');
    const users = await db.getAllAsync('SELECT id, full_name, email FROM users');
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  ${user.id}: "${user.full_name}" (${user.email})`);
    });

    // 2. Check all matches and their players
    console.log('\n--- MATCHES TABLE ---');
    const matches = await db.getAllAsync('SELECT id, club_id, player1_id, player2_id, player3_id, player4_id FROM matches');
    console.log(`Found ${matches.length} matches:`);
    matches.forEach(match => {
      console.log(`  Match ${match.id}:`);
      console.log(`    Player1: ${match.player1_id}`);
      console.log(`    Player2: ${match.player2_id}`);
      console.log(`    Player3: ${match.player3_id}`);
      console.log(`    Player4: ${match.player4_id}`);
    });

    // 3. Check for orphaned player references
    console.log('\n--- ORPHANED REFERENCES ---');
    const allPlayerIds = new Set();
    matches.forEach(match => {
      if (match.player1_id) allPlayerIds.add(match.player1_id);
      if (match.player2_id) allPlayerIds.add(match.player2_id);
      if (match.player3_id) allPlayerIds.add(match.player3_id);
      if (match.player4_id) allPlayerIds.add(match.player4_id);
    });

    const userIds = new Set(users.map(u => u.id));
    
    console.log('Players referenced in matches:', allPlayerIds.size);
    console.log('Users in users table:', userIds.size);
    
    const orphanedIds = [...allPlayerIds].filter(id => !userIds.has(id));
    if (orphanedIds.length > 0) {
      console.log('🚨 ORPHANED PLAYER IDs (referenced in matches but not in users table):');
      orphanedIds.forEach(id => console.log(`  ${id}`));
    } else {
      console.log('✅ No orphaned player references found');
    }

    // 4. Check for users with missing/empty full_name
    console.log('\n--- USERS WITH MISSING NAMES ---');
    const usersWithoutNames = users.filter(user => !user.full_name || user.full_name.trim() === '');
    if (usersWithoutNames.length > 0) {
      console.log('🚨 USERS WITHOUT FULL NAMES:');
      usersWithoutNames.forEach(user => console.log(`  ${user.id}: "${user.full_name}" (${user.email})`));
    } else {
      console.log('✅ All users have full names');
    }

    // 5. Simulate the leaderboard query to see what happens
    console.log('\n--- SIMULATING LEADERBOARD QUERY ---');
    const playersWithMatches = await db.getAllAsync(`
      SELECT DISTINCT player_id FROM (
        SELECT player1_id as player_id FROM matches 
        WHERE player1_id IS NOT NULL
        UNION
        SELECT player2_id as player_id FROM matches 
        WHERE player2_id IS NOT NULL
      ) as all_players
    `);
    
    console.log(`Players with matches: ${playersWithMatches.length}`);
    
    for (const player of playersWithMatches) {
      const userInfo = await db.getFirstAsync(
        'SELECT full_name FROM users WHERE id = ?',
        [player.player_id]
      );
      
      const playerName = userInfo?.full_name || 'Unknown Player';
      console.log(`  ${player.player_id} -> "${playerName}"`);
      
      if (playerName === 'Unknown Player') {
        console.log(`    🚨 This player causes "Unknown" display!`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugRankings();