import React, { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getAuthErrorMessage } from '@/utils/errorHandling';
import { WelcomeScreen } from '@/components/WelcomeScreen';

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTermsPress = () => {
    console.log('Terms of Service pressed');
    router.push('/terms-of-service');
  };

  const handlePrivacyPress = () => {
    console.log('Privacy Policy pressed');
    router.push('/privacy-policy');
  };

  const handleContinue = async (email: string, password: string) => {
    console.log('Continue pressed with email:', email);
    setIsLoading(true);
    setError(null);

    try {
      // First, check if the email exists in the users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error checking user existence:', checkError);
        throw new Error('Failed to check user account');
      }

      if (existingUser) {
        // User exists, try to login
        console.log('User exists, attempting login');
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Invalid password. Please try again.');
          } else {
            setError(getAuthErrorMessage(signInError));
          }
          return;
        }

        if (data.user) {
          console.log('Sign in successful, navigating to tabs');
          router.replace('/(tabs)');
        }
      } else {
        // User doesn't exist, try to sign up
        console.log('User does not exist, attempting signup');
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: '',
              phone: ''
            }
          }
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          setError(getAuthErrorMessage(signUpError));
          return;
        }

        if (!authData.user) {
          setError('Failed to create user account');
          return;
        }

        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            full_name: '',
            email: email.trim(),
            phone: '',
            role: 'player'
          }, {
            onConflict: 'id'
          });

        if (profileError && profileError.code !== '23505') {
          console.error('Failed to create user profile:', profileError);
          // Continue anyway as auth was successful
        }

        console.log('User created successfully, navigating to tabs');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Continue operation failed:', error);
      setError(error.message || 'Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WelcomeScreen
      onContinue={handleContinue}
      onTermsPress={handleTermsPress}
      onPrivacyPress={handlePrivacyPress}
      error={error}
      isLoading={isLoading}
      onDismissError={() => setError(null)}
    />
  );
}