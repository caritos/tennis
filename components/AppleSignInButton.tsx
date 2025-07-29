import React from 'react';
import { Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';
import { getAuthErrorMessage } from '@/utils/errorHandling';

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function AppleSignInButton({ 
  onSuccess, 
  onError,
  disabled = false 
}: AppleSignInButtonProps) {
  
  const handleAppleSignIn = async () => {
    try {
      console.log('AppleSignInButton: Starting Apple Sign In...');
      
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        const errorMessage = 'Apple Sign In is not available on this device';
        console.error('AppleSignInButton:', errorMessage);
        onError?.(errorMessage);
        return;
      }

      // Request Apple Authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('AppleSignInButton: Apple credential received:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: credential.identityToken ? 'present' : 'missing',
        authorizationCode: credential.authorizationCode ? 'present' : 'missing'
      });

      // Validate required data
      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Sign in with Supabase using Apple identity token
      const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.nonce,
      });

      if (authError) {
        console.error('AppleSignInButton: Supabase auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data received from Supabase');
      }

      console.log('AppleSignInButton: Successfully signed in user:', authData.user.id);

      // Update user profile with Apple data if available
      if (credential.fullName || credential.email) {
        const updates: any = {};
        
        if (credential.fullName) {
          const fullName = [
            credential.fullName.givenName,
            credential.fullName.familyName
          ].filter(Boolean).join(' ').trim();
          
          if (fullName) {
            updates.full_name = fullName;
          }
        }

        if (credential.email) {
          updates.email = credential.email;
        }

        if (Object.keys(updates).length > 0) {
          console.log('AppleSignInButton: Updating user profile with Apple data:', updates);
          
          const { error: updateError } = await supabase
            .from('users')
            .upsert({
              id: authData.user.id,
              ...updates,
              updated_at: new Date().toISOString()
            });

          if (updateError) {
            console.warn('AppleSignInButton: Failed to update user profile:', updateError);
            // Don't throw here - the sign in was successful
          } else {
            console.log('AppleSignInButton: User profile updated successfully');
          }
        }
      }

      console.log('AppleSignInButton: Apple Sign In completed successfully');
      onSuccess?.();

    } catch (error: any) {
      console.error('AppleSignInButton: Apple Sign In failed:', error);
      
      let errorMessage = 'Apple Sign In failed';
      
      if (error?.code === 'ERR_CANCELED') {
        errorMessage = 'Apple Sign In was cancelled';
      } else if (error?.message) {
        errorMessage = getAuthErrorMessage(error);
      }
      
      onError?.(errorMessage);
    }
  };

  // Don't render on non-iOS platforms
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={{
        width: '100%',
        height: 50,
      }}
      onPress={handleAppleSignIn}
      disabled={disabled}
    />
  );
}