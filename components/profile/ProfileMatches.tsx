import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MatchHistoryView } from '@/components/MatchHistoryView';

interface User {
  id?: string;
}

interface ProfileMatchesProps {
  user: User | null;
  colors: any;
}

const ProfileMatches = React.memo(function ProfileMatches({ user, colors }: ProfileMatchesProps) {
  return (
    <ThemedView style={styles.section}>
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
  );
});

export default ProfileMatches;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  matchHistoryContainer: {
    // Remove maxHeight constraint to prevent overflow
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
});