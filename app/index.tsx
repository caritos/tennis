import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, go directly to main app (no onboarding needed)
        console.log('Redirecting to main app - user authenticated');
        router.replace('/(tabs)');
      } else {
        console.log('No user, redirecting to welcome');
        router.replace('/welcome');
      }
    }
  }, [user, isLoading]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}