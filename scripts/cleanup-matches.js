#!/usr/bin/env node

/**
 * Script to clean up all matches from the database for testing purposes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanupMatches() {
  try {
    console.log('🧹 Starting match cleanup...');
    
    // First, delete all invitation responses
    console.log('📝 Deleting all invitation responses...');
    const { error: responsesError } = await supabase
      .from('invitation_responses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (responsesError) {
      console.error('❌ Error deleting invitation responses:', responsesError);
    } else {
      console.log('✅ Invitation responses deleted');
    }
    
    // Then delete all match invitations
    console.log('🎾 Deleting all match invitations...');
    const { error: invitationsError } = await supabase
      .from('match_invitations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (invitationsError) {
      console.error('❌ Error deleting match invitations:', invitationsError);
    } else {
      console.log('✅ Match invitations deleted');
    }
    
    // Finally, delete all regular matches
    console.log('🏆 Deleting all matches...');
    const { error: matchesError } = await supabase
      .from('matches')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (matchesError) {
      console.error('❌ Error deleting matches:', matchesError);
    } else {
      console.log('✅ Matches deleted');
    }
    
    // Clean up notifications related to matches
    console.log('🔔 Deleting match-related notifications...');
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .or('type.eq.match_invitation,action_type.eq.view_match');
    
    if (notificationsError) {
      console.error('❌ Error deleting notifications:', notificationsError);
    } else {
      console.log('✅ Match notifications deleted');
    }
    
    console.log('🎉 Database cleanup completed successfully!');
    console.log('📊 You can now create a fresh match invitation for testing.');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupMatches();