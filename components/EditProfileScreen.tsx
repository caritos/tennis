import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { initializeDatabase } from '@/database/database';
import { CompactStyles } from '@/constants/CompactStyles';

export interface ProfileData {
  full_name: string; // Read-only field, kept for compatibility with existing save function
  phone: string;
  profile_photo_uri?: string;
}

interface EditProfileScreenProps {
  onBack: () => void;
  onSave: (data: ProfileData) => Promise<void>;
  initialData?: ProfileData;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  onBack,
  onSave,
  initialData,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { showSuccess, showError, showNotification } = useNotification();

  const [phone, setPhone] = useState(initialData?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasShownNotification, setHasShownNotification] = useState(false);

  // Show privacy notification when component mounts (only once per user)
  useEffect(() => {
    const checkAndShowPrivacyNotification = async () => {
      if (!user?.id || hasShownNotification) {
        console.log('Skipping privacy notification - user ID:', !!user?.id, 'hasShownNotification:', hasShownNotification);
        return;
      }

      try {
        const userKey = `${user.id}_hasSeenEditProfilePrivacyNotice`;
        const hasSeenPrivacyNotice = await AsyncStorage.getItem(userKey);
        console.log('Privacy notice check - userKey:', userKey, 'hasSeenPrivacyNotice:', hasSeenPrivacyNotice);
        
        if (!hasSeenPrivacyNotice) {
          console.log('Showing privacy notification for first time');
          setHasShownNotification(true);
          
          showNotification(
            'info',
            'Your profile is completely private',
            'Only you can view your profile information.',
            {
              duration: 0, // Permanent until dismissed
              customIcon: 'tennis-info',
              onDismiss: async () => {
                console.log('Privacy notification dismissed, setting flag for user:', user.id);
                try {
                  await AsyncStorage.setItem(userKey, 'true');
                  console.log('Privacy notice flag set successfully');
                  
                  // Verify it was set
                  const verification = await AsyncStorage.getItem(userKey);
                  console.log('Verification check - value now:', verification);
                } catch (error) {
                  console.error('Failed to set privacy notice flag:', error);
                }
              }
            }
          );
        } else {
          console.log('Privacy notification already seen, not showing');
        }
      } catch (error) {
        console.error('Failed to check privacy notice status:', error);
      }
    };

    checkAndShowPrivacyNotification();
  }, [user?.id, hasShownNotification]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (text: string): string => {
    // Basic phone number formatting for US numbers
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    return text;
  };


  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const profileData: ProfileData = {
        full_name: initialData?.full_name || '',
        phone: phone.trim(),
      };

      await onSave(profileData);
      showSuccess('Profile Updated', 'Your profile has been updated successfully');
      onBack();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showError('Update Failed', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
            <View style={styles.headerSpacer} />
          </View>

          {/* Profile Form */}
          <View style={styles.formSection}>
            {/* Full Name (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
              <View style={[styles.readOnlyField, { backgroundColor: colors.tabIconDefault + '20' }]}>
                <Text style={[styles.readOnlyText, { color: colors.text }]}>
                  {initialData?.full_name || 'No name provided'}
                </Text>
              </View>
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <View style={[styles.readOnlyField, { backgroundColor: colors.tabIconDefault + '20' }]}>
                <Text style={[styles.readOnlyText, { color: colors.text }]}>
                  {user?.email || 'No email'}
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.phone ? '#FF3B30' : colors.tabIconDefault,
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                ]}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) {
                    setErrors({ ...errors, phone: '' });
                  }
                }}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
              <Text style={[styles.helperText, { color: colors.tabIconDefault }]}>
                Your phone number will only be shared after match confirmations.
              </Text>
            </View>

          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.tint,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: CompactStyles.scrollContent.paddingBottom,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CompactStyles.header.paddingHorizontal,
    paddingVertical: CompactStyles.header.paddingVertical,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: CompactStyles.link.fontSize,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60, // Same width as back button for centering
  },
  formSection: {
    paddingHorizontal: CompactStyles.scrollContent.paddingHorizontal,
    marginTop: CompactStyles.itemMargin,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: CompactStyles.itemMargin,
  },
  sectionSubtitle: {
    fontSize: CompactStyles.subtitle.fontSize,
    marginBottom: CompactStyles.itemMargin,
  },
  inputGroup: {
    marginBottom: CompactStyles.inputGroup.marginBottom,
  },
  inputLabel: {
    fontSize: CompactStyles.label.fontSize,
    fontWeight: '500',
    marginBottom: CompactStyles.label.marginBottom,
  },
  input: {
    borderWidth: 1,
    borderRadius: CompactStyles.input.borderRadius,
    paddingHorizontal: CompactStyles.input.paddingHorizontal,
    paddingVertical: CompactStyles.input.paddingVertical,
    fontSize: CompactStyles.input.fontSize,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: CompactStyles.errorText.fontSize,
    marginTop: CompactStyles.errorText.marginTop,
  },
  helperText: {
    fontSize: CompactStyles.helpText.fontSize,
    marginTop: CompactStyles.helpText.marginTop,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CompactStyles.input.paddingHorizontal,
    paddingVertical: CompactStyles.input.paddingVertical,
    borderRadius: CompactStyles.input.borderRadius,
  },
  readOnlyText: {
    fontSize: CompactStyles.input.fontSize,
  },
  preferenceOptions: {
    gap: 12,
  },
  preferenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: CompactStyles.input.paddingVertical + 4,
    borderRadius: CompactStyles.input.borderRadius,
    borderWidth: 1,
    gap: CompactStyles.smallMargin,
  },
  preferenceLabel: {
    fontSize: CompactStyles.input.fontSize,
    flex: 1,
  },
  checkmark: {
    marginLeft: 'auto',
  },
  skillOptions: {
    gap: 8,
  },
  skillOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: CompactStyles.input.paddingVertical + 2,
    borderRadius: CompactStyles.input.borderRadius,
    borderWidth: 1,
    gap: CompactStyles.smallMargin,
  },
  skillContent: {
    flex: 1,
  },
  skillLabel: {
    fontSize: CompactStyles.input.fontSize,
    marginBottom: 2,
  },
  skillDescription: {
    fontSize: CompactStyles.helpText.fontSize,
  },
  styleOptions: {
    gap: 8,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: CompactStyles.input.paddingVertical + 2,
    borderRadius: CompactStyles.input.borderRadius,
    borderWidth: 1,
    gap: CompactStyles.smallMargin,
  },
  styleLabel: {
    fontSize: CompactStyles.input.fontSize,
    flex: 1,
  },
  privacyOptions: {
    gap: 8,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: CompactStyles.input.paddingVertical + 2,
    borderRadius: CompactStyles.input.borderRadius,
    borderWidth: 1,
    gap: CompactStyles.smallMargin,
  },
  privacyContent: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: CompactStyles.input.fontSize,
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: CompactStyles.helpText.fontSize,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: CompactStyles.link.fontSize,
    fontWeight: '500',
  },
  
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    gap: 12,
  },
  privacyNoticeText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  
  buttonContainer: {
    paddingHorizontal: CompactStyles.scrollContent.paddingHorizontal,
    paddingTop: CompactStyles.sectionMargin,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: CompactStyles.button.paddingVertical,
    borderRadius: CompactStyles.button.borderRadius,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: CompactStyles.buttonText.fontSize,
    fontWeight: '600',
  },
  saveButton: {
    width: '100%',
    paddingVertical: CompactStyles.button.paddingVertical,
    borderRadius: CompactStyles.button.borderRadius,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: CompactStyles.buttonText.fontSize,
    fontWeight: '600',
  },
});