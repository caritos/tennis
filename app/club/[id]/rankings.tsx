import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ClubRankings, RankedPlayer } from '@/components/ClubRankings';
import { getClubLeaderboard } from '@/services/matchService';
import { initializeDatabase } from '@/database/database';

export default function ClubRankingsScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [clubName, setClubName] = useState('');
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRankings();
  }, [id]);

  const loadRankings = async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid club ID');
      setIsLoading(false);
      return;
    }

    try {
      const db = await initializeDatabase();
      
      // Get club name
      const clubData = await db.getFirstAsync(
        'SELECT name FROM clubs WHERE id = ?',
        [id]
      );
      
      if (!clubData) {
        setError('Club not found');
        setIsLoading(false);
        return;
      }
      
      setClubName((clubData as any).name);
      
      // Get member count
      const countResult = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM club_members WHERE club_id = ?',
        [id]
      );
      
      setMemberCount((countResult as any)?.count || 0);
      
      // Get full rankings
      const leaderboard = await getClubLeaderboard(id);
      setRankings(leaderboard);
      
    } catch (err) {
      console.error('Failed to load rankings:', err);
      setError('Failed to load rankings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handlePlayerPress = (playerId: string) => {
    // TODO: Navigate to player profile
    console.log('View player profile:', playerId);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading rankings...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={handleBack} style={[styles.button, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {clubName} Rankings
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Rankings Information */}
      <ThemedView style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={20} color={colors.tabIconDefault} />
          <ThemedText style={[styles.infoText, { color: colors.tabIconDefault }]}>
            Rankings are calculated based on match wins, consistency, and activity
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="trophy-outline" size={20} color={colors.tabIconDefault} />
          <ThemedText style={[styles.infoText, { color: colors.tabIconDefault }]}>
            Play at least 5 matches to establish a non-provisional ranking
          </ThemedText>
        </View>
      </ThemedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          <ClubRankings
            rankings={rankings}
            memberCount={memberCount}
            onPlayerPress={handlePlayerPress}
            showAll={true}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});