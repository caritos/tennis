import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

interface FormActionsProps {
  matchType: 'singles' | 'doubles';
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel?: () => void; // Optional cancel button
  submitButtonText?: string; // Custom submit button text
  submittingText?: string; // Custom submitting text
  colors: any;
}

const FormActions = React.memo(function FormActions({
  matchType,
  canSubmit,
  isSubmitting,
  onSubmit,
  onCancel,
  submitButtonText = 'Send Challenge',
  submittingText = 'Sending...',
  colors,
}: FormActionsProps) {

  return (
    <View style={[styles.footer, { borderTopColor: colors.tabIconDefault + '30' }]}>
      {onCancel && (
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.tabIconDefault }]}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
            Cancel
          </ThemedText>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={[
          styles.submitButton,
          onCancel ? styles.submitButtonWithCancel : styles.submitButtonFullWidth,
          { backgroundColor: colors.tint },
          (!canSubmit || isSubmitting) && { opacity: 0.6 }
        ]}
        onPress={onSubmit}
        disabled={!canSubmit || isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={isSubmitting ? submittingText : submitButtonText}
        accessibilityState={{ disabled: !canSubmit || isSubmitting }}
      >
        {isSubmitting ? (
          <View style={styles.submitButtonContent}>
            <ActivityIndicator size="small" color="white" />
            <ThemedText style={styles.submitButtonText}>{submittingText}</ThemedText>
          </View>
        ) : (
          <ThemedText style={styles.submitButtonText}>
            {submitButtonText}
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
});

export default FormActions;

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
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
  submitButtonFullWidth: {
    width: '100%',
  },
  submitButtonWithCancel: {
    flex: 1,
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