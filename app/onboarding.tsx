import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { EnhancedOnboardingFlow } from '@/components/EnhancedOnboardingFlow';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingScreen() {
  const { user } = useAuth();

  // Redirect to main app if user is not authenticated
  React.useEffect(() => {
    if (!user) {
      router.replace('/welcome');
      return;
    }
  }, [user]);

  const handleComplete = async () => {
    console.log('Enhanced onboarding completed, navigating to main app');
    router.replace('/(tabs)');
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back during onboarding
        }} 
      />
      
      <EnhancedOnboardingFlow onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});