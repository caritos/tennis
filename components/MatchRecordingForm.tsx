import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  TextInput,
  Pressable,
} from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { CreateMatchData } from '../services/matchService';
import { isValidTennisScore, validateSetScore } from '../utils/tennisScore';
import { TennisScoreEntry } from './TennisScoreEntry';
import { CalendarDatePicker } from './CalendarDatePicker';
import { TennisSet } from '@/types/tennis';
import { formatScoreString } from '../utils/tennisUtils';
import { initializeDatabase } from '../database/database';

interface MatchRecordingFormProps {
  onSave: (matchData: CreateMatchData) => void;
  onCancel: () => void;
  clubId: string;
}

// Legacy interface - can be removed after migration

interface Player {
  id: string;
  name: string;
}

export function MatchRecordingForm({ onSave, onCancel, clubId }: MatchRecordingFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [matchTypeRadioId, setMatchTypeRadioId] = useState('singles');
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null);
  const [opponentSearchText, setOpponentSearchText] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  // Legacy state - will be removed
  const [tennisSets, setTennisSets] = useState<TennisSet[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [clubMembers, setClubMembers] = useState<Player[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Radio button configuration for match type
  const matchTypeRadioButtons = useMemo(() => [
    {
      id: 'singles',
      label: 'Singles',
      value: 'singles',
      color: colors.tint,
      labelStyle: { color: colors.text, fontSize: 16 },
    },
    {
      id: 'doubles', 
      label: 'Doubles',
      value: 'doubles',
      color: colors.tint,
      labelStyle: { color: colors.text, fontSize: 16 },
    }
  ], [colors.tint, colors.text]);

  // Handle radio button selection
  const handleMatchTypeChange = (selectedId: string) => {
    setMatchTypeRadioId(selectedId);
    setMatchType(selectedId as 'singles' | 'doubles');
  };

  // Load real club members from database
  useEffect(() => {
    loadClubMembers();
  }, [clubId]);

  // Filter players based on search text
  useEffect(() => {
    if (opponentSearchText.trim() === '') {
      setFilteredPlayers([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = opponentSearchText.toLowerCase();
    const filtered = clubMembers.filter(player => 
      player.name.toLowerCase().includes(searchLower)
    );
    
    setFilteredPlayers(filtered);
    setShowSuggestions(true);
  }, [opponentSearchText, clubMembers]);

  const loadClubMembers = async () => {
    if (!clubId) return;
    
    try {
      const db = await initializeDatabase();
      
      // Get all club members except current user
      const members = await db.getAllAsync(`
        SELECT u.id, u.full_name 
        FROM club_members cm 
        JOIN users u ON cm.user_id = u.id 
        WHERE cm.club_id = ? AND u.id != ?
      `, [clubId, user?.id || '']);
      
      const playerList: Player[] = members?.map((member: any) => ({
        id: member.id,
        name: member.full_name
      })) || [];
      
      console.log('📋 Loaded club members:', playerList);
      setClubMembers(playerList);
    } catch (error) {
      console.error('Failed to load club members:', error);
      setClubMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Legacy functions - removed in favor of TennisScoreEntry component

  const handlePlayerSelect = (player: Player) => {
    setSelectedOpponent(player);
    setOpponentSearchText(player.name);
    setShowSuggestions(false);
    // Clear validation errors
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleAddNewPlayer = () => {
    // Create a temporary player object for new opponent
    const newPlayer = {
      id: 'new-player',
      name: opponentSearchText.trim()
    };
    setSelectedOpponent(newPlayer);
    setShowSuggestions(false);
    // Clear validation errors
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSearchTextChange = (text: string) => {
    setOpponentSearchText(text);
    // Reset selected opponent if user is typing something different
    if (selectedOpponent && text !== selectedOpponent.name) {
      setSelectedOpponent(null);
    }
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedOpponent && !opponentSearchText.trim()) {
      errors.push('Please select or enter an opponent');
    }

    if (opponentSearchText.trim() && !selectedOpponent) {
      errors.push('Please select an opponent from the list or add as new player');
    }

    if (tennisSets.length === 0) {
      errors.push('Please add at least one set score');
    }

    // Validate complete match score using tennis sets
    if (tennisSets.length > 0) {
      const scoreString = formatScoreString(tennisSets);
      if (!isValidTennisScore(scoreString)) {
        errors.push('Please complete the match - a winner must be determined');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setValidationErrors(['Please sign in to record a match']);
      return;
    }

    // Use the new tennis sets format
    const scoreString = formatScoreString(tennisSets);
    
    const matchData: CreateMatchData = {
      club_id: clubId,
      player1_id: user.id, // Use actual user ID from auth context
      player2_id: selectedOpponent?.id === 'new-player' ? null : selectedOpponent?.id || null,
      opponent2_name: selectedOpponent?.id === 'new-player' ? selectedOpponent.name : null,
      scores: scoreString,
      match_type: matchType,
      date: matchDate,
    };

    onSave(matchData);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    radioGroupContainer: {
      alignItems: 'flex-start',
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    searchInputFocused: {
      borderColor: colors.tint,
      borderWidth: 2,
    },
    dateInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    addSetButton: {
      marginBottom: 16,
    },
    setContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
    },
    setTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    scoreInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    scoreInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 6,
      padding: 8,
      width: 60,
      textAlign: 'center',
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    scoreLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    errorContainer: {
      backgroundColor: '#ffebee',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: '#c62828',
      fontSize: 14,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    buttonWrapper: {
      flex: 1,
    },
    suggestionsContainer: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      marginTop: 4,
      maxHeight: 200,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.tabIconDefault,
    },
    suggestionItemLast: {
      borderBottomWidth: 0,
    },
    suggestionText: {
      fontSize: 16,
      color: colors.text,
    },
    addNewPlayerItem: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.tabIconDefault,
      backgroundColor: colors.background,
    },
    addNewPlayerText: {
      fontSize: 16,
      color: colors.tint,
      fontWeight: '500',
    },
    placeholderContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.tabIconDefault,
      borderStyle: 'dashed',
    },
    placeholderTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.tabIconDefault,
      marginBottom: 8,
      textAlign: 'center',
    },
    placeholderText: {
      fontSize: 14,
      color: colors.tabIconDefault,
      textAlign: 'center',
      lineHeight: 20,
    },
    inputLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 6,
      fontWeight: '500',
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    tiebreakSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.tabIconDefault,
    },
    tiebreakTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <Text style={styles.title}>Record Match</Text>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <View style={styles.errorContainer}>
            {validationErrors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                {error}
              </Text>
            ))}
          </View>
        )}

        {/* Match Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Type</Text>
          <RadioGroup 
            radioButtons={matchTypeRadioButtons}
            onPress={handleMatchTypeChange}
            selectedId={matchTypeRadioId}
            layout="row"
            containerStyle={styles.radioGroupContainer}
          />
        </View>

        {/* Opponent Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opponent</Text>
          <TextInput
            style={[
              styles.searchInput,
              showSuggestions && styles.searchInputFocused
            ]}
            value={opponentSearchText}
            onChangeText={handleSearchTextChange}
            placeholder="🔍 Search or add opponent..."
            testID="opponent-search-input"
            onFocus={() => {
              if (opponentSearchText.trim()) {
                setShowSuggestions(true);
              }
            }}
          />

          {/* Search Suggestions */}
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              {/* Existing Players */}
              {filteredPlayers.map((player, index) => (
                <Pressable
                  key={player.id}
                  style={[
                    styles.suggestionItem,
                    index === filteredPlayers.length - 1 && filteredPlayers.length > 0 && opponentSearchText.trim() && 
                    !filteredPlayers.some(p => p.name.toLowerCase() === opponentSearchText.toLowerCase()) && 
                    styles.suggestionItemLast
                  ]}
                  onPress={() => handlePlayerSelect(player)}
                >
                  <Text style={styles.suggestionText}>{player.name}</Text>
                </Pressable>
              ))}
              
              {/* Add New Player Option */}
              {opponentSearchText.trim() && 
               !filteredPlayers.some(player => 
                 player.name.toLowerCase() === opponentSearchText.toLowerCase()
               ) && (
                <Pressable
                  style={styles.addNewPlayerItem}
                  onPress={handleAddNewPlayer}
                >
                  <Text style={styles.addNewPlayerText}>
                    + Add "{opponentSearchText.trim()}" as new player
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Match Date */}
        <View style={styles.section}>
          <CalendarDatePicker
            selectedDate={matchDate}
            onDateChange={setMatchDate}
            label="Match Date"
            placeholder="Select match date"
            maxDate={new Date().toISOString().split('T')[0]} // Can't select future dates
          />
        </View>

        {/* Tennis Score Entry */}
        {selectedOpponent ? (
          <View style={styles.section}>
            <TennisScoreEntry
              player1Name="You"
              player2Name={selectedOpponent.name}
              matchType={matchType}
              onScoreChange={setTennisSets}
              initialSets={tennisSets}
              showPreview={true}
              compact={false}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderTitle}>⏳ Select an opponent to continue</Text>
              <Text style={styles.placeholderText}>
                Search for a club member or add a new player to start recording match scores
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button
            title="Cancel"
            onPress={onCancel}
            color={colors.tabIconDefault}
            testID="cancel-button"
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="Save Match"
            onPress={handleSave}
            color={colors.tint}
            testID="save-match-button"
          />
        </View>
      </View>
    </View>
  );
}