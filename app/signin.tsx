import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
// import { initializeDatabase } from '@/database/database'; // Removed - using Supabase only
import { getAuthErrorMessage, logError } from '@/utils/errorHandling';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    console.log('Back pressed - navigating back');
    router.back();
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    console.log('Email sign in submitted');
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) {
        logError('email-signin', error);
        throw new Error(getAuthErrorMessage(error));
      }
      
      if (!authData.user || !authData.session) {
        throw new Error('Sign in failed - no user session created');
      }
      
      // User data is managed entirely through Supabase now
      console.log('User signed in successfully:', authData.user?.email);
      
      console.log('User signed in successfully:', authData.user?.id);
      
      // Navigate to index route, which will handle routing to tabs after auth is ready
      router.replace('/');
      setIsLoading(false);
      
    } catch (error: any) {
      console.error('Failed to sign in:', error);
      setError(error.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password pressed');
    router.push('/forgot-password');
  };


  const handleSignUpPress = () => {
    console.log('Sign up pressed - navigating to sign up');
    router.push('/signup');
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
          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}>
              <Ionicons name="alert-circle" size={20} color="#F44336" />
              <ThemedText style={[styles.errorText, { color: '#F44336' }]}>{error}</ThemedText>
              <TouchableOpacity onPress={() => setError(null)} style={styles.errorDismiss}>
                <Ionicons name="close" size={16} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}

          {/* App Title and Message */}
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.appTitle}>
              🎾 Play Serve
            </ThemedText>
            <ThemedText type="default" style={[styles.subtitle, { color: colors.tabIconDefault }]}>
              Welcome back!
            </ThemedText>
          </View>

          {/* Sign In Form */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.formContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Email</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.tabIconDefault,
                      color: colors.text
                    }
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.tabIconDefault}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  testID="email-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Password</ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.tabIconDefault,
                        color: colors.text
                      }
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.tabIconDefault}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    testID="password-input"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={colors.tabIconDefault} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={isLoading}
                style={styles.forgotPasswordContainer}
              >
                <ThemedText style={[styles.forgotPasswordText, { color: colors.tint }]}>
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.signInButton,
                  { backgroundColor: colors.tint },
                  isLoading && styles.disabledButton
                ]}
                onPress={handleSignIn}
                disabled={isLoading}
                testID="signin-button"
              >
                <ThemedText style={[styles.signInButtonText, { color: '#fff' }]}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>

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
            <View style={styles.footerLinksContainer}>
              <TouchableOpacity onPress={handleTermsPress} disabled={isLoading}>
                <ThemedText style={[styles.footerLink, { color: colors.tabIconDefault }]}>
                  Terms of Service
                </ThemedText>
              </TouchableOpacity>
              <ThemedText style={[styles.footerSeparator, { color: colors.tabIconDefault }]}>
                {' '}|{' '}
              </ThemedText>
              <TouchableOpacity onPress={handlePrivacyPress} disabled={isLoading}>
                <ThemedText style={[styles.footerLink, { color: colors.tabIconDefault }]}>
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16, // iOS standard margins
    marginBottom: 16,
    borderRadius: 12, // iOS standard radius
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15, // iOS Body
  },
  errorDismiss: {
    padding: 4,
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
    minHeight: 44, // iOS minimum touch target
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17, // iOS Headline
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // iOS standard content margins
    paddingVertical: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 28, // iOS Title 1
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17, // iOS Body
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15, // iOS Body
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12, // iOS standard radius
    paddingHorizontal: 16, // iOS standard padding
    paddingVertical: 16,
    fontSize: 17, // iOS text input size
    minHeight: 50, // iOS minimum input height
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12, // iOS standard radius
    paddingHorizontal: 16, // iOS standard padding
    paddingVertical: 16,
    paddingRight: 50,
    fontSize: 17, // iOS text input size
    minHeight: 50, // iOS minimum input height
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -22, // Center vertically
    padding: 12,
    minHeight: 44, // iOS minimum touch target
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    minHeight: 44, // iOS minimum touch target
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordText: {
    fontSize: 15, // iOS Body
    fontWeight: '500',
  },
  signInButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12, // iOS standard radius
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50, // iOS minimum primary button height
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: 17, // iOS Headline
    fontWeight: '600',
  },
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  signUpPrompt: {
    fontSize: 17, // iOS Body
  },
  signUpLink: {
    fontSize: 17, // iOS Headline
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
  footerLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 13, // iOS Caption 1
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 13, // iOS Caption 1
  },
});