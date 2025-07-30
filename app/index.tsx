import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();
  const { isOnboardingComplete, isFirstTimeUser } = useOnboarding();
  
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, check onboarding status
        if (isFirstTimeUser && !isOnboardingComplete) {
          console.log('Redirecting to onboarding for first-time user');
          router.replace('/onboarding');
        } else {
          console.log('Redirecting to main app - onboarding complete or returning user');
          router.replace('/(tabs)');
        }
      } else {
        console.log('No user, redirecting to welcome');
        router.replace('/welcome');
      }
    }
  }, [user, isLoading, isOnboardingComplete, isFirstTimeUser]);

  // Show loading spinner while checking auth and onboarding
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}