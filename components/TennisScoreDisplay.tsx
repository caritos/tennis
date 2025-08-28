import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to create readable match IDs for easy identification
const getReadableMatchId = (matchId: string): string => {
  // Take first 6 characters after any dashes and format as "M-ABC123"
  const cleanId = matchId.replace(/-/g, '').toUpperCase().slice(0, 6);
  return `M-${cleanId}`;
};

interface TennisScoreDisplayProps {
  player1Name: string;
  player2Name: string;
  scores: string; // Format: "6-4,7-6(7-3),6-2"
  matchType?: 'singles' | 'doubles';
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
  isPlayer1Unregistered?: boolean;
  isPlayer2Unregistered?: boolean;
  isPlayer3Unregistered?: boolean;
  isPlayer4Unregistered?: boolean;
  unregisteredPlayer2Name?: string;
  unregisteredPlayer3Name?: string;
  unregisteredPlayer4Name?: string;
  onClaimMatch?: (matchId: string, playerPosition: 'player2' | 'player3' | 'player4') => void;
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
  matchType = 'singles',
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
  player4Id,
  isPlayer1Unregistered = false,
  isPlayer2Unregistered = false,
  isPlayer3Unregistered = false,
  isPlayer4Unregistered = false,
  unregisteredPlayer2Name,
  unregisteredPlayer3Name,
  unregisteredPlayer4Name,
  onClaimMatch
}: TennisScoreDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showNotesModal, setShowNotesModal] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

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
  const actualSetsPlayed = sets.length; // Only show sets that were actually played
  
  // Dynamic styling based on number of sets
  const isCompactLayout = actualSetsPlayed >= 5;
  const setColumnWidth = isCompactLayout ? 30 : 40;
  const scoreSize = isCompactLayout ? 16 : 18;
  const nameSize = isCompactLayout ? 13 : 14;

  // Check if current user can edit this match
  const canEdit = matchId && user?.id && (
    user.id === player1Id ||
    user.id === player2Id ||
    user.id === player3Id ||
    user.id === player4Id
  );

  // Check if current user is already a participant in this match
  const isUserParticipant = user?.id && (
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

  const handleClaimConfirmation = (playerName: string, playerPosition: 'player2' | 'player3' | 'player4') => {
    if (!matchId || !onClaimMatch) return;
    
    Alert.alert(
      'Claim Match',
      `Are you "${playerName}"?\n\nThis will add this match to your personal record and you'll be able to edit the match details.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Claim Match',
          style: 'default',
          onPress: () => onClaimMatch(matchId, playerPosition),
        },
      ]
    );
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Compact header with club name and date */}
      {(clubName || matchDate) && (
        <View style={[styles.clubHeader, { borderBottomColor: colors.tabIconDefault + '20' }]}>
          <View style={styles.clubHeaderContent}>
            <ThemedText style={[styles.clubHeaderText, { color: colors.tabIconDefault }]}>
              {clubName}{clubName && matchDate && ' • '}{matchDate && formatMatchDate(matchDate)}
            </ThemedText>
            {matchId && (
              <View style={[styles.matchIdBadge, { backgroundColor: colors.tabIconDefault + '10', borderColor: colors.tabIconDefault + '40' }]}>
                <ThemedText style={[styles.matchIdText, { color: colors.tabIconDefault }]}>
                  {getReadableMatchId(matchId)}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Score Grid */}
      <View style={styles.scoreGrid}>
        
        {/* Column Headers */}
        <View style={styles.headerRow}>
          <View style={styles.playerInfo}>
            {/* Action icons in top-left corner */}
            <View style={styles.actionIcons}>
              {canEdit && (
                <TouchableOpacity
                  onPress={handleEditMatch}
                  style={styles.editIconInline}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={14} color={colors.tint} />
                </TouchableOpacity>
              )}
              {notes && notes.trim() && (
                <TouchableOpacity
                  onPress={() => setShowNotesModal(true)}
                  style={styles.notesIconInline}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text" size={14} color={colors.tabIconDefault} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {Array.from({ length: actualSetsPlayed }, (_, i) => (
            <View key={i} style={[styles.setColumn, { minWidth: setColumnWidth }]}>
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
            <View style={styles.playerNameWithButton}>
              <ThemedText 
                style={[styles.playerName, { color: colors.text, fontSize: nameSize }]}
                numberOfLines={matchType === 'doubles' ? 2 : 1}
                ellipsizeMode="tail"
              >
                {player1Name}
              </ThemedText>
              {(isPlayer1Unregistered || isPlayer3Unregistered) && matchId && onClaimMatch && !isUserParticipant && (
                <TouchableOpacity
                  style={[styles.claimButton, { backgroundColor: colors.tint }]}
                  onPress={() => {
                    if (isPlayer1Unregistered && player1Name) {
                      // For singles: claim player1 position (shouldn't happen as player1 is always the recorder)
                      console.warn('Player1 is unregistered - this should not happen');
                    } else if (isPlayer3Unregistered && unregisteredPlayer3Name) {
                      handleClaimConfirmation(unregisteredPlayer3Name, 'player3');
                    }
                  }}
                >
                  <ThemedText style={styles.claimButtonText}>
                    {isPlayer3Unregistered ? 'claim partner' : 'unregistered'}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {sets.map((set, index) => (
            <View key={index} style={[styles.setColumn, { minWidth: setColumnWidth }]}>
              <ThemedText style={[
                styles.setScore,
                { color: colors.text, fontSize: scoreSize },
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
            <View style={styles.playerNameWithButton}>
              <ThemedText 
                style={[styles.playerName, { color: colors.text, fontSize: nameSize }]}
                numberOfLines={matchType === 'doubles' ? 2 : 1}
                ellipsizeMode="tail"
              >
                {player2Name}
              </ThemedText>
              {(isPlayer2Unregistered || isPlayer4Unregistered) && matchId && onClaimMatch && !isUserParticipant && (
                <TouchableOpacity
                  style={[styles.claimButton, { backgroundColor: colors.tint }]}
                  onPress={() => {
                    if (isPlayer2Unregistered && unregisteredPlayer2Name) {
                      handleClaimConfirmation(unregisteredPlayer2Name, 'player2');
                    } else if (isPlayer4Unregistered && unregisteredPlayer4Name) {
                      handleClaimConfirmation(unregisteredPlayer4Name, 'player4');
                    }
                  }}
                >
                  <ThemedText style={styles.claimButtonText}>
                    {isPlayer2Unregistered ? 'claim opponent' : isPlayer4Unregistered ? 'claim partner' : 'unregistered'}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {sets.map((set, index) => (
            <View key={index} style={[styles.setColumn, { minWidth: setColumnWidth }]}>
              <ThemedText style={[
                styles.setScore,
                { color: colors.text, fontSize: scoreSize },
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  clubHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  clubName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchDate: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  notesIcon: {
    padding: 4,
    borderRadius: 4,
  },
  editIcon: {
    padding: 4,
    borderRadius: 4,
  },
  actionIcons: {
    position: 'absolute',
    top: -2,
    left: 0,
    flexDirection: 'row',
    gap: 4,
  },
  editIconInline: {
    padding: 3,
    borderRadius: 4,
  },
  notesIconInline: {
    padding: 3,
    borderRadius: 4,
  },
  scoreGrid: {
    padding: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  setColumn: {
    minWidth: 35, // Reduce from 45 to 35
    flex: 1, // Allow flex sizing
    maxWidth: 45, // Cap maximum width
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1, // Reduce from 2 to 1
  },
  setHeader: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100, // Ensure minimum space for names
    flex: 1,
  },
  playerIndicator: {
    width: 20,
    height: 20,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 14, // Slightly smaller for better fit
    fontWeight: '500',
    flex: 1,
    minWidth: 90, // Ensure minimum readable width
  },
  playerNameWithButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  claimButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  claimButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  setScore: {
    fontSize: 18, // Slightly smaller for better fit with 6 sets
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  winnerScore: {
    color: '#4CAF50',
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
  clubHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchIdBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchIdText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});