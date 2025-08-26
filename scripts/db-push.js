#!/usr/bin/env node

/**
 * Push migrations to current environment database
 */

const { execSync } = require('child_process');
const { getProjectIdFromEnv } = require('./db-env-helper');

function pushMigrations() {
  const { projectId, envType } = getProjectIdFromEnv();
  
  console.log(`🎯 Pushing migrations to ${envType} database...`);
  console.log(`⚠️  This will modify the ${envType.toUpperCase()} database!`);
  
  // Confirmation for production
  if (envType === 'production') {
    console.log('⚠️  WARNING: You are about to modify the PRODUCTION database!');
    console.log('💡 Make sure you have tested these migrations on development first.');
  }
  
  try {
    // Ensure we're linked to the correct project
    execSync(`supabase link --project-ref ${projectId}`, { stdio: 'inherit' });
    
    // Push migrations
    const command = `supabase db push`;
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Migrations pushed successfully to ${envType}!`);
    console.log(`💡 Consider regenerating types: npm run db:generate-types`);
    
  } catch (error) {
    console.error('❌ Failed to push migrations:', error.message);
    process.exit(1);
  }
}

pushMigrations();