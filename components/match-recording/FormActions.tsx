import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../ui/Button';

interface FormActionsProps {
  onSave: () => void;
  onCancel?: () => void;
  saveButtonTitle?: string;
  isEditing?: boolean;
}

const FormActions = React.memo(function FormActions({
  onSave,
  onCancel,
  saveButtonTitle = 'Save Match',
  isEditing = false,
}: FormActionsProps) {
  return (
    <View style={styles.buttonContainer}>
      {onCancel && (
        <View style={styles.buttonSpacing}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            fullWidth={true}
          />
        </View>
      )}
      <Button
        title={isEditing ? 'Update Match' : saveButtonTitle}
        onPress={onSave}
        variant="primary"
        fullWidth={true}
        testID="save-match-button"
      />
    </View>
  );
});

export default FormActions;

const styles = StyleSheet.create({
  buttonContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  buttonSpacing: {
    marginBottom: 8,
  },
});