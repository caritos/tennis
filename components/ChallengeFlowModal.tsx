import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { challengeService, CreateChallengeData } from '@/services/challengeService';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { initializeDatabase } from '@/database/database';

interface Player {
  id: string;
  full_name: string;
}

interface ChallengeFlowModalProps {
  clubId: string;
  targetPlayerId?: string; // Pre-selected player from rankings
  targetPlayerName?: string;
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TimeOption = 'today' | 'tomorrow' | 'weekend' | 'next_week' | 'flexible';

const ChallengeFlowModal: React.FC<ChallengeFlowModalProps> = ({
  clubId,
  targetPlayerId,
  targetPlayerName,
  isVisible,
  onClose,
  onSuccess,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  // Form data
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [selectedTime, setSelectedTime] = useState<TimeOption>('tomorrow');
  const [message, setMessage] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [playerSearchText, setPlayerSearchText] = useState('');

  // UI state
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadAvailablePlayers();
      resetForm();
    }
  }, [isVisible, clubId]);

  const resetForm = () => {
    setMatchType('singles');
    setSelectedTime('tomorrow');
    setMessage('');
    setSelectedPlayers([]);
    setPlayerSearchText('');
    
    // Auto-select target player if provided
    if (targetPlayerId && targetPlayerName) {
      setSelectedPlayers([{ id: targetPlayerId, full_name: targetPlayerName }]);
      setMessage(`Hey ${targetPlayerName}! Want to play a match?`);
    }
  };

  const loadAvailablePlayers = async () => {
    if (!clubId || !user) return;

    try {
      setIsLoadingPlayers(true);
      const db = await initializeDatabase();

      // Get all club members except the current user
      const players = await db.getAllAsync(
        `SELECT u.id, u.full_name 
         FROM users u
         JOIN club_members cm ON u.id = cm.user_id
         WHERE cm.club_id = ? AND u.id != ?
         ORDER BY u.full_name ASC`,
        [clubId, user.id]
      );

      setAvailablePlayers(players as Player[]);
    } catch (error) {
      console.error('Failed to load players:', error);
      showError('Error', 'Failed to load club members');
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const getTimingText = (option: TimeOption): string => {
    switch (option) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'weekend': return 'This Weekend';
      case 'next_week': return 'Next Week';
      case 'flexible': return 'Flexible';
    }
  };

  const handlePlayerToggle = (player: Player) => {
    const isSelected = selectedPlayers.some(p => p.id === player.id);
    
    if (isSelected) {
      // Don't allow deselecting the target player 
      if (player.id === targetPlayerId) {
        return;
      }
      setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
    } else {
      if (matchType === 'singles') {
        // For singles, only one player can be selected
        setSelectedPlayers([player]);
      } else {
        // For doubles, maximum 3 players total
        if (selectedPlayers.length < 3) {
          setSelectedPlayers(prev => [...prev, player]);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!user || selectedPlayers.length === 0) return;

    try {
      setIsSubmitting(true);

      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      if (matchType === 'singles') {
        // Single challenge for singles
        const challengeData: CreateChallengeData = {
          club_id: clubId,
          challenger_id: user.id,
          challenged_id: selectedPlayers[0].id,
          match_type: matchType,
          proposed_date: selectedTime !== 'flexible' ? selectedTime : undefined,
          message: message.trim() || undefined,
          expires_at: expiresAt.toISOString(),
        };

        await challengeService.createChallenge(challengeData);

        showSuccess(
          'Challenge Sent!',
          `Your ${matchType} challenge has been sent to ${selectedPlayers[0].full_name}.`
        );
      } else {
        // Multiple challenges for doubles (send to each player individually)
        for (const player of selectedPlayers) {
          const challengeData: CreateChallengeData = {
            club_id: clubId,
            challenger_id: user.id,
            challenged_id: player.id,
            match_type: matchType,
            proposed_date: selectedTime !== 'flexible' ? selectedTime : undefined,
            message: message.trim() || undefined,
            expires_at: expiresAt.toISOString(),
          };

          await challengeService.createChallenge(challengeData);
        }

        const playerNames = selectedPlayers.map(p => p.full_name).join(', ');
        showSuccess(
          'Invites Sent!',
          `Your doubles invitation has been sent to: ${playerNames}.`
        );
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Failed to create challenge:', error);
      showError(
        'Failed to Send Challenge',
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    if (matchType === 'doubles') {
      return 'Doubles Challenge';
    }
    return targetPlayerName ? `Challenge ${targetPlayerName}` : 'Challenge';
  };

  const canSubmit = () => {
    if (matchType === 'singles') {
      return selectedPlayers.length === 1;
    }
    return selectedPlayers.length === 3;
  };

  const getSubmitButtonText = () => {
    if (matchType === 'singles') {
      return 'Send Challenge';
    }
    return 'Send Invites';
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.tabIconDefault + '30' }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            {getModalTitle()}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Match Type */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Match Type</ThemedText>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    { borderColor: colors.tabIconDefault },
                    matchType === 'singles' && { 
                      borderColor: colors.tint,
                      backgroundColor: colors.tint + '10'
                    }
                  ]}
                  onPress={() => {
                    setMatchType('singles');
                    setPlayerSearchText('');
                    // Reset to only target player for singles
                    if (targetPlayerId && targetPlayerName) {
                      setSelectedPlayers([{ id: targetPlayerId, full_name: targetPlayerName }]);
                    }
                  }}
                >
                  <View style={[
                    styles.radioCircle,
                    { borderColor: colors.tabIconDefault },
                    matchType === 'singles' && { borderColor: colors.tint }
                  ]}>
                    {matchType === 'singles' && (
                      <View style={[styles.radioFill, { backgroundColor: colors.tint }]} />
                    )}
                  </View>
                  <ThemedText style={styles.radioLabel}>Singles</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    { borderColor: colors.tabIconDefault },
                    matchType === 'doubles' && { 
                      borderColor: colors.tint,
                      backgroundColor: colors.tint + '10'
                    }
                  ]}
                  onPress={() => {
                    setMatchType('doubles');
                    setPlayerSearchText('');
                    // Keep target player when switching to doubles
                    if (targetPlayerId && targetPlayerName) {
                      setSelectedPlayers([{ id: targetPlayerId, full_name: targetPlayerName }]);
                    } else {
                      setSelectedPlayers([]);
                    }
                  }}
                >
                  <View style={[
                    styles.radioCircle,
                    { borderColor: colors.tabIconDefault },
                    matchType === 'doubles' && { borderColor: colors.tint }
                  ]}>
                    {matchType === 'doubles' && (
                      <View style={[styles.radioFill, { backgroundColor: colors.tint }]} />
                    )}
                  </View>
                  <ThemedText style={styles.radioLabel}>Doubles</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Player Selection for Doubles */}
            {matchType === 'doubles' && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionLabel}>
                  {targetPlayerId 
                    ? `Select 2 more players for doubles (${selectedPlayers.length}/3 selected)`
                    : `Select 3 players to invite for doubles (${selectedPlayers.length}/3 selected)`
                  }
                </ThemedText>

                {/* Selected Players Display */}
                {selectedPlayers.length > 0 && (
                  <View style={styles.selectedPlayersContainer}>
                    <ThemedText style={[styles.selectedLabel, { color: colors.tabIconDefault }]}>
                      Selected players:
                    </ThemedText>
                    <View style={styles.selectedPlayersList}>
                      {selectedPlayers.map((player) => (
                        <View
                          key={player.id}
                          style={[styles.playerChip, { backgroundColor: colors.tint + '20' }]}
                        >
                          <ThemedText style={styles.playerChipText}>
                            {player.full_name}
                          </ThemedText>
                          <TouchableOpacity
                            onPress={() => handlePlayerToggle(player)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            disabled={player.id === targetPlayerId} // Don't allow removing the target player
                          >
                            <Ionicons 
                              name={player.id === targetPlayerId ? "lock-closed" : "close-circle"} 
                              size={20} 
                              color={player.id === targetPlayerId ? colors.tabIconDefault : colors.tint} 
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <Ionicons 
                    name="search" 
                    size={20} 
                    color={colors.tabIconDefault} 
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={[
                      styles.searchInput,
                      {
                        color: colors.text,
                        backgroundColor: colors.card,
                      }
                    ]}
                    placeholder="Search players by name..."
                    placeholderTextColor={colors.tabIconDefault}
                    value={playerSearchText}
                    onChangeText={setPlayerSearchText}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {playerSearchText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setPlayerSearchText('')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.tabIconDefault} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Available Players List */}
                <View style={[styles.availablePlayersList, { maxHeight: 200 }]}>
                  {isLoadingPlayers ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.tint} />
                      <ThemedText style={[styles.loadingText, { color: colors.tabIconDefault }]}>
                        Loading players...
                      </ThemedText>
                    </View>
                  ) : (
                    <ScrollView showsVerticalScrollIndicator={true}>
                      {availablePlayers
                        .filter(player => {
                          // Filter by search text
                          const matchesSearch = player.full_name.toLowerCase().includes(playerSearchText.toLowerCase());
                          // Don't show already selected players
                          const notSelected = !selectedPlayers.some(p => p.id === player.id);
                          return matchesSearch && notSelected;
                        })
                        .map((player) => (
                          <TouchableOpacity
                            key={player.id}
                            style={[styles.availablePlayerItem, { borderColor: colors.tabIconDefault + '30' }]}
                            onPress={() => {
                              if (selectedPlayers.length < 3) {
                                handlePlayerToggle(player);
                                setPlayerSearchText(''); // Clear search after selection
                              }
                            }}
                            disabled={selectedPlayers.length >= 3}
                          >
                            <ThemedText style={[
                              styles.playerName,
                              selectedPlayers.length >= 3 && { opacity: 0.5 }
                            ]}>
                              {player.full_name}
                            </ThemedText>
                            <Ionicons 
                              name="add-circle-outline" 
                              size={22} 
                              color={selectedPlayers.length >= 3 ? colors.tabIconDefault : colors.tint} 
                            />
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  )}
                </View>

                <ThemedText style={[styles.doublesNote, { color: colors.tabIconDefault }]}>
                  Teams will be decided when you meet up.
                </ThemedText>
              </View>
            )}

            {/* Timing Options */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>When would you like to play?</ThemedText>
              <View style={styles.timingGrid}>
                {(['today', 'tomorrow', 'weekend', 'next_week', 'flexible'] as TimeOption[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.timingOption,
                      { borderColor: colors.tabIconDefault },
                      selectedTime === option && { 
                        borderColor: colors.tint,
                        backgroundColor: colors.tint + '10'
                      }
                    ]}
                    onPress={() => setSelectedTime(option)}
                  >
                    <View style={[
                      styles.radioCircle,
                      { borderColor: colors.tabIconDefault },
                      selectedTime === option && { borderColor: colors.tint }
                    ]}>
                      {selectedTime === option && (
                        <View style={[styles.radioFill, { backgroundColor: colors.tint }]} />
                      )}
                    </View>
                    <ThemedText style={styles.timingLabel}>{getTimingText(option)}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Message */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Message (Optional)</ThemedText>
              <TextInput
                style={[
                  styles.messageInput,
                  {
                    borderColor: colors.tabIconDefault,
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                ]}
                value={message}
                onChangeText={setMessage}
                placeholder={matchType === 'singles' 
                  ? "Hey! Want to play a match?" 
                  : "Want to play doubles? We'll figure out teams when we get there!"
                }
                placeholderTextColor={colors.tabIconDefault}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { borderTopColor: colors.tabIconDefault + '30' }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.tabIconDefault }]}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.tint },
              (!canSubmit() || isSubmitting) && { opacity: 0.6 }
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color="white" />
                <ThemedText style={styles.submitButtonText}>Sending...</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.submitButtonText}>
                {getSubmitButtonText()}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ChallengeFlowModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  playersList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  playerCheckboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  autoSelectedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  doublesNote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
    minWidth: '48%',
  },
  timingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedPlayersContainer: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  selectedPlayersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  playerChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  availablePlayersList: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  availablePlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
});