import { Link, Stack } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.content}>
          <ThemedView style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.tint} />
          </ThemedView>
          
          <ThemedText type="title" style={styles.title}>Page Not Found</ThemedText>
          <ThemedText style={styles.message}>
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </ThemedText>
          
          <Link href="/(tabs)" asChild>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.tint }]}>
              <Ionicons name="home" size={20} color="white" />
              <ThemedText style={styles.buttonText}>Go to Home</ThemedText>
            </TouchableOpacity>
          </Link>
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minHeight: 50,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});
