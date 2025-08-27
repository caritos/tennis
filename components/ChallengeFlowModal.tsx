import React, { useState, useEffect } from 'react';
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
import { challengeService, CreateChallengeData, CreateChallengeGroupData } from '@/services/challengeService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CalendarDatePicker } from './CalendarDatePicker';
import MatchTypeSelection from './challenge-flow/MatchTypeSelection';
import PlayerSelection from './challenge-flow/PlayerSelection';
import TimingOptions from './challenge-flow/TimingOptions';
import MessageSection from './challenge-flow/MessageSection';
import FormActions from './challenge-flow/FormActions';

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
    console.log('🎯 Challenge Modal Effect:', { isVisible, clubId, targetPlayerId, targetPlayerName });
    if (isVisible) {
      loadAvailablePlayers();
      resetForm();
    }
  }, [isVisible, clubId]);

  const resetForm = () => {
    console.log('🔄 Challenge Form Reset:', { targetPlayerId, targetPlayerName });
    
    setMatchType('singles');
    setSelectedTime('tomorrow');
    setMessage('');
    setSelectedPlayers([]);
    setPlayerSearchText('');
    
    // Auto-select target player if provided
    if (targetPlayerId && targetPlayerName) {
      console.log('✅ Auto-selecting target player:', { targetPlayerId, targetPlayerName });
      setSelectedPlayers([{ id: targetPlayerId, full_name: targetPlayerName }]);
      setMessage(`Hey ${targetPlayerName}! Want to play a match?`);
    } else {
      console.log('❌ No target player provided for auto-selection');
    }
  };

  const loadAvailablePlayers = async () => {
    if (!clubId || !user) return;

    try {
      setIsLoadingPlayers(true);

      // Get all club members except the current user from Supabase
      const { data: members, error } = await supabase
        .from('club_members')
        .select(`
          user:users (
            id,
            full_name
          )
        `)
        .eq('club_id', clubId)
        .neq('user_id', user.id);

      if (error) {
        console.error('Failed to load club members:', error);
        throw error;
      }

      // Transform the joined data to Player format
      const players: Player[] = (members || [])
        .filter(member => member.user) // Filter out null users
        .map(member => ({
          id: (member.user as any).id,
          full_name: (member.user as any).full_name
        }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name));

      setAvailablePlayers(players);
    } catch (error) {
      console.error('Failed to load players:', error);
      // Error logged for debugging
    } finally {
      setIsLoadingPlayers(false);
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

  const handleMatchTypeChange = (type: 'singles' | 'doubles') => {
    setMatchType(type);
    setPlayerSearchText('');
    // Reset to only target player for singles
    if (type === 'singles' && targetPlayerId && targetPlayerName) {
      setSelectedPlayers([{ id: targetPlayerId, full_name: targetPlayerName }]);
    } else if (type === 'doubles' && targetPlayerId && targetPlayerName) {
      // Keep target player when switching to doubles
      setSelectedPlayers([{ id: targetPlayerId, full_name: targetPlayerName }]);
    } else {
      setSelectedPlayers([]);
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
        // Challenge group for singles (1-to-1)
        const challengeData: CreateChallengeGroupData = {
          club_id: clubId,
          created_by: user.id,
          match_type: matchType,
          challenger_team_ids: [user.id], // Just the current user
          challenged_team_ids: [selectedPlayers[0].id], // Just the challenged player
          proposed_date: selectedTime !== 'flexible' ? selectedTime : undefined,
          message: message.trim() || undefined,
          expires_at: expiresAt.toISOString(),
        };

        await challengeService.createChallengeGroup(challengeData);

        console.log('Challenge sent successfully to single player:', selectedPlayers[0].full_name);
      } else {
        // Challenge group for doubles (2-to-2)
        // For doubles, we need to determine teams
        // Current approach: user + first selected player vs. remaining selected players
        if (selectedPlayers.length !== 3) {
          throw new Error('Doubles requires exactly 3 other players to be selected');
        }

        const challengeData: CreateChallengeGroupData = {
          club_id: clubId,
          created_by: user.id,
          match_type: matchType,
          challenger_team_ids: [user.id, selectedPlayers[0].id], // User + first selected player
          challenged_team_ids: [selectedPlayers[1].id, selectedPlayers[2].id], // Remaining players
          proposed_date: selectedTime !== 'flexible' ? selectedTime : undefined,
          message: message.trim() || undefined,
          expires_at: expiresAt.toISOString(),
        };

        await challengeService.createChallengeGroup(challengeData);

        const playerNames = selectedPlayers.map(p => p.full_name).join(', ');
        console.log('Challenge sent successfully to doubles players:', playerNames);
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Failed to create challenge:', error);
      // Error logged for debugging
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    return 'Challenge Match';
  };

  const canSubmit = () => {
    const result = matchType === 'singles' ? selectedPlayers.length === 1 : selectedPlayers.length === 3;
    
    console.log('🔍 Challenge Form Debug:', {
      matchType,
      selectedPlayersCount: selectedPlayers.length,
      selectedPlayers,
      canSubmit: result,
      targetPlayerId,
      targetPlayerName,
      note: matchType === 'doubles' ? 'Doubles requires 3 other players (total 4 including you)' : 'Singles requires 1 other player'
    });
    
    return result;
  };


  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
            <MatchTypeSelection
              matchType={matchType}
              onMatchTypeChange={handleMatchTypeChange}
              colors={colors}
            />

            {matchType === 'doubles' && (
              <PlayerSelection
                selectedPlayers={selectedPlayers}
                availablePlayers={availablePlayers}
                playerSearchText={playerSearchText}
                isLoadingPlayers={isLoadingPlayers}
                targetPlayerId={targetPlayerId}
                colors={colors}
                onPlayerToggle={handlePlayerToggle}
                onSearchTextChange={setPlayerSearchText}
              />
            )}

            <TimingOptions
              selectedTime={selectedTime}
              onTimeChange={setSelectedTime}
              colors={colors}
            />

            <MessageSection
              message={message}
              matchType={matchType}
              onMessageChange={setMessage}
              colors={colors}
            />
          </View>
        </ScrollView>

        <FormActions
          matchType={matchType}
          canSubmit={canSubmit()}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          colors={colors}
        />
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
    // iOS HIG compliant touch target (minimum 44x44 points)
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17, // iOS HIG standard font size for navigation titles
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 44, // Match backButton minimum width for symmetry
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16, // iOS HIG recommended 16pt margins
  },
});