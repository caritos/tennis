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
import { Colors } from '@/constants/Colors';
import { getMatchHistory } from '@/services/matchService';
import { Match } from '@/lib/supabase';
import { TennisScoreDisplay } from './TennisScoreDisplay';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { logError } from '@/utils/errorHandling';
import { TennisScore } from '@/utils/tennisScore';

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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={[styles.errorText, { color: '#F44336' }]}>{error}</Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="tennisball" size={48} color={colors.tabIconDefault} />
        <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
          No matches recorded yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {matches.map((match) => {
        // Determine player names for doubles
        const player1Name = match.match_type === 'doubles' && match.partner3_name ? 
          `You & ${match.partner3_name}` : "You";
        const player2Name = match.match_type === 'doubles' && match.partner4_name ? 
          `${match.opponent2_name || 'Opponent'} & ${match.partner4_name}` : 
          match.opponent2_name || 'Opponent';

        // Proper winner determination using TennisScore utility
        let winner: 1 | 2 | undefined;
        try {
          const scoreObj = new TennisScore(match.scores);
          if (scoreObj.winner === 'player1') {
            winner = 1;
          } else if (scoreObj.winner === 'player2') {
            winner = 2;
          }
        } catch (error) {
          console.warn('Failed to parse tennis score:', match.scores);
        }

        return (
          <View key={match.id} style={[styles.matchItem, { 
            borderColor: colors.tabIconDefault + '30',
            backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF' 
          }]}>
            <TennisScoreDisplay
              player1Name={player1Name}
              player2Name={player2Name}
              scores={match.scores}
              matchType={match.match_type}
              winner={winner}
              isCompleted={true}
              clubName={match.club_name || 'Tennis Club'}
              matchDate={match.date}
              notes={match.notes}
              matchId={match.id}
              player1Id={match.player1_id}
              player2Id={match.player2_id}
              player3Id={match.player3_id}
              player4Id={match.player4_id}
            />
          </View>
        );
      })}
    </View>
  );
}

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
    textAlign: 'center',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  matchItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  matchMeta: {
    marginTop: 8,
  },
  matchDate: {
    fontSize: 14,
  },
});