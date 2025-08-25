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
import { useOptimizedState } from '@/hooks/useOptimizedState';

interface MatchHistoryViewProps {
  playerId: string;
  clubId?: string;
  onClaimMatch?: (matchId: string, playerPosition: 'player2' | 'player3' | 'player4') => void;
}

const MatchHistoryViewComponent: React.FC<MatchHistoryViewProps> = ({ playerId, clubId, onClaimMatch }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [matches, setMatches] = useOptimizedState<any[]>([], {
    debounceMs: 200,
    batchUpdates: true,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      
      // Use direct Supabase service
      const matchData = await getMatchHistory(playerId, clubId);
      
      // Process matches to add player names (from Supabase joins)
      const processedMatches = (matchData || []).map((match: any) => {
        // Extract player names from Supabase join results
        const player1_name = match.player1?.full_name || 'Unknown Player';
        const player2_name = match.player2?.full_name || match.opponent2_name || 'Unknown Opponent';
        const player3_name = match.player3?.full_name || match.partner3_name || null;
        const player4_name = match.player4?.full_name || match.partner4_name || null;
        
        return {
          ...match,
          player1_name,
          player2_name,
          player3_name,
          player4_name,
          club_name: 'Tennis Club' // TODO: Add club name from join if needed
        };
      });
      
      setMatches(processedMatches);
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
        // Determine which side the current player is on
        const isPlayer1Side = match.player1_id === playerId || match.player3_id === playerId;
        
        // Build player names and detect unregistered players
        let player1DisplayName, player2DisplayName;
        let isPlayer1Unregistered = false, isPlayer2Unregistered = false;
        let isPlayer3Unregistered = false, isPlayer4Unregistered = false;
        
        if (match.match_type === 'doubles') {
          // Player 1 side (player1 & player3)
          const p1Name = match.player1_name || 'Unknown';
          const p3Name = match.player3_name || match.partner3_name || 'Unknown';
          player1DisplayName = `${p1Name} & ${p3Name}`;
          
          // Check if player3 is unregistered (has partner3_name but no player3_id)
          isPlayer3Unregistered = !match.player3_id && !!match.partner3_name;
          
          // Player 2 side (player2 & player4)  
          const p2Name = match.player2_name || match.opponent2_name || 'Unknown';
          const p4Name = match.player4_name || match.partner4_name || 'Unknown';
          player2DisplayName = `${p2Name} & ${p4Name}`;
          
          // Check if players are unregistered
          isPlayer2Unregistered = !match.player2_id && !!match.opponent2_name;
          isPlayer4Unregistered = !match.player4_id && !!match.partner4_name;
        } else {
          // Singles match
          player1DisplayName = match.player1_name || 'Unknown';
          player2DisplayName = match.player2_name || match.opponent2_name || 'Unknown';
          
          // Check if player2 is unregistered (has opponent2_name but no player2_id)
          isPlayer2Unregistered = !match.player2_id && !!match.opponent2_name;
        }
        
        // Swap names and unregistered flags if current player is on player 2 side (to always show "You" perspective first)
        if (!isPlayer1Side) {
          [player1DisplayName, player2DisplayName] = [player2DisplayName, player1DisplayName];
          [isPlayer1Unregistered, isPlayer2Unregistered] = [isPlayer2Unregistered, isPlayer1Unregistered];
          [isPlayer3Unregistered, isPlayer4Unregistered] = [isPlayer4Unregistered, isPlayer3Unregistered];
        }

        // Proper winner determination using TennisScore utility
        let winner: 1 | 2 | undefined;
        try {
          const scoreObj = new TennisScore(match.scores);
          if (scoreObj.winner === 'player1') {
            winner = isPlayer1Side ? 1 : 2;
          } else if (scoreObj.winner === 'player2') {
            winner = isPlayer1Side ? 2 : 1;
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
              player1Name={player1DisplayName}
              player2Name={player2DisplayName}
              scores={match.scores}
              matchType={match.match_type}
              winner={winner}
              isCompleted={true}
              clubName={match.club_name}
              matchDate={match.date}
              notes={match.notes}
              matchId={match.id}
              player1Id={match.player1_id}
              player2Id={match.player2_id}
              player3Id={match.player3_id}
              player4Id={match.player4_id}
              isPlayer1Unregistered={isPlayer1Unregistered}
              isPlayer2Unregistered={isPlayer2Unregistered}
              isPlayer3Unregistered={isPlayer3Unregistered}
              isPlayer4Unregistered={isPlayer4Unregistered}
              unregisteredPlayer2Name={match.opponent2_name}
              unregisteredPlayer3Name={match.partner3_name}
              unregisteredPlayer4Name={match.partner4_name}
              onClaimMatch={onClaimMatch}
            />
          </View>
        );
      })}
    </View>
  );
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
    textAlign: 'center',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  matchItem: {
    marginBottom: 6,
  },
  matchMeta: {
    marginTop: 8,
  },
  matchDate: {
    fontSize: 14,
  },
});

MatchHistoryViewComponent.displayName = 'MatchHistoryView';

export const MatchHistoryView = React.memo(MatchHistoryViewComponent);