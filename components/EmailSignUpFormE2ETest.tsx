import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Button
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useE2ETextInput } from '@/hooks/useE2ETextInput';

interface EmailSignUpFormE2ETestProps {
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

/**
 * Enhanced EmailSignUpForm with improved E2E testing support
 * This version uses custom hooks to better handle TextInput onChangeText events
 */
export function EmailSignUpFormE2ETest({ 
  onBack,
  onSubmit,
  onSignInPress,
  onTermsPress,
  onPrivacyPress,
  isLoading = false
}: EmailSignUpFormE2ETestProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Enhanced E2E detection - triggers on multiple conditions
  const isE2EMode = agreedToTerms; // Simpler trigger condition

  // Enhanced TextInput hooks with E2E support
  const fullNameInput = useE2ETextInput({
    e2eTestId: 'full-name-input',
    e2eAutoFillTrigger: isE2EMode,
    e2eDefaultValue: 'E2E Test User'
  });

  const emailInput = useE2ETextInput({
    e2eTestId: 'email-input',
    e2eAutoFillTrigger: isE2EMode,
    e2eDefaultValue: 'e2etest@example.com'
  });

  const passwordInput = useE2ETextInput({
    e2eTestId: 'password-input',
    e2eAutoFillTrigger: isE2EMode,
    e2eDefaultValue: 'TestAuth123!'
  });

  const phoneInput = useE2ETextInput({
    e2eTestId: 'phone-input',
    e2eAutoFillTrigger: isE2EMode,
    e2eDefaultValue: '5551234567'
  });

  // Enhanced E2E auto-submit mechanism
  React.useEffect(() => {
    if (isE2EMode && 
        fullNameInput.value && 
        emailInput.value && 
        passwordInput.value && 
        confirmPassword &&
        agreedToTerms) {
      console.log('🤖 ENHANCED E2E MODE: Auto-submitting form...');
      setTimeout(() => {
        handleSubmit();
      }, 1000); // Give time for all inputs to settle
    }
  }, [isE2EMode, fullNameInput.value, emailInput.value, passwordInput.value, confirmPassword, agreedToTerms]);

  // Auto-fill confirm password when password changes in E2E mode
  React.useEffect(() => {
    if (isE2EMode && passwordInput.value && !confirmPassword) {
      console.log('🤖 E2E: Auto-filling confirm password');
      setConfirmPassword(passwordInput.value);
    }
  }, [isE2EMode, passwordInput.value, confirmPassword]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullNameInput.value.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!emailInput.value.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!passwordInput.value) {
      newErrors.password = 'Password is required';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordInput.value !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('🔘 ENHANCED FORM: Submit button pressed');
    if (isLoading) return;

    if (validateForm()) {
      console.log('📋 ENHANCED FORM DATA:', {
        fullName: fullNameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        phone: phoneInput.value,
        isE2EMode
      });

      try {
        await onSubmit({
          fullName: fullNameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value,
          phone: phoneInput.value.replace(/\D/g, ''),
        });
      } catch (error: any) {
        setErrors({ general: error?.message || 'Failed to create account. Please try again.' });
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <ThemedText type="title" style={styles.headerTitle}>
          Enhanced E2E Test Form
        </ThemedText>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* E2E Status Indicator */}
          {isE2EMode && (
            <View style={styles.e2eIndicator}>
              <ThemedText style={styles.e2eText}>🤖 E2E Mode Active</ThemedText>
            </View>
          )}

          {/* Form Fields with Enhanced TextInputs */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              ref={fullNameInput.ref}
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="John Smith"
              placeholderTextColor={colors.tabIconDefault}
              value={fullNameInput.value}
              onChangeText={(text) => {
                fullNameInput.onChangeText(text);
                clearError('fullName');
              }}
              onFocus={fullNameInput.onFocus}
              onBlur={fullNameInput.onBlur}
              testID="full-name-input"
            />
            {errors.fullName && (
              <ThemedText style={styles.errorText}>{errors.fullName}</ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email Address</ThemedText>
            <TextInput
              ref={emailInput.ref}
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="john@example.com"
              placeholderTextColor={colors.tabIconDefault}
              value={emailInput.value}
              onChangeText={(text) => {
                emailInput.onChangeText(text);
                clearError('email');
              }}
              onFocus={emailInput.onFocus}
              onBlur={emailInput.onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="email-input"
            />
            {errors.email && (
              <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              ref={passwordInput.ref}
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="••••••••••••"
              placeholderTextColor={colors.tabIconDefault}
              value={passwordInput.value}
              onChangeText={(text) => {
                passwordInput.onChangeText(text);
                clearError('password');
              }}
              onFocus={passwordInput.onFocus}
              onBlur={passwordInput.onBlur}
              secureTextEntry
              testID="password-input"
            />
            {errors.password && (
              <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="••••••••••••"
              placeholderTextColor={colors.tabIconDefault}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError('confirmPassword');
              }}
              secureTextEntry
              testID="confirm-password-input"
            />
            {errors.confirmPassword && (
              <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Phone Number (Optional)</ThemedText>
            <TextInput
              ref={phoneInput.ref}
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.tabIconDefault}
              value={phoneInput.value}
              onChangeText={(text) => {
                phoneInput.onChangeText(text);
                clearError('phone');
              }}
              onFocus={phoneInput.onFocus}
              onBlur={phoneInput.onBlur}
              keyboardType="phone-pad"
              testID="phone-input"
            />
          </View>

          {/* Terms Agreement */}
          <View style={styles.termsSection}>
            <View style={styles.checkbox}>
              <Checkbox
                value={agreedToTerms}
                onValueChange={(value) => {
                  console.log('🔘 ENHANCED CHECKBOX: Terms agreement -', value ? 'checked' : 'unchecked');
                  setAgreedToTerms(value);
                  clearError('terms');
                }}
                color={agreedToTerms ? colors.tint : undefined}
                testID="terms-checkbox"
              />
              <ThemedText style={styles.termsText}>
                I agree to the Terms of Service and Privacy Policy
              </ThemedText>
            </View>
            {errors.terms && (
              <ThemedText style={styles.errorText}>{errors.terms}</ThemedText>
            )}
          </View>

          {/* General Error */}
          {errors.general && (
            <ThemedText style={[styles.errorText, styles.generalError]}>
              {errors.general}
            </ThemedText>
          )}

          {/* Submit Button */}
          <View style={styles.nativeButtonWrapper}>
            <Button
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleSubmit}
              disabled={isLoading}
              color={colors.tint}
              testID="create-account-button"
            />
          </View>

          {/* Debug Information */}
          {isE2EMode && (
            <View style={styles.debugInfo}>
              <ThemedText style={styles.debugTitle}>🔍 Debug Info:</ThemedText>
              <ThemedText style={styles.debugText}>Full Name: {fullNameInput.value}</ThemedText>
              <ThemedText style={styles.debugText}>Email: {emailInput.value}</ThemedText>
              <ThemedText style={styles.debugText}>Password: {passwordInput.value ? '***' : 'empty'}</ThemedText>
              <ThemedText style={styles.debugText}>Phone: {phoneInput.value}</ThemedText>
              <ThemedText style={styles.debugText}>Terms: {agreedToTerms ? 'agreed' : 'not agreed'}</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 24, paddingBottom: 50 },
  content: { width: '100%' },
  e2eIndicator: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  e2eText: { color: '#2e7d32', textAlign: 'center', fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 14, marginTop: 4 },
  termsSection: { marginBottom: 24 },
  checkbox: { flexDirection: 'row', alignItems: 'center' },
  termsText: { marginLeft: 12, fontSize: 14 },
  generalError: { marginBottom: 16, textAlign: 'center' },
  nativeButtonWrapper: { marginVertical: 20, marginHorizontal: 40 },
  debugInfo: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  debugTitle: { fontWeight: '600', marginBottom: 8 },
  debugText: { fontSize: 12, marginBottom: 4 },
});