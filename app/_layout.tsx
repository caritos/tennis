import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { LogBox , View, ActivityIndicator } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { useNotificationListener } from '@/hooks/useNotificationListener';

// Hide the "Open debugger" warning in development
if (__DEV__) {
  LogBox.ignoreLogs(['Open debugger to view warnings']);
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const { isOnboardingComplete, isFirstTimeUser } = useOnboarding();
  
  // Initialize notification listeners
  useNotificationListener();

  console.log('RootLayoutNav: Auth state -', { 
    user: user?.id || 'none', 
    isLoading, 
    isOnboardingComplete,
    isFirstTimeUser 
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="signup" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="signin" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="email-signup" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="email-signin" options={{ headerShown: false, presentation: 'modal' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="signin" options={{ headerShown: false }} />
            <Stack.Screen name="email-signup" options={{ headerShown: false }} />
            <Stack.Screen name="email-signin" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false, presentation: 'modal' }} />
          </>
        )}
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <OnboardingProvider>
        <NotificationProvider>
          <RootLayoutNav />
        </NotificationProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}
