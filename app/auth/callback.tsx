import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if there's a session after email verification
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/email-verification?error=verification_failed');
          return;
        }

        if (session?.user?.email_confirmed_at) {
          // Email verified successfully, go to main app
          router.replace('/(tabs)');
        } else {
          // Still not verified, go back to verification screen
          router.replace('/email-verification');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/email-verification?error=verification_failed');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <ThemedText style={{ marginTop: 16 }}>
        Verifying your email...
      </ThemedText>
    </View>
  );
}