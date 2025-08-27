import React from 'react';
import { ThemedView } from '@/components/ThemedView';
import { PlayerStatsDisplay } from '@/components/PlayerStatsDisplay';

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  singlesRecord: { wins: number; losses: number; winPercentage: number };
  doublesRecord: { wins: number; losses: number; winPercentage: number };
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

interface ProfileStatsProps {
  stats: PlayerStats | null;
  loading: boolean;
  error: string | null;
}

const ProfileStats = React.memo(function ProfileStats({ stats, loading, error }: ProfileStatsProps) {
  const defaultStats: PlayerStats = {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    singlesRecord: { wins: 0, losses: 0, winPercentage: 0 },
    doublesRecord: { wins: 0, losses: 0, winPercentage: 0 },
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
  };

  return (
    <ThemedView style={styles.section}>
      <PlayerStatsDisplay 
        stats={stats || defaultStats}
        loading={loading}
        error={error}
      />
    </ThemedView>
  );
});

export default ProfileStats;

const styles = {
  section: {
    paddingHorizontal: 16,  // iOS HIG: Standard margins
    paddingVertical: 16,
    marginBottom: 0,
  },
};