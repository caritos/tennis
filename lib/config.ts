// Environment configuration
const ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';

// Load environment-specific variables
const getSupabaseConfig = () => {
  // In production builds, EAS will use the production env vars
  // In development, we use the local .env.development file
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please check your environment variables.');
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
};

export const config = {
  env: ENV,
  isDevelopment: ENV === 'development',
  isProduction: ENV === 'production',
  supabase: getSupabaseConfig(),
};

// Log current environment and database info
console.log('=================================');
console.log('🔧 DATABASE CONNECTION INFO:');
console.log('=================================');
console.log('Environment:', ENV);
console.log('Supabase URL:', config.supabase.url);

// Extract and log project ID
const projectId = config.supabase.url?.split('.')[0]?.split('//')[1] || 'unknown';
console.log('Project ID:', projectId);

// Check which database we're connected to
if (projectId === 'dgkdbqloehxruoijylzw') {
  console.log('✅ Connected to PRODUCTION DATABASE');
} else if (projectId === 'lbfoobwxjnyymnxdajxh') {
  console.log('⚠️  Connected to DEVELOPMENT DATABASE');
} else {
  console.log('❓ Connected to UNKNOWN DATABASE');
}

console.log('=================================');