import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Profile</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.userSection}>
            <ThemedText type="subtitle" style={styles.userName}>Eladio Caritos</ThemedText>
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
          <ThemedText type="subtitle" style={styles.sectionTitle}>Club Memberships</ThemedText>
          <ThemedView style={[styles.placeholder, { borderColor: colors.icon }]}>
            <ThemedText style={styles.placeholderText}>No club memberships</ThemedText>
            <ThemedText style={styles.placeholderSubtext}>Join a club to start playing!</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Settings</ThemedText>
          <ThemedView style={[styles.placeholder, { borderColor: colors.icon }]}>
            <ThemedText style={styles.placeholderText}>Settings coming soon</ThemedText>
          </ThemedView>
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
});
