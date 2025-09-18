import { useEffect } from 'react';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface UseClubRealtimeSubscriptionsProps {
  clubId: string | undefined;
  userId: string | undefined;
  onClubUpdate: () => void;
  onMembersUpdate: () => void;
  onMatchesUpdate: () => void;
  onEloUpdate?: () => void;
}

/**
 * Consolidated hook for managing all club-related realtime subscriptions
 * Following Supabase best practices with proper async/await and cleanup
 */
export function useClubRealtimeSubscriptions({
  clubId,
  userId,
  onClubUpdate,
  onMembersUpdate,
  onMatchesUpdate,
  onEloUpdate,
}: UseClubRealtimeSubscriptionsProps) {
  console.log('🔧 useClubRealtimeSubscriptions: Setting up subscriptions for club:', clubId, 'user:', userId);

  // Club details subscription with presence tracking
  const clubDetailsSubscription = useRealtimeSubscription(
    {
      channel: `club_details_${clubId}`,
      table: 'clubs',
      filter: clubId ? `id=eq.${clubId}` : undefined,
      event: '*',
      private: true, // Track who's viewing the club
    },
    {
      enabled: !!clubId,
      onUpdate: (payload) => {
        console.log('🔔 Club details updated:', payload.eventType);
        onClubUpdate();
      },
      onError: (error) => {
        console.error('❌ Club details subscription error:', error);
      },
    }
  );

  // Club members subscription
  const membersSubscription = useRealtimeSubscription(
    {
      channel: `club_members_${clubId}`,
      table: 'club_users',
      filter: clubId ? `club_id=eq.${clubId}` : undefined,
      event: '*',
    },
    {
      enabled: !!clubId,
      onUpdate: (payload) => {
        console.log('🔔 Club members updated:', payload.eventType);
        onMembersUpdate();
      },
      onError: (error) => {
        console.error('❌ Club members subscription error:', error);
      },
    }
  );

  // Matches subscription (CRITICAL for real-time updates)
  console.log('🔧 useClubRealtimeSubscriptions: Setting up matches subscription for club:', clubId);
  const matchesSubscription = useRealtimeSubscription(
    {
      channel: `club_matches_${clubId}`,
      table: 'matches',
      filter: clubId ? `club_id=eq.${clubId}` : undefined,
      event: '*',
    },
    {
      enabled: !!clubId,
      onUpdate: (payload) => {
        console.log('🎾 *** MATCH UPDATE DETECTED IN HOOK ***');
        console.log('Match event type:', payload.eventType);
        console.log('Match data:', payload.new || payload.old);

        // Immediate update for match changes
        onMatchesUpdate();

        // Also update members if it's a new match (affects rankings)
        if (payload.eventType === 'INSERT') {
          setTimeout(onMembersUpdate, 1000); // Slight delay for ELO calculations
        }
      },
      onError: (error) => {
        console.error('❌ Matches subscription error:', error);
      },
    }
  );

  console.log('🔧 useClubRealtimeSubscriptions: Matches subscription result:', {
    isSubscribed: matchesSubscription.isSubscribed,
    channel: matchesSubscription.channel
  });

  // User ELO subscription (for current user only)
  const eloSubscription = useRealtimeSubscription(
    {
      channel: `user_elo_${userId}_${clubId}`,
      table: 'club_users',
      filter: userId && clubId ? `user_id=eq.${userId},club_id=eq.${clubId}` : undefined,
      event: 'UPDATE',
    },
    {
      enabled: !!(userId && clubId),
      onUpdate: (payload) => {
        console.log('📊 User ELO updated:', payload.new);
        if (onEloUpdate) {
          onEloUpdate();
        }
      },
      onError: (error) => {
        console.error('❌ User ELO subscription error:', error);
      },
    }
  );

  // Monitor connection status
  useEffect(() => {
    const statuses = {
      clubDetails: clubDetailsSubscription.isSubscribed,
      members: membersSubscription.isSubscribed,
      matches: matchesSubscription.isSubscribed,
      elo: eloSubscription.isSubscribed,
    };

    const allConnected = Object.values(statuses).every(status => status === true);

    if (allConnected && clubId) {
      console.log('✅ All club subscriptions connected successfully');
    } else if (clubId) {
      const disconnected = Object.entries(statuses)
        .filter(([_, status]) => !status)
        .map(([name]) => name);

      if (disconnected.length > 0) {
        console.warn('⚠️ Some subscriptions not connected:', disconnected);
      }
    }
  }, [
    clubDetailsSubscription.isSubscribed,
    membersSubscription.isSubscribed,
    matchesSubscription.isSubscribed,
    eloSubscription.isSubscribed,
    clubId
  ]);

  // Return subscription statuses and reconnect functions
  return {
    statuses: {
      clubDetails: clubDetailsSubscription.isSubscribed,
      members: membersSubscription.isSubscribed,
      matches: matchesSubscription.isSubscribed,
      elo: eloSubscription.isSubscribed,
    },
    reconnectAll: () => {
      clubDetailsSubscription.reconnect();
      membersSubscription.reconnect();
      matchesSubscription.reconnect();
      eloSubscription.reconnect();
    },
  };
}