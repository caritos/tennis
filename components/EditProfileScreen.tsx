import React, { useState } from 'react';
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
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { initializeDatabase } from '@/database/database';

export interface ProfileData {
  full_name: string;
  phone: string;
  contact_preference: 'whatsapp' | 'phone' | 'text';
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  playing_style?: 'aggressive' | 'defensive' | 'all_court' | 'serve_volley';
  availability?: string; // JSON string for availability preferences
  profile_visibility?: 'public' | 'clubs_only' | 'private';
  match_history_visibility?: 'public' | 'clubs_only' | 'private';
  allow_challenges?: 'everyone' | 'club_members' | 'none';
  notification_preferences?: string; // JSON string for notification settings
  profile_photo_uri?: string; // Local file URI for profile photo
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
  const { showSuccess, showError } = useNotification();

  const [fullName, setFullName] = useState(initialData?.full_name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [contactPreference, setContactPreference] = useState<'whatsapp' | 'phone' | 'text'>(
    initialData?.contact_preference || 'whatsapp'
  );
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'pro' | ''>(
    initialData?.skill_level || ''
  );
  const [playingStyle, setPlayingStyle] = useState<'aggressive' | 'defensive' | 'all_court' | 'serve_volley' | ''>(
    initialData?.playing_style || ''
  );
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'clubs_only' | 'private'>(
    initialData?.profile_visibility || 'public'
  );
  const [matchHistoryVisibility, setMatchHistoryVisibility] = useState<'public' | 'clubs_only' | 'private'>(
    initialData?.match_history_visibility || 'public'
  );
  const [allowChallenges, setAllowChallenges] = useState<'everyone' | 'club_members' | 'none'>(
    initialData?.allow_challenges || 'everyone'
  );
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(
    initialData?.profile_photo_uri || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

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

  const requestMediaLibraryPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload profile photos!',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take profile photos!',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const saveImageToLocalDirectory = async (imageUri: string): Promise<string> => {
    try {
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `profile_${user?.id}_${Date.now()}.${fileExtension}`;
      const localUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: imageUri,
        to: localUri
      });
      
      return localUri;
    } catch (error) {
      console.error('Failed to save image locally:', error);
      throw new Error('Failed to save image');
    }
  };

