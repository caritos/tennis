import React from 'react';
import { StyleSheet } from 'react-native';
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

interface ErrorDisplayProps {
  errors: FormErrors;
  colors: any;
}

const ErrorDisplay = React.memo(function ErrorDisplay({
  errors,
  colors,
}: ErrorDisplayProps) {
  if (!errors.general) {
    return null;
  }

  return (
    <ThemedText style={[styles.errorText, styles.generalError]} accessibilityRole="alert" testID="general-error">
      {errors.general}
    </ThemedText>
  );
});

export default ErrorDisplay;

const styles = StyleSheet.create({
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 2,
  },
  generalError: {
    marginBottom: 12,
    textAlign: 'center',
  },
});