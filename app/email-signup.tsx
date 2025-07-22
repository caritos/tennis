import React, { useState } from 'react';
import { router } from 'expo-router';
import { EmailSignUpForm } from '@/components/EmailSignUpForm';
import { supabase } from '@/lib/supabase';
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
      // Sign up with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || null,
          }
        }
      });
      
      if (signUpError) {
        throw signUpError;
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }
      
      // Store user data in Supabase database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone || null,
          role: 'player'
        });
      
      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        // Continue anyway as auth was successful
      }
      
      // Also store in local SQLite for offline support
      const db = await initializeDatabase();
      await db.runAsync(
        `INSERT OR REPLACE INTO users (id, full_name, email, phone, role, created_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
          authData.user.id,
          data.fullName,
          data.email,
          data.phone || null,
          'player'
        ]
      );
      
      console.log('User created successfully:', authData.user.id);
      
      // Navigate to main app
      router.replace('/(tabs)');
      setIsLoading(false);
      
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