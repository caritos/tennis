import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  TextInput,
  Pressable,
} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { CreateMatchData } from '../services/matchService';
import { isValidTennisScore } from '../utils/tennisScore';
import { initializeDatabase } from '../database/database';

interface MatchRecordingFormProps {
  onSave: (matchData: CreateMatchData) => void;
  onCancel: () => void;
  clubId: string;
}

interface Set {
  playerScore: string;
  opponentScore: string;
  tiebreakPlayerScore?: string;
  tiebreakOpponentScore?: string;
}

interface Player {
  id: string;
  name: string;
}

export function MatchRecordingForm({ onSave, onCancel, clubId }: MatchRecordingFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null);
  const [isUnregisteredOpponent, setIsUnregisteredOpponent] = useState(false);
  const [unregisteredOpponentName, setUnregisteredOpponentName] = useState('');
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [sets, setSets] = useState<Set[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [clubMembers, setClubMembers] = useState<Player[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Load real club members from database
  useEffect(() => {
    loadClubMembers();
  }, [clubId]);

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

  const addSet = () => {
    setSets([...sets, { playerScore: '', opponentScore: '' }]);
  };

  const needsTiebreak = (playerScore: string, opponentScore: string): boolean => {
    const p1 = parseInt(playerScore);
    const p2 = parseInt(opponentScore);
    return (p1 === 7 && p2 === 6) || (p1 === 6 && p2 === 7);
  };

  const isValidTiebreakScore = (playerScore: string, opponentScore: string): boolean => {
    const p1 = parseInt(playerScore);
    const p2 = parseInt(opponentScore);
    
    if (isNaN(p1) || isNaN(p2)) return false;
    
    // Tiebreak must be won by at least 2 points, minimum 7
    if (p1 >= 7 && p1 - p2 >= 2) return true;
    if (p2 >= 7 && p2 - p1 >= 2) return true;
    
    return false;
  };

  const updateSetScore = (setIndex: number, field: 'playerScore' | 'opponentScore', value: string) => {
    const updatedSets = [...sets];
    updatedSets[setIndex][field] = value;
    setSets(updatedSets);

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const updateTiebreakScore = (setIndex: number, field: 'tiebreakPlayerScore' | 'tiebreakOpponentScore', value: string) => {
    const updatedSets = [...sets];
    updatedSets[setIndex][field] = value;
    setSets(updatedSets);

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Validate scores in real-time for better UX
  useEffect(() => {
    if (sets.length > 0) {
      const errors: string[] = [];
      
      sets.forEach((set, index) => {
        const playerScore = parseInt(set.playerScore);
        const opponentScore = parseInt(set.opponentScore);

        if (!isNaN(playerScore) && !isNaN(opponentScore)) {
          if (playerScore > 7 || opponentScore > 7 || 
              (playerScore === 8 && opponentScore === 6)) {
            errors.push('Invalid tennis score');
          }
          
          // Check tiebreak validation
          if (needsTiebreak(set.playerScore, set.opponentScore)) {
            if (set.tiebreakPlayerScore && set.tiebreakOpponentScore) {
              if (!isValidTiebreakScore(set.tiebreakPlayerScore, set.tiebreakOpponentScore)) {
                errors.push('Invalid tiebreak score');
              }
            }
          }
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
      }
    }
  }, [sets]);

  const handlePlayerSelect = (player: Player) => {
    setSelectedOpponent(player);
    setIsUnregisteredOpponent(false);
    setShowPlayerDropdown(false);
    // Clear validation errors
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleUnregisteredOpponentSelect = () => {
    setSelectedOpponent(null);
    setIsUnregisteredOpponent(true);
    setShowPlayerDropdown(false);
    // Clear validation errors
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedOpponent && !isUnregisteredOpponent) {
      errors.push('Please select an opponent');
    }

    if (isUnregisteredOpponent && !unregisteredOpponentName.trim()) {
      errors.push('Please enter opponent name');
    }

    if (sets.length === 0) {
      errors.push('Please add at least one set score');
    }

    // Validate each set score
    sets.forEach((set, index) => {
      const playerScore = parseInt(set.playerScore);
      const opponentScore = parseInt(set.opponentScore);

      if (isNaN(playerScore) || isNaN(opponentScore)) {
        errors.push(`Set ${index + 1}: Please enter valid scores`);
      } else if (playerScore > 7 || opponentScore > 7) {
        errors.push('Invalid tennis score');
      }
    });

    // Validate complete match score
    if (sets.length > 0 && errors.length === 0) {
      const scoreString = sets.map(set => `${set.playerScore}-${set.opponentScore}`).join(',');
      if (!isValidTennisScore(scoreString)) {
        errors.push('Invalid tennis score');
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

    const scoreString = sets.map(set => {
      let setScore = `${set.playerScore}-${set.opponentScore}`;
      if (needsTiebreak(set.playerScore, set.opponentScore) && 
          set.tiebreakPlayerScore && set.tiebreakOpponentScore) {
        setScore += `(${set.tiebreakPlayerScore}-${set.tiebreakOpponentScore})`;
      }
      return setScore;
    }).join(',');

    const matchData: CreateMatchData = {
      club_id: clubId,
      player1_id: user.id, // Use actual user ID from auth context
      player2_id: selectedOpponent?.id || null,
      opponent2_name: isUnregisteredOpponent ? unregisteredOpponentName.trim() : null,
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
    radioGroup: {
      flexDirection: 'row',
      gap: 16,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    radioLabel: {
      fontSize: 16,
      color: colors.text,
    },
    opponentSelector: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.background,
    },
    opponentText: {
      fontSize: 16,
      color: selectedOpponent ? colors.text : colors.tabIconDefault,
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
    dropdown: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      marginTop: 8,
      maxHeight: 200,
    },
    dropdownItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.tabIconDefault,
    },
    dropdownItemText: {
      fontSize: 16,
      color: colors.text,
    },
    unregisteredOpponentSection: {
      marginTop: 12,
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
          <View style={styles.radioGroup}>
            <View style={styles.radioOption}>
              <Checkbox
                value={matchType === 'singles'}
                onValueChange={() => setMatchType('singles')}
                color={matchType === 'singles' ? colors.tint : undefined}
                testID="singles-radio"
              />
              <Text style={styles.radioLabel}>Singles</Text>
            </View>
            <View style={styles.radioOption}>
              <Checkbox
                value={matchType === 'doubles'}
                onValueChange={() => setMatchType('doubles')}
                color={matchType === 'doubles' ? colors.tint : undefined}
                testID="doubles-radio"
              />
              <Text style={styles.radioLabel}>Doubles</Text>
            </View>
          </View>
        </View>

        {/* Opponent Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opponent</Text>
          <Pressable 
            style={styles.opponentSelector} 
            testID="opponent-selector"
            onPress={() => setShowPlayerDropdown(!showPlayerDropdown)}
          >
            <Text style={styles.opponentText}>
              {selectedOpponent ? selectedOpponent.name : 
               isUnregisteredOpponent ? unregisteredOpponentName || 'Enter opponent name' :
               'Select Opponent'}
            </Text>
          </Pressable>

          {/* Player Dropdown */}
          {showPlayerDropdown && (
            <View style={styles.dropdown}>
              {clubMembers.map((player) => (
                <Pressable
                  key={player.id}
                  style={styles.dropdownItem}
                  onPress={() => handlePlayerSelect(player)}
                >
                  <Text style={styles.dropdownItemText}>{player.name}</Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.dropdownItem}
                onPress={handleUnregisteredOpponentSelect}
              >
                <Text style={styles.dropdownItemText}>Add Unregistered Opponent</Text>
              </Pressable>
            </View>
          )}

          {/* Unregistered Opponent Name Input */}
          {isUnregisteredOpponent && (
            <View style={styles.unregisteredOpponentSection}>
              <Text style={styles.inputLabel}>Opponent Name</Text>
              <TextInput
                style={styles.textInput}
                value={unregisteredOpponentName}
                onChangeText={(text) => {
                  setUnregisteredOpponentName(text);
                  // Clear validation errors when user starts typing
                  if (validationErrors.length > 0) {
                    setValidationErrors([]);
                  }
                }}
                placeholder="Enter opponent's full name"
                testID="unregistered-opponent-name"
              />
            </View>
          )}
        </View>

        {/* Match Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Date</Text>
          <TextInput
            style={styles.dateInput}
            value={matchDate}
            onChangeText={setMatchDate}
            testID="date-picker"
          />
        </View>

        {/* Score Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Score</Text>
          <View style={styles.addSetButton}>
            <Button
              title="Add Set"
              onPress={addSet}
              color={colors.tint}
              testID="add-set-button"
            />
          </View>

          {sets.map((set, index) => (
            <View key={index} style={styles.setContainer}>
              <Text style={styles.setTitle}>Set {index + 1}</Text>
              <View style={styles.scoreInputRow}>
                <Text style={styles.scoreLabel}>You</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={set.playerScore}
                  onChangeText={(value) => updateSetScore(index, 'playerScore', value)}
                  keyboardType="numeric"
                  testID={`set-${index + 1}-player-score`}
                />
                <Text style={styles.scoreLabel}>Opponent</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={set.opponentScore}
                  onChangeText={(value) => updateSetScore(index, 'opponentScore', value)}
                  keyboardType="numeric"
                  testID={`set-${index + 1}-opponent-score`}
                />
              </View>

              {/* Tiebreak Inputs */}
              {needsTiebreak(set.playerScore, set.opponentScore) && (
                <View style={styles.tiebreakSection}>
                  <Text style={styles.tiebreakTitle}>Tiebreak</Text>
                  <View style={styles.scoreInputRow}>
                    <Text style={styles.scoreLabel}>You</Text>
                    <TextInput
                      style={styles.scoreInput}
                      value={set.tiebreakPlayerScore || ''}
                      onChangeText={(value) => updateTiebreakScore(index, 'tiebreakPlayerScore', value)}
                      keyboardType="numeric"
                      testID={`set-${index + 1}-tiebreak-player`}
                    />
                    <Text style={styles.scoreLabel}>Opponent</Text>
                    <TextInput
                      style={styles.scoreInput}
                      value={set.tiebreakOpponentScore || ''}
                      onChangeText={(value) => updateTiebreakScore(index, 'tiebreakOpponentScore', value)}
                      keyboardType="numeric"
                      testID={`set-${index + 1}-tiebreak-opponent`}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
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