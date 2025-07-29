import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export interface PlayerCardData {
  id: string;
  name: string;
  ranking?: number;
  points?: number;
  winPercentage?: number;
  totalMatches?: number;
  wins?: number;
  losses?: number;
  phone?: string;
  contactPreference?: 'phone' | 'text' | 'whatsapp';
  isChampion?: boolean;
  isRunnerUp?: boolean;
  isThirdPlace?: boolean;
}

interface PlayerCardProps {
  player: PlayerCardData;
  showRanking?: boolean;
  showStats?: boolean;
  showContact?: boolean;
  onPress?: () => void;
  onChallengePress?: () => void;
  compact?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  showRanking = true,
  showStats = true,
  showContact = false,
  onPress,
  onChallengePress,
  compact = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getTrophyIcon = () => {
    if (player.isChampion) return '🏆';
    if (player.isRunnerUp) return '🥈';
    if (player.isThirdPlace) return '🥉';
    return null;
  };

  const getContactIcon = () => {
    switch (player.contactPreference) {
      case 'whatsapp':
        return 'logo-whatsapp';
      case 'text':
        return 'chatbubble';
      case 'phone':
        return 'call';
      default:
        return 'call';
    }
  };

  const formatWinPercentage = (percentage?: number) => {
    if (percentage === undefined) return 'N/A';
    return `${Math.round(percentage)}%`;
  };

  const cardContent = (
    <View style={[
      styles.container,
      compact ? styles.compactContainer : styles.fullContainer,
      { 
        backgroundColor: colors.background,
        borderColor: colors.tabIconDefault + '30'
      }
    ]}>
      {/* Header with Name and Trophy */}
      <View style={styles.header}>
        <View style={styles.nameSection}>
          <View style={[styles.avatar, { backgroundColor: colors.tint + '20' }]}>
            <ThemedText style={[styles.initial, { color: colors.tint }]}>
              {player.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          
          <View style={styles.nameInfo}>
            <View style={styles.nameRow}>
              <ThemedText style={styles.name}>{player.name}</ThemedText>
              {getTrophyIcon() && (
                <ThemedText style={styles.trophy}>{getTrophyIcon()}</ThemedText>
              )}
            </View>
            
            {showRanking && player.ranking && (
              <ThemedText style={[styles.ranking, { color: colors.tabIconDefault }]}>
                Rank #{player.ranking}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Challenge Button */}
        {onChallengePress && (
          <TouchableOpacity
            style={[styles.challengeButton, { borderColor: colors.tint }]}
            onPress={onChallengePress}
          >
            <Ionicons name="fitness" size={16} color={colors.tint} />
            <ThemedText style={[styles.challengeText, { color: colors.tint }]}>
              Challenge
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Section */}
      {showStats && !compact && (
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {player.points !== undefined && (
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: colors.tint }]}>
                  {player.points}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  Points
                </ThemedText>
              </View>
            )}
            
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.tint }]}>
                {formatWinPercentage(player.winPercentage)}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                Win Rate
              </ThemedText>
            </View>
            
            {player.totalMatches !== undefined && (
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: colors.tint }]}>
                  {player.totalMatches}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  Matches
                </ThemedText>
              </View>
            )}
          </View>
          
          {(player.wins !== undefined && player.losses !== undefined) && (
            <View style={styles.recordSection}>
              <ThemedText style={[styles.recordText, { color: colors.tabIconDefault }]}>
                {player.wins}W - {player.losses}L
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Compact Stats */}
      {showStats && compact && (
        <View style={styles.compactStats}>
          <ThemedText style={[styles.compactStatsText, { color: colors.tabIconDefault }]}>
            {formatWinPercentage(player.winPercentage)} • {player.totalMatches || 0} matches
          </ThemedText>
        </View>
      )}

      {/* Contact Section */}
      {showContact && player.phone && (
        <View style={styles.contactSection}>
          <TouchableOpacity 
            style={[styles.contactButton, { borderColor: colors.tint }]}
          >
            <Ionicons 
              name={getContactIcon() as any} 
              size={16} 
              color={colors.tint} 
            />
            <ThemedText style={[styles.contactText, { color: colors.tint }]}>
              Contact
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullContainer: {
    // Default full padding
  },
  compactContainer: {
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initial: {
    fontSize: 20,
    fontWeight: '600',
  },
  nameInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  trophy: {
    fontSize: 18,
  },
  ranking: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  challengeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  recordSection: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactStats: {
    marginTop: 4,
  },
  compactStatsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactSection: {
    marginTop: 12,
    alignItems: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
  },
});