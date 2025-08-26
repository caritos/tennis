#!/usr/bin/env node

/**
 * Switch between development and production environments
 */

const fs = require('fs');
const path = require('path');

function switchEnvironment() {
  const targetEnv = process.argv[2];
  
  if (!targetEnv || !['dev', 'prod', 'development', 'production'].includes(targetEnv)) {
    console.error('❌ Invalid environment specified');
    console.error('💡 Usage: node scripts/switch-env.js [dev|prod]');
    process.exit(1);
  }

  const isDev = ['dev', 'development'].includes(targetEnv);
  const envType = isDev ? 'development' : 'production';
  
  const devEnvPath = path.join(process.cwd(), '.env.development');
  const prodEnvPath = path.join(process.cwd(), '.env.production');
  const devBackupPath = path.join(process.cwd(), '.env.development.bak');

  try {
    if (isDev) {
      // Switch to development
      if (fs.existsSync(prodEnvPath)) {
        // Backup production and restore development
        if (fs.existsSync(devBackupPath)) {
          fs.renameSync(devBackupPath, devEnvPath);
          console.log('✅ Restored .env.development');
        } else {
          console.error('❌ No development backup found (.env.development.bak)');
          process.exit(1);
        }
        
        // Remove production env
        fs.unlinkSync(prodEnvPath);
        console.log('✅ Removed .env.production');
      } else {
        console.log('ℹ️  Already in development mode');
      }
    } else {
      // Switch to production
      if (fs.existsSync(devEnvPath)) {
        // Backup development and use production
        fs.renameSync(devEnvPath, devBackupPath);
        console.log('✅ Backed up .env.development → .env.development.bak');
        
        // Production environment should already exist
        if (!fs.existsSync(prodEnvPath)) {
          console.error('❌ .env.production not found');
          process.exit(1);
        }
        console.log('✅ Using .env.production');
      } else {
        console.log('ℹ️  Already in production mode');
      }
    }

    console.log(`🎯 Switched to ${envType} environment`);
    console.log('💡 Database commands will now target the correct environment');

  } catch (error) {
    console.error('❌ Failed to switch environment:', error.message);
    process.exit(1);
  }
}

switchEnvironment();