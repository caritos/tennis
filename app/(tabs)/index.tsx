import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ClubCard } from '@/components/ClubCard';
import { CreateClubButton } from '@/components/CreateClubButton';
import { NotificationBadge } from '@/components/NotificationBadge';
import { OnboardingReEngagement } from '@/components/OnboardingReEngagement';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';
import { Club } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/contexts/AuthContext';
import clubService, { joinClub, getJoinedClubIds } from '@/services/clubService';
import { seedSampleClubs } from '@/utils/seedData';

export default function ClubScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { location, requestLocationPermission } = useLocation();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distances, setDistances] = useState<Map<string, number>>(new Map());
  const [joinedClubIds, setJoinedClubIds] = useState<string[]>([]);
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null);

  const { user } = useAuth();
  const { badgeCount } = useNotificationBadge();
  
  useEffect(() => {
    console.log('ClubScreen: User state changed:', user ? `User: ${user.id}` : 'No user');
  }, [user]);

  const loadClubs = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      // Seed sample data if needed
      console.log('Starting to seed sample clubs...');
      await seedSampleClubs();
      console.log('Finished seeding sample clubs');

      // Get nearby clubs with improved location handling
      let userLat, userLng;
      let radius = 25; // Default 25km radius
      
      if (location?.latitude && location?.longitude) {
        userLat = location.latitude;
        userLng = location.longitude;
        console.log('Using actual user location:', userLat, userLng);
      } else {
        // Fallback to default location (NYC) with wider radius when no location available
        userLat = 40.7128;
        userLng = -74.0060;
        radius = 10000; // Much wider radius when location is unknown
        console.log('Using fallback location (NYC) with wide radius:', userLat, userLng, 'radius:', radius);
      }
      
      const nearbyClubs = await clubService.getNearbyClubs(userLat, userLng, radius);
      console.log('Nearby clubs received:', nearbyClubs.length);
      setClubs(nearbyClubs);

      // Calculate distances if location is available
      if (location) {
        const newDistances = new Map<string, number>();
        nearbyClubs.forEach(club => {
          const distance = clubService.calculateDistance(
            userLat,
            userLng,
            club.lat,
            club.lng
          );
          newDistances.set(club.id, distance);
        });
        setDistances(newDistances);
      }

      // Load user's clubs and joined club IDs
      if (user?.id) {
        try {
          const userJoinedIds = await getJoinedClubIds(user.id);
          setJoinedClubIds(userJoinedIds);

          const userClubs = await clubService.getUserClubs(user.id);
          setMyClubs(userClubs);
        } catch (error) {
          console.warn('Failed to load user clubs:', error);
          setMyClubs([]);
          setJoinedClubIds([]);
        }
      } else {
        setMyClubs([]);
        setJoinedClubIds([]);
      }

    } catch (err) {
      console.error('Failed to load clubs:', err);
      setError('Failed to load clubs. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadClubs(true);
  };

  const handleClubPress = (club: Club) => {
    console.log('🔘 BUTTON: Club card pressed -', club.name);
    router.push(`/club/${club.id}`);
  };

  const handleJoinClub = async (club: Club) => {
    console.log('🔘 BUTTON: Join club pressed -', club.name);
    if (joiningClubId === club.id || !user?.id) {
      console.log('Cannot join club: joiningClubId =', joiningClubId, 'user.id =', user?.id);
      return; // Prevent double-tap or no user
    }

    console.log(`Starting to join club: ${club.name} (${club.id}) with user ${user.id}`);
    setJoiningClubId(club.id);
    setError(null);

    try {
      await joinClub(club.id, user.id);
      
      // Update local state immediately for optimistic UI
      setJoinedClubIds(prev => [...prev, club.id]);
      
      // Update the club's member count in both lists
      const updatedClub = { ...club, memberCount: (club.memberCount || 0) + 1 };
      
      // Update in myClubs
      setMyClubs(prev => [...prev, updatedClub]);
      
      // Update in all clubs list
      setClubs(prev => prev.map(c => c.id === club.id ? updatedClub : c));
      
      console.log(`Successfully joined ${club.name}`);
      
      // Don't refresh immediately - let the UI settle
      // The next manual refresh or navigation will get the latest data
      
    } catch (error: any) {
      console.error('Failed to join club:', error);
      console.error('Error details:', error.message, error.code);
      
      if (error.message === 'Already a member of this club') {
        // Update UI state to reflect actual membership
        setJoinedClubIds(prev => [...prev, club.id]);
        setMyClubs(prev => [...prev, club]);
      } else {
        setError(`Failed to join ${club.name}. ${error.message}`);
      }
    } finally {
      setJoiningClubId(null);
    }
  };

  const handleCreateClub = () => {
    console.log('🔘 BUTTON: Create Club pressed');
    router.push('/create-club');
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    // Load clubs even without location (will use default NYC coordinates)
    loadClubs();
  }, [user?.id]); // Reload when user changes

  useEffect(() => {
    if (location) {
      loadClubs();
    }
  }, [location]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Clubs</ThemedText>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <NotificationBadge 
              count={badgeCount} 
              size="small" 
              style={styles.notificationBadgePosition}
            />
          </TouchableOpacity>
          <Link href="/record-match" asChild>
            <TouchableOpacity style={[styles.recordMatchButton, { backgroundColor: colors.tint }]}>
              <Ionicons name="add" size={20} color="white" />
              <ThemedText style={styles.recordMatchText}>Record Match</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </ThemedView>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}>
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              My Clubs {myClubs.length > 0 ? `(${myClubs.length})` : ''}
            </ThemedText>
          </View>
          {myClubs.length > 0 ? (
            <View style={styles.clubListContainer}>
              {myClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onPress={handleClubPress}
                  onJoin={handleJoinClub}
                  distance={distances?.get(club.id)}
                  isJoined={joinedClubIds.includes(club.id)}
                />
              ))}
            </View>
          ) : (
            <ThemedView style={[styles.placeholder, { borderColor: colors.tabIconDefault }]}>
              <ThemedText style={styles.placeholderText}>No clubs joined yet</ThemedText>
              <ThemedText style={[styles.placeholderSubtext, { color: colors.tabIconDefault }]}>
                Join a club to start playing!
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.discoverSection}>
          <View style={styles.discoverHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Discover Clubs Near You
            </ThemedText>
            {!location && (
              <TouchableOpacity 
                onPress={() => {
                  console.log('🔘 BUTTON: Enable location pressed');
                  requestLocationPermission();
                }}
                style={[styles.locationPrompt, { borderColor: colors.tint }]}
              >
                <Ionicons name="location-outline" size={16} color={colors.tint} />
                <ThemedText style={[styles.locationPromptText, { color: colors.tint }]}>
                  Enable Location
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.clubListContainer}>
            {loading ? (
              <ThemedView style={styles.loadingContainer}>
                <ThemedText type="title" style={styles.loadingText}>
                  Finding tennis clubs...
                </ThemedText>
              </ThemedView>
            ) : error ? (
              <ThemedView style={styles.errorContainer}>
                <ThemedText type="defaultSemiBold" style={styles.errorText}>
                  {error}
                </ThemedText>
                <TouchableOpacity 
                  onPress={() => {
                    console.log('🔘 BUTTON: Retry loading clubs pressed');
                    handleRefresh();
                  }} 
                  style={styles.retryButton}
                >
                  <ThemedText type="link" style={styles.retryText}>
                    Tap to retry
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ) : clubs.filter(club => !joinedClubIds.includes(club.id)).length === 0 ? (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText type="title" style={styles.emptyTitle}>
                  {clubs.length === 0 ? 'No clubs found' : 'All nearby clubs joined!'}
                </ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
                  {clubs.length === 0 
                    ? 'Be the first to create a tennis club in your area!' 
                    : 'Create a new club or check back later for more clubs.'}
                </ThemedText>
              </ThemedView>
            ) : (
              clubs
                .filter(club => !joinedClubIds.includes(club.id)) // Only show clubs user hasn't joined
                .sort((a, b) => {
                  if (!distances || distances.size === 0) return 0;
                  const distanceA = distances.get(a.id) ?? Infinity;
                  const distanceB = distances.get(b.id) ?? Infinity;
                  return distanceA - distanceB;
                })
                .map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onPress={handleClubPress}
                    onJoin={handleJoinClub}
                    distance={distances?.get(club.id)}
                    isJoined={false} // These are always unjoined clubs now
                  />
                ))
            )}
          </View>
        </ThemedView>

        {/* Create Club Button at Bottom */}
        <ThemedView style={styles.createClubSection}>
          <CreateClubButton 
            onPress={handleCreateClub}
            size="large"
            variant="secondary"
          />
        </ThemedView>
      </ScrollView>
      
      {/* Onboarding Re-engagement */}
      <OnboardingReEngagement />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadgePosition: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  discoverSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  discoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    gap: 4,
  },
  locationPromptText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    flex: 1,
  },
  clubListContainer: {
    gap: 8,
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FF6B6B',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  createClubSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recordMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  recordMatchText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
