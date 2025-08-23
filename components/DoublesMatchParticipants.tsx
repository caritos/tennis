import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { InvitationResponse } from '@/services/matchInvitationService';

interface DoublesMatchParticipantsProps {
  creatorName: string;
  responses: InvitationResponse[];
  matchType: 'singles' | 'doubles';
  isMatched: boolean;
}

export const DoublesMatchParticipants: React.FC<DoublesMatchParticipantsProps> = ({
  creatorName,
  responses,
  matchType,
  isMatched
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const requiredPlayers = matchType === 'singles' ? 2 : 4;
  const currentPlayers = responses.length + 1; // +1 for creator
  const confirmedResponses = responses.filter(r => r.status === 'confirmed' || r.status === 'interested');
  
  // For doubles, show all players without team assignments
  if (matchType === 'doubles') {
    const allPlayers = [
      { name: creatorName, isOrganizer: true },
      ...confirmedResponses.map(r => ({ name: r.user_name || 'Unknown Player', isOrganizer: false }))
    ];
    
    const additionalInterested = confirmedResponses.slice(3); // Beyond the 4 needed

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
              </View>
            ))}
            
            {/* Empty slots for remaining players */}
            {Array.from({ length: Math.max(0, 4 - allPlayers.length) }).map((_, index) => (
              <View key={`empty-${index}`} style={[styles.emptySlot, { borderColor: colors.tabIconDefault + '50' }]}>
                <ThemedText style={[styles.emptySlotText, { color: colors.tabIconDefault }]}>
                  Waiting for player...
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Match Formation Info - moved inside players section */}
          {!isMatched && currentPlayers >= 2 && (
            <View style={[styles.infoBox, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
              <ThemedText style={[styles.infoText, { color: colors.tint }]}>
                {currentPlayers < 4 
                  ? `💡 Need ${requiredPlayers - currentPlayers} more player${requiredPlayers - currentPlayers !== 1 ? 's' : ''} for doubles match`
                  : '🎾 Ready for doubles!'
                }
              </ThemedText>
            </View>
          )}
        </View>

        {/* Additional Interested Players */}
        {additionalInterested.length > 0 && (
          <View style={styles.waitingSection}>
            <ThemedText style={[styles.waitingLabel, { color: colors.tabIconDefault }]}>
              Also interested:
            </ThemedText>
            <View style={styles.waitingPlayers}>
              {additionalInterested.map((response, index) => (
                <ThemedText key={index} style={[styles.waitingPlayerName, { color: colors.tabIconDefault }]}>
                  {response.user_name || 'Unknown Player'}
                </ThemedText>
              ))}
            </View>
          </View>
        )}
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
          </View>
        ) : (
          <View style={[styles.emptySlot, { borderColor: colors.tabIconDefault + '50' }]}>
            <ThemedText style={[styles.emptySlotText, { color: colors.tabIconDefault }]}>
              Waiting for opponent...
            </ThemedText>
          </View>
        )}
      </View>

      {/* Additional interested players for singles */}
      {confirmedResponses.length > 1 && (
        <View style={styles.waitingSection}>
          <ThemedText style={[styles.waitingLabel, { color: colors.tabIconDefault }]}>
            Also interested:
          </ThemedText>
          <View style={styles.waitingPlayers}>
            {confirmedResponses.slice(1).map((response, index) => (
              <ThemedText key={index} style={[styles.waitingPlayerName, { color: colors.tabIconDefault }]}>
                {response.user_name || 'Unknown Player'}
              </ThemedText>
            ))}
          </View>
        </View>
      )}
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
    fontSize: 14,
    fontWeight: '600',
  },
  matchedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  playersGrid: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 13,
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
    borderRadius: 6,
    padding: 8, // Increased padding
    alignItems: 'center',
    minHeight: 36, // Increased minimum height
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  organizerBadge: {
    fontSize: 11,
    marginTop: 2,
  },
  emptySlot: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 6,
    padding: 8, // Increased padding to match playerSlot
    alignItems: 'center',
    minHeight: 36, // Increased minimum height to match playerSlot
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    textAlign: 'center',
  },
  teamsNote: {
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: '600',
  },
  singlesPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  waitingSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  waitingLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  waitingPlayers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  waitingPlayerName: {
    fontSize: 12,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginTop: 16, // Increased margin to ensure separation
    marginBottom: 8,
    backgroundColor: 'transparent', // Ensure no background color conflicts
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});