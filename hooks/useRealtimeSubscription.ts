import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface SubscriptionConfig {
  channel: string;
  table: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  private?: boolean; // For private channels requiring auth
}

interface UseRealtimeSubscriptionOptions {
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

/**
 * Hook for managing Supabase real-time subscriptions following latest best practices
 * - Uses async/await for subscribe
 * - Proper removeChannel cleanup
 * - Supports private channels with setAuth
 */
export function useRealtimeSubscription(
  config: SubscriptionConfig,
  options: UseRealtimeSubscriptionOptions
) {
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { onUpdate, onError, enabled = true } = options;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (subscriptionRef.current) {
      console.log(`🧹 useRealtimeSubscription: Cleaning up subscription for ${config.channel}`);
      // Use removeChannel as per Supabase best practices
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
      setIsSubscribed(false);
    }
  }, [config.channel]);

  const createSubscription = useCallback(async () => {
    if (!enabled || isUnmountedRef.current) {
      return;
    }

    // Clean up existing subscription
    cleanup();

    console.log(`📡 useRealtimeSubscription: Creating subscription for ${config.channel}`, config);

    try {
      // Create channel with proper configuration
      const channelOptions: any = {};
      if (config.private) {
        channelOptions.config = { private: true };
      }

      const channel = supabase.channel(config.channel, channelOptions);

      // Set up postgres_changes listener
      channel.on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        } as any,
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (!isUnmountedRef.current) {
            console.log(`🔔 useRealtimeSubscription: Change detected on ${config.table}:`, payload.eventType);
            onUpdate(payload);
          }
        }
      );

      // Set auth for private channels BEFORE subscribing (Supabase best practice)
      if (config.private) {
        console.log(`🔐 useRealtimeSubscription: Setting auth for private channel ${config.channel}`);
        await supabase.realtime.setAuth();
      }

      // Subscribe with callback to handle status (Supabase pattern)
      channel.subscribe((status) => {
        if (isUnmountedRef.current) {
          // Component unmounted during subscription
          supabase.removeChannel(channel);
          return;
        }

        console.log(`📡 useRealtimeSubscription: Subscription status for ${config.channel}: ${status}`);

        // Check for exact status (Supabase best practice)
        if (status === 'SUBSCRIBED') {
          console.log(`✅ useRealtimeSubscription: Successfully subscribed to ${config.channel}`);
          subscriptionRef.current = channel;
          setIsSubscribed(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`❌ useRealtimeSubscription: Subscription failed for ${config.channel}: ${status}`);

          // Debug auth state when subscription fails
          supabase.auth.getSession().then(({ data: { session }, error }) => {
            console.log(`🔍 useRealtimeSubscription: Auth debug for ${config.channel}:`, {
              hasSession: !!session,
              hasAccessToken: !!session?.access_token,
              tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
              authError: error?.message
            });
          });

          // Clean up the failed channel
          supabase.removeChannel(channel);
          setIsSubscribed(false);

          // Call error handler if provided
          if (onError) {
            onError(new Error(`Subscription failed: ${status}`));
          }

          // Set up retry with exponential backoff for transient errors only
          if (status === 'TIMED_OUT') {
            const retryDelay = 3000; // 3 seconds for timeout
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isUnmountedRef.current) {
                console.log(`🔄 useRealtimeSubscription: Retrying subscription after timeout for ${config.channel}`);
                createSubscription();
              }
            }, retryDelay) as any;
          }
          // Note: Not retrying CHANNEL_ERROR as it's usually a permanent issue
        } else {
          console.warn(`⚠️ useRealtimeSubscription: Subscription status: ${status}`);
        }
      });
    } catch (err: any) {
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
        }, retryDelay) as any;
      }

      if (onError) {
        onError(err);
      }
    }
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
    isSubscribed,
    reconnect: createSubscription,
    cleanup,
    channel: subscriptionRef.current,
  };
}