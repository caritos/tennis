/**
 * Diagnose Realtime Subscription Issues
 * This script helps identify why realtime events aren't being received
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const isProd = process.argv.includes('--prod');
const envFile = isProd ? '.env.production' : '.env.development';
console.log(`🔧 Loading environment from: ${envFile}`);
require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔍 DIAGNOSING REALTIME SUBSCRIPTION ISSUES');
console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 Using Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// Create multiple clients to test different scenarios
const clients = {
  default: createClient(supabaseUrl, supabaseAnonKey),
  withOptions: createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
};

async function testBasicConnection() {
  console.log('\n1️⃣ Testing Basic Database Connection...');
  
  const { data, error } = await clients.default
    .from('clubs')
    .select('count')
    .single();
  
  if (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
  
  console.log('✅ Database connection successful');
  return true;
}

async function testRealtimeWebsocket() {
  console.log('\n2️⃣ Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    const channel = clients.default.channel('test_websocket');
    
    let timeoutId = setTimeout(() => {
      console.error('❌ WebSocket connection timed out after 5 seconds');
      channel.unsubscribe();
      resolve(false);
    }, 5000);
    
    channel
      .on('system', {}, (payload) => {
        console.log('📡 System event received:', payload);
      })
      .subscribe((status) => {
        console.log(`📡 WebSocket status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeoutId);
          console.log('✅ WebSocket connection successful');
          channel.unsubscribe();
          resolve(true);
        }
        
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeoutId);
          console.error('❌ WebSocket connection failed:', status);
          channel.unsubscribe();
          resolve(false);
        }
      });
  });
}

async function testTableSubscription(tableName) {
  console.log(`\n3️⃣ Testing ${tableName} Table Subscription...`);
  
  return new Promise((resolve) => {
    const channel = clients.default
      .channel(`test_${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log(`🔔 ${tableName} event received:`, payload.eventType);
        }
      );
    
    let subscribed = false;
    let timeoutId = setTimeout(() => {
      if (!subscribed) {
        console.error(`❌ ${tableName} subscription timed out`);
        channel.unsubscribe();
        resolve(false);
      }
    }, 5000);
    
    channel.subscribe((status) => {
      console.log(`📡 ${tableName} subscription status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        subscribed = true;
        clearTimeout(timeoutId);
        console.log(`✅ Successfully subscribed to ${tableName} table`);
        
        // Keep it open for a moment then clean up
        setTimeout(() => {
          channel.unsubscribe();
          resolve(true);
        }, 1000);
      }
      
      if (status === 'CHANNEL_ERROR') {
        clearTimeout(timeoutId);
        console.error(`❌ ${tableName} subscription error`);
        console.error('   This might mean:');
        console.error('   - Table does not exist');
        console.error('   - Realtime not enabled for this table');
        console.error('   - RLS policies blocking realtime');
        channel.unsubscribe();
        resolve(false);
      }
    });
  });
}

async function testFilteredSubscription() {
  console.log('\n4️⃣ Testing Filtered Subscription (with club_id filter)...');
  
  // First get a club ID
  const { data: clubs } = await clients.default
    .from('clubs')
    .select('id')
    .limit(1);
  
  if (!clubs || clubs.length === 0) {
    console.log('⚠️ No clubs found to test filtered subscription');
    return false;
  }
  
  const clubId = clubs[0].id;
  console.log(`   Using club_id: ${clubId}`);
  
  return new Promise((resolve) => {
    const channel = clients.default
      .channel(`test_filtered_matches`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `club_id=eq.${clubId}`
        },
        (payload) => {
          console.log('🔔 Filtered match event received:', payload.eventType);
        }
      );
    
    let timeoutId = setTimeout(() => {
      console.error('❌ Filtered subscription timed out');
      channel.unsubscribe();
      resolve(false);
    }, 5000);
    
    channel.subscribe((status) => {
      console.log(`📡 Filtered subscription status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeoutId);
        console.log('✅ Successfully subscribed with filter: club_id=eq.' + clubId);
        
        setTimeout(() => {
          channel.unsubscribe();
          resolve(true);
        }, 1000);
      }
      
      if (status === 'CHANNEL_ERROR') {
        clearTimeout(timeoutId);
        console.error('❌ Filtered subscription failed');
        channel.unsubscribe();
        resolve(false);
      }
    });
  });
}

async function testMultipleSubscriptions() {
  console.log('\n5️⃣ Testing Multiple Simultaneous Subscriptions...');
  
  const channels = [];
  const results = [];
  
  // Create 3 subscriptions at once
  for (let i = 0; i < 3; i++) {
    const channel = clients.default
      .channel(`test_multi_${i}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        (payload) => {
          console.log(`🔔 Channel ${i} received event`);
        }
      );
    
    channels.push(channel);
    
    const promise = new Promise((resolve) => {
      let timeoutId = setTimeout(() => {
        console.error(`❌ Channel ${i} timed out`);
        resolve(false);
      }, 5000);
      
      channel.subscribe((status) => {
        console.log(`📡 Channel ${i} status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeoutId);
          console.log(`✅ Channel ${i} subscribed`);
          resolve(true);
        }
        
        if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeoutId);
          console.error(`❌ Channel ${i} error`);
          resolve(false);
        }
      });
    });
    
    results.push(promise);
  }
  
  const allResults = await Promise.all(results);
  
  // Clean up
  channels.forEach(ch => ch.unsubscribe());
  
  const successCount = allResults.filter(r => r === true).length;
  console.log(`✅ ${successCount}/3 subscriptions successful`);
  
  return successCount === 3;
}

async function runDiagnostics() {
  console.log('\n🚀 Starting Realtime Diagnostics...\n');
  
  const results = {
    database: await testBasicConnection(),
    websocket: await testRealtimeWebsocket(),
    matchesTable: await testTableSubscription('matches'),
    usersTable: await testTableSubscription('users'),
    filtered: await testFilteredSubscription(),
    multiple: await testMultipleSubscriptions()
  };
  
  console.log('\n📊 DIAGNOSTIC RESULTS:');
  console.log('====================');
  console.log(`Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WebSocket Connection: ${results.websocket ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Matches Table Subscription: ${results.matchesTable ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Users Table Subscription: ${results.usersTable ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Filtered Subscription: ${results.filtered ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Multiple Subscriptions: ${results.multiple ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n🔍 DIAGNOSIS:');
  
  if (Object.values(results).every(r => r === true)) {
    console.log('✅ All tests passed! Realtime subscriptions are working correctly.');
    console.log('\n💡 If your app still doesn\'t receive events, check:');
    console.log('   1. Make sure subscriptions are established BEFORE creating matches');
    console.log('   2. Check that club_id filters match exactly');
    console.log('   3. Verify no duplicate channel names are used');
    console.log('   4. Check for JavaScript errors in your app console');
  } else {
    if (!results.database) {
      console.error('❌ Database connection failed - check your Supabase credentials');
    }
    if (!results.websocket) {
      console.error('❌ WebSocket connection failed - check network/firewall settings');
    }
    if (!results.matchesTable || !results.usersTable) {
      console.error('❌ Table subscriptions failed - realtime might not be properly enabled');
      console.error('   Run the enable-realtime.sql script in Supabase SQL Editor');
    }
    if (!results.filtered) {
      console.error('❌ Filtered subscriptions failed - check RLS policies');
    }
    if (!results.multiple) {
      console.error('❌ Multiple subscriptions failed - possible connection limit');
    }
  }
  
  console.log('\n🎯 Diagnostics complete!');
}

runDiagnostics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  });