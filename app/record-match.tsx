import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MatchRecordingForm } from '../components/MatchRecordingForm';
import { recordMatch } from '../services/matchService';
import { CreateMatchData } from '../services/matchService';

export default function RecordMatchScreen() {
  const router = useRouter();
  const { clubId = 'demo-club-123' } = useLocalSearchParams<{ clubId?: string }>();

  const handleSave = async (matchData: CreateMatchData) => {
    try {
      const savedMatch = await recordMatch(matchData);
      
      // Show success message
      Alert.alert(
        '✅ Match Recorded!',
        `Your match has been saved successfully!\n\nScore: ${savedMatch.scores}\nMatch Type: ${savedMatch.match_type}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save match:', error);
      Alert.alert(
        '❌ Error',
        'Failed to save match. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <MatchRecordingForm
        onSave={handleSave}
        onCancel={handleCancel}
        clubId={clubId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});