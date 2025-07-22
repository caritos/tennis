import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ClubList } from '@/components/ClubList';
import { ClubCard } from '@/components/ClubCard';
import { CreateClubButton } from '@/components/CreateClubButton';
import { Club } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/hooks/useLocation';
import clubService, { joinClub, getJoinedClubIds } from '@/services/clubService';
import { seedSampleClubs } from '@/utils/seedData';

export default function ClubScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { location, requestLocationPermission } = useLocation();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distances, setDistances] = useState<Map<string, number>>(new Map());
  const [joinedClubIds, setJoinedClubIds] = useState<string[]>([]);
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null);

  // TODO: Replace with actual user authentication
  const MOCK_USER_ID = 'current-user-123';

  const loadClubs = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      // Seed sample data if needed
      console.log('Starting to seed sample clubs...');
      await seedSampleClubs();
      console.log('Finished seeding sample clubs');

      // Get nearby clubs
      const userLat = location?.latitude || 40.7128;
      const userLng = location?.longitude || -74.0060;
      
      console.log('Getting nearby clubs for location:', userLat, userLng);
      const nearbyClubs = await clubService.getNearbyClubs(
        userLat,
        userLng,
        50 // 50km radius
      );

      console.log('Nearby clubs received:', nearbyClubs.length);
      
      // If no clubs found, add a test club for debugging
      if (nearbyClubs.length === 0) {
        console.log('No clubs found, adding test club');
        const testClub: Club = {
          id: 'test-club-1',
          name: 'Test Tennis Club',
          description: 'This is a test club to verify the UI is working',
          location: 'Test Location, NY',
          lat: 40.7128,
          lng: -74.0060,
          memberCount: 5,
          creator_id: 'test-user',
          created_at: new Date().toISOString(),
        };
        setClubs([testClub]);
      } else {
        setClubs(nearbyClubs);
      }

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
      try {
        const userJoinedIds = await getJoinedClubIds(MOCK_USER_ID);
        setJoinedClubIds(userJoinedIds);

        const userClubs = await clubService.getUserClubs(MOCK_USER_ID);
        setMyClubs(userClubs);
      } catch (error) {
        console.warn('Failed to load user clubs:', error);
        setMyClubs([]);
        setJoinedClubIds([]);
      }

    } catch (err) {
      console.error('Failed to load clubs:', err);
      setError('Failed to load clubs. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadClubs(true);
  };

  const handleClubPress = (club: Club) => {
    console.log('Club selected:', club.name);
    // TODO: Navigate to club details screen
  };

  const handleJoinClub = async (club: Club) => {
    if (joiningClubId === club.id) {
      return; // Prevent double-tap
    }

    setJoiningClubId(club.id);
    setError(null);

    try {
      await joinClub(club.id, MOCK_USER_ID);
      
      // Update local state immediately for optimistic UI
      setJoinedClubIds(prev => [...prev, club.id]);
      setMyClubs(prev => [...prev, club]);
      
      console.log(`Successfully joined ${club.name}`);
      
      // Show success feedback (could be a toast notification in the future)
      // For now, just log it
    } catch (error: any) {
      console.error('Failed to join club:', error);
      
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
    console.log('Create club pressed');
    // TODO: Navigate to create club form
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    // Load clubs even without location (will use default NYC coordinates)
    loadClubs();
  }, []);

  useEffect(() => {
    if (location) {
      loadClubs();
    }
  }, [location]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Clubs</ThemedText>
      </ThemedView>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            My Clubs {myClubs.length > 0 ? `(${myClubs.length})` : ''}
          </ThemedText>
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
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Discover Clubs Near You
          </ThemedText>
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
                <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
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
  discoverSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
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
});
