import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  ActivityIndicator,
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface Player {
  id: string;
  full_name: string;
}

interface PlayerSelectionProps {
  selectedPlayers: Player[];
  availablePlayers: Player[];
  playerSearchText: string;
  isLoadingPlayers: boolean;
  targetPlayerId?: string;
  colors: any;
  onPlayerToggle: (player: Player) => void;
  onSearchTextChange: (text: string) => void;
}

export default function PlayerSelection({
  selectedPlayers,
  availablePlayers,
  playerSearchText,
  isLoadingPlayers,
  targetPlayerId,
  colors,
  onPlayerToggle,
  onSearchTextChange,
}: PlayerSelectionProps) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionLabel}>
        {targetPlayerId 
          ? `Select 2 more players for doubles (${selectedPlayers.length}/3 selected)`
          : `Select 3 players to invite for doubles (${selectedPlayers.length}/3 selected)`
        }
      </ThemedText>

      {/* Selected Players Display */}
      {selectedPlayers.length > 0 && (
        <View style={styles.selectedPlayersContainer}>
          <ThemedText style={[styles.selectedLabel, { color: colors.tabIconDefault }]}>
            Selected players:
          </ThemedText>
          <View style={styles.selectedPlayersList}>
            {selectedPlayers.map((player) => (
              <View
                key={player.id}
                style={[styles.playerChip, { backgroundColor: colors.tint + '20' }]}
              >
                <ThemedText style={styles.playerChipText}>
                  {player.full_name}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => onPlayerToggle(player)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  disabled={player.id === targetPlayerId}
                >
                  <Ionicons 
                    name={player.id === targetPlayerId ? "lock-closed" : "close-circle"} 
                    size={20} 
                    color={player.id === targetPlayerId ? colors.tabIconDefault : colors.tint} 
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={colors.tabIconDefault} 
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: colors.text,
              backgroundColor: colors.card,
            }
          ]}
          placeholder="Search players by name..."
          placeholderTextColor={colors.tabIconDefault}
          value={playerSearchText}
          onChangeText={onSearchTextChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {playerSearchText.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchTextChange('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={colors.tabIconDefault} />
          </TouchableOpacity>
        )}
      </View>

      {/* Available Players List */}
      <View style={[styles.availablePlayersList, { maxHeight: 200 }]}>
        {isLoadingPlayers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.tint} />
            <ThemedText style={[styles.loadingText, { color: colors.tabIconDefault }]}>
              Loading players...
            </ThemedText>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={true}>
            {availablePlayers
              .filter(player => {
                // Filter by search text
                const matchesSearch = player.full_name.toLowerCase().includes(playerSearchText.toLowerCase());
                // Don't show already selected players
                const notSelected = !selectedPlayers.some(p => p.id === player.id);
                return matchesSearch && notSelected;
              })
              .map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={[styles.availablePlayerItem, { borderColor: colors.tabIconDefault + '30' }]}
                  onPress={() => {
                    if (selectedPlayers.length < 3) {
                      onPlayerToggle(player);
                      onSearchTextChange(''); // Clear search after selection
                    }
                  }}
                  disabled={selectedPlayers.length >= 3}
                >
                  <ThemedText style={[
                    styles.playerName,
                    selectedPlayers.length >= 3 && { opacity: 0.5 }
                  ]}>
                    {player.full_name}
                  </ThemedText>
                  <Ionicons 
                    name="add-circle-outline" 
                    size={22} 
                    color={selectedPlayers.length >= 3 ? colors.tabIconDefault : colors.tint} 
                  />
                </TouchableOpacity>
              ))}
          </ScrollView>
        )}
      </View>

      <ThemedText style={[styles.doublesNote, { color: colors.tabIconDefault }]}>
        Teams will be decided when you meet up.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedPlayersContainer: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  selectedPlayersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  playerChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  availablePlayersList: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  availablePlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
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
  doublesNote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});