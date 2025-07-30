import React from 'react';
import { router } from 'expo-router';
import { WelcomeScreen } from '@/components/WelcomeScreen';

export default function WelcomePage() {
  const handleGetStarted = () => {
    console.log('Get Started pressed - navigating to sign up');
    router.push('/signup');
  };

  const handleSignIn = () => {
    console.log('Sign In pressed - navigating to sign in');
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
    <WelcomeScreen 
      onGetStarted={handleGetStarted}
      onSignIn={handleSignIn}
      onTermsPress={handleTermsPress}
      onPrivacyPress={handlePrivacyPress}
    />
  );
}