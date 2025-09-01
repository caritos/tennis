/**
 * Test Matches Table Realtime Specifically
 * This tests if realtime works for the matches table with club_id filters
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const isProd = process.argv.includes('--prod');
const envFile = isProd ? '.env.production' : '.env.development';
console.log(`🔧 Loading environment from: ${envFile}`);
require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎯 Testing Matches Table Realtime');
console.log('📡 Supabase URL:', supabaseUrl);

async function testMatchesRealtime() {
  console.log('\n1️⃣ Getting a test club ID...');
  
  // Get any club from the database
  const { data: clubs, error: clubError } = await supabase
    .from('clubs')
    .select('id, name')
    .limit(1);
  
  if (clubError || !clubs || clubs.length === 0) {
    console.error('❌ No clubs found. Please create a club first in your app.');
    return;
  }
  
  const testClub = clubs[0];
  console.log(`✅ Using club: ${testClub.name} (${testClub.id})`);
  
  console.log('\n2️⃣ Setting up THREE different subscriptions to test...');
  
  // Test 1: Global matches subscription (no filter)
  const globalChannel = supabase
    .channel('test_global_matches')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches'
      },
      (payload) => {
        console.log('🔔 GLOBAL subscription received event:', payload.eventType);
        console.log('   Match ID:', payload.new?.id);
        console.log('   Club ID:', payload.new?.club_id);
      }
    )
    .subscribe((status) => {
      console.log(`📡 GLOBAL subscription status: ${status}`);
    });
  
  // Test 2: Club-filtered subscription (like your app uses)
  const clubChannel = supabase
    .channel(`test_club_matches_${testClub.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `club_id=eq.${testClub.id}`
      },
      (payload) => {
        console.log('🔔 CLUB-FILTERED subscription received event:', payload.eventType);
        console.log('   Match ID:', payload.new?.id);
        console.log('   Club ID:', payload.new?.club_id);
      }
    )
    .subscribe((status) => {
      console.log(`📡 CLUB-FILTERED subscription status: ${status}`);
    });
  
  // Test 3: INSERT-only subscription
  const insertChannel = supabase
    .channel('test_insert_matches')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches'
      },
      (payload) => {
        console.log('🔔 INSERT-ONLY subscription received event');
        console.log('   Match ID:', payload.new?.id);
        console.log('   Club ID:', payload.new?.club_id);
      }
    )
    .subscribe((status) => {
      console.log(`📡 INSERT-ONLY subscription status: ${status}`);
    });
  
  // Wait for subscriptions to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n3️⃣ All subscriptions are set up. Listening for match changes...');
  console.log('   - GLOBAL: Should receive ALL match events');
  console.log(`   - CLUB-FILTERED: Should receive only club ${testClub.id} events`);
  console.log('   - INSERT-ONLY: Should receive only new matches');
  
  console.log('\n4️⃣ MANUAL TEST REQUIRED:');
  console.log('   1. Keep this script running');
  console.log('   2. In your app, record a match in the club:', testClub.name);
  console.log('   3. Watch this terminal for realtime events');
  console.log('   4. Press Ctrl+C to stop\n');
  
  // Keep the script running
  process.on('SIGINT', () => {
    console.log('\n🧹 Cleaning up subscriptions...');
    globalChannel.unsubscribe();
    clubChannel.unsubscribe();
    insertChannel.unsubscribe();
    process.exit(0);
  });
}

async function checkRLSPolicies() {
  console.log('\n5️⃣ Checking RLS policies for matches table...');
  
  try {
    // Try to query matches directly
    const { data, error } = await supabase
      .from('matches')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('⚠️ RLS might be blocking SELECT on matches:', error.message);
    } else {
      console.log('✅ Can SELECT from matches table');
    }
    
    // Check if we can see the RLS policies
    const { data: policies, error: policyError } = await supabase.rpc('get_policies', {
      table_name: 'matches'
    }).catch(() => null);
    
    if (policies) {
      console.log('📋 RLS policies on matches table:', policies);
    } else {
      console.log('ℹ️ Cannot query RLS policies (normal for most users)');
    }
    
  } catch (error) {
    console.log('ℹ️ RLS check completed');
  }
}

// Run the test
async function runTest() {
  await checkRLSPolicies();
  await testMatchesRealtime();
}

runTest().catch(console.error);