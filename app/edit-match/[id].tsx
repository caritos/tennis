import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Animated, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MatchRecordingForm } from '../../components/MatchRecordingForm';
import { updateMatch, getMatchHistory, UpdateMatchData } from '../../services/matchService';
import { logError, getDatabaseErrorMessage } from '../../utils/errorHandling';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Match } from '@/lib/supabase';

export default function EditMatchScreen() {
  const router = useRouter();
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [existingMatch, setExistingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const loadMatch = async () => {
      if (!user?.id || !matchId) return;

      try {
        // Get match from history (this filters for matches the user participated in)
        const matches = await getMatchHistory(user.id);
        const match = matches.find(m => m.id === matchId);
        
        if (!match) {
          showNotification('error', 'Match not found or you do not have permission to edit it');
          return;
        }

        setExistingMatch(match);
      } catch (error) {
        logError('EditMatch.loadMatch', error);
        showNotification('error', 'Failed to load match details');
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [user?.id, matchId]);

  const handleSave = async (matchData: any) => {
    if (!user?.id || !matchId || !existingMatch) {
      showNotification('error', 'Unable to save changes');
      return;
    }

    try {
      const updateData: UpdateMatchData = {
        scores: matchData.scores,
        notes: matchData.notes,
        date: matchData.date,
      };

      await updateMatch(matchId, updateData, user.id);
      
      // Show success notification
      showNotification('success', `Match updated! Score: ${matchData.scores}`);
    } catch (error) {
      logError('EditMatch.handleSave', error);
      
      let errorMessage = 'Failed to update match. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Only match participants')) {
          errorMessage = 'You can only edit matches you participated in.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'No internet connection. Match will be updated when you\'re back online.';
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading match...</Text>
      </View>
    );
  }

  if (!existingMatch) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Match not found</Text>
      </View>
    );
  }

  // Convert match to form data format
  const initialFormData = {
    club_id: existingMatch.club_id,
    player1_id: existingMatch.player1_id,
    player2_id: existingMatch.player2_id,
    opponent2_name: existingMatch.opponent2_name,
    player3_id: existingMatch.player3_id,
    partner3_name: existingMatch.partner3_name,
    player4_id: existingMatch.player4_id,
    partner4_name: existingMatch.partner4_name,
    scores: existingMatch.scores,
    match_type: existingMatch.match_type,
    date: existingMatch.date,
    notes: existingMatch.notes,
  };

  return (
    <View style={styles.container}>
      <MatchRecordingForm
        onSave={handleSave}
        onCancel={handleCancel}
        clubId={existingMatch.club_id}
        initialData={initialFormData}
        isEditing={true}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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