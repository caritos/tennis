import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { EmailVerificationScreen } from '@/components/EmailVerificationScreen';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function EmailVerificationPage() {
  const { user, signOut } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        setMessage('Failed to resend verification email. Please try again.');
      } else {
        setMessage('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setMessage('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  const handleRefresh = async () => {
    // Refresh auth state to check if email was verified
    try {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.email_confirmed_at) {
        router.replace('/(tabs)');
      } else {
        setMessage('Email not verified yet. Please check your inbox.');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setMessage('Error checking verification status. Please try again.');
    }
  };

  if (!user?.email) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <EmailVerificationScreen
        email={user.email}
        onResend={handleResendVerification}
        onRefresh={handleRefresh}
        onSignOut={handleSignOut}
        isResending={isResending}
        message={message}
      />
    </SafeAreaView>
  );
}

