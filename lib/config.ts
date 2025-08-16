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

// Log current environment (only in development)
if (__DEV__) {
  console.log('Current environment:', ENV);
  console.log('Supabase URL:', config.supabase.url);
}