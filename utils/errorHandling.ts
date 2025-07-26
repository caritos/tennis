import { AuthError } from '@supabase/supabase-js';

/**
 * Convert Supabase auth errors to user-friendly messages
 */
export function getAuthErrorMessage(error: AuthError | Error): string {
  const message = error.message.toLowerCase();
  
  // Common auth error patterns from Supabase tutorial
  if (message.includes('invalid login credentials') || message.includes('invalid email')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  // Email verification is disabled - users can sign in immediately
  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'There was an issue with your account. Please try signing in again.';
  }
  
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  
  if (message.includes('user not found')) {
    return 'No account found with this email address.';
  }
  
  if (message.includes('password') && message.includes('short')) {
    return 'Password must be at least 6 characters long.';
  }
  
  if (message.includes('email') && message.includes('invalid')) {
    return 'Please enter a valid email address.';
  }
  
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  
  if (message.includes('network') || message.includes('connection')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  // Default fallback
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Log errors consistently across the app
 */
export function logError(context: string, error: unknown, userId?: string) {
  const errorInfo = {
    context,
    message: error instanceof Error ? error.message : String(error),
    userId,
    timestamp: new Date().toISOString(),
  };
  
  console.error(`[${context}]`, errorInfo);
  
  // In production, you might want to send this to a crash reporting service
  // like Sentry, Bugsnag, or Firebase Crashlytics
}

/**
 * Handle database errors with user-friendly messages
 */
export function getDatabaseErrorMessage(error: any): string {
  if (error.code === 'SQLITE_CONSTRAINT') {
    if (error.message.includes('UNIQUE')) {
      return 'This record already exists.';
    }
    if (error.message.includes('FOREIGN KEY')) {
      return 'Invalid reference. Please try again.';
    }
    return 'Database constraint error. Please try again.';
  }
  
  if (error.code === '23505') { // PostgreSQL unique violation
    return 'This record already exists.';
  }
  
  if (error.code === '23503') { // PostgreSQL foreign key violation
    return 'Invalid reference. Please try again.';
  }
  
  return 'Database error. Please try again.';
}