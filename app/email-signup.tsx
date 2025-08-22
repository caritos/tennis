import React, { useState } from 'react';
import { router } from 'expo-router';
import { EmailSignUpForm } from '@/components/EmailSignUpForm';
import { useAuth } from '@/contexts/AuthContext';

export default function EmailSignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

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
    console.log('📝 Email sign up submitted:', { ...data, password: '[HIDDEN]' });
    setIsLoading(true);
    
    try {
      const { error } = await signUp(data.email, data.password, data.fullName, data.phone);
      
      if (error) {
        throw new Error(error);
      }
      
      console.log('✅ User created successfully');
      router.replace('/');
      
    } catch (error) {
      console.error('❌ Failed to create user:', error);
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
    router.push('/terms-of-service');
  };

  const handlePrivacyPress = () => {
    console.log('Privacy Policy pressed');
    router.push('/privacy-policy');
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