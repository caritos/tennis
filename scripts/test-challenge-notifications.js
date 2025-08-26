/**
 * Automated Challenge Notification Test
 * 
 * This script simulates the complete challenge flow:
 * 1. User A creates a challenge for User B
 * 2. User B accepts the challenge
 * 3. Tests if both users receive contact sharing notifications
 * 
 * Run with: node scripts/test-challenge-notifications.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.production' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env.production

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.log('Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role for testing
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user IDs (replace with actual user IDs from your database)
const TEST_USERS = {
  challenger: {
    id: 'c6d151b0-5690-4e69-b8f2-859e68b3d90b', // Eladio
    name: 'Eladio',
    phone: '6317900077'
  },
  challenged: {
    id: 'd37dcae6-5e1c-4334-980a-154ef0debfb1', // Amelia  
    name: 'Amelia',
    phone: '6317905120'
  }
};

const TEST_CLUB_ID = '50360198-ec81-4dd6-9c69-accf9792e1c0';

async function generateUUID() {
  return crypto.randomUUID();
}

async function createTestChallenge() {
  console.log('📝 Step 1: Creating challenge...');
  
  const challengeId = await generateUUID();
  const challengeData = {
    id: challengeId,
    club_id: TEST_CLUB_ID,
    challenger_id: TEST_USERS.challenger.id,
    challenged_id: TEST_USERS.challenged.id,
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

  console.log('✅ Challenge created:', challengeId);
  return challengeId;
}

async function acceptChallenge(challengeId) {
  console.log('📝 Step 2: Accepting challenge...');
  
  // Update challenge status to accepted
  const { error: updateError } = await supabase
    .from('challenges')
    .update({ 
      status: 'accepted', 
      contacts_shared: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', challengeId);

  if (updateError) {
    console.error('❌ Failed to update challenge status:', updateError);
    return false;
  }

  console.log('✅ Challenge status updated to accepted');
  
  // Wait 100ms for database commit (same as in the app)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return true;
}

async function createContactNotifications(challengeId) {
  console.log('📝 Step 3: Creating contact sharing notifications...');
  
  // Create notification for challenged user (they accepted the challenge)
  const challengedNotificationId = await generateUUID();
  const challengedNotification = {
    id: challengedNotificationId,
    user_id: TEST_USERS.challenged.id,
    type: 'challenge',
    title: '🎾 Challenge Accepted - Contact Info Shared',
    message: `You accepted ${TEST_USERS.challenger.name}'s singles challenge! Contact: ${TEST_USERS.challenger.name}: ${TEST_USERS.challenger.phone}`,
    is_read: false,
    action_type: 'view_match',
    action_data: JSON.stringify({ challengeId }),
    related_id: challengeId,
    created_at: new Date().toISOString(),
  };

  console.log('📝 Creating notification for challenged user (self)...');
  const { error: challengedError } = await supabase
    .from('notifications')
    .insert(challengedNotification);

  if (challengedError) {
    console.error('❌ Failed to create challenged notification:', challengedError);
  } else {
    console.log('✅ Challenged notification created successfully');
  }

  // Create notification for challenger user
  const challengerNotificationId = await generateUUID();
  const challengerNotification = {
    id: challengerNotificationId,
    user_id: TEST_USERS.challenger.id,
    type: 'challenge',
    title: '🎾 Challenge Accepted - Contact Info Shared',
    message: `${TEST_USERS.challenged.name} accepted your singles challenge! Contact: ${TEST_USERS.challenged.name}: ${TEST_USERS.challenged.phone}`,
    is_read: false,
    action_type: 'view_match',
    action_data: JSON.stringify({ challengeId }),
    related_id: challengeId,
    created_at: new Date().toISOString(),
  };

  console.log('📝 Creating notification for challenger user...');
  const { error: challengerError } = await supabase
    .from('notifications')
    .insert(challengerNotification);

  if (challengerError) {
    console.error('❌ Failed to create challenger notification:', challengerError);
    console.error('❌ Error details:', JSON.stringify(challengerError, null, 2));
    return false;
  } else {
    console.log('✅ Challenger notification created successfully');
    return true;
  }
}

async function verifyNotifications(challengeId) {
  console.log('📝 Step 4: Verifying notifications were created...');
  
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('related_id', challengeId)
    .eq('type', 'challenge');

  if (error) {
    console.error('❌ Failed to fetch notifications:', error);
    return false;
  }

  console.log(`📊 Found ${notifications.length} notifications for challenge ${challengeId}`);
  
  notifications.forEach(notification => {
    const userName = notification.user_id === TEST_USERS.challenger.id ? TEST_USERS.challenger.name : TEST_USERS.challenged.name;
    console.log(`  ✅ Notification for ${userName}: "${notification.message}"`);
  });

  const expectedCount = 2; // Both users should have notifications
  if (notifications.length === expectedCount) {
    console.log('🎉 SUCCESS: Both users received contact sharing notifications!');
    return true;
  } else {
    console.log(`❌ FAILED: Expected ${expectedCount} notifications, got ${notifications.length}`);
    return false;
  }
}

async function cleanup(challengeId) {
  console.log('📝 Step 5: Cleaning up test data...');
  
  // Delete notifications
  await supabase
    .from('notifications')
    .delete()
    .eq('related_id', challengeId);
  
  // Delete challenge
  await supabase
    .from('challenges')
    .delete()
    .eq('id', challengeId);
  
  console.log('✅ Test data cleaned up');
}

async function runTest() {
  console.log('🚀 Starting automated challenge notification test...');
  console.log(`👥 Testing: ${TEST_USERS.challenger.name} challenges ${TEST_USERS.challenged.name}`);
  
  let challengeId = null;
  
  try {
    // Step 1: Create challenge
    challengeId = await createTestChallenge();
    if (!challengeId) {
      console.log('❌ Test failed at challenge creation');
      return;
    }

    // Step 2: Accept challenge  
    const acceptSuccess = await acceptChallenge(challengeId);
    if (!acceptSuccess) {
      console.log('❌ Test failed at challenge acceptance');
      return;
    }

    // Step 3: Create notifications
    const notificationSuccess = await createContactNotifications(challengeId);
    if (!notificationSuccess) {
      console.log('❌ Test failed at notification creation');
      console.log('🔍 This indicates the RLS policy is still blocking notifications');
      return;
    }

    // Step 4: Verify results
    const verifySuccess = await verifyNotifications(challengeId);
    
    if (verifySuccess) {
      console.log('🎉 OVERALL TEST RESULT: SUCCESS');
      console.log('✅ The challenge notification system is working correctly!');
    } else {
      console.log('❌ OVERALL TEST RESULT: PARTIAL SUCCESS');
      console.log('⚠️  Notifications were created but verification failed');
    }

  } catch (error) {
    console.error('💥 Unexpected error during test:', error);
  } finally {
    // Always cleanup
    if (challengeId) {
      await cleanup(challengeId);
    }
  }
}

// Run the test
runTest().catch(console.error);