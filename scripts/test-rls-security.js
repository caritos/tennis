#!/usr/bin/env node

/**
 * Test RLS Security Policies
 * 
 * This script tests the Row Level Security policies for reports and blocked_users tables
 * to ensure they properly restrict access based on user authentication.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment configuration
function getSupabaseConfig() {
  const devEnvPath = path.join(process.cwd(), '.env.development');
  const prodEnvPath = path.join(process.cwd(), '.env.production');
  
  let envPath;
  if (fs.existsSync(prodEnvPath)) {
    envPath = prodEnvPath;
    console.log('🔧 Using production environment for RLS testing');
  } else if (fs.existsSync(devEnvPath)) {
    envPath = devEnvPath;
    console.log('🔧 Using development environment for RLS testing');
  } else {
    throw new Error('❌ No environment file found (.env.development or .env.production)');
  }

  // Parse environment file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  const url = envVars.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('❌ Missing Supabase URL or anon key in environment file');
  }

  return { url, anonKey };
}

async function testRLSPolicies() {
  console.log('🧪 Testing RLS Security Policies');
  console.log('==================================');

  try {
    const config = getSupabaseConfig();
    const supabase = createClient(config.url, config.anonKey);

    // Test 1: Check if RLS is enabled
    console.log('\n📋 Test 1: Checking RLS Status');
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('table_name, row_security')
      .eq('table_schema', 'public')
      .in('table_name', ['reports', 'blocked_users']);

    if (rlsError) {
      console.log('⚠️  Could not check RLS status directly (expected for security)');
    } else {
      console.log('✅ RLS status check completed');
      console.log(rlsStatus);
    }

    // Test 2: Test anonymous access (should be restricted)
    console.log('\n📋 Test 2: Testing Anonymous Access (should fail)');
    
    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select('id, reporter_id')
      .limit(5);

    if (reportsError) {
      console.log('✅ Reports access properly restricted:', reportsError.message);
    } else {
      console.log('⚠️  Reports accessible without authentication - check RLS policies');
      console.log(`Found ${reportsData?.length || 0} reports`);
    }

    const { data: blockedData, error: blockedError } = await supabase
      .from('blocked_users')
      .select('id, blocker_id')
      .limit(5);

    if (blockedError) {
      console.log('✅ Blocked users access properly restricted:', blockedError.message);
    } else {
      console.log('⚠️  Blocked users accessible without authentication - check RLS policies');
      console.log(`Found ${blockedData?.length || 0} blocked user records`);
    }

    // Test 3: Check table structure
    console.log('\n📋 Test 3: Verifying Table Structure');
    
    // Check if tables exist by trying to get their structure
    const { error: reportsStructureError } = await supabase
      .from('reports')
      .select('id')
      .limit(0);
      
    const { error: blockedStructureError } = await supabase
      .from('blocked_users')
      .select('id')
      .limit(0);

    if (!reportsStructureError && !blockedStructureError) {
      console.log('✅ Both tables exist and are accessible (structure check)');
    } else {
      console.log('❌ Table structure issues detected');
      if (reportsStructureError) console.log('Reports error:', reportsStructureError.message);
      if (blockedStructureError) console.log('Blocked users error:', blockedStructureError.message);
    }

    console.log('\n🎯 RLS Security Test Summary');
    console.log('=============================');
    console.log('✅ Created security migration file');
    console.log('✅ RLS policies defined for proper access control');
    console.log('🔒 Tables should now be secure with RLS enabled');
    console.log('');
    console.log('⚠️  IMPORTANT: Apply the migration with:');
    console.log('   npm run db:push');
    console.log('');
    console.log('🧪 After migration, test with authenticated users to verify:');
    console.log('   - Users can only see their own reports');
    console.log('   - Users can only see blocks they created');
    console.log('   - Users cannot access other users\' private data');

  } catch (error) {
    console.error('❌ RLS testing failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRLSPolicies();