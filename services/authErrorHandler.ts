/**
 * Authentication Error Handler
 * 
 * Handles various authentication errors including refresh token issues
 */

import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';

export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private retryCount = 0;
  private maxRetries = 3;

  static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  /**
   * Handle authentication errors with appropriate recovery strategies
   */
  async handleAuthError(error: AuthError | Error): Promise<void> {
    console.log('🔧 AuthErrorHandler: Processing error:', error.message);

    // Check for specific error types
    if (error.message?.includes('Invalid Refresh Token') || 
        error.message?.includes('Refresh Token Not Found')) {
      await this.handleRefreshTokenError();
    } else if (error.message?.includes('JWT expired')) {
      await this.handleExpiredToken();
    } else if (error.message?.includes('Invalid JWT')) {
      await this.handleInvalidToken();
    } else if (error.message?.includes('No user session')) {
      await this.handleNoSession();
    } else {
      console.error('❌ AuthErrorHandler: Unhandled auth error:', error);
    }
  }

  /**
   * Handle refresh token errors
   */
  private async handleRefreshTokenError(): Promise<void> {
    console.log('🔄 AuthErrorHandler: Handling refresh token error');

    try {
      // Clear any existing session
      await this.clearSession();

      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ AuthErrorHandler: Failed to refresh session:', error);
        
        // If refresh fails, sign out completely
        await this.forceSignOut();
        
        // Notify user to sign in again
        this.notifyUserToReauthenticate();
      } else if (data.session) {
        console.log('✅ AuthErrorHandler: Session refreshed successfully');
        
        // Reset retry count on success
        this.retryCount = 0;
      }
    } catch (error) {
      console.error('❌ AuthErrorHandler: Exception during refresh token handling:', error);
      await this.forceSignOut();
    }
  }

  /**
   * Handle expired token
   */
  private async handleExpiredToken(): Promise<void> {
    console.log('⏰ AuthErrorHandler: Token expired, attempting refresh');

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ AuthErrorHandler: Failed to refresh expired token:', error);
        await this.forceSignOut();
      } else {
        console.log('✅ AuthErrorHandler: Token refreshed successfully');
      }
    } catch (error) {
      console.error('❌ AuthErrorHandler: Exception during token refresh:', error);
      await this.forceSignOut();
    }
  }

  /**
   * Handle invalid token
   */
  private async handleInvalidToken(): Promise<void> {
    console.log('🚫 AuthErrorHandler: Invalid token detected');
    
    // Invalid tokens cannot be recovered, force sign out
    await this.forceSignOut();
    this.notifyUserToReauthenticate();
  }

  /**
   * Handle no session
   */
  private async handleNoSession(): Promise<void> {
    console.log('📭 AuthErrorHandler: No session found');
    
    // Try to get a new session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (!session || error) {
      console.log('❌ AuthErrorHandler: Unable to establish session');
      await this.clearSession();
    }
  }

  /**
   * Clear the current session
   */
  private async clearSession(): Promise<void> {
    console.log('🧹 AuthErrorHandler: Clearing session');
    
    try {
      // Clear local storage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('❌ AuthErrorHandler: Error clearing session:', error);
    }
  }

  /**
   * Force sign out the user
   */
  private async forceSignOut(): Promise<void> {
    console.log('🚪 AuthErrorHandler: Forcing sign out');

    try {
      await this.clearSession();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ AuthErrorHandler: Error during force sign out:', error);
    }
  }

  /**
   * Notify user to re-authenticate
   */
  private notifyUserToReauthenticate(): void {
    console.log('📢 AuthErrorHandler: User needs to re-authenticate');
    
    // In a real app, this would trigger a UI notification
    // For now, we'll just log it
    if (typeof window !== 'undefined' && window.alert) {
      // Only show alert in development
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          window.alert('Your session has expired. Please sign in again.');
        }, 100);
      }
    }
  }

  /**
   * Check if an error is an authentication error
   */
  static isAuthError(error: any): boolean {
    if (!error) return false;
    
    const authErrorMessages = [
      'Invalid Refresh Token',
      'Refresh Token Not Found',
      'JWT expired',
      'Invalid JWT',
      'No user session',
      'Invalid user credentials',
      'Email not confirmed',
      'Invalid access token'
    ];

    const errorMessage = error.message || error.toString();
    return authErrorMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Wrap an async function with auth error handling
   */
  static async withAuthErrorHandling<T>(
    fn: () => Promise<T>,
    options?: { 
      retries?: number; 
      onError?: (error: Error) => void;
      fallback?: T;
    }
  ): Promise<T | undefined> {
    const handler = AuthErrorHandler.getInstance();
    const maxRetries = options?.retries || 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        console.error(`❌ AuthErrorHandler: Attempt ${attempt + 1} failed:`, error);

        if (AuthErrorHandler.isAuthError(error)) {
          await handler.handleAuthError(error);
          
          // If this was the last attempt, call onError
          if (attempt === maxRetries - 1 && options?.onError) {
            options.onError(error);
          }
        } else {
          // Non-auth error, don't retry
          if (options?.onError) {
            options.onError(error);
          }
          throw error;
        }
      }
    }

    // All retries failed, return fallback if provided
    if (options?.fallback !== undefined) {
      return options.fallback;
    }

    // Otherwise throw the last error
    if (lastError) {
      throw lastError;
    }
  }
}

// Export singleton instance
export const authErrorHandler = AuthErrorHandler.getInstance();