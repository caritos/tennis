import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Checkbox from 'expo-checkbox';
import { ThemedText } from '../ThemedText';

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  terms?: string;
  general?: string;
}

interface TermsAgreementProps {
  agreedToTerms: boolean;
  errors: FormErrors;
  colors: any;
  onAgreedToTermsChange: (value: boolean) => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  onClearError: (field: keyof FormErrors) => void;
}

export default function TermsAgreement({
  agreedToTerms,
  errors,
  colors,
  onAgreedToTermsChange,
  onTermsPress,
  onPrivacyPress,
  onClearError,
}: TermsAgreementProps) {
  const handleTermsPress = () => {
    onTermsPress?.();
  };

  const handlePrivacyPress = () => {
    onPrivacyPress?.();
  };

  return (
    <View style={styles.termsSection}>
      <View style={styles.checkbox}>
        <Checkbox
          value={agreedToTerms}
          onValueChange={(value) => {
            console.log('🔘 CHECKBOX: Terms agreement checkbox pressed -', value ? 'checked' : 'unchecked');
            onAgreedToTermsChange(value);
            onClearError('terms');
          }}
          color={agreedToTerms ? colors.tint : undefined}
          style={styles.checkboxBox}
          accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
          testID="terms-checkbox"
        />
        <View style={styles.termsTextContainer}>
          <ThemedText style={[styles.termsText, { color: colors.text }]}>
            I agree to the{' '}
          </ThemedText>
          <TouchableOpacity 
            onPress={() => {
              console.log('🔘 BUTTON: Terms of Service link pressed');
              handleTermsPress();
            }}
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
            onPress={() => {
              console.log('🔘 BUTTON: Privacy Policy link pressed');
              handlePrivacyPress();
            }}
            testID="privacy-link"
          >
            <ThemedText style={[styles.termsLink, { color: colors.tint }]}>
              Privacy Policy
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
      {errors.terms && (
        <ThemedText style={styles.errorText} accessibilityRole="alert" testID="terms-error">
          {errors.terms}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  termsSection: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  termsText: {
    fontSize: 13,
  },
  termsLink: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 2,
  },
});