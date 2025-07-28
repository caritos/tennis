import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { getMatchHistory } from '@/services/matchService';
import { Match } from '@/lib/supabase';
import { TennisScoreDisplay } from './TennisScoreDisplay';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { logError } from '@/utils/errorHandling';

interface MatchHistoryViewProps {
  playerId: string;
  clubId?: string;
}

export function MatchHistoryView({ playerId, clubId }: MatchHistoryViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      
      const matchHistory = await getMatchHistory(playerId, clubId);
      setMatches(matchHistory);
    } catch (err) {
      logError('MatchHistoryView.loadMatches', err, playerId);
      setError('Failed to load match history');
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [playerId, clubId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches(true);
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMatchTypeIcon = (matchType: string) => {
    return matchType === 'doubles' ? 'people' : 'person';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.tabIconDefault,
      textAlign: 'center',
      marginTop: 12,
    },
    errorText: {
      fontSize: 16,
      color: '#F44336',
      textAlign: 'center',
      marginTop: 12,
    },
    matchCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    matchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    matchDate: {
      fontSize: 14,
      color: colors.tabIconDefault,
    },
    matchTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    matchTypeText: {
      fontSize: 14,
      color: colors.tabIconDefault,
      textTransform: 'capitalize',
    },
    matchPlayers: {
      marginBottom: 12,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    playerText: {
      fontSize: 14,
      color: colors.text,
    },
    opponentText: {
      fontSize: 14,
      color: colors.tabIconDefault,
    },
    vsText: {
      fontSize: 14,
      color: colors.tabIconDefault,
      marginHorizontal: 8,
    },
    scoreContainer: {
      marginTop: 8,
    },
    winBadge: {
      backgroundColor: '#4CAF50',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 8,
    },
    lossBadge: {
      backgroundColor: '#F44336',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 8,
    },
    resultText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    notesContainer: {
      marginTop: 8,
      padding: 8,
      backgroundColor: colors.tabIconSelected + '10',
      borderRadius: 8,
    },
    notesText: {
      fontSize: 12,
      color: colors.tabIconDefault,
      fontStyle: 'italic',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Ionicons name="tennisball" size={48} color={colors.tabIconDefault} />
        <Text style={styles.emptyText}>No matches recorded yet</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
    >
      {matches.map((match) => {
        const isPlayer1 = match.player1_id === playerId;
        const didWin = isPlayer1 ? match.scores.includes('W') : match.scores.includes('L');
        
        return (
          <ThemedView key={match.id} style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchDate}>{formatMatchDate(match.date)}</Text>
              <View style={styles.matchTypeContainer}>
                <Ionicons
                  name={getMatchTypeIcon(match.match_type)}
                  size={16}
                  color={colors.tabIconDefault}
                />
                <Text style={styles.matchTypeText}>{match.match_type}</Text>
              </View>
            </View>

            <View style={styles.matchPlayers}>
              <View style={styles.playerRow}>
                <ThemedText style={styles.playerText}>You</ThemedText>
                {match.match_type === 'doubles' && match.partner3_name && (
                  <ThemedText style={styles.playerText}> & {match.partner3_name}</ThemedText>
                )}
                <Text style={styles.vsText}>vs</Text>
                <ThemedText style={styles.opponentText}>
                  {match.opponent2_name || 'Opponent'}
                </ThemedText>
                {match.match_type === 'doubles' && match.partner4_name && (
                  <ThemedText style={styles.opponentText}> & {match.partner4_name}</ThemedText>
                )}
              </View>
            </View>

            <View style={styles.scoreContainer}>
              <TennisScoreDisplay
                scores={match.scores}
                player1Name="You"
                player2Name={match.opponent2_name || 'Opponent'}
                matchType={match.match_type}
                isCompleted={true}
              />
            </View>

            {match.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesText}>{match.notes}</Text>
              </View>
            )}
          </ThemedView>
        );
      })}
    </ScrollView>
  );
}