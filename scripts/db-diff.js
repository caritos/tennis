#!/usr/bin/env node

/**
 * Create database migration from schema changes
 */

const { execSync } = require('child_process');
const { getProjectIdFromEnv } = require('./db-env-helper');

function createMigration() {
  const { projectId, envType } = getProjectIdFromEnv();
  
  // Get migration name from command line arguments
  const migrationName = process.argv[2];
  if (!migrationName) {
    console.error('❌ Migration name required');
    console.error('💡 Usage: npm run db:diff -- migration_name');
    process.exit(1);
  }
  
  console.log(`🎯 Creating migration from ${envType} database...`);
  console.log(`📝 Migration name: ${migrationName}`);
  
  try {
    // First, ensure we're linked to the correct project
    execSync(`supabase link --project-ref ${projectId}`, { stdio: 'inherit' });
    
    // Create the migration
    const command = `supabase db diff --schema public --file ${migrationName}`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Migration created successfully!');
    console.log(`📁 Check supabase/migrations/ for the new migration file`);
    
  } catch (error) {
    if (error.message.includes('Docker')) {
      console.error('❌ Docker is required for db diff command');
      console.error('💡 Install Docker Desktop or create migration manually');
    } else {
      console.error('❌ Failed to create migration:', error.message);
    }
    process.exit(1);
  }
}

createMigration();