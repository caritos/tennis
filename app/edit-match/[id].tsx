import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Animated, TouchableOpacity } from 'react-native';
import { useRouter, useSegments, useLocalSearchParams } from 'expo-router';
import { MatchRecordingForm } from '../../components/MatchRecordingForm';
import { updateMatch, getMatchHistory, UpdateMatchData } from '../../services/matchService';
import { logError, getDatabaseErrorMessage } from '../../utils/errorHandling';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Match } from '@/lib/supabase';

export default function EditMatchScreen() {
  console.log('🔧 EditMatchScreen LATEST VERSION WITH PARAMS - v2024...');
  
  // === HOOKS SECTION - ALL HOOKS MUST BE AT TOP ===
  const router = useRouter();
  const segments = useSegments();
  const searchParams = useLocalSearchParams();
  
  console.log('🔧 useLocalSearchParams result:', JSON.stringify(searchParams));
  console.log('🔧 searchParams type:', typeof searchParams);
  console.log('🔧 searchParams keys:', Object.keys(searchParams || {}));
  
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [existingMatch, setExistingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log('🔧 useSegments result:', segments);
  console.log('🔧 segments array:', JSON.stringify(segments));
  console.log('🔧 user from useAuth:', user?.id);
  
  // Try multiple approaches to get matchId
  let matchId = '';
  
  console.log('🔧 Starting matchId extraction...');
  
  // Method 1: From search params - handle both string and array cases
  if (searchParams) {
    const idParam = searchParams.id;
    console.log('🔧 Raw id param:', idParam, 'type:', typeof idParam);
    
    if (Array.isArray(idParam)) {
      matchId = idParam[0];
      console.log('🔧 MatchId from searchParams array:', matchId);
    } else if (typeof idParam === 'string' && idParam !== '[id]' && idParam.trim() !== '') {
      matchId = idParam;
      console.log('🔧 MatchId from searchParams string:', matchId);
    }
  }
  
  // Method 2: From segments (fallback)
  if (!matchId && Array.isArray(segments) && segments.length > 0) {
    console.log('🔧 Processing segments as fallback...');
    console.log('🔧 All segments:', segments);
    
    // Look for edit-match followed by an ID
    for (let i = 0; i < segments.length - 1; i++) {
      if (segments[i] === 'edit-match') {
        const potentialId = segments[i + 1];
        if (potentialId && potentialId !== '[id]' && potentialId.trim() !== '') {
          matchId = potentialId;
          console.log('🔧 Found matchId from segments at index', i + 1, ':', matchId);
          break;
        }
      }
    }
  }
  
  // Method 3: Extract from current URL as last resort
  if (!matchId && typeof window !== 'undefined' && window.location) {
    const urlMatch = window.location.pathname.match(/\/edit-match\/([^\/]+)/);
    if (urlMatch && urlMatch[1] && urlMatch[1] !== '[id]') {
      matchId = urlMatch[1];
      console.log('🔧 Found matchId from URL:', matchId);
    }
  }
  
  console.log('🔧 Final extracted matchId:', matchId);
  
  // Early return AFTER all hooks
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

  // Early return AFTER all hooks to avoid violating Rules of Hooks
  if (!matchId) {
    console.error('🔧 EditMatchScreen: No matchId provided');
    console.error('🔧 Available searchParams:', searchParams);
    console.error('🔧 Available segments:', segments);
    
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Edit Match
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Error: No match ID provided
          </Text>
          <Text style={[styles.errorSubtext, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Unable to load match for editing
          </Text>
        </View>
      </View>
    );
  }

  const handleSave = async (matchData: any) => {
    console.log('🔧 Edit handleSave called with matchData:', matchData);
    console.log('🔧 matchData.scores:', matchData.scores);
    
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
      
      console.log('🔧 updateData to send:', updateData);

      await updateMatch(matchId, updateData);
      
      console.log('🚗💡🚗💡 MATCH SAVED SUCCESSFULLY - ABOUT TO NAVIGATE');
      
      // Show success notification and navigate back
      showNotification('success', `Match updated! Score: ${matchData.scores}`);
      
      console.log('🚗💡🚗💡 SUCCESS NOTIFICATION SHOWN - NO AUTO NAVIGATION');
      
      // Let user manually navigate back using the back button
      // This avoids the automatic redirect to clubs page
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
  console.log('🔧 existingMatch data:', existingMatch);
  
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
    match_type: existingMatch.match_type as 'singles' | 'doubles',
    date: existingMatch.date,
    notes: existingMatch.notes,
  };
  
  console.log('🔧 initialFormData:', initialFormData);

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? 'light'].text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          Edit Match
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // iOS HIG: Standard content margins
    paddingVertical: 12,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    // iOS HIG: Minimum 44pt touch target
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17, // iOS HIG: Standard navigation title
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44, // Match the back button minimum width for centering
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notification: {
    position: 'absolute',
    top: 50,
    left: 16, // iOS HIG: Standard content margins
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12, // iOS HIG: Standard corner radius
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
    fontSize: 15, // iOS HIG: Body text
    fontWeight: '500',
    flex: 1,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 20, // iOS HIG: Title 3
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 15, // iOS HIG: Body text
    textAlign: 'center',
  },
});