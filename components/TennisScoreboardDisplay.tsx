import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TennisSet, MatchWinner } from '@/types/tennis';

export interface TennisScoreboardDisplayProps {
  player1Name: string;
  player2Name: string;
  sets: TennisSet[];
  matchType: 'singles' | 'doubles';
  winner?: MatchWinner;
  isComplete?: boolean;
  showStatus?: boolean;
  compact?: boolean;
  style?: any;
}

export function TennisScoreboardDisplay({
  player1Name,
  player2Name,
  sets,
  matchType,
  winner = null,
  isComplete = false,
  showStatus = true,
  compact = false,
  style
}: TennisScoreboardDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Calculate sets won
  const player1SetsWon = sets.filter(set => set.playerScore > set.opponentScore).length;
  const player2SetsWon = sets.filter(set => set.opponentScore > set.playerScore).length;

  // Determine winner if not provided
  const actualWinner = winner || (player1SetsWon >= 2 ? 'player1' : player2SetsWon >= 2 ? 'player2' : null);
  
  // Auto-detect if match is complete
  const matchComplete = isComplete || actualWinner !== null;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: compact ? 6 : 8,
      padding: compact ? 8 : 12,
      marginVertical: compact ? 4 : 8,
      borderWidth: 1,
      borderColor: colors.tabIconDefault + '20',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: compact ? 8 : 16,
    },
    matchType: {
      fontSize: compact ? 12 : 14,
      fontWeight: '600',
      color: colors.tabIconDefault,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    status: {
      fontSize: compact ? 12 : 14,
      fontWeight: '600',
      color: matchComplete ? '#4CAF50' : colors.tabIconDefault,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    scoreTable: {
      borderRadius: 6,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: colors.tabIconDefault + '10',
      paddingVertical: 4,
    },
    playerRow: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: colors.tabIconDefault + '30',
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    playerNameCell: {
      flex: matchType === 'doubles' ? 4 : 3,
      padding: compact ? 8 : 12,
      paddingVertical: matchType === 'doubles' ? 12 : (compact ? 8 : 12),
      justifyContent: 'center',
      minHeight: matchType === 'doubles' ? 60 : undefined,
    },
    setHeaderCell: {
      flex: 1,
      padding: compact ? 6 : 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lastSetHeaderCell: {
      borderRightWidth: 0,
    },
    setScoreCell: {
      flex: 1,
      padding: compact ? 6 : 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    lastSetScoreCell: {
      borderRightWidth: 0,
    },
    winnerRow: {
      backgroundColor: '#4CAF50' + '15',
    },
    playerName: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      flexWrap: 'wrap',
    },
    winnerName: {
      fontSize: compact ? 14 : 16,
      fontWeight: '700',
      color: '#4CAF50',
      flexWrap: 'wrap',
    },
    setHeader: {
      fontSize: compact ? 10 : 12,
      fontWeight: '600',
      color: colors.tabIconDefault,
    },
    setScore: {
      fontSize: compact ? 16 : 18,
      fontWeight: '700',
      color: colors.text,
    },
    winnerScore: {
      fontSize: compact ? 16 : 18,
      fontWeight: '700',
      color: '#4CAF50',
    },
    emptyScore: {
      fontSize: compact ? 16 : 18,
      fontWeight: '700',
      color: colors.tabIconDefault + '40',
    },
    tiebreakSuperscript: {
      fontSize: compact ? 8 : 10,
      color: colors.tabIconDefault,
      marginLeft: 1,
      marginTop: compact ? -2 : -3,
      fontWeight: '600',
      lineHeight: compact ? 10 : 12,
    },
    winnerIcon: {
      marginLeft: 8,
      fontSize: 16,
      color: '#4CAF50',
    },
  });

  const renderSetScore = (set: TennisSet | undefined, setIndex: number, isPlayer: boolean) => {
    if (!set) {
      return <Text style={styles.emptyScore}>-</Text>;
    }

    const score = isPlayer ? set.playerScore : set.opponentScore;
    const opponentScore = isPlayer ? set.opponentScore : set.playerScore;
    const isWinningScore = score > opponentScore;
    const isWinner = actualWinner === (isPlayer ? 'player1' : 'player2');
    
    const scoreStyle = matchComplete && isWinner && isWinningScore ? styles.winnerScore : styles.setScore;
    
    return (
      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={scoreStyle}>{score}</Text>
          {set.tiebreak && (
            <Text style={styles.tiebreakSuperscript}>
              {isPlayer ? set.tiebreak.playerScore : set.tiebreak.opponentScore}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderPlayerRow = (name: string, isPlayer: boolean) => {
    const isWinner = actualWinner === (isPlayer ? 'player1' : 'player2');
    const rowStyle = [
      styles.playerRow,
      sets.length === 0 ? styles.lastRow : {},
      matchComplete && isWinner ? styles.winnerRow : {},
    ];
    
    // For doubles, format team names nicely
    const formatDoublesName = () => {
      if (matchType === 'doubles' && name.includes(' & ')) {
        const players = name.split(' & ');
        return (
          <View>
            <Text style={matchComplete && isWinner ? styles.winnerName : styles.playerName}>
              {players[0]}
            </Text>
            <Text style={[matchComplete && isWinner ? styles.winnerName : styles.playerName, { fontSize: compact ? 12 : 14, marginTop: 2 }]}>
              & {players[1]}
            </Text>
          </View>
        );
      }
      return name;
    };
    
    const displayName = formatDoublesName();
    
    return (
      <View style={rowStyle}>
        <View style={styles.playerNameCell}>
          {typeof displayName === 'string' ? (
            <Text style={matchComplete && isWinner ? styles.winnerName : styles.playerName}>
              {displayName}
            </Text>
          ) : (
            <View>
              {displayName}
            </View>
          )}
        </View>
        {[0, 1, 2, 3, 4].map((setIndex) => (
          <View 
            key={setIndex} 
            style={[
              styles.setScoreCell,
              matchComplete && isWinner ? styles.winnerRow : {},
            ]}
          >
            {renderSetScore(sets[setIndex], setIndex, isPlayer)}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {showStatus && (
        <View style={styles.header}>
          <Text style={styles.matchType}>{matchType.toUpperCase()}</Text>
          {matchComplete && (
            <Text style={styles.status}>FINAL</Text>
          )}
        </View>
      )}
      
      <View style={styles.scoreTable}>
        
        {/* Player Rows */}
        {renderPlayerRow(player1Name, true)}
        {renderPlayerRow(player2Name, false)}
      </View>
    </View>
  );
}