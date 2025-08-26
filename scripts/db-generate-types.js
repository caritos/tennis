#!/usr/bin/env node

/**
 * Generate TypeScript types for current environment
 */

const { execSync } = require('child_process');
const { getProjectIdFromEnv } = require('./db-env-helper');

function generateTypes() {
  const { projectId, envType } = getProjectIdFromEnv();
  
  console.log(`🎯 Generating types for ${envType} environment...`);
  
  try {
    const command = `supabase gen types typescript --project-id ${projectId}`;
    const output = execSync(command, { encoding: 'utf8' });
    
    // Write to types file
    const fs = require('fs');
    fs.writeFileSync('types/supabase.ts', output);
    
    console.log('✅ TypeScript types generated successfully!');
    console.log(`📄 Updated: types/supabase.ts`);
    
  } catch (error) {
    console.error('❌ Failed to generate types:', error.message);
    process.exit(1);
  }
}

generateTypes();