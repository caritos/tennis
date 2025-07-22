import React, { useState } from 'react';
import { router } from 'expo-router';
import { EmailSignInForm } from '@/components/EmailSignInForm';
import { supabase } from '@/lib/supabase';

export default function EmailSignInPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    console.log('Back pressed - navigating to sign in');
    router.back();
  };

  const handleSubmit = async (data: {
    email: string;
    password: string;
  }) => {
    console.log('Email sign in submitted:', { ...data, password: '[HIDDEN]' });
    setIsLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        throw error;
      }
      
      console.log('User signed in successfully:', authData.user?.id);
      
      // Navigate to main app
      router.replace('/(tabs)');
      setIsLoading(false);
      
    } catch (error) {
      console.error('Failed to sign in:', error);
      setIsLoading(false);
      throw error; // Let the form handle the error display
    }
  };

  const handleSignUpPress = () => {
    console.log('Sign up pressed - navigating to sign up');
    router.push('/signup');
  };

  const handleForgotPasswordPress = () => {
    console.log('Forgot password pressed');
    // TODO: Navigate to forgot password screen or show modal
  };

  return (
    <EmailSignInForm 
      onBack={handleBack}
      onSubmit={handleSubmit}
      onSignUpPress={handleSignUpPress}
      onForgotPasswordPress={handleForgotPasswordPress}
      isLoading={isLoading}
    />
  );
}