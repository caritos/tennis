import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface TennisScoreDisplayProps {
  player1Name: string;
  player2Name: string;
  scores: string; // Format: "6-4,7-6(7-3),6-2"
  matchType: 'singles' | 'doubles';
  winner?: 1 | 2; // Which player won
  isCompleted?: boolean;
  showDuration?: boolean;
  duration?: string;
}

interface ParsedSet {
  player1Score: number;
  player2Score: number;
  tiebreak?: {
    player1: number;
    player2: number;
  };
}

export function TennisScoreDisplay({
  player1Name,
  player2Name,
  scores,
  matchType,
  winner,
  isCompleted = false,
  showDuration = false,
  duration
}: TennisScoreDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const parseScores = (scoreString: string): ParsedSet[] => {
    return scoreString.split(',').map(setScore => {
      // Handle tiebreak notation like "7-6(7-3)"
      const tiebreakMatch = setScore.match(/(\d+)-(\d+)\((\d+)-(\d+)\)/);
      if (tiebreakMatch) {
        return {
          player1Score: parseInt(tiebreakMatch[1]),
          player2Score: parseInt(tiebreakMatch[2]),
          tiebreak: {
            player1: parseInt(tiebreakMatch[3]),
            player2: parseInt(tiebreakMatch[4])
          }
        };
      }
      
      // Regular set score like "6-4"
      const parts = setScore.split('-');
      return {
        player1Score: parseInt(parts[0]) || 0,
        player2Score: parseInt(parts[1]) || 0
      };
    });
  };

  const sets = parseScores(scores);
  const maxSets = 5; // Show up to 5 sets

  const getMatchTypeDisplay = () => {
    return matchType === 'doubles' ? 'DOUBLES' : 'SINGLES';
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={[styles.matchType, { color: colors.tabIconDefault }]}>
          {getMatchTypeDisplay()}
        </ThemedText>
        {isCompleted && (
          <ThemedText style={[styles.status, { color: colors.tabIconDefault }]}>
            FINAL
          </ThemedText>
        )}
      </View>

      {/* Score Grid */}
      <View style={styles.scoreGrid}>
        {/* Column Headers */}
        <View style={styles.headerRow}>
          <View style={styles.playerNameColumn} />
          <ThemedText style={[styles.ptsLabel, { color: colors.tabIconDefault }]}>
            PTS
          </ThemedText>
          {Array.from({ length: maxSets }, (_, i) => (
            <View key={i} style={styles.setColumn}>
              <ThemedText style={[styles.setHeader, { color: colors.tabIconDefault }]}>
                {i + 1}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Player 1 Row */}
        <View style={styles.playerRow}>
          <View style={styles.playerInfo}>
            <View style={styles.playerIndicator}>
              {winner === 1 && (
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
              )}
            </View>
            <ThemedText 
              style={[styles.playerName, { color: colors.text }]}
              numberOfLines={matchType === 'doubles' ? 2 : 1}
            >
              {player1Name}
            </ThemedText>
          </View>
          <View style={styles.spacer} />
          {sets.map((set, index) => (
            <View key={index} style={styles.setColumn}>
              <ThemedText style={[
                styles.setScore,
                { color: colors.text },
                winner === 1 && styles.winnerScore
              ]}>
                {set.player1Score}
              </ThemedText>
              {set.tiebreak && (
                <ThemedText style={[styles.tiebreakScore, { color: colors.tabIconDefault }]}>
                  {set.tiebreak.player1}
                </ThemedText>
              )}
            </View>
          ))}
          {/* Fill empty columns */}
          {Array.from({ length: maxSets - sets.length }, (_, i) => (
            <View key={`empty-${i}`} style={styles.setColumn} />
          ))}
        </View>

        {/* Player 2 Row */}
        <View style={styles.playerRow}>
          <View style={styles.playerInfo}>
            <View style={styles.playerIndicator}>
              {winner === 2 && (
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
              )}
            </View>
            <ThemedText 
              style={[styles.playerName, { color: colors.text }]}
              numberOfLines={matchType === 'doubles' ? 2 : 1}
            >
              {player2Name}
            </ThemedText>
          </View>
          <View style={styles.spacer} />
          {sets.map((set, index) => (
            <View key={index} style={styles.setColumn}>
              <ThemedText style={[
                styles.setScore,
                { color: colors.text },
                winner === 2 && styles.winnerScore
              ]}>
                {set.player2Score}
              </ThemedText>
              {set.tiebreak && (
                <ThemedText style={[styles.tiebreakScore, { color: colors.tabIconDefault }]}>
                  {set.tiebreak.player2}
                </ThemedText>
              )}
            </View>
          ))}
          {/* Fill empty columns */}
          {Array.from({ length: maxSets - sets.length }, (_, i) => (
            <View key={`empty-${i}`} style={styles.setColumn} />
          ))}
        </View>
      </View>

      {/* Footer */}
      {(showDuration || isCompleted) && (
        <View style={styles.footer}>
          {showDuration && duration && (
            <ThemedText style={[styles.duration, { color: colors.tabIconDefault }]}>
              DURATION: {duration}
            </ThemedText>
          )}
          {isCompleted && (
            <ThemedText style={[styles.completed, { color: colors.tabIconDefault }]}>
              COMPLETED
            </ThemedText>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  matchType: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scoreGrid: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerNameColumn: {
    flex: 1,
  },
  ptsLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  setColumn: {
    width: 40,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  setHeader: {
    fontSize: 12,
    fontWeight: '500',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerIndicator: {
    width: 20,
    height: 20,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  spacer: {
    width: 32, // Space for PTS column
  },
  setScore: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  winnerScore: {
    color: '#4CAF50',
  },
  tiebreakScore: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  duration: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  completed: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});