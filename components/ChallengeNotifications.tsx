import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { challengeService, ChallengeWithUsers } from '@/services/challengeService';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChallengeNotificationsProps {
  userId: string;
  clubId?: string; // Optional: if provided, only show challenges from this club
  onRefresh?: () => void;
}

const ChallengeNotifications: React.FC<ChallengeNotificationsProps> = ({
  userId,
  clubId,
  onRefresh,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const [receivedChallenges, setReceivedChallenges] = useState<ChallengeWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingChallenge, setProcessingChallenge] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
  }, [userId, clubId]);

  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      const challenges = await challengeService.getUserReceivedChallenges(userId);
      // Only show pending challenges
      let pendingChallenges = challenges.filter(c => c.status === 'pending');
      
      // If clubId is provided, only show challenges from that club
      if (clubId) {
        pendingChallenges = pendingChallenges.filter(c => c.club_id === clubId);
      }
      
      setReceivedChallenges(pendingChallenges);
    } catch (error) {
      console.error('Failed to load challenges:', error);
      showError('Error', 'Failed to load challenge notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptChallenge = async (challengeId: string, challengerName: string) => {
    try {
      setProcessingChallenge(challengeId);
      await challengeService.acceptChallenge(challengeId, userId);
      
      showSuccess(
        'Challenge Accepted!',
        `You accepted ${challengerName}'s challenge. Contact info has been shared.`
      );
      
      await loadChallenges();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to accept challenge:', error);
      showError('Error', 'Failed to accept challenge');
    } finally {
      setProcessingChallenge(null);
    }
  };

  const handleDeclineChallenge = async (challengeId: string, challengerName: string) => {
    try {
      setProcessingChallenge(challengeId);
      await challengeService.declineChallenge(challengeId, userId);
      
      showSuccess(
        'Challenge Declined',
        `You declined ${challengerName}'s challenge.`
      );
      
      await loadChallenges();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to decline challenge:', error);
      showError('Error', 'Failed to decline challenge');
    } finally {
      setProcessingChallenge(null);
    }
  };

  const getTimingText = (proposedDate?: string) => {
    if (!proposedDate) return '';
    
    switch (proposedDate) {
      case 'today': return 'today';
      case 'tomorrow': return 'tomorrow';
      case 'weekend': return 'this weekend';
      case 'next_week': return 'next week';
      case 'flexible': return 'flexible timing';
      default: return proposedDate;
    }
  };

  const renderChallenge = (challenge: ChallengeWithUsers) => {
    const isProcessing = processingChallenge === challenge.id;
    const timingText = getTimingText(challenge.proposed_date);
    
    return (
      <View key={challenge.id} style={[styles.challengeCard, { borderColor: colors.tabIconDefault + '30' }]}>
        <View style={styles.challengeHeader}>
          <View style={[styles.challengeIcon, { backgroundColor: colors.tint + '20' }]}>
            <Ionicons name="tennisball" size={16} color={colors.tint} />
          </View>
          <ThemedText style={styles.challengeTitle}>
            New Challenge from {challenge.challenger_name}
          </ThemedText>
        </View>

        <View style={styles.challengeContent}>
          <ThemedText style={styles.challengeDetails}>
            {challenge.challenger_name} wants to play {challenge.match_type}
            {timingText && ` ${timingText}`}
          </ThemedText>
          
          {challenge.message && (
            <ThemedText style={[styles.challengeMessage, { color: colors.tabIconDefault }]}>
              &ldquo;{challenge.message}&rdquo;
            </ThemedText>
          )}
        </View>

        <View style={styles.challengeActions}>
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: colors.tabIconDefault }]}
            onPress={() => handleDeclineChallenge(challenge.id, challenge.challenger_name)}
            disabled={isProcessing}
          >
            <ThemedText style={[styles.declineButtonText, { color: colors.text }]}>
              Decline
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.acceptButton,
              { backgroundColor: colors.tint },
              isProcessing && { opacity: 0.6 }
            ]}
            onPress={() => handleAcceptChallenge(challenge.id, challenge.challenger_name)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContent}>
                <ActivityIndicator size="small" color="white" />
                <ThemedText style={styles.acceptButtonText}>Processing...</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.acceptButtonText}>Accept</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.tint} />
        <ThemedText style={[styles.loadingText, { color: colors.tabIconDefault }]}>
          Loading challenges...
        </ThemedText>
      </View>
    );
  }

  if (receivedChallenges.length === 0) {
    return null; // Don't show anything if no challenges
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.sectionLabel}>Challenges</ThemedText>
        <View style={[styles.badge, { backgroundColor: colors.tint }]}>
          <ThemedText style={styles.badgeText}>{receivedChallenges.length}</ThemedText>
        </View>
      </View>

      <ScrollView 
        style={styles.challengesList} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {receivedChallenges.map(renderChallenge)}
      </ScrollView>
    </ThemedView>
  );
};

export default ChallengeNotifications;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  challengesList: {
    maxHeight: 300,
  },
  challengeCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  challengeContent: {
    marginBottom: 16,
  },
  challengeDetails: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
  },
  challengeMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  challengeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  processingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
});