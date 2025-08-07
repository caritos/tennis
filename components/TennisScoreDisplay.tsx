import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface TennisScoreDisplayProps {
  player1Name: string;
  player2Name: string;
  scores: string; // Format: "6-4,7-6(7-3),6-2"
  matchType: 'singles' | 'doubles';
  winner?: 1 | 2; // Which player won
  isCompleted?: boolean;
  showDuration?: boolean;
  duration?: string;
  clubName?: string;
  matchDate?: string;
  notes?: string;
  matchId?: string; // Required for edit functionality
  player1Id?: string;
  player2Id?: string;
  player3Id?: string;
  player4Id?: string;
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
  duration,
  clubName,
  matchDate,
  notes,
  matchId,
  player1Id,
  player2Id,
  player3Id,
  player4Id
}: TennisScoreDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showNotesModal, setShowNotesModal] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const parseScores = (scoreString: string): ParsedSet[] => {
    // Handle invalid scores gracefully
    if (!scoreString || typeof scoreString !== 'string') {
      console.warn('Invalid score string:', scoreString);
      return [];
    }
    
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
  const actualSetsPlayed = sets.length; // Only show sets that were actually played

  // Check if current user can edit this match
  const canEdit = matchId && user?.id && (
    user.id === player1Id ||
    user.id === player2Id ||
    user.id === player3Id ||
    user.id === player4Id
  );

  const handleEditMatch = () => {
    console.log('🎾 handleEditMatch called with matchId:', matchId);
    if (matchId) {
      // Navigate to the proper edit screen with matchId parameter
      console.log('🎾 Navigating to edit screen with matchId:', matchId);
      router.push(`/edit-match/${matchId}`);
    } else {
      console.error('🎾 No matchId available for editing');
    }
  };

  const formatMatchDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.warn('Invalid date string:', dateString);
      return dateString;
    }
  };

  // Truncate long names for better display
  const truncateName = (name: string, maxLength: number = 25) => {
    if (!name) return 'Unknown Player';
    if (name.length <= maxLength) return name;
    
    // For doubles names with '&', try to truncate each part
    if (name.includes(' & ')) {
      const parts = name.split(' & ');
      const truncatedParts = parts.map(part => 
        part.length > 12 ? part.substring(0, 12) + '...' : part
      );
      return truncatedParts.join(' & ');
    }
    
    return name.substring(0, maxLength) + '...';
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={[styles.clubName, { color: colors.tabIconDefault }]}>
            {clubName || 'Tennis Club'}
          </ThemedText>
          <View style={[
            styles.matchTypeBadge, 
            { backgroundColor: matchType === 'singles' ? '#E3F2FD' : '#FFF3E0' }
          ]}>
            <ThemedText style={[
              styles.matchTypeText,
              { color: matchType === 'singles' ? '#1976D2' : '#F57C00' }
            ]}>
              {matchType === 'singles' ? '1v1' : '2v2'}
            </ThemedText>
          </View>
        </View>
        <View style={styles.headerRight}>
          <ThemedText style={[styles.matchDate, { color: colors.tabIconDefault }]}>
            {matchDate ? formatMatchDate(matchDate) : ''}
          </ThemedText>
          {notes && notes.trim() && (
            <TouchableOpacity
              onPress={() => setShowNotesModal(true)}
              style={styles.notesIcon}
              activeOpacity={0.7}
              accessibilityLabel="View match notes"
              accessibilityRole="button"
            >
              <Ionicons name="document-text" size={16} color={colors.tabIconDefault} />
            </TouchableOpacity>
          )}
          {canEdit && (
            <TouchableOpacity
              onPress={handleEditMatch}
              style={styles.editIcon}
              activeOpacity={0.7}
              accessibilityLabel="Edit match"
              accessibilityRole="button"
            >
              <Ionicons name="pencil" size={16} color={colors.tint} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Score Grid */}
      <View style={styles.scoreGrid}>
        {/* Column Headers */}
        <View style={styles.headerRow}>
          <View style={styles.playerInfo}>
            {/* Empty space to match player row structure */}
          </View>
          {Array.from({ length: actualSetsPlayed }, (_, i) => (
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
              ellipsizeMode="tail"
            >
              {truncateName(player1Name)}
            </ThemedText>
          </View>
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
              ellipsizeMode="tail"
            >
              {truncateName(player2Name)}
            </ThemedText>
          </View>
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
        </View>
      </View>

      {/* Footer */}
      {showDuration && duration && (
        <View style={styles.footer}>
          <ThemedText style={[styles.duration, { color: colors.tabIconDefault }]}>
            DURATION: {duration}
          </ThemedText>
        </View>
      )}

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Match Notes</ThemedText>
              <TouchableOpacity
                onPress={() => setShowNotesModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <ThemedText style={[styles.notesText, { color: colors.text }]}>
                {notes}
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clubName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginRight: 12,
  },
  matchTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  matchTypeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchDate: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  notesIcon: {
    padding: 4,
    borderRadius: 4,
  },
  editIcon: {
    padding: 4,
    borderRadius: 4,
  },
  scoreGrid: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  setColumn: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    paddingVertical: 4,
  },
  setHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    width: '100%',
    letterSpacing: 0.5,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingVertical: 4,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '65%',
    marginRight: 8,
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
    fontWeight: '600',
    flex: 1,
    minWidth: 100,
    lineHeight: 20,
  },
  setScore: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
    letterSpacing: -0.5,
  },
  winnerScore: {
    color: '#2E7D32',
    textShadowColor: '#4CAF50',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tiebreakScore: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    width: '100%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    maxWidth: '90%',
    maxHeight: '70%',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 22,
  },
});