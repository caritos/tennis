import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

interface FormActionsProps {
  matchType: 'singles' | 'doubles';
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  colors: any;
}

const FormActions = React.memo(function FormActions({
  matchType,
  canSubmit,
  isSubmitting,
  onSubmit,
  colors,
}: FormActionsProps) {
  const getSubmitButtonText = () => {
    return 'Send Challenge';
  };

  return (
    <View style={[styles.footer, { borderTopColor: colors.tabIconDefault + '30' }]}>
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.tint },
          (!canSubmit || isSubmitting) && { opacity: 0.6 }
        ]}
        onPress={onSubmit}
        disabled={!canSubmit || isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={isSubmitting ? "Sending challenge" : getSubmitButtonText()}
        accessibilityState={{ disabled: !canSubmit || isSubmitting }}
      >
        {isSubmitting ? (
          <View style={styles.submitButtonContent}>
            <ActivityIndicator size="small" color="white" />
            <ThemedText style={styles.submitButtonText}>Sending...</ThemedText>
          </View>
        ) : (
          <ThemedText style={styles.submitButtonText}>
            {getSubmitButtonText()}
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
});

export default FormActions;

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 50,
    // iOS-style shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});