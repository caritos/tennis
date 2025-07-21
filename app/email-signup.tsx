import React, { useState } from 'react';
import { router } from 'expo-router';
import { EmailSignUpForm } from '@/components/EmailSignUpForm';
import { initializeDatabase } from '@/database/database';

export default function EmailSignUpPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    console.log('Back pressed - navigating to sign up');
    router.back();
  };

  const handleSubmit = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
  }) => {
    console.log('Email sign up submitted:', { ...data, password: '[HIDDEN]' });
    setIsLoading(true);
    
    try {
      // TODO: Implement actual user creation with Supabase
      // For now, create user in local database and navigate to main app
      
      const db = await initializeDatabase();
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.runAsync(
        `INSERT INTO users (id, full_name, email, phone, role, created_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
          userId,
          data.fullName,
          data.email,
          data.phone || null,
          'player'
        ]
      );
      
      console.log('User created successfully:', userId);
      
      // Simulate a brief delay then navigate to main app
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
      
    } catch (error) {
      console.error('Failed to create user:', error);
      setIsLoading(false);
      throw error; // Let the form handle the error display
    }
  };

  const handleSignInPress = () => {
    console.log('Sign in pressed - navigating to sign in');
    router.push('/signin');
  };

  const handleTermsPress = () => {
    console.log('Terms of Service pressed');
    // TODO: Navigate to terms screen or open web view
  };

  const handlePrivacyPress = () => {
    console.log('Privacy Policy pressed');
    // TODO: Navigate to privacy screen or open web view
  };

  return (
    <EmailSignUpForm 
      onBack={handleBack}
      onSubmit={handleSubmit}
      onSignInPress={handleSignInPress}
      onTermsPress={handleTermsPress}
      onPrivacyPress={handlePrivacyPress}
      isLoading={isLoading}
    />
  );
}