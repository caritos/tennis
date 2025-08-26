/**
 * Update RLS Policy Script
 * Updates the notification RLS policy using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.production' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateRLSPolicy() {
  console.log('🔧 Updating notification RLS policy...');
  
  const policySQL = `
    -- Drop the existing policy
    DROP POLICY IF EXISTS "Allow notification creation" ON notifications;

    -- Create the simplified policy
    CREATE POLICY "Allow notification creation" ON notifications
      FOR INSERT WITH CHECK (
        -- Service role can always create
        auth.role() = 'service_role'
        OR
        -- Authenticated users can create notifications
        (
          auth.role() = 'authenticated'
          AND (
            -- Users can create notifications for themselves
            auth.uid() = user_id
            OR
            -- Temporarily allow creating challenge notifications for anyone (for debugging)
            type = 'challenge'
          )
        )
      );
  `;

  try {
    // This won't work with anon key, but let's try
    const { data, error } = await supabase.rpc('exec_sql', { sql: policySQL });
    
    if (error) {
      console.error('❌ Failed to update policy:', error);
      console.log('💡 This requires admin/service role access');
      console.log('📝 Please run the policy update manually in Supabase dashboard');
      return false;
    }
    
    console.log('✅ Policy updated successfully');
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('💡 This requires admin/service role access');
    return false;
  }
}

async function main() {
  console.log('🚀 RLS Policy Update Script');
  console.log('============================\n');
  
  const success = await updateRLSPolicy();
  
  if (!success) {
    console.log('\n📋 Manual SQL to run in Supabase dashboard:');
    console.log('-------------------------------------------');
    console.log(`
-- Drop the existing policy
DROP POLICY IF EXISTS "Allow notification creation" ON notifications;

-- Create the simplified policy
CREATE POLICY "Allow notification creation" ON notifications
  FOR INSERT WITH CHECK (
    -- Service role can always create
    auth.role() = 'service_role'
    OR
    -- Authenticated users can create notifications
    (
      auth.role() = 'authenticated'
      AND (
        -- Users can create notifications for themselves
        auth.uid() = user_id
        OR
        -- Temporarily allow creating challenge notifications for anyone (for debugging)
        type = 'challenge'
      )
    )
  );
    `);
  }
}

main().catch(console.error);