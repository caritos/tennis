import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type InvitationType = 'challenge' | 'looking_to_play' | 'match_invitation';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface InvitationCardData {
  id: string;
  type: InvitationType;
  title: string;
  senderName: string;
  senderAvatar?: string;
  recipientName?: string;
  description?: string;
  location?: string;
  dateTime?: Date;
  matchType?: 'singles' | 'doubles';
  status: InvitationStatus;
  expiresAt?: Date;
  createdAt: Date;
}

interface InvitationCardProps {
  invitation: InvitationCardData;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onPress?: () => void;
  showActions?: boolean;
  isOwnInvitation?: boolean;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
  onCancel,
  onPress,
  showActions = true,
  isOwnInvitation = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getTypeIcon = () => {
    switch (invitation.type) {
      case 'challenge':
        return 'fitness';
      case 'looking_to_play':
        return 'search';
      case 'match_invitation':
        return 'calendar';
      default:
        return 'mail';
    }
  };

  const getTypeColor = () => {
    switch (invitation.type) {
      case 'challenge':
        return '#FF6B6B'; // Red for challenges
      case 'looking_to_play':
        return '#4ECDC4'; // Teal for looking to play
      case 'match_invitation':
        return '#45B7D1'; // Blue for match invitations
      default:
        return colors.tint;
    }
  };

  const getStatusIcon = () => {
    switch (invitation.status) {
      case 'accepted':
        return 'checkmark-circle';
      case 'declined':
        return 'close-circle';
      case 'expired':
        return 'time';
      default:
        return 'time';
    }
  };

  const getStatusColor = () => {
    switch (invitation.status) {
      case 'accepted':
        return '#4CAF50';
      case 'declined':
        return '#F44336';
      case 'expired':
        return '#9E9E9E';
      default:
        return colors.tabIconDefault;
    }
  };

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days > 1 && days <= 7) return `In ${days} days`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isExpired = invitation.expiresAt && invitation.expiresAt < new Date();
  const typeColor = getTypeColor();

  const cardContent = (
    <View style={[
      styles.container,
      { 
        backgroundColor: colors.background,
        borderColor: invitation.status === 'pending' ? typeColor : colors.tabIconDefault + '30'
      },
      invitation.status === 'pending' && styles.activeBorder
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeSection}>
          <View style={[styles.typeIcon, { backgroundColor: typeColor + '20' }]}>
            <Ionicons 
              name={getTypeIcon() as any} 
              size={20} 
              color={typeColor} 
            />
          </View>
          
          <View style={styles.headerInfo}>
            <ThemedText style={styles.title}>{invitation.title}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.tabIconDefault }]}>
              {isOwnInvitation ? `To ${invitation.recipientName}` : `From ${invitation.senderName}`}
            </ThemedText>
          </View>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusSection}>
          <Ionicons 
            name={getStatusIcon() as any} 
            size={20} 
            color={getStatusColor()} 
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {invitation.description && (
          <ThemedText style={[styles.description, { color: colors.tabIconDefault }]}>
            {invitation.description}
          </ThemedText>
        )}

        {/* Match Details */}
        <View style={styles.details}>
          {invitation.matchType && (
            <View style={styles.detailItem}>
              <Ionicons name="tennis" size={16} color={colors.tabIconDefault} />
              <ThemedText style={[styles.detailText, { color: colors.tabIconDefault }]}>
                {invitation.matchType.charAt(0).toUpperCase() + invitation.matchType.slice(1)}
              </ThemedText>
            </View>
          )}
          
          {invitation.location && (
            <View style={styles.detailItem}>
              <Ionicons name="location" size={16} color={colors.tabIconDefault} />
              <ThemedText style={[styles.detailText, { color: colors.tabIconDefault }]}>
                {invitation.location}
              </ThemedText>
            </View>
          )}
          
          {invitation.dateTime && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color={colors.tabIconDefault} />
              <ThemedText style={[styles.detailText, { color: colors.tabIconDefault }]}>
                {formatDateTime(invitation.dateTime)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      {showActions && invitation.status === 'pending' && !isExpired && (
        <View style={styles.actions}>
          {isOwnInvitation ? (
            // Show cancel button for own invitations
            onCancel && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton, { borderColor: colors.tabIconDefault }]}
                onPress={onCancel}
              >
                <ThemedText style={[styles.actionButtonText, { color: colors.tabIconDefault }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            )
          ) : (
            // Show accept/decline for received invitations
            <>
              {onDecline && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.declineButton, { borderColor: '#F44336' }]}
                  onPress={onDecline}
                >
                  <ThemedText style={[styles.actionButtonText, { color: '#F44336' }]}>
                    Decline
                  </ThemedText>
                </TouchableOpacity>
              )}
              
              {onAccept && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton, { backgroundColor: typeColor }]}
                  onPress={onAccept}
                >
                  <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>
                    Accept
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* Expired Notice */}
      {isExpired && (
        <View style={styles.expiredNotice}>
          <ThemedText style={[styles.expiredText, { color: colors.tabIconDefault }]}>
            This invitation has expired
          </ThemedText>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeBorder: {
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusSection: {
    alignItems: 'center',
  },
  content: {
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  details: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    // Background color set dynamically
  },
  declineButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  expiredNotice: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  expiredText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});