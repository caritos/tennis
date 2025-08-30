import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MatchRecordingForm } from '../../components/MatchRecordingForm';
import { ReportModal } from '../../components/ReportModal';
import { recordMatch, CreateMatchData } from '../../services/matchService';
import { safetyService } from '../../services/safetyService';
import { challengeService } from '../../services/challengeService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ChallengeData {
  id: string;
  match_type: 'singles' | 'doubles';
  proposed_date: string;
  club_id: string;
  club_name?: string;
  challenger: {
    id: string;
    full_name: string;
    phone?: string;
  };
  challenged: {
    id: string;
    full_name: string;
    phone?: string;
  };
  status: string;
}

interface ChallengeGroupData {
  id: string;
  match_type: 'singles' | 'doubles';
  proposed_date: string;
  club_id: string;
  club_name?: string;
  players: {
    id: string;
    full_name: string;
    phone?: string;
    role: 'challenger' | 'challenged';
    status: 'pending' | 'accepted' | 'declined';
  }[];
  status: string;
}

export default function RecordChallengeMatchScreen() {
  const router = useRouter();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [challengeGroup, setChallengeGroup] = useState<ChallengeGroupData | null>(null);
  const [isLegacyChallenge, setIsLegacyChallenge] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [_reportingPlayers, _setReportingPlayers] = useState<string[]>([]);

  const loadChallenge = async () => {
    if (!challengeId) return;
    
    try {
      setLoading(true);
      
      // First try to fetch as a challenge group (new system)
      const challengeGroupData = await challengeService.getChallengeGroupById(challengeId);
      
      if (challengeGroupData) {
        // Verify challenge group is accepted and ready for match recording
        if (challengeGroupData.status !== 'accepted') {
          throw new Error('Challenge must be accepted before recording match results');
        }
        
        setChallengeGroup(challengeGroupData);
        setIsLegacyChallenge(false);
        return;
      }
      
      // If not found as challenge group, try legacy challenge
      const challengeData = await challengeService.getChallengeById(challengeId);
      
      if (!challengeData) {
        throw new Error('Challenge not found');
      }

      // Verify challenge is accepted and ready for match recording
      if (challengeData.status !== 'accepted') {
        throw new Error('Challenge must be accepted before recording match results');
      }

      setChallenge(challengeData);
      setIsLegacyChallenge(true);
      
    } catch (error) {
      console.error('Failed to load challenge:', error);
      showError('Error', 'Failed to load challenge details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  const handleSaveMatch = async (matchData: CreateMatchData, reportData?: { playerIds: string[], type: string, description: string }) => {
    if ((!challenge && !challengeGroup) || !user) return;

    try {
      setIsSubmitting(true);

      let _players: { id: string; full_name: string; phone?: string }[] = [];
      let challengeIdForMatch: string;
      let challengeGroupIdForMatch: string | undefined;

      if (isLegacyChallenge && challenge) {
        // Legacy challenge - 2 players
        _players = [challenge.challenger, challenge.challenged];
        challengeIdForMatch = challenge.id;
      } else if (!isLegacyChallenge && challengeGroup) {
        // Challenge group - all players
        _players = challengeGroup.players.map(p => ({
          id: p.id,
          full_name: p.full_name,
          phone: p.phone
        }));
        challengeIdForMatch = challengeGroup.id; // Use group ID as challenge ID
        challengeGroupIdForMatch = challengeGroup.id;
      } else {
        throw new Error('No valid challenge data found');
      }

      // Save match first
      const savedMatch = await recordMatch({
        ...matchData,
        challenge_id: challengeIdForMatch,
        challenge_group_id: challengeGroupIdForMatch
      });

      // Update challenge status to completed
      if (isLegacyChallenge && challenge) {
        await challengeService.completeChallenge(challenge.id, savedMatch.id);
      }
      // TODO: Add completeChallenge method for challenge groups

      // Handle reports if any
      if (reportData && reportData.playerIds.length > 0) {
        for (const playerId of reportData.playerIds) {
          await safetyService.submitReport({
            reporterId: user.id,
            reportedUserId: playerId,
            reportType: reportData.type as any,
            description: `Challenge-based report: ${reportData.description}`,
            challengeId: isLegacyChallenge ? challenge!.id : challengeGroup!.id
          });
        }
      }

      showSuccess(
        'Match Recorded!',
        `Challenge match has been saved successfully${reportData?.playerIds.length ? ' and reports submitted' : ''}.`
      );
      router.back();
    } catch (error) {
      console.error('Failed to save match:', error);
      showError('Error', 'Failed to save match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReport = async (reportData: {
    type: string;
    description: string;
    reportedPlayerIds?: string[];
    matchContext?: any;
  }) => {
    if (!user || !reportData.reportedPlayerIds?.length || !challenge) return;

    try {
      for (const playerId of reportData.reportedPlayerIds) {
        await safetyService.submitReport({
          reporterId: user.id,
          reportedUserId: playerId,
          reportType: reportData.type as any,
          description: reportData.description,
          challengeId: challenge.id
        });
      }
      setReportModalVisible(false);
      showSuccess('Report Submitted', 'Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Failed to submit report:', error);
      showError('Error', 'Failed to submit report. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading challenge details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!challenge && !challengeGroup) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ThemedText>Challenge not found</ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={[styles.backButtonText, { color: colors.tint }]}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get current challenge data (either legacy or group)
  const currentChallenge = isLegacyChallenge ? challenge : challengeGroup;
  if (!currentChallenge) return null;

  // Get players array
  const players = isLegacyChallenge && challenge 
    ? [challenge.challenger, challenge.challenged]
    : challengeGroup?.players.map(p => ({
        id: p.id, 
        full_name: p.full_name, 
        phone: p.phone
      })) || [];

  // For legacy challenges, determine the other player
  const otherPlayer = isLegacyChallenge && challenge 
    ? (challenge.challenger.id === user?.id ? challenge.challenged : challenge.challenger)
    : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Record Challenge Results</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Challenge Info */}
        <ThemedView style={[styles.matchInfo, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
          <ThemedText style={[styles.matchInfoTitle, { color: colors.tint }]}>
            ⚔️ Challenge Match
          </ThemedText>
          <ThemedText style={styles.matchInfoText}>
            {currentChallenge.match_type.charAt(0).toUpperCase() + currentChallenge.match_type.slice(1)} challenge
          </ThemedText>
          <ThemedText style={[styles.matchInfoText, { color: colors.tabIconDefault }]}>
            {new Date(currentChallenge.proposed_date).toLocaleDateString()} at {currentChallenge.club_name}
          </ThemedText>
          <ThemedText style={[styles.playersTitle, { marginTop: 8 }]}>Players:</ThemedText>
          {players.map((player, _index) => (
            <ThemedText key={player.id} style={[styles.playerName, { color: colors.tabIconDefault }]}>
              • {player.full_name}
              {!isLegacyChallenge && challengeGroup && (
                <ThemedText style={{ fontWeight: '500' }}>
                  {' '}({challengeGroup.players.find(p => p.id === player.id)?.role === 'challenger' ? 'Challenger' : 'Challenged'})
                </ThemedText>
              )}
              {isLegacyChallenge && challenge && (
                <ThemedText style={{ fontWeight: '500' }}>
                  {' '}({player.id === challenge.challenger.id ? 'Challenger' : 'Challenged'})
                </ThemedText>
              )}
              {player.phone && ` (${player.phone})`}
            </ThemedText>
          ))}
        </ThemedView>

        <MatchRecordingForm
          onSave={handleSaveMatch}
          clubId={currentChallenge.club_id}
          matchType={currentChallenge.match_type}
          players={players}
          showReporting={true}
          winnerSectionTitle="Match Winners"
          isSubmitting={isSubmitting}
        />
      </ScrollView>

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmitReport={handleSubmitReport}
        matchContext={{
          invitationId: currentChallenge.id, // Use invitationId field for compatibility
          matchDate: currentChallenge.proposed_date,
          matchType: currentChallenge.match_type,
          clubName: currentChallenge.club_name,
          players: otherPlayer ? [{
            id: otherPlayer.id,
            name: otherPlayer.full_name,
            phone: otherPlayer.phone
          }] : players.map(p => ({
            id: p.id,
            name: p.full_name,
            phone: p.phone
          }))
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // iOS HIG recommended margins
    paddingVertical: 12,   // Reduced vertical padding for better proportions
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // iOS HIG compliant touch target
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17, // iOS HIG standard font size for navigation titles
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44, // Match headerBackButton minimum width for symmetry
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // iOS HIG recommended margins
  },
  matchInfo: {
    padding: 16,
    borderRadius: 12, // iOS HIG rounded corner radius
    borderWidth: 1,
    marginBottom: 16, // Consistent spacing
  },
  matchInfoTitle: {
    fontSize: 17, // iOS HIG body font size
    fontWeight: '600',
    marginBottom: 8,
  },
  matchInfoText: {
    fontSize: 15, // iOS HIG subheadline font size
    marginBottom: 4,
  },
  playersTitle: {
    fontSize: 15, // Consistent with matchInfoText
    fontWeight: '500',
  },
  playerName: {
    fontSize: 15, // Consistent with other text
    marginLeft: 8,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32, // Better balance for error states
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    // iOS HIG compliant touch target
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 17, // iOS HIG button font size
    fontWeight: '500',
  },
});