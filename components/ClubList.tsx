import React from 'react';
import { ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { ClubCard } from './ClubCard';
import { Club } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ClubListProps {
  clubs: Club[];
  onClubPress: (club: Club) => void;
  onRefresh: () => void;
  loading?: boolean;
  refreshing?: boolean;
  error?: string;
  joinedClubIds?: string[];
  distances?: Map<string, number>;
  sortByDistance?: boolean;
}

export function ClubList({
  clubs,
  onClubPress,
  onRefresh,
  loading = false,
  refreshing = false,
  error,
  joinedClubIds = [],
  distances,
  sortByDistance = false,
}: ClubListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Sort clubs by distance if requested and distances are available
  const sortedClubs = React.useMemo(() => {
    if (!sortByDistance || !distances || distances.size === 0) {
      return clubs;
    }

    return [...clubs].sort((a, b) => {
      const distanceA = distances.get(a.id) ?? Infinity;
      const distanceB = distances.get(b.id) ?? Infinity;
      return distanceA - distanceB;
    });
  }, [clubs, distances, sortByDistance]);

  const renderEmptyState = () => {
    if (loading) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText type="title" style={styles.emptyTitle}>
            Finding tennis clubs...
          </ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
            {error}
          </ThemedText>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <ThemedText type="link" style={styles.retryText}>
              Tap to retry
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText type="title" style={styles.emptyTitle}>
          No clubs found
        </ThemedText>
        <ThemedText type="default" style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
          Be the first to create a tennis club in your area!
        </ThemedText>
      </ThemedView>
    );
  };

  const renderClubs = () => {
    return sortedClubs.map((club) => (
      <ClubCard
        key={club.id}
        club={club}
        onPress={onClubPress}
        distance={distances?.get(club.id)}
        isJoined={joinedClubIds.includes(club.id)}
      />
    ));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      testID="club-list-scroll"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
          colors={[colors.tint]}
        />
      }
    >
      {sortedClubs.length === 0 ? renderEmptyState() : renderClubs()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    color: '#FF6B6B',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '500',
  },
});