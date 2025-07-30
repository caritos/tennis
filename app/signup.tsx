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
    console.log('Apple sign up successful - will redirect based on onboarding status');
    router.replace('/');
  };

  const handleAppleSignUpError = (error: string) => {
    console.error('Apple sign up error:', error);
    showError('Sign Up Error', error);
    setIsLoading(false);
  };


  const handleSignInPress = () => {
    console.log('Sign in pressed - navigating to sign in');
    router.push('/signin');
  };

  const handleTermsPress = () => {
    console.log('Terms of Service pressed');
    router.push('/terms-of-service');
  };

  const handlePrivacyPress = () => {
    console.log('Privacy Policy pressed');
    router.push('/privacy-policy');
  };

  return (
    <SignUpScreen 
      onBack={handleBack}
      onEmailSignUp={handleEmailSignUp}
      onAppleSignUpSuccess={handleAppleSignUpSuccess}
      onAppleSignUpError={handleAppleSignUpError}
      onSignInPress={handleSignInPress}
      onTermsPress={handleTermsPress}
      onPrivacyPress={handlePrivacyPress}
      isLoading={isLoading}
    />
  );
}