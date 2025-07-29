import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type DialogType = 'info' | 'warning' | 'error' | 'success' | 'question';

export interface ConfirmDialogProps {
  visible: boolean;
  type?: DialogType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'primary' | 'danger' | 'success';
  showCloseButton?: boolean;
  closeOnOverlayPress?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  type = 'question',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  showCloseButton = true,
  closeOnOverlayPress = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getTypeIcon = () => {
    switch (type) {
      case 'info':
        return 'information-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'alert-circle';
      case 'success':
        return 'checkmark-circle';
      case 'question':
        return 'help-circle';
      default:
        return 'help-circle';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'info':
        return '#2196F3';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      case 'success':
        return '#4CAF50';
      case 'question':
        return colors.tint;
      default:
        return colors.tint;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          backgroundColor: '#F44336',
          color: '#FFFFFF',
        };
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          color: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: colors.tint,
          color: '#FFFFFF',
        };
    }
  };

  const typeColor = getTypeColor();
  const confirmButtonStyles = getConfirmButtonStyles();

  const handleOverlayPress = () => {
    if (closeOnOverlayPress) {
      onCancel();
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent={true}
    >
      <TouchableOpacity style={styles.overlay} onPress={handleOverlayPress} activeOpacity={1}>
        <TouchableOpacity style={styles.dialogContainer} onPress={(e) => e.stopPropagation()} activeOpacity={1}>
          <View style={[styles.dialog, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: typeColor + '20' }]}>
                  <Ionicons 
                    name={getTypeIcon() as any} 
                    size={32} 
                    color={typeColor} 
                  />
                </View>
              </View>

              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onCancel}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons 
                    name="close" 
                    size={24} 
                    color={colors.tabIconDefault} 
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <ThemedText style={styles.title}>
                {title}
              </ThemedText>
              
              {message && (
                <ThemedText style={[styles.message, { color: colors.tabIconDefault }]}>
                  {message}
                </ThemedText>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: colors.tabIconDefault }]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.buttonText, { color: colors.tabIconDefault }]}>
                  {cancelText}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  { backgroundColor: confirmButtonStyles.backgroundColor }
                ]}
                onPress={onConfirm}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.buttonText, { color: confirmButtonStyles.color }]}>
                  {confirmText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// Convenience components for common dialog types
export const InfoDialog: React.FC<Omit<ConfirmDialogProps, 'type'>> = (props) => (
  <ConfirmDialog {...props} type="info" />
);

export const WarningDialog: React.FC<Omit<ConfirmDialogProps, 'type'>> = (props) => (
  <ConfirmDialog {...props} type="warning" />
);

export const ErrorDialog: React.FC<Omit<ConfirmDialogProps, 'type'>> = (props) => (
  <ConfirmDialog {...props} type="error" />
);

export const SuccessDialog: React.FC<Omit<ConfirmDialogProps, 'type'>> = (props) => (
  <ConfirmDialog {...props} type="success" />
);

export const DeleteConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'type' | 'confirmVariant' | 'confirmText'> & { confirmText?: string }> = (props) => (
  <ConfirmDialog 
    {...props} 
    type="warning" 
    confirmVariant="danger"
    confirmText={props.confirmText || 'Delete'}
  />
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
  },
  dialog: {
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  confirmButton: {
    // Background color set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});