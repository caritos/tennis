import React, { useState } from 'react';
import { router } from 'expo-router';
import { EmailSignInForm } from '@/components/EmailSignInForm';
import { initializeDatabase } from '@/database/database';

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
      // TODO: Implement actual authentication with Supabase
      // For now, check if user exists in local database
      
      const db = await initializeDatabase();
      const user = await db.getFirstAsync(
        `SELECT * FROM users WHERE email = ?`,
        [data.email]
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      console.log('User found, signing in:', user.id);
      
      // Simulate a brief delay then navigate to main app
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
      
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