import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { PlayerStats } from '@/services/matchService';

interface PlayerStatsDisplayProps {
  stats: PlayerStats;
  loading?: boolean;
  error?: string | null;
}

export function PlayerStatsDisplay({ stats, loading, error }: PlayerStatsDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Loading stats...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.errorContainer, { borderColor: colors.icon }]}>
        <ThemedText style={styles.errorText}>Unable to load stats</ThemedText>
        <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (stats.totalMatches === 0) {
    return (
      <ThemedView style={[styles.placeholderContainer, { borderColor: colors.icon }]}>
        <ThemedText style={styles.placeholderText}>No matches played yet</ThemedText>
        <ThemedText style={styles.placeholderSubtext}>Record your first match!</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Overall Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{stats.totalMatches}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Matches</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: colors.tint }]}>
            {stats.winPercentage}%
          </ThemedText>
          <ThemedText style={styles.statLabel}>Win Rate</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>
            {stats.wins}-{stats.losses}
          </ThemedText>
          <ThemedText style={styles.statLabel}>W-L Record</ThemedText>
        </View>
      </View>

      {/* Match Type Breakdown */}
      <View style={styles.breakdownSection}>
        <ThemedText style={styles.sectionTitle}>Match Breakdown</ThemedText>
        
        <View style={styles.matchTypeRow}>
          <View style={styles.matchTypeItem}>
            <ThemedText style={styles.matchTypeLabel}>Singles</ThemedText>
            <ThemedText style={styles.matchTypeRecord}>
              {stats.singlesRecord.wins}-{stats.singlesRecord.losses}
            </ThemedText>
            {stats.singlesRecord.wins + stats.singlesRecord.losses > 0 && (
              <ThemedText style={styles.matchTypePercentage}>
                ({stats.singlesRecord.winPercentage}%)
              </ThemedText>
            )}
          </View>
          
          <View style={styles.matchTypeItem}>
            <ThemedText style={styles.matchTypeLabel}>Doubles</ThemedText>
            <ThemedText style={styles.matchTypeRecord}>
              {stats.doublesRecord.wins}-{stats.doublesRecord.losses}
            </ThemedText>
            {stats.doublesRecord.wins + stats.doublesRecord.losses > 0 && (
              <ThemedText style={styles.matchTypePercentage}>
                ({stats.doublesRecord.winPercentage}%)
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      {/* Sets and Games Stats */}
      <View style={styles.detailedStatsSection}>
        <ThemedText style={styles.sectionTitle}>Detailed Stats</ThemedText>
        
        <View style={styles.detailedStatsRow}>
          <View style={styles.detailedStatItem}>
            <ThemedText style={styles.detailedStatValue}>
              {stats.setsWon}/{stats.setsWon + stats.setsLost}
            </ThemedText>
            <ThemedText style={styles.detailedStatLabel}>Sets Won</ThemedText>
            {stats.setsWon + stats.setsLost > 0 && (
              <ThemedText style={styles.detailedStatPercentage}>
                ({Math.round((stats.setsWon / (stats.setsWon + stats.setsLost)) * 100)}%)
              </ThemedText>
            )}
          </View>
          
          <View style={styles.detailedStatItem}>
            <ThemedText style={styles.detailedStatValue}>
              {stats.gamesWon}/{stats.gamesWon + stats.gamesLost}
            </ThemedText>
            <ThemedText style={styles.detailedStatLabel}>Games Won</ThemedText>
            {stats.gamesWon + stats.gamesLost > 0 && (
              <ThemedText style={styles.detailedStatPercentage}>
                ({Math.round((stats.gamesWon / (stats.gamesWon + stats.gamesLost)) * 100)}%)
              </ThemedText>
            )}
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#ff4444',
  },
  errorSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  placeholderContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  matchTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  matchTypeItem: {
    alignItems: 'center',
    flex: 1,
  },
  matchTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  matchTypeRecord: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  matchTypePercentage: {
    fontSize: 12,
    opacity: 0.7,
  },
  detailedStatsSection: {
    marginTop: 4,
  },
  detailedStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailedStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailedStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailedStatLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailedStatPercentage: {
    fontSize: 11,
    opacity: 0.6,
  },
});