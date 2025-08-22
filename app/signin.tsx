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
import { initializeDatabase } from '@/database/database';
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
      
      // Ensure user exists in local database
      if (authData.user) {
        const db = await initializeDatabase();
        
        // Check if user exists locally
        const existingUser = await db.getFirstAsync(
          `SELECT * FROM users WHERE id = ?`,
          [authData.user.id]
        );
        
        // If user doesn't exist locally, sync from Supabase
        if (!existingUser) {
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          if (userProfile && !profileError) {
            await db.runAsync(
              `INSERT OR REPLACE INTO users (id, full_name, email, phone, role, created_at) 
               VALUES (?, ?, ?, ?, ?, datetime('now'))`,
              [
                userProfile.id,
                userProfile.full_name,
                userProfile.email,
                userProfile.phone,
                userProfile.role || 'player'
              ]
            );
          } else {
            // Fallback: use auth metadata
            const fullName = authData.user.user_metadata?.full_name || 
                           authData.user.email?.split('@')[0] || 'User';
            
            await db.runAsync(
              `INSERT OR REPLACE INTO users (id, full_name, email, phone, role, created_at) 
               VALUES (?, ?, ?, ?, ?, datetime('now'))`,
              [
                authData.user.id,
                fullName,
                authData.user.email,
                authData.user.user_metadata?.phone || null,
                'player'
              ]
            );
          }
        }
      }
      
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
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
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
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 45,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
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
  footerLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 14,
  },
});