import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  isCurrentlyBlocked: boolean;
  onBlockUser: (userId: string) => Promise<void>;
  onUnblockUser: (userId: string) => Promise<void>;
}

export function BlockUserModal({
  visible,
  onClose,
  targetUserId,
  targetUserName,
  isCurrentlyBlocked,
  onBlockUser,
  onUnblockUser
}: BlockUserModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBlockAction = async () => {
    const actionText = isCurrentlyBlocked ? 'unblock' : 'block';
    const actionVerb = isCurrentlyBlocked ? 'Unblock' : 'Block';
    
    Alert.alert(
      `${actionVerb} ${targetUserName}?`,
      isCurrentlyBlocked 
        ? `This will allow ${targetUserName} to interact with you again, send challenges, and see your activity.`
        : `This will prevent ${targetUserName} from sending you challenges, viewing your profile, or interacting with you in any way.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: actionVerb,
          style: isCurrentlyBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              
              if (isCurrentlyBlocked) {
                await onUnblockUser(targetUserId);
              } else {
                await onBlockUser(targetUserId);
              }

              Alert.alert(
                `User ${actionVerb}ed`,
                `${targetUserName} has been ${actionText}ed successfully.`,
                [{ text: 'OK', onPress: onClose }]
              );
            } catch {
              Alert.alert(
                'Error',
                `Failed to ${actionText} user. Please try again later.`
              );
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {isCurrentlyBlocked ? 'Unblock User' : 'Block User'}
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.userInfo}>
              <Ionicons 
                name={isCurrentlyBlocked ? "checkmark-circle" : "ban"} 
                size={48} 
                color={isCurrentlyBlocked ? colors.tint : '#FF6B35'} 
              />
              <ThemedText type="subtitle" style={styles.userName}>
                {targetUserName}
              </ThemedText>
            </View>

            <ThemedText style={[styles.description, { color: colors.tabIconDefault }]}>
              {isCurrentlyBlocked ? (
                <>
                  <ThemedText style={styles.bold}>{targetUserName}</ThemedText> is currently blocked. 
                  Unblocking will allow them to:
                  {'\n\n'}• Send you match challenges and invitations
                  {'\n'}• View your profile and tennis statistics  
                  {'\n'}• See your activity in shared tennis clubs
                  {'\n'}• Interact with you in club discussions
                </>
              ) : (
                <>
                  Blocking <ThemedText style={styles.bold}>{targetUserName}</ThemedText> will prevent them from:
                  {'\n\n'}• Sending you match challenges or invitations
                  {'\n'}• Viewing your profile and tennis statistics
                  {'\n'}• Seeing your activity in tennis clubs
                  {'\n'}• Contacting you through the app
                  {'\n\n'}You can unblock them at any time from your profile settings.
                </>
              )}
            </ThemedText>

            {!isCurrentlyBlocked && (
              <View style={[styles.reportHint, { backgroundColor: colors.tint + '10' }]}>
                <Ionicons name="information-circle" size={20} color={colors.tint} />
                <ThemedText style={[styles.reportHintText, { color: colors.tint }]}>
                  If this user is violating community guidelines, consider reporting them as well.
                </ThemedText>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.tabIconDefault }]}
              onPress={onClose}
              disabled={isProcessing}
            >
              <ThemedText style={[styles.buttonText, { color: colors.tabIconDefault }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.actionButton,
                {
                  backgroundColor: isCurrentlyBlocked ? colors.tint : '#FF6B35',
                  opacity: isProcessing ? 0.6 : 1
                }
              ]}
              onPress={handleBlockAction}
              disabled={isProcessing}
            >
              <ThemedText style={styles.actionButtonText}>
                {isProcessing 
                  ? 'Processing...' 
                  : isCurrentlyBlocked 
                    ? 'Unblock User' 
                    : 'Block User'
                }
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '600',
  },
  reportHint: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  reportHintText: {
    fontSize: 14,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  actionButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});