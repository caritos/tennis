#!/usr/bin/env node

/**
 * Database Environment Helper
 * Determines the correct Supabase project ID based on current environment
 */

const fs = require('fs');
const path = require('path');

function getProjectIdFromEnv() {
  // Check if .env.development exists (development mode)
  const devEnvPath = path.join(process.cwd(), '.env.development');
  const prodEnvPath = path.join(process.cwd(), '.env.production');
  
  let envFile = null;
  let envType = null;

  // Determine which environment file exists
  if (fs.existsSync(devEnvPath)) {
    envFile = devEnvPath;
    envType = 'development';
  } else if (fs.existsSync(prodEnvPath)) {
    envFile = prodEnvPath;
    envType = 'production';
  } else {
    // Fallback: check .env.development.bak
    const devBackupPath = path.join(process.cwd(), '.env.development.bak');
    if (fs.existsSync(devBackupPath)) {
      console.error('⚠️  Found .env.development.bak but no active .env.development');
      console.error('💡 Run: mv .env.development.bak .env.development');
      process.exit(1);
    } else {
      console.error('❌ No environment file found (.env.development or .env.production)');
      process.exit(1);
    }
  }

  try {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const supabaseUrlMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/);
    
    if (!supabaseUrlMatch) {
      console.error('❌ Could not extract project ID from', envFile);
      process.exit(1);
    }

    const projectId = supabaseUrlMatch[1];
    
    console.log(`🔧 Detected environment: ${envType}`);
    console.log(`📊 Using Supabase project: ${projectId}`);
    
    return { projectId, envType };
    
  } catch (error) {
    console.error('❌ Error reading environment file:', error.message);
    process.exit(1);
  }
}

// If called directly, output the project ID
if (require.main === module) {
  const { projectId } = getProjectIdFromEnv();
  console.log(projectId);
}

module.exports = { getProjectIdFromEnv };