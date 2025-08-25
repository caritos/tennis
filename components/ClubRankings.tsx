import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { PlayerStats } from '@/services/matchService';

// Re-export the type from matchService
import type { RankedPlayer as ServiceRankedPlayer } from '@/services/matchService';

export type RankedPlayer = ServiceRankedPlayer;

interface ClubRankingsProps {
  rankings: RankedPlayer[];
  memberCount: number;
  onViewAll?: () => void;
  onPlayerPress?: (playerId: string) => void;
  onChallengePress?: (playerId: string, playerName: string) => void;
  showAll?: boolean;
  currentUserId?: string; // To hide challenge button for current user
  pendingChallenges?: Set<string>; // Players with pending challenges
}

// Helper function to get trending upward players
const getTrendingPlayers = (rankings: RankedPlayer[]): RankedPlayer[] => {
  // Filter for active players with good recent performance
  const trendingCandidates = rankings.filter(player => {
    // Must have played at least 1 match
    if (player.stats.totalMatches === 0) return false;
    
    // For players with fewer matches, they're "trending" if they have a good win rate
    if (player.stats.totalMatches <= 3) {
      return player.stats.winPercentage >= 50;
    }
    
    // For established players, look for high activity and good performance
    return player.stats.winPercentage >= 60 || player.stats.totalMatches >= 8;
  });
  
  // Sort by a combination of win percentage, recent activity, and points
  const sorted = trendingCandidates.sort((a, b) => {
    const aScore = (a.stats.winPercentage * 0.4) + (a.stats.totalMatches * 2) + ((a.points || 0) * 0.001);
    const bScore = (b.stats.winPercentage * 0.4) + (b.stats.totalMatches * 2) + ((b.points || 0) * 0.001);
    return bScore - aScore;
  });
  
  // Return top 3
  return sorted.slice(0, 3);
};

export function ClubRankings({ 
  rankings, 
  memberCount, 
  onViewAll, 
  onPlayerPress,
  onChallengePress,
  showAll = false,
  currentUserId,
  pendingChallenges = new Set()
}: ClubRankingsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Show trending players by default, or all if showAll is true
  const displayedRankings = showAll ? rankings : getTrendingPlayers(rankings);

  const renderTrophyIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <ThemedText style={styles.trophy}>🏆</ThemedText>;
      case 2:
        return <ThemedText style={styles.trophy}>🥈</ThemedText>;
      case 3:
        return <ThemedText style={styles.trophy}>🥉</ThemedText>;
      default:
        return null;
    }
  };

  const renderPlayer = (player: RankedPlayer) => {
    const winRate = player.stats.winPercentage;
    const record = `${player.stats.wins}-${player.stats.losses}`;
    const isCurrentUser = (player.playerId || player.id) === currentUserId;

    return (
      <View key={player.playerId || player.id} style={styles.rankingItem}>
        <View style={styles.playerContent}>
          <View style={styles.rankingLeft}>
            <ThemedText style={styles.rankNumber}>{player.ranking}.</ThemedText>
            <Ionicons name="person-circle-outline" size={24} color={colors.tabIconDefault} />
            <View style={styles.playerInfo}>
              <ThemedText style={styles.playerName} numberOfLines={1}>
                {player.playerName}
              </ThemedText>
              <View style={styles.statsRow}>
                <ThemedText style={[styles.record, { color: colors.tabIconDefault }]}>
                  {record}
                </ThemedText>
                <ThemedText style={[styles.winRate, { color: colors.tabIconDefault }]}>
                  ({winRate}%)
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.rankingCenter}>
            {renderTrophyIcon(player.ranking)}
            <View style={styles.pointsContainer}>
              <ThemedText style={styles.points}>{player.points} pts</ThemedText>
              {player.isProvisional && (
                <View style={[styles.provisionalBadge, { backgroundColor: colors.tabIconDefault + '20' }]}>
                  <ThemedText style={[styles.provisionalText, { color: colors.tabIconDefault }]}>
                    Provisional
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Challenge Button */}
        {!isCurrentUser && onChallengePress && (
          <TouchableOpacity
            style={[
              styles.challengeButton, 
              { borderColor: pendingChallenges.has(player.playerId || player.id) ? colors.tabIconDefault : colors.tint },
              pendingChallenges.has(player.playerId || player.id) && styles.challengeButtonDisabled
            ]}
            onPress={() => onChallengePress(player.playerId || player.id, player.playerName || player.name)}
            disabled={pendingChallenges.has(player.playerId || player.id)}
          >
            <ThemedText style={[
              styles.challengeButtonText, 
              { color: pendingChallenges.has(player.playerId || player.id) ? colors.tabIconDefault : colors.tint }
            ]}>
              {pendingChallenges.has(player.playerId || player.id) ? 'Pending' : 'Challenge'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {!showAll && onViewAll && rankings.length > 0 && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onViewAll}>
            <ThemedText style={[styles.viewAllLink, { color: colors.tint }]}>
              View All →
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {rankings.length > 0 ? (
        <View style={[styles.rankingsList, { borderColor: colors.tabIconDefault + '30' }]}>
          {displayedRankings.map((player, index) => (
            <React.Fragment key={player.playerId || player.id}>
              {renderPlayer(player)}
              {index < displayedRankings.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.tabIconDefault + '20' }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      ) : (
        <View style={[styles.placeholder, { borderColor: colors.tabIconDefault + '40' }]}>
          <ThemedText style={styles.placeholderEmoji}>🏆</ThemedText>
          <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
            No rankings yet • Be the first to play!
          </ThemedText>
          <ThemedText style={[styles.placeholderSubtext, { color: colors.tabIconDefault + '80' }]}>
            Play at least 5 matches to establish your ranking
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  rankingsList: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  playerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankingCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    width: 24,
  },
  playerInfo: {
    marginLeft: 8,
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  record: {
    fontSize: 12,
    marginRight: 8,
  },
  winRate: {
    fontSize: 12,
    fontWeight: '500',
  },
  trophy: {
    fontSize: 20,
    marginRight: 8,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
  },
  provisionalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  provisionalText: {
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  challengeButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  challengeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeButtonDisabled: {
    opacity: 0.6,
  },
});