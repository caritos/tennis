/**
 * Test Realtime Subscriptions
 * 
 * This script tests if Supabase realtime subscriptions are working properly.
 * Run this to debug realtime issues.
 * 
 * Usage: node scripts/test-realtime-subscriptions.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables - check for production flag
const isProd = process.argv.includes('--prod');
const envFile = isProd ? '.env.production' : '.env.development';
console.log(`🔧 Loading environment from: ${envFile}`);
require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Make sure .env.development has EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔗 Testing Supabase Realtime Subscriptions');
console.log('📡 Supabase URL:', supabaseUrl);

async function testRealtimeSubscriptions() {
  console.log('\n1️⃣ Testing basic connection...');
  
  // Test basic database connection
  try {
    const { data, error } = await supabase
      .from('clubs')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    if (data && data.length > 0) {
      console.log('🏟️ Test club found:', data[0].name, `(${data[0].id})`);
      
      // Test realtime subscription for this club
      await testMatchesSubscription(data[0].id);
    } else {
      console.log('⚠️ No clubs found in database');
      console.log('🔧 Creating temporary test club for realtime testing...');
      
      // Create a temporary test club
      const testClub = await createTestClub();
      if (testClub) {
        await testMatchesSubscription(testClub.id);
        // Clean up the test club
        await cleanupTestClub(testClub.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

function testMatchesSubscription(clubId) {
  return new Promise((resolve) => {
    console.log(`\n2️⃣ Testing realtime subscription for club ${clubId}...`);
    
    let subscriptionActive = false;
    
    const channel = supabase
      .channel(`test_matches_${clubId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `club_id=eq.${clubId}`
        },
        (payload) => {
          console.log('🔔 *** REALTIME EVENT RECEIVED ***');
          console.log('   Event type:', payload.eventType);
          console.log('   Table:', payload.table);
          console.log('   New data:', payload.new);
          console.log('   Old data:', payload.old);
          console.log('✅ Realtime is working correctly!');
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          subscriptionActive = true;
          console.log('✅ Successfully subscribed to matches table');
          console.log('\n🎯 Now testing realtime by creating a test match...');
          
          // Wait a moment then create a test match
          setTimeout(async () => {
            await createTestMatch(clubId);
            
            // Wait for realtime event, then cleanup
            setTimeout(() => {
              console.log('\n🧹 Cleaning up test subscription...');
              channel.unsubscribe();
              resolve();
            }, 3000);
          }, 1000);
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Subscription error - realtime might not be enabled for matches table');
          resolve();
        }
        
        if (status === 'TIMED_OUT') {
          console.error('❌ Subscription timed out - check your network connection');
          resolve();
        }
        
        if (status === 'CLOSED') {
          console.log('📡 Subscription closed');
          resolve();
        }
      });
    
    // Timeout the test after 10 seconds
    setTimeout(() => {
      if (!subscriptionActive) {
        console.error('❌ Subscription failed to activate within 10 seconds');
        channel.unsubscribe();
        resolve();
      }
    }, 10000);
  });
}

async function createTestClub() {
  console.log('🏟️ Creating temporary test club...');
  
  try {
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name: 'REALTIME TEST CLUB (DELETE ME)',
        description: 'Temporary club for testing realtime subscriptions',
        location: 'Test Location',
        lat: 40.7128,
        lng: -74.0060,
        creator_id: '00000000-0000-0000-0000-000000000001' // Fake UUID
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create test club:', error.message);
      return null;
    }
    
    console.log('✅ Test club created:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Test club creation failed:', error.message);
    return null;
  }
}

async function cleanupTestClub(clubId) {
  console.log('🧹 Cleaning up test club...');
  
  try {
    await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId);
    console.log('✅ Test club cleaned up');
  } catch (error) {
    console.error('⚠️ Failed to cleanup test club:', error.message);
  }
}

async function createTestMatch(clubId) {
  console.log('🧪 Creating test match to trigger realtime event...');
  
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        club_id: clubId,
        player1_id: '00000000-0000-0000-0000-000000000001', // Fake UUID for testing
        scores: '6-4,6-2',
        match_type: 'singles',
        date: new Date().toISOString().split('T')[0],
        opponent2_name: 'Test Opponent (DELETE ME)',
        notes: 'Test match - DELETE ME'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create test match:', error.message);
      console.log('   This could be due to RLS policies or foreign key constraints');
      console.log('   Error details:', error);
    } else {
      console.log('✅ Test match created:', data.id);
      console.log('   Waiting for realtime event...');
      
      // Clean up the test match after a delay
      setTimeout(async () => {
        await supabase
          .from('matches')
          .delete()
          .eq('id', data.id);
        console.log('🧹 Test match cleaned up');
      }, 5000);
    }
  } catch (error) {
    console.error('❌ Test match creation failed:', error.message);
  }
}

async function checkRealtimePublications() {
  console.log('\n3️⃣ Checking realtime publications...');
  
  try {
    // Try to query the publications table directly
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public'
        ORDER BY tablename;
      `
    });
    
    if (error) {
      console.log('⚠️ Could not check publications via RPC:', error.message);
      console.log('💡 This is normal - realtime publication checking requires specific permissions');
      console.log('💡 We\'ll test realtime functionality directly instead');
      return;
    }
    
    const realtimeTables = data || [];
    
    console.log('📋 Tables enabled for realtime:', realtimeTables.map(r => r.tablename));
    
    const requiredTables = ['matches', 'users', 'clubs', 'club_members'];
    const enabledTables = realtimeTables.map(r => r.tablename);
    const missingTables = requiredTables.filter(table => !enabledTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error('❌ These tables might need realtime enabled:', missingTables);
      console.log('💡 Run the enable-realtime.sql script in Supabase SQL Editor to fix this');
    } else {
      console.log('✅ All required tables appear to have realtime enabled');
    }
    
  } catch (error) {
    console.log('⚠️ Could not check realtime publications (normal for most setups)');
    console.log('💡 Testing realtime functionality directly...');
  }
}

// Run the tests
async function runAllTests() {
  try {
    await checkRealtimePublications();
    await testRealtimeSubscriptions();
    
    console.log('\n🎯 Realtime test completed!');
    console.log('\n💡 If realtime events are not working:');
    console.log('   1. Run the enable-realtime.sql script in your Supabase SQL editor');
    console.log('   2. Check that your RLS policies allow the operations');
    console.log('   3. Verify your network connection allows websockets');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
  
  // Exit the process
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

runAllTests();