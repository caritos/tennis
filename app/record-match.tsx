import React, { useState } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MatchRecordingForm } from '../components/MatchRecordingForm';
import { recordMatch } from '../services/matchService';
import { CreateMatchData } from '../services/matchService';
import { logError, getDatabaseErrorMessage } from '../utils/errorHandling';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function RecordMatchScreen() {
  const router = useRouter();
  const { clubId = 'demo-club-123' } = useLocalSearchParams<{ clubId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNotification(null);
      if (type === 'success') {
        router.back();
      }
    });
  };

  const handleSave = async (matchData: CreateMatchData) => {
    try {
      const savedMatch = await recordMatch(matchData);
      
      // Show success notification
      showNotification('success', `Match recorded! Score: ${savedMatch.scores}`);
    } catch (error) {
      logError('RecordMatch.handleSave', error);
      
      let errorMessage = 'Failed to save match. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'No internet connection. Match will be saved when you\'re back online.';
        } else {
          errorMessage = getDatabaseErrorMessage(error);
        }
      }
      
      showNotification('error', errorMessage);
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
      
      {/* Notification Banner */}
      {notification && (
        <Animated.View
          style={[
            styles.notification,
            notification.type === 'success' ? styles.successNotification : styles.errorNotification,
            { opacity: fadeAnim, backgroundColor: notification.type === 'success' ? '#4CAF50' : '#F44336' }
          ]}
        >
          <Ionicons
            name={notification.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color="white"
            style={styles.notificationIcon}
          />
          <Text style={styles.notificationText}>{notification.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  notification: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successNotification: {
    backgroundColor: '#4CAF50',
  },
  errorNotification: {
    backgroundColor: '#F44336',
  },
  notificationIcon: {
    marginRight: 8,
  },
  notificationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});