import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface SubscriptionConfig {
  channel: string;
  table?: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  enablePresence?: boolean;
}

interface UseRealtimeSubscriptionOptions {
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onPresenceSync?: () => void;
  onPresenceJoin?: (event: any) => void;
  onPresenceLeave?: (event: any) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'idle';

/**
 * Enhanced hook for managing Supabase real-time subscriptions following best practices
 * - Uses async/await for subscription setup
 * - Supports presence tracking
 * - Proper error recovery with exponential backoff
 * - Connection status monitoring
 */
export function useRealtimeSubscriptionV2(
  config: SubscriptionConfig,
  options: UseRealtimeSubscriptionOptions
) {
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const retryCountRef = useRef(0);

  const [status, setStatus] = useState<SubscriptionStatus>('idle');
  const [presenceState, setPresenceState] = useState<any>({});

  const {
    onUpdate,
    onPresenceSync,
    onPresenceJoin,
    onPresenceLeave,
    onError,
    enabled = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (subscriptionRef.current) {
      console.log(`🧹 useRealtimeSubscriptionV2: Cleaning up subscription for ${config.channel}`);
      // Use removeChannel for proper cleanup as per best practices
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    setStatus('idle');
    retryCountRef.current = 0;
  }, [config.channel]);

  const createSubscription = useCallback(async () => {
    if (!enabled || isUnmountedRef.current) {
      return;
    }

    // Clean up existing subscription
    cleanup();

    setStatus('connecting');
    console.log(`📡 useRealtimeSubscriptionV2: Creating subscription for ${config.channel}`, config);

    try {
      // Create channel first
      const channel = supabase.channel(config.channel);

      // Set up postgres changes listener if table is specified
      if (config.table) {
        channel.on(
          'postgres_changes',
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter,
          },
          (payload) => {
            if (!isUnmountedRef.current && onUpdate) {
              console.log(`🔔 useRealtimeSubscriptionV2: Change detected on ${config.table}:`, payload.eventType);
              onUpdate(payload);
            }
          }
        );
      }

      // Set up presence tracking if enabled
      if (config.enablePresence) {
        channel
          .on('presence', { event: 'sync' }, () => {
            if (!isUnmountedRef.current) {
              const state = channel.presenceState();
              console.log(`👥 useRealtimeSubscriptionV2: Presence sync for ${config.channel}:`, state);
              setPresenceState(state);
              onPresenceSync?.();
            }
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            if (!isUnmountedRef.current) {
              console.log(`👤 useRealtimeSubscriptionV2: User joined ${config.channel}:`, key);
              onPresenceJoin?.({ key, newPresences });
            }
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            if (!isUnmountedRef.current) {
              console.log(`👻 useRealtimeSubscriptionV2: User left ${config.channel}:`, key);
              onPresenceLeave?.({ key, leftPresences });
            }
          });
      }

      // Subscribe using async/await as per best practices
      const { status: subscribeStatus, error } = await channel.subscribe();

      if (isUnmountedRef.current) {
        // Component unmounted during subscription
        supabase.removeChannel(channel);
        return;
      }

      if (error) {
        throw error;
      }

      if (subscribeStatus === 'SUBSCRIBED') {
        console.log(`✅ useRealtimeSubscriptionV2: Successfully subscribed to ${config.channel}`);
        subscriptionRef.current = channel;
        setStatus('connected');
        retryCountRef.current = 0;

        // Track presence if enabled
        if (config.enablePresence) {
          const userStatus = {
            user_id: (await supabase.auth.getUser()).data.user?.id,
            online_at: new Date().toISOString(),
          };
          await channel.track(userStatus);
        }
      } else {
        console.warn(`⚠️ useRealtimeSubscriptionV2: Unexpected subscription status: ${subscribeStatus}`);
        setStatus('disconnected');
      }
    } catch (error: any) {
      console.error(`❌ useRealtimeSubscriptionV2: Subscription error for ${config.channel}:`, error);
      setStatus('error');

      // Check if it's a JWT token error
      const isTokenError =
        error.message?.includes('InvalidJWTToken') ||
        error.message?.includes('Token has expired') ||
        error.message?.includes('JWT expired');

      if (isTokenError || retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = retryDelay * Math.pow(2, retryCountRef.current - 1); // Exponential backoff

        console.log(`🔄 useRealtimeSubscriptionV2: Retrying subscription (${retryCountRef.current}/${maxRetries}) in ${delay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            createSubscription();
          }
        }, delay);
      } else {
        console.error(`❌ useRealtimeSubscriptionV2: Max retries reached for ${config.channel}`);
        if (onError) {
          onError(error);
        }
      }
    }
  }, [config, enabled, onUpdate, onPresenceSync, onPresenceJoin, onPresenceLeave, onError, cleanup, retryDelay, maxRetries]);

  // Listen for auth state changes to reconnect subscriptions when tokens are refreshed
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isUnmountedRef.current) {
        return;
      }

      if (event === 'TOKEN_REFRESHED' && subscriptionRef.current) {
        console.log(`🔄 useRealtimeSubscriptionV2: Token refreshed, reconnecting ${config.channel}`);
        createSubscription();
      } else if (event === 'SIGNED_OUT') {
        console.log(`🚪 useRealtimeSubscriptionV2: User signed out, cleaning up ${config.channel}`);
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

  // Heartbeat to check connection status
  useEffect(() => {
    if (!enabled || !subscriptionRef.current) {
      return;
    }

    const checkConnection = setInterval(() => {
      if (subscriptionRef.current?.state === 'closed') {
        console.log(`⚠️ useRealtimeSubscriptionV2: Connection lost for ${config.channel}, reconnecting...`);
        setStatus('disconnected');
        createSubscription();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkConnection);
  }, [enabled, config.channel, createSubscription]);

  return {
    status,
    presenceState,
    reconnect: createSubscription,
    cleanup,
    channel: subscriptionRef.current,
  };
}