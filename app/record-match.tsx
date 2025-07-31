import React, { useState } from 'react';
import { View, StyleSheet, Text, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MatchRecordingForm } from '../components/MatchRecordingForm';
import { recordMatch , CreateMatchData } from '../services/matchService';
import { logError, getDatabaseErrorMessage } from '../utils/errorHandling';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Record Match</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <MatchRecordingForm
        onSave={handleSave}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60, // Same width as back button for centering
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