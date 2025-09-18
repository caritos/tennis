import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface WelcomeScreenProps {
  onContinue: (email: string, password: string) => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  error?: string | null;
  isLoading?: boolean;
  onDismissError?: () => void;
}

export function WelcomeScreen({
  onContinue,
  onTermsPress,
  onPrivacyPress,
  error,
  isLoading,
  onDismissError
}: WelcomeScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleTermsPress = () => {
    console.log('🔘 BUTTON: Terms of Service pressed');
    try {
      onTermsPress?.();
    } catch (error) {
      console.error('Error in onTermsPress:', error);
    }
  };

  const handlePrivacyPress = () => {
    console.log('🔘 BUTTON: Privacy Policy pressed');
    try {
      onPrivacyPress?.();
    } catch (error) {
      console.error('Error in onPrivacyPress:', error);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleContinue = () => {
    console.log('🔘 BUTTON: Continue pressed');
    if (!email.trim() || !password) {
      return; // Basic validation
    }
    try {
      onContinue(email.trim(), password);
    } catch (error) {
      console.error('Error in onContinue:', error);
    }
  };

  return (
    <ThemedView 
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="welcome-screen-container"
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          testID="welcome-main-content"
        >
        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}>
            <Ionicons name="alert-circle" size={20} color="#F44336" />
            <ThemedText style={[styles.errorText, { color: '#F44336' }]}>{error}</ThemedText>
            <TouchableOpacity onPress={onDismissError} style={styles.errorDismiss}>
              <Ionicons name="close" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}

        {/* Header with Tennis Emoji and App Title */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.appTitle}>
            🎾 Play Serve
          </ThemedText>
        </View>

        {/* Value Proposition */}
        <View style={styles.valueProposition}>
          <ThemedText type="subtitle" style={styles.tagline}>
            Connect with tennis players in your area
          </ThemedText>
          
          <View style={styles.features}>
            <ThemedText type="default" style={[styles.feature, { color: colors.tabIconDefault }]}>
              🏟️ Join local tennis clubs
            </ThemedText>
            <ThemedText type="default" style={[styles.feature, { color: colors.tabIconDefault }]}>
              📊 Track your matches and stats
            </ThemedText>
            <ThemedText type="default" style={[styles.feature, { color: colors.tabIconDefault }]}>
              👥 Find playing partners nearby
            </ThemedText>
          </View>
          
          <ThemedText type="default" style={[styles.description, { color: colors.tabIconDefault }]}>
            Join a community of tennis enthusiasts. Create clubs, organize matches, and track your progress with fellow players in your area.
          </ThemedText>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
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
              placeholder="Email"
              placeholderTextColor={colors.tabIconDefault}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="email-input"
            />
          </View>

          <View style={styles.inputContainer}>
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
                placeholder="Password"
                placeholderTextColor={colors.tabIconDefault}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                testID="password-input"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            style={[
              styles.forgotPasswordContainer,
              !isValidEmail(email) && styles.disabledForgotPassword
            ]}
            onPress={() => isValidEmail(email) && console.log('Forgot password pressed for:', email)}
            disabled={!isValidEmail(email)}
            accessibilityRole="button"
            accessibilityLabel="Forgot Password"
            testID="forgot-password-link"
          >
            <ThemedText style={[
              styles.forgotPasswordText,
              { color: isValidEmail(email) ? colors.tint : colors.tabIconDefault }
            ]}>
              Forgot Password?
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.tint },
              (!isValidEmail(email) || !password || isLoading) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!isValidEmail(email) || !password || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            activeOpacity={0.8}
            testID="continue-button"
          >
            <ThemedText style={styles.primaryButtonText}>
              {isLoading ? 'Processing...' : 'Continue'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Alternative Actions */}
        <View style={styles.actionsContainer}>
        </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleTermsPress}
            accessibilityRole="button"
            accessibilityLabel="Terms of Service"
            style={styles.footerLink}
            testID="terms-of-service-link"
          >
            <ThemedText style={[styles.footerLinkText, { color: colors.tabIconDefault }]}>
              Terms of Service
            </ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={[styles.footerSeparator, { color: colors.tabIconDefault }]}>
            {' | '}
          </ThemedText>
          
          <TouchableOpacity
            onPress={handlePrivacyPress}
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
            style={styles.footerLink}
            testID="privacy-policy-link"
          >
            <ThemedText style={[styles.footerLinkText, { color: colors.tabIconDefault }]}>
              Privacy Policy
            </ThemedText>
          </TouchableOpacity>
        </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16, // iOS standard content margins
    paddingTop: 60,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 34, // iOS Large Title
    fontWeight: 'bold',
    textAlign: 'center',
  },
  valueProposition: {
    alignItems: 'center',
    marginBottom: 60,
  },
  tagline: {
    fontSize: 20, // iOS Title 3
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  features: {
    alignItems: 'center',
    marginBottom: 20,
  },
  feature: {
    fontSize: 17, // iOS Body
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 17, // iOS Body
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12, // iOS standard radius
    marginBottom: 24,
    minWidth: 200,
    minHeight: 50, // iOS minimum touch target for primary buttons
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17, // iOS Headline
    fontWeight: '600',
  },
  signInContainer: {
    alignItems: 'center',
  },
  signInPrompt: {
    fontSize: 17, // iOS Body
    marginBottom: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44, // iOS minimum touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 17, // iOS Headline
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44, // iOS minimum touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinkText: {
    fontSize: 13, // iOS Caption 1
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 13, // iOS Caption 1
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    minHeight: 50,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 50,
    fontSize: 17,
    minHeight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -22,
    padding: 12,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  disabledForgotPassword: {
    opacity: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  errorDismiss: {
    padding: 4,
  },
});