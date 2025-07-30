import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useClubBadges } from './useClubBadges';

/**
 * Hook that sets up real-time listeners for badge updates
 * This handles app state changes and notification updates
 */
export function useBadgeListener() {
  const { user } = useAuth();
  const { forceRefresh } = useClubBadges();
  const appState = useRef(AppState.currentState);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Set up app state change listener
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state change:', appState.current, '->', nextAppState);
      
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, refresh badges
        console.log('App foregrounded, refreshing badges');
        forceRefresh();
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, [forceRefresh]);

  // Set up periodic refresh while app is active
  useEffect(() => {
    if (!user?.id) return;

    // Refresh badges every 2 minutes while app is active
    const startPeriodicRefresh = () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }

      refreshInterval.current = setInterval(() => {
        if (AppState.currentState === 'active') {
          console.log('Periodic badge refresh');
          forceRefresh();
        }
      }, 2 * 60 * 1000); // 2 minutes
    };

    startPeriodicRefresh();

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, [user?.id, forceRefresh]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);
}

/**
 * Hook for manual badge refresh (useful for pull-to-refresh)
 */
export function useBadgeRefresh() {
  const { forceRefresh, loading } = useClubBadges();

  const refresh = async () => {
    console.log('Manual badge refresh triggered');
    await forceRefresh();
  };

  return {
    refresh,
    refreshing: loading
  };
}