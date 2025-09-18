#!/usr/bin/env node

/**
 * Script to update Supabase Auth configuration using the Management API
 * This bypasses the dashboard UI validation for custom URL schemes
 */

const https = require('https');

// Configuration
const PROJECT_REF = 'dgkdbqloehxruoijylzw';
const NEW_SITE_URL = 'playserve://';
const REDIRECT_URLS = [
  'playserve://',
  'playserve://reset-password',
  'exp://',
  'exp://localhost:8081'
];

// You'll need to get your access token from Supabase Dashboard
// Go to: https://supabase.com/dashboard/account/tokens
// Create a new token and add it here
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable is required');
  console.log('\nTo get your access token:');
  console.log('1. Go to: https://supabase.com/dashboard/account/tokens');
  console.log('2. Create a new access token');
  console.log('3. Run: export SUPABASE_ACCESS_TOKEN="your-token-here"');
  console.log('4. Run this script again');
  process.exit(1);
}

async function updateAuthConfig() {
  const data = JSON.stringify({
    site_url: NEW_SITE_URL,
    redirect_urls: REDIRECT_URLS,
    // Additional auth settings can be added here
  });

  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${PROJECT_REF}/config/auth`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          console.log('✅ Successfully updated Supabase Auth configuration!');
          console.log(`   Site URL: ${NEW_SITE_URL}`);
          console.log(`   Redirect URLs: ${REDIRECT_URLS.join(', ')}`);
          resolve(responseData);
        } else {
          console.error(`❌ Failed to update auth config. Status: ${res.statusCode}`);
          console.error('Response:', responseData);

          // If validation fails, try alternative approach
          if (res.statusCode === 400 && responseData.includes('valid URL')) {
            console.log('\n🔄 Trying alternative approach...');
            console.log('The API also validates URLs. Let\'s try a different method.');
          }
          reject(new Error(responseData));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Alternative: Try using the Supabase CLI with direct API call
async function tryDirectDatabaseUpdate() {
  console.log('\n📝 Alternative Approach: Direct Configuration Update');
  console.log('Since Supabase enforces URL validation at multiple levels,');
  console.log('we need to use a hybrid approach:\n');

  console.log('1. Set Site URL to a valid HTTP URL for web fallback:');
  console.log('   - Use: https://playserve.app (or register a domain)');
  console.log('   - Or use: https://your-github-username.github.io/playserve');

  console.log('\n2. Add mobile deep links to Redirect URLs:');
  console.log('   - playserve://');
  console.log('   - playserve://reset-password');

  console.log('\n3. Configure your domain to redirect to app stores:');
  console.log('   - iOS: App Store link');
  console.log('   - Android: Play Store link');

  console.log('\nThis way, the email link will work on both web and mobile!');
}

// Run the update
console.log('🚀 Updating Supabase Auth configuration...\n');

updateAuthConfig()
  .catch(async (error) => {
    // If the API rejects custom URL scheme, provide alternative solution
    await tryDirectDatabaseUpdate();

    console.log('\n💡 Recommended Solution:');
    console.log('Use a web domain that redirects to your app:');
    console.log('1. Register playserve.app or use a free GitHub Pages domain');
    console.log('2. Set up a simple redirect page that opens the app');
    console.log('3. Use that URL as your Site URL in Supabase');
  });