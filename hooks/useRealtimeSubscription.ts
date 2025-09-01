import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface SubscriptionConfig {
  channel: string;
  table: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
}

interface UseRealtimeSubscriptionOptions {
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

/**
 * Hook for managing Supabase real-time subscriptions with automatic reconnection
 * Handles JWT token expiration and subscription errors
 */
export function useRealtimeSubscription(
  config: SubscriptionConfig,
  options: UseRealtimeSubscriptionOptions
) {
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  const { onUpdate, onError, enabled = true } = options;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (subscriptionRef.current) {
      console.log(`🧹 useRealtimeSubscription: Cleaning up subscription for ${config.channel}`);
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, [config.channel]);

  const createSubscription = useCallback(() => {
    if (!enabled || isUnmountedRef.current) {
      return;
    }

    // Clean up existing subscription
    cleanup();

    console.log(`📡 useRealtimeSubscription: Creating subscription for ${config.channel}`, config);

    const subscription = supabase
      .channel(config.channel)
      .on(
        'postgres_changes',
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          if (!isUnmountedRef.current) {
            console.log(`🔔 useRealtimeSubscription: Change detected on ${config.table}:`, payload.eventType);
            onUpdate(payload);
          }
        }
      )
      .subscribe((status, err) => {
        if (isUnmountedRef.current) {
          return;
        }

        console.log(`📡 useRealtimeSubscription: Subscription status for ${config.channel}:`, status);

        if (err) {
          console.error(`❌ useRealtimeSubscription: Subscription error for ${config.channel}:`, err);
          
          // Check if it's a JWT token error
          const isTokenError = 
            err.message?.includes('InvalidJWTToken') ||
            err.message?.includes('Token has expired') ||
            err.message?.includes('JWT expired');

          if (isTokenError) {
            console.log(`🔄 useRealtimeSubscription: JWT token error detected, will retry after token refresh`);
            
            // Set up retry with exponential backoff
            const retryDelay = 2000; // 2 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isUnmountedRef.current) {
                console.log(`🔄 useRealtimeSubscription: Retrying subscription for ${config.channel}`);
                createSubscription();
              }
            }, retryDelay);
          }

          if (onError) {
            onError(err);
          }
        }

        if (status === 'SUBSCRIBED') {
          console.log(`✅ useRealtimeSubscription: Successfully subscribed to ${config.channel}`);
        }
      });

    subscriptionRef.current = subscription;
  }, [config, enabled, onUpdate, onError, cleanup]);

  // Listen for auth state changes to reconnect subscriptions when tokens are refreshed
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isUnmountedRef.current) {
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log(`🔄 useRealtimeSubscription: Token refreshed, reconnecting ${config.channel}`);
        createSubscription();
      } else if (event === 'SIGNED_OUT') {
        console.log(`🚪 useRealtimeSubscription: User signed out, cleaning up ${config.channel}`);
        cleanup();
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, [config.channel, enabled, createSubscription, cleanup]);

  // Create initial subscription
  useEffect(() => {
    if (enabled) {
      createSubscription();
    } else {
      cleanup();
    }
  }, [enabled, createSubscription, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    isUnmountedRef.current = false;

    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  return {
    reconnect: createSubscription,
    cleanup,
  };
}