  const selectProfilePhoto = () => {
    Alert.alert(
      'Select Profile Photo',
      'Choose how you want to add your profile photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickPhoto },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    setIsUploadingPhoto(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = await saveImageToLocalDirectory(result.assets[0].uri);
        setProfilePhotoUri(localUri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showError('Camera Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const pickPhoto = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    setIsUploadingPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = await saveImageToLocalDirectory(result.assets[0].uri);
        setProfilePhotoUri(localUri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showError('Photo Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removeProfilePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setProfilePhotoUri(null)
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const profileData: ProfileData = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        contact_preference: contactPreference,
        skill_level: skillLevel || undefined,
        playing_style: playingStyle || undefined,
        profile_visibility: profileVisibility,
        match_history_visibility: matchHistoryVisibility,
        allow_challenges: allowChallenges,
        profile_photo_uri: profilePhotoUri || undefined,
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

  const renderContactPreferenceOption = (
    value: 'whatsapp' | 'phone' | 'text',
    label: string,
    icon: string
  ) => {
    const isSelected = contactPreference === value;
    return (
      <TouchableOpacity
        style={[
          styles.preferenceOption,
          {
            borderColor: isSelected ? colors.tint : colors.tabIconDefault,
            backgroundColor: isSelected ? colors.tint + '10' : 'transparent',
          },
        ]}
        onPress={() => setContactPreference(value)}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={isSelected ? colors.tint : colors.tabIconDefault}
        />
        <Text
          style={[
            styles.preferenceLabel,
            {
              color: isSelected ? colors.tint : colors.text,
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.tint}
            style={styles.checkmark}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderSkillLevelOption = (
    value: 'beginner' | 'intermediate' | 'advanced' | 'pro',
    label: string,
    description: string
  ) => {
    const isSelected = skillLevel === value;
    return (
      <TouchableOpacity
        style={[
          styles.skillOption,
          {
            borderColor: isSelected ? colors.tint : colors.tabIconDefault,
            backgroundColor: isSelected ? colors.tint + '10' : 'transparent',
          },
        ]}
        onPress={() => setSkillLevel(value)}
      >
        <View style={styles.skillContent}>
          <Text
            style={[
              styles.skillLabel,
              {
                color: isSelected ? colors.tint : colors.text,
                fontWeight: isSelected ? '600' : '500',
              },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.skillDescription,
              { color: colors.tabIconDefault },
            ]}
          >
            {description}
          </Text>
        </View>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.tint}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderPlayingStyleOption = (
    value: 'aggressive' | 'defensive' | 'all_court' | 'serve_volley',
    label: string,
    icon: string
  ) => {
    const isSelected = playingStyle === value;
    return (
      <TouchableOpacity
        style={[
          styles.styleOption,
          {
            borderColor: isSelected ? colors.tint : colors.tabIconDefault,
            backgroundColor: isSelected ? colors.tint + '10' : 'transparent',
          },
        ]}
        onPress={() => setPlayingStyle(value)}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={isSelected ? colors.tint : colors.tabIconDefault}
        />
        <Text
          style={[
            styles.styleLabel,
            {
              color: isSelected ? colors.tint : colors.text,
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.tint}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderPrivacyOption = (
    value: 'public' | 'clubs_only' | 'private',
    label: string,
    description: string,
    currentValue: string,
    setter: (value: 'public' | 'clubs_only' | 'private') => void
  ) => {
    const isSelected = currentValue === value;
    return (
      <TouchableOpacity
        style={[
          styles.privacyOption,
          {
            borderColor: isSelected ? colors.tint : colors.tabIconDefault,
            backgroundColor: isSelected ? colors.tint + '10' : 'transparent',
          },
        ]}
        onPress={() => setter(value)}
      >
        <View style={styles.privacyContent}>
          <Text
            style={[
              styles.privacyLabel,
              {
                color: isSelected ? colors.tint : colors.text,
                fontWeight: isSelected ? '600' : '500',
              },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.privacyDescription,
              { color: colors.tabIconDefault },
            ]}
          >
            {description}
          </Text>
        </View>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.tint}
          />
        )}
      </TouchableOpacity>
    );
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Photo</Text>
            
            {/* Profile Photo Upload */}
            <View style={styles.photoSection}>
              <View style={styles.photoContainer}>
                {profilePhotoUri ? (
                  <Image 
                    source={{ uri: profilePhotoUri }} 
                    style={styles.profilePhoto}
                    onError={() => {
                      console.warn('Failed to load profile photo');
                      setProfilePhotoUri(null);
                    }}
                  />
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: colors.tabIconDefault + '20' }]}>
                    <Ionicons 
                      name="person-outline" 
                      size={50} 
                      color={colors.tabIconDefault} 
                    />
                  </View>
                )}
                
                {/* Photo overlay with upload/remove buttons */}
                <View style={styles.photoOverlay}>
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <View style={styles.photoButtons}>
                      <TouchableOpacity
                        style={[styles.photoButton, { backgroundColor: colors.tint }]}
                        onPress={selectProfilePhoto}
                        disabled={isUploadingPhoto}
                      >
                        <Ionicons 
                          name={profilePhotoUri ? "camera" : "add"} 
                          size={16} 
                          color="white" 
                        />
                      </TouchableOpacity>
                      
                      {profilePhotoUri && (
                        <TouchableOpacity
                          style={[styles.photoButton, { backgroundColor: '#FF3B30' }]}
                          onPress={removeProfilePhoto}
                          disabled={isUploadingPhoto}
                        >
                          <Ionicons name="trash" size={16} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
              
              <Text style={[styles.photoHelper, { color: colors.tabIconDefault }]}>
                {profilePhotoUri ? 'Tap camera to change photo' : 'Add a profile photo to help others recognize you'}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>Basic Information</Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.fullName ? '#FF3B30' : colors.tabIconDefault,
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                ]}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) {
                    setErrors({ ...errors, fullName: '' });
                  }
                }}
                placeholder="Enter your full name"
                placeholderTextColor={colors.tabIconDefault}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* Contact Information */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
              Contact Information
            </Text>

            {/* Email (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <View style={[styles.readOnlyField, { backgroundColor: colors.tabIconDefault + '20' }]}>
                <Text style={[styles.readOnlyText, { color: colors.text }]}>
                  {user?.email || 'No email'}
                </Text>
                <View style={[styles.verifiedBadge, { backgroundColor: colors.tint + '20' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.tint} />
                  <Text style={[styles.verifiedText, { color: colors.tint }]}>Verified</Text>
                </View>
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
                Your phone number will only be shared after match confirmations
              </Text>
            </View>

            {/* Contact Preference */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
              Preferred Contact Method
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.tabIconDefault }]}>
              How should other players contact you after matches?
            </Text>

            <View style={styles.preferenceOptions}>
              {renderContactPreferenceOption('whatsapp', 'WhatsApp', 'logo-whatsapp')}
              {renderContactPreferenceOption('phone', 'Phone Call', 'call-outline')}
              {renderContactPreferenceOption('text', 'Text Message', 'chatbubble-outline')}
            </View>

            {/* Tennis Information */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>
              Tennis Information
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.tabIconDefault }]}>
              Help other players understand your tennis background
            </Text>

            {/* Skill Level */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 16, marginBottom: 12 }]}>
              Skill Level (Optional)
            </Text>
            <View style={styles.skillOptions}>
              {renderSkillLevelOption('beginner', 'Beginner', 'Learning the basics, casual play')}
              {renderSkillLevelOption('intermediate', 'Intermediate', 'Regular player, some experience')}
              {renderSkillLevelOption('advanced', 'Advanced', 'Competitive player, strong skills')}
              {renderSkillLevelOption('pro', 'Professional', 'Tournament level, teaching pro')}
            </View>
            {skillLevel && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSkillLevel('')}
              >
                <Text style={[styles.clearButtonText, { color: colors.tabIconDefault }]}>
                  Clear Selection
                </Text>
              </TouchableOpacity>
            )}

            {/* Playing Style */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 20, marginBottom: 12 }]}>
              Playing Style (Optional)
            </Text>
            <View style={styles.styleOptions}>
              {renderPlayingStyleOption('aggressive', 'Aggressive', 'flame-outline')}
              {renderPlayingStyleOption('defensive', 'Defensive', 'shield-outline')}
              {renderPlayingStyleOption('all_court', 'All Court', 'tennisball-outline')}
              {renderPlayingStyleOption('serve_volley', 'Serve & Volley', 'arrow-up-outline')}
            </View>
            {playingStyle && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setPlayingStyle('')}
              >
                <Text style={[styles.clearButtonText, { color: colors.tabIconDefault }]}>
                  Clear Selection
                </Text>
              </TouchableOpacity>
            )}

            {/* Privacy Settings */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>
              Privacy & Visibility
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.tabIconDefault }]}>
              Control who can see your information and contact you
            </Text>

            {/* Profile Visibility */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 16, marginBottom: 12 }]}>
              Profile Visibility
            </Text>
            <View style={styles.privacyOptions}>
              {renderPrivacyOption(
                'public',
                'Public',
                'Anyone can see your profile and stats',
                profileVisibility,
                setProfileVisibility
              )}
              {renderPrivacyOption(
                'clubs_only',
                'Club Members Only',
                'Only members of your clubs can see your profile',
                profileVisibility,
                setProfileVisibility
              )}
              {renderPrivacyOption(
                'private',
                'Private',
                'Only you can see your full profile',
                profileVisibility,
                setProfileVisibility
              )}
            </View>

            {/* Match History Visibility */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 20, marginBottom: 12 }]}>
              Match History Visibility
            </Text>
            <View style={styles.privacyOptions}>
              {renderPrivacyOption(
                'public',
                'Public',
                'Anyone can see your match history',
                matchHistoryVisibility,
                setMatchHistoryVisibility
              )}
              {renderPrivacyOption(
                'clubs_only',
                'Club Members Only',
                'Only club members can see your match history',
                matchHistoryVisibility,
                setMatchHistoryVisibility
              )}
              {renderPrivacyOption(
                'private',
                'Private',
                'Match history is completely private',
                matchHistoryVisibility,
                setMatchHistoryVisibility
              )}
            </View>

            {/* Challenge Settings */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 20, marginBottom: 12 }]}>
              Who Can Challenge You
            </Text>
            <View style={styles.privacyOptions}>
              {renderPrivacyOption(
                'everyone',
                'Everyone',
                'Any player can send you match challenges',
                allowChallenges,
                setAllowChallenges
              )}
              {renderPrivacyOption(
                'club_members',
                'Club Members Only',
                'Only members of your clubs can challenge you',
                allowChallenges,
                setAllowChallenges
              )}
              {renderPrivacyOption(
                'none',
                'No One',
                'Disable challenge requests completely',
                allowChallenges,
                setAllowChallenges
              )}
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.tabIconDefault }]}
              onPress={onBack}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60, // Same width as back button for centering
  },
  formSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    fontSize: 13,
    marginTop: 6,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  readOnlyText: {
    fontSize: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  preferenceOptions: {
    gap: 12,
  },
  preferenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  preferenceLabel: {
    fontSize: 16,
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
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  skillContent: {
    flex: 1,
  },
  skillLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  skillDescription: {
    fontSize: 13,
  },
  styleOptions: {
    gap: 8,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  styleLabel: {
    fontSize: 16,
    flex: 1,
  },
  privacyOptions: {
    gap: 8,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 13,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Photo upload styles
  photoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  photoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photoHelper: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 18,
  },
  
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});