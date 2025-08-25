/**
 * Hook for handling authentication errors in components
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AuthErrorHandler } from '@/services/authErrorHandler';

interface UseAuthErrorHandlerOptions {
  onSessionExpired?: () => void;
  redirectToSignIn?: boolean;
  showErrorAlert?: boolean;
}

export function useAuthErrorHandler(options?: UseAuthErrorHandlerOptions) {
  const router = useRouter();

  /**
   * Handle auth errors with optional navigation
   */
  const handleAuthError = useCallback(async (error: any) => {
    console.log('🔧 useAuthErrorHandler: Processing error');

    // Check if it's an auth error
    if (!AuthErrorHandler.isAuthError(error)) {
      // Not an auth error, let the component handle it
      throw error;
    }

    // Handle the auth error
    await AuthErrorHandler.getInstance().handleAuthError(error);

    // Check for specific error types that require navigation
    const requiresReauth = 
      error.message?.includes('Invalid Refresh Token') ||
      error.message?.includes('Refresh Token Not Found') ||
      error.message?.includes('Invalid JWT') ||
      error.message?.includes('No user session');

    if (requiresReauth) {
      // Call session expired callback if provided
      if (options?.onSessionExpired) {
        options.onSessionExpired();
      }

      // Redirect to sign in if requested
      if (options?.redirectToSignIn) {
        console.log('🔄 useAuthErrorHandler: Redirecting to sign in');
        router.replace('/signin');
      }
    }
  }, [router, options]);

  /**
   * Wrap an async function with auth error handling
   */
  const withAuthHandling = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>
    ) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          return await fn(...args);
        } catch (error: any) {
          await handleAuthError(error);
          return undefined;
        }
      };
    },
    [handleAuthError]
  );

  /**
   * Execute a function with auth error handling
   */
  const executeWithAuthHandling = useCallback(
    async <T>(
      fn: () => Promise<T>,
      fallback?: T
    ): Promise<T | undefined> => {
      return AuthErrorHandler.withAuthErrorHandling(fn, {
        retries: 2,
        fallback,
        onError: async (error) => {
          if (options?.showErrorAlert) {
            console.error('Auth error occurred:', error.message);
          }
        }
      });
    },
    [options]
  );

  return {
    handleAuthError,
    withAuthHandling,
    executeWithAuthHandling,
    isAuthError: AuthErrorHandler.isAuthError
  };
}

/**
 * Hook to automatically handle auth errors in a component
 */
export function useAutoAuthErrorHandler(options?: UseAuthErrorHandlerOptions) {
  const { handleAuthError } = useAuthErrorHandler(options);

  useEffect(() => {
    // Create a global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      if (AuthErrorHandler.isAuthError(error)) {
        console.log('🚨 useAutoAuthErrorHandler: Caught unhandled auth error');
        event.preventDefault(); // Prevent default error handling
        handleAuthError(error);
      }
    };

    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, [handleAuthError]);
}