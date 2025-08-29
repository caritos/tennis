/**
 * Script to clean up orphaned invitation responses with undefined/null status
 * Run this in development environment only!
 * 
 * Usage: npx tsx scripts/cleanup-orphaned-responses.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupOrphanedResponses() {
  console.log('🧹 Starting cleanup of orphaned invitation responses...\n');

  try {
    // First, get all invitation responses
    const { data: allResponses, error: fetchError } = await supabase
      .from('invitation_responses')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching responses:', fetchError);
      return;
    }

    // Filter for orphaned responses (status is null, undefined, or not a valid value)
    const validStatuses = ['confirmed', 'interested', 'declined', 'maybe'];
    const orphanedResponses = allResponses?.filter(r => 
      !r.status || !validStatuses.includes(r.status)
    ) || [];

    console.log(`📊 Found ${orphanedResponses.length} orphaned responses with invalid status\n`);

    if (orphanedResponses.length === 0) {
      console.log('✅ No orphaned responses to clean up!');
      return;
    }

    // Show what we're about to delete
    console.log('📋 Orphaned responses to be deleted:');
    orphanedResponses.forEach(r => {
      console.log(`  - Response ID: ${r.id}`);
      console.log(`    Invitation: ${r.invitation_id}`);
      console.log(`    User: ${r.user_id}`);
      console.log(`    Status: ${r.status || 'NULL/undefined'}`);
      console.log(`    Created: ${r.created_at}\n`);
    });

    // Ask for confirmation
    console.log('⚠️  This will permanently delete these responses from the database.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete the orphaned responses
    const { error: deleteError } = await supabase
      .from('invitation_responses')
      .delete()
      .in('id', orphanedResponses.map(r => r.id));

    if (deleteError) {
      console.error('❌ Error deleting responses:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${orphanedResponses.length} orphaned responses!`);

    // Verify deletion
    const { data: remainingResponses, error: verifyError } = await supabase
      .from('invitation_responses')
      .select('*');

    if (!verifyError) {
      const remainingOrphaned = remainingResponses?.filter(r => 
        !r.status || !validStatuses.includes(r.status)
      ) || [];
      
      console.log(`\n📊 Verification: ${remainingOrphaned.length} orphaned responses remaining`);
      
      if (remainingOrphaned.length === 0) {
        console.log('✅ All orphaned responses have been successfully cleaned up!');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup
cleanupOrphanedResponses();