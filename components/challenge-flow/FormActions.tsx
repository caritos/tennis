import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

interface FormActionsProps {
  matchType: 'singles' | 'doubles';
  canSubmit: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  colors: any;
}

export default function FormActions({
  matchType,
  canSubmit,
  isSubmitting,
  onCancel,
  onSubmit,
  colors,
}: FormActionsProps) {
  const getSubmitButtonText = () => {
    if (matchType === 'singles') {
      return 'Send Challenge';
    }
    return 'Send Invites';
  };

  return (
    <View style={[styles.footer, { borderTopColor: colors.tabIconDefault + '30' }]}>
      <TouchableOpacity
        style={[styles.cancelButton, { borderColor: colors.tabIconDefault }]}
        onPress={onCancel}
        disabled={isSubmitting}
      >
        <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
          Cancel
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.tint },
          (!canSubmit || isSubmitting) && { opacity: 0.6 }
        ]}
        onPress={onSubmit}
        disabled={!canSubmit || isSubmitting}
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
}

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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});