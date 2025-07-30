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
  
  // For doubles, show team formation
  if (matchType === 'doubles') {
    const team1 = [creatorName];
    const team2: string[] = [];
    const waitingPlayers: string[] = [];
    
    // Distribute players into teams (simplified logic)
    confirmedResponses.forEach((response, index) => {
      const playerName = response.user_name || 'Unknown Player';
      if (index === 0) {
        team1.push(playerName);
      } else if (index === 1) {
        team2.push(playerName);
      } else if (index === 2) {
        team2.push(playerName);
      } else {
        waitingPlayers.push(playerName);
      }
    });

    return (
      <View style={styles.doublesContainer}>
        {/* Match Status */}
        <View style={styles.statusHeader}>
          <ThemedText style={[styles.statusTitle, { color: colors.text }]}>
            Doubles Match - {currentPlayers}/{requiredPlayers} Players
          </ThemedText>
          {isMatched && (
            <View style={[styles.matchedBadge, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.matchedText}>✓ Ready to Play</ThemedText>
            </View>
          )}
        </View>

        {/* Teams Layout */}
        <View style={styles.teamsContainer}>
          {/* Team 1 */}
          <View style={[styles.teamContainer, { borderColor: colors.tabIconDefault + '30' }]}>
            <ThemedText style={[styles.teamLabel, { color: colors.tint }]}>
              Team 1
            </ThemedText>
            <View style={styles.playersContainer}>
              {team1.map((player, index) => (
                <View key={`team1-${index}`} style={styles.playerSlot}>
                  <ThemedText style={[styles.playerName, { color: colors.text }]}>
                    {player}
                  </ThemedText>
                  {index === 0 && (
                    <ThemedText style={[styles.organizerBadge, { color: colors.tabIconDefault }]}>
                      (Organizer)
                    </ThemedText>
                  )}
                </View>
              ))}
              {team1.length < 2 && (
                <View style={[styles.emptySlot, { borderColor: colors.tabIconDefault + '50' }]}>
                  <ThemedText style={[styles.emptySlotText, { color: colors.tabIconDefault }]}>
                    Waiting for player...
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* VS Divider */}
          <View style={styles.vsContainer}>
            <ThemedText style={[styles.vsText, { color: colors.tabIconDefault }]}>
              VS
            </ThemedText>
          </View>

          {/* Team 2 */}
          <View style={[styles.teamContainer, { borderColor: colors.tabIconDefault + '30' }]}>
            <ThemedText style={[styles.teamLabel, { color: colors.tint }]}>
              Team 2
            </ThemedText>
            <View style={styles.playersContainer}>
              {team2.map((player, index) => (
                <View key={`team2-${index}`} style={styles.playerSlot}>
                  <ThemedText style={[styles.playerName, { color: colors.text }]}>
                    {player}
                  </ThemedText>
                </View>
              ))}
              {Array.from({ length: 2 - team2.length }).map((_, index) => (
                <View key={`empty-${index}`} style={[styles.emptySlot, { borderColor: colors.tabIconDefault + '50' }]}>
                  <ThemedText style={[styles.emptySlotText, { color: colors.tabIconDefault }]}>
                    Waiting for player...
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Waiting Players */}
        {waitingPlayers.length > 0 && (
          <View style={styles.waitingSection}>
            <ThemedText style={[styles.waitingLabel, { color: colors.tabIconDefault }]}>
              Also interested:
            </ThemedText>
            <View style={styles.waitingPlayers}>
              {waitingPlayers.map((player, index) => (
                <ThemedText key={index} style={[styles.waitingPlayerName, { color: colors.tabIconDefault }]}>
                  {player}
                </ThemedText>
              ))}
            </View>
          </View>
        )}

        {/* Match Formation Info */}
        {!isMatched && currentPlayers >= 3 && (
          <View style={[styles.infoBox, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
            <ThemedText style={[styles.infoText, { color: colors.tint }]}>
              💡 Need {requiredPlayers - currentPlayers} more player{requiredPlayers - currentPlayers !== 1 ? 's' : ''} to start the match
            </ThemedText>
          </View>
        )}
      </View>
    );
  }

  // For singles, show simpler layout
  return (
    <View style={styles.singlesContainer}>
      <View style={styles.statusHeader}>
        <ThemedText style={[styles.statusTitle, { color: colors.text }]}>
          Singles Match - {currentPlayers}/{requiredPlayers} Players
        </ThemedText>
        {isMatched && (
          <View style={[styles.matchedBadge, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.matchedText}>✓ Ready to Play</ThemedText>
          </View>
        )}
      </View>

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
    marginTop: 12,
  },
  singlesContainer: {
    marginTop: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  playersContainer: {
    gap: 6,
  },
  playerSlot: {
    alignItems: 'center',
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
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    textAlign: 'center',
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
    marginBottom: 12,
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
    padding: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});