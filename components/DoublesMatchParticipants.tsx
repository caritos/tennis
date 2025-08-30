import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { InvitationResponse } from '@/services/matchInvitationService';
import { getRatingTier, getInitialRating } from '@/utils/eloRating';

interface DoublesMatchParticipantsProps {
  creatorName: string;
  creatorEloRating?: number;
  creatorGamesPlayed?: number;
  creatorPhone?: string;
  responses: InvitationResponse[];
  matchType: 'singles' | 'doubles';
  isMatched: boolean;
  onJoinMatch?: () => void;
  isJoining?: boolean;
  currentUserId?: string;
  creatorId?: string;
  targetedPlayers?: string[]; // Array of user IDs for targeted invitations
  targetedPlayerNames?: string[]; // Array of player names for targeted invitations
}

export const DoublesMatchParticipants: React.FC<DoublesMatchParticipantsProps> = ({
  creatorName,
  creatorEloRating,
  creatorGamesPlayed,
  creatorPhone,
  responses,
  matchType,
  isMatched,
  onJoinMatch,
  isJoining,
  currentUserId,
  creatorId,
  targetedPlayers,
  targetedPlayerNames
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const requiredPlayers = matchType === 'singles' ? 2 : 4;
  const currentPlayers = responses.length + 1; // +1 for creator
  const confirmedResponses = responses.filter(r => r.status === 'confirmed' || r.status === 'interested');
  
  // Check if current user has already responded (any response, including undefined status)
  const hasUserResponded = currentUserId && responses.some(r => r.user_id === currentUserId);
  const isUserCreator = currentUserId && currentUserId === creatorId;
  const canJoin = currentUserId && !hasUserResponded && !isUserCreator && onJoinMatch && !isMatched && !isJoining;

  // Check if user should see contact info (when match is confirmed and user is participating)
  const isUserParticipating = currentUserId && (isUserCreator || hasUserResponded);
  const shouldShowContact = isMatched && isUserParticipating;



  // Helper function to format ELO rating display
  const formatEloRating = (rating?: number, gamesPlayed?: number) => {
    if (!rating) {
      return { rating: getInitialRating(), tier: 'New Player', color: '#2196F3', provisionalText: ' (New)' };
    }
    
    const { tier, color } = getRatingTier(rating);
    const isProvisional = (gamesPlayed || 0) < 5;
    const provisionalText = isProvisional ? ' (Provisional)' : '';
    
    return { rating, tier, color, provisionalText };
  };
  
  // For doubles, show up to 4 players (first-come-first-serve)
  if (matchType === 'doubles') {
    const creatorEloInfo = formatEloRating(creatorEloRating, creatorGamesPlayed);
    const allPlayers = [
      { 
        name: creatorName, 
        isOrganizer: true,
        eloInfo: creatorEloInfo
      },
      ...confirmedResponses.slice(0, 3).map(r => ({ 
        name: r.full_name || r.user_name || 'Unknown Player', 
        isOrganizer: false,
        eloInfo: formatEloRating(r.user_elo_rating, r.user_games_played)
      }))
    ];
    
    return (
      <View style={styles.doublesContainer}>
        {/* Match Status */}
        {isMatched && (
          <View style={styles.statusHeader}>
            <View style={[styles.matchedBadge, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.matchedText}>✓ Ready to Play</ThemedText>
            </View>
          </View>
        )}

        {/* Players List */}
        <View style={styles.playersSection}>
          <View style={styles.playersContainer}>
            {allPlayers.slice(0, 4).map((player, index) => (
              <View key={index} style={[styles.playerSlot, { borderColor: colors.tabIconDefault + '20' }]}>
                <ThemedText style={[styles.playerName, { color: colors.text }]}>
                  {player.name}
                </ThemedText>
                {player.isOrganizer && (
                  <ThemedText style={[styles.organizerBadge, { color: colors.tint }]}>
                    Organizer
                  </ThemedText>
                )}
                <ThemedText style={[styles.eloRating, { color: player.eloInfo.color }]}>
                  {player.eloInfo.rating} • {player.eloInfo.tier}
                </ThemedText>
                {shouldShowContact && (
                  <ThemedText style={[styles.contactNumber, { color: colors.textSecondary }]}>
                    {player.isOrganizer ? creatorPhone : 
                     confirmedResponses[index - 1]?.user_phone || confirmedResponses[index - 1]?.full_phone}
                  </ThemedText>
                )}
              </View>
            ))}
            
            {/* Empty slots for remaining players */}
            {Array.from({ length: Math.max(0, 4 - allPlayers.length) }).map((_, index) => {
              const remainingSlots = 4 - allPlayers.length;
              const playersNeeded = remainingSlots > 1 ? `${remainingSlots} players` : '1 player';
              
              // Check if there are pending responses that might indicate specific players were invited
              const pendingResponses = confirmedResponses.length < (matchType === 'singles' ? 1 : 3); // Responses needed beyond creator
              const hasAnyResponses = responses.length > 0;
              
              if (canJoin || isJoining) {
                return (
                  <TouchableOpacity 
                    key={`empty-${index}`} 
                    style={[styles.emptySlot, styles.clickableSlot, { borderColor: colors.tint, opacity: isJoining ? 0.6 : 1 }]}
                    onPress={isJoining ? undefined : onJoinMatch}
                    activeOpacity={0.7}
                    disabled={isJoining}
                  >
                    <ThemedText style={[styles.emptySlotText, { color: colors.tint }]}>
                      {isJoining ? '⏳ Joining...' : '+ Join Match'}
                    </ThemedText>
                  </TouchableOpacity>
                );
              } else {
                // Show more specific messaging based on invitation context
                let displayText = '';
                
                // Check if this is a targeted invitation
                const isTargetedInvitation = targetedPlayers && targetedPlayers.length > 0;
                
                if (index === 0 && isTargetedInvitation && targetedPlayerNames) {
                  // For targeted invitations, show specific player names
                  const remainingTargetedPlayers = targetedPlayerNames.filter(name => {
                    // Check if this targeted player has already responded
                    return !confirmedResponses.some(response => 
                      response.full_name === name || response.user_name === name
                    );
                  });
                  
                  if (remainingTargetedPlayers.length > 0) {
                    const waitingForText = remainingTargetedPlayers.length === 1 
                      ? `Waiting for ${remainingTargetedPlayers[0]} to respond`
                      : `Waiting for ${remainingTargetedPlayers.join(', ')} to respond`;
                    displayText = waitingForText;
                  } else {
                    displayText = `Looking for ${playersNeeded}`;
                  }
                } else if (index === 0 && hasAnyResponses && pendingResponses) {
                  // If there are responses but still need more players, show waiting message
                  displayText = `Waiting for ${playersNeeded}`;
                } else if (index === 0) {
                  // First empty slot shows general "looking for" message
                  displayText = `Looking for ${playersNeeded}`;
                } else {
                  // Subsequent slots show "Open slot"
                  displayText = 'Open slot';
                }
                
                return (
                  <View key={`empty-${index}`} style={[styles.emptySlot, { borderColor: colors.tabIconDefault + '50' }]}>
                    <ThemedText style={[styles.emptySlotText, { color: colors.tabIconDefault }]}>
                      {displayText}
                    </ThemedText>
                  </View>
                );
              }
            })}
          </View>

        </View>
      </View>
    );
  }

  // For singles, show simpler layout
  return (
    <View style={styles.singlesContainer}>
      {isMatched && (
        <View style={styles.statusHeader}>
          <View style={[styles.matchedBadge, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.matchedText}>✓ Ready to Play</ThemedText>
          </View>
        </View>
      )}

      <View style={styles.singlesPlayers}>
        <View style={styles.playerSlot}>
          <ThemedText style={[styles.playerName, { color: colors.text }]}>
            {creatorName}
          </ThemedText>
          <ThemedText style={[styles.organizerBadge, { color: colors.tint }]}>
            Organizer
          </ThemedText>
          <ThemedText style={[styles.eloRating, { color: formatEloRating(creatorEloRating, creatorGamesPlayed).color }]}>
            {formatEloRating(creatorEloRating, creatorGamesPlayed).rating} • {formatEloRating(creatorEloRating, creatorGamesPlayed).tier}
          </ThemedText>
          {shouldShowContact && creatorPhone && (
            <ThemedText style={[styles.contactNumber, { color: colors.textSecondary }]}>
              {creatorPhone}
            </ThemedText>
          )}
        </View>

        {confirmedResponses.length > 0 ? (
          <View style={styles.playerSlot}>
            <ThemedText style={[styles.playerName, { color: colors.text }]}>
              {confirmedResponses[0].full_name || confirmedResponses[0].user_name || 'Unknown Player'}
            </ThemedText>
            <ThemedText style={[styles.eloRating, { color: formatEloRating(confirmedResponses[0].user_elo_rating, confirmedResponses[0].user_games_played).color }]}>
              {formatEloRating(confirmedResponses[0].user_elo_rating, confirmedResponses[0].user_games_played).rating} • {formatEloRating(confirmedResponses[0].user_elo_rating, confirmedResponses[0].user_games_played).tier}
            </ThemedText>
            {shouldShowContact && (confirmedResponses[0].user_phone || confirmedResponses[0].full_phone) && (
              <ThemedText style={[styles.contactNumber, { color: colors.textSecondary }]}>
                {confirmedResponses[0].user_phone || confirmedResponses[0].full_phone}
              </ThemedText>
            )}
          </View>
        ) : canJoin || isJoining ? (
          <TouchableOpacity 
            style={[styles.emptySlot, styles.clickableSlot, { borderColor: colors.tint, opacity: isJoining ? 0.6 : 1 }]}
            onPress={isJoining ? undefined : onJoinMatch}
            activeOpacity={0.7}
            disabled={isJoining}
          >
            <ThemedText style={[styles.emptySlotText, { color: colors.tint }]}>
              {isJoining ? '⏳ Joining...' : '+ Join Match'}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={[styles.emptySlot, { borderColor: colors.tabIconDefault + '50' }]}>
            <ThemedText style={[styles.emptySlotText, { color: colors.tabIconDefault }]}>
              {(() => {
                // Check if this is a targeted invitation for singles
                const isTargetedInvitation = targetedPlayers && targetedPlayers.length > 0;
                
                if (isTargetedInvitation && targetedPlayerNames && targetedPlayerNames.length > 0) {
                  // For targeted singles invitations, show specific player name
                  const remainingTargetedPlayers = targetedPlayerNames.filter(name => {
                    // Check if this targeted player has already responded
                    return !confirmedResponses.some(response => 
                      response.full_name === name || response.user_name === name
                    );
                  });
                  
                  if (remainingTargetedPlayers.length > 0) {
                    return `Waiting for ${remainingTargetedPlayers[0]} to respond`;
                  }
                }
                
                // Default messaging for open invitations
                return responses.length > 0 ? 'Waiting for 1 player' : 'Looking for 1 player';
              })()}
            </ThemedText>
          </View>
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  doublesContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  singlesContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 15,  // iOS HIG: Body text
    fontWeight: '600',
  },
  matchedBadge: {
    paddingHorizontal: 12,  // iOS HIG: Better touch spacing
    paddingVertical: 6,  // iOS HIG: Better touch spacing
    borderRadius: 14,  // iOS HIG: Pill shape for badges
  },
  matchedText: {
    color: 'white',
    fontSize: 13,  // iOS HIG: Caption 1
    fontWeight: '600',
  },
  playersGrid: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 13,  // iOS HIG: Caption 1
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  playersSection: {
    marginBottom: 12, // Increased margin for better separation
  },
  playersContainer: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  playerSlot: {
    width: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,  // iOS HIG: Standard corner radius
    padding: 12,  // Increased padding for better spacing in full width
    alignItems: 'center',
    minHeight: 60,  // Reduced since we have full width now
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 15,  // iOS HIG: Body text
    fontWeight: '500',
    textAlign: 'center',
  },
  organizerBadge: {
    fontSize: 12,  // iOS HIG: Caption 2
    marginTop: 2,
  },
  emptySlot: {
    width: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,  // iOS HIG: Standard corner radius
    padding: 12,  // Consistent with playerSlot padding
    alignItems: 'center',
    minHeight: 60,  // Match playerSlot height for consistency
    justifyContent: 'center',
  },
  clickableSlot: {
    borderStyle: 'solid',
    borderWidth: 2,
  },
  emptySlotText: {
    fontSize: 13,  // iOS HIG: Caption 1
    textAlign: 'center',
  },
  teamsNote: {
    fontSize: 12,  // iOS HIG: Caption 2
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  singlesPlayers: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  eloRating: {
    fontSize: 13,  // iOS HIG: Caption 1
    marginTop: 2,
    fontWeight: '500',
  },
  contactNumber: {
    fontSize: 12,  // iOS HIG: Caption 2
    marginTop: 4,
    textAlign: 'center',
  },
});