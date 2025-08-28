import React, { useState } from 'react';
import { router } from 'expo-router';
import { EmailSignInForm } from '@/components/EmailSignInForm';
import { useAuth } from '@/contexts/AuthContext';
import { isAbortError } from '@/utils/errorHandling';

export default function EmailSignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleBack = () => {
    console.log('Back pressed - navigating to sign in');
    router.back();
  };

  const handleSubmit = async (data: {
    email: string;
    password: string;
  }) => {
    console.log('🔐 Email sign in submitted:', { ...data, password: '[HIDDEN]' });
    setIsLoading(true);
    
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        throw new Error(error);
      }
      
      console.log('✅ User signed in successfully');
      router.replace('/');
      
    } catch (error: any) {
      // Ignore abort errors - they happen when component unmounts
      if (isAbortError(error)) {
        console.log('⚠️ Sign in aborted (component unmounted)');
        return;
      }
      
      console.error('❌ Failed to sign in:', error);
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