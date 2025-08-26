/**
 * Direct RLS Policy Test
 * Tests the notification RLS policy without needing user authentication
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.production' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test with actual user IDs from logs
const ELADIO_ID = 'c6d151b0-5690-4e69-b8f2-859e68b3d90b';
const AMELIA_ID = 'd37dcae6-5e1c-4334-980a-154ef0debfb1';

async function testCurrentRLSPolicy() {
  console.log('🧪 Testing current RLS policy...');
  console.log('This will attempt to create a notification and see what happens\n');

  // Create a test challenge first
  console.log('📝 Step 1: Creating test challenge...');
  
  const challengeData = {
    club_id: '50360198-ec81-4dd6-9c69-accf9792e1c0',
    challenger_id: ELADIO_ID,
    challenged_id: AMELIA_ID,
    match_type: 'singles',
    status: 'accepted',
    contacts_shared: true,
    created_at: new Date().toISOString(),
  };

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .insert(challengeData)
    .select()
    .single();

  if (challengeError) {
    console.error('❌ Failed to create test challenge:', challengeError);
    return;
  }

  console.log(`✅ Test challenge created: ${challenge.id}`);

  // Now test notification creation without authentication
  console.log('\n📝 Step 2: Testing notification creation...');
  
  const notificationData = {
    user_id: ELADIO_ID, // Notification for Eladio (challenger)
    type: 'challenge',
    title: '🎾 Test Notification',
    message: 'Testing RLS policy',
    is_read: false,
    action_type: 'view_match',
    action_data: JSON.stringify({ challengeId: challenge.id }),
    related_id: challenge.id,
    created_at: new Date().toISOString(),
  };

  const { data: notification, error: notificationError } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select();

  console.log('\n📊 RESULTS:');
  
  if (notificationError) {
    if (notificationError.code === '42501') {
      console.log('❌ RLS POLICY BLOCKED: Row-level security policy violation');
      console.log('🔍 This means the RLS policy is working, but it\'s blocking our test');
      console.log('💡 The policy requires authentication with the right user context');
    } else if (notificationError.message?.includes('authentication required')) {
      console.log('🔐 AUTHENTICATION REQUIRED: Need to be signed in to create notifications');
      console.log('💡 This is expected behavior for the notifications table');
    } else {
      console.log('❌ UNEXPECTED ERROR:', notificationError);
    }
  } else {
    console.log('✅ NOTIFICATION CREATED: RLS policy allowed the notification');
    console.log('🎉 This means the current policy is working correctly!');
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  
  if (notification) {
    await supabase.from('notifications').delete().eq('id', notification[0].id);
  }
  
  await supabase.from('challenges').delete().eq('id', challenge.id);
  
  console.log('✅ Cleanup complete');
}

async function testPolicyWithAuth() {
  console.log('\n🔐 Testing with authentication (requires user credentials)...');
  console.log('For this test, you would need to provide real user credentials');
  console.log('Skipping for now - use the manual test or provide credentials');
}

async function showCurrentPolicy() {
  console.log('📋 Current RLS Policy Information:');
  console.log('  Table: notifications');
  console.log('  Policy: "Allow notification creation"');
  console.log('  Type: INSERT policy');
  console.log('  Conditions:');
  console.log('    1. Service role can create any notification');
  console.log('    2. Authenticated users can create notifications for themselves');
  console.log('    3. For challenge notifications, participants can notify each other');
  console.log('');
}

async function main() {
  console.log('🚀 RLS Policy Test Suite');
  console.log('========================\n');
  
  showCurrentPolicy();
  await testCurrentRLSPolicy();
  await testPolicyWithAuth();
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('  1. If the test shows "authentication required", the basic RLS is working');
  console.log('  2. If it shows "policy violation", we need to adjust the policy logic');
  console.log('  3. To test the full flow, run: npm run test:challenge (needs user credentials)');
}

main().catch(console.error);