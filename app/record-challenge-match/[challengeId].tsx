import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MatchRecordingForm } from '../../components/MatchRecordingForm';
import { ReportModal } from '../../components/ReportModal';
import { recordMatch, CreateMatchData } from '../../services/matchService';
import { safetyService } from '../../services/safetyService';
import { challengeService } from '../../services/challengeService';
import { useAuth } from '../../contexts/AuthContext';
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

export default function RecordChallengeMatchScreen() {
  const router = useRouter();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportingPlayers, setReportingPlayers] = useState<string[]>([]);

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  const loadChallenge = async () => {
    if (!challengeId) return;
    
    try {
      setLoading(true);
      // Fetch challenge details from challengeService
      const challengeData = await challengeService.getChallengeById(challengeId);
      
      if (!challengeData) {
        throw new Error('Challenge not found');
      }

      // Verify challenge is accepted and ready for match recording
      if (challengeData.status !== 'accepted') {
        throw new Error('Challenge must be accepted before recording match results');
      }

      setChallenge(challengeData);
    } catch (error) {
      console.error('Failed to load challenge:', error);
      Alert.alert('Error', 'Failed to load challenge details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMatch = async (matchData: CreateMatchData, reportData?: { playerIds: string[], type: string, description: string }) => {
    if (!challenge || !user) return;

    try {
      setIsSubmitting(true);

      // Create match players array
      const players = [challenge.challenger, challenge.challenged];

      // Save match first
      const savedMatch = await recordMatch({
        ...matchData,
        challenge_id: challenge.id // Link to challenge instead of invitation
      });

      // Update challenge status to completed and link to match
      await challengeService.completeChallenge(challenge.id, savedMatch.id);

      // Handle reports if any
      if (reportData && reportData.playerIds.length > 0) {
        for (const playerId of reportData.playerIds) {
          await safetyService.submitReport({
            reporterId: user.id,
            reportedUserId: playerId,
            reportType: reportData.type as any,
            description: `Challenge-based report: ${reportData.description}`,
            challengeId: challenge.id
          });
        }
      }

      Alert.alert(
        'Match Recorded!',
        `Challenge match has been saved successfully${reportData?.playerIds.length ? ' and reports submitted' : ''}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to save match:', error);
      Alert.alert('Error', 'Failed to save match. Please try again.');
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
      Alert.alert('Report Submitted', 'Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Failed to submit report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
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

  if (!challenge) {
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

  const otherPlayer = challenge.challenger.id === user?.id ? challenge.challenged : challenge.challenger;
  const players = [challenge.challenger, challenge.challenged];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
          <ThemedText style={styles.backText}>Back</ThemedText>
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
            {challenge.match_type.charAt(0).toUpperCase() + challenge.match_type.slice(1)} challenge
          </ThemedText>
          <ThemedText style={[styles.matchInfoText, { color: colors.tabIconDefault }]}>
            {new Date(challenge.proposed_date).toLocaleDateString()} at {challenge.club_name}
          </ThemedText>
          <ThemedText style={[styles.playersTitle, { marginTop: 8 }]}>Players:</ThemedText>
          <ThemedText style={[styles.playerName, { color: colors.tabIconDefault }]}>
            • {challenge.challenger.full_name} (Challenger) {challenge.challenger.phone && `(${challenge.challenger.phone})`}
          </ThemedText>
          <ThemedText style={[styles.playerName, { color: colors.tabIconDefault }]}>
            • {challenge.challenged.full_name} (Challenged) {challenge.challenged.phone && `(${challenge.challenged.phone})`}
          </ThemedText>
        </ThemedView>

        <MatchRecordingForm
          onSave={handleSaveMatch}
          clubId={challenge.club_id}
          matchType={challenge.match_type}
          players={players}
          showReporting={true}
          isSubmitting={isSubmitting}
        />
      </ScrollView>

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmitReport={handleSubmitReport}
        matchContext={{
          invitationId: challenge.id, // Use invitationId field for compatibility
          matchDate: challenge.proposed_date,
          matchType: challenge.match_type,
          clubName: challenge.club_name,
          players: [{
            id: otherPlayer.id,
            name: otherPlayer.full_name,
            phone: otherPlayer.phone
          }]
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  matchInfo: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  matchInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  matchInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  playersTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  playerName: {
    fontSize: 14,
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
    paddingHorizontal: 40,
  },
  backButton: {
    marginTop: 16,
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});