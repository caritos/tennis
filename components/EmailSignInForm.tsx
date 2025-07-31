import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface EmailSignInFormProps {
  onBack: () => void;
  onSubmit: (data: SignInData) => Promise<void>;
  onSignUpPress: () => void;
  onForgotPasswordPress?: () => void;
  isLoading?: boolean;
}

interface SignInData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function EmailSignInForm({ 
  onBack,
  onSubmit,
  onSignUpPress,
  onForgotPasswordPress,
  isLoading = false
}: EmailSignInFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    if (validateForm()) {
      try {
        await onSubmit({
          email: email.trim(),
          password,
        });
      } catch (error: any) {
        console.error('Sign in error:', error);
        if (error?.message?.includes('Network request failed')) {
          setErrors({ general: 'Unable to connect to the server. Please check your internet connection and try again.' });
        } else if (error?.message?.includes('Invalid login credentials')) {
          setErrors({ general: 'Invalid email or password. Please try again.' });
        } else if (error?.message?.includes('Email not confirmed')) {
          setErrors({ general: 'Please check your email to confirm your account.' });
        } else {
          setErrors({ general: error?.message || 'An error occurred. Please try again.' });
        }
      }
    }
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleForgotPasswordPress = () => {
    onForgotPasswordPress?.();
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint="Go back to the previous screen"
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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
      >
        <View style={styles.content}>
          {/* App Title */}
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.appTitle}>
              🎾 Tennis Club
            </ThemedText>
            <ThemedText type="default" style={[styles.subtitle, { color: colors.tabIconDefault }]}>
              Welcome back!
            </ThemedText>
          </View>

          {/* Form Fields */}
          {/* Email */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email Address</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: errors.email ? '#FF6B6B' : colors.tabIconDefault 
                }
              ]}
              placeholder="john@example.com"
              placeholderTextColor={colors.tabIconDefault}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email Address"
              testID="email-input"
            />
            {errors.email && (
              <ThemedText style={styles.errorText} accessibilityRole="alert">
                {errors.email}
              </ThemedText>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: errors.password ? '#FF6B6B' : colors.tabIconDefault 
                }
              ]}
              placeholder="••••••••••••"
              placeholderTextColor={colors.tabIconDefault}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError('password');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              passwordRules=""
              keyboardType="default"
              spellCheck={false}
              accessibilityLabel="Password"
              testID="password-input"
            />
            {errors.password && (
              <ThemedText style={styles.errorText} accessibilityRole="alert">
                {errors.password}
              </ThemedText>
            )}
          </View>

          {/* Forgot Password Link */}
          <View style={styles.forgotPasswordSection}>
            <TouchableOpacity
              onPress={handleForgotPasswordPress}
              accessibilityRole="button"
              accessibilityLabel="Forgot Password"
              accessibilityHint="Reset your password"
            >
              <ThemedText style={[styles.forgotPasswordLink, { color: colors.tint }]}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* General Error */}
          {errors.general && (
            <ThemedText style={[styles.errorText, styles.generalError]} accessibilityRole="alert">
              {errors.general}
            </ThemedText>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: isLoading ? colors.tabIconDefault : colors.tint,
                opacity: isLoading ? 0.7 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            accessibilityState={{ disabled: isLoading }}
          >
            <ThemedText style={styles.submitButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </ThemedText>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpSection}>
            <ThemedText style={[styles.signUpPrompt, { color: colors.tabIconDefault }]}>
              Don&apos;t have an account?{' '}
            </ThemedText>
            <TouchableOpacity
              onPress={onSignUpPress}
              accessibilityRole="button"
              accessibilityLabel="Sign Up"
              accessibilityHint="Go to sign up screen"
            >
              <ThemedText style={[styles.signUpLink, { color: colors.tint }]}>
                Sign Up
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  content: {
    width: '100%',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 2,
  },
  forgotPasswordSection: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordLink: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  generalError: {
    marginBottom: 12,
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  signUpPrompt: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});