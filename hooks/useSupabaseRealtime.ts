import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  REALTIME_SUBSCRIBE_STATES
} from '@supabase/supabase-js';

interface PostgresChangesConfig {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  table: string;
  filter?: string;
}

interface BroadcastConfig {
  event: string;
}

interface PresenceConfig {
  key?: string;
}

interface ChannelConfig {
  channel: string;
  private?: boolean;

  // Choose one or more:
  postgresChanges?: PostgresChangesConfig | PostgresChangesConfig[];
  broadcast?: BroadcastConfig | BroadcastConfig[];
  presence?: PresenceConfig;
}

interface UseSupabaseRealtimeOptions {
  onPostgresChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onBroadcast?: (event: string, payload: any) => void;
  onPresenceSync?: () => void;
  onPresenceJoin?: (event: any) => void;
  onPresenceLeave?: (event: any) => void;
  enabled?: boolean;
}

/**
 * Official Supabase Realtime pattern implementation
 * Following best practices from Supabase documentation:
 * - Uses await with subscribe()
 * - Proper removeChannel() for cleanup
 * - Supports setAuth() for private channels
 * - Handles postgres_changes, broadcast, and presence
 */
export function useSupabaseRealtime(
  config: ChannelConfig,
  options: UseSupabaseRealtimeOptions
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [presenceState, setPresenceState] = useState<any>({});

  const {
    onPostgresChange,
    onBroadcast,
    onPresenceSync,
    onPresenceJoin,
    onPresenceLeave,
    enabled = true
  } = options;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log(`🧹 Cleaning up channel: ${config.channel}`);
      // Use removeChannel as per Supabase docs
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsSubscribed(false);
    }
  }, [config.channel]);

  const setupChannel = useCallback(async () => {
    if (!enabled) {
      cleanup();
      return;
    }

    // Clean up existing channel
    cleanup();

    try {
      console.log(`📡 Setting up channel: ${config.channel}`);

      // Create channel with config
      const channelOptions: any = {};
      if (config.private) {
        channelOptions.config = { private: true };
      }

      const channel = supabase.channel(config.channel, channelOptions);

      // Set up postgres_changes listeners
      if (config.postgresChanges) {
        const changes = Array.isArray(config.postgresChanges)
          ? config.postgresChanges
          : [config.postgresChanges];

        changes.forEach(changeConfig => {
          channel.on(
            'postgres_changes',
            {
              event: changeConfig.event,
              schema: changeConfig.schema || 'public',
              table: changeConfig.table,
              filter: changeConfig.filter
            },
            (payload) => {
              console.log(`🔔 Postgres change on ${changeConfig.table}:`, payload.eventType);
              onPostgresChange?.(payload);
            }
          );
        });
      }

      // Set up broadcast listeners
      if (config.broadcast) {
        const broadcasts = Array.isArray(config.broadcast)
          ? config.broadcast
          : [config.broadcast];

        broadcasts.forEach(broadcastConfig => {
          channel.on(
            'broadcast',
            { event: broadcastConfig.event },
            (payload) => {
              console.log(`📢 Broadcast event ${broadcastConfig.event}:`, payload);
              onBroadcast?.(broadcastConfig.event, payload);
            }
          );
        });
      }

      // Set up presence listeners
      if (config.presence) {
        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            console.log(`👥 Presence sync:`, state);
            setPresenceState(state);
            onPresenceSync?.();
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log(`👤 User joined:`, key);
            onPresenceJoin?.({ key, newPresences });
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log(`👻 User left:`, key);
            onPresenceLeave?.({ key, leftPresences });
          });
      }

      // Set auth for private channels BEFORE subscribing
      if (config.private) {
        console.log(`🔐 Setting auth for private channel: ${config.channel}`);
        await supabase.realtime.setAuth();
      }

      // Subscribe using await as per Supabase docs
      console.log(`🔄 Subscribing to channel: ${config.channel}`);
      const { status, error: subscribeError } = await channel.subscribe();

      if (subscribeError) {
        throw subscribeError;
      }

      // Check for exact status as per docs
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to: ${config.channel}`);
        channelRef.current = channel;
        setIsSubscribed(true);
        setError(null);

        // Track presence if configured
        if (config.presence) {
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString()
            });
          }
        }
      } else {
        console.warn(`⚠️ Unexpected subscription status: ${status}`);
        setError(new Error(`Subscription status: ${status}`));
      }
    } catch (err: any) {
      console.error(`❌ Failed to subscribe to ${config.channel}:`, err);
      setError(err);
      setIsSubscribed(false);
    }
  }, [
    config,
    enabled,
    onPostgresChange,
    onBroadcast,
    onPresenceSync,
    onPresenceJoin,
    onPresenceLeave,
    cleanup
  ]);

  // Setup channel on mount and config changes
  useEffect(() => {
    setupChannel();
    return cleanup;
  }, [setupChannel, cleanup]);

  // Re-subscribe on auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' && channelRef.current) {
        console.log(`🔄 Token refreshed, re-subscribing to: ${config.channel}`);
        setupChannel();
      } else if (event === 'SIGNED_OUT') {
        console.log(`🚪 User signed out, cleaning up: ${config.channel}`);
        cleanup();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [config.channel, setupChannel, cleanup]);

  return {
    channel: channelRef.current,
    isSubscribed,
    error,
    presenceState,
    reconnect: setupChannel,
    cleanup
  };
}

/**
 * Convenience hook for postgres_changes only
 */
export function usePostgresChanges(
  table: string,
  options: {
    event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    filter?: string;
    schema?: string;
    onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void;
    enabled?: boolean;
  }
) {
  return useSupabaseRealtime(
    {
      channel: `postgres_${table}_${options.filter || 'all'}`,
      postgresChanges: {
        event: options.event || '*',
        schema: options.schema || 'public',
        table,
        filter: options.filter
      }
    },
    {
      onPostgresChange: options.onUpdate,
      enabled: options.enabled
    }
  );
}

/**
 * Convenience hook for broadcast channels
 */
export function useBroadcastChannel(
  roomId: string,
  options: {
    events: string[];
    onMessage: (event: string, payload: any) => void;
    private?: boolean;
    enabled?: boolean;
  }
) {
  return useSupabaseRealtime(
    {
      channel: `room:${roomId}`,
      private: options.private,
      broadcast: options.events.map(event => ({ event }))
    },
    {
      onBroadcast: options.onMessage,
      enabled: options.enabled
    }
  );
}