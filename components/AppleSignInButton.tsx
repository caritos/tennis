import React from 'react';
import { Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { getAuthErrorMessage } from '@/utils/errorHandling';
import { logAppleSignInDebugInfo, isAppleSignInSupported } from '@/utils/appleSignInDebug';

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
      
      // Log comprehensive debug information for troubleshooting
      await logAppleSignInDebugInfo();
      
      // Quick support check with detailed error message
      const supportCheck = await isAppleSignInSupported();
      if (!supportCheck.supported) {
        const errorMessage = supportCheck.reason || 'Apple Sign In is not supported in current environment';
        console.error('AppleSignInButton: Support check failed:', errorMessage);
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
      console.error('AppleSignInButton: Error details:', {
        code: error?.code,
        message: error?.message,
        domain: error?.domain,
        userInfo: error?.userInfo
      });
      
      let errorMessage = 'Apple Sign In failed';
      
      // Handle specific Apple Authentication error codes
      if (error?.code === 'ERR_CANCELED' || error?.code === 1001) {
        errorMessage = 'Apple Sign In was cancelled by user';
      } else if (error?.code === 1000) {
        errorMessage = 'Apple Sign In failed: Unknown error. Please try again or contact support.';
      } else if (error?.code === 1002) {
        errorMessage = 'Apple Sign In failed: Invalid response from Apple. Please try again.';
      } else if (error?.code === 1003) {
        errorMessage = 'Apple Sign In failed: Not handled. This device may not support Apple Sign In.';
      } else if (error?.code === 1004) {
        errorMessage = 'Apple Sign In failed: Request failed. Please check your internet connection.';
      } else if (error?.code === -7003) {
        // AKAuthenticationError Code=-7003 (common configuration issue)
        errorMessage = 'Apple Sign In configuration error. Please ensure your app is properly configured in Apple Developer Portal.';
      } else if (error?.message?.includes('Network request failed')) {
        errorMessage = 'Apple Sign In failed: Network error. Please check your internet connection and try again.';
      } else if (error?.message?.includes('Invalid login credentials')) {
        errorMessage = 'Apple Sign In failed: Invalid credentials. Please try signing in again.';
      } else if (error?.message?.includes('authorization attempt failed')) {
        try {
          if (!Device.isDevice) {
            errorMessage = 'Apple Sign In requires a real iOS device. Testing on a simulator is not supported.';
          } else {
            errorMessage = 'Apple Sign In authorization failed. Please ensure you are signed into iCloud and try again. If the problem persists, please contact support.';
          }
        } catch (deviceError) {
          // Fallback if Device module is not available (e.g., in Expo Go)
          errorMessage = 'Apple Sign In authorization failed. Please try again or use email sign up.';
        }
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