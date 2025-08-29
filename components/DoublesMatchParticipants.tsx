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
  responses: InvitationResponse[];
  matchType: 'singles' | 'doubles';
  isMatched: boolean;
  onJoinMatch?: () => void;
  isJoining?: boolean;
  currentUserId?: string;
  creatorId?: string;
}

export const DoublesMatchParticipants: React.FC<DoublesMatchParticipantsProps> = ({
  creatorName,
  creatorEloRating,
  creatorGamesPlayed,
  responses,
  matchType,
  isMatched,
  onJoinMatch,
  isJoining,
  currentUserId,
  creatorId
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
        name: r.user_name || 'Unknown Player', 
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
                  {player.eloInfo.rating} • {player.eloInfo.tier}{player.eloInfo.provisionalText}
                </ThemedText>
              </View>
            ))}
            
            {/* Empty slots for remaining players */}
            {Array.from({ length: Math.max(0, 4 - allPlayers.length) }).map((_, index) => {
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
                return (
                  <View key={`empty-${index}`} style={[styles.emptySlot, { borderColor: colors.tabIconDefault + '50' }]}>
                    <ThemedText style={[styles.emptySlotText, { color: colors.tabIconDefault }]}>
                      Waiting for player...
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
          <ThemedText style={[styles.organizerBadge, { color: colors.tabIconDefault }]}>
            (Organizer)
          </ThemedText>
          <ThemedText style={[styles.eloRating, { color: formatEloRating(creatorEloRating, creatorGamesPlayed).color }]}>
            {formatEloRating(creatorEloRating, creatorGamesPlayed).rating} • {formatEloRating(creatorEloRating, creatorGamesPlayed).tier}{formatEloRating(creatorEloRating, creatorGamesPlayed).provisionalText}
          </ThemedText>
        </View>

        <View style={styles.vsContainer}>
          <ThemedText style={[styles.vsText, { color: colors.tabIconDefault }]}>
            VS
          </ThemedText>
        </View>

        {confirmedResponses.length > 0 ? (
          <View style={styles.playerSlot}>
            <ThemedText style={[styles.playerName, { color: colors.text }]}>
              {confirmedResponses[0].user_name || 'Unknown Player'}
            </ThemedText>
            <ThemedText style={[styles.eloRating, { color: formatEloRating(confirmedResponses[0].user_elo_rating, confirmedResponses[0].user_games_played).color }]}>
              {formatEloRating(confirmedResponses[0].user_elo_rating, confirmedResponses[0].user_games_played).rating} • {formatEloRating(confirmedResponses[0].user_elo_rating, confirmedResponses[0].user_games_played).tier}{formatEloRating(confirmedResponses[0].user_elo_rating, confirmedResponses[0].user_games_played).provisionalText}
            </ThemedText>
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
              Waiting for opponent...
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 16, // Increased margin to prevent overlap
    minHeight: 64, // Ensure minimum height for 2 rows of cards
  },
  playerSlot: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderRadius: 12,  // iOS HIG: Standard corner radius
    padding: 12,  // iOS HIG: Better touch targets
    alignItems: 'center',
    minHeight: 44,  // iOS HIG: Minimum touch target height
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
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,  // iOS HIG: Standard corner radius
    padding: 12,  // iOS HIG: Consistent padding
    alignItems: 'center',
    minHeight: 44,  // iOS HIG: Minimum touch target height
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
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 13,  // iOS HIG: Caption 1
    fontWeight: '600',
  },
  singlesPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eloRating: {
    fontSize: 13,  // iOS HIG: Caption 1
    marginTop: 2,
    fontWeight: '500',
  },
});