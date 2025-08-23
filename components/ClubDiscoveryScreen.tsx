import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { ClubCard } from './ClubCard';
import { CreateClubButton } from './CreateClubButton';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNotification } from '@/contexts/NotificationContext';
import clubService, { joinClub, getNearbyClubs, calculateDistance } from '@/services/clubService';
import { Club } from '@/lib/supabase';

interface ClubDiscoveryScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const ClubDiscoveryScreen: React.FC<ClubDiscoveryScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { location, hasLocationPermission } = useLocation(true); // Auto-request enabled
  const { user } = useAuth();
  const { markStepCompleted, getProgress } = useOnboarding();
  const { showSuccess, showError } = useNotification();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [distances, setDistances] = useState<Map<string, number>>(new Map());
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null);

  const progress = getProgress();

  // Location is auto-requested by useLocation hook

  useEffect(() => {
    // Load clubs when location state changes or permission is determined
    if (hasLocationPermission !== null) {
      loadNearbyClubs();
    }
  }, [location, hasLocationPermission]);

  const loadNearbyClubs = async () => {
    setLoading(true);
    try {
      let userLat, userLng;
      let radius = 25;

      if (location?.latitude && location?.longitude) {
        userLat = location.latitude; 
        userLng = location.longitude;
        console.log('Using user location for club discovery:', userLat, userLng);
      } else {
        // Fallback to NYC with wide radius
        userLat = 40.7128;
        userLng = -74.0060;
        radius = 10000; // Wide radius when no location
        console.log('Using fallback location for club discovery');
      }

      const nearbyClubs = await getNearbyClubs(userLat, userLng, radius);
      setClubs(nearbyClubs);

      // Calculate distances
      if (location) {
        const newDistances = new Map<string, number>();
        nearbyClubs.forEach(club => {
          const distance = calculateDistance(
            userLat,
            userLng,
            club.lat,
            club.lng
          );
          newDistances.set(club.id, distance);
        });
        setDistances(newDistances);
      }

      console.log('Loaded clubs for discovery:', nearbyClubs.length);
    } catch (error) {
      console.error('Failed to load clubs for discovery:', error);
      showError('Failed to load clubs', 'Please try again or skip for now.');
    } finally {
      setLoading(false);
    }
  };

  // Location request is now handled automatically by useLocation hook

  const handleJoinClub = async (club: Club) => {
    if (!user || joiningClubId === club.id) return;

    setJoiningClubId(club.id);
    try {
      await joinClub(club.id, user.id);
      setJoinedClubs(prev => [...prev, club.id]);
      showSuccess('Club Joined!', `Welcome to ${club.name}!`);
      
      // Mark club joining step as completed
      await markStepCompleted('club_joining');
    } catch (error: any) {
      console.error('Failed to join club:', error);
      if (error.message === 'Already a member of this club') {
        setJoinedClubs(prev => [...prev, club.id]);
        await markStepCompleted('club_joining');
      } else {
        showError('Failed to join club', error.message);
      }
    } finally {
      setJoiningClubId(null);
    }
  };

  const handleCreateClub = () => {
    console.log('Create club pressed from onboarding');
    router.push('/create-club');
  };

  const handleSkip = async () => {
    await markStepCompleted('club_discovery');
    onSkip();
  };

  const handleContinue = async () => {
    await markStepCompleted('club_discovery');
    if (joinedClubs.length > 0) {
      await markStepCompleted('club_joining');
    }
    onComplete();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with progress */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress.percentage}%`,
                  backgroundColor: colors.tint 
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.text }]}>
            Step {progress.completed} of {progress.total}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title and description */}
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>🎾</Text>
          <ThemedText style={styles.title}>Finding Tennis Clubs Near You</ThemedText>
          <ThemedText style={styles.description}>
            We&apos;ll help you discover tennis clubs in your area so you can connect with players and start playing!
          </ThemedText>
        </View>

        {/* Location section */}
        {/* Location is handled automatically - no manual enable needed */}

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.loadingText}>Discovering clubs...</ThemedText>
          </View>
        )}

        {/* Clubs list */}
        {!loading && clubs.length > 0 && (
          <View style={styles.clubsSection}>
            <ThemedText style={styles.clubsTitle}>
              {location ? 'Great! Here are tennis clubs near you:' : 'Here are tennis clubs you can join:'}
            </ThemedText>
            
            <View style={styles.clubsList}>
              {clubs.slice(0, 5).map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onPress={() => {}} // No navigation in onboarding
                  onJoin={handleJoinClub}
                  distance={distances.get(club.id)}
                  isJoined={joinedClubs.includes(club.id)}
                  isJoining={joiningClubId === club.id}
                />
              ))}
            </View>

            {/* Create club option */}
            <View style={styles.createClubSection}>
              <CreateClubButton 
                onPress={handleCreateClub}
                size="large"
                variant="secondary"
              />
            </View>
          </View>
        )}

        {/* Empty state */}
        {!loading && clubs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🏟️</Text>
            <ThemedText style={styles.emptyStateTitle}>No Clubs Found</ThemedText>
            <ThemedText style={[styles.emptyStateText, { color: colors.tabIconDefault }]}>
              Be the first to create a tennis club in your area!
            </ThemedText>
            <CreateClubButton 
              onPress={handleCreateClub}
              size="large"
              variant="primary"
            />
          </View>
        )}

        {/* Success state */}
        {joinedClubs.length > 0 && (
          <View style={[styles.successSection, { backgroundColor: colors.tint + '10' }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
            <ThemedText style={styles.successText}>
              🎉 Great! You&apos;ve joined {joinedClubs.length} club{joinedClubs.length > 1 ? 's' : ''}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.skipButton, { borderColor: colors.tabIconDefault }]}
          onPress={handleSkip}
        >
          <Text style={[styles.skipButtonText, { color: colors.tabIconDefault }]}>
            Skip for Now
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.tint }]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {joinedClubs.length > 0 ? 'Continue' : 'Browse Later'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    maxWidth: 300,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationSubtitle: {
    fontSize: 14,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  locationButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  clubsSection: {
    marginBottom: 32,
  },
  clubsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  clubsList: {
    gap: 12,
  },
  createClubSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyStateEmoji: {
    fontSize: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  successSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  successText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});