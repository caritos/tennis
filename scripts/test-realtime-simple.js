/**
 * Simple Realtime Test - No Data Creation Required
 * 
 * This script just tests if realtime subscriptions can be established
 * without needing to create test data.
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔗 Testing Supabase Realtime Connection');
console.log('📡 Supabase URL:', supabaseUrl);

function testRealtimeConnection() {
  return new Promise((resolve) => {
    console.log('\n📡 Testing realtime subscription...');
    
    let connectionActive = false;
    let subscriptionActive = false;
    
    const channel = supabase
      .channel('test_realtime_connection')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          console.log('🔔 *** REALTIME EVENT RECEIVED ***');
          console.log('   Event:', payload.eventType);
          console.log('   Table:', payload.table);
          console.log('✅ Realtime is WORKING!');
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          subscriptionActive = true;
          connectionActive = true;
          console.log('✅ Successfully subscribed to matches table');
          console.log('🎯 Realtime subscription is active and ready to receive events');
          
          // Clean up after a short delay
          setTimeout(() => {
            console.log('\n🧹 Cleaning up test subscription...');
            channel.unsubscribe();
            resolve({ success: true, status: 'SUBSCRIBED' });
          }, 2000);
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Subscription error');
          console.error('   This usually means realtime is not enabled for the matches table');
          resolve({ success: false, status: 'CHANNEL_ERROR' });
        }
        
        if (status === 'TIMED_OUT') {
          console.error('❌ Subscription timed out');
          console.error('   Check your network connection and firewall settings');
          resolve({ success: false, status: 'TIMED_OUT' });
        }
        
        if (status === 'CLOSED') {
          console.log('📡 Subscription closed');
          if (!connectionActive) {
            resolve({ success: false, status: 'CLOSED' });
          }
        }
      });
    
    // Timeout the test after 10 seconds
    setTimeout(() => {
      if (!subscriptionActive) {
        console.error('❌ Subscription failed to activate within 10 seconds');
        channel.unsubscribe();
        resolve({ success: false, status: 'TIMEOUT' });
      }
    }, 10000);
  });
}

async function runRealtimeTest() {
  console.log('\n🚀 Starting realtime connection test...');
  
  const result = await testRealtimeConnection();
  
  console.log('\n📊 TEST RESULTS:');
  
  if (result.success) {
    console.log('✅ Realtime subscriptions are WORKING correctly!');
    console.log('✅ Your app should receive match updates in real-time');
    console.log('\n💡 Next steps:');
    console.log('   1. Test recording a match in your app');
    console.log('   2. Watch the logs for "*** MATCH CHANGE DETECTED ***"');
    console.log('   3. Verify the match appears in the matches tab immediately');
  } else {
    console.log('❌ Realtime subscriptions are NOT working');
    console.log(`❌ Final status: ${result.status}`);
    console.log('\n🔧 To fix this:');
    console.log('   1. Run the enable-realtime.sql script in your Supabase SQL Editor');
    console.log('   2. Copy the script from: database/enable-realtime.sql');
    console.log('   3. Execute it in your Supabase dashboard SQL editor');
    console.log('   4. Run this test again to verify it works');
  }
  
  console.log('\n🎯 Test completed!');
}

runRealtimeTest()
  .then(() => {
    setTimeout(() => process.exit(0), 1000);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });