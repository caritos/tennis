import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/contexts/NotificationContext';
import { getAuthErrorMessage } from '@/utils/errorHandling';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showSuccess, showError } = useNotification();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_APP_URL || 'tennis-club://'}reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setIsSubmitted(true);
      showSuccess(
        'Check your email',
        'We sent you a password reset link. Please check your email inbox.'
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      const userFriendlyMessage = getAuthErrorMessage(error);
      setError(userFriendlyMessage);
      showError('Error', userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleBackToSignIn = () => {
    router.replace('/email-signin');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleBack} 
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, { backgroundColor: colors.tint + '20' }]}>
              <Ionicons name="lock-closed-outline" size={40} color={colors.tint} />
            </View>
          </View>

          {/* Content */}
          <ThemedView style={styles.content}>
            <ThemedText type="title" style={styles.title}>
              Forgot Password?
            </ThemedText>
            
            {!isSubmitted ? (
              <>
                <ThemedText style={styles.description}>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </ThemedText>

                {/* Email Input */}
                <ThemedView style={styles.inputContainer}>
                  <ThemedText style={styles.label}>Email</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.background,
                        borderColor: error ? '#ff3b30' : colors.icon,
                        color: colors.text
                      }
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.tabIconDefault}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  {error ? (
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                  ) : null}
                </ThemedView>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.tint },
                    isLoading && styles.disabledButton
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Send reset link"
                >
                  <ThemedText style={styles.submitButtonText}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </ThemedText>
                </TouchableOpacity>

                {/* Back to Sign In */}
                <TouchableOpacity
                  style={styles.signInLink}
                  onPress={handleBackToSignIn}
                  accessibilityRole="button"
                  accessibilityLabel="Back to sign in"
                >
                  <ThemedText style={[styles.signInLinkText, { color: colors.tint }]}>
                    Back to Sign In
                  </ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.successIcon, { backgroundColor: '#34c759' + '20' }]}>
                  <Ionicons name="checkmark-circle" size={60} color="#34c759" />
                </View>
                
                <ThemedText style={styles.successTitle}>
                  Check Your Email
                </ThemedText>
                
                <ThemedText style={styles.successDescription}>
                  We&apos;ve sent a password reset link to:
                </ThemedText>
                
                <ThemedText style={styles.emailText}>
                  {email}
                </ThemedText>
                
                <ThemedText style={styles.successNote}>
                  Please check your inbox and follow the link to reset your password. The link will expire in 1 hour.
                </ThemedText>

                {/* Return to Sign In Button */}
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.tint }]}
                  onPress={handleBackToSignIn}
                  accessibilityRole="button"
                  accessibilityLabel="Return to sign in"
                >
                  <ThemedText style={styles.submitButtonText}>
                    Return to Sign In
                  </ThemedText>
                </TouchableOpacity>

                {/* Resend Link */}
                <TouchableOpacity
                  style={styles.resendLink}
                  onPress={() => {
                    setIsSubmitted(false);
                    setError('');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Try different email"
                >
                  <ThemedText style={[styles.resendLinkText, { color: colors.tabIconDefault }]}>
                    Try a different email
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16, // iOS standard margins
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44, // iOS minimum touch target
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // iOS standard content margins
  },
  title: {
    fontSize: 28, // iOS Title 1
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 17, // iOS Body
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24, // Better line height for iOS
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
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
  errorText: {
    color: '#ff3b30', // iOS system red
    fontSize: 13, // iOS Caption 1
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12, // iOS standard radius
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 50, // iOS minimum primary button height
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17, // iOS Headline
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44, // iOS minimum touch target
    justifyContent: 'center',
  },
  signInLinkText: {
    fontSize: 17, // iOS Headline
    fontWeight: '500',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28, // iOS Title 1
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 17, // iOS Body
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  emailText: {
    fontSize: 17, // iOS Headline
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  successNote: {
    fontSize: 15, // iOS Body
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22, // Better line height for iOS
    opacity: 0.7,
  },
  resendLink: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44, // iOS minimum touch target
    justifyContent: 'center',
  },
  resendLinkText: {
    fontSize: 15, // iOS Body
  },
});