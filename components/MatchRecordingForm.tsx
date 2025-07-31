import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { CompactStyles } from '@/constants/CompactStyles';
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
  initialData?: Partial<CreateMatchData>;
  isEditing?: boolean;
}

// Legacy interface - can be removed after migration

interface Player {
  id: string;
  name: string;
}

export function MatchRecordingForm({ onSave, onCancel, clubId, initialData, isEditing = false }: MatchRecordingFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [matchType, setMatchType] = useState<'singles' | 'doubles'>(initialData?.match_type || 'singles');
  const [matchTypeRadioId, setMatchTypeRadioId] = useState(initialData?.match_type || 'singles');
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null);
  const [opponentSearchText, setOpponentSearchText] = useState(initialData?.opponent2_name || '');
  const [selectedPartner, setSelectedPartner] = useState<Player | null>(null);
  const [partnerSearchText, setPartnerSearchText] = useState(initialData?.partner3_name || '');
  const [selectedOpponentPartner, setSelectedOpponentPartner] = useState<Player | null>(null);
  const [opponentPartnerSearchText, setOpponentPartnerSearchText] = useState(initialData?.partner4_name || '');
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<'opponent' | 'partner' | 'opponentPartner' | null>(null);
  const [matchDate, setMatchDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  // Legacy state - will be removed
  const [tennisSets, setTennisSets] = useState<TennisSet[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [clubMembers, setClubMembers] = useState<Player[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [notes, setNotes] = useState(initialData?.notes || '');

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
    
    // Clear doubles fields when switching to singles
    if (selectedId === 'singles') {
      setSelectedPartner(null);
      setPartnerSearchText('');
      setSelectedOpponentPartner(null);
      setOpponentPartnerSearchText('');
    }
  };

  // Load real club members from database
  useEffect(() => {
    loadClubMembers();
  }, [clubId]);

  // Filter players based on active search field
  useEffect(() => {
    let searchText = '';
    if (activeSearchField === 'opponent') searchText = opponentSearchText;
    else if (activeSearchField === 'partner') searchText = partnerSearchText;
    else if (activeSearchField === 'opponentPartner') searchText = opponentPartnerSearchText;

    if (searchText.trim() === '') {
      setFilteredPlayers([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = clubMembers.filter(player => 
      player.name.toLowerCase().includes(searchLower)
    );
    
    setFilteredPlayers(filtered);
    setShowSuggestions(true);
  }, [opponentSearchText, partnerSearchText, opponentPartnerSearchText, clubMembers, activeSearchField]);

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

  const handlePlayerSelect = (player: Player, field: 'opponent' | 'partner' | 'opponentPartner') => {
    if (field === 'opponent') {
      setSelectedOpponent(player);
      setOpponentSearchText(player.name);
    } else if (field === 'partner') {
      setSelectedPartner(player);
      setPartnerSearchText(player.name);
    } else if (field === 'opponentPartner') {
      setSelectedOpponentPartner(player);
      setOpponentPartnerSearchText(player.name);
    }
    setShowSuggestions(false);
    setActiveSearchField(null);
    // Clear validation errors
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleAddNewPlayer = (field: 'opponent' | 'partner' | 'opponentPartner') => {
    let searchText = '';
    if (field === 'opponent') searchText = opponentSearchText;
    else if (field === 'partner') searchText = partnerSearchText;
    else if (field === 'opponentPartner') searchText = opponentPartnerSearchText;

    const newPlayer = {
      id: `new-player-${field}`,
      name: searchText.trim()
    };

    if (field === 'opponent') {
      setSelectedOpponent(newPlayer);
    } else if (field === 'partner') {
      setSelectedPartner(newPlayer);
    } else if (field === 'opponentPartner') {
      setSelectedOpponentPartner(newPlayer);
    }
    
    setShowSuggestions(false);
    setActiveSearchField(null);
    // Clear validation errors
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSearchTextChange = (text: string, field: 'opponent' | 'partner' | 'opponentPartner') => {
    if (field === 'opponent') {
      setOpponentSearchText(text);
      if (selectedOpponent && text !== selectedOpponent.name) {
        setSelectedOpponent(null);
      }
    } else if (field === 'partner') {
      setPartnerSearchText(text);
      if (selectedPartner && text !== selectedPartner.name) {
        setSelectedPartner(null);
      }
    } else if (field === 'opponentPartner') {
      setOpponentPartnerSearchText(text);
      if (selectedOpponentPartner && text !== selectedOpponentPartner.name) {
        setSelectedOpponentPartner(null);
      }
    }
    
    setActiveSearchField(field);
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

    // Validate doubles partners
    if (matchType === 'doubles') {
      if (!selectedPartner && !partnerSearchText.trim()) {
        errors.push('Please select or enter your partner');
      }

      if (partnerSearchText.trim() && !selectedPartner) {
        errors.push('Please select your partner from the list or add as new player');
      }

      if (!selectedOpponentPartner && !opponentPartnerSearchText.trim()) {
        errors.push('Please select or enter opponent\'s partner');
      }

      if (opponentPartnerSearchText.trim() && !selectedOpponentPartner) {
        errors.push('Please select opponent\'s partner from the list or add as new player');
      }
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
      player2_id: selectedOpponent?.id?.startsWith('new-player') ? null : selectedOpponent?.id || null,
      opponent2_name: selectedOpponent?.id?.startsWith('new-player') ? selectedOpponent.name : null,
      player3_id: selectedPartner?.id?.startsWith('new-player') ? null : selectedPartner?.id || null,
      partner3_name: selectedPartner?.id?.startsWith('new-player') ? selectedPartner?.name : null,
      player4_id: selectedOpponentPartner?.id?.startsWith('new-player') ? null : selectedOpponentPartner?.id || null,
      partner4_name: selectedOpponentPartner?.id?.startsWith('new-player') ? selectedOpponentPartner?.name : null,
      scores: scoreString,
      match_type: matchType,
      date: matchDate,
      notes: notes.trim() || undefined,
    };

    onSave(matchData);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: CompactStyles.scrollContent.paddingHorizontal,
    },
    title: {
      fontSize: CompactStyles.title.fontSize,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: CompactStyles.sectionMargin,
      textAlign: 'center',
    },
    section: {
      marginBottom: CompactStyles.sectionMargin,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: CompactStyles.smallMargin,
    },
    radioGroupContainer: {
      alignItems: 'flex-start',
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: CompactStyles.input.borderRadius,
      paddingVertical: CompactStyles.input.paddingVertical,
      paddingHorizontal: CompactStyles.input.paddingHorizontal,
      fontSize: CompactStyles.input.fontSize,
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
      borderRadius: CompactStyles.input.borderRadius,
      paddingVertical: CompactStyles.input.paddingVertical,
      paddingHorizontal: CompactStyles.input.paddingHorizontal,
      fontSize: CompactStyles.input.fontSize,
      color: colors.text,
      backgroundColor: colors.background,
    },
    addSetButton: {
      marginBottom: CompactStyles.itemMargin,
    },
    setContainer: {
      backgroundColor: colors.background,
      borderRadius: CompactStyles.input.borderRadius,
      padding: CompactStyles.itemMargin,
      marginBottom: CompactStyles.smallMargin,
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
    },
    setTitle: {
      fontSize: CompactStyles.input.fontSize,
      fontWeight: '600',
      color: colors.text,
      marginBottom: CompactStyles.smallMargin,
    },
    scoreInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompactStyles.itemMargin,
    },
    scoreInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 6,
      padding: CompactStyles.smallMargin,
      width: 60,
      textAlign: 'center',
      fontSize: CompactStyles.input.fontSize,
      color: colors.text,
      backgroundColor: colors.background,
    },
    scoreLabel: {
      fontSize: CompactStyles.input.fontSize,
      color: colors.text,
      flex: 1,
    },
    errorContainer: {
      backgroundColor: '#ffebee',
      padding: CompactStyles.smallMargin,
      borderRadius: CompactStyles.input.borderRadius,
      marginBottom: CompactStyles.itemMargin,
    },
    errorText: {
      color: '#c62828',
      fontSize: CompactStyles.errorText.fontSize,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: CompactStyles.smallMargin,
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
    notesInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      minHeight: 80,
      textAlignVertical: 'top',
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

        {/* Your Partner - Only show for doubles matches */}
        {matchType === 'doubles' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Partner</Text>
            <TextInput
              style={[
                styles.searchInput,
                showSuggestions && activeSearchField === 'partner' && styles.searchInputFocused
              ]}
              value={partnerSearchText}
              onChangeText={(text) => handleSearchTextChange(text, 'partner')}
              placeholder="🔍 Search or add partner..."
              testID="partner-search-input"
              onFocus={() => {
                setActiveSearchField('partner');
                if (partnerSearchText.trim()) {
                  setShowSuggestions(true);
                }
              }}
            />

            {/* Search Suggestions for Partner */}
            {showSuggestions && activeSearchField === 'partner' && (
              <View style={styles.suggestionsContainer}>
                {/* Existing Players */}
                {filteredPlayers.map((player, index) => (
                  <TouchableOpacity
                    key={player.id}
                    style={[
                      styles.suggestionItem,
                      index === filteredPlayers.length - 1 && filteredPlayers.length > 0 && partnerSearchText.trim() && 
                      !filteredPlayers.some(p => p.name.toLowerCase() === partnerSearchText.toLowerCase()) && 
                      styles.suggestionItemLast
                    ]}
                    onPress={() => handlePlayerSelect(player, 'partner')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{player.name}</Text>
                  </TouchableOpacity>
                ))}
                
                {/* Add New Player Option */}
                {partnerSearchText.trim() && 
                 !filteredPlayers.some(player => 
                   player.name.toLowerCase() === partnerSearchText.toLowerCase()
                 ) && (
                  <TouchableOpacity
                    style={styles.addNewPlayerItem}
                    onPress={() => handleAddNewPlayer('partner')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addNewPlayerText}>
                      + Add &quot;{partnerSearchText.trim()}&quot; as new player
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Opponent Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{matchType === 'doubles' ? 'Opponent 1' : 'Opponent'}</Text>
          <TextInput
            style={[
              styles.searchInput,
              showSuggestions && styles.searchInputFocused
            ]}
            value={opponentSearchText}
            onChangeText={(text) => handleSearchTextChange(text, 'opponent')}
            placeholder="🔍 Search or add opponent..."
            testID="opponent-search-input"
            onFocus={() => {
              setActiveSearchField('opponent');
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
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.suggestionItem,
                    index === filteredPlayers.length - 1 && filteredPlayers.length > 0 && opponentSearchText.trim() && 
                    !filteredPlayers.some(p => p.name.toLowerCase() === opponentSearchText.toLowerCase()) && 
                    styles.suggestionItemLast
                  ]}
                  onPress={() => handlePlayerSelect(player, activeSearchField || 'opponent')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{player.name}</Text>
                </TouchableOpacity>
              ))}
              
              {/* Add New Player Option */}
              {opponentSearchText.trim() && 
               !filteredPlayers.some(player => 
                 player.name.toLowerCase() === opponentSearchText.toLowerCase()
               ) && (
                <TouchableOpacity
                  style={styles.addNewPlayerItem}
                  onPress={() => handleAddNewPlayer(activeSearchField || 'opponent')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addNewPlayerText}>
                    + Add &quot;{opponentSearchText.trim()}&quot; as new player
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Opponent's Partner - Only show for doubles matches */}
        {matchType === 'doubles' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opponent 2</Text>
            <TextInput
                style={[
                  styles.searchInput,
                  showSuggestions && activeSearchField === 'opponentPartner' && styles.searchInputFocused
                ]}
                value={opponentPartnerSearchText}
                onChangeText={(text) => handleSearchTextChange(text, 'opponentPartner')}
                placeholder="🔍 Search or add opponent&apos;s partner..."
                testID="opponent-partner-search-input"
                onFocus={() => {
                  setActiveSearchField('opponentPartner');
                  if (opponentPartnerSearchText.trim()) {
                    setShowSuggestions(true);
                  }
                }}
              />

              {/* Search Suggestions for Opponent's Partner */}
              {showSuggestions && activeSearchField === 'opponentPartner' && (
                <View style={styles.suggestionsContainer}>
                  {/* Existing Players */}
                  {filteredPlayers.map((player, index) => (
                    <TouchableOpacity
                      key={player.id}
                      style={[
                        styles.suggestionItem,
                        index === filteredPlayers.length - 1 && filteredPlayers.length > 0 && opponentPartnerSearchText.trim() && 
                        !filteredPlayers.some(p => p.name.toLowerCase() === opponentPartnerSearchText.toLowerCase()) && 
                        styles.suggestionItemLast
                      ]}
                      onPress={() => handlePlayerSelect(player, 'opponentPartner')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{player.name}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Add New Player Option */}
                  {opponentPartnerSearchText.trim() && 
                   !filteredPlayers.some(player => 
                     player.name.toLowerCase() === opponentPartnerSearchText.toLowerCase()
                   ) && (
                    <TouchableOpacity
                      style={styles.addNewPlayerItem}
                      onPress={() => handleAddNewPlayer('opponentPartner')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addNewPlayerText}>
                        + Add &quot;{opponentPartnerSearchText.trim()}&quot; as new player
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
        )}

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
        {(matchType === 'singles' && selectedOpponent) || 
         (matchType === 'doubles' && selectedOpponent && selectedPartner && selectedOpponentPartner) ? (
          <View style={styles.section}>
            <TennisScoreEntry
              player1Name={matchType === 'doubles' ? 
                (selectedPartner ? `You & ${selectedPartner.name}` : "You & [Partner not selected]") : 
                "You"}
              player2Name={matchType === 'doubles' ? 
                (selectedOpponentPartner ? 
                  `${selectedOpponent.name} & ${selectedOpponentPartner.name}` : 
                  `${selectedOpponent.name} & [Partner not selected]`) : 
                selectedOpponent.name}
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
              <Text style={styles.placeholderTitle}>⏳ Select {matchType === 'doubles' ? 'all players' : 'an opponent'} to continue</Text>
              <Text style={styles.placeholderText}>
                {matchType === 'doubles' ? 
                  'Select your partner and both opponents to start recording match scores' :
                  'Search for a club member or add a new player to start recording match scores'}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Great competitive match!"
            placeholderTextColor={colors.tabIconDefault}
            multiline
            testID="notes-input"
          />
        </View>
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