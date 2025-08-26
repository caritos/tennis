/**
 * Simplified Challenge Notification Test
 * Uses the existing challengeService to test the actual flow
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.production' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test data from the logs
const TEST_USERS = {
  challenger: {
    id: 'c6d151b0-5690-4e69-b8f2-859e68b3d90b', // Eladio
    email: 'eladio@caritos.com',
    name: 'Eladio'
  },
  challenged: {
    id: 'd37dcae6-5e1c-4334-980a-154ef0debfb1', // Amelia
    email: 'amelia@example.com', // You'll need to provide Amelia's email
    name: 'Amelia'
  }
};

async function signIn(email, password = 'testpassword123') {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error(`❌ Failed to sign in as ${email}:`, error.message);
    return null;
  }
  
  console.log(`✅ Signed in as ${data.user.email}`);
  return data.user;
}

async function createChallenge(challengerId, challengedId, clubId) {
  console.log('📝 Creating challenge...');
  
  const challengeData = {
    club_id: clubId,
    challenger_id: challengerId,
    challenged_id: challengedId,
    match_type: 'singles',
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('challenges')
    .insert(challengeData)
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create challenge:', error);
    return null;
  }

  console.log('✅ Challenge created:', data.id);
  return data.id;
}

async function testNotificationCreation(challengeId, userId, targetUserId) {
  console.log(`📝 Testing notification creation for challenge ${challengeId}...`);
  
  const notification = {
    user_id: targetUserId,
    type: 'challenge',
    title: '🎾 Test Challenge Notification',
    message: 'This is a test notification',
    is_read: false,
    action_type: 'view_match',
    action_data: JSON.stringify({ challengeId }),
    related_id: challengeId,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select();

  if (error) {
    console.error('❌ Failed to create test notification:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }

  console.log('✅ Test notification created successfully');
  return true;
}

async function cleanup(challengeId) {
  console.log('🧹 Cleaning up...');
  
  // Delete test notifications
  await supabase
    .from('notifications')
    .delete()
    .eq('related_id', challengeId);
  
  // Delete test challenge
  await supabase
    .from('challenges')
    .delete()
    .eq('id', challengeId);
  
  console.log('✅ Cleanup complete');
}

async function runTest() {
  console.log('🚀 Starting simplified challenge notification test...');
  
  let challengeId = null;
  
  try {
    // Sign in as challenger (Eladio)
    const challenger = await signIn(TEST_USERS.challenger.email);
    if (!challenger) return;

    // Create a test challenge
    challengeId = await createChallenge(
      TEST_USERS.challenger.id,
      TEST_USERS.challenged.id,
      '50360198-ec81-4dd6-9c69-accf9792e1c0' // Test club ID
    );
    
    if (!challengeId) return;

    // Test 1: Can challenger create notification for themselves?
    console.log('\n🧪 Test 1: Challenger creating notification for self...');
    const selfNotificationSuccess = await testNotificationCreation(
      challengeId,
      TEST_USERS.challenger.id,
      TEST_USERS.challenger.id
    );

    // Test 2: Can challenger create notification for challenged user?
    console.log('\n🧪 Test 2: Challenger creating notification for challenged user...');
    const crossNotificationSuccess = await testNotificationCreation(
      challengeId,
      TEST_USERS.challenger.id,
      TEST_USERS.challenged.id
    );

    // Results
    console.log('\n📊 TEST RESULTS:');
    console.log(`  Self-notification: ${selfNotificationSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Cross-notification: ${crossNotificationSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (selfNotificationSuccess && crossNotificationSuccess) {
      console.log('\n🎉 ALL TESTS PASSED: RLS policy is working correctly!');
    } else if (selfNotificationSuccess && !crossNotificationSuccess) {
      console.log('\n⚠️  PARTIAL SUCCESS: Self-notifications work, but cross-notifications are blocked by RLS');
      console.log('🔍 This indicates the RLS policy needs to be fixed for challenge participants');
    } else {
      console.log('\n❌ TESTS FAILED: RLS policy is too restrictive');
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    if (challengeId) {
      await cleanup(challengeId);
    }
    // Sign out
    await supabase.auth.signOut();
  }
}

// Run the test
runTest().catch(console.error);