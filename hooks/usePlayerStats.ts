import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { PlayerStats, getMatchStats } from '@/services/matchService';

interface UsePlayerStatsReturn {
  stats: PlayerStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function usePlayerStats(playerId: string | null, clubId?: string): UsePlayerStatsReturn {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!playerId) {
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const playerStats = await getMatchStats(playerId, clubId);
      setStats(playerStats);
    } catch (err) {
      console.error('Failed to load player stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [playerId, clubId]);

  const refreshStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reload stats when the screen comes into focus (to catch new matches)
  useFocusEffect(
    useCallback(() => {
      if (playerId) {
        loadStats();
      }
    }, [playerId, loadStats])
  );

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}