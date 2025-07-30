import React, { useState } from 'react';
import { router } from 'expo-router';
import { EmailSignInForm } from '@/components/EmailSignInForm';
import { supabase } from '@/lib/supabase';
import { initializeDatabase } from '@/database/database';
import { getAuthErrorMessage, logError } from '@/utils/errorHandling';

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
        logError('email-signin', error);
        throw new Error(getAuthErrorMessage(error));
      }
      
      if (!authData.user || !authData.session) {
        throw new Error('Sign in failed - no user session created');
      }
      
      // Ensure user exists in local database
      if (authData.user) {
        const db = await initializeDatabase();
        
        // Check if user exists locally
        const existingUser = await db.getFirstAsync(
          `SELECT * FROM users WHERE id = ?`,
          [authData.user.id]
        );
        
        // If user doesn't exist locally, sync from Supabase
        if (!existingUser) {
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          if (userProfile && !profileError) {
            await db.runAsync(
              `INSERT OR REPLACE INTO users (id, full_name, email, phone, role, created_at) 
               VALUES (?, ?, ?, ?, ?, datetime('now'))`,
              [
                userProfile.id,
                userProfile.full_name,
                userProfile.email,
                userProfile.phone,
                userProfile.role || 'player'
              ]
            );
          } else {
            // Fallback: use auth metadata
            const fullName = authData.user.user_metadata?.full_name || 
                           authData.user.email?.split('@')[0] || 'User';
            
            await db.runAsync(
              `INSERT OR REPLACE INTO users (id, full_name, email, phone, role, created_at) 
               VALUES (?, ?, ?, ?, ?, datetime('now'))`,
              [
                authData.user.id,
                fullName,
                authData.user.email,
                authData.user.user_metadata?.phone || null,
                'player'
              ]
            );
          }
        }
      }
      
      console.log('User signed in successfully:', authData.user?.id);
      
      // Navigate to index route, which will handle routing to tabs after auth is ready
      router.replace('/');
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
    router.push('/forgot-password');
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