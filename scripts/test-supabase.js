const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing'); 
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Found' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log('\n📡 Test 1: Basic connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth connection error:', authError.message);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Session:', authData.session ? 'Active' : 'No active session');

    // Test 2: Check tables exist
    console.log('\n📋 Test 2: Checking required tables...');
    const tables = ['users', 'clubs', 'matches', 'club_members', 'match_invitations', 'invitation_responses', 'challenges', 'challenge_counters', 'notifications'];
    
    let tablesExist = 0;
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.error(`❌ Table '${table}' does not exist`);
          } else if (error.message.includes('permission denied')) {
            console.log(`✅ Table '${table}' exists (RLS active)`);
            tablesExist++;
          } else {
            console.error(`❌ Table '${table}' error:`, error.message);
          }
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
          tablesExist++;
        }
      } catch (err) {
        console.error(`❌ Table '${table}' error:`, err.message);
      }
    }

    console.log(`\n📊 Tables summary: ${tablesExist}/${tables.length} tables found`);

    // Test 3: Check RLS policies
    console.log('\n🔒 Test 3: Checking RLS policies...');
    try {
      const { error } = await supabase.from('users').select('*').limit(1);
      if (error && error.message.includes('permission denied')) {
        console.log('✅ RLS is active (permission denied expected without auth)');
      } else if (error) {
        console.error('❌ RLS check failed:', error.message);
      } else {
        console.log('⚠️  RLS might not be properly configured (no auth but query succeeded)');
      }
    } catch (err) {
      console.error('❌ RLS check error:', err.message);
    }

    console.log('\n🎉 Supabase connection test completed!');
    
    if (tablesExist < tables.length) {
      console.log('\n⚠️  Some tables are missing. You may need to run the setup SQL scripts.');
      return false;
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1);
});