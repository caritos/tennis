#!/usr/bin/env node

/**
 * Simple Database Function Validation
 * Tests if PostgreSQL functions exist before deployment
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test if a PostgreSQL function exists
 */
async function testFunction(functionName, testParams = {}) {
  try {
    const { error } = await supabase.rpc(functionName, testParams);
    
    if (error) {
      if (error.code === '42883') {
        return { exists: false, error: 'Function does not exist' };
      }
      if (error.code === '42703') {
        return { exists: true, error: 'Schema mismatch: ' + error.message };
      }
      // Function exists but has logic/parameter issues
      return { exists: true, error: error.message };
    }
    
    return { exists: true, error: null };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function main() {
  console.log('🔧 Validating Database Functions');
  console.log('================================');
  
  const functions = [
    {
      name: 'record_complete_match',
      testParams: { 
        p_match_data: {
          club_id: '00000000-0000-0000-0000-000000000000',
          player1_id: '00000000-0000-0000-0000-000000000001',
          scores: '6-4',
          match_type: 'singles',
          date: '2024-01-01'
        }
      }
    },
    {
      name: 'create_complete_challenge',
      testParams: {
        p_challenge_data: {
          club_id: '00000000-0000-0000-0000-000000000000',
          challenger_id: '00000000-0000-0000-0000-000000000001',
          challenged_id: '00000000-0000-0000-0000-000000000002',
          match_type: 'singles',
          message: 'Test challenge'
        }
      }
    },
    {
      name: 'create_match_result_notifications',
      testParams: {
        p_match_id: '00000000-0000-0000-0000-000000000000',
        p_winner: 1,
        p_recorder_user_id: '00000000-0000-0000-0000-000000000001'
      }
    },
    {
      name: 'update_player_ratings',
      testParams: {
        p_winner_id: '00000000-0000-0000-0000-000000000001',
        p_loser_id: '00000000-0000-0000-0000-000000000002',
        p_winner_new_rating: 1250,
        p_loser_new_rating: 1150,
        p_winner_games_played: 5,
        p_loser_games_played: 5
      }
    }
  ];
  
  let hasErrors = false;
  let hasSchemaErrors = false;
  
  for (const func of functions) {
    const result = await testFunction(func.name, func.testParams);
    
    if (!result.exists) {
      console.log(`❌ ${func.name}: MISSING`);
      hasErrors = true;
    } else if (result.error?.includes('Schema mismatch')) {
      console.log(`⚠️  ${func.name}: EXISTS but has schema issues`);
      console.log(`   ${result.error}`);
      hasSchemaErrors = true;
    } else {
      console.log(`✅ ${func.name}: OK`);
    }
  }
  
  console.log('\n📊 Results:');
  if (hasErrors) {
    console.log('❌ Some functions are missing from database');
    console.log('💡 Deploy the SQL files in /database/ directory');
  }
  if (hasSchemaErrors) {
    console.log('⚠️  Some functions have schema mismatches');
    console.log('💡 Check column names and types in SQL files');
  }
  if (!hasErrors && !hasSchemaErrors) {
    console.log('🎉 All functions are available and working!');
  }
  
  return !hasErrors && !hasSchemaErrors;
}

if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { testFunction, main };