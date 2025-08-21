import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { CompactStyles } from '@/constants/CompactStyles';

interface Player {
  id: string;
  name: string;
}

interface PlayerSearchFieldProps {
  label: string;
  placeholder: string;
  searchText: string;
  selectedPlayer: Player | null;
  suggestions: Player[];
  showSuggestions: boolean;
  colors: any;
  onSearchTextChange: (text: string) => void;
  onPlayerSelect: (player: Player) => void;
  onAddNewPlayer: (playerName: string) => void;
  onFocus: () => void;
  testID?: string;
}

const PlayerSearchField = React.memo(function PlayerSearchField({
  label,
  placeholder,
  searchText,
  selectedPlayer,
  suggestions,
  showSuggestions,
  colors,
  onSearchTextChange,
  onPlayerSelect,
  onAddNewPlayer,
  onFocus,
  testID,
}: PlayerSearchFieldProps) {
  const handleAddNewPlayer = () => {
    if (searchText.trim()) {
      onAddNewPlayer(searchText.trim());
    }
  };

  const shouldShowAddOption = searchText.trim() && 
    !suggestions.some(player => 
      player.name.toLowerCase() === searchText.toLowerCase()
    );

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.searchInput,
          { 
            borderColor: colors.tabIconDefault,
            backgroundColor: colors.background,
            color: colors.text,
          },
          showSuggestions && [styles.searchInputFocused, { borderColor: colors.tint }]
        ]}
        value={searchText}
        onChangeText={onSearchTextChange}
        placeholder={placeholder}
        placeholderTextColor={colors.tabIconDefault}
        testID={testID}
        onFocus={onFocus}
      />

      {/* Search Suggestions */}
      {showSuggestions && (
        <View style={[styles.suggestionsContainer, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
          {/* Existing Players */}
          {suggestions.map((player, index) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.suggestionItem,
                { borderBottomColor: colors.tabIconDefault },
                index === suggestions.length - 1 && suggestions.length > 0 && shouldShowAddOption && 
                styles.suggestionItemLast
              ]}
              onPress={() => onPlayerSelect(player)}
              activeOpacity={0.7}
            >
              <Text style={[styles.suggestionText, { color: colors.text }]}>{player.name}</Text>
            </TouchableOpacity>
          ))}
          
          {/* Add New Player Option */}
          {shouldShowAddOption && (
            <TouchableOpacity
              style={[styles.addNewPlayerItem, { backgroundColor: colors.tint + '15' }]}
              onPress={handleAddNewPlayer}
              activeOpacity={0.7}
            >
              <Text style={[styles.addNewPlayerText, { color: colors.tint }]}>
                + Add &quot;{searchText.trim()}&quot; as new player
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

export default PlayerSearchField;

const styles = StyleSheet.create({
  section: {
    marginBottom: CompactStyles.sectionMargin,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: CompactStyles.smallMargin,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: CompactStyles.input.borderRadius,
    paddingVertical: CompactStyles.input.paddingVertical,
    paddingHorizontal: CompactStyles.input.paddingHorizontal,
    fontSize: CompactStyles.input.fontSize,
  },
  searchInputFocused: {
    borderWidth: 2,
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionItemLast: {
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  addNewPlayerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 4,
  },
  addNewPlayerText: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});