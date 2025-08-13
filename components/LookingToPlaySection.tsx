import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { matchInvitationService, MatchInvitation, InvitationResponse } from '@/services/matchInvitationService';
import MatchInvitationForm from './MatchInvitationForm';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { DoublesMatchParticipants } from './DoublesMatchParticipants';

interface LookingToPlaySectionProps {
  clubId: string;
  showInviteForm?: boolean;
  onCloseInviteForm?: () => void;
  onInvitationsChange?: (hasInvitations: boolean) => void;
}

interface InvitationWithResponses extends MatchInvitation {
  responses: InvitationResponse[];
  userResponse?: InvitationResponse;
}

const LookingToPlaySection: React.FC<LookingToPlaySectionProps> = ({ 
  clubId, 
  showInviteForm = false,
  onCloseInviteForm,
  onInvitationsChange 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const [invitations, setInvitations] = useState<InvitationWithResponses[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, [clubId]);

  const loadInvitations = async () => {
    if (!clubId) return;

    try {
      setIsLoading(true);
      const clubInvitations = await matchInvitationService.getClubInvitations(clubId);
      
      // Load responses for each invitation
      const invitationsWithResponses = await Promise.all(
        clubInvitations.map(async (invitation) => {
          const responses = await matchInvitationService.getInvitationResponses(invitation.id);
          const userResponse = user ? responses.find(r => r.user_id === user.id) : undefined;
          
          return {
            ...invitation,
            responses,
            userResponse,
          };
        })
      );

      setInvitations(invitationsWithResponses);
      onInvitationsChange?.(invitationsWithResponses.length > 0);
    } catch (error) {
      console.error('Failed to load invitations:', error);
      showError('Failed to Load', 'Could not load match invitations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterested = async (invitationId: string) => {
    if (!user) {
      showError('Sign In Required', 'Please sign in to respond to invitations.');
      return;
    }

    try {
      await matchInvitationService.respondToInvitation(invitationId, user.id);
      showSuccess('Interest Sent!', 'Your interest has been recorded.');
      await loadInvitations(); // Refresh to show updated state
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      if (error instanceof Error && error.message.includes('already responded')) {
        showError('Already Responded', 'You have already responded to this invitation.');
      } else {
        showError('Failed to Respond', 'Something went wrong. Please try again.');
      }
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!user) {
      showError('Sign In Required', 'Please sign in to cancel invitations.');
      return;
    }

    try {
      await matchInvitationService.cancelInvitation(invitationId, user.id);
      showSuccess('Invitation Cancelled', 'Your invitation has been cancelled.');
      await loadInvitations(); // Refresh to show updated state
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      if (error instanceof Error && error.message.includes('only cancel your own')) {
        showError('Permission Denied', 'You can only cancel your own invitations.');
      } else {
        showError('Failed to Cancel', 'Something went wrong. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getMatchProgress = (invitation: InvitationWithResponses) => {
    const requiredPlayers = invitation.match_type === 'singles' ? 2 : 4;
    const currentPlayers = invitation.responses.length + 1; // +1 for creator
    return { current: currentPlayers, required: requiredPlayers };
  };

  const canUserRespond = (invitation: InvitationWithResponses) => {
    if (!user) return false;
    if (invitation.creator_id === user.id) return false; // Can't respond to own invitation
    if (invitation.userResponse) return false; // Already responded
    if (invitation.status !== 'active') return false; // Not active
    
    const progress = getMatchProgress(invitation);
    return progress.current < progress.required; // Still need players
  };

  const renderInvitation = (invitation: InvitationWithResponses) => {
    const progress = getMatchProgress(invitation);
    const canRespond = canUserRespond(invitation);
    const isMatched = invitation.status === 'matched';
    
    return (
      <View key={invitation.id} style={[styles.invitationCard, { borderColor: colors.tabIconDefault }]}>
        <View style={styles.invitationHeader}>
          <View style={styles.invitationMeta}>
            <ThemedText style={styles.matchDate}>
              {formatDate(invitation.date)}
              {invitation.time && ` at ${invitation.time}`}
            </ThemedText>
            {invitation.location && (
              <ThemedText style={[styles.matchLocation, { color: colors.tabIconDefault }]}>
                📍 {invitation.location}
              </ThemedText>
            )}
          </View>
          
          <View style={styles.progressContainer}>
            <ThemedText style={[styles.progressText, { color: colors.tabIconDefault }]}>
              {progress.current}/{progress.required} players
            </ThemedText>
            {isMatched && (
              <View style={[styles.matchedBadge, { backgroundColor: colors.tint }]}>
                <ThemedText style={styles.matchedText}>Matched!</ThemedText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.invitationContent}>
          {invitation.notes && (
            <ThemedText style={[styles.invitationNotes, { color: colors.tabIconDefault }]}>
              &ldquo;{invitation.notes}&rdquo;
            </ThemedText>
          )}

          {/* Enhanced participant display for better visibility */}
          <DoublesMatchParticipants
            creatorName={invitation.creator_name || 'Unknown Player'}
            responses={invitation.responses}
            matchType={invitation.match_type}
            isMatched={isMatched}
          />
        </View>

        <View style={styles.invitationFooter}>
          <ThemedText style={[styles.timeAgo, { color: colors.tabIconDefault }]}>
            {formatTimeAgo(invitation.created_at)}
          </ThemedText>

          {canRespond && (
            <TouchableOpacity
              style={[styles.interestedButton, { backgroundColor: colors.tint }]}
              onPress={() => handleInterested(invitation.id)}
            >
              <ThemedText style={styles.interestedButtonText}>I&apos;m Interested</ThemedText>
            </TouchableOpacity>
          )}

          {invitation.userResponse && (
            <View style={[styles.respondedBadge, { backgroundColor: colors.tint + '20' }]}>
              <ThemedText style={[styles.respondedText, { color: colors.tint }]}>
                ✓ Interested
              </ThemedText>
            </View>
          )}

          {invitation.creator_id === user?.id && !isMatched && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancelInvitation(invitation.id)}
            >
              <ThemedText style={[styles.cancelButtonText, { color: colors.tabIconDefault }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Only show content if there are invitations
  if (invitations.length === 0 && !showInviteForm) {
    return null;
  }

  return (
    <ThemedView>
      {/* Removed section header since it's now in the parent component */}

      <ScrollView
        style={styles.invitationsList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadInvitations}
            tintColor={colors.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {invitations.length > 0 && (
          <View style={styles.invitationsContainer}>
            {invitations.map(renderInvitation)}
          </View>
        )}
      </ScrollView>

      {/* Match Invitation Form Modal */}
      <Modal
        visible={showInviteForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {user && (
          <MatchInvitationForm
            clubId={clubId}
            creatorId={user.id}
            onClose={() => onCloseInviteForm?.()}
            onSuccess={() => {
              loadInvitations();
              onCloseInviteForm?.();
            }}
          />
        )}
      </Modal>
    </ThemedView>
  );
};

export default LookingToPlaySection;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.7,
  },
  invitationsList: {
    maxHeight: 400, // Limit height so it doesn't take over the screen
  },
  invitationsContainer: {
    gap: 12,
  },
  invitationCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'transparent',
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invitationMeta: {
    flex: 1,
  },
  matchType: {
    fontSize: 16,
    fontWeight: '600',
  },
  matchDate: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  matchLocation: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  matchedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  invitationContent: {
    marginBottom: 8,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  invitationNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 6,
  },
  responsesContainer: {
    marginTop: 6,
  },
  responsesLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  responsesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  responseName: {
    fontSize: 12,
  },
  invitationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  timeAgo: {
    fontSize: 12,
    fontWeight: '500',
  },
  interestedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestedButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  respondedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  respondedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
  },
});