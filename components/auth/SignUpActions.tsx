import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

interface SignUpActionsProps {
  isLoading: boolean;
  colors: any;
  onSubmit: () => void;
  onSignInPress: () => void;
}

const SignUpActions = React.memo(function SignUpActions({
  isLoading,
  colors,
  onSubmit,
  onSignInPress,
}: SignUpActionsProps) {
  return (
    <>
      {/* Submit Button */}
      <View style={styles.submitButtonContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: isLoading ? colors.tabIconDefault : colors.tint },
            isLoading && styles.submitButtonDisabled
          ]}
          onPress={() => {
            console.log('🔘 BUTTON: Create Account pressed!');
            onSubmit();
          }}
          disabled={isLoading}
          testID="create-account-button"
          activeOpacity={0.8}
        >
          <ThemedText style={styles.submitButtonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Sign In Link */}
      <View style={styles.signInSection}>
        <ThemedText style={[styles.signInPrompt, { color: colors.tabIconDefault }]}>
          Already have an account?{' '}
        </ThemedText>
        <TouchableOpacity
          onPress={() => {
            console.log('🔘 BUTTON: Sign In link pressed');
            onSignInPress();
          }}
          accessibilityRole="button"
          accessibilityLabel="Sign In"
          accessibilityHint="Go to sign in screen"
        >
          <ThemedText style={[styles.signInLink, { color: colors.tint }]}>
            Sign In
          </ThemedText>
        </TouchableOpacity>
      </View>
    </>
  );
});

export default SignUpActions;

const styles = StyleSheet.create({
  submitButtonContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  submitButtonDisabled: {
    opacity: 0.8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  signInPrompt: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});