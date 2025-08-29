/**
 * Script to check invitation responses and their status values
 * 
 * Usage: npx tsx scripts/check-responses.ts
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

async function checkResponses() {
  console.log('🔍 Checking invitation responses...\n');

  try {
    // Get specific invitations we saw in the logs
    const invitationIds = [
      'a89b7477-bd17-4d60-9517-b90ed4db24dc', // Nina's invitation
      'cb7e08f7-57b0-4e19-bcbd-7e197d3e172a', // Another Nina invitation
      '0a9f5cbe-1adc-4023-b494-a33b8ee181b2', // Eladio's invitation
    ];

    for (const invId of invitationIds) {
      console.log(`\n📋 Invitation ID: ${invId}`);
      
      const { data: responses, error } = await supabase
        .from('invitation_responses')
        .select('*')
        .eq('invitation_id', invId);

      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
        continue;
      }

      if (!responses || responses.length === 0) {
        console.log('  No responses found');
        continue;
      }

      responses.forEach(r => {
        console.log(`  Response ID: ${r.id}`);
        console.log(`    User ID: ${r.user_id}`);
        console.log(`    Status: ${r.status || 'NULL/undefined'}`);
        console.log(`    Created: ${r.created_at}`);
      });
    }

    // Also check for Bb's responses specifically
    const bbUserId = 'be01afa0-28ba-4d6d-b256-d9503cdf607f';
    console.log(`\n\n👤 All responses from user Bb (${bbUserId}):\n`);
    
    const { data: bbResponses, error: bbError } = await supabase
      .from('invitation_responses')
      .select('*')
      .eq('user_id', bbUserId);

    if (bbError) {
      console.error(`❌ Error: ${bbError.message}`);
    } else if (bbResponses && bbResponses.length > 0) {
      bbResponses.forEach(r => {
        console.log(`  Invitation: ${r.invitation_id}`);
        console.log(`    Response ID: ${r.id}`);
        console.log(`    Status: ${r.status || 'NULL/undefined'}`);
        console.log(`    Message: ${r.message || 'none'}`);
        console.log(`    Created: ${r.created_at}\n`);
      });
    } else {
      console.log('  No responses found from Bb');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkResponses();