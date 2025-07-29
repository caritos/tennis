import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import AppleSignInButton from '@/components/AppleSignInButton';
import { useNotification } from '@/contexts/NotificationContext';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showError, showInfo } = useNotification();

  const handleBack = () => {
    console.log('Back pressed - navigating back');
    router.back();
  };

  const handleEmailSignIn = async () => {
    console.log('Email sign in pressed - navigating to email sign in form');
    router.push('/email-signin');
  };

  const handleAppleSignInSuccess = () => {
    console.log('Apple sign in successful - navigating to main app');
    router.replace('/(tabs)');
  };

  const handleAppleSignInError = (error: string) => {
    console.error('Apple sign in error:', error);
    showError('Sign In Error', error);
    setIsLoading(false);
  };


  const handleSignUpPress = () => {
    console.log('Sign up pressed - navigating to sign up');
    router.push('/signup');
  };

  return (
    <ThemedView 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="back-button"
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <ThemedText type="title" style={styles.headerTitle}>
            Sign In
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
              Welcome back!
            </ThemedText>
          </View>

          {/* Sign In Methods */}
          <View style={styles.signInMethods}>
            <TouchableOpacity
              style={[
                styles.signInButton,
                { backgroundColor: colors.background, borderColor: colors.tabIconDefault }
              ]}
              onPress={handleEmailSignIn}
              disabled={isLoading}
              testID="email-signin-button"
            >
              <ThemedText style={styles.signInButtonText}>
                📧 Continue with Email
              </ThemedText>
            </TouchableOpacity>

            {Platform.OS === 'ios' ? (
              <View style={styles.appleSignInContainer}>
                <AppleSignInButton
                  onSuccess={handleAppleSignInSuccess}
                  onError={handleAppleSignInError}
                  disabled={isLoading}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  { backgroundColor: colors.background, borderColor: colors.tabIconDefault }
                ]}
                onPress={() => {
                  showInfo('Not Available', 'Apple Sign In is only available on iOS devices');
                }}
                disabled={isLoading}
              >
                <ThemedText style={styles.signInButtonText}>
                  🍎 Continue with Apple
                </ThemedText>
              </TouchableOpacity>
            )}

          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpSection}>
            <ThemedText style={[styles.signUpPrompt, { color: colors.tabIconDefault }]}>
              Don&apos;t have an account?{' '}
            </ThemedText>
            <TouchableOpacity
              onPress={handleSignUpPress}
              disabled={isLoading}
              testID="signup-link"
            >
              <ThemedText style={[styles.signUpLink, { color: colors.tint }]}>
                Sign Up
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: colors.tabIconDefault }]}>
              Terms of Service | Privacy Policy
            </ThemedText>
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
    width: 40,
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
  signInMethods: {
    marginBottom: 40,
  },
  signInButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  appleSignInContainer: {
    marginBottom: 16,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  signUpPrompt: {
    fontSize: 16,
  },
  signUpLink: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
  },
});