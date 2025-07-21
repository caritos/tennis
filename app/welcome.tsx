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
    // TODO: Navigate to terms screen or open web view
  };

  const handlePrivacyPress = () => {
    console.log('Privacy Policy pressed');
    // TODO: Navigate to privacy screen or open web view
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