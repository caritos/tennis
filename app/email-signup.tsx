import React, { useState } from 'react';
import { router } from 'expo-router';
import { EmailSignUpForm } from '@/components/EmailSignUpForm';
import { supabase } from '@/lib/supabase';
import { initializeDatabase } from '@/database/database';
import { getAuthErrorMessage, logError } from '@/utils/errorHandling';

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
    console.log('=== EMAIL SIGNUP STARTING ===');
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
        logError('email-signup', signUpError);
        throw new Error(getAuthErrorMessage(signUpError));
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user account');
      }
      
      if (!authData.session) {
        console.warn('User created but no session returned - this may require email verification');
      }
      
      // Store user data in Supabase database with retry logic
      let profileError = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        const { error } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            full_name: data.fullName,
            email: data.email,
            phone: data.phone || null,
            role: 'player'
          });
        
        profileError = error;
        
        if (!error) {
          console.log('User profile created successfully in Supabase');
          break;
        }
        
        // If it's a foreign key constraint error, wait and retry
        if (error.code === '23503' && retryCount < maxRetries - 1) {
          console.log(`Foreign key constraint error, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          retryCount++;
        } else {
          console.error('Failed to create user profile:', error);
          break;
        }
      }
      
      if (profileError) {
        console.error('Final error creating user profile:', profileError);
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
      console.log('=== NAVIGATING TO INDEX ===');
      
      // Navigate to index route, which will handle routing to tabs after auth is ready
      router.replace('/');
      setIsLoading(false);
      console.log('=== EMAIL SIGNUP COMPLETED ===');
      
    } catch (error) {
      console.error('=== EMAIL SIGNUP ERROR ===');
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