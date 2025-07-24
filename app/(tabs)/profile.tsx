import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import clubService from '@/services/clubService';
import { Club } from '@/lib/supabase';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut } = useAuth();
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO: Replace with actual user authentication
  const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440010';

  const loadUserClubs = async () => {
    try {
      setLoading(true);
      const clubs = await clubService.getUserClubs(MOCK_USER_ID);
      setUserClubs(clubs);
    } catch (error) {
      console.error('Failed to load user clubs:', error);
      setUserClubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserClubs();
  }, []);

  // Reload clubs whenever the profile tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserClubs();
    }, [])
  );

  const handleSignOut = async () => {
    console.log('Signing out user...');
    await signOut();
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Profile</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.userSection}>
            <ThemedText type="subtitle" style={styles.userName}>
              {user?.user_metadata?.full_name || user?.email || 'Tennis Player'}
            </ThemedText>
            {user?.email && (
              <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
            )}
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Tennis Stats</ThemedText>
          <ThemedView style={[styles.placeholder, { borderColor: colors.icon }]}>
            <ThemedText style={styles.placeholderText}>No matches played yet</ThemedText>
            <ThemedText style={styles.placeholderSubtext}>Record your first match!</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Match History</ThemedText>
          <ThemedView style={[styles.placeholder, { borderColor: colors.icon }]}>
            <ThemedText style={styles.placeholderText}>No matches played yet</ThemedText>
            <ThemedText style={styles.placeholderSubtext}>Record your first match!</ThemedText>
          </ThemedView>
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
  userName: {
    fontSize: 24,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
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
