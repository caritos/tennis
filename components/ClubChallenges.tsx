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

interface ClubChallengesProps {
  userId: string;
  clubId: string;
  onRefresh?: () => void;
}

const ClubChallenges: React.FC<ClubChallengesProps> = ({
  userId,
  clubId,
  onRefresh,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showSuccess, showError } = useNotification();

  const [sentChallenges, setSentChallenges] = useState<ChallengeWithUsers[]>([]);
  const [receivedChallenges, setReceivedChallenges] = useState<ChallengeWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingChallenge, setProcessingChallenge] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    loadChallenges();
  }, [userId, clubId]);

  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      
      // Load both sent and received challenges
      const [sent, received] = await Promise.all([
        challengeService.getUserSentChallenges(userId),
        challengeService.getUserReceivedChallenges(userId),
      ]);
      
      // Filter for this club and pending status
      const clubSent = sent.filter(c => c.club_id === clubId && c.status === 'pending');
      const clubReceived = received.filter(c => c.club_id === clubId && c.status === 'pending');
      
      setSentChallenges(clubSent);
      setReceivedChallenges(clubReceived);
    } catch (error) {
      console.error('Failed to load challenges:', error);
      showError('Error', 'Failed to load challenges');
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
      
      showSuccess('Challenge Declined', `You declined ${challengerName}'s challenge`);
      
      await loadChallenges();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to decline challenge:', error);
      showError('Error', 'Failed to decline challenge');
    } finally {
      setProcessingChallenge(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Flexible timing';
    
    const proposedDate = dateString;
    switch (proposedDate) {
      case 'today':
        return 'Today';
      case 'tomorrow':
        return 'Tomorrow';
      case 'weekend':
        return 'This Weekend';
      case 'next_week':
        return 'Next Week';
      case 'flexible':
        return 'Flexible timing';
      default:
        try {
          const date = new Date(proposedDate);
          const month = date.toLocaleDateString('en-US', { month: 'short' });
          const day = date.getDate();
          return `${month} ${day}`;
        } catch {
          return proposedDate;
        }
    }
  };

  const renderChallenge = (challenge: ChallengeWithUsers, type: 'sent' | 'received') => {
    const isProcessing = processingChallenge === challenge.id;
    const otherPlayerName = type === 'sent' ? challenge.challenged_name : challenge.challenger_name;
    
    return (
      <View key={challenge.id} style={[styles.challengeCard, { backgroundColor: colors.background }]}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeInfo}>
            <ThemedText style={styles.playerName}>{otherPlayerName}</ThemedText>
            <ThemedText style={[styles.matchType, { color: colors.tabIconDefault }]}>
              {challenge.match_type === 'singles' ? 'Singles' : 'Doubles'} • {formatDate(challenge.proposed_date)}
            </ThemedText>
            {challenge.message && (
              <ThemedText style={[styles.message, { color: colors.tabIconDefault }]}>
                "{challenge.message}"
              </ThemedText>
            )}
          </View>
          
          {type === 'sent' ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.tint + '20' }]}>
              <ThemedText style={[styles.statusText, { color: colors.tint }]}>
                Pending
              </ThemedText>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.acceptButton, { backgroundColor: colors.tint }]}
                onPress={() => handleAcceptChallenge(challenge.id, challenge.challenger_name)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <ThemedText style={styles.acceptButtonText}>Accept</ThemedText>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.declineButton, { borderColor: colors.border }]}
                onPress={() => handleDeclineChallenge(challenge.id, challenge.challenger_name)}
                disabled={isProcessing}
              >
                <ThemedText style={[styles.declineButtonText, { color: colors.text }]}>
                  Decline
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.section}>
        <ActivityIndicator size="small" color={colors.tint} />
      </ThemedView>
    );
  }

  const totalChallenges = sentChallenges.length + receivedChallenges.length;
  
  if (totalChallenges === 0) {
    return null; // Don't show section if no challenges
  }

  return (
    <ThemedView style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionLabel}>Active Challenges</ThemedText>
        <View style={[styles.badge, { backgroundColor: colors.tint }]}>
          <ThemedText style={styles.badgeText}>{totalChallenges}</ThemedText>
        </View>
      </View>
      
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'received' && { backgroundColor: colors.tint + '20' }
          ]}
          onPress={() => setActiveTab('received')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'received' && { color: colors.tint, fontWeight: '600' }
          ]}>
            Received ({receivedChallenges.length})
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sent' && { backgroundColor: colors.tint + '20' }
          ]}
          onPress={() => setActiveTab('sent')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'sent' && { color: colors.tint, fontWeight: '600' }
          ]}>
            Sent ({sentChallenges.length})
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Challenge List */}
      <View style={styles.challengeList}>
        {activeTab === 'received' ? (
          receivedChallenges.length > 0 ? (
            receivedChallenges.map(challenge => renderChallenge(challenge, 'received'))
          ) : (
            <ThemedText style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No pending challenges received
            </ThemedText>
          )
        ) : (
          sentChallenges.length > 0 ? (
            sentChallenges.map(challenge => renderChallenge(challenge, 'sent'))
          ) : (
            <ThemedText style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No pending challenges sent
            </ThemedText>
          )
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabText: {
    fontSize: 14,
  },
  challengeList: {
    gap: 8,
  },
  challengeCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchType: {
    fontSize: 12,
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  declineButtonText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default ClubChallenges;