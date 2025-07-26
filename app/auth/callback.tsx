import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if there's a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/signin');
          return;
        }

        if (session?.user) {
          // User is authenticated, go to main app
          router.replace('/(tabs)');
        } else {
          // No session, go to sign in
          router.replace('/signin');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/signin');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <ThemedText style={{ marginTop: 16 }}>
        Signing you in...
      </ThemedText>
    </View>
  );
}