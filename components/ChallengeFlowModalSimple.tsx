import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { challengeService, CreateChallengeData } from '@/services/challengeService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CalendarDatePicker } from './CalendarDatePicker';

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

const ChallengeFlowModalSimple: React.FC<ChallengeFlowModalProps> = ({
  clubId,
  targetPlayerId,
  targetPlayerName,
  isVisible,
  onClose,
  onSuccess,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  // Form state - similar to MatchInvitationForm
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setMatchType('singles');
    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    setSelectedDate(tomorrowStr);
    setTime('');
    setNotes('');
    setSelectedPlayer(null);
    
    // Auto-select target player if provided
    if (targetPlayerId && targetPlayerName) {
      setSelectedPlayer({ id: targetPlayerId, full_name: targetPlayerName });
      setNotes(`Hey ${targetPlayerName}! Want to play a match?`);
    }
  }, [targetPlayerId, targetPlayerName]);

  const loadAvailablePlayers = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: players, error } = await supabase
        .from('club_members')
        .select(`
          user_id,
          user:users(id, full_name)
        `)
        .eq('club_id', clubId)
        .neq('user_id', user.id); // Exclude current user

      if (error) {
        console.error('Failed to load players:', error);
        return;
      }

      const playersList = (players || []).map((member: any) => ({
        id: member.user_id,
        full_name: member.user.full_name
      }));

      setAvailablePlayers(playersList);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  }, [user, clubId]);

  // Initialize form
  useEffect(() => {
    if (isVisible) {
      resetForm();
      loadAvailablePlayers();
    }
  }, [isVisible, resetForm, loadAvailablePlayers]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validation - similar to MatchInvitationForm
    if (!selectedDate) {
      console.log('Validation failed: Date required');
      return;
    }

    if (!selectedPlayer) {
      console.log('Validation failed: Player required');
      return;
    }

    try {
      setIsSubmitting(true);

      const challengeData: CreateChallengeData = {
        club_id: clubId,
        challenger_id: user!.id,
        challenged_id: selectedPlayer.id,
        match_type: matchType,
        proposed_date: selectedDate,
        proposed_time: time || undefined,
        message: notes || undefined,
      };

      const challengeId = await challengeService.createChallenge(challengeData);

      console.log('Challenge sent successfully:', challengeId);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create challenge:', error);
      // Error will be handled by the form validation or logged for debugging
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header - identical to MatchInvitationForm */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Challenge Player</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            
            {/* Player Selection - ONLY DIFFERENCE from Looking to Play */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Challenge Opponent</ThemedText>
              <TouchableOpacity
                style={[styles.playerSelector, { borderColor: colors.tabIconDefault, backgroundColor: colors.card }]}
                onPress={() => setShowPlayerPicker(true)}
              >
                <ThemedText style={[styles.playerSelectorText, { color: selectedPlayer ? colors.text : colors.tabIconDefault }]}>
                  {selectedPlayer ? selectedPlayer.full_name : 'Select a player to challenge'}
                </ThemedText>
                <Ionicons name="chevron-down" size={20} color={colors.tabIconDefault} />
              </TouchableOpacity>
            </View>

            {/* Match Type - identical to MatchInvitationForm */}
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
                  onPress={() => setMatchType('singles')}
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
                  onPress={() => setMatchType('doubles')}
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

            {/* Date Selection - identical to MatchInvitationForm */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Date</ThemedText>
              <CalendarDatePicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                placeholder="Select date"
              />
              {selectedDate && (
                <ThemedText style={[styles.dateDisplay, { color: colors.tint }]}>
                  {formatDate(selectedDate)}
                </ThemedText>
              )}
            </View>

            {/* Time - identical to MatchInvitationForm */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Time (Optional)</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.tabIconDefault, color: colors.text }]}
                value={time}
                onChangeText={setTime}
                placeholder="e.g. 2:00 PM"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            {/* Message - identical to MatchInvitationForm (renamed from Notes) */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Message (Optional)</ThemedText>
              <TextInput
                style={[styles.textArea, { borderColor: colors.tabIconDefault, color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add a message for your challenge..."
                placeholderTextColor={colors.tabIconDefault}
                multiline={true}
                numberOfLines={3}
              />
            </View>

            {/* Submit Button - identical to MatchInvitationForm */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.tint }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Sending Challenge...' : 'Send Challenge'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Player Picker Modal */}
        <Modal
          visible={showPlayerPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowPlayerPicker(false)} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText style={styles.headerTitle}>Select Opponent</ThemedText>
              <View style={styles.headerSpacer} />
            </View>
            
            <ScrollView style={styles.scrollView}>
              {availablePlayers.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={[styles.playerItem, { borderBottomColor: colors.tabIconDefault + '30' }]}
                  onPress={() => {
                    setSelectedPlayer(player);
                    setShowPlayerPicker(false);
                  }}
                >
                  <ThemedText style={styles.playerName}>{player.full_name}</ThemedText>
                  {selectedPlayer?.id === player.id && (
                    <Ionicons name="checkmark" size={20} color={colors.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

export default ChallengeFlowModalSimple;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
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
  // Player selector specific styles
  playerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  playerSelectorText: {
    fontSize: 16,
    flex: 1,
  },
  // Radio button styles (identical to MatchInvitationForm)
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
  // Form input styles (identical to MatchInvitationForm)
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  dateDisplay: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Player picker styles
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  playerName: {
    fontSize: 16,
    flex: 1,
  },
});