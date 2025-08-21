import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

interface FormActionsProps {
  onSave: () => void;
  onCancel?: () => void;
  saveButtonTitle?: string;
  saveButtonColor: string;
  isEditing?: boolean;
}

const FormActions = React.memo(function FormActions({
  onSave,
  onCancel,
  saveButtonTitle = 'Save Match',
  saveButtonColor,
  isEditing = false,
}: FormActionsProps) {
  return (
    <View style={styles.buttonContainer}>
      {onCancel && (
        <View style={styles.buttonSpacing}>
          <Button
            title="Cancel"
            onPress={onCancel}
            color="#666666"
          />
        </View>
      )}
      <Button
        title={isEditing ? 'Update Match' : saveButtonTitle}
        onPress={onSave}
        color={saveButtonColor}
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