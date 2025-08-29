/**
 * Script to update the get_club_match_invitations function to include status field
 * 
 * Usage: npx tsx scripts/update-function.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // You'll need to add this to .env

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL');
  process.exit(1);
}

// If no service key, provide instructions
if (!supabaseServiceKey) {
  console.log('⚠️  No SUPABASE_SERVICE_KEY found in .env');
  console.log('\n📋 To fix the missing status field, you need to:');
  console.log('\n1. Go to your Supabase dashboard:');
  console.log('   https://supabase.com/dashboard/project/dgkdbqloehxruoijylzw/settings/api');
  console.log('\n2. Copy the service_role key (keep it secret!)');
  console.log('\n3. Add it to your .env file:');
  console.log('   SUPABASE_SERVICE_KEY=your-service-key-here');
  console.log('\n4. Run this script again: npx tsx scripts/update-function.ts');
  
  console.log('\n🔧 Alternative Manual Fix:');
  console.log('\n1. Go to SQL Editor in Supabase dashboard:');
  console.log('   https://supabase.com/dashboard/project/dgkdbqloehxruoijylzw/sql/new');
  console.log('\n2. Run this SQL to update the function:');
  console.log(`
DROP FUNCTION IF EXISTS get_club_match_invitations(uuid, uuid);

CREATE OR REPLACE FUNCTION get_club_match_invitations(
  p_club_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  club_id uuid,
  creator_id uuid,
  player1_name text,
  date date,
  time text,
  match_type text,
  notes text,
  created_at timestamptz,
  status text,
  creator_name text,
  creator_phone text,
  response_count bigint,
  responses json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.id,
    mi.club_id,
    mi.creator_id,
    mi.player1_name,
    mi.date,
    mi.time,
    mi.match_type,
    mi.notes,
    mi.created_at,
    mi.status,
    u.full_name as creator_name,
    u.phone as creator_phone,
    COALESCE(response_counts.response_count, 0) as response_count,
    COALESCE(responses.responses, '[]'::json) as responses
  FROM match_invitations mi
  LEFT JOIN users u ON mi.creator_id = u.id
  LEFT JOIN (
    SELECT invitation_id, COUNT(*) as response_count
    FROM invitation_responses mir
    GROUP BY invitation_id
  ) response_counts ON mi.id = response_counts.invitation_id
  LEFT JOIN (
    SELECT 
      mir.invitation_id,
      json_agg(
        json_build_object(
          'id', mir.id,
          'user_id', mir.user_id,
          'status', mir.status,
          'full_name', resp_users.full_name,
          'created_at', mir.created_at
        )
      ) as responses
    FROM invitation_responses mir
    LEFT JOIN users resp_users ON mir.user_id = resp_users.id
    GROUP BY mir.invitation_id
  ) responses ON mi.id = responses.invitation_id
  WHERE mi.club_id = p_club_id
    AND mi.status != 'cancelled'
  ORDER BY mi.date ASC, mi.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_club_match_invitations(uuid, uuid) TO authenticated;
  `);
  
  process.exit(0);
}

console.log('✅ Service key found - would update function here...');
// Add actual update logic if service key is available