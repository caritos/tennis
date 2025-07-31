import { ScrollView, StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import clubService from '@/services/clubService';
import { Club } from '@/lib/supabase';
import { MatchHistoryView } from '@/components/MatchHistoryView';
import { PlayerStatsDisplay } from '@/components/PlayerStatsDisplay';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { initializeDatabase } from '@/database/database';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { user, signOut } = useAuth();
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);

  // Load player statistics
  const { stats, loading: statsLoading, error: statsError, refreshStats } = usePlayerStats(user?.id || null);

  const loadUserClubs = async () => {
    if (!user?.id) {
      setUserClubs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const clubs = await clubService.getUserClubs(user.id);
      setUserClubs(clubs);

      // Load profile photo from database
      const db = await initializeDatabase();
      const userData = await db.getFirstAsync(
        'SELECT profile_photo_uri FROM users WHERE id = ?',
        [user.id]
      ) as any;
      
      if (userData?.profile_photo_uri) {
        setProfilePhotoUri(userData.profile_photo_uri);
      }
    } catch (error) {
      console.error('Failed to load user clubs:', error);
      setUserClubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserClubs();
  }, [user?.id]); // Reload when user changes

  // Reload clubs whenever the profile tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserClubs();
    }, [user?.id])
  );

  const handleSignOut = async () => {
    console.log('🔘 BUTTON: Sign Out pressed');
    console.log('Signing out user...');
    await signOut();
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <ThemedView style={styles.section}>
          <View style={styles.userSection}>
            {/* Profile Photo */}
            <View style={styles.profilePhotoContainer}>
              {profilePhotoUri ? (
                <Image 
                  source={{ uri: profilePhotoUri }} 
                  style={styles.profilePhoto}
                  onError={() => {
                    console.warn('Failed to load profile photo');
                    setProfilePhotoUri(null);
                  }}
                />
              ) : (
                <View style={[styles.profilePhotoPlaceholder, { backgroundColor: colors.tabIconDefault + '20' }]}>
                  <Ionicons 
                    name="person-outline" 
                    size={40} 
                    color={colors.tabIconDefault} 
                  />
                </View>
              )}
            </View>

            <View style={styles.userInfoContainer}>
              <ThemedText type="subtitle" style={styles.userName}>
                {user?.user_metadata?.full_name || user?.email || 'Tennis Player'}
              </ThemedText>
              <TouchableOpacity
                style={[styles.editButton, { borderColor: colors.tint }]}
                onPress={() => router.push('/edit-profile')}
              >
                <Ionicons name="pencil" size={16} color={colors.tint} />
                <ThemedText style={[styles.editButtonText, { color: colors.tint }]}>
                  Edit
                </ThemedText>
              </TouchableOpacity>
            </View>
            {user?.email && (
              <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
            )}
            {user?.phone && (
              <ThemedText style={styles.userPhone}>{user.phone}</ThemedText>
            )}
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Tennis Stats</ThemedText>
          <PlayerStatsDisplay 
            stats={stats || {
              totalMatches: 0,
              wins: 0,
              losses: 0,
              winPercentage: 0,
              singlesRecord: { wins: 0, losses: 0, winPercentage: 0 },
              doublesRecord: { wins: 0, losses: 0, winPercentage: 0 },
              setsWon: 0,
              setsLost: 0,
              gamesWon: 0,
              gamesLost: 0,
            }}
            loading={statsLoading}
            error={statsError}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Match History</ThemedText>
          {user?.id ? (
            <View style={styles.matchHistoryContainer}>
              <MatchHistoryView playerId={user.id} />
            </View>
          ) : (
            <ThemedView style={[styles.placeholder, { borderColor: colors.icon }]}>
              <ThemedText style={styles.placeholderText}>Sign in to view match history</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Club Memberships {userClubs.length > 0 ? `(${userClubs.length})` : ''}
          </ThemedText>
          {loading ? (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Loading clubs...</ThemedText>
            </ThemedView>
          ) : userClubs.length > 0 ? (
            <View style={styles.clubsList}>
              {userClubs.map((club) => (
                <View key={club.id} style={[styles.clubCard, { borderColor: colors.icon + '30' }]}>
                  <ThemedText style={styles.clubName}>{club.name}</ThemedText>
                  <ThemedText style={styles.clubLocation}>{club.location}</ThemedText>
                  {club.memberCount && (
                    <ThemedText style={styles.clubMembers}>
                      {club.memberCount} members
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <ThemedView style={[styles.placeholder, { borderColor: colors.icon }]}>
              <ThemedText style={styles.placeholderText}>No club memberships</ThemedText>
              <ThemedText style={styles.placeholderSubtext}>Join a club to start playing!</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Settings</ThemedText>
          <View style={styles.settingsContainer}>
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: colors.tint }]}
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
              accessibilityHint="Sign out of your account"
            >
              <ThemedText style={styles.signOutButtonText}>
                Sign Out
              </ThemedText>
            </TouchableOpacity>
          </View>
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  profilePhotoContainer: {
    marginBottom: 16,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  sectionTitle: {
    marginBottom: 12,
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
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  clubsList: {
    gap: 12,
  },
  clubCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'transparent',
  },
  clubName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  clubLocation: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  clubMembers: {
    fontSize: 12,
    opacity: 0.6,
  },
  matchHistoryContainer: {
    maxHeight: 400,
  },
  settingsContainer: {
    paddingVertical: 8,
  },
  signOutButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
