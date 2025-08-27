import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MatchRecordingForm } from '../../components/MatchRecordingForm';
import { ReportModal } from '../../components/ReportModal';
import { recordMatch, CreateMatchData } from '../../services/matchService';
import { safetyService } from '../../services/safetyService';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface MatchInvitationData {
  id: string;
  match_type: 'singles' | 'doubles';
  match_date: string;
  club_id: string;
  club_name?: string;
  confirmed_players: {
    id: string;
    full_name: string;
    phone?: string;
  }[];
}

export default function RecordMatchInvitationScreen() {
  const router = useRouter();
  const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [invitation, setInvitation] = useState<MatchInvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportingPlayers, setReportingPlayers] = useState<string[]>([]);

  useEffect(() => {
    loadInvitation();
  }, [invitationId]);

  const loadInvitation = async () => {
    if (!invitationId) return;
    
    try {
      setLoading(true);
      // In a real implementation, this would fetch from Supabase
      // For now, using mock data structure based on existing code
      const mockInvitation: MatchInvitationData = {
        id: invitationId,
        match_type: 'singles',
        match_date: new Date().toISOString(),
        club_id: 'demo-club-123',
        club_name: 'Demo Tennis Club',
        confirmed_players: [
          { id: user?.id || '', full_name: user?.full_name || 'You', phone: user?.phone },
          { id: 'other-player', full_name: 'Other Player', phone: '+1234567890' }
        ]
      };
      setInvitation(mockInvitation);
    } catch (error) {
      console.error('Failed to load invitation:', error);
      Alert.alert('Error', 'Failed to load match details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMatch = async (matchData: CreateMatchData, reportData?: { playerIds: string[], type: string, description: string }) => {
    if (!invitation || !user) return;

    try {
      setIsSubmitting(true);

      // Save match first
      const savedMatch = await recordMatch({
        ...matchData,
        invitation_id: invitation.id
      });

      // Handle reports if any
      if (reportData && reportData.playerIds.length > 0) {
        for (const playerId of reportData.playerIds) {
          await safetyService.submitReport({
            reporterId: user.id,
            reportedUserId: playerId,
            reportType: reportData.type as any,
            description: `Match-based report: ${reportData.description}`
          });
        }
      }

      Alert.alert(
        'Match Recorded!',
        `Match has been saved successfully${reportData?.playerIds.length ? ' and reports submitted' : ''}.`,
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
    if (!user || !reportData.reportedPlayerIds?.length) return;

    try {
      for (const playerId of reportData.reportedPlayerIds) {
        await safetyService.submitReport({
          reporterId: user.id,
          reportedUserId: playerId,
          reportType: reportData.type as any,
          description: reportData.description
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
          <ThemedText>Loading match details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!invitation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ThemedText>Match invitation not found</ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={[styles.backButtonText, { color: colors.tint }]}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const otherPlayers = invitation.confirmed_players.filter(p => p.id !== user?.id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Record Match Results</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Match Info */}
        <ThemedView style={[styles.matchInfo, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
          <ThemedText style={[styles.matchInfoTitle, { color: colors.tint }]}>
            🎾 Match Details
          </ThemedText>
          <ThemedText style={styles.matchInfoText}>
            {invitation.match_type.charAt(0).toUpperCase() + invitation.match_type.slice(1)} match
          </ThemedText>
          <ThemedText style={[styles.matchInfoText, { color: colors.tabIconDefault }]}>
            {new Date(invitation.match_date).toLocaleDateString()} at {invitation.club_name}
          </ThemedText>
          <ThemedText style={[styles.playersTitle, { marginTop: 8 }]}>Players:</ThemedText>
          {invitation.confirmed_players.map((player) => (
            <ThemedText key={player.id} style={[styles.playerName, { color: colors.tabIconDefault }]}>
              • {player.full_name} {player.phone && `(${player.phone})`}
            </ThemedText>
          ))}
        </ThemedView>

        <MatchRecordingForm
          onSave={handleSaveMatch}
          clubId={invitation.club_id}
          matchType={invitation.match_type}
          players={invitation.confirmed_players}
          showReporting={true}
          isSubmitting={isSubmitting}
        />
      </ScrollView>

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmitReport={handleSubmitReport}
        matchContext={{
          invitationId: invitation.id,
          matchDate: invitation.match_date,
          matchType: invitation.match_type,
          clubName: invitation.club_name,
          players: otherPlayers.map(p => ({
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
    paddingHorizontal: 16, // iOS HIG: Standard content margins
    paddingVertical: 12,   // Better proportions
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // iOS HIG: Minimum 44pt touch target
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 17, // iOS HIG: Standard navigation button text
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17, // iOS HIG: Standard navigation title
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44, // Match headerBackButton minimum width for symmetry
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // iOS HIG: Standard content margins
  },
  matchInfo: {
    padding: 16,
    borderRadius: 12, // iOS HIG: Standard corner radius
    borderWidth: 1,
    marginBottom: 16, // Consistent spacing
  },
  matchInfoTitle: {
    fontSize: 17, // iOS HIG: Body text size
    fontWeight: '600',
    marginBottom: 8,
  },
  matchInfoText: {
    fontSize: 15, // iOS HIG: Subheadline text size
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
    // iOS HIG: Minimum touch target
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 17, // iOS HIG: Standard button text size
    fontWeight: '500',
  },
});