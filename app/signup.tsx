import React, { useState } from 'react';
import { router } from 'expo-router';
import { SignUpScreen } from '@/components/SignUpScreen';
import { useNotification } from '@/contexts/NotificationContext';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useNotification();

  const handleBack = () => {
    console.log('Back pressed - navigating to welcome');
    router.back();
  };

  const handleEmailSignUp = async () => {
    console.log('Email sign up pressed');
    setIsLoading(true);
    
    try {
      // TODO: Navigate to email sign up form
      router.push('/email-signup');
    } catch (error) {
      console.error('Email sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignUpSuccess = () => {
    console.log('Apple sign up successful - navigating to main app');
    router.replace('/(tabs)');
  };

  const handleAppleSignUpError = (error: string) => {
    console.error('Apple sign up error:', error);
    showError('Sign Up Error', error);
    setIsLoading(false);
  };

  const handleGoogleSignUp = async () => {
    console.log('Google sign up pressed');
    setIsLoading(true);
    
    try {
      // TODO: Implement Google Sign In
      // For now, simulate success and go to main app
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (error) {
      console.error('Google sign up error:', error);
      setIsLoading(false);
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
    <SignUpScreen 
      onBack={handleBack}
      onEmailSignUp={handleEmailSignUp}
      onAppleSignUpSuccess={handleAppleSignUpSuccess}
      onAppleSignUpError={handleAppleSignUpError}
      onGoogleSignUp={handleGoogleSignUp}
      onSignInPress={handleSignInPress}
      onTermsPress={handleTermsPress}
      onPrivacyPress={handlePrivacyPress}
      isLoading={isLoading}
    />
  );
}