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

interface EmailSignUpFormProps {
  onBack: () => void;
  onSubmit: (data: SignUpData) => Promise<void>;
  onSignInPress: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  isLoading?: boolean;
}

interface SignUpData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  terms?: string;
  general?: string;
}

export function EmailSignUpForm({ 
  onBack,
  onSubmit,
  onSignInPress,
  onTermsPress,
  onPrivacyPress,
  isLoading = false
}: EmailSignUpFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length >= 10;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (phone && !validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    if (validateForm()) {
      try {
        await onSubmit({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.replace(/\D/g, ''), // Remove formatting
        });
      } catch (error: any) {
        console.error('Sign up error:', error);
        if (error?.message?.includes('Network request failed')) {
          setErrors({ general: 'Unable to connect to the server. Please check your internet connection and try again.' });
        } else if (error?.message?.includes('already registered')) {
          setErrors({ general: 'This email is already registered. Please sign in instead.' });
        } else if (error?.message?.includes('Password should be')) {
          setErrors({ password: error.message });
        } else {
          setErrors({ general: error?.message || 'Failed to create account. Please try again.' });
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

  const handleTermsPress = () => {
    onTermsPress?.();
  };

  const handlePrivacyPress = () => {
    onPrivacyPress?.();
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
          Create Account
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
              </View>

              {/* Form Fields */}
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Full Name</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.background, 
                        color: colors.text,
                        borderColor: errors.fullName ? '#FF6B6B' : colors.tabIconDefault 
                      }
                    ]}
                    placeholder="John Smith"
                    placeholderTextColor={colors.tabIconDefault}
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      clearError('fullName');
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    accessibilityLabel="Full Name"
                  />
                  {errors.fullName && (
                    <ThemedText style={styles.errorText} accessibilityRole="alert">
                      {errors.fullName}
                    </ThemedText>
                  )}
                </View>

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
                    accessibilityLabel="Password"
                    testID="password-input"
                  />
                  {errors.password && (
                    <ThemedText style={styles.errorText} accessibilityRole="alert">
                      {errors.password}
                    </ThemedText>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Confirm Password</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.background, 
                        color: colors.text,
                        borderColor: errors.confirmPassword ? '#FF6B6B' : colors.tabIconDefault 
                      }
                    ]}
                    placeholder="••••••••••••"
                    placeholderTextColor={colors.tabIconDefault}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearError('confirmPassword');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Confirm Password"
                    testID="confirm-password-input"
                  />
                  {errors.confirmPassword && (
                    <ThemedText style={styles.errorText} accessibilityRole="alert">
                      {errors.confirmPassword}
                    </ThemedText>
                  )}
                </View>

                {/* Phone Number */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Phone Number (Optional)</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.background, 
                        color: colors.text,
                        borderColor: errors.phone ? '#FF6B6B' : colors.tabIconDefault 
                      }
                    ]}
                    placeholder="(555) 123-4567"
                    placeholderTextColor={colors.tabIconDefault}
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      clearError('phone');
                    }}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    accessibilityLabel="Phone Number (Optional)"
                  />
                  <ThemedText style={[styles.helpText, { color: colors.tabIconDefault }]}>
                    For match coordination and contact sharing
                  </ThemedText>
                  {errors.phone && (
                    <ThemedText style={styles.errorText} accessibilityRole="alert">
                      {errors.phone}
                    </ThemedText>
                  )}
                </View>

                {/* Terms Agreement */}
                <View style={styles.termsSection}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                      setAgreedToTerms(!agreedToTerms);
                      clearError('terms');
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: agreedToTerms }}
                    accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
                  >
                    <View style={[
                      styles.checkboxBox,
                      { borderColor: errors.terms ? '#FF6B6B' : colors.tabIconDefault }
                    ]}>
                      {agreedToTerms && (
                        <Ionicons name="checkmark" size={16} color={colors.tint} />
                      )}
                    </View>
                    <View style={styles.termsTextContainer}>
                      <ThemedText style={[styles.termsText, { color: colors.text }]}>
                        I agree to the{' '}
                      </ThemedText>
                      <TouchableOpacity 
                        onPress={handleTermsPress}
                        testID="terms-link"
                      >
                        <ThemedText style={[styles.termsLink, { color: colors.tint }]}>
                          Terms of Service
                        </ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={[styles.termsText, { color: colors.text }]}>
                        {' '}and{' '}
                      </ThemedText>
                      <TouchableOpacity 
                        onPress={handlePrivacyPress}
                        testID="privacy-link"
                      >
                        <ThemedText style={[styles.termsLink, { color: colors.tint }]}>
                          Privacy Policy
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  {errors.terms && (
                    <ThemedText style={styles.errorText} accessibilityRole="alert">
                      {errors.terms}
                    </ThemedText>
                  )}
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
                  accessibilityLabel="Create Account"
                  accessibilityState={{ disabled: isLoading }}
                >
                  <ThemedText style={styles.submitButtonText}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </ThemedText>
                </TouchableOpacity>

                {/* Sign In Link */}
                <View style={styles.signInSection}>
                  <ThemedText style={[styles.signInPrompt, { color: colors.tabIconDefault }]}>
                    Already have an account?{' '}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={onSignInPress}
                    accessibilityRole="button"
                    accessibilityLabel="Sign In"
                    accessibilityHint="Go to sign in screen"
                  >
                    <ThemedText style={[styles.signInLink, { color: colors.tint }]}>
                      Sign In
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 50,
  },
  content: {
    width: '100%',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  helpText: {
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 4,
  },
  termsSection: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  termsText: {
    fontSize: 14,
  },
  termsLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  generalError: {
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  signInSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signInPrompt: {
    fontSize: 16,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});