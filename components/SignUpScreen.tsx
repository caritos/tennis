import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import AppleSignInButton from './AppleSignInButton';
import { useNotification } from '@/contexts/NotificationContext';

interface SignUpScreenProps {
  onBack: () => void;
  onEmailSignUp: () => void;
  onAppleSignUpSuccess: () => void;
  onAppleSignUpError: (error: string) => void;
  onSignInPress: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  isLoading?: boolean;
}

export function SignUpScreen({ 
  onBack,
  onEmailSignUp,
  onAppleSignUpSuccess,
  onAppleSignUpError,
  onSignInPress,
  onTermsPress,
  onPrivacyPress,
  isLoading = false
}: SignUpScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showInfo } = useNotification();
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const handleButtonPress = (action: () => void, buttonId: string) => {
    console.log(`🔘 BUTTON: ${buttonId} signup pressed`);
    if (isLoading || pressedButton === buttonId) {
      console.log(`⚠️ Button press ignored - loading: ${isLoading}, pressed: ${pressedButton === buttonId}`);
      return;
    }
    
    setPressedButton(buttonId);
    
    try {
      action();
    } catch (error) {
      console.error(`Error in ${buttonId}:`, error);
    } finally {
      setTimeout(() => setPressedButton(null), 300);
    }
  };

  const handleBack = () => {
    console.log('🔘 BUTTON: Back pressed (SignUpScreen)');
    try {
      onBack();
    } catch (error) {
      console.error('Error in onBack:', error);
    }
  };

  const handleTermsPress = () => {
    console.log('🔘 BUTTON: Terms of Service pressed (SignUpScreen)');
    try {
      onTermsPress?.();
    } catch (error) {
      console.error('Error in onTermsPress:', error);
    }
  };

  const handlePrivacyPress = () => {
    console.log('🔘 BUTTON: Privacy Policy pressed (SignUpScreen)');
    try {
      onPrivacyPress?.();
    } catch (error) {
      console.error('Error in onPrivacyPress:', error);
    }
  };

  return (
    <ThemedView 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header} testID="sign-up-header">
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Go back to the previous screen"
            testID="back-button"
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <ThemedText type="title" style={styles.headerTitle}>
            Sign Up
          </ThemedText>
          
          <View style={styles.headerSpacer} />
        </View>

        <ThemedView style={styles.content}>
          {/* App Title and Message */}
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.appTitle}>
              🎾 Tennis Club
            </ThemedText>
            <ThemedText type="default" style={[styles.subtitle, { color: colors.tabIconDefault }]}>
              Join the tennis community!
            </ThemedText>
          </View>

          {/* Sign Up Methods */}
          <View style={styles.signUpMethods} testID="sign-up-methods">
            <TouchableOpacity
              style={[
                styles.signUpButton,
                { backgroundColor: colors.background, borderColor: colors.tabIconDefault }
              ]}
              onPress={() => handleButtonPress(onEmailSignUp, 'email')}
              accessibilityRole="button"
              accessibilityLabel="Sign up with Email"
              accessibilityHint="Create a new account using your email address"
              accessibilityState={{ disabled: isLoading }}
              testID="email-signup-button"
              disabled={isLoading}
            >
              <ThemedText style={styles.signUpButtonText}>
                📧 Sign up with Email
              </ThemedText>
            </TouchableOpacity>

            {Platform.OS === 'ios' ? (
              <View style={styles.appleSignUpContainer}>
                <AppleSignInButton
                  onSuccess={onAppleSignUpSuccess}
                  onError={onAppleSignUpError}
                  disabled={isLoading}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.signUpButton,
                  { backgroundColor: colors.background, borderColor: colors.tabIconDefault }
                ]}
                onPress={() => {
                  showInfo('Not Available', 'Apple Sign In is only available on iOS devices');
                }}
                accessibilityRole="button"
                accessibilityLabel="Continue with Apple"
                accessibilityHint="Sign up using your Apple ID"
                accessibilityState={{ disabled: isLoading }}
                testID="apple-signup-button"
                disabled={isLoading}
              >
                <ThemedText style={styles.signUpButtonText}>
                  🍎 Continue with Apple
                </ThemedText>
              </TouchableOpacity>
            )}

          </View>

          {/* Sign In Link */}
          <View style={styles.signInSection}>
            <ThemedText style={[styles.signInPrompt, { color: colors.tabIconDefault }]}>
              Already have an account?{' '}
            </ThemedText>
            <TouchableOpacity
              onPress={() => handleButtonPress(onSignInPress, 'signin')}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
              accessibilityHint="Go to sign in screen for existing users"
              disabled={isLoading}
              testID="signin-link"
            >
              <ThemedText style={[styles.signInLink, { color: colors.tint }]}>
                Sign In
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Terms and Privacy */}
          <View style={styles.legalSection}>
            <ThemedText style={[styles.legalText, { color: colors.tabIconDefault }]}>
              By signing up, you agree to our
            </ThemedText>
            <View style={styles.legalLinks}>
              <TouchableOpacity
                onPress={handleTermsPress}
                accessibilityRole="button"
                accessibilityLabel="Terms of Service"
                style={styles.legalLink}
                testID="terms-link"
              >
                <ThemedText style={[styles.legalLinkText, { color: colors.tint }]}>
                  Terms of Service
                </ThemedText>
              </TouchableOpacity>
              
              <ThemedText style={[styles.legalSeparator, { color: colors.tabIconDefault }]}>
                {' | '}
              </ThemedText>
              
              <TouchableOpacity
                onPress={handlePrivacyPress}
                accessibilityRole="button"
                accessibilityLabel="Privacy Policy"
                style={styles.legalLink}
                testID="privacy-link"
              >
                <ThemedText style={[styles.legalLinkText, { color: colors.tint }]}>
                  Privacy Policy
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40, // Same as back button to center title
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  signUpMethods: {
    marginBottom: 40,
  },
  signUpButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  appleSignUpContainer: {
    marginBottom: 16,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signInSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  signInPrompt: {
    fontSize: 16,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalSection: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  legalText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalLink: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  legalLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 14,
  },
});