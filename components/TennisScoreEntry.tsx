import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TennisScoreboardDisplay } from './TennisScoreboardDisplay';
import { TennisSet } from '@/types/tennis';
import { validateSetScore } from '../utils/tennisScore';
import { calculateMatchWinner, isMatchComplete } from '../utils/tennisUtils';
import { useNotification } from '@/contexts/NotificationContext';

interface SetInput {
  playerScore: string;
  opponentScore: string;
  tiebreakPlayerScore?: string;
  tiebreakOpponentScore?: string;
}

export interface TennisScoreEntryProps {
  player1Name: string;
  player2Name: string;
  matchType: 'singles' | 'doubles';
  onScoreChange: (sets: TennisSet[]) => void;
  initialSets?: TennisSet[];
  showPreview?: boolean;
  compact?: boolean;
}

export function TennisScoreEntry({
  player1Name,
  player2Name,
  matchType,
  onScoreChange,
  initialSets = [],
  showPreview = true,
  compact = false
}: TennisScoreEntryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showError } = useNotification();

  const [setInputs, setSetInputs] = useState<SetInput[]>([
    { playerScore: '', opponentScore: '' }
  ]);
  const [validSets, setValidSets] = useState<TennisSet[]>(initialSets);
  const [currentTiebreakSet, setCurrentTiebreakSet] = useState<number | null>(null);
  const [tiebreakPlayerScore, setTiebreakPlayerScore] = useState('');
  const [tiebreakOpponentScore, setTiebreakOpponentScore] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Only initialize once on mount - don't react to initialSets changes during normal use
  useEffect(() => {
    console.log('🎾 TennisScoreEntry initializing with initialSets:', initialSets);
    
    if (initialSets.length > 0) {
      console.log('🎾 Mapping initialSets to inputs...');
      const inputs = initialSets.map(set => ({
        playerScore: set.playerScore?.toString() || '',
        opponentScore: set.opponentScore?.toString() || '',
        tiebreakPlayerScore: set.tiebreak?.playerScore?.toString() || '',
        tiebreakOpponentScore: set.tiebreak?.opponentScore?.toString() || '',
      }));
      
      console.log('🎾 Generated inputs:', inputs);
      
      // Add empty set for next entry if match not complete
      if (initialSets.length < 5 && !isMatchComplete(initialSets)) {
        inputs.push({ playerScore: '', opponentScore: '' });
      }
      
      setSetInputs(inputs);
      setValidSets(initialSets);
      console.log('🎾 Set inputs and valid sets updated');
    } else {
      console.log('🎾 No initialSets to process - starting fresh');
    }
  }, []); // Empty dependency array - only run on mount

  // Use shared utility function

  const needsTiebreak = (playerScore: string, opponentScore: string): boolean => {
    const p1 = parseInt(playerScore);
    const p2 = parseInt(opponentScore);
    return (p1 === 7 && p2 === 6) || (p1 === 6 && p2 === 7);
  };

  const validateTiebreakScore = (playerScore: string, opponentScore: string): boolean => {
    const p1 = parseInt(playerScore);
    const p2 = parseInt(opponentScore);
    
    if (isNaN(p1) || isNaN(p2)) return false;
    
    // Tiebreak must be won by at least 2 points, minimum 7
    if (p1 >= 7 && p1 - p2 >= 2) return true;
    if (p2 >= 7 && p2 - p1 >= 2) return true;
    
    return false;
  };

  const updateSetScore = (setIndex: number, field: 'playerScore' | 'opponentScore', value: string) => {
    console.log(`🎾 updateSetScore: Set ${setIndex + 1}, ${field} = "${value}"`);
    const updatedInputs = [...setInputs];
    updatedInputs[setIndex][field] = value;
    setSetInputs(updatedInputs);

    // Clear validation errors when typing
    setValidationErrors([]);

    // Auto-validate when both scores are entered and are 1-2 digits
    const currentSet = updatedInputs[setIndex];
    const playerScore = field === 'playerScore' ? value : currentSet.playerScore;
    const opponentScore = field === 'opponentScore' ? value : currentSet.opponentScore;
    
    console.log(`🎾 Current set ${setIndex + 1} scores: ${playerScore} - ${opponentScore}`);
    
    // Validate immediately if both scores look like valid tennis scores (1-2 digits)
    if (playerScore.length >= 1 && opponentScore.length >= 1 && 
        /^\d{1,2}$/.test(playerScore) && /^\d{1,2}$/.test(opponentScore)) {
      console.log('🎾 Auto-validating set scores:', playerScore, '-', opponentScore);
      setTimeout(() => validateAndUpdateSet(setIndex), 100); // Small delay to ensure state is updated
    }
  };

  const validateAndUpdateSet = (setIndex: number) => {
    const currentInputs = [...setInputs];
    const currentSet = currentInputs[setIndex];
    
    // Check if this set needs tiebreak
    if (needsTiebreak(currentSet.playerScore, currentSet.opponentScore)) {
      setCurrentTiebreakSet(setIndex);
      setTiebreakPlayerScore(currentSet.tiebreakPlayerScore || '');
      setTiebreakOpponentScore(currentSet.tiebreakOpponentScore || '');
    }

    // Update valid sets
    updateValidSets(currentInputs);
  };

  const updateValidSets = (inputs: SetInput[]) => {
    console.log('🎾 updateValidSets called with inputs:', inputs);
    const newValidSets: TennisSet[] = [];
    const errors: string[] = [];

    inputs.forEach((input, index) => {
      const playerScore = parseInt(input.playerScore);
      const opponentScore = parseInt(input.opponentScore);

      // Allow editing by only validating if both scores are present and numeric
      if (!isNaN(playerScore) && !isNaN(opponentScore) && input.playerScore !== '' && input.opponentScore !== '') {
        if (validateSetScore(playerScore, opponentScore)) {
          const set: TennisSet = { playerScore, opponentScore };
          
          // Add tiebreak if needed and valid
          if (needsTiebreak(input.playerScore, input.opponentScore)) {
            const tbPlayer = parseInt(input.tiebreakPlayerScore || '');
            const tbOpponent = parseInt(input.tiebreakOpponentScore || '');
            
            if (!isNaN(tbPlayer) && !isNaN(tbOpponent) && 
                validateTiebreakScore(input.tiebreakPlayerScore || '', input.tiebreakOpponentScore || '')) {
              set.tiebreak = { playerScore: tbPlayer, opponentScore: tbOpponent };
            } else if (input.tiebreakPlayerScore || input.tiebreakOpponentScore) {
              errors.push(`Set ${index + 1}: Invalid tiebreak score`);
              return; // Skip this set
            } else {
              // Tiebreak needed but not entered yet - don't add this set to valid sets yet
              console.log(`🎾 Set ${index + 1} needs tiebreak, waiting for tiebreak entry`);
              return; // Skip this set until tiebreak is complete
            }
          }
          
          newValidSets.push(set);
          console.log(`🎾 Added valid set ${index + 1}:`, set);
        } else {
          errors.push(`Set ${index + 1}: Invalid tennis score (${playerScore}-${opponentScore})`);
          console.log(`🎾 Invalid set ${index + 1}:`, playerScore, opponentScore);
        }
      }
    });

    console.log('🎾 Final valid sets:', newValidSets);
    console.log('🎾 Calling onScoreChange with:', newValidSets);
    console.log('🎾 onScoreChange function exists:', typeof onScoreChange === 'function');
    setValidSets(newValidSets);
    setValidationErrors(errors);
    onScoreChange(newValidSets);

    // Auto-add new set if current set is complete and match not finished
    if (newValidSets.length === inputs.length && 
        newValidSets.length < 5 && 
        !isMatchComplete(newValidSets)) {
      const lastInput = inputs[inputs.length - 1];
      if (lastInput.playerScore && lastInput.opponentScore) {
        setSetInputs([...inputs, { playerScore: '', opponentScore: '' }]);
      }
    }
  };

  const handleTiebreakSave = () => {
    if (!validateTiebreakScore(tiebreakPlayerScore, tiebreakOpponentScore)) {
      showError('Invalid Tiebreak', 'Tiebreak must be won by at least 2 points with a minimum of 7 points.');
      return;
    }

    const updatedInputs = [...setInputs];
    if (currentTiebreakSet !== null) {
      updatedInputs[currentTiebreakSet].tiebreakPlayerScore = tiebreakPlayerScore;
      updatedInputs[currentTiebreakSet].tiebreakOpponentScore = tiebreakOpponentScore;
      setSetInputs(updatedInputs);
      updateValidSets(updatedInputs);
    }

    setCurrentTiebreakSet(null);
    setTiebreakPlayerScore('');
    setTiebreakOpponentScore('');
  };

  const getCurrentWinner = () => calculateMatchWinner(validSets);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scoreboardContainer: {
      marginBottom: 24,
    },
    entryContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    entryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    setContainer: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
    },
    setHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    completedSetHeader: {
      color: '#4CAF50',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    playerLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    scoreInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 6,
      padding: 12,
      width: 60,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      backgroundColor: colors.background,
    },
    completedScoreInput: {
      borderColor: '#4CAF50',
      borderWidth: 2,
      backgroundColor: '#f1f8e9',
    },
    vsText: {
      fontSize: 16,
      color: colors.tabIconDefault,
      marginHorizontal: 16,
      fontWeight: '600',
    },
    tiebreakButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      marginTop: 8,
    },
    tiebreakButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
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
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 24,
      width: '80%',
      maxWidth: 300,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 6,
      marginHorizontal: 4,
    },
    cancelButton: {
      backgroundColor: colors.tabIconDefault,
    },
    saveButton: {
      backgroundColor: colors.tint,
    },
    modalButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    completedMatch: {
      borderColor: '#4CAF50',
      borderWidth: 2,
    },
  });

  return (
    <View style={styles.container}>
      {/* Live Scoreboard Preview */}
      {showPreview && (
        <View style={styles.scoreboardContainer}>
          <TennisScoreboardDisplay
            player1Name={player1Name}
            player2Name={player2Name}
            sets={validSets}
            isComplete={isMatchComplete(validSets)}
            winner={getCurrentWinner()}
            matchType={matchType}
            compact={compact}
          />
        </View>
      )}

      {/* Score Entry Form */}
      <View style={[styles.entryContainer, isMatchComplete(validSets) ? styles.completedMatch : {}]}>
        <Text style={styles.entryTitle}>
          {isMatchComplete(validSets) ? 'Match Complete!' : 'Enter Set Scores'}
        </Text>

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

        {/* Set Entry Forms */}
        {setInputs.map((setInput, index) => {
          const isCompleted = validSets[index] !== undefined;
          const showTiebreakButton = needsTiebreak(setInput.playerScore, setInput.opponentScore) && 
                                   (!setInput.tiebreakPlayerScore || !setInput.tiebreakOpponentScore);

          return (
            <View key={index} style={styles.setContainer}>
              <Text style={[styles.setHeader, isCompleted ? styles.completedSetHeader : {}]}>
                Set {index + 1} {isCompleted && '✓'}
              </Text>
              
              <View style={styles.scoreRow}>
                <Text style={styles.playerLabel}>{player1Name}</Text>
                <TextInput
                  style={[styles.scoreInput, isCompleted ? styles.completedScoreInput : {}]}
                  value={setInput.playerScore}
                  onChangeText={(value) => updateSetScore(index, 'playerScore', value)}
                  onBlur={() => validateAndUpdateSet(index)}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  testID={`set-${index + 1}-player-score`}
                />
                <Text style={styles.vsText}>-</Text>
                <TextInput
                  style={[styles.scoreInput, isCompleted ? styles.completedScoreInput : {}]}
                  value={setInput.opponentScore}
                  onChangeText={(value) => updateSetScore(index, 'opponentScore', value)}
                  onBlur={() => validateAndUpdateSet(index)}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  testID={`set-${index + 1}-opponent-score`}
                />
                <Text style={styles.playerLabel}>{player2Name}</Text>
              </View>

              {showTiebreakButton && (
                <TouchableOpacity 
                  style={styles.tiebreakButton}
                  onPress={() => {
                    setCurrentTiebreakSet(index);
                    setTiebreakPlayerScore(setInput.tiebreakPlayerScore || '');
                    setTiebreakOpponentScore(setInput.tiebreakOpponentScore || '');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tiebreakButtonText}>Add Tiebreak Score</Text>
                </TouchableOpacity>
              )}

              {setInput.tiebreakPlayerScore && setInput.tiebreakOpponentScore && (
                <Text style={{ textAlign: 'center', marginTop: 8, color: colors.tabIconDefault }}>
                  Tiebreak: {setInput.tiebreakPlayerScore}-{setInput.tiebreakOpponentScore}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Tiebreak Modal */}
      <Modal
        visible={currentTiebreakSet !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCurrentTiebreakSet(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Set {(currentTiebreakSet || 0) + 1} Tiebreak
            </Text>
            
            <View style={styles.scoreRow}>
              <Text style={styles.playerLabel}>{player1Name}</Text>
              <TextInput
                style={styles.scoreInput}
                value={tiebreakPlayerScore}
                onChangeText={setTiebreakPlayerScore}
                keyboardType="numeric"
                maxLength={2}
                placeholder="7"
              />
              <Text style={styles.vsText}>-</Text>
              <TextInput
                style={styles.scoreInput}
                value={tiebreakOpponentScore}
                onChangeText={setTiebreakOpponentScore}
                keyboardType="numeric"
                maxLength={2}
                placeholder="0"
              />
              <Text style={styles.playerLabel}>{player2Name}</Text>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCurrentTiebreakSet(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleTiebreakSave}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}