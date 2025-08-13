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

  // Show top 5 by default, or all if showAll is true
  const displayedRankings = showAll ? rankings : rankings.slice(0, 5);

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
    const isCurrentUser = player.playerId === currentUserId;

    return (
      <View key={player.playerId} style={styles.rankingItem}>
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
              { borderColor: pendingChallenges.has(player.playerId) ? colors.tabIconDefault : colors.tint },
              pendingChallenges.has(player.playerId) && styles.challengeButtonDisabled
            ]}
            onPress={() => onChallengePress(player.playerId, player.playerName)}
            disabled={pendingChallenges.has(player.playerId)}
          >
            <ThemedText style={[
              styles.challengeButtonText, 
              { color: pendingChallenges.has(player.playerId) ? colors.tabIconDefault : colors.tint }
            ]}>
              {pendingChallenges.has(player.playerId) ? 'Pending' : 'Challenge'}
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
            <React.Fragment key={player.playerId}>
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
    borderWidth: 1,
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