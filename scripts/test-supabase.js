const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test if we can connect to Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection error:', error);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Session:', data.session ? 'Active' : 'No active session');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();