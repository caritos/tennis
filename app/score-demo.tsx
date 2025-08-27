import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TennisScoreDisplay } from '@/components/TennisScoreDisplay';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function ScoreDemoScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Tennis Score Display Examples
        </ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Completed Singles Match
          </ThemedText>
          <TennisScoreDisplay
            player1Name="S. HSIEH"
            player2Name="J. OSTAPENKO"
            scores="6-2,4-6,6-3"
            matchType="singles"
            winner={1}
            isCompleted={true}
            showDuration={true}
            duration="2:23"
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Doubles Match with Tiebreak
          </ThemedText>
          <TennisScoreDisplay
            player1Name="V. KUDERMETOVA"
            player2Name="E. MERTENS"
            scores="3-6,6-6,6-7(7-9)"
            matchType="doubles"
            winner={2}
            isCompleted={true}
            showDuration={true}
            duration="2:45"
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Three Set Match
          </ThemedText>
          <TennisScoreDisplay
            player1Name="John Smith"
            player2Name="Mike Wilson"
            scores="7-6(7-3),4-6,6-2"
            matchType="singles"
            winner={1}
            isCompleted={true}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Straight Sets Win
          </ThemedText>
          <TennisScoreDisplay
            player1Name="Sarah Williams"
            player2Name="Lisa Park"
            scores="6-4,6-2"
            matchType="singles"
            winner={1}
            isCompleted={true}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
